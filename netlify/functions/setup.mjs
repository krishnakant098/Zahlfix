import { readForm, FormRequestError, requestOriginDiagnostic } from './_request.mjs';
import {
  readConfig, createConfig, createSession, sessionCookie, htmlResponse, redirect,
  timingEqual, esc, pinPolicyValid, DEFAULT_INITIAL_PIN
} from './_auth.mjs';

function page(state = '') {
  const msg = state === 'badkey' ? 'Der Netlify-Setup-Schlüssel ist nicht korrekt.'
    : state === 'mismatch' ? 'Die beiden PIN-Eingaben stimmen nicht überein.'
    : state === 'badpin' ? 'Bitte verwenden Sie genau vier Ziffern.'
    : state === 'exists' ? 'Die Website wurde bereits eingerichtet.'
    : state === 'nokey' ? 'ZAHLFIX_SETUP_KEY ist in Netlify noch nicht gesetzt.'
    : state === 'origin' ? 'Die Anfrage konnte nicht bestätigt werden. Bitte laden Sie die Seite neu.'
    : '';
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#121212"><title>ZahlFix — PIN einrichten</title><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/assets/login.css"></head><body><main class="gate"><section class="gate__card"><div class="gate__meta"><span>ZAHLFIX / ERSTEINRICHTUNG</span><span>NETLIFY</span></div><div class="gate__brand"><img src="/assets/zahlfix-z-logo.png" alt="" aria-hidden="true"><h1>ZAHLFIX<span>.</span></h1></div><p class="setup-note">Einmalige Einrichtung für die Produktionsumgebung. Geben Sie den geheimen Netlify-Setup-Schlüssel ein und legen Sie anschließend einen vierstelligen PIN fest. Der voreingestellte erste PIN ist <strong>${DEFAULT_INITIAL_PIN}</strong>.</p><form action="/setup" method="post"><div class="setup-key-row"><label for="setupKey">NETLIFY-SETUP-SCHLÜSSEL</label><input id="setupKey" name="setupKey" type="password" required maxlength="512" autocomplete="off"></div><div class="setup-grid"><div><label for="pin">VIERSTELLIGER PIN</label><input id="pin" name="pin" type="password" value="${DEFAULT_INITIAL_PIN}" required inputmode="numeric" pattern="[0-9]{4}" minlength="4" maxlength="4" autocomplete="off"></div><div><label for="confirm">PIN BESTÄTIGEN</label><input id="confirm" name="confirm" type="password" value="${DEFAULT_INITIAL_PIN}" required inputmode="numeric" pattern="[0-9]{4}" minlength="4" maxlength="4" autocomplete="off"></div></div><button class="setup-submit" type="submit">PIN SPEICHERN & WEBSITE ÖFFNEN ↗</button>${msg ? `<div class="gate__error" role="alert">${esc(msg)}</div>` : '<div class="setup-ok">Nach erfolgreicher Einrichtung ist diese Seite gesperrt.</div>'}</form><div class="gate__foot"><span>EINMALIGE EINRICHTUNG</span><span>SCRYPT + NETLIFY BLOBS</span></div></section></main></body></html>`;
}

export default async (req) => {
  const incomingUrl = new URL(req.url);
  if (incomingUrl.hostname === 'www.zahlfix.com') {
    incomingUrl.hostname = 'zahlfix.com';
    incomingUrl.protocol = 'https:';
    return redirect(incomingUrl.toString(), 301);
  }
  let existing;
  try { existing = await readConfig(); }
  catch { return htmlResponse('Zugang voruebergehend nicht verfuegbar.', 503, { 'Retry-After': '30' }); }
  if (existing) return redirect('/login', 302);
  const expectedKey = process.env.ZAHLFIX_SETUP_KEY || '';
  if (!expectedKey) return htmlResponse(page('nokey'), 503);

  if (req.method === 'GET') return htmlResponse(page());
  if (req.method !== 'POST') return new Response('Methode nicht erlaubt.', { status: 405 });

  let form;
  try { form = await readForm(req); }
  catch (error) {
    if (error instanceof FormRequestError && error.status === 403) {
      console.warn('Setup form origin rejected', requestOriginDiagnostic(req));
      return htmlResponse(page('origin'), 403);
    }
    return htmlResponse(page('badpin'), error instanceof FormRequestError ? error.status : 400);
  }
  const setupKey = form.get('setupKey') || '';
  const pin = String(form.get('pin') ?? form.get('password') ?? '');
  const confirm = String(form.get('confirm') ?? '');

  if (!timingEqual(setupKey, expectedKey)) return htmlResponse(page('badkey'), 403);
  if (!pinPolicyValid(pin)) return htmlResponse(page('badpin'), 400);
  if (pin !== confirm) return htmlResponse(page('mismatch'), 400);

  try {
    const config = await createConfig(pin);
    return redirect('/', 303, { 'Set-Cookie': sessionCookie(createSession(config)) });
  } catch (e) {
    if (String(e?.message || '').includes('Already configured')) return htmlResponse(page('exists'), 409);
    console.error('Setup failed:', e);
    return htmlResponse('Einrichtung fehlgeschlagen.', 500);
  }
};

export const config = {
  path: '/setup',
  rateLimit: {
    windowLimit: 10,
    windowSize: 60,
    aggregateBy: ['ip', 'domain']
  }
};
