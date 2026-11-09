# ZahlFix bilingual Phase 2 — editorial and layout audit

**Scope:** v6.17.2-i18n-p2, Scenes 08–14, all ten service cards and their dynamic/accessible renderings. **Audience:** German Mittelstand and DACH B2B decision makers, plus international English-speaking visitors. This is localization by message intent, typography and animation behavior; not literal translation.

## 1 · Scene-by-scene narrative adaptation

| Scene | German authored display | English authored display | Editorial and layout intent |
| --- | --- | --- | --- |
| **08 — The reveal** | *Genau dort beginnt ZahlFix.* | *This is where ZahlFix steps in.* | English changes the syntactic position of the brand, keeping the cinematic Z wordmark and reveal. The generator and live locale switcher reorder the existing inline word nodes, ensuring both the visible and screen-reader reading order is natural; the scene element and animation remain the same. |
| **09 — Approach & services** | *Wir verbinden Beratung / mit technischer Umsetzung.* | *From business strategy / to working technology.* | Literal 'consulting meets technology' would be an abstract promise. English specifies an outcome; German retains the approved direct B2B claim. Both lead into the same capability grid. |
| **10 — Workflow** | *Wir analysieren. / Wir digitalisieren. / Wir optimieren.* | *Understand first. / Connect the work. / Make it flow.* | English uses natural process-improvement verbs rather than three repetitive 'We' clauses. The four-state live workflow indicator has its own terminology catalog. |
| **11 — Automation** | *Wir automatisieren, / was sich wiederholt.* | *Automate / what repeats.* | Short, operational language. German and English are styled independently so the message is readable before the scene advances. |
| **12 — Implementation** | *Software, die passt. / Sauber eingeführt.* | *Software that fits. / Implemented with care.* | German approved full explanation remains in the accessible transcript; shorter visible display text respects the left-of-diagram layout. English is intentionally allowed an extra wrapped line at desktop rather than being mechanically shrunk. Source R6.1 background wipe ended too late; its end was advanced from scroll progress `.68` to `.631` (same start `.61`) to clear the title at the scene's `.645` reading hold. |
| **13 — Custom software** | *Individuelle Software. / Für Ihre Abläufe.* | *Custom software. / Built around your work.* | Native headline rhythm emphasizes fit to the client's operations, not just development as an activity. Distinct EN/DE font sizes avoid text collisions with the software diagram. |
| **14 — Applied AI** | *KI mit echtem / Mehrwert.* | *AI where it / makes a difference.* | Avoids excessive claims, keeps a pragmatic promise. Detailed subtitle, accessible transcript and all inner AI-diagram micro-labels are also adapted. |

Full approved German narrative text is retained in `docs/approved-narrative.de.json` and the German transcript; the visual headline adaptation does not replace the legally/brand-approved long-form message. The EN transcript is a separately composed readable narrative for reduced-motion and assistive technology. Scene 08 also has actual locale-correct word ordering (not only CSS `order`), with optical word spacing tuned independently on phone and desktop.

## 2 · Ten service-card localization decisions

| No. | German | English | Rationale |
| --- | --- | --- | --- |
| 01 | IT-Beratung | IT consulting | Familiar professional category; no invented expertise claims |
| 02 | Digitalisierung | Digital workflows | More specific and useful to operational buyers than an abstract 'digitalisation' |
| 03 | Prozessoptimierung | Process improvement | Standard English operational phrasing |
| 04 | Automatisierung | Workflow automation | Clarifies the target of automation |
| 05 | Softwarekonzeption | Software design | Concise readable label; service remains distinct from development |
| 06 | Softwareentwicklung | Software development | Established technical category |
| 07 | KI-Anwendungen | AI applications | Unambiguous business-facing label |
| 08 | KI-Agenten | AI agents | Standard terminology; no unsupported autonomy claims |
| 09 | Softwareimplementierung | Software implementation | Direct and recognizable deployment service |
| 10 | Technischer Support | Technical support | Service continuity, no fabricated SLA promises |

