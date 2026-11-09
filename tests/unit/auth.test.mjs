import test from 'node:test';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { MemoryStore } from './memory-store.mjs';
import {
  buildConfig, createConfig, verifyPin, pinPolicyValid, createSession, sessionCookie,
  safeNext, CONFIG_KEY, DEFAULT_INITIAL_PIN, baseSecurityHeaders
} from '../../netlify/functions/_auth.mjs';
import { reserveAttempt, completeAttempt, ATTEMPT_WINDOW_MS, LOCK_MS, MAX_FAILURES } from '../../netlify/functions/_rate.mjs';
import { readForm, requestOriginAllowed } from '../../netlify/functions/_request.mjs';
import login from '../../netlify/functions/login.mjs';
import setup from '../../netlify/functions/setup.mjs';
import gate from '../../netlify/edge-functions/auth-gate.mjs';

const pin = '6367';
function newStore() { return globalThis.__TEST_BLOB_STORE__ = new MemoryStore(); }
function post(path, data, headers = {}, base = 'https://test.example') {
  return new Request(base + path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Origin': 'https://test.example',
      'Sec-Fetch-Site': 'same-origin',
      ...headers
    },
    body: new URLSearchParams(data)
  });
}

test('PIN policy is exactly four numeric digits and default is 6367', () => {
  assert.equal(DEFAULT_INITIAL_PIN, '6367');
  for (const good of ['6367', '0007', '9999']) assert(pinPolicyValid(good));
  for (const bad of ['123', '12345', '12a4', ' 6367', '6367 ', '']) assert(!pinPolicyValid(bad));
  const c = buildConfig(pin);
  assert(verifyPin(pin, c));
  assert(!verifyPin('6368', c));
  assert.throws(() => buildConfig('A long private passphrase'), /four numeric digits/);
  assert.notEqual(buildConfig(pin).sessionSecret, c.sessionSecret);
});

test('first config defaults to 6367 and is atomic', async () => {
  const store = newStore();
  const first = await createConfig();
  assert(verifyPin('6367', first));
  await assert.rejects(createConfig('4821'), /Already configured/);
  assert.equal(JSON.parse(await store.get(CONFIG_KEY)).passwordVersion, first.passwordVersion);
});

test('rate limiter permits only five in-window failures and locks for fifteen minutes', async () => {
  const store = new MemoryStore();
  let now = 1000000;
  const reservations = await Promise.all(Array.from({ length: 24 }, () => reserveAttempt(store, 'test-ip', () => now)));
  assert.equal(MAX_FAILURES, 5);
  assert.equal(LOCK_MS, 15 * 60 * 1000);
  assert.equal(reservations.filter(r => r.allowed).length, 5);
  await Promise.all(reservations.filter(r => r.allowed).map(r => completeAttempt(store, 'test-ip', r.id, false, () => now)));
  assert(!(await reserveAttempt(store, 'test-ip', () => now)).allowed);
  now += ATTEMPT_WINDOW_MS + 1;
  assert((await reserveAttempt(store, 'test-ip', () => now)).allowed);
});

test('successful attempt does not clear another concurrent failure', async () => {
  const store = new MemoryStore();
  const a = await reserveAttempt(store, 'x'), b = await reserveAttempt(store, 'x');
  await Promise.all([completeAttempt(store, 'x', a.id, true), completeAttempt(store, 'x', b.id, false)]);
  const state = JSON.parse([...store.data.values()][0].value);
  assert.equal(state.attempts.length, 1);
  assert.equal(state.attempts[0].state, 'failed');
});

test('session cookie is browser-scoped and redirects stay same-origin', () => {
  const cookie = sessionCookie('test');
  assert(cookie.includes('Secure'));
  assert(cookie.includes('HttpOnly'));
  assert(cookie.includes('SameSite=Strict'));
  assert(!cookie.includes('Max-Age'));
  for (const bad of ['https://other.test', '//other.test', '/\\other.test', '/\nother.test', '/%0d%0aLocation:bad']) assert.equal(safeNext(bad), '/');
  assert.equal(safeNext('/impressum.html?x=1'), '/impressum.html?x=1');
});

