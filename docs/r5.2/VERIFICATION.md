# ZahlFix R5.2 verification

Version: 6.15.1-r5.2.1

Executed in the build environment on 2026-09-09.

## Passed

- `npm run check`: PASS.
- Node unit suite: 53 passed, 0 failed.
- PIN-specific auth tests include exact-four-digit policy, default `6367`, setup, login, session creation, rotation invalidation and edge-gate behavior.
- Netlify custom-domain regression: an internal Netlify request URL with `Origin: https://zahlfix.com`, forwarded custom host and `Sec-Fetch-Site: same-origin` is accepted.
- Cross-site form regression: rejected with 403.
- Lifecycle/fallback browser suite: 46 passed, 0 failed.
- Phone full-story Chromium harness: 76 passed, 0 failed.
- Operator PIN dry-run returned naturally under Node 24-style execution; no forced `process.exit(0)` remains.
- Operator bootstrap in an in-memory Blob contract created and verified initial PIN `6367`.

## Environment limitation

Direct browser navigation to local HTTP is blocked by the execution environment (`ERR_BLOCKED_BY_ADMINISTRATOR`). Therefore the full website browser suite uses its in-memory harness here. The auth regression itself is exercised at the Function/request layer with browser-like headers. A Netlify Deploy Preview remains the required final proof for the production custom-domain request path before merging.

The dependency list is unchanged (`@netlify/blobs` 11.0.2). This source package inherits the source archive's lack of a reviewed `package-lock.json`; production repositories should preserve their existing reviewed lockfile or regenerate/review it before CI.


## R5.2.1 production Chrome regression

The captured production request shape is explicitly covered:

- `Origin: null`
- `Sec-Fetch-Site: same-origin`
- `Sec-Fetch-Mode: navigate`
- `Sec-Fetch-Dest: document`
- POST `application/x-www-form-urlencoded`

With PIN `6367`, the login handler must return `303` and a `__Host-zf_session` cookie. Null-origin requests with `cross-site`, `same-site`, CORS mode, or non-document destinations remain rejected.
