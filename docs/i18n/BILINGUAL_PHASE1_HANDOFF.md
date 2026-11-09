# ZahlFix | Bilingual implementation — Phase 1 (R6.1 → v6.17.1-i18n-p1)

**Status:** Implemented and tested as a **staging release**. **Not approved for production publication** until Phase 2 / Phase 3 content is completed and legal copy is reviewed.

## Source baseline and editorial principle

The supplied R6.1 archive was **German-first**, even though the initial project description referred to an English site. Its 20 German storyline transcripts were treated as the approved source narrative; the original German text remains byte-for-byte identical in `docs/approved-narrative.de.json`, in the German transcript and in unadapted later scenes. English wording in the first seven scenes is an editorial composition, not a literal translation.

- The central experience remains one cinematic, scroll-driven, 20-beat story.
- Source artwork, SVG path identities, scroll targets, PIN/session security and R6.1 authenticated orbit handoff are preserved.
- Only shell, login and Scenes 01–07 are fully bilingual in this phase, plus the 06–09 bridge captions that are generated directly in SVG.
- Scenes 08–20 beyond the bridge, detailed service content, the contact form and the legal documents still display German in the English preview. These must be adapted in Phases 2–3. Do **not** publish Phase 1 as the final bilingual experience.

## Editorial and composition inventory

| Scene | Approved German narrative | English native-feeling adaptation | Composition/intent |
|---|---|---|---|
| 01 — Opening | Die nächste Generation der Unternehmensentwicklung ist da. | A new era of business transformation starts here. | Avoids a long literal English noun chain; three engineered lines, English `transformation` sits on a lighter middle line. German source has its own smaller first-line type scale to prevent random wrapping. |
| 02 — Consulting | Beratung endet nicht bei Ideen. | Ideas are only the start. | Establish the idea-vs-execution contrast with two short, readable blocks. |
| 03 — Delivery | Sie beginnt mit der Umsetzung. | Real change takes execution. | Replaces abstract pronoun with a concrete action; microcopy `IDEAS → IMPACT` reflects the transformation. |
| 04 — Progress | Fortschritt scheitert selten an mangelnder Vision. | Progress rarely stalls for lack of vision. | Keeps the business argument and rhythmic three-line pacing. |
| 05 — Processes | Er scheitert an Prozessen, die nicht mehr mithalten können. | It stalls when processes cannot keep pace. | Reduces syntactic weight; German long middle line receives a narrower-screen scale adjustment. |
| 06 — Friction | Manuelle Abläufe. Getrennte Systeme. Verlorene Zeit. | Manual handoffs. Siloed systems. Time lost. | Concrete operational language for business and technical buyers; three short beats and corresponding fallback/visual labels. |
| 07 — The question | Was hält Ihr Unternehmen zurück? | What's slowing your business? | Direct business-facing question, two lines. German second line gets its own typography adjustment. |

The DE tone retains respectful formal address (`Ihr Unternehmen`, `Sie`); EN uses direct professional second-person language. Numbers, brand identifiers and `BERLIN / DE` remain shared. No artificial line breaks are inserted by JavaScript; each language has deliberate CSS fit rules.

## Build architecture

