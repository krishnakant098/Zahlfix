# ZahlFix bilingual - Phase 3 staging release

**Build:** `6.17.3-i18n-p3` | **Date:** 2026-11-09 | **Base:** reviewed bilingual Phase 2 source, built on R6.1.

**Status:** all three bilingual implementation phases are complete in source and have passed local static/unit/Chromium testing. This is **a staging release candidate, not a production deployment**. Hosted PIN/session behavior, external services and English legal copy require acceptance outside the local harness.

## Completed in Phase 3

1. **Scenes 15-20: editorially authored EN/DE.** Native English wording, deliberate short German headlines, balanced line breaks, tailored typography and phone-friendly compositions. The approved German 20-beat transcript is retained byte-for-byte in the source/catalog. English provides its own 20-beat narrative.
2. **Support and company graphics.** Bilingual labels for the after-launch system display; tailored-fit, direct-delivery and founders/Berlin diagrams; dynamic core/scroll text is now language-aware rather than being repainted in German. Stable scene IDs, orchestration and animation geometry remain unchanged.
3. **Conversion/contact.** Localized labels, form-field placeholders, optional indicators, validity status, no-clipboard fallback, copy button, privacy explanation and `mailto:` subject/body. Copy and email-draft actions use the selected language. Switching languages preserves typed field values and the active scene/scroll position. The website still **does not submit or store contact messages**; users must send the prepared email themselves.
4. **Legal routes and footer.** Generated `/de/impressum.html`, `/de/datenschutz.html`, `/de/agb.html` from the original German legal body; separately written `/en/...` adaptations with consistent company details, correct cross-language links, hreflang/canonical metadata and explicit legal-review staging notes. Original unprefixed legal routes are preserved for compatibility. These six new legal pages have `noindex,nofollow` in staging.
5. **Editorial accessibility.** Both language versions are available before JavaScript starts. Reduced-motion/text-view transcript, diagram accessible names, contact labels and language switches are localized. The seven physical scene containers remain immediate children of `main#main-stage` (nested contact markup found and repaired during QA).
6. **Build system.** `npm run dev`, `npm run check` and `npm run build` regenerate EN/DE homepage and legal pages. Added `test:i18n:browser:p3` and `test:i18n:p3` scripts.

## Local verification on 2026-11-09

| Verification | Result |
| --- | --- |
| `npm run check` | PASS: 75/75 unit tests, 9/9 Phase 1 i18n tests, syntax/source/german/legacy checks |
| Phase 3 Chromium | **73/73 checks passed**: two languages, five viewports, scene holds, contact interactions, text mode |
| Phase 2 Chromium regression | **85/85 checks passed** |
| Phase 1 Chromium regression | **86/86 checks passed** |
| R6.1 entry and responsive regression | **13/13 plus 9/9 checks passed** |
| R6 login/menu regression | **23/23 checks passed** |
| Live HTTP route smoke | See release evidence (checked independently for all home/legal paths and static assets) |

Browser evidence and screenshots: `qa/i18n-p3/browser-report.json` and 24 EN/DE desktop/phone captures under `qa/i18n-p3/`. Previous phases' evidence remains under `qa/i18n-p1/` and `qa/i18n-p2/`. Chromium tests load actual project markup, CSS and JavaScript into a restricted-network harness; this is not a full externally hosted/browser-device/network test.

## Run locally

Requirements: Node.js 22.x or 24.x. Open a terminal in the extracted source folder (where `package.json` resides):

```powershell
npm run dev
```

Open `http://127.0.0.1:4173/en/` (English) or `http://127.0.0.1:4173/de/` (German). The server is an **unauthenticated local preview**. Browser tests require `requirements-dev.txt`, Chromium and Playwright; `npm install` is not needed for the source/unit checks or the frontend preview.

For reproducible checking:

```powershell
npm run check
npm run test:i18n:browser:p3
npm run test:i18n:browser:p2
npm run test:i18n:browser
npm run test:r61
npm run test:r6
```

## Production release gates not yet cleared

- Obtain review and approval by qualified German legal counsel for **both** privacy/legal terms and the English adaptations, including company registration wording and treatment of externally requested content. English legal pages currently contain a review notice. Do not remove it until counsel approves the final text.
- Publish to an **isolated HTTPS Netlify Deploy Preview**; verify both prefixed homepage URLs and all six legal routes with valid/invalid/expired PIN sessions. Validate redirect `next` handling, language and hash retention, session cookies, `noindex`, asset CSP and Back/Forward navigation. Local checks cannot certify these.
- Check real email-app behavior on Windows/macOS/Android/iOS (no mail client, a local client, and browser-based email workflows). A `mailto:` draft is never proof of delivery.
- Verify real device/browser rendering, external assets, performance, focus behavior, reduced motion, contrast and browser-language routing. Professional copy review of both language experiences remains advisable.
- The provided source archive lacks a `package-lock.json`. Supply the reviewed lockfile from version control or regenerate and review it in a connected CI environment before deployment.
- Only after approvals and Deploy Preview acceptance should the team decide whether to remove staging `noindex,nofollow` and enable indexing. No production credentials or hosting settings are changed by this source release.

**Editorial/visual audit:** `docs/i18n/PHASE3_EDITORIAL_AND_LAYOUT_QA.md`.
