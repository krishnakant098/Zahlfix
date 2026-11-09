import { getStore } from '@netlify/blobs';

const STORE_NAME = 'zahlfix-auth';
const CONFIG_KEY = 'config';
const COOKIE = '__Host-zf_session';


function b64urlToBytes(input) {
  const s = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = s + '='.repeat((4 - (s.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}

function bytesToB64url(bytes) {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function cookieValue(req, name) {
  const raw = req.headers.get('cookie') || '';
  for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    if (part.slice(0, i).trim() === name) {try{return decodeURIComponent(part.slice(i + 1).trim());}catch{return '';}}
  }
  return '';
}

async function getConfig() {
  // Do not cache authorisation config across requests: explicit PIN rotation
  // must invalidate old tokens on the next request, including assets and legal pages.
  const store=getStore({name:STORE_NAME,consistency:'strong'});
  const raw=await store.get(CONFIG_KEY);
  if(!raw)return null;
  const config=JSON.parse(raw);
  if(config?.schema!==3 || !config.passwordVersion || !config.sessionSecret)throw new Error('Invalid auth configuration');
  return config;
}

async function hmac(data, secret) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return bytesToB64url(new Uint8Array(sig));
}

function timingSafeStringEqual(a, b) {
  if (a.length !== b.length) return false;
  let x = 0;
  for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return x === 0;
}

async function validSession(req, config) {
  if (!config) return false;
  const token = cookieValue(req, COOKIE);
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 4) return false;
  const [expRaw, passwordVersion, nonce, sig] = parts;
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp < Date.now() || passwordVersion !== config.passwordVersion || !nonce) return false;
  const expected = await hmac(`${expRaw}.${passwordVersion}.${nonce}`, config.sessionSecret);
  return timingSafeStringEqual(sig, expected);
}

function protectedHeaders(headers, contentType = '') {
  headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https://images.pexels.com; connect-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self' mailto:");
  headers.set('Referrer-Policy', 'no-referrer');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  if (contentType.includes('text/html')) {
    headers.set('Cache-Control', 'private, no-store, max-age=0');
    headers.set('Pragma', 'no-cache');
  } else {
    headers.set('Cache-Control', 'private, max-age=86400');
  }
}

export default async (req, context) => {
  const url = new URL(req.url);
  if (url.hostname === 'www.zahlfix.com') {
    url.hostname = 'zahlfix.com';
    url.protocol = 'https:';
    return Response.redirect(url, 301);
  }
  let config;
  try{config=await getConfig();}catch{return new Response('Zugang voruebergehend nicht verfuegbar.',{status:503,headers:{'Cache-Control':'no-store','Retry-After':'30'}});}
  if (!config) return Response.redirect(new URL('/setup', url), 302);
  if (!(await validSession(req, config))) {
    const next = url.pathname + url.search;
    const login = new URL('/login', url);
    login.searchParams.set('next', next);
    return Response.redirect(login, 302);
  }

  const response = await context.next();
  const headers = new Headers(response.headers);
  protectedHeaders(headers, response.headers.get('content-type') || '');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};

export const config = {
  path: '/*',
  excludedPath: ['/login', '/setup', '/logout', '/assets/login.css', '/assets/login-transition.js', '/assets/entry-orbit.css', '/assets/brand/zahlfix-ribbon-192.webp', '/assets/favicon.svg', '/assets/zahlfix-z-logo.png', '/assets/zahlfix-z-logo-128.png']
};
