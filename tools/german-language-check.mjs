import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const files = [
  'public/index.html',
  'public/de/index.html',
  'public/impressum.html',
  'public/datenschutz.html',
  'public/agb.html',
  'public/assets/v6/main.js',
  // The login function now contains two language catalogs. German output is
  // validated by tests/unit/i18n.test.mjs rather than scanning its EN literals.
  'netlify/functions/setup.mjs'
];

const forbidden = [
  'fehlenden Visionen',
  'fehlender</span>',
  'Herausforderung-Formular',
  'Browser-Session-Cookie',
  'Remember me',
  'IT CONSULTING',
  'DIGITALISATION',
  'OPTIMISATION',
  'AI APPLICATIONS',
  'AI AGENTS',
  'IMPLEMENTATION SYSTEM',
  'BUILD MODE',
  'CUSTOM SOFTWARE',
  'INTELLIGENT LAYER',
  'AI WHERE VALUE IS REAL',
  'POST-LAUNCH / SYSTEM HEALTH',
  'ACTIVE SUPPORT',
  'FIRST SETUP',
  'SECURE ACCESS',
  'SERVER-SIDE ACCESS',
  'HTTPONLY SESSION',
  'angemessen geschützt'
];

let failures = 0;
const all = files.map(rel => [rel, fs.readFileSync(path.join(root, rel), 'utf8')]);
for (const term of forbidden) {
  const hits = all.filter(([, text]) => text.includes(term)).map(([rel]) => rel);
  if (hits.length) {
    console.error(`FAIL German QA: ${JSON.stringify(term)} remains in ${hits.join(', ')}`);
    failures++;
  } else {
    console.log(`PASS German QA: ${term}`);
  }
}

const index = all.find(([rel]) => rel === 'public/index.html')[1];
const required = [
  'Fortschritt scheitert',
  'selten an mangelnder',
  'Sondern für Ihr Unternehmen.',
  'GESCHÄFTLICHE E-MAIL-ADRESSE*',
  'KÜNSTLICHE INTELLIGENZ',
  'TECHNISCHER SUPPORT',
  'ZAHLFIX / UMSETZUNGSSYSTEM'
];
for (const term of required) {
  const ok = index.includes(term);
  console.log(ok ? `PASS required German copy: ${term}` : `FAIL required German copy: ${term}`);
  if (!ok) failures++;
}

if (failures) process.exit(1);
console.log('\nZahlFix German-language QA checks passed.');
