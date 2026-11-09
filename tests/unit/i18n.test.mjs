import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MESSAGES } from '../../public/assets/v6/i18n-content.js';
import login from '../../netlify/functions/login.mjs';
import { createConfig } from '../../netlify/functions/_auth.mjs';
import { MemoryStore } from './memory-store.mjs';
import { runInNewContext } from 'node:vm';
const read = name => readFileSync(name, 'utf8');
const template = read('public/index.html');
const english = read('public/en/index.html');
const german = read('public/de/index.html');
const approved = JSON.parse(read('docs/approved-narrative.de.json'));
const transcript = html => [...(html.match(/class="story-transcript"[^>]*>([\s\S]*?)<\/ol>/)?.[1] || '').matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map(m => m[1].replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim());

test('P1 has complete, symmetric EN/DE keys for every marked leaf and attribute', () => {
  const references = [...template.matchAll(/\bdata-i18n(?:-aria-label|-cursor)?="([^"]+)"/g)].map(m => m[1]);
  assert(references.length > 90, 'semantic copy + shell + accessible text are catalogued');
  assert.deepEqual(Object.keys(MESSAGES.de).sort(), Object.keys(MESSAGES.en).sort());
  for (const id of references) {
    assert.equal(typeof MESSAGES.de[id], 'string', `DE ${id}`);
    assert.equal(typeof MESSAGES.en[id], 'string', `EN ${id}`);
    assert(MESSAGES.de[id].length && MESSAGES.en[id].length);
  }
});

test('German narrative remains exactly the original twenty approved scenes', () => {
  assert.deepEqual(transcript(template), approved);
  assert.deepEqual(transcript(german), approved);
  assert.equal((german.match(/data-scene="/g) || []).length, 7);
});

test('English pages are actually pre-rendered, not flash-translated German', () => {
  assert(english.includes('<html lang="en">'));
  assert(german.includes('<html lang="de">'));
  assert(english.includes('A new era'));
  assert(english.includes('Manual handoffs.'));
  assert(english.includes('What&#39;s slowing') || english.includes("What's slowing"));
  assert(!english.includes('>Die nächste Generation</'));
  assert(!english.includes('>Was hält Ihr</'));
  assert.deepEqual(transcript(english).slice(0, 7), Array.from({ length: 7 }, (_, i) => MESSAGES.en[`scene.${String(i+1).padStart(2,'0')}.transcript`]));
  assert.deepEqual(transcript(english).slice(7, 14), Array.from({ length: 7 }, (_, i) => MESSAGES.en[`scene.${String(i + 8).padStart(2,'0')}.transcript`]), 'Phase 2 scenes have pre-rendered English text');
  assert.deepEqual(transcript(english).slice(14), Array.from({ length: 6 }, (_, i) => MESSAGES.en[`scene.${String(i + 15).padStart(2,'0')}.transcript`]), 'Phase 3 English scenes are pre-rendered');
});

test('Both static language routes keep all scene/animation DOM topology and are marked staging-only', () => {
  const common = [
    'id="entryBridge"', 'id="main-stage"', 'id="world"', 'id="menuOverlay"',
    'id="scene-opening"', 'id="scene-question"', 'id="scene-zahlfix"',
    'id="continueCue"', 'id="contact"'
  ];
  for (const html of [german, english]) {
    for (const marker of common) assert(html.includes(marker), marker);
    assert(html.includes('content="noindex,nofollow"'));
    assert.equal((html.match(/data-scene="/g)||[]).length,7);
    assert.equal((html.match(/data-service-select="/g)||[]).length,10);
    assert.equal((html.match(/data-lang-link="en"/g)||[]).length,2);
    assert.equal((html.match(/data-lang-link="de"/g)||[]).length,2);
    assert(html.includes('hreflang="en"') && html.includes('hreflang="de"'));
    assert(html.includes('/assets/v6/locale-route.js'));
  }
});

test('Editorial choices preserve scene meaning with independent English composition', () => {
  assert.notEqual(MESSAGES.en['scene.01.line1'], MESSAGES.de['scene.01.line1']);
  assert(!/Generation|Unternehmensentwicklung/.test(MESSAGES.en['scene.01.transcript']));
  assert(MESSAGES.en['scene.03.transcript'].includes('execution'));
  assert(MESSAGES.en['scene.07.transcript'].includes('business'));
  assert(MESSAGES.en['site.challengeCta'].length < 30);
});

test('Cinematic bridge SVG captions have dedicated bilingual content', () => {
  assert.equal(MESSAGES.de['scene.bridgeGuide'], 'BERATUNG × TECHNISCHE UMSETZUNG');
  assert.equal(MESSAGES.en['scene.bridgeGuide'], 'STRATEGY × TECHNICAL DELIVERY');
  const sceneSource = read('public/assets/v6/scene0609-visuals.js');
  assert(sceneSource.includes("getMessage(locale,'scene.bridgeGuide')"));
  assert(sceneSource.includes("addEventListener('zahlfix:locale-change',updateCaptions)"));
});

test('First visit follows browser language priority; explicit selection and routes prevail', () => {
  const script = read('public/assets/v6/locale-route.js');
  function select(pathname, languages, saved='') {
    let destination = null;
    const root = { dataset: {} };
    runInNewContext(script, {
      document: { documentElement: root },
      navigator: { languages, language: languages[0] || 'de-DE' },
      location: { pathname, search: '?view=cinema', hash: '#main-stage', replace: url => {destination = url;} },
      localStorage: { getItem: () => saved }
    });
    return { destination, root: root.dataset.lang };
  }
  assert.equal(select('/', ['en-US','de-DE']).destination,'/en/?view=cinema#main-stage');
  assert.equal(select('/', ['de-DE','en-US']).destination,'/de/?view=cinema#main-stage');
  assert.equal(select('/', ['de-DE'], 'en').destination,'/en/?view=cinema#main-stage');
  assert.deepEqual(select('/de/', ['en-US']),{destination:null,root:'de'});
  assert.deepEqual(select('/en/', ['de-DE']),{destination:null,root:'en'});
});

test('PIN page uses destination-language HTML and preserves authentication form/bridge', async () => {
  globalThis.__TEST_BLOB_STORE__ = new MemoryStore();
  await createConfig('6367');
  for (const [language, text] of [['en','ENTER YOUR PIN'], ['de','PIN EINGEBEN']]) {
    const res = await login(new Request(`https://fixture.invalid/login?next=%2F${language}%2F`), {ip:`p1-${language}`});
    assert.equal(res.status,200);
    const page = await res.text();
    assert(page.includes(`<html lang="${language}">`));
    assert(page.includes(text));
    assert(page.includes('id="loginEntrySystem"'));
    assert(page.includes('id="loginForm"'));
    assert(page.includes('maxlength="4"'));
    assert(page.includes(`name="next" value="/${language}/"`));
    assert(page.includes('class="login-language"'));
    assert(!/unsafe-inline/.test(res.headers.get('Content-Security-Policy') || ''));
  }
});

test('English PIN errors are not German and do not change the login rate/error semantics', async () => {
  globalThis.__TEST_BLOB_STORE__ = new MemoryStore();
  await createConfig('6367');
  const form = new URLSearchParams({pin:'0000',next:'/en/'});
  const res=await login(new Request('https://fixture.invalid/login?lang=en',{
    method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','Origin':'https://fixture.invalid'},body:form
  }), {ip:'p1-error'});
  assert.equal(res.status,401);
  const page=await res.text();
  assert(page.includes('That PIN is not correct.'));
  assert(page.includes('lang="en"'));
});
