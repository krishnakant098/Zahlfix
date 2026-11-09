import { readForm, FormRequestError, requestOriginDiagnostic } from './_request.mjs';
import {
  readConfig, verifyPin, createSession, sessionCookie, htmlResponse, redirect,
  safeNext, esc, reserveLoginAttempt, finishLoginAttempt, pinPolicyValid, baseSecurityHeaders
} from './_auth.mjs';

const INVALID_PIN_DELAY_MS = 650;

function safeLinkedInUrl(value = '') {
  const fallback = 'https://www.linkedin.com/search/results/companies/?keywords=ZahlFix';
  try {
    const url = new URL(value || fallback);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== 'https:' || (host !== 'linkedin.com' && host !== 'www.linkedin.com' && !host.endsWith('.linkedin.com'))) return fallback;
    return url.toString();
  } catch { return fallback; }
}

// The login is rendered server-side. Its locale follows the protected destination.
function requestedLocale(req, next = '/') {
  const url = new URL(req.url);
  const explicit = url.searchParams.get('lang');
  if (explicit === 'de' || explicit === 'en') return explicit;
  const destination = /^\/(en|de)(?:\/|$)/.exec(safeNext(next));
  if (destination) return destination[1];
  const first = (req.headers.get('accept-language') || '').split(',')[0].trim();
  return /^en(?:-|$)/i.test(first) ? 'en' : 'de';
}

function stateMessage(state = '', locale = 'de') {
  const m = locale === 'en' ? {
    bad: 'That PIN is not correct. Please try again.',
    locked: 'Too many attempts. Please try again in a few minutes.',
    origin: 'We could not verify the request. Reload the page and try again.',
    unavailable: 'Access is temporarily unavailable. Please try again.'
  } : {
    bad: 'Der PIN ist nicht korrekt. Bitte versuchen Sie es erneut.',
    locked: 'Zu viele Fehlversuche. Bitte in einigen Minuten erneut versuchen.',
    origin: 'Die Anfrage konnte nicht bestätigt werden. Bitte laden Sie die Seite neu und versuchen Sie es erneut.',
    unavailable: 'Der Zugang ist vorübergehend nicht verfügbar. Bitte versuchen Sie es erneut.'
  };
  return m[state] || '';
}

// Only editorial labels are translated. The PIN controls, form fields, orbit
// geometry and authentication code stay identical for both language experiences.
const LOGIN_ENGLISH = [
  ['ZahlFix — Privater Zugang', 'ZahlFix — Private Access'],
  ['PRIVATER ZUGANG', 'PRIVATE ACCESS'],
  ['PIN EINGEBEN', 'ENTER YOUR PIN'],
  ['Vierstelligen PIN eingeben', 'Enter four-digit PIN'],
  ['Zugang öffnen', 'Unlock access'],
  ['SICHERER, SITZUNGSBASIERTER PIN-ZUGANG', 'SECURE, SESSION-BASED PIN ACCESS'],
  ['Zugang%20zu%20zahlfix.com%20anfragen', 'Request%20access%20to%20zahlfix.com'],
  ['ZUGANG ANFRAGEN', 'REQUEST ACCESS'],
  ['ZahlFix auf LinkedIn kontaktieren', 'Contact ZahlFix on LinkedIn'],
  ['KONTAKT AUF LINKEDIN', 'CONNECT ON LINKEDIN'],
  ['Nachricht senden', 'Send a message'],
  ['SICHERER ZUGANG <i></i> PRIVATE SESSION', 'SECURE ACCESS <i></i> PRIVATE SESSION'],
  ['BERATUNG × TECHNOLOGIE × UMSETZUNG', 'STRATEGY × TECHNOLOGY × DELIVERY']
];

function enhancedRequest(req) {
  const accept = String(req.headers.get('accept') || '').toLowerCase();
  return req.method === 'POST' && (accept.includes('application/json') || req.headers.get('x-zahlfix-transition') === 'orbit-v1');
}

function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...baseSecurityHeaders(true),
      'Content-Type': 'application/json; charset=utf-8',
      ...extraHeaders
    }
  });
}

function failureResponse(req, next, state, status, extraHeaders = {}, locale = requestedLocale(req, next)) {
  const message = stateMessage(state, locale);
  if (enhancedRequest(req)) return jsonResponse({ ok: false, code: state || 'bad', message, next }, status, extraHeaders);
  return htmlResponse(page(next, state, locale), status, extraHeaders);
}

