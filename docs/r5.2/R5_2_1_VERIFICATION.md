# ZahlFix R5.2.1 verification

Version: 6.15.1-r5.2.1
Date: 2026-09-09

## Production defect addressed

Chrome 152 on the live `https://zahlfix.com/login` page submitted the PIN form with:

- `Origin: null`
- `Sec-Fetch-Site: same-origin`
- `Sec-Fetch-Mode: navigate`
- `Sec-Fetch-Dest: document`
- `Content-Type: application/x-www-form-urlencoded`

R5.2 treated the literal `null` Origin as malformed and returned 403 before PIN verification.

## R5.2.1 rule

`Origin: null` is accepted only when all of the following are true:

- request method is POST;
- `Sec-Fetch-Site` is exactly `same-origin`;
- `Sec-Fetch-Mode` is exactly `navigate`;
- `Sec-Fetch-Dest` is exactly `document`.

It is not a generally trusted origin. Cross-site, same-site-null-origin, CORS/non-navigation, and non-document null-origin requests remain rejected.

## Executed verification

- `npm run check`: PASS, 53 unit tests / 0 failures.
- Exact captured Chrome request shape against the login handler with PIN `6367`: 303, Location `/`, `__Host-zf_session` issued.
- Lifecycle/fallback/supporting-page browser suite: 46 passed / 0 failed.
- Strict CSP remains unchanged; no `unsafe-eval` or general Origin bypass added.
- Cinematic scenes and public-site code were not modified by this patch.

## Deployment acceptance

After deploying R5.2.1 to a Netlify Deploy Preview, submit `6367` in the real browser form. Required result:

1. POST `/login` returns 303 rather than 403.
2. Response sets `__Host-zf_session`.
3. Browser follows Location `/` and the protected homepage loads.
4. A cross-site form submission remains 403.
