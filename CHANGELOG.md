# ZahlFix bilingual Phase 3 - v6.17.3-i18n-p3 (2026-11-09)

- Completed independently authored English and German copy for Scenes 15-20, including support, tailored-fit, direct-delivery, founders, and contact story beats.
- Localized the support system, principles and founder technical graphics, including text repainted on scroll, with the shared i18n catalog and pre-rendered EN/DE content.
- Localized form labels, placeholders, status/error/copy fallback and mailto body/subject. Language switching preserves partially completed form fields; preparing a draft does not transmit an enquiry.
- Generated /en/ and /de/ legal notice, privacy and terms pages from retained German original legal text and editorial English drafts, with explicit qualified-legal-review staging notices.
- Preserved all 20 approved German transcript beats; carried forward the Phase 1-2 scene continuity and authentication architecture unchanged.
- Repaired nested contact-section markup uncovered by browser acceptance tests; added an explicit test for all seven physical scene containers being siblings.
- Added Phase 3 unit/Chromium suites and completed cross-phase regression with responsive snapshots. Staging robots noindex,nofollow is preserved; hosted PIN/cookie and legal approvals are pending.
- No live deployment, DNS, production auth rotation, credentials, database changes or customer emails.

---

## 2026-11-09 — 6.17.2-i18n-p2 (staging, Scenes 08–14)

- Continued the R6.1/Phase 1 bilingual source. EN/DE scenes 08–14, ten capability cards, workflow state graphics, software architecture/AI diagram microcopy, aria, cursor labels and text-only fallback are now fully localized.
- Added editorial EN/DE headline/spacing treatments and a scene 12 wipe-velocity correction; preserved source German approved transcripts and the cinematic timeline/geometry.
- Scene 08 brand reveal now reorders word nodes in DOM for correct screen-reader, copied-text and visual order; a shared compositor keeps its word spacing legible on phone and desktop.
- Generated language-specific `/en/` and `/de/` HTML for initial paint. Phase 3 contact/Scenes 15–20 and legal are intentionally incomplete and staging is still noindex.
- QA: 69/69 unit tests; 9/9 Phase 1 i18n tests; Phase 2 browser 85/85; Phase 1 browser 86/86; R6.1 handoff 13+9/22; R6 menu/login 23/23. Real Netlify Deploy Preview sign-off pending.

# 6.17.0-r6.1 - Seamless PIN-to-Scene-01 entry (2026-09-09)

- Replaced the approximate login rails/home loader pair with one shared three-orbit geometry used on both documents.
- The exact future Scene 01 paths are vertically compressed into the PIN rails, then expand around the ribbon Z only after server authentication succeeds.
- Added pixel-measured cross-document handoff data (centre, width and Z size) and a blocking protected-page entry boot that recreates that final login frame before body paint.
- Removed the authenticated percentage loader and intermediate text flash; the orbital transition itself is now the loading state.
- The homepage bridge travels to the actual `Phase1Visuals` measured Scene 01 anchor, then crossfades into the real document-orbit renderer and fully retires.
- Hid the native PIN caret/I-beam treatment while retaining one accessible numeric input.
- Added public edge-gate exclusions for the shared entry stylesheet and ribbon nucleus required before authentication.
- Added desktop and responsive geometry-continuity regression tests.
- R6 menu/cursor behavior, PIN 6367, strict CSP, session storage security, Scenes 02-20 and contact behavior are unchanged.

# 6.16.1-r6.0.1 - Menu cursor hotfix (2026-09-09)

- Decoupled the viewport-level custom cursor renderer from the cinematic scene-motion pause used while the navigation menu is open.
- Fixed the desktop cursor freezing at the top-right menu trigger/close control while the native cursor remained hidden.
- Reset cursor visibility state on pointer leave so re-entering the browser viewport reliably restores the custom cursor.
- Added focused browser regression coverage that moves the pointer across widely separated menu targets and verifies the rendered cursor transform follows it while the menu remains open.
- Login continuity, PIN authentication, menu choreography, Scenes 01-09 and production data are otherwise unchanged.

# 6.16.0-r6.0 - Login universe continuity and navigation system (2026-09-09)