function page(next = '/', state = '', locale = 'de') {
  const msg = stateMessage(state, locale);
  const linkedinUrl = safeLinkedInUrl(process.env.ZAHLFIX_LINKEDIN_URL);
  let html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#050607"><meta name="color-scheme" content="dark"><meta name="robots" content="noindex,nofollow"><title>ZahlFix — Privater Zugang</title><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="preload" href="/assets/brand/zahlfix-ribbon-192.webp" as="image"><link rel="stylesheet" href="/assets/entry-orbit.css"><link rel="stylesheet" href="/assets/login.css"><script src="/assets/login-transition.js" defer></script></head><body class="login-page"><main class="login-stage" id="loginStage"><div class="login-stage__frame" aria-hidden="true"><i class="login-cross login-cross--tl"></i><i class="login-cross login-cross--tr"></i><i class="login-cross login-cross--bl"></i><i class="login-cross login-cross--br"></i><i class="login-axis login-axis--v"></i><i class="login-axis login-axis--h"></i><i class="login-orbit login-orbit--outer"></i><i class="login-orbit login-orbit--inner"></i><i class="login-side-tick login-side-tick--l"></i><i class="login-side-tick login-side-tick--r"></i><i class="login-corner-dot login-corner-dot--l"></i><i class="login-corner-dot login-corner-dot--r"></i></div><section class="login-access" aria-labelledby="login-title"><div class="login-mark" aria-hidden="true"><span></span><img src="/assets/zahlfix-z-logo.png" alt=""><span></span></div><h1 id="login-title">zahlfix.com</h1><p class="login-kicker">PRIVATER ZUGANG</p><div class="login-divider" aria-hidden="true"><span></span><i>◇</i><span></span></div><div class="login-instrument" id="loginInstrument"><div class="entry-orbit-system login-entry-system" id="loginEntrySystem" aria-hidden="true"><svg class="entry-orbit-system__svg" viewBox="0 0 720 520" preserveAspectRatio="xMidYMid meet" focusable="false"><defs><linearGradient id="entryOrbitMetal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5e4b29"/><stop offset=".34" stop-color="#d7b568"/><stop offset=".62" stop-color="#755b2f"/><stop offset="1" stop-color="#e3ca8a"/></linearGradient><linearGradient id="entryOrbitGlint" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffedb5" stop-opacity=".82"/><stop offset=".46" stop-color="#d1a84f" stop-opacity=".16"/><stop offset="1" stop-color="#f0d693" stop-opacity=".05"/></linearGradient><radialGradient id="entryNodeMetal" cx="32%" cy="27%" r="72%"><stop offset="0" stop-color="#fff0bd"/><stop offset=".25" stop-color="#d4a84b"/><stop offset=".66" stop-color="#62502e"/><stop offset="1" stop-color="#121815"/></radialGradient><radialGradient id="entryAtmosphere" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#c39438" stop-opacity=".09"/><stop offset=".56" stop-color="#6f5428" stop-opacity=".025"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient><filter id="entryNodeGlow" x="-400%" y="-400%" width="800%" height="800%"><feGaussianBlur stdDeviation="2.1" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><ellipse class="entry-orbit-system__atmosphere" cx="360" cy="260" rx="330" ry="245"/><g class="entry-orbit-system__plane"><circle class="entry-orbit-system__calibration" cx="360" cy="260" r="316" stroke-dasharray="2 13"/><g class="entry-orbit-system__orbit entry-orbit-system__orbit--1"><g transform="rotate(-6 360 260)"><ellipse cx="360" cy="260" rx="115" ry="82.8"/><ellipse class="entry-orbit-glint" cx="360" cy="260" rx="115" ry="82.8" stroke-dasharray="92 631" stroke-dashoffset="-34"/><circle class="entry-orbit-system__node" cx="432" cy="196" r="5.1"/></g></g><g class="entry-orbit-system__orbit entry-orbit-system__orbit--2"><g transform="rotate(-6 360 260)"><ellipse cx="360" cy="260" rx="207" ry="149"/><ellipse class="entry-orbit-glint" cx="360" cy="260" rx="207" ry="149" stroke-dasharray="130 1000" stroke-dashoffset="-96"/><circle class="entry-orbit-system__node" cx="224" cy="372" r="5.4"/></g></g><g class="entry-orbit-system__orbit entry-orbit-system__orbit--3"><g transform="rotate(-6 360 260)"><ellipse cx="360" cy="260" rx="300" ry="216"/><ellipse class="entry-orbit-glint" cx="360" cy="260" rx="300" ry="216" stroke-dasharray="180 1450" stroke-dashoffset="-40"/><circle class="entry-orbit-system__node" cx="568" cy="104" r="5.8"/></g></g></g></svg><div class="entry-orbit-system__core"><img src="/assets/brand/zahlfix-ribbon-192.webp" alt="" width="192" height="192"></div></div><form class="login-form" id="loginForm" action="/login" method="post" data-enhanced-login><input type="hidden" name="next" value="${esc(safeNext(next))}"><label for="pin">PIN EINGEBEN</label><div class="login-field login-field--pin"><div class="login-pin-dots" id="loginPinDots" aria-hidden="true"><i></i><i></i><i></i><i></i></div><input id="pin" name="pin" type="password" required autofocus autocomplete="off" inputmode="numeric" pattern="[0-9]{4}" minlength="4" maxlength="4" enterkeyhint="go" aria-label="Vierstelligen PIN eingeben" aria-describedby="login-security${msg ? ' login-error' : ''}"><button type="submit" aria-label="Zugang öffnen"><span aria-hidden="true">→</span></button></div><div id="login-error" class="login-error${msg ? ' is-visible' : ''}" role="alert" aria-live="assertive"><span></span><b>${esc(msg)}</b></div><div id="login-security" class="login-security"><span class="login-lock" aria-hidden="true"></span><span>SICHERER, SITZUNGSBASIERTER PIN-ZUGANG</span></div><p class="login-transition-status" id="loginTransitionStatus" aria-live="polite"></p></form></div><a class="login-request" href="mailto:info@zahlfix.com?subject=Zugang%20zu%20zahlfix.com%20anfragen"><span class="login-request__lock" aria-hidden="true"></span><span>ZUGANG ANFRAGEN</span></a><a class="login-contact" href="${esc(linkedinUrl)}" target="_blank" rel="noopener noreferrer" aria-label="ZahlFix auf LinkedIn kontaktieren"><span class="login-linkedin" aria-hidden="true">in</span><span class="login-contact__copy"><span class="login-contact__title">KONTAKT AUF LINKEDIN</span><span class="login-contact__sub">Nachricht senden <b aria-hidden="true">→</b></span></span></a></section><footer class="login-footer" aria-hidden="true"><span>BERLIN / DE</span><span>SICHERER ZUGANG <i></i> PRIVATE SESSION</span><span>BERATUNG × TECHNOLOGIE × UMSETZUNG</span></footer></main></body></html>`;
  if (locale === 'en') {
    html = html.replace('<html lang="de">', '<html lang="en">');
    for (const [german, english] of LOGIN_ENGLISH) {
      if (!html.includes(german)) throw new Error(`Login localization missing source: ${german}`);
      html = html.replace(german, english);
    }
    html = html.replace('action="/login"', 'action="/login?lang=en"');
  }
  const selector = `<nav class="login-language" aria-label="Language / Sprache"><a href="/login?next=%2Fen%2F" lang="en" hreflang="en" aria-label="English" ${locale === 'en' ? 'aria-current="true"' : ''}>EN</a><i aria-hidden="true"></i><a href="/login?next=%2Fde%2F" lang="de" hreflang="de" aria-label="Deutsch" ${locale === 'de' ? 'aria-current="true"' : ''}>DE</a></nav>`;
  html = html.replace('<main class="login-stage" id="loginStage">', '<main class="login-stage" id="loginStage">' + selector);
  return html;
}

