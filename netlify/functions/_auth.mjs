import crypto from 'node:crypto';
import { getStore } from '@netlify/blobs';

export const STORE_NAME = 'zahlfix-auth';
export const CONFIG_KEY = 'config';
export const SESSION_COOKIE = '__Host-zf_session';
export const SESSION_HOURS = 12;
export const PIN_LENGTH = 4;
export const DEFAULT_INITIAL_PIN = '6367';
export { ATTEMPT_WINDOW_MS, LOCK_MS, MAX_FAILURES } from './_rate.mjs';

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

export function timingEqual(a, b) {
  const aa = Buffer.from(String(a ?? ''));
  const bb = Buffer.from(String(b ?? ''));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

export function hmac(data, secret) {
  return crypto.createHmac('sha256', secret).update(data).digest('base64url');
}

export function createSession(config) {
  const exp = Date.now() + SESSION_HOURS * 3600 * 1000;
  const nonce = randomToken(18);
  // passwordVersion is retained in schema 3 for deployment compatibility. It is the PIN credential version.
  const payload = `${exp}.${config.passwordVersion}.${nonce}`;
  return `${payload}.${hmac(payload, config.sessionSecret)}`;
}

export function sessionCookie(value, maxAge = null) {
  const bits = [`${SESSION_COOKIE}=${encodeURIComponent(value)}`, 'Path=/', 'SameSite=Strict', 'HttpOnly', 'Secure'];
  if (maxAge !== null) bits.push(`Max-Age=${maxAge}`);
  return bits.join('; ');
}

export function baseSecurityHeaders(publicPage = false) {
  const csp = publicPage
    ? "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'"
    : "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https://images.pexels.com; connect-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self' mailto:";
  return {
    'Content-Security-Policy': csp,
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cache-Control': 'private, no-store, max-age=0',
    'Pragma': 'no-cache'
  };
}

export function htmlResponse(html, status = 200, extraHeaders = {}) {
  return new Response(html, {
    status,
    headers: {
      ...baseSecurityHeaders(true),
      'Content-Type': 'text/html; charset=utf-8',
      ...extraHeaders
    }
  });
}

export function redirect(location, status = 303, extraHeaders = {}) {
  return new Response(null, {
    status,
    headers: { Location: location, 'Cache-Control': 'no-store', ...extraHeaders }
  });
}

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

export function safeNext(raw) {
  const s = String(raw || '/');
  if(!s.startsWith('/') || s.startsWith('//') || /[\\\u0000-\u0020\u007f]/.test(s) || /%(?:0[ad]|5c)/i.test(s)) return '/';
  try {
    const parsed = new URL(s, 'https://zahlfix.invalid');
    return parsed.origin === 'https://zahlfix.invalid' ? parsed.pathname + parsed.search + parsed.hash : '/';
  } catch {
    return '/';
  }
}

export async function readConfig() {
  const store = getStore({ name: STORE_NAME, consistency: 'strong' });
  const text = await store.get(CONFIG_KEY);
  if (!text) return null;
  try {
    const c = JSON.parse(text);
    if (!c || c.schema !== 3 || !c.password || !c.sessionSecret || !c.passwordVersion) return null;
    return c;
  } catch {
    return null;
  }
}

export function pinPolicyValid(pin) {
  return typeof pin === 'string' && /^[0-9]{4}$/.test(pin);
}

// Compatibility alias for older tests/tools. All new authentication entry points are PIN-only.
export const fourDigitPinValid = pinPolicyValid;

export function buildConfig(pin) {
  if (!pinPolicyValid(pin)) throw new Error('PIN must be exactly four numeric digits.');
  const params = { N: 32768, r: 8, p: 1, keylen: 64 };
  const salt = crypto.randomBytes(24);
  const derived = crypto.scryptSync(pin, salt, params.keylen, {
    N: params.N, r: params.r, p: params.p, maxmem: 256 * 1024 * 1024
  });
  return {
    schema: 3,
    appVersion: '6.16.0-r6.0',
    authMode: 'pin4',
    createdAt: new Date().toISOString(),
    passwordVersion: randomToken(12),
    // The field name remains `password` for schema-3 storage compatibility; it contains only a salted scrypt hash.
    password: {
      algorithm: 'scrypt', ...params,
      salt: salt.toString('base64url'),
      hash: derived.toString('base64url')
    },
    sessionSecret: randomToken(48)
  };
}

export async function createConfig(pin = DEFAULT_INITIAL_PIN) {
  const config = buildConfig(pin);
  const store = getStore({ name: STORE_NAME, consistency: 'strong' });
  const result = await store.set(CONFIG_KEY, JSON.stringify(config), { onlyIfNew: true });
  if (!result.modified) throw new Error('Already configured');
  return config;
}

export function verifyPin(pin, config) {
  if (!config || !pinPolicyValid(pin)) return false;
  const p = config.password;
  if (!p || p.algorithm !== 'scrypt') return false;
  try {
    const actual = crypto.scryptSync(pin, Buffer.from(p.salt, 'base64url'), Number(p.keylen), {
      N: Number(p.N), r: Number(p.r), p: Number(p.p), maxmem: 256 * 1024 * 1024
    });
    const expected = Buffer.from(p.hash, 'base64url');
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

// Compatibility alias for operator scripts that existed before the PIN-only release.
export const verifyPassword = verifyPin;

export async function reserveLoginAttempt(ip) {
  const { reserveAttempt } = await import('./_rate.mjs');
  return reserveAttempt(getStore({ name: STORE_NAME, consistency: 'strong' }), ip);
}

export async function finishLoginAttempt(ip, id, success) {
  const { completeAttempt } = await import('./_rate.mjs');
  return completeAttempt(getStore({ name: STORE_NAME, consistency: 'strong' }), ip, id, success);
}
