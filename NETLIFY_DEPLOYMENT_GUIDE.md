> **R5.2.1 request fix:** Chrome may submit the login form with `Origin: null` while `Sec-Fetch-Site: same-origin`, `Sec-Fetch-Mode: navigate`, and `Sec-Fetch-Dest: document`. The validator now permits only that narrow top-level same-origin POST case; cross-site requests remain rejected.

> **R5.2 override:** ZahlFix authentication is now four-digit PIN only. The default first/bootstrap PIN is `6367`. Historical long-password instructions below are retained only as deployment history. For current operations use `docs/SECURITY_OPERATIONS.md`, `npm run auth:pin`, and `npm run auth:bootstrap`. Do not delete an existing Blob config to reset access.

> Historical deployment context from the original package. For 6.9.0-repair.1, read `docs/DEPLOYMENT_CHECKLIST.md` and `docs/SECURITY_OPERATIONS.md` first. Do not repeat DNS changes for an already deployed site. Setup is not password reset.

# ZahlFix.com — Netlify deployment guide

## Recommended architecture

Keep the domain registered and DNS-managed at **united-domains**. Point only the website DNS records to Netlify. This is the safest route because existing email records for `zahlfix.com` (MX, SPF, DKIM, DMARC, verification TXT records) can remain unchanged.

Do **not** change the domain's nameservers to Netlify unless you intentionally want to migrate every DNS record, including email.

---

## Stage A — Create the Netlify project

Recommended: put this package in a **private GitHub repository** and connect that repository to Netlify. This gives you automatic deploys, deploy history, previews, and rollback.

1. Create a private GitHub repository, for example `zahlfix-v6-production`.
2. Upload/commit the contents of this package at the repository root. The root should contain `netlify.toml`, `package.json`, `public/`, and `netlify/`.
3. Sign in to Netlify.
4. Choose **Add new project / Import an existing project**.
5. Select GitHub and choose the private ZahlFix repository.
6. Netlify will read `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `public`
   - Functions directory: `netlify/functions`
   - Edge Functions directory: `netlify/edge-functions`
7. Deploy the project.

The first deployment can complete before the setup key is configured; the website will show that setup is not yet configured.

---

## Stage B — Configure the one-time setup secret

Before creating the public website password, configure a separate strong deployment setup key.

In Netlify:

1. Open the ZahlFix project.
2. Go to **Project configuration → Environment variables**.
3. Add:

   `ZAHLFIX_SETUP_KEY`

4. Use a long random value (32+ random bytes / a long password manager generated secret).
5. Save it.
6. Trigger a new production deploy so the new environment value is available.

This setup key is **not** the normal website password. It only prevents a random visitor from claiming the first password setup before you do.

---

## Stage C — First production password setup

Before connecting `zahlfix.com`, use the temporary Netlify address:

`https://YOUR-SITE-NAME.netlify.app/setup`

1. Enter the `ZAHLFIX_SETUP_KEY` you added in Netlify.
2. Choose the one ZahlFix website password.
3. Confirm it.
4. Submit.

The password is scrypt-hashed server-side and only the hash/configuration is stored in Netlify Blobs. The plaintext password is not stored.

After successful setup:

- `/setup` is closed and redirects to login.
- New visitors get the ZahlFix password screen.
- Every new browser session requires the password.
- Refreshes and page navigation in the current browser session remain authenticated.
- The session is HttpOnly, Secure, SameSite=Strict, and not a persistent remember-me cookie.

After setup succeeds, you may remove `ZAHLFIX_SETUP_KEY` from Netlify and redeploy. The configured website password remains in Netlify Blobs.

---

## Stage D — Test before changing the real domain

Using the temporary `*.netlify.app` address, verify:

1. Open a new private/incognito window → password is required.
2. Wrong password → rejected.
3. Correct password → website loads.
4. Refresh → remains logged in.
5. `/impressum.html`, `/datenschutz.html`, `/agb.html` → accessible only after login.
6. Close the private browser window and open a new one → password required again.
7. Test desktop and mobile scrolling.

Only after this passes should you change the public DNS.

---

## Stage E — Add `zahlfix.com` to Netlify

In Netlify:

1. Open the ZahlFix project.
2. Go to **Domain management**.
3. Choose **Add domain → Add a domain you already own**.
4. Enter:

   `zahlfix.com`

5. Choose the option to keep an **external DNS provider**.
6. Netlify normally adds/recognizes the `www.zahlfix.com` companion domain as well.
7. Keep `zahlfix.com` as the primary/canonical domain.

Do not transfer the domain registration away from united-domains.

---

## Stage F — united-domains DNS records

In united-domains:

1. Sign in.
2. Find `zahlfix.com`.
3. Click the **DNS** icon.
4. Open **DNS-Einträge**.

### Apex/root domain

Replace the old website A record for the root domain with:

| Type | Host | Value |
|---|---|---|
| A | `@` / root | `75.2.60.5` |

If an old root-domain AAAA record points to the previous web host, remove that old website AAAA record as well, otherwise some IPv6 clients may continue to reach the old server.

### `www`

Create/replace the website record:

| Type | Host | Value |
|---|---|---|
| CNAME | `www` | `YOUR-SITE-NAME.netlify.app` |

Use the exact Netlify project hostname shown in your Netlify project.

### Do not change email DNS

Do **not** remove or change records used for email, including:

- MX
- SPF TXT
- DKIM TXT/CNAME
- DMARC TXT
- Microsoft 365 / Google Workspace / other mail verification records

The website can move to Netlify without moving your `@zahlfix.com` email.

---

## Stage G — DNS verification and HTTPS

Back in Netlify:

1. Open **Domain management**.
2. Check `zahlfix.com` and `www.zahlfix.com`.
3. Use the DNS verification/status shown by Netlify.
4. Wait for DNS propagation.
5. Once Netlify detects the records, it will provision the HTTPS certificate.
6. Verify:

   `https://zahlfix.com`

7. Also test:

   `https://www.zahlfix.com`

The package canonicalizes `www.zahlfix.com` to `zahlfix.com`.

DNS updates often appear quickly but can take 24–48 hours to propagate fully.

---

## Updating the website later

If connected to GitHub:

1. Update files in the private production repository.
2. Push to the production branch.
3. Netlify builds and publishes the new version automatically.
4. Netlify Blobs keeps the existing site password configuration across deployments.

You should not need to recreate the website password after normal frontend deployments.

---

## Important: do not deploy the old secure ZIP unchanged

The prior desktop/local package used a long-running Node `server.js`. Netlify does not host that process model directly. This Netlify package replaces that runtime layer with:

`Netlify Edge Function → authentication gate → static v6 frontend`

and:

`Netlify Functions + Netlify Blobs → setup/login/session configuration`

This is the package to use for Netlify.
