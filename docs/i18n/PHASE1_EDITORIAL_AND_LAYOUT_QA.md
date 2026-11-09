# ZahlFix bilingual Phase 1 — editorial + visual quality audit

**Build:** v6.17.1-i18n-p1, derived from R6.1. **Scope:** Shared chrome, PIN experience, and cinematic scenes 01–07. **Status:** Staging only.

## Editorial decisions and scene-specific composition

| Scene | German (source-preserved) | English adaptation | Design and content judgment |
| --- | --- | --- | --- |
| 01 · Opening | Die nächste Generation / der Unternehmensentwicklung / ist da. | A new era / of business transformation / starts here. | The long German compound is not forced into the English line geometry. Both receive distinct font tuning; English conveys arrival of a new operating approach rather than copying the noun phrase. |
| 02 · Consulting | Beratung endet / nicht bei Ideen. | Ideas are / only the start. | A short two-beat claim in both languages. English emphasizes contrast, not the word 'consulting'. |
| 03 · Execution | Sie beginnt / mit der / Umsetzung. | Real change / takes / execution. | English explicitly names the thing that begins. The animated microcaption becomes “IDEAS → IMPACT” instead of word-for-word translation. |
| 04 · Progress | Fortschritt scheitert / selten an mangelnder / Vision. | Progress rarely / stalls for lack of / vision. | Three controlled lines preserve rhetorical rhythm and reading duration. |
| 05 · Processes | Er scheitert an / Prozessen, die nicht mehr / mithalten können. | It stalls when / processes cannot / keep pace. | The longer German center line receives a dedicated small-screen treatment; the English version stays succinct. |
| 06 · Friction | Manuelle Abläufe. / Getrennte Systeme. / Verlorene Zeit. | Manual handoffs. / Siloed systems. / Time lost. | Both versions use concrete operational pain points. German/English labels are updated in the graphical detail layers as well as headline nodes. |
| 07 · Question | Was hält Ihr / Unternehmen zurück? | What's slowing / your business? | Formal German address remains credible in a DACH B2B context; English is direct. Both have intentional two-line composition. |

## Complete Phase 1 content treatment

- Shared header: main logo label, signature, contact CTA, menu, opening navigation, mobile compact CTA, and EN / DE switch.
- Navigation overlay: all eight destination labels, summaries, close button, reduced-motion / cinematic options, and contextual cursor labels.
- Cinematic layer: Scenes 01–07 headlines, numbering, chapter labels, scene-group aria labels, microcaptions and bridge-SVG labels.
- Readable alternative: opening seven transcript items and the text-view controls. Scene 08–20 transcript, services and contact remain German in this staging release by design.
- Protected access: English/German PIN prompts, instructions, error strings, security copy, and entry state, without changing the rate-limit/session design.
- Metadata: independent route first-paint language, title, description, canonical and `hreflang`; `noindex,nofollow` prevents the incomplete staging version being indexed.

## Layout acceptance and evidence

The `tests/browser/i18n-phase1.py` Chromium suite evaluates both languages at **320 × 700 (small), 390 × 844 (phone), 768 × 1024 (tablet), 1440 × 900 (desktop), and 844 × 390 (landscape)**. It checks every Scene 01–07 line at its own readable scroll hold for:

- viewport width overflow or unexpected text wrapping;
- overlap with the header or continuation button;
- full text visibility and absence of JavaScript errors;
- availability of the language controls within the viewport.

It also checks language changes without reconstruction of the existing cinematic scene, canonical updates, transcript updates, open-menu continuity, and English reduced-motion readability. Representative snapshots are available under `qa/i18n-p1/`, including Scene 01, 04, and 07 in each language on small, phone and desktop screens.

## Verification (fresh source and i18n rerun)

- `npm run check` → **63/63 unit tests** plus **9/9 dedicated i18n tests**, all passing; legacy/static checks passed.
- `npm run test:i18n:browser` → **86/86 checks passed** in Chromium, with test report at `qa/i18n-p1/browser-report.json`.
- Local HTTP smoke verification → `/`, `/en/`, `/de/`, and new language assets responded with HTTP 200; EN/DE documents have correctly distinct HTML language and title.
- Earlier authenticated entry reports retained in `qa/r61/` cover 13/13 entry and 9/9 responsive checks, and `qa/r6/` retains previous PIN/menu evidence. An attempted fresh combined R6.1 rerun stalled after generating the PIN fixture in the restricted browser harness; therefore **fresh R6.1 regression success is not claimed**. A real Netlify Deploy Preview PIN/session test is still required.

## Invariants and explicit deferrals

- **Unchanged:** Original SVG geometry and scene DOM identity, WebGL, scroll choreography, and PIN security policies.
- **Incomplete by phase definition:** Scenes 08–20, ten service cards and workflow interactions, contact form validation and outgoing subject text, legal document localization. Do not launch this staging package as a public bilingual release.
- **Deployment dependency:** The provided original archive lacks `package-lock.json`; keep the reviewed repository lockfile or generate/review one before GitHub CI/Netlify deployment.

**Next build milestone:** Phase 2, the editorial and responsive adaptation of Scenes 08–14 and all service/workflow dynamic labels.
