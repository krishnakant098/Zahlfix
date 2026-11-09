# ZahlFix - Phase 3 editorial, design and QA audit

**Scope:** Scenes 15-20, support/founder diagrams, contact, footer, legal paths, all final 20-scene text-only fallback. Reviewed in the actual R6.1 cinematic source after completing Phases 1-2. **Staging only.**

## Content decisions: meaning over literal translation

| Scene | Native English display copy | German display copy | Editorial / layout rationale |
| --- | --- | --- | --- |
| 15 - After-launch support | "Beyond go-live. / We stay involved." | "Auch nach dem Go-live. / An Ihrer Seite." | Short, reassuring tone in both languages; technical support diagram reinforces ongoing involvement rather than suggesting a maintenance SLA that was never promised. |
| 16 - Individual solutions | "One size never / fits every business." | "Keine Lösungen / von der Stange." | German idiom replaces an overly literal one-size translation. Breaks are planned for the narrow composition. |
| 17 - Direct execution | "No needless / detours." | "Keine unnötigen / Umwege." | Action-focused, spare English; equally compact, natural German, avoiding unsubstantiated speed guarantees. |
| 18 - Delivery principle | "Direct. / Clear. / Built to deliver." | "Direkt. / Klar. / Umsetzungsorientiert." | German consolidates a three-word claim into one compound adjective to fit the black world and align diagram markers. |
| 19 - Team | "Two founders. / Based in Berlin. / One shared ambition:" | "Zwei Gründer / aus Berlin. / Eine gemeinsame Vision:" | German reads as one coherent headline; English establishes location without adding unsupported partner biographies or metrics. |
| 20 - Contact | "Your challenge. / Our starting point." | "Ihre Herausforderung / ist der Anfang." | Coherent German thesis, not a word-for-word translation; paired with explicit human invitation. |

Additional company story EN: "Help businesses move forward through technology. We bring commercial understanding together with modern software and hands-on implementation, from the first conversation to a solution people can use."

Additional company story DE: "Unternehmen mit Technologie voranbringen. ZahlFix verbindet strategisches Verständnis mit moderner Technologie und praxisnaher Umsetzung – vom ersten Gespräch bis zur funktionierenden Lösung."

These lines are implemented in `public/assets/v6/i18n-content.js`, pre-rendered by `tools/build-locales.mjs` and refreshed in place by `public/assets/v6/locale-ui.js`. Original German approved narrative (20 transcript beats, `docs/approved-narrative.de.json`) remains unchanged.

## Typography, layout and motion

- Desktop uses the existing black/gold/paper editorial worlds; no duplicated EN/DE art pipeline and no new scene timeline. Locales share stable scenes and animation components.
- Line breaks for the shorter title pairs are semantic span boundaries rather than relying on identical string lengths. Scene 18's long German "Umsetzungsorientiert." remains within its dedicated headline region without extending outside the viewport.
- Support board labels, engineering callouts and all founder/principles nodes have localized microcopy; `main.js` reads the current language when updating the central process label.
- Phone/tablet/short-landscape checks validate heading bounds and full text rectangles, hero-readable opacity, document horizontal overflow, contact form presence and JS errors. The contact scene is deliberately native-scroll on compact devices; its entire form is not required to fit in one screen.
- Contact/scene markup was corrected after an audit detected the contact section nested in the principles section, which interfered with click behavior. A browser assertion now checks all seven cinematic section owners remain siblings.
- Text-only/reduced-motion path includes the final six English and German narrative beats, all 20 transcript items and the localized contact prompt. PIN bridge and R6.1 orbit geometry are unchanged.

## Contact editorial and UX controls

- The CTA says **OPEN EMAIL APP** / **E-MAIL-PROGRAMM ÖFFNEN** instead of claiming the enquiry was sent.
- Both locales explicitly state that a draft is created, must be sent in the mail client, and is not stored by this site.
- Required name/company/email/project and optional phone have localized labels and placeholders. HTML input constraints are unchanged. Form status, blank-field error, clipboard success and the manual copy fallback follow the chosen language.
- Outgoing `mailto:info@zahlfix.com` content uses language-specific subject, field labels and body; changing language preserves the fields the visitor has typed. Browser's native constraint-validation popups may follow the browser's own language; the authored status content follows the website locale.
- No server-side contact integration, CRM, delivery receipt, GDPR consent storage or marketing opt-in was invented.

## Legal and metadata controls

- All six legal URLs use distinct locale paths and scoped `lang` attributes; top-level footer links follow the active homepage language, including after in-place switching.
- German content of the original legal sections is retained verbatim. English versions are **editorial drafts** and expressly require legal review before publication. They should not be mistaken for certified legal equivalence.
- Page titles, metadata description, hreflang, canonical links and language selector update per locale; both home and legal pages remain `noindex,nofollow` in this staging build.
- The edge-function authorization gate currently covers `/*`; no authentication exemption was added for legal pages. Real Netlify rewrite/cookie checks remain a production acceptance gate.

## Results and limitations

| Test | Result |
| --- | --- |
| P3 Chromium responsive/in-place switching/form/text mode | 73 pass, 0 fail |
| P2 Chromium regression | 85 pass, 0 fail |
| P1 Chromium regression | 86 pass, 0 fail |
| Unit and source integrity | 75/75 unit pass, 9/9 standalone P1 i18n pass |
| R6.1 PIN bridge plus responsive handoff | 13/13 + 9/9 pass |
| R6 login/menu regression | 23/23 pass |

Visual captures: `qa/i18n-p3/{desktop,phone}-{en,de}-scene15.png` through `scene20.png`. They show scene reading holds using the original code in Chromium. The browser harness is restricted-network, not a hosted production visit. No real Netlify credentials, cookies, DNS settings, outbound email or third-party assets were verified or changed.

## Remaining acceptance tasks

1. Legal counsel approves German/English legal notices and real handling of analytics/third-party imagery.
2. Netlify HTTPS Deploy Preview validates six legal pages, locale-prefixed homepages, PIN, cookies and cross-route navigation.
3. Real-device editorial review checks desktop, phone, tablet, reduced motion, form mail client, keyboard/focus and copy legibility.
4. Release manager accepts the final copy and confirms indexing and production configuration before any publish action.
