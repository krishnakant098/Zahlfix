import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MESSAGES, getMessage } from '../../public/assets/v6/i18n-content.js';
const read = path => readFileSync(path, 'utf8');
const template = read('public/index.html');
const pages = { en: read('public/en/index.html'), de: read('public/de/index.html') };
const originals = JSON.parse(read('docs/approved-narrative.de.json'));
const strip = html => html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
const transcript = page => [...(page.match(/class="story-transcript"[^>]*>([\s\S]*?)<\/ol>/)?.[1] || '').matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map(m => strip(m[1]));

test('P2 delivers 08–14 with distinct EN/DE story, retained in the complete P3 build', () => {
  assert.deepEqual(transcript(pages.de), originals, 'approved German narrative must remain intact');
  assert.deepEqual(transcript(pages.en).slice(0, 14), Array.from({length: 14}, (_, i) => MESSAGES.en[`scene.${String(i + 1).padStart(2, '0')}.transcript`]));
  assert.deepEqual(transcript(pages.en).slice(14), Array.from({length: 6}, (_, i) => MESSAGES.en[`scene.${String(i + 15).padStart(2, '0')}.transcript`]));
  for (let scene = 8; scene <= 14; scene++) {
    const k = `scene.${String(scene).padStart(2, '0')}`;
    assert.equal(typeof MESSAGES.de[`${k}.transcript`], 'string');
    assert.equal(typeof MESSAGES.en[`${k}.transcript`], 'string');
    assert.notEqual(MESSAGES.en[`${k}.transcript`], MESSAGES.de[`${k}.transcript`]);
  }
  assert(!pages.en.includes('>Wir automatisieren,<'));
  assert(!pages.en.includes('>die zu Ihrem Unternehmen passen.</'));
  assert(!pages.en.includes('>KÜNSTLICHE INTELLIGENZ</'));
});

test('Scene 08 EN/DE wordmark has correct DOM reading order on initial HTML without CSS', () => {
  const snippet = language => pages[language].match(/<span class="scene08-wordmark">([\s\S]*?)<\/span>/)?.[1];
  assert(snippet('en') && snippet('de'));
  assert(snippet('en').indexOf('scene.08.brand') < snippet('en').indexOf('scene.08.verb'));
  assert(snippet('de').indexOf('scene.08.verb') < snippet('de').indexOf('scene.08.brand'));
  assert.equal(strip(snippet('en')), 'ZahlFix steps in.');
  assert.equal(strip(snippet('de')), 'beginnt ZahlFix.');
  assert(pages.en.includes('This is where</span> <span class="scene08-wordmark">'));
  assert(pages.de.includes('Genau dort</span> <span class="scene08-wordmark">'));
});

test('P2 accounts for all ten card names, labels, cursors, aria labels and text fallback', () => {
  for (const [language, html] of Object.entries(pages)) {
    assert.equal((html.match(/data-service-select="/g) || []).length, 10);
    assert.equal((html.match(/data-i18n-aria-label="service\.\d\d\.name"/g) || []).length, 10);
    assert.equal((html.match(/data-i18n-cursor="service\.\d\d\.short"/g) || []).length, 10);
    for (let i = 1; i <= 10; i++) {
      const key = `service.${String(i).padStart(2, '0')}`;
      const label = MESSAGES[language][`${key}.name`];
      assert(html.includes(`data-i18n="${key}.name">${label.replaceAll('&','&amp;')}`), `${language} ${key} name painted`);
      assert(MESSAGES[language][`${key}.short`].length);
      assert(MESSAGES[language][`${key}.indexLabel`].length);
    }
    assert(html.includes(`data-i18n="services.staticTitle">${MESSAGES[language]['services.staticTitle']}`));
  }
});

test('P2 workflow is dynamic catalog data, not German constants that repaint after switching', () => {
  const main = read('public/assets/v6/main.js');
  for (let i = 1; i <= 4; i++) {
    for (const suffix of ['label','title','detail']) {
      const key = `workflow.state${i}.${suffix}`;
      assert(MESSAGES.en[key] && MESSAGES.de[key], key);
      assert.notEqual(MESSAGES.en[key], MESSAGES.de[key], key);
    }
  }
  assert(main.includes('localeText(key)'));
  assert(main.includes('node.dataset.i18n = key'));
  assert(main.includes('capabilityFocusName.dataset.i18n = serviceKey(activeIndex)'));
  assert(main.includes('implementationMode.dataset.i18n'));
  assert(!main.includes('const workflowStates ='));
  assert(!main.includes('const capabilityNames ='));
});

test('P2 software/AI diagrams and public ARIA names are localized without touching their SVG geometry', () => {
  for (const [language, html] of Object.entries(pages)) {
    for (let i = 1; i <= 6; i++) {
      for (const suffix of ['name','detail']) {
        const key = `implementation.module${i}.${suffix}`;
        assert(MESSAGES[language][key]);
        assert(html.includes(`data-i18n="${key}">`));
      }
    }
    for (const suffix of ['center','1','2','3','4','5','6']) {
      for (const property of ['name','detail']) {
        const key = `implementation.aiNode.${suffix}.${property}`;
        assert(html.includes(`data-i18n="${key}">`));
      }
    }
    assert(html.includes('data-i18n-aria-label="implementation.worldAria"'));
    assert(html.includes('data-i18n="implementation.mediaCaption"'));
    assert(html.includes('data-i18n="implementation.aiFlow"'));
    assert.equal((html.match(/class="architecture-module architecture-module--/g)||[]).length,6);
    assert.equal((html.match(/class="ai-node ai-node--/g)||[]).length,7);
    assert.equal((html.match(/data-scene="/g)||[]).length,7);
  }
});

test('P2 preserves shared structure and staging safety controls', () => {
  for (const page of Object.values(pages)) {
    assert(page.includes('name="robots" content="noindex,nofollow"') || page.includes('<meta name="robots" content="noindex,nofollow"'));
    assert(page.includes('id="entryBridge"'));
    assert(page.includes('id="challengeForm"'));
    assert(page.includes('id="world"'));
    assert(page.includes('/assets/v6/boot.js'));
    assert.equal((page.match(/data-lang-link="en"/g)||[]).length,2);
    assert.equal((page.match(/data-lang-link="de"/g)||[]).length,2);
    assert.equal((page.match(/id="scene-(?:zahlfix|services|workflow|automation|implementation|software|ai)"/g)||[]).length,7);
  }
  assert.equal(Object.keys(MESSAGES.en).length,Object.keys(MESSAGES.de).length);
  assert.equal(getMessage('en','implementation.mode.ai'),'AI');
  assert.equal(getMessage('de','implementation.mode.ai'),'KI');
});
