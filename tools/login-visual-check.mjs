import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const login = fs.readFileSync(path.join(root, 'netlify/functions/login.mjs'), 'utf8');
const setup = fs.readFileSync(path.join(root, 'netlify/functions/setup.mjs'), 'utf8');
const css = fs.readFileSync(path.join(root, 'public/assets/login.css'), 'utf8');
const auth = fs.readFileSync(path.join(root, 'netlify/edge-functions/auth-gate.mjs'), 'utf8');
const request = fs.readFileSync(path.join(root, 'netlify/functions/_request.mjs'), 'utf8');

const checks = [
  [login.includes('zahlfix.com'), 'domain lockup is present'],
  [login.includes('PRIVATER ZUGANG'), 'German private-access label is present'],
  [login.includes('PIN EINGEBEN'), 'German PIN prompt is present'],
  [login.includes('SICHERER, SITZUNGSBASIERTER PIN-ZUGANG'), 'PIN security statement is present'],
  [login.includes('name="pin"'), 'PIN field name is present'],
  [login.includes('inputmode="numeric"') && login.includes('pattern="[0-9]{4}"'), 'numeric four-digit PIN metadata is present'],
  [login.includes('minlength="4"') && login.includes('maxlength="4"'), 'PIN length is constrained in the browser'],
  [login.includes('autocomplete="off"') && !login.includes('autocomplete="current-password"'), 'stale password autofill is not requested'],
  [login.includes('ZUGANG ANFRAGEN'), 'access-request contact path is present'],
  [login.includes('KONTAKT AUF LINKEDIN'), 'LinkedIn contact path is present'],
  [login.includes('ZAHLFIX_LINKEDIN_URL'), 'LinkedIn URL can be configured without code changes'],
  [login.includes('target="_blank"') && login.includes('noopener noreferrer'), 'external LinkedIn link is safely opened'],
  [login.includes('action="/login" method="post"'), 'login POST flow remains present'],
  [login.includes('/assets/login-transition.js'), 'local cinematic login handoff script is present'],
  [login.includes('entry-orbit-system__orbit--1') && login.includes('loginEntrySystem'), 'shared login-to-orbit transformation geometry is present'],
  [login.includes('login-pin-dots'), 'four-position PIN visualization is present'],
  [login.includes('name="next"'), 'safe destination field remains present'],
  [setup.includes('value="${DEFAULT_INITIAL_PIN}"') || setup.includes('DEFAULT_INITIAL_PIN'), 'setup uses the explicit initial PIN constant'],
  [request.includes("fetchSite === 'same-origin'") && request.includes('x-forwarded-host'), 'Netlify custom-domain same-origin handling is present'],
  [css.includes('.login-orbit--outer'), 'architectural orbit system is present'],
  [css.includes('.login-page.is-authenticated .login-entry-system') && fs.readFileSync(path.join(root, 'public/assets/entry-orbit.css'), 'utf8').includes('.entry-orbit-system.is-expanded'), 'accepted PIN expands the shared orbit geometry'],
  [fs.readFileSync(path.join(root, 'public/assets/login-transition.js'), 'utf8').includes('bridgeSnapshot') && fs.readFileSync(path.join(root, 'public/assets/v6/entry-boot.js'), 'utf8').includes('--entry-start-x'), 'pixel-measured login-to-home handoff positioning is present'],
  [css.includes('.login-field--pin'), 'PIN field optical treatment is styled'],
  [css.includes('@media(prefers-reduced-motion:reduce)'), 'reduced-motion treatment is present'],
  [auth.includes("'/assets/zahlfix-z-logo.png'"), 'logo remains available before authentication'],
  [auth.includes("'/assets/login-transition.js'"), 'cinematic login script remains available before authentication'],
  [!login.includes('INVITATION'), 'no unsupported invitation-code language']
];
let failures = 0;
for (const [ok, label] of checks) {
  console.log(ok ? `PASS ${label}` : `FAIL ${label}`);
  if (!ok) failures++;
}
if (failures) process.exit(1);
console.log('\nZahlFix PIN login visual checks passed.');