Each card has **four** independent translation surfaces: name, compact technical graphic text, numbered eyebrow, and accessible button name; its contextual cursor label is also localized. The selected capability readout in `main.js` is no longer a static German array. The same catalog powers the alternative static service list in reduced-motion view.

## 3 · Dynamic and diagram localization

- **Workflow states:** All four step numbers/names/descriptions moved to `workflow.state{n}.{label,title,detail}`. The animation still chooses the state; translation is resolved at render time with the active locale. This prevents German flashback after an EN/DE toggle or reverse scrolling.
- **Handoffs:** Workflow train/station labels and automation-loop captions are localized, including the travelling document's `ABLAUF / WORKFLOW` label and the service-to-automation extraction microcopy.
- **Implementation/AI world:** Localized top banner, diagram mode, bottom lifecycle, conceptual software modules (6 × name/detail) and AI nodes (7 × name/detail), explanatory diagram captions, accessible graphic name, plus the motion-generated `BUILD / AI` status. Nodes keep their original SVG paths, dimensions and animation hooks.
- **First paint:** Both `/en/index.html` and `/de/index.html` are generated from `public/index.html` via `tools/build-locales.mjs`; all Phase 2 text is rendered into each HTML file at build time. The runtime updates only text/label attributes, not graphic hierarchy or scene DOM identity.

## 4 · Visual and functional QA

The Chromium suite `tests/browser/i18n-phase2.py` checks the scene-specific authored reading hold for **08 through 14** in **EN and DE** at 320 × 700, 390 × 844, 768 × 1024, 1440 × 900 and 844 × 390. It measures header/foot clearance, horizontal text bounds, scene visibility, document overflow, 10/10 card titles and accessible names, JavaScript exceptions and in-place switching while scroll and scene DOM identity are retained. The reduced-motion text-only version and its language switch are tested independently.

Representative final screenshots are provided under `qa/i18n-p2/`, complete `desktop-{en,de}-scene{08..14}.png` and `phone-{en,de}-scene{08..14}.png` series. Scene 09 is a 5×2 capability grid on desktop and a 2-column stacked version on mobile; the service names remain legible and inside their card bounds. Scene 12's typographic panel now clears the transition overlay by the reading hold. Scene 14 uses readable language-specific headlines with localized node labels, retaining the technical orbital artwork.

| Verification | Result |
| --- | --- |
| Source + legacy checks, unit tests | PASS: `npm run check` (69/69 unit tests; additional dedicated P1 suite 9/9) |
| P2 Chromium checks | **85 passed / 0 failed**; details in `qa/i18n-p2/browser-report.json` |
| P1 Chromium regression | **86 passed / 0 failed** |
| R6.1 PIN-to-orbit regression | **13 + 9** passed / 0 failed |
| R6 PIN/menu regression | **23** passed / 0 failed |
| Local route smoke | `/`, `/en/`, `/de/` and locale assets HTTP 200 |

## 5 · Boundaries / production gate

- Phase 2 is **not** a complete English website. Scenes 15–20, company/about, contact workflows, legal documents and their form handling retain German until Phase 3. Staging routes have `noindex,nofollow`.
- Real Netlify HTTPS authentication/session flow, route access control and cross-document PIN bridge require staging verification after upload; local preview is deliberately not authenticated. The test browser's `about:blank` history exception is bypassed **only in test code** by spying on `pushState`; production `history.pushState` has not been altered.
- The software/AI sub-node annotations are subordinate graphic detail, not the sole conveyance of critical information; the transcript and clear readable headlines provide the accessible message. Further WCAG review and deployment performance checks are Phase 3 release gates.
- The source archive lacks `package-lock.json`; preserve the repository's reviewed lockfile or regenerate and review before CI deployment. No production release was attempted.
