(() => {
  'use strict';

  const body = document.body;
  const stage = document.getElementById('loginStage');
  const form = document.getElementById('loginForm');
  const input = document.getElementById('pin');
  const system = document.getElementById('loginEntrySystem');
  const dots = Array.from(document.querySelectorAll('#loginPinDots i'));
  const errorBox = document.getElementById('login-error');
  const errorText = errorBox?.querySelector('b');
  const status = document.getElementById('loginTransitionStatus');
  const submit = form?.querySelector('button[type="submit"]');
  const reduced = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  let submitting = false;
  const english = document.documentElement.lang === 'en';
  const loginText = english ? {
    invalid: 'We could not verify the PIN.',
    format: 'Enter exactly four digits.',
    checking: 'Checking your PIN.',
    accepted: 'Access confirmed.',
    locked: 'Too many attempts. Please try again in a few minutes.',
    origin: 'We could not verify the request. Reload the page and try again.',
    bad: 'That PIN is not correct. Please try again.'
  } : {
    invalid: 'Der PIN konnte nicht bestätigt werden.',
    format: 'Bitte geben Sie genau vier Ziffern ein.',
    checking: 'PIN wird bestätigt.',
    accepted: 'Zugang bestätigt.',
    locked: 'Zu viele Fehlversuche. Bitte in einigen Minuten erneut versuchen.',
    origin: 'Die Anfrage konnte nicht bestätigt werden. Bitte laden Sie die Seite neu und versuchen Sie es erneut.',
    bad: 'Der PIN ist nicht korrekt. Bitte versuchen Sie es erneut.'
  };

  if (!form || !input || !stage || !system) return;
  body.classList.add('login-js');

  function updateDots() {
    const n = input.value.length;
    dots.forEach((dot, i) => dot.classList.toggle('is-filled', i < n));
    stage.style.setProperty('--pin-fill', String(n / 4));
  }

  function clearError() {
    if (!errorBox) return;
    errorBox.classList.remove('is-visible');
    if (errorText) errorText.textContent = '';
  }

  function showError(message, code = 'bad') {
    body.classList.remove('is-authenticated', 'is-authenticating');
    system.classList.remove('is-expanded');
    body.classList.add('has-login-error');
    form.dataset.state = code;
    if (errorText) errorText.textContent = message || loginText.invalid;
    errorBox?.classList.add('is-visible');
    if (status) status.textContent = '';
    input.value = '';
    updateDots();
    submitting = false;
    form.removeAttribute('aria-busy');
    if (submit) submit.disabled = false;
    window.setTimeout(() => body.classList.remove('has-login-error'), 520);
    input.focus({ preventScroll: true });
  }

  function warmHomepage() {
    const assets = [
      ['/assets/entry-orbit.css', 'style'],
      ['/assets/v6/style.css', 'style'],
      ['/assets/v6/components.css', 'style'],
      ['/assets/v6/phase1.css', 'style'],
      ['/assets/v6/mobile-r4.css', 'style'],
      ['/assets/v6/entry-boot.js', 'script'],
      ['/assets/v6/boot.js', 'script'],
      ['/assets/v6/main.js', 'script'],
      ['/assets/brand/zahlfix-ribbon-192.webp', 'image']
    ];
    for (const [href, as] of assets) {
      if (document.head.querySelector(`link[data-zf-warm="${href}"]`)) continue;
      const link = document.createElement('link');
      link.rel = 'preload'; link.href = href; link.as = as; link.dataset.zfWarm = href;
      if (as === 'image') link.fetchPriority = 'high';
      document.head.appendChild(link);
    }
  }

  function nativeSubmit() { HTMLFormElement.prototype.submit.call(form); }

  function bridgeSnapshot(next) {
    const r = system.getBoundingClientRect();
    const core = system.querySelector('.entry-orbit-system__core')?.getBoundingClientRect();
    return {
      mode: 'authenticated-orbit-v2',
      at: Date.now(),
      next,
      bridge: {
        cx: +(r.left + r.width / 2).toFixed(2),
        cy: +(r.top + r.height / 2).toFixed(2),
        width: +r.width.toFixed(2),
        core: +(core?.width || 104).toFixed(2)
      }
    };
  }

  async function authenticate(event) {
    event.preventDefault();
    if (submitting) return;

    input.value = input.value.replace(/\D/g, '').slice(0, 4);
    updateDots(); clearError();
    if (!/^\d{4}$/.test(input.value)) {
      showError(loginText.format, 'format');
      return;
    }

    submitting = true;
    form.dataset.state = 'checking';
    form.setAttribute('aria-busy', 'true');
    if (submit) submit.disabled = true;
    if (status) status.textContent = loginText.checking;
    body.classList.add('is-authenticating');

    let response;
    try {
      response = await fetch(form.action, {
        method: 'POST',
        body: new URLSearchParams(new FormData(form)),
        credentials: 'same-origin',
        redirect: 'follow',
        headers: { Accept: 'application/json', 'X-ZahlFix-Transition': 'orbit-v1' }
      });
    } catch (error) {
      console.warn('[ZahlFix] Enhanced PIN handoff unavailable; using normal form navigation.', error);
      nativeSubmit(); return;
    }

    const contentType = String(response.headers.get('content-type') || '');
    if (!contentType.includes('application/json')) { nativeSubmit(); return; }

    let data = null;
    try { data = await response.json(); } catch { data = null; }
    if (!response.ok || !data?.ok) {
      const fallback = response.status === 429
        ? loginText.locked
        : response.status === 403
          ? loginText.origin
          : loginText.bad;
      showError(data?.message || fallback, data?.code || 'bad'); return;
    }

    warmHomepage();
    form.dataset.state = 'accepted';
    if (status) status.textContent = loginText.accepted;
    body.classList.remove('is-authenticating', 'pin-input-active');
    body.classList.add('is-authenticated');
    system.classList.add('is-expanded');
    input.blur();

    const next = typeof data.next === 'string' && data.next.startsWith('/') ? data.next : '/';
    // The final login frame stays centred. The next document recreates these exact
    // screen-space bounds before moving the SAME three paths to the measured Scene 01 anchor.
    const handoffDelay = reduced ? 190 : 900;
    window.setTimeout(() => {
      try { sessionStorage.setItem('zahlfix-entry-mode', JSON.stringify(bridgeSnapshot(next))); }
      catch { /* continuity is enhancement-only */ }
      location.assign(next);
    }, handoffDelay);
  }

  input.addEventListener('focus', () => body.classList.add('pin-input-active'));
  input.addEventListener('blur', () => body.classList.remove('pin-input-active'));
  input.addEventListener('input', () => {
    const clean = input.value.replace(/\D/g, '').slice(0, 4);
    if (clean !== input.value) input.value = clean;
    updateDots(); clearError();
  });
  input.addEventListener('paste', event => {
    const text = event.clipboardData?.getData('text') || '';
    if (!/^\d{4}$/.test(text.trim())) return;
    event.preventDefault(); input.value = text.trim(); updateDots();
  });
  form.addEventListener('submit', authenticate);
  updateDots();

  window.__ZAHLFIX_LOGIN__ = {
    snapshot: () => ({
      state: form.dataset.state || 'idle', pinLength: input.value.length,
      authenticated: body.classList.contains('is-authenticated'), reduced,
      bridge: bridgeSnapshot('/').bridge
    })
  };
})();
