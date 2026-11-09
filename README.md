# ZahlFix bilingual Phase 3 (v6.17.3-i18n-p3) — completed staging candidate

**All 20 cinematic scenes are now independently localized in EN and DE**, including technical diagrams, service cards, scrolling headlines, reduced-motion text, contact UI/email drafts, and language-specific legal routes. The original approved German transcript and R6.1 PIN-to-orbit architecture remain intact. The code is **locally verified but not deployed or production-approved**. Legal material requires qualified review, and the real HTTPS Netlify PIN/session gate requires Deploy Preview acceptance.

**Local preview:** Node.js 22/24; run `npm run dev` from the folder containing `package.json`, then open `http://127.0.0.1:4173/en/` or `http://127.0.0.1:4173/de/`. No `npm install` is necessary for the static preview. The local server does **not** enforce the Netlify login gate.

**Quality checks:** `npm run check`, `npm run test:i18n:browser:p3`, `npm run test:i18n:browser:p2`, `npm run test:i18n:browser`, `npm run test:r61`, and `npm run test:r6`. The browser suites require Chromium and the Python packages listed in `requirements-dev.txt`.

**Release documentation:** `PHASE3_BILINGUAL_RELEASE.md`, `docs/i18n/PHASE3_EDITORIAL_AND_LAYOUT_QA.md`, and screenshots/reports under `qa/i18n-p3/`. The contact form opens a draft in the visitor's own email app; no message is delivered until the visitor sends it. The original provided archive lacks `package-lock.json`; supply a reviewed repository lockfile before any dependency installation or Netlify CI deployment. Both language routes remain `noindex,nofollow` in staging.

---

# ZahlFix bilingual Phase 2 (v6.17.2-i18n-p2) - historical handoff

**Scenes 01–14 are now bilingual in EN and DE.** This release completes native-feeling localized Scenes 08–14, all ten services, dynamic workflow labels, software/AI diagrams and responsive typography, on top of the verified Phase 1 header/login/Scenes 01–07. Original R6.1 geometry, PIN security and animated handoff remain in place. **Scenes 15–20, contact and legal are pending Phase 3. Do not publish this as the completed bilingual site.**

**Preview:** `npm run dev`, then `http://127.0.0.1:4173/en/` or `http://127.0.0.1:4173/de/`.

**Tests:** `npm run check`, `npm run test:i18n:browser:p2`, `npm run test:i18n:browser`, `npm run test:r61`, `npm run test:r6`. Browser suites require Python packages and Chromium; the static preview does not require `npm install`. See `PHASE2_BILINGUAL_RELEASE.md` and `docs/i18n/PHASE2_EDITORIAL_AND_LAYOUT_QA.md` for final Phase 2 evidence and pending staging gates.

---

# ZahlFix bilingual Phase 1 (v6.17.1-i18n-p1) - historical handoff

**Staging build; do not publish to production yet.** The uploaded R6.1 source was German-first. This phase retains the approved German original, implements editorial English copy for Scenes 01–07, enables EN/DE in-place switching and provides language-specific PIN entry, navigation, accessibility and the opening visual captions. Scenes 08–20 and the German contact/legal flows are reserved for Phases 2–3.

