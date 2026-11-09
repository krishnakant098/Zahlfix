# ZahlFix R5.2 PIN authentication implementation

Version: 6.15.1-r5.2.1

## Scope

This release changes the access subsystem only. The cinematic website, Scenes 01-09, contact flow, service content and legal pages remain the R5.1 baseline.

## Active credential model

- Exactly four numeric digits.
- Default/bootstrap PIN for a new configuration: `6367`.
- Salted scrypt hash remains in the schema-3 `password` field for storage compatibility; plaintext is never stored.
- Normal login, first setup and operator rotation all enforce the same four-digit rule.
- `auth:bootstrap` uses a conditional `onlyIfNew` write and cannot overwrite an existing configuration.
- `auth:pin` uses the existing ETag and `onlyIfMatch`, then reads back and verifies the new PIN.
- Rotation generates a new credential version and session signing secret, invalidating previous sessions.

## Browser 403 fix

The previous request guard compared `Origin` only with `new URL(req.url).origin`. On Netlify custom domains, a browser request can be presented to the Function with an internal request URL even though the browser submitted from `https://zahlfix.com`.

R5.2 accepts the request when any of the following proves the form is local:

1. Origin host matches `x-forwarded-host`, `x-original-host`, `Host`, `Forwarded: host=`, or the request URL host.
2. Browser-controlled `Sec-Fetch-Site` reports `same-origin` or `same-site`.

`Sec-Fetch-Site: cross-site` is always rejected. Malformed origins are rejected. A 403 now shows an origin-validation message rather than incorrectly saying the PIN was wrong.

## Login UI

The login form uses one accessible password-masked PIN field with:

- `name="pin"`
- `inputmode="numeric"`
- `[0-9]{4}` pattern
- minimum/maximum length 4
- `autocomplete="off"`
- numeric optical spacing

The setup screen uses the same constraints and pre-populates the known initial value `6367`.

## Brute-force controls

A four-digit PIN has only 10,000 possibilities, so R5.2 intentionally uses stronger failure controls:

- 5 failed reservations per 15-minute accounting window.
- 15-minute lock after the threshold.
- delayed invalid-PIN response.
- lower Netlify Function login rate limit.

## Operator commands

Existing site status/dry run:

```sh
npm run auth:pin
```

Rotate:

```sh
npm run auth:pin -- --apply --confirm-site=YOUR_SITE_ID
```

New empty store dry-run/bootstrap:

```sh
npm run auth:bootstrap
npm run auth:bootstrap -- --apply --confirm-site=YOUR_SITE_ID
```

The old `npm run auth:rotate` command is retained only as an alias to the PIN manager.


## Chrome `Origin: null` handling (R5.2.1)

Production Chrome 152 was observed submitting the same-origin top-level login form with `Origin: null` while sending `Sec-Fetch-Site: same-origin`, `Sec-Fetch-Mode: navigate`, and `Sec-Fetch-Dest: document`. R5.2.1 accepts the literal `null` origin only for a POST with exactly that same-origin top-level document-navigation shape. It remains rejected for `cross-site`, `same-site`, CORS/non-navigation modes, and non-document destinations. This keeps the workaround narrow instead of treating `null` as a generally trusted origin.
