# ZahlFix Login Master R2

Focused visual correction against the supplied private-access reference.

## What changed
- Background light falloff and texture are richer and closer to the reference without using the reference image itself.
- Concentric geometry is now quieter, larger and more atmospheric.
- Password input border and focus glow are more restrained.
- Main lockup spacing and typography have been tightened for a more premium composition.
- Added a genuine secondary access path: `ZUGANG ANFRAGEN` via `info@zahlfix.com`.
- Added a LinkedIn contact block in the lower composition.
- LinkedIn target is configurable with the Netlify environment variable `ZAHLFIX_LINKEDIN_URL`.
- If that environment variable is not set, the page falls back to a LinkedIn company search for `ZahlFix`.
- Desktop short-height, mobile and reduced-motion layouts have dedicated treatments.

## Security
Password verification, session creation, login rate limiting, safe redirect handling, Netlify Blobs storage and cookie behavior are unchanged.

## LinkedIn production URL
Set `ZAHLFIX_LINKEDIN_URL` in Netlify to the exact ZahlFix LinkedIn company/profile URL. The code only accepts HTTPS LinkedIn hosts; an invalid value safely falls back to a LinkedIn company search for ZahlFix.