test('request guard accepts Netlify custom-domain same-origin forms and rejects cross-site forms', async () => {
  const netlifyInternal = post('/login', { pin }, {
    Origin: 'https://zahlfix.com',
    'Sec-Fetch-Site': 'same-origin',
    'X-Forwarded-Host': 'zahlfix.com',
    'X-Forwarded-Proto': 'https'
  }, 'https://zahlfix-internal.netlify.app');
  assert(requestOriginAllowed(netlifyInternal));
  assert.equal((await readForm(netlifyInternal)).get('pin'), pin);

  const sameOriginSignalWithoutForwardedHost = post('/login', { pin }, {
    Origin: 'https://zahlfix.com',
    'Sec-Fetch-Site': 'same-origin'
  }, 'https://zahlfix-internal.netlify.app');
  assert(requestOriginAllowed(sameOriginSignalWithoutForwardedHost));

  const chromeNullOrigin = post('/login', { pin }, {
    Origin: 'null',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Dest': 'document',
    'X-Forwarded-Host': 'zahlfix.com',
    'X-Forwarded-Proto': 'https'
  }, 'https://zahlfix-internal.netlify.app');
  assert(requestOriginAllowed(chromeNullOrigin));
  assert.equal((await readForm(chromeNullOrigin)).get('pin'), pin);

  const nullOriginEnhancedFetch = post('/login', { pin }, {
    Origin: 'null',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Dest': 'empty',
    'X-ZahlFix-Transition': 'orbit-v1'
  });
  assert(requestOriginAllowed(nullOriginEnhancedFetch));

  const nullOriginWrongMode = post('/login', { pin }, {
    Origin: 'null',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Dest': 'empty'
  });
  assert(!requestOriginAllowed(nullOriginWrongMode));

  const nullOriginSameSite = post('/login', { pin }, {
    Origin: 'null',
    'Sec-Fetch-Site': 'same-site',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Dest': 'document'
  });
  assert(!requestOriginAllowed(nullOriginSameSite));

  const crossSite = post('/login', { pin }, {
    Origin: 'https://evil.test',
    'Sec-Fetch-Site': 'cross-site'
  });
  await assert.rejects(readForm(crossSite), e => e.status === 403);
  await assert.rejects(readForm(post('/login', {}, { 'Content-Type': 'application/json' })), e => e.status === 415);
  await assert.rejects(readForm(post('/login', { pin: '1'.repeat(17000) })), e => e.status === 413);
});

test('login page is PIN-only and browser-like form submission succeeds', async () => {
  const store = newStore();
  await store.set(CONFIG_KEY, JSON.stringify(buildConfig(pin)));
  const pageResponse = await login(new Request('https://test.example/login'), { ip: 'page' });
  const html = await pageResponse.text();
  assert(html.includes('PIN EINGEBEN'));
  assert(html.includes('name="pin"'));
  assert(html.includes('inputmode="numeric"'));
  assert(html.includes('pattern="[0-9]{4}"'));
  assert(html.includes('maxlength="4"'));
  assert(!html.includes('autocomplete="current-password"'));
  assert(html.includes('/assets/login-transition.js'));
  assert(html.includes('entry-orbit-system__orbit--1'));
  assert(html.includes('loginEntrySystem'));
  assert(html.includes('/assets/entry-orbit.css'));
  assert(html.includes('login-pin-dots'));

  const wrong = await login(post('/login', { pin: '0000' }), { ip: 'wrong-pin' });
  assert.equal(wrong.status, 401);
  const malformed = await login(post('/login', { pin: 'abcd' }), { ip: 'malformed-pin' });
  assert.equal(malformed.status, 401);

  const browserLike = post('/login', { pin, next: '/impressum.html' }, {
    Origin: 'https://zahlfix.com',
    'Sec-Fetch-Site': 'same-origin',
    'X-Forwarded-Host': 'zahlfix.com'
  }, 'https://internal.netlify.app');
  const ok = await login(browserLike, { ip: 'browser-like' });
  assert.equal(ok.status, 303);
  assert.equal(ok.headers.get('location'), '/impressum.html');
  assert(ok.headers.get('set-cookie').includes('__Host-zf_session'));

  // Exact Chrome 152 form-navigation shape captured on zahlfix.com in production:
  // Origin is the literal string `null`, while Fetch Metadata proves same-origin top-level navigation.
  const chromeCaptured = post('/login', { pin, next: '/' }, {
    Origin: 'null',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Dest': 'document',
    'X-Forwarded-Host': 'zahlfix.com',
    'X-Forwarded-Proto': 'https'
  }, 'https://internal.netlify.app');
  const chromeOk = await login(chromeCaptured, { ip: 'chrome-null-origin' });
  assert.equal(chromeOk.status, 303);
  assert.equal(chromeOk.headers.get('location'), '/');
  assert(chromeOk.headers.get('set-cookie').includes('__Host-zf_session'));

  const enhanced = post('/login', { pin, next: '/' }, {
    Origin: 'null',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Dest': 'empty',
    'X-ZahlFix-Transition': 'orbit-v1',
    Accept: 'application/json',
    'X-Forwarded-Host': 'zahlfix.com'
  }, 'https://internal.netlify.app');
  const enhancedOk = await login(enhanced, { ip: 'enhanced-login' });
  assert.equal(enhancedOk.status, 200);
  assert.equal(enhancedOk.headers.get('content-type'), 'application/json; charset=utf-8');
  assert(enhancedOk.headers.get('set-cookie').includes('__Host-zf_session'));
  assert.deepEqual(await enhancedOk.json(), { ok: true, next: '/', entry: 'authenticated-orbit' });
});

