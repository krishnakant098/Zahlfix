# R5.2.1 PIN-only operations

R5.2.1 supersedes the password-policy sections later in this historical document. The active website credential is exactly four numeric digits. New first setup defaults to `6367`; operators may choose another four-digit PIN. There is no long-passphrase mode in normal login/setup/rotation.

The stored secret remains a salted scrypt hash in the existing schema-3 `password` field for compatibility. The plaintext PIN is not stored. Sessions remain `__Host-zf_session`, Secure, HttpOnly, SameSite=Strict browser-session cookies. A PIN rotation creates a new credential version and session signing secret, invalidating older sessions.

For an existing site:

```sh
npm run auth:pin
npm run auth:pin -- --apply --confirm-site=YOUR_AUTHORISED_SITE_ID
```

For a brand-new store, `auth:bootstrap` can create the known initial PIN `6367`, but only with a conditional `onlyIfNew` write:

```sh
npm run auth:bootstrap
npm run auth:bootstrap -- --apply --confirm-site=YOUR_AUTHORISED_SITE_ID
```

The browser request guard accepts custom-domain requests that Netlify presents with an internal function URL when forwarded-host or browser Fetch Metadata proves same-origin/same-site. `Sec-Fetch-Site: cross-site` remains rejected. Rejections log only non-secret host/site metadata.

Five failures within the 15-minute accounting window trigger a 15-minute lock. Invalid PIN responses are deliberately delayed. Platform-level login rate limiting is also reduced.

# Security operations

## Preserved behavior

The existing `zahlfix-auth` store and `config` key remain. Normal sessions use `__Host-zf_session`, Secure, HttpOnly and SameSite=Strict, with no persistent Max-Age. Signed tokens expire after 12 hours. The archive contains no production secret.

A deployment does not recreate an existing config. Existing short passwords still verify: the new 15-character minimum applies to **new setup or explicitly authorised rotation**, not silently to the existing live password. There is no remember-me feature.

`ZAHLFIX_SETUP_KEY` only authorises the initial claim when the store has no config. Changing that environment variable does not reset a configured website password. Do not delete the config to improvise a reset.

## New setup

Use a separate Netlify QA site for testing. Configure a long random setup key, then use `/setup` to create a 15-512-character passphrase. Validate the account and setup closure. The existing setup-only-if-new write prevents a later setup request from replacing the record.

## Controlled password rotation

This is an operator CLI, **not a public HTTP reset endpoint**. It requires a networked machine with the real Netlify dependency installed and explicit authority over the intended site. It was not executed against any live site in this repair.

Inject `NETLIFY_SITE_ID` and `NETLIFY_AUTH_TOKEN` through a secure operator environment or secret manager. Do not place credentials in the repo, public frontend, chat transcripts, command arguments or screenshots.

```sh
npm run auth:rotate
```

The default is a read-only dry-run displaying site ID and non-secret metadata. Confirm the site independently. To rotate, substitute the exact authorised site ID:

```sh
npm run auth:rotate -- --apply --confirm-site=YOUR_AUTHORISED_SITE_ID
```

The terminal prompts twice with hidden input. For automation, a secure secret source may pipe the passphrase with `--password-stdin`; never put the passphrase directly on the command line. Validate the provider/dependency before attempting automation.

The tool generates a new salt, hash, password version and signing secret. It conditionally replaces the current config using its ETag, verifies the stored result, and rejects a concurrent replacement. Old signed sessions are rejected on the next request that reaches the gate. Already displayed or browser-cached information cannot be retroactively erased.

After rotation, verify the new password in a fresh private window, reject the old password, test the legal pages and logout, and remove/revoke the operator token. If read-back fails, treat it as an incident; do not delete or blindly overwrite the config.

## Rate limiting and request guards

A request reserves one attempt before expensive password verification. Conditional writes prevent concurrent requests from claiming more slots than the configured allowance. Completing a successful attempt removes only that attempt, not unrelated failures. Pending/crashed attempts age out conservatively. Conditional-write contention fails closed.

Origin and cross-site metadata, form content type and a 16KB body limit are checked. Redirect destinations must stay same-origin. Storage outages return service-unavailable rather than granting access.

The tests exercise an in-memory model of ETag/onlyIfNew/onlyIfMatch behavior. Real SDK semantics, isolation and platform rate-limit behavior **must be tested on Netlify**. The implementation is not a penetration-test certificate.

## QA isolation and rollback

Do not use a deploy preview of the production site as disposable storage. Use a **separate Netlify site/store context** for setup, failed-login stress tests and rotation, because deployments of one site can share site-wide storage.

Static rollback does not restore an old password or signing secret. Auth-state changes need their own authorised incident plan. This patch preserves schema 3, but do not intentionally restore stale signing secrets merely to make old sessions valid.


## R5.2.1 request-origin compatibility

The production login validator accepts `Origin: null` only when Fetch Metadata proves a same-origin POST top-level document navigation (`Sec-Fetch-Site: same-origin`, `Sec-Fetch-Mode: navigate`, `Sec-Fetch-Dest: document`). Cross-site requests remain blocked. Origin diagnostics intentionally exclude PINs, cookies and operator tokens.