- `public/assets/v6/i18n-content.js`: immutable EN/DE editorial catalog (headlines, descriptions, transcript lines, navigation, cursor affordances, aria, opening SVG labels).
- `public/assets/v6/locale-route.js`: early `/` first-visit redirect; saved explicit language takes priority over ordered browser languages. `/en/` and `/de/` URLs always take precedence.
- `public/assets/v6/locale-ui.js`: pre-boot shell initialization and in-place language changes (`history.pushState`, `textContent` updates); no scroll reset or scene DOM recreation. Supports history `popstate` and stores explicit selection.
- `public/assets/v6/locale.css`: restrained topbar/menu EN/DE control, responsive layouts, and independent EN/DE type treatment.
- `tools/build-locales.mjs`: generates crawl-readable `public/en/index.html` and `public/de/index.html` from one German-approved semantic DOM, with per-locale HTML `lang`, title, description, canonical/hreflang and P1 `noindex,nofollow` staging directives. The client-side locale selector also updates the canonical URL in place.
- `public/assets/v6/scene0609-visuals.js`: updates caption text created directly in SVG, including on language change.
- `netlify/functions/login.mjs`: server-rendered English or German PIN page selected from protected destination; same form names, rate limiting, cookie/session policy and 3-ring bridge.
- `public/assets/login-transition.js`: localized client verification/status/error strings on the PIN page.
- `tests/unit/i18n.test.mjs` and `tests/browser/i18n-phase1.py`: routes, catalog parity, approved German invariance, server PIN rendering, actual in-place DOM and responsive readability.

**Developer note:** The `public/index.html` template remains German-first. Do not maintain separate hand-edited copies of `public/en/index.html` and `public/de/index.html`; update the template/catalog and run `node tools/build-locales.mjs` instead.

## How to preview

Use Node.js 22 or 24, extract the package, and from the folder containing `package.json` run:

```powershell
npm run dev
```

Open `http://127.0.0.1:4173/en/` for English or `http://127.0.0.1:4173/de/` for German. The root `/` selects the saved or browser-preferred language. The preview bypasses the hosted PIN gate by design; Netlify enforces it in staging. Use Ctrl+C to stop.

Run checks:

```powershell
npm run check
npm run test:r61
npm run test:r6
npm run test:i18n:browser
```

The browser harness uses in-memory Chromium and embedded local assets because Chromium network navigation is restricted in the development runtime. The separate Node / local-server checks cover generated source routes; **an actual HTTPS Netlify Deploy Preview remains mandatory** before any production release, including cross-document PIN handoff, session behavior, and browser Back/Forward in a genuine origin.

## Verified acceptance evidence (November 9, 2026)

- `npm run check`: 63/63 unit tests and 9/9 separately invoked i18n tests passing; static/legacy content verification passing.
- `npm run test:i18n:browser`: **86/86** real Chromium checks passing for language changes, editorial strings, responsive headline boundaries at five viewport profiles, reduced-motion text mode, metadata updates, and JavaScript errors.
- `npm run test:r61`: 13/13 entry-handoff checks and 9/9 responsive handoff checks passing.
- `npm run test:r6`: 23/23 prior login/menu checks passing.
- Local HTTP: `/`, `/en/`, and `/de/` responded with HTTP 200 using the provided local server.
- Evidence: `qa/i18n-p1/browser-report.json` and final responsive EN/DE screenshots in the same directory. No real Netlify Deploy Preview or live authentication integration test was performed.

## Deployment warning: retained lockfile

The supplied ZIP did **not** include `package-lock.json` (see `IMPORTANT_KEEP_PACKAGE_LOCK.txt`). The existing ZahlFix Git repository may have a reviewed lockfile. **Preserve that lockfile when applying this package.** If it is absent, generate it in an internet-connected environment with `npm install --package-lock-only --ignore-scripts --no-audit --no-fund`, then review and commit it before using the repository's GitHub CI workflow (`.github/workflows/verify.yml` requires a lockfile). Neither credentials nor a live Netlify configuration were modified. No production deployment was performed.

## Remaining phases and acceptance gates

- **Phase 2** — Adapt Scenes 08–14, the full ten-service capability system, animated service states and workflow/implementation/AI content. Recheck line-by-line geometry at all five standard viewport profiles and rendered SVG labels.
- **Phase 3** — Adapt Scenes 15–20, founders/principles, contact field labels, validation and email-subject generation, footer and legal content (with legal review); complete end-to-end SEO/accessibility/performance and real Netlify staging sign-off.
- **Production gate** — No mixed-language user flows, no duplicate German/English metadata, no PIN/session regressions, no clipped text, no accidental scroll resets, and full responsive and reduced-motion verification.
