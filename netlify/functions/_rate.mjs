/**
 * Bounded compare-and-swap rate accounting for a four-digit PIN.
 * Reservation precedes verification so concurrent requests count while in flight.
 */
import crypto from 'node:crypto';
export const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
export const LOCK_MS = 15 * 60 * 1000;
export const MAX_FAILURES = 5;
export class RateStoreBusyError extends Error {}
const keyFor = ip => `rate/${crypto.createHash('sha256').update(String(ip || 'unknown')).digest('hex')}`;
function normalise(data, now) {
  const state = data && typeof data === 'object' ? data : {};
  let attempts = Array.isArray(state.attempts) ? state.attempts : [];
  if (!Array.isArray(state.attempts) && Array.isArray(state.failures)) {
    attempts = state.failures.map((at, i) => ({ id: `legacy-${i}-${at}`, at, state: 'failed' }));
  }
  attempts = attempts.filter(a => a && Number.isFinite(a.at) && a.at <= now && now - a.at < ATTEMPT_WINDOW_MS);
  return { attempts, lockedUntil: Number.isFinite(state.lockedUntil) && state.lockedUntil > now ? state.lockedUntil : 0 };
}
async function update(store, key, mutate, now) {
  for (let retry = 0; retry < 16; retry++) {
    const current = await store.getWithMetadata(key, { type: 'json', consistency: 'strong' });
    const state = normalise(current?.data, now());
    const result = mutate(state, now());
    if (!result.write) return result;
    const options = current ? { onlyIfMatch: current.etag } : { onlyIfNew: true };
    const written = await store.set(key, JSON.stringify(state), options);
    if (written.modified) return result;
    await new Promise(resolve => setTimeout(resolve, Math.min(50, 2 ** Math.min(retry, 5)) + crypto.randomInt(6)));
  }
  throw new RateStoreBusyError('Rate state is busy. Fail closed.');
}
export async function reserveAttempt(store, ip, now = Date.now) {
  const id = crypto.randomUUID();
  return update(store, keyFor(ip), (state, t) => {
    if (state.lockedUntil > t || state.attempts.length >= MAX_FAILURES) {
      const oldest = state.attempts.length ? Math.min(...state.attempts.map(a => a.at)) : t;
      return { write: false, allowed: false, retryAfter: Math.max(1, Math.ceil((Math.max(state.lockedUntil, oldest + ATTEMPT_WINDOW_MS) - t) / 1000)) };
    }
    state.attempts.push({ id, at: t, state: 'pending' });
    return { write: true, allowed: true, id };
  }, now);
}
export async function completeAttempt(store, ip, id, success, now = Date.now) {
  return update(store, keyFor(ip), (state, t) => {
    const own = state.attempts.find(a => a.id === id);
    if (!own) return { write: false };
    if (success) state.attempts = state.attempts.filter(a => a.id !== id);
    else {
      own.state = 'failed';
      if (state.attempts.filter(a => a.state === 'failed').length >= MAX_FAILURES) state.lockedUntil = t + LOCK_MS;
    }
    return { write: true, locked: state.lockedUntil > t };
  }, now);
}