test('public login CSP permits only self-hosted transition script and same-origin fetch', () => {
  const csp = baseSecurityHeaders(true)['Content-Security-Policy'];
  assert(csp.includes("script-src 'self'"));
  assert(csp.includes("connect-src 'self'"));
  assert(!csp.includes('unsafe-eval'));
  assert(!csp.includes('unsafe-inline'));
});

test('origin rejection is distinguishable from a wrong PIN', async () => {
  const store = newStore();
  await store.set(CONFIG_KEY, JSON.stringify(buildConfig(pin)));
  const rejected = await login(post('/login', { pin }, {
    Origin: 'https://evil.test',
    'Sec-Fetch-Site': 'cross-site'
  }), { ip: 'origin-test' });
  assert.equal(rejected.status, 403);
  const html = await rejected.text();
  assert(html.includes('Anfrage konnte nicht bestätigt'));
  assert(!html.includes('PIN ist nicht korrekt'));
});

test('setup is four-digit-PIN-only, defaults to 6367, and closes after configuration', async () => {
  newStore();
  process.env.ZAHLFIX_SETUP_KEY = 'local-test-key';
  const get = await setup(new Request('https://test.example/setup'));
  const html = await get.text();
  assert(html.includes('voreingestellte erste PIN'));
  assert(html.includes('value="6367"'));
  assert(html.includes('inputmode="numeric"'));

  const weak = await setup(post('/setup', { setupKey: 'local-test-key', pin: '123', confirm: '123' }));
  assert.equal(weak.status, 400);
  const letters = await setup(post('/setup', { setupKey: 'local-test-key', pin: '12a4', confirm: '12a4' }));
  assert.equal(letters.status, 400);
  const ok = await setup(post('/setup', { setupKey: 'local-test-key', pin, confirm: pin }));
  assert.equal(ok.status, 303);
  const closed = await setup(new Request('https://test.example/setup'));
  assert.equal(closed.status, 302);
  delete process.env.ZAHLFIX_SETUP_KEY;
});

test('edge gate validates sessions, protects legal pages, and revokes rotated PIN sessions', async () => {
  const store = newStore();
  const c = buildConfig(pin);
  await store.set(CONFIG_KEY, JSON.stringify(c));
  const anonymous = await gate(new Request('https://test.example/impressum.html'), {});
  assert.equal(anonymous.status, 302);
  const token = createSession(c), headers = { cookie: sessionCookie(token) };
  const ctx = { next: async () => new Response('private', { headers: { 'Content-Type': 'text/html' } }) };
  const accepted = await gate(new Request('https://test.example/impressum.html', { headers }), ctx);
  assert.equal(accepted.status, 200);
  assert(accepted.headers.get('Cache-Control').includes('no-store'));
  await store.set(CONFIG_KEY, JSON.stringify(buildConfig('4821')));
  const revoked = await gate(new Request('https://test.example/', { headers }), ctx);
  assert.equal(revoked.status, 302);
  const malformed = await gate(new Request('https://test.example/', { headers: { cookie: '__Host-zf_session=%zz' } }), ctx);
  assert.equal(malformed.status, 302);
});

test('storage outage fails closed', async () => {
  const store = newStore();
  store.fail = true;
  const response = await gate(new Request('https://test.example/'), {});
  assert.equal(response.status, 503);
});

test('edge rejects expired and tampered signed tokens', async () => {
  const store = newStore(), c = buildConfig(pin);
  await store.set(CONFIG_KEY, JSON.stringify(c));
  const payload = `${Date.now() - 1000}.${c.passwordVersion}.test-nonce`;
  const signature = crypto.createHmac('sha256', c.sessionSecret).update(payload).digest('base64url');
  for (const token of [`${payload}.${signature}`, createSession(c) + 'x']) {
    const result = await gate(new Request('https://test.example/', { headers: { cookie: sessionCookie(token) } }), {});
    assert.equal(result.status, 302);
  }
});