- Rebuilt the PIN page as a Gold Observatory instrument with three transformable rails, a single accessible four-digit input and the supplied ribbon-Z nucleus.
- Added progressive-enhancement authentication: the server remains authoritative, normal form POST/303 still works without JavaScript, and the enhanced same-origin flow receives JSON only after a valid PIN and secure session cookie are issued.
- Added a successful PIN choreography that bends the login rails into orbital geometry, preloads critical homepage assets after authentication, writes a short-lived session handoff, and enters the homepage through a matching orbital loader rather than a second unrelated logo animation.
- Added an authenticated-entry loader mode while retaining the normal direct-visit loader and all existing Scene 01-09 choreography.
- Extended the Chrome `Origin: null` protection to the exact same-origin enhanced-login fetch shape without generally trusting null origins or weakening cross-site rejection.
- Rebuilt the main menu as an initially hidden top-deploying instrument panel with staggered navigation, reverse close choreography, robust rapid-toggle state and first-frame FOUC prevention.
- Moved menu interaction onto the global custom-cursor layer and added contextual menu cursor labels while keeping the custom cursor disabled on touch devices.
- Added responsive/reduced-motion login and menu behavior plus focused R6 browser tests.
- Strict CSP, PIN hashing/session security, Scenes 01-09 content, contact behavior and production data remain unchanged.

# R5.2.1 Chrome null-Origin form fix — 2026-09-09

- Fixed the production Chrome form-navigation failure where `Origin: null` accompanied `Sec-Fetch-Site: same-origin`, `Sec-Fetch-Mode: navigate`, and `Sec-Fetch-Dest: document`.
- `Origin: null` is accepted only for POST requests with that exact same-origin top-level document-navigation shape; it is not added as a generally trusted origin.
- Cross-site, same-site-null-origin, CORS and non-document null-origin requests remain rejected.
- Expanded origin diagnostics with method, raw origin value, Fetch Metadata and host candidates without logging PINs, cookies or tokens.
- Added a handler-level regression using the exact Chrome request shape and requiring `303` plus `__Host-zf_session`.
- PIN storage, default PIN `6367`, rate limits, strict CSP and cinematic website code are unchanged.

# R5.2 PIN authentication — 2026-09-09

- Converted normal login, first setup and operator rotation to exactly four numeric digits.
- Established `6367` as the explicit initial/bootstrap PIN for a new configuration.
- Fixed Netlify custom-domain browser POST rejection by validating forwarded hosts and browser Fetch Metadata instead of relying only on `req.url` origin.
- Added distinct origin-error UI so a rejected request is no longer misreported as a wrong PIN.
- Added numeric mobile input metadata, four-character limits and PIN-specific login copy.
- Tightened failed-login accounting to five failures in fifteen minutes and reduced the platform login allowance.
- Removed the forced dry-run `process.exit(0)` that triggered a Node 24/libuv cleanup assertion on Windows.
- Added `npm run auth:pin` and safe `npm run auth:bootstrap` operator workflows; the legacy `auth:rotate` script name remains as an alias.
- Added browser-like custom-domain request regression tests and preserved strict CSP.
- Cinematic scenes, contact behavior, legal copy and the public website presentation are otherwise unchanged.

# R5.1 operator PIN hotfix - 4-digit rotation opt-in (2026-09-09)

- Added an explicit `--allow-4-digit-pin` option to the local operator-only password rotation tool.
- Public first setup remains unchanged at the 15-character minimum; the login endpoint remains compatible with stored legacy/short credentials.
- Four-digit PIN creation requires the existing apply flag, exact Netlify site confirmation, operator token, hidden confirmation input, conditional Blob write and read-back verification.
- Added unit coverage proving `6367` is rejected by normal setup/config construction but accepted only by explicit operator rotation mode.
- Included the strict-CSP browser CI harness fixes so this hotfix does not regress the GitHub Actions repair.

# 6.14.1-r5.1 - Atom continuity and mobile scene isolation (2026-09-09)