**Launch locally:** From the folder containing `package.json`, run `npm run dev` and open [English](http://127.0.0.1:4173/en/) or [Deutsch](http://127.0.0.1:4173/de/). No `npm install` is needed for the static preview.

**Verify:** `npm run check`, `npm run test:i18n:browser`, `npm run test:r61`, `npm run test:r6`. On Windows, the browser suites require Python packages in `requirements-dev.txt` and a Chromium/Playwright installation.

Read the complete content, type-fit, engineering and deployment handoff in `docs/i18n/BILINGUAL_PHASE1_HANDOFF.md`. The source archive did not contain `package-lock.json`; retain the reviewed lockfile from the existing Git repository or regenerate it with network access before CI deployment. This project has not been published.

---

# ZahlFix R6.1 — seamless authenticated entry

**Version 6.17.0-r6.1**

R6.1 makes the protected PIN transition and Scene 01 one continuous visual system. The three gold paths around the PIN are the same normalized orbit geometry recreated on the protected homepage. After a valid PIN, they expand around the ribbon Z, the final rendered bounds are recorded, the homepage reconstructs that exact frame before body paint, and the same system then travels to the measured Scene 01 anchor before the real document planets take ownership.

Authenticated entry no longer shows the percentage loader or an intermediate text screen. The PIN field also suppresses the visible text caret/I-beam while retaining normal accessible keyboard and mobile numeric input. R6.0.1 menu/cursor fixes and the R5.2.1 PIN/security core are retained.

Focused verification:

```bash
npm run check
npm run test:r61
npm run test:r6
python3 tests/browser/r4-lifecycle.py
python3 tests/browser/scene0609-fullstory-smoke.py
```

See `docs/r6/R6_1_SEAMLESS_ENTRY.md` and `docs/r6/R6_1_VERIFICATION.md`.

## R6.0 historical baseline — authentication orbit + navigation continuity


## R6.0.1 menu cursor hotfix

R6.0.1 keeps the R6 login/menu design unchanged and fixes one interaction defect: the custom desktop cursor now renders continuously while the menu pauses cinematic scene motion. It no longer freezes over the top-right menu control, and leaving/re-entering the viewport restores cursor visibility correctly.

**Version 6.16.0-r6.0**

R6 makes authentication the opening scene of the same Gold Observatory universe. A valid four-digit PIN transitions through the login rails into the orbital loading system and then into Scene 01, instead of showing an unrelated loading/reset sequence. The server still validates the PIN before any success animation runs, and the normal form/303 flow remains available without JavaScript.

The main menu is also rebuilt as a top-deploying instrument panel. It is hidden from the first rendered frame, reverses cleanly on close, and uses the global custom cursor on fine-pointer devices. Touch devices retain the native pointer model.

R6 preserves the R5.2.1 four-digit PIN model, initial/bootstrap PIN `6367`, strict CSP, existing protected-session cookie and approved Scenes 01–09.

## R6 focused verification

```bash
npm run check
npm run test:r6
npm run test:failure
npm run test:scenes06-09
```

The real Netlify Deploy Preview remains the final staging check for the login-to-home page navigation because the browser changes documents after the authenticated handoff.

# ZahlFix R5.2.1 — four-digit PIN authentication

This release changes only the access subsystem. The cinematic website remains the R5.1 build. Authentication is now explicitly **four-digit PIN only**. The initial/bootstrap PIN for a new environment is **6367**.

The production browser failure that returned `403` before checking a correct PIN is addressed by Netlify-aware same-origin validation. A real browser POST from the custom domain is accepted when browser Fetch Metadata identifies it as same-origin/same-site, while cross-site requests are still rejected.

Operator commands:

```bash
npm run auth:pin
npm run auth:pin -- --apply --confirm-site=$NETLIFY_SITE_ID
npm run auth:bootstrap
npm run auth:bootstrap -- --apply --confirm-site=$NETLIFY_SITE_ID
```

`auth:bootstrap` creates `6367` only when no auth configuration exists. It never overwrites a configured store. `auth:pin` rotates an existing site to any exact four-digit numeric PIN and invalidates previous sessions. The older `npm run auth:rotate` name remains an alias for `auth:pin`.

R5.2.1 also fixes Chrome top-level same-origin PIN submissions that arrive at Netlify Functions with the literal header `Origin: null`; that value is accepted only when Fetch Metadata proves a same-origin document navigation.

A four-digit PIN has only 10,000 possibilities. R5.2 therefore limits failed attempts more aggressively. Use this mode only because the project explicitly requires a short PIN.

# ZahlFix - Cinematic R5.2 / Scenes 06-09 + PIN-only access

**Historical baseline: 6.15.1-r5.2.1** | R6 extends the login/navigation presentation while retaining that PIN core

This release preserves the approved Scenes 01-05 and Mobile R4 foundation, then implements the next continuous cinematic sequence: Scene 05 atom → Scene 06 tensioned document strings → Scene 07 hybrid orbital system → Scene 08 enlarged ZahlFix-centred system → Scene 09 services entrance. It does not deploy anything or automatically overwrite an existing production PIN, DNS or email settings.

## Start locally

Install Node.js 22.x or 24.x. Extract into a fresh directory, stop any older preview with Ctrl+C, and open a terminal in the folder containing package.json:

```bash
cd zahlfix-v6-r6-login-nav
npm run dev
```

Open `http://127.0.0.1:4173`, then hard-reload with Ctrl+Shift+R. Keep the terminal open. Stop with Ctrl+C. No npm install is required for this frontend preview or the source/unit checks. Do not double-click public/index.html.

The preview is unauthenticated; Netlify supplies the real access gate separately. The enquiry form composes an email in the visitor's own email program. It does not submit to a backend or guarantee delivery. The first five scenes and logos are local. Some later photography remains externally hosted.

### Check on a phone on the same private Wi-Fi

The default address works only on the computer running the server. To enable a temporary LAN preview, stop the server first.

Windows Command Prompt:

```bat
set HOST=0.0.0.0
npm run dev
```

macOS/Linux:

```bash
HOST=0.0.0.0 npm run dev
```

Find the computer's private Wi-Fi IPv4 address (for example using `ipconfig` on Windows). Open `http://YOUR-COMPUTER-IP:4173` on the phone. Allow the process through a firewall only on your private network. Do not use 127.0.0.1 or 0.0.0.0 as the phone's destination. Do not forward this port on your router or expose the unauthenticated preview to the internet. Stop it with Ctrl+C. For session authentication and secure-context behavior, use an isolated HTTPS Netlify staging deployment instead.


## R5.1: atom continuity and mobile scene isolation

- Scene 07 now starts from the exact approved Scene 05 atom geometry rather than a visually different hybrid.
- Three smaller companion planets intentionally reproduce the richer Scene 05 orbital density without double-rendering the previous scene.
- Scene 06 document-note layers, Scene 05 source layers, atmosphere, calibration and nucleus now have explicit ownership windows so mobile scenes cannot retain previous-scene artwork during readable holds.
- Scene 08 still enlarges the same orbital system into ZahlFix; the existing Scene 09 service bridge remains unchanged.

## R5: Scenes 06-09

- Scene 05 atom continues directly into three shared Scene 06 strings; no empty visual interval or replacement illustration.
- Three representative document plates act as notes pinned to the exact deforming strings. Their staggered, damped recoil is scroll-reversible.
- The same three paths close back into the approved Scene 05 three-plane atom geometry for Scene 07, enriched with three smaller companion planets for a more complete orbital system.
- The same three tracked bead identities remain authoritative; three smaller decorative companion planets add visual density without creating new tracked identities.
- Scene 08 enlarges the whole system around the supplied ribbon Z and provides a complete gold-background ZahlFix hold.
- Scene 08 exits through three organising guides while the warm-paper world reveals into the unchanged ten-service Scene 09 grid.
- The old challenge illustration remains available only as a fallback if the R5 bridge cannot initialize.
- Short-landscape geometry receives its own post-handoff offset/scale so the new strings do not collide with the German headline.

See `docs/r5/SCENES_06_09_IMPLEMENTATION.md` and `docs/r5/VERIFICATION.md`.

## Implemented scope

- One shared layout profile for phones, tablets, short landscape and desktop.
- Stable small-viewport cinematic stage, scene-based mobile scroll allocation, and preserved progress on width/orientation changes.
- Compact header, 44px primary touch targets, bottom progress/Continue controls and safe-area spacing.
- Measured copy-to-art clearance; compact document sizing, precise orbits and the same ribbon/wipe anchor.
- Readable service selector, workflow and later-scene layouts; text-priority founders presentation on small screens.
- Native page scrolling for the contact form, retained entered values, and separate visible-viewport handling for a focused field.
- Readable no-JavaScript, reduced-motion, enlarged-text/very-short-screen and module-failure fallbacks.
- Optimized ribbon files (96/192/384/768px), registered silhouette and reproducible asset pipeline.
- Responsive presentation of login, setup and legal pages; authentication handlers unchanged.

## Release documentation

- `docs/r4/IMPLEMENTATION_PLAN_AND_STATUS.md`: completed workstreams, file ownership and boundaries.
- `docs/r4/VERIFICATION.md`: executed tests, evidence, limitations and staging gates.
- `docs/r4/PRESERVATION.json`: twelve protected files compared byte-for-byte with R3.
- `docs/r4/ASSET_REVIEW.html`: self-contained artwork review.
- `public/assets/brand/ribbon-manifest.json`: supplied logo provenance, crop, sizes and pivot.
- `qa/r4/`: final current-release evidence only.
- `SHA256SUMS.txt`: current file integrity manifest, excluding itself.

Older design/security/deployment documents and historical test files remain for context. Their older pass counts are not R4 certification. Older screenshot directories have been omitted to keep this source package manageable.

## Check source and behavior

```bash
npm run check
node tests/local-server.mjs
```

The source/unit tests run without npm install. Browser development requires Python dependencies from requirements-dev.txt and a Playwright Chromium installation:

```bash
python -m pip install -r requirements-dev.txt
python -m playwright install chromium
```

With the local server running:

```bash
python tests/browser/r4-regression.py --profiles small,medium,phone,large-phone,tablet,large-tablet,landscape,zoom,desktop --screenshots
```

Use `--executable /path/to/chromium` to select an installed browser. Use `--harness` only when HTTP navigation is restricted: it embeds local source and does not validate HTTP, CSP or authentication. This release's layout checks used that mode with WebGL disabled. The test stores measured layouts for subsequent numerical checks:

```bash
npm run test:mobile:geometry
python tests/browser/r4-lifecycle.py
python tests/browser/r4-assets.py
```

Lifecycle/viewport checks deliberately inject events. They are not native iOS/Android or BFCache certification. All contact tests used dummy text and did not send enquiries.

## Rebuild assets

For material/vector edits:

```bash
npm run assets:phase1
```

For source-logo preparation (optional developer tooling):

```bash
python -m pip install -r requirements-assets.txt
python tools/prepare-ribbon.py
npm run assets:phase1
npm run check
```

The original supplied PNG is in tools/assets. Preparation removes isolated alpha specks, crops consistently, resizes and optically sharpens the smaller exports. It does not reconstruct folds, relight the logo, or create a new 3D model. The visual image and vector mask share the same coordinate registration. Do not independently change either one's crop or pivot.

## Before production

Native iOS Safari/Android, keyboard behavior, real GPU frame pacing and Netlify/CSP must still be checked on isolated staging. The inherited verified dependency-lockfile requirement remains outstanding; this release adds no npm dependency and does not fabricate a lockfile. Generate/review it in a networked development environment before using CI/production deployment. This does not block the local frontend preview.

See NETLIFY_DEPLOYMENT_GUIDE.md and docs/SECURITY_OPERATIONS.md for deployment and controlled password-rotation procedures. Never include credentials in a release ZIP. No operator rotation command has been run for this release.

## Operator-only 4-digit PIN rotation

Public first setup still requires a 15-512 character passphrase. If the site is already configured and the operator deliberately wants a 4-digit numeric PIN, the local rotation tool can opt into that weaker policy explicitly:

```bash
npm run auth:rotate -- --apply --confirm-site=$NETLIFY_SITE_ID --allow-4-digit-pin
```

On PowerShell use `$env:NETLIFY_SITE_ID` in the `--confirm-site=` value. The tool still requires `NETLIFY_SITE_ID`, `NETLIFY_AUTH_TOKEN`, an existing auth config, exact site confirmation, hidden confirmation input, compare-and-swap storage, read-back verification and session invalidation. The public `/setup` route remains on the stronger 15-character policy. A four-digit PIN has only 10,000 combinations and is materially weaker than a long passphrase; use it only if that tradeoff is intentional.