export default async (req, context) => {
  const incomingUrl = new URL(req.url);
  if (incomingUrl.hostname === 'www.zahlfix.com') {
    incomingUrl.hostname = 'zahlfix.com';
    incomingUrl.protocol = 'https:';
    return redirect(incomingUrl.toString(), 301);
  }

  let config;
  try { config = await readConfig(); }
  catch { return failureResponse(req, '/', 'unavailable', 503, { 'Retry-After': '30' }); }
  if (!config) return enhancedRequest(req) ? jsonResponse({ ok: false, code: 'setup', message: 'ZahlFix ist noch nicht eingerichtet.', next: '/setup' }, 409) : redirect('/setup', 302);

  const url = new URL(req.url);
  if (req.method === 'GET') {
    const next = safeNext(url.searchParams.get('next') || '/');
    return htmlResponse(page(next, url.searchParams.get('e') || '', requestedLocale(req, next)));
  }
  if (req.method !== 'POST') return new Response('Methode nicht erlaubt.', { status: 405 });

  let form;
  try { form = await readForm(req); }
  catch (error) {
    if (error instanceof FormRequestError && error.status === 403) {
      console.warn('Login form origin rejected', requestOriginDiagnostic(req));
      return failureResponse(req, '/', 'origin', 403);
    }
    return failureResponse(req, '/', 'bad', error instanceof FormRequestError ? error.status : 400);
  }

  const ip = context.ip || 'unknown';
  // `password` is accepted only as a transitional field name; PIN validation is still exact-four-digits.
  const pin = String(form.get('pin') ?? form.get('password') ?? '');
  const next = safeNext(form.get('next') || '/');
  let reservation;
  try { reservation = await reserveLoginAttempt(ip); }
  catch { return failureResponse(req, next, 'unavailable', 503, { 'Retry-After': '30' }); }
  if (!reservation.allowed) return failureResponse(req, next, 'locked', 429, { 'Retry-After': String(reservation.retryAfter) });

  const valid = pinPolicyValid(pin) && verifyPin(pin, config);
  try { await finishLoginAttempt(ip, reservation.id, valid); }
  catch { return failureResponse(req, next, 'unavailable', 503, { 'Retry-After': '30' }); }
  if (!valid) {
    await new Promise(resolve => setTimeout(resolve, INVALID_PIN_DELAY_MS));
    return failureResponse(req, next, 'bad', 401);
  }

  const cookie = sessionCookie(createSession(config));
  if (enhancedRequest(req)) {
    return jsonResponse({ ok: true, next, entry: 'authenticated-orbit' }, 200, { 'Set-Cookie': cookie });
  }
  return redirect(next, 303, { 'Set-Cookie': cookie });
};

export const config = {
  path: '/login',
  rateLimit: {
    windowLimit: 15,
    windowSize: 60,
    aggregateBy: ['ip', 'domain']
  }
};
