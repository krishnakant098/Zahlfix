# ZahlFix bilingual Phase 1 — staging release

## Delivered
- Separate pre-rendered `/en/` and `/de/` routes with language-appropriate first paint.
- Shared bilingual editorial catalog for site chrome and scenes 01–07; German original approved narrative retained.
- Header and menu language selectors; in-place switching preserves scene DOM, scroll and cinematic state.
- Browser-language / saved-language selection for homepage root.
- Language-aware PIN entry and authentication error text, retaining the original login flow.
- Scene 01–07 headlines, navigation, scene captions, transcript and accessibility text adapted and tested.
- Responsive EN/DE layouts and reduced-motion/text-view checks.

## Deliberately deferred
Scenes 08–20, service descriptions, contact workflow, legal pages and all remaining dynamic content are not yet fully bilingual. Do not publish this as a completed bilingual production release. Both language routes carry `noindex,nofollow` for staging.

## Validation
- `npm run check` — PASS (7 tests in the Phase 1 i18n unit suite; legacy checks also pass).
- `qa/i18n-p1/browser-report.json` — 84 passed, 0 failed (existing Chromium browser QA report).
- Visual captures: `qa/i18n-p1/` for EN/DE on small, phone, desktop.

## Local preview
Run `npm run dev`, then visit `http://localhost:4173/en/` or `http://localhost:4173/de/` (server port is configurable; see terminal output).

## Release control
Maintain the existing production deployment until Phases 2 and 3 are complete and production review passes.

## Reverification and design audit
- Full editorial and viewport audit: `docs/i18n/PHASE1_EDITORIAL_AND_LAYOUT_QA.md`.
- Re-checked on the supplied source: 63/63 unit tests, 9/9 i18n tests and 86/86 Chromium bilingual checks; EN/DE local HTTP routes serve correctly.
- The separately attempted R6.1 browser rerun did not complete in this container; the prior R6.1 results remain present in the source but are not presented as newly reverified.
