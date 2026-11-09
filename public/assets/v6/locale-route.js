/* First-paint locale selection; only the homepage root redirects.
 * Explicit /en/ and /de/ URLs always win over saved/browser preferences. */
(() => {
  'use strict';
  const root = document.documentElement;
  const match = /^\/(en|de)\/(?:index\.html)?$/.exec(location.pathname);
  if (match) { root.dataset.lang = match[1]; return; }
  if (location.pathname !== '/' && location.pathname !== '/index.html') return;
  let saved = '';
  try { saved = localStorage.getItem('zahlfix-language') || ''; } catch { /* storage may be unavailable */ }
  const browserLanguages = navigator.languages?.length ? navigator.languages : [navigator.language || 'de'];
  // Browser language priority is ordered: en-US before de-DE means English.
  const firstSupported = browserLanguages.find(lang => /^(en|de)(?:-|$)/i.test(lang)) || 'de';
  const preferred = saved === 'en' || saved === 'de' ? saved : firstSupported.toLowerCase().startsWith('en') ? 'en' : 'de';
  location.replace(`/${preferred}/${location.search}${location.hash}`);
})();
