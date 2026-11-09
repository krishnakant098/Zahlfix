/** Small same-site HTML form requests only. Browser Fetch Metadata is treated as authoritative when present. */
export class FormRequestError extends Error {
  constructor(status, message, code = 'FORM_REQUEST_INVALID') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function cleanHost(value = '') {
  return String(value).trim().toLowerCase().replace(/\.$/, '');
}

function firstHeaderValue(value = '') {
  return String(value).split(',')[0].trim();
}

function forwardedHost(req) {
  const forwarded = req.headers.get('forwarded') || '';
  const match = forwarded.match(/(?:^|[;,])\s*host=(?:"([^"]+)"|([^;,\s]+))/i);
  return cleanHost(match?.[1] || match?.[2] || '');
}

export function requestHostCandidates(req) {
  const candidates = new Set();
  for (const value of [
    firstHeaderValue(req.headers.get('x-forwarded-host') || ''),
    firstHeaderValue(req.headers.get('x-original-host') || ''),
    req.headers.get('host') || '',
    forwardedHost(req)
  ]) {
    const host = cleanHost(value);
    if (host) candidates.add(host);
  }
  try {
    const url = new URL(req.url);
    if (url.host) candidates.add(cleanHost(url.host));
  } catch {}
  return candidates;
}

function nullOriginTopLevelSameOriginNavigation(req, fetchSite) {
  // Chrome can serialize a privacy-restricted form navigation as `Origin: null` even
  // while Fetch Metadata identifies the request as a same-origin, top-level document
  // navigation. Accept only that narrow browser case; never trust `null` generically.
  if (req.method !== 'POST') return false;
  if (fetchSite !== 'same-origin') return false;
  const fetchMode = (req.headers.get('sec-fetch-mode') || '').trim().toLowerCase();
  const fetchDest = (req.headers.get('sec-fetch-dest') || '').trim().toLowerCase();
  return fetchMode === 'navigate' && fetchDest === 'document';
}

function nullOriginEnhancedSameOriginLogin(req, fetchSite) {
  // The R6 cinematic login uses a same-origin fetch after the user submits the PIN.
  // Some privacy configurations can also serialize that fetch as Origin:null.
  // The custom header makes this distinguishable from a plain cross-site HTML form;
  // Fetch Metadata must still prove same-origin and cross-site is rejected above.
  if (req.method !== 'POST' || fetchSite !== 'same-origin') return false;
  if (req.headers.get('x-zahlfix-transition') !== 'orbit-v1') return false;
  const fetchMode = (req.headers.get('sec-fetch-mode') || '').trim().toLowerCase();
  const fetchDest = (req.headers.get('sec-fetch-dest') || '').trim().toLowerCase();
  return (fetchMode === 'cors' || fetchMode === 'same-origin' || fetchMode === '') && (fetchDest === 'empty' || fetchDest === '');
}

export function requestOriginAllowed(req) {
  const fetchSite = (req.headers.get('sec-fetch-site') || '').trim().toLowerCase();
  if (fetchSite === 'cross-site') return false;

  const rawOrigin = (req.headers.get('origin') || '').trim();
  if (!rawOrigin) {
    // Same-origin HTML navigations can omit Origin. Fetch Metadata, when present, must still not be cross-site.
    return fetchSite === '' || fetchSite === 'same-origin' || fetchSite === 'same-site' || fetchSite === 'none';
  }

  if (rawOrigin.toLowerCase() === 'null') {
    return nullOriginTopLevelSameOriginNavigation(req, fetchSite) || nullOriginEnhancedSameOriginLogin(req, fetchSite);
  }

  let origin;
  try { origin = new URL(rawOrigin); }
  catch { return false; }
  if (origin.protocol !== 'https:' && origin.protocol !== 'http:') return false;

  const originHost = cleanHost(origin.host);
  if (requestHostCandidates(req).has(originHost)) return true;

  // On Netlify a custom-domain browser request can reach the Function with an internal req.url origin.
  // Sec-Fetch-Site is browser-controlled and accurately identifies this form submission as same-origin/same-site.
  if (fetchSite === 'same-origin' || fetchSite === 'same-site') return true;
  return false;
}

export function requestOriginDiagnostic(req) {
  const rawOrigin = (req.headers.get('origin') || '').trim();
  let originHost = '';
  if (rawOrigin && rawOrigin.toLowerCase() !== 'null') {
    try { originHost = new URL(rawOrigin).host; } catch {}
  }
  return {
    method: req.method,
    originValue: rawOrigin || '(absent)',
    originHost,
    fetchSite: req.headers.get('sec-fetch-site') || '',
    fetchMode: req.headers.get('sec-fetch-mode') || '',
    fetchDest: req.headers.get('sec-fetch-dest') || '',
    transition: req.headers.get('x-zahlfix-transition') || '',
    requestHosts: [...requestHostCandidates(req)]
  };
}

export async function readForm(req) {
  if (!requestOriginAllowed(req)) throw new FormRequestError(403, 'Ungueltige Herkunft.', 'FORM_ORIGIN_REJECTED');
  if (!(req.headers.get('content-type') || '').toLowerCase().startsWith('application/x-www-form-urlencoded')) {
    throw new FormRequestError(415, 'Ungueltiges Formularformat.', 'FORM_MEDIA_TYPE');
  }
  const limit = 16384;
  if (Number(req.headers.get('content-length')) > limit) throw new FormRequestError(413, 'Formular zu gross.', 'FORM_TOO_LARGE');
  const reader = req.body?.getReader();
  let size = 0;
  const chunks = [];
  if (reader) try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new FormRequestError(413, 'Formular zu gross.', 'FORM_TOO_LARGE');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const c of chunks) { bytes.set(c, offset); offset += c.byteLength; }
  return new URLSearchParams(new TextDecoder().decode(bytes));
}
