# R6 verification - 2026-09-09

## Executed checks
- `npm run check`: passed; 54 unit tests passed.
- `python3 tests/browser/r6-login-menu.py`: 18/18 passed. Covers desktop login rails/PIN state/success geometry, mobile overflow/numeric PIN/success-core bounds, first-frame menu hiding, top-deploy menu, global menu cursor and Escape close/focus return.
- `python3 tests/browser/r4-lifecycle.py`: 46/46 passed, including login/setup responsive templates, menu pause/resume, reduced-motion, JS/module failure and readable fallbacks.
- `python3 tests/browser/scene0609-regression.py`: 111/111 passed across phone, small phone, landscape and tablet; Scenes 05-09 continuity remains intact.
- `python3 tests/browser/r4-regression.py --harness --profiles=phone`: 76/76 passed.
- `python3 tests/browser/r4-regression.py --harness --profiles=desktop`: 74/74 passed.
- `python3 tests/browser/r4-regression.py --harness --profiles=tablet`: 76/76 passed.
- `python3 tests/browser/r4-regression.py --harness --profiles=landscape`: 76/76 passed.

## Security checks included
- enhanced login returns success JSON only after PIN verification and issues the secure `__Host-zf_session` cookie;
- normal progressive login remains a 303 redirect;
- `Origin: null` enhanced login is constrained to the exact same-origin transition request shape;
- cross-site origin validation remains rejected;
- public CSP keeps `script-src 'self'` and `connect-src 'self'`; no `unsafe-inline` or `unsafe-eval` is introduced;
- the public edge-gate exclusion includes only the local login transition script needed before authentication.

## Verification boundary
The browser suites use an in-memory Chromium harness for application rendering and interaction. They prove local behavior and regression state, not the full production CDN/network navigation path. The final production gate is a Netlify Deploy Preview: enter the valid PIN in the real `/login` page, observe the orbit transition, confirm the protected homepage opens without a black/white flash, then exercise menu open/close/cursor behavior on desktop and the PIN flow on a physical phone.