- Restored Scene 07 to the exact approved Scene 05 three-plane atom geometry instead of a visibly different orbit family.
- Added three smaller companion planets to reproduce the richer atom density intentionally, without overlapping the outgoing Scene 05 renderer.
- Matched Scene 07 bead positions, scale, atmosphere and technical framework more closely to the approved Scene 05 visual language.
- Increased the Scene 07 ribbon-Z presence while keeping Scene 08 as the stronger branded state.
- Added exact Scene 05 -> 06 source retirement and explicit note/planet/atmosphere ownership windows, preventing previous-scene assets from bleeding into mobile readable holds.
- Kept Scenes 01-05 choreography, German copy, Scene 09 services, authentication, contact behavior and deployment configuration unchanged.
- Expanded focused browser acceptance with source-isolation and companion-planet checks.

# 6.14.0-r5.0 - Scenes 06-09 continuous system (2026-09-09)

- Extended the approved Scene 05 atom into Scene 06 using the same three cubic paths.
- Added three document-notes pinned to deforming strings and deterministic staggered damped recoil.
- Reformed the same paths into a professional atom/solar-system hybrid for Scene 07 with three persistent bead/planet identities.
- Enlarged that whole system around the supplied ribbon Z for Scene 08 and delayed the paper reveal until the branded hold is complete.
- Added a three-guide transition into the existing ten-service Scene 09 without pretending three tracks equal ten services.
- Retired the legacy challenge illustration only while the new bridge is healthy; fallback behavior remains intact.
- Added short-landscape tuning, pure-geometry unit tests, five-profile scene acceptance and fast full-story regression checks.
- No approved German copy, authentication, contact behavior, DNS, production settings or Scenes 01-05 choreography changed.

# 6.13.0-r4.0 - Mobile and ribbon identity (2026-09-09)

- Implemented shared mobile/tablet/landscape layout authority and scene-weighted native scroll mapping.
- Integrated supplied ribbon Z, optimized delivery sizes, shared vector silhouette and exact takeover pivot.
- Reworked compact header, touch controls, safe areas and all twenty readable scene layouts.
- Native-flow contact on compact layouts, retained values on rotation, focused-field visual-viewport handling.
- Added complete readable fallbacks and prevented renderer resume after switching to text mode.
- Improved login/setup/legal presentation only; authentication and contact handlers unchanged.
- Added nine-layout acceptance, synthetic lifecycle/failure tests, numerical sweeps, asset decoding and actual local HTTP checks.
- Supplied full source with current evidence; physical-device/staging and inherited lockfile gates remain.

# 6.12.0-r3.0 - Gold Observatory (2026-09-09)

- Integrated the approved R3 material and artwork direction into Scenes 01-05.
- Added shared gradient material definitions, edited ivory document shells, a metallic Z, bounded local atmosphere and calibrated decorative layers.
- Added a shaded aperture whose mask follows its inner opening; retained sequential capture and stable departure geometry.
- Framed the implementation matrix and linked it to the core with a scroll-deterministic signal.
- Applied continuous material sections and projected depth sorting to the existing ring/rail/atom curves; added dimensional beads, terminal detail and an ink/brass nucleus.
- Material detail simplifies during the Z takeover; the exact shared origin and coverage calculation are preserved.
- Added reproducible SVG exports, an isolated asset board, material unit checks and expanded browser acceptance checks.
- No new dependencies. No production, DNS, authentication, contact or later-world changes.

# 6.11.0-r2.0 - 2026-09-09

- Integrated the prepared Scenes 01-05 R2 asset system: one supplied-logo-derived Z, edited Tabler document variants, included MIT notice and provenance.
- Restored complete zero-scroll/pre-initialization artwork and separated generated assets from geometry/timing/rendering.
- Rebuilt three shared orbits with locked object phases, common depth ordering and slower outer tracks.
- Added derivative-matched sequential capture, text-safe aperture placement, deterministic scroll holds and ordered matrix assembly.
- Replaced circular/approximate takeover with the same measured Z silhouette and coverage-based gold handoff.
- Replaced capsule morphs with persistent ring-to-lane-to-ellipse cubics, attached nodes and a finished atom hold before unchanged Scene 06 entry.
- Added explicit visibility/freeze/page lifecycle suspension, independent renderer fallback and inactive-frame skips.
- Added continuous-motion, capture safety, actual-path, coverage, lifecycle and responsive regression tests. See current qa/VERIFICATION.md; earlier counts below are historical.
- Preserved approved German narrative, auth/contact modules, Netlify configuration and later scene content. No deployment or credential change.

