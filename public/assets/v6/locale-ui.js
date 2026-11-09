import { getMessage } from './i18n-content.js';

export const activeLocale = () => document.documentElement.lang === 'en' ? 'en' : 'de';
const paths = { en: '/en/', de: '/de/' };

function paint(locale) {
  const root = document.documentElement;
  root.lang = locale;
  root.dataset.lang = locale;
  document.title = getMessage(locale, 'site.title');
  document.querySelector('meta[name="description"]')?.setAttribute('content', getMessage(locale, 'site.description'));
  document.querySelector('link[rel="canonical"]')?.setAttribute('href', `https://zahlfix.com/${locale}/`);
  document.querySelectorAll('[data-i18n]').forEach(node => {
    const value = getMessage(locale, node.dataset.i18n);
    if (value !== null) node.textContent = value;
  });
  for (const attr of ['aria-label', 'placeholder', 'title', 'cursor']) {
    const data = 'i18n' + attr.split('-').map(bit => bit[0].toUpperCase() + bit.slice(1)).join('');
    document.querySelectorAll(`[data-i18n-${attr}]`).forEach(node => {
      const value = getMessage(locale, node.dataset[data]);
      if (value !== null) node.setAttribute(attr === 'cursor' ? 'data-cursor' : attr, value);
    });
  }
  // Order the actual words as spoken, not just with CSS flex-order. Preserve
  // the wordmark element nodes and scene identity for scroll animation hooks.
  const wordmark = document.querySelector('.scene08-wordmark');
  if (wordmark) {
    const verb = wordmark.querySelector('[data-i18n="scene.08.verb"]');
    const brand = wordmark.querySelector('[data-i18n="scene.08.brand"]');
    if (verb && brand) wordmark.replaceChildren(
      ...(locale === 'en' ? [brand, document.createTextNode(' '), verb] : [verb, document.createTextNode(' '), brand])
    );
  }
  document.querySelectorAll('[data-lang-link]').forEach(link => {
    const lang = link.dataset.langLink;
    const current = lang === locale;
    link.href = `${paths[lang]}${location.search}${location.hash}`;
    link.setAttribute('aria-current', current ? 'true' : 'false');
    link.classList.toggle('is-active', current);
    link.setAttribute('aria-label', lang === 'de' ? 'Deutsch' : 'English');
    link.setAttribute('title', lang === 'de' ? 'Auf Deutsch anzeigen' : 'View in English');
  });
  document.querySelectorAll('[data-legal-page]').forEach(link => {
    const page = link.dataset.legalPage;
    if (['impressum.html','datenschutz.html','agb.html'].includes(page)) link.href = `/${locale}/${page}`;
  });
  document.querySelectorAll('[data-localized-view]').forEach(link => {
    link.setAttribute('href', `?view=${link.dataset.localizedView}`);
  });
  document.dispatchEvent(new CustomEvent('zahlfix:locale-change', { detail: { locale } }));
}

/** Recompose text nodes without touching any stable scene DOM element or scene timeline. */
export function initLocaleSwitcher() {
  const root = document.documentElement;
  const initial = /^\/(en|de)\//.exec(location.pathname)?.[1] || root.dataset.lang || root.lang || 'de';
  paint(initial);
  const change = (locale, { history = true, remember = true } = {}) => {
    if (locale !== 'en' && locale !== 'de') return;
    if (remember) try { localStorage.setItem('zahlfix-language', locale); } catch { /* optional */ }
    if (history && location.pathname !== paths[locale])
      window.history.pushState({ lang: locale }, '', `${paths[locale]}${location.search}${location.hash}`);
    paint(locale);
  };
  document.querySelectorAll('[data-lang-link]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      change(link.dataset.langLink);
    });
  });
  window.addEventListener('popstate', () => {
    const target = /^\/(en|de)\//.exec(location.pathname)?.[1];
    if (target) change(target, { history: false, remember: false });
  });
  window.__ZAHLFIX_I18N__ = Object.freeze({ get locale() { return activeLocale(); }, t: key => getMessage(activeLocale(), key), change });
  return window.__ZAHLFIX_I18N__;
}
