/**
 * Produces SEO-readable locale routes from one German-first, approved DOM template.
 * All marked scene/shell, capability, P2 and P3 visual/contact copy is translated: no HTML parsing that could
 * mutate the custom SVG, animation nodes, or numeric timeline identifiers.
 * Production indexing remains off until legal and Netlify deploy-preview sign-off.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { MESSAGES } from '../public/assets/v6/i18n-content.js';
const templatePath = path.resolve('public/index.html');
const template = await readFile(templatePath, 'utf8');
const keys = [...template.matchAll(/\bdata-i18n(?:-aria-label|-cursor|-placeholder)?="([^"]+)"/g)].map(match => match[1]);
const unique = [...new Set(keys)];
const german = Object.keys(MESSAGES.de).sort().join('|');
const english = Object.keys(MESSAGES.en).sort().join('|');
if (german !== english) throw new Error('EN/DE catalogs differ; complete both sides before build');
for (const key of unique) {
  if (!(key in MESSAGES.de)) throw new Error(`Untranslated key: ${key}`);
}
for (const key of Object.keys(MESSAGES.de)) {
  if (!unique.includes(key) && !['cursor.open', 'site.textReduced', 'site.title', 'site.description', 'scene.bridgeGuide'].includes(key) && !/^(workflow\.state[1-4]\.|implementation\.mode\.|form\.(?:status|mail)\.|principles\.core\.)/.test(key)) throw new Error(`Unused catalog key: ${key}`);
}
function escHTML(value) { return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;'); }
function render(lang) {
  let page = template.replace('<html lang="de">', `<html lang="${lang}">`);
  page = page.replace(/<title>[^<]+<\/title>/, `<title>${escHTML(MESSAGES[lang]['site.title'])}</title>`);
  page = page.replace(/(<meta content=")[^"]+(" name="description"\/>)/, `$1${escHTML(MESSAGES[lang]['site.description'])}$2`);
  page = page.replace('<link href="/assets/favicon.svg"', `<meta name="robots" content="noindex,nofollow"/>\n<link rel="alternate" hreflang="de" href="https://zahlfix.com/de/"/>\n<link rel="alternate" hreflang="en" href="https://zahlfix.com/en/"/>\n<link rel="canonical" href="https://zahlfix.com/${lang}/"/>\n<link href="/assets/favicon.svg"`);
  let painted = 0;
  page = page.replace(/(<([a-z][\w-]*)\b[^<>]*\bdata-i18n="([^"]+)"[^<>]*>)([^<>]*)(<\/\2>)/g, (full, open, tag, key, value, close) => {
    painted++;
    return open + escHTML(MESSAGES[lang][key]) + close;
  });
  const textCount = [...page.matchAll(/\bdata-i18n="/g)].length;
  if (painted !== textCount) throw new Error(`Some keys are not leaf text nodes: ${lang}, ${painted} / ${textCount}`);
  for (const [flag, attr] of [['aria-label', 'aria-label'], ['cursor', 'data-cursor'], ['placeholder', 'placeholder']]) {
    page = page.replace(new RegExp(`<([a-z][\\w-]*)\\b[^<>]*\\bdata-i18n-${flag}="[^"]+"[^<>]*>`, 'g'), open => {
      const key = new RegExp(`data-i18n-${flag}="([^"]+)"`).exec(open)?.[1];
      if (!key) throw new Error('Missing attr key');
      const replacement = `${attr}="${escHTML(MESSAGES[lang][key])}"`;
      if (new RegExp(`\\b${attr}="[^"]*"`).test(open)) return open.replace(new RegExp(`\\b${attr}="[^"]*"`), replacement);
      return open.replace(/>$/, ` ${replacement}>`);
    });
  }
  page = page.replace(/<a\b[^<>]*\bdata-legal-page="[^"]+"[^<>]*>/g, tag => {
    const name = /data-legal-page="([^"]+)"/.exec(tag)?.[1];
    if (!['impressum.html', 'datenschutz.html', 'agb.html'].includes(name)) throw new Error(`Unknown legal page: ${name}`);
    return tag.replace(/href="[^"]*"/, `href="/${lang}/${name}"`);
  });
  if (lang === 'en') {
    // The English brand reveal is "ZahlFix steps in", not German's "beginnt
    // ZahlFix". Reorder the source elements, not merely their CSS paint order,
    // so first paint, copied text and accessibility read in natural order.
    const wordmark = /(<span class="scene08-wordmark">)(<b\b[^>]*data-i18n="scene\.08\.verb"[^>]*>[^<]*<\/b>)(\s*)(<em\b[^>]*data-i18n="scene\.08\.brand"[^>]*>[^<]*<\/em>)(<\/span>)/;
    if (!wordmark.test(page)) throw new Error('Scene 08 wordmark sequence missing');
    page = page.replace(wordmark, '$1$4 $2$5');
  }
  return page;
}
for (const lang of ['de','en']) {
  const dest = path.resolve(`public/${lang}/index.html`);
  await mkdir(path.dirname(dest), {recursive: true});
  await writeFile(dest, render(lang));
  console.log(`${lang.toUpperCase()} route generated: public/${lang}/index.html`);
}

// Legal pages are generated from the reviewed German source and EN editorial adaptation.
await import('./build-legal-locales.mjs');
