(() => {
  'use strict';
  let entry = null;
  try {
    const raw = sessionStorage.getItem('zahlfix-entry-mode');
    if (raw) {
      const parsed = JSON.parse(raw);
      const fresh = Date.now() - Number(parsed?.at || 0) < 15000;
      if (fresh && (parsed?.mode === 'authenticated-orbit-v2' || parsed?.mode === 'authenticated-orbit')) entry = parsed;
    }
  } catch { entry = null; }
  if (!entry) return;

  const root = document.documentElement;
  const b = entry.bridge || {};
  const fallbackW = Math.min(720, Math.max(360, window.innerWidth * .72));
  const cx = Number.isFinite(Number(b.cx)) ? Number(b.cx) : window.innerWidth * .5;
  const cy = Number.isFinite(Number(b.cy)) ? Number(b.cy) : window.innerHeight * .52;
  const width = Number.isFinite(Number(b.width)) ? Number(b.width) : fallbackW;
  const core = Number.isFinite(Number(b.core)) ? Number(b.core) : Math.min(104, width * .145);
  root.style.setProperty('--entry-start-x', `${cx}px`);
  root.style.setProperty('--entry-start-y', `${cy}px`);
  root.style.setProperty('--entry-start-w', `${width}px`);
  root.style.setProperty('--entry-start-core', `${core}px`);
  root.classList.add('entry-auth-pending');
  window.__ZAHLFIX_ENTRY_BOOT__ = { authenticated: true, entry, start: { cx, cy, width, core } };
})();
