# ZahlFix bilingual — Phase 2 staging release

**Build:** 6.17.2-i18n-p2, continued from the reviewed Phase 1 build (R6.1 base). **Status:** Implemented and locally verified as a **staging-only build**; not published to Netlify and **not approved as a complete bilingual production site**.

## Finished in this release

- Full independent EN/DE editorial treatment of **Scenes 08–14**: ZahlFix reveal, services/approach, analysis, automation, software implementation, custom software and practical AI. The German approved narrative/transcript remains unchanged; shorter German display headlines were composed where layout required them.
- All **ten capability cards**, including text labels, gold technical diagram microcopy, cursor prompts, button accessible names, selected-card readout and non-animated text fallback.
- Scene 10–11 **four workflow states**, graph/station markers, automation/handoff labels and the `main.js` updates that used to repaint German text when the scene advanced.
- Scene 12–14 **software architecture and AI network labels**, legend, status, captions, graphic aria labels and dynamically changing implementation mode.
- Distinct EN/DE headline spacing, line breaks and responsive sizes without changing scene shapes, art geometry or scroll anchors. One Scene 12 background-wipe timing adjustment makes its headline readable at the authored reading hold.
- Pre-rendered `/en/` and `/de/` pages, maintained from the shared German HTML template and immutable i18n catalog; client switches languages without re-creating the scene.

## Verification completed on 9 November 2026

| Check | Result |
| --- | --- |
| `npm run check` | PASS: 69/69 unit tests; dedicated Phase 1 i18n 9/9; static, language and legacy source checks |
| `npm run test:i18n:p2` | PASS: 6/6 focused P2 unit tests (included in the 69 above) |
| `npm run test:i18n:browser:p2` | **85/85** Chromium checks passed in five viewport profiles, both languages |
| `npm run test:i18n:browser` | **86/86** prior Phase 1 browser regression checks still passed |
| `npm run test:r61` | **13/13** login bridge + **9/9** responsive handoff checks passed |
| `npm run test:r6` | **23/23** login/menu regression checks passed |
| Local HTTP smoke | `/`, `/en/`, `/de/` and main locale assets all returned HTTP 200 |

Evidence: `qa/i18n-p2/browser-report.json`, representative EN/DE desktop and phone screenshots in `qa/i18n-p2/`, and the content/visual audit in `docs/i18n/PHASE2_EDITORIAL_AND_LAYOUT_QA.md`. Tests use the real application HTML, CSS and modules in a Chromium browser, but use a restricted-network in-memory harness. A separate **real HTTPS Netlify Deploy Preview** must still validate PIN authentication, protected route rewriting, session cookies, Back/Forward and the actual deployed asset paths.

## Preview locally

Use Node.js 22 or 24, extract the source ZIP and open a terminal in the folder containing `package.json`:

```powershell
npm run dev
```

Visit `http://127.0.0.1:4173/en/` or `http://127.0.0.1:4173/de/`. The local server deliberately has no PIN gate; authentication remains enforced by the Netlify-hosted version. For validation, run `npm run check`; the browser suites additionally need Python modules from `requirements-dev.txt` and Chromium/Playwright installed.

## Release controls and remaining Phase 3 scope

The staging pages continue to have `noindex,nofollow`. **Scenes 15–20, remaining company/support material, contact form field validation and outgoing emails, and legal-page localization are not yet bilingual**. German text after Scene 14 on the English staging URL is expected and intentional until Phase 3; do not publish this as the finished English site. No credentials, database state, existing production deployment, security logic or source language-selection behavior were changed.

The project ZIP supplied originally has **no `package-lock.json`**. Preserve the reviewed lockfile from the repository when integrating, or regenerate and review it in an internet-connected environment before GitHub/Netlify CI. Do not replace a reviewed lockfile with a guessed file.

Next: Phase 3 completes Scenes 15–20, contact/conversion flows, legal material, metadata/SEO release treatment and staging sign-off.