---

# Change log

## 6.10.0-phase1.0 - 2026-09-08

### Cinematic Scenes 01-05
- Replaced the early WebGL paper swarm with a crisp, deterministic SVG/DOM visual system.
- Scene 01 now uses nine high-detail document objects on four precise elliptical orbits around a gold Z core.
- Scene 02 pulls documents one after another toward a restrained gravity sink using staggered curved trajectories and directional field lines.
- Scene 03 reassembles the documents into a 3x3 implementation matrix and expands the same Z anchor into the next deep-gold world.
- Replaced the inherited circular Scene 03-to-04 field reveal with a two-stage Z-shaped takeover that remains recognizably Z-shaped before the full-frame flood.
- Scene 04 now has four prominent concentric tracks, one node per track, radar/crosshair structure and a restrained system caption.
- Scene 05 continuously flattens those exact tracks into process lines and reforms them into an atom-like exit state.
- Added responsive positioning so the Scene 03 takeover center and Scene 01/03 Z core are the same anchor on every tested viewport.
- Suppressed the legacy challenge visual only for Scenes 04-05; it resumes for Scene 06 and later content remains unchanged.
- Added focused Chromium acceptance coverage for desktop, mobile, small-mobile and landscape.

## 6.9.0-repair.1 - 2026-09-08

### Visitor journey
- Replaced numeric HTML navigation targets with semantic scene IDs and readable hold destinations.
- Made Continue a global, pointer-enabled control; pointer/keyboard navigation now transfers focus on arrival.
- Removed the inherited late-story fade from Continue.
- Aligned mobile service exit with workflow entrance.
- Made the contact scene vertically scrollable, with naturally sized content and an in-flow footer.
- Allowed native scrolling inside the modal navigation while retaining focus containment, Escape and underlying-page scroll lock.
- Preserved the current story position when resizing the viewport.

### Readability and presentation
- Increased enquiry text, labels, inputs and control sizes; revised responsive form columns.
- Reworked opening line lengths, service names and short-screen founder composition without rewriting the approved transcript.
- Replaced difference-blended brand controls with explicit dark/light header themes.
- Added ten local service diagrams and accessible service-selection controls; removed inherited media-card styles from the new service component.
- Removed superseded navigation/service/contact selectors from the legacy stylesheet and documented CSS ownership.
- Restored native pointer cursors for controls.

### Fallback and rendering
- Added a readable-by-default transcript and contact destination, explicit Textansicht and reduced-motion mode.
- Added module-initialization fallback, loader failsafe, guarded session-storage access and existing-world fallback when WebGL is unavailable.
- Cached DOM selectors/uniform lookups, skipped unchanged style writes and inactive scene groups, and stopped full DOM choreography while settled.
- Used delta time for principal scroll/world/cursor smoothing.
- Added persisted-page lifecycle resume handling for browser back/forward restoration.
- Added WebGL context-loss/restoration and disposal paths; live hardware acceptance remains required.

### Enquiry behavior
- Preserved mailto rather than silently introducing a data processor.
- Relabelled the action as opening an email program, added an explicit delivery explanation, copy fallback and direct email.
- Added input bounds and encoding tests; do not report a delivered/submitted enquiry.

### Authentication and operations
- Added a 15-character minimum for new setup/rotation while preserving existing password verification.
- Added origin/media-type/body-size guards and safe same-origin redirect validation.
- Replaced read/modify/write failure counters with strongly consistent, conditional reservation/completion operations.
- Added operator-only compare-and-swap password rotation, fresh signing secret and read-back verification; no public reset route.
- Removed cross-request auth-config caching so rotation is checked on the next gated request.
- Added malformed/expired/tampered-token and storage-outage handling/tests.
- Selected Node 22 for Netlify; added Node 22/24 CI targets and a reviewed-lockfile release gate.

No live password, session, DNS, hosting setting or customer data was changed by this work.
