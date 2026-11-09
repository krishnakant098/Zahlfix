import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const must = [
  'public/index.html',
  'public/assets/v6/style.css',
  'public/assets/v6/main.js',
  'public/assets/v6/webgl-world.js',
  'public/assets/login.css',
  'public/assets/login-transition.js',
  'public/assets/entry-orbit.css',
  'public/assets/v6/entry-boot.js',
  'public/impressum.html',
  'public/datenschutz.html',
  'public/agb.html',
  'netlify/edge-functions/auth-gate.mjs',
  'netlify/functions/login.mjs',
  'netlify/functions/setup.mjs',
  'netlify/functions/logout.mjs',
  'netlify/functions/_auth.mjs',
  'netlify.toml'
];
let failures = 0;
for (const rel of must) {
  const ok = fs.existsSync(path.join(root, rel));
  console.log(ok ? `PASS ${rel}` : `FAIL ${rel}`);
  if (!ok) failures++;
}

const html = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');
const localRefs = [...html.matchAll(/(?:src|href)="(\/[^"?#]+)["?#]/g), ...html.matchAll(/(?:src|href)="(\/[^"?#]+)"/g)].map(m => m[1]);
for (const ref of new Set(localRefs)) {
  if (ref === '/') continue;
  const target = path.join(root, 'public', ref.replace(/^\//, ''));
  const ok = fs.existsSync(target);
  console.log(ok ? `PASS local asset ${ref}` : `FAIL local asset ${ref}`);
  if (!ok) failures++;
}

const auth = fs.readFileSync(path.join(root, 'netlify/edge-functions/auth-gate.mjs'), 'utf8');
const helper = fs.readFileSync(path.join(root, 'netlify/functions/_auth.mjs'), 'utf8');
const setup = fs.readFileSync(path.join(root, 'netlify/functions/setup.mjs'), 'utf8');
const checks = [
  [auth.includes("path: '/*'"), 'edge gate covers the site'],
  [auth.includes("'/assets/login.css'"), 'login stylesheet is public'],
  [auth.includes("'/assets/login-transition.js'"), 'login transition script is public'],
  [auth.includes("'/assets/entry-orbit.css'"), 'shared login/home orbit stylesheet is public'],
  [auth.includes("'/assets/brand/zahlfix-ribbon-192.webp'"), 'shared login ribbon nucleus is public'],
  [helper.includes("'__Host-zf_session'"), '__Host session cookie'],
  [helper.includes('scryptSync'), 'scrypt PIN hashing'],
  [helper.includes("getStore({ name: STORE_NAME, consistency: 'strong' })"), 'persistent Netlify Blobs config'],
  [setup.includes('ZAHLFIX_SETUP_KEY'), 'one-time setup key requirement'],
  [!helper.includes('Max-Age=43200'), 'normal session is not a persistent 12h cookie']
];
for (const [ok, label] of checks) {
  console.log(ok ? `PASS ${label}` : `FAIL ${label}`);
  if (!ok) failures++;
}
if (failures) {
  console.error(`\n${failures} predeploy check(s) failed.`);
  process.exit(1);
}
console.log('\nZahlFix Netlify predeploy checks passed.');
