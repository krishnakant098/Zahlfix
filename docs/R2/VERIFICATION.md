# ZahlFix cinematic R2 - verification

**Release 6.11.0-r2.0 | 9 September 2026**

## Executed checks

| Check | Result | Evidence |
|---|---|---|
| Inherited/source/content/syntax assertions | 167 PASS | `qa/r2/source-and-unit.log` |
| Node unit and request-handler tests | 33 passed, 0 failed | Same log |
| Focused R2 browser acceptance, eight layouts | 227 passed, 0 failed | `qa/r2/browser-acceptance.json` |
| Existing full-site browser regression, four layouts and all twenty reading states | 164 passed, 0 failed | `qa/browser-results.json` |
| R2 resize/failure/lifecycle injection | 13 passed, 0 failed | `qa/r2/lifecycle-and-fallback.json` |
| Existing module-failure/persisted-event tests | 5 passed, 0 failed | `qa/failure-results.json` |
| Ten-minute numerical orbit simulation per measured layout, sampled at 40 Hz | 192,008 frames; 1,728,072 document poses; zero overlaps/clips/text intersections | `qa/r2/geometry-sweep.json` |
| Capture/reassembly simulation, 31 departure times per layout | 911,648 visible poses checked; zero clipping/text hits; at most 2 travelling documents | `qa/r2/capture-sweep.json` |
| Sustained real browser-frame observation | 60.01 seconds, 3,599 frames, 449 DOM samples; zero observed document collisions/clips | `qa/r2/continuous-motion.json` |
| Continuous forward/reverse scroll exercise | 15 seconds of scroll input plus settling; complete opening restored; no uncaught errors | Same report |
| Actual Node HTTP smoke checks | 8 responses, all 200 and byte-identical to current source | `qa/r2/http-smoke.json` |
| Scope preservation against 6.10.0 | Seven scene containers' markup and sixteen protected files unchanged | `qa/r2/scope-preservation.json` |

The layout suite covers 1440x900, 1666x820, 1920x1080, 390x844, 320x568, 844x390, 768x1024 and 720x450 CSS pixels. Mobile/tablet profiles also exercised device scale factor 2. The 720x450 profile is an equivalent CSS viewport, **not native zoom certification**.

## Geometry and motion evidence

The checks start at actual zero scroll, not an artificially favourable later reading state. They inspect nine identities, three tracks, individual bounds, sequential capture, held trajectories, completed matrix, core/takeover alignment, actual Z fill coverage, circle/line/atom intermediate states, and reverse reconstruction.

The maximum observed browser node-to-master-path deviation was **0.005622 CSS pixels** across the sampled morph states. Core/takeover anchors matched within the 1 CSS pixel requirement at every layout. Each layout's pre-handoff Z silhouette covered all 117 sampled viewport positions before installing the flat gold background. Shape-based conservative coverage is also unit tested.

The 60-second continuous observation used actual headless browser animation frames and DOM geometry; it is distinct from the offline ten-minute simulation. Its maximum measured document-anchor discrepancy was 0.000725 CSS pixels. The forward/reverse exercise uses document scroll inputs and waits for the existing scroll smoothing to settle before checking the final state.

## Performance observations, not device guarantees

Runtime: Node 22.16.0; Chromium 144.0.7559.96 on the container's Debian environment. The isolated R2 desktop/mobile 180-frame samples reported approximately 16.7 ms 95th-percentile frame intervals and 0.5 ms 95th-percentile R2 update cost. During the sustained observation, the frame-interval 95th percentile was **16.70 ms** and the maximum was **33.40 ms**.

These are headless measurements, not a promise of 60 fps on a phone, a Core Web Vitals assessment, a hardware-GPU test or a profile of all later WebGL worlds. The R2 update timer does not include the entire browser rendering pipeline. Raw intervals remain in the reports.

## Test environment and honest limits

Browser navigation to local HTTP was blocked by this environment's policy. Browser suites therefore ran the real source through the explicitly labelled in-memory HTML/CSS/ES-module fixture. The separate Node HTTP checks prove serving/content/MIME behaviour, **not browser CSP enforcement**. The CI workflow is configured to run the suite against HTTP in an unrestricted environment, but that workflow was not executed here.

Resize, menu pause, delayed initialization and injected failures were checked. Freeze/resume and persisted page-transition checks deliberately inject events; they do not certify native BFCache or OS backgrounding. An attempted headless CDP freeze did not emit native lifecycle events in this environment, so no native-freeze claim is made.

Native Safari/iOS/Android, 200%/400% zoom/font scaling, physical device thermal/frame pacing, production CSP, live Netlify SDK/services and hardware WebGL require staging/device verification. External photography in later scenes was not newly certified. The inherited missing reviewed dependency lock remains a deployment gate; it does not block the static local preview.

## Reproduction and release hygiene

See the root README for normal HTTP test commands, optional development dependencies, `--harness`, numerical sweep inputs, and asset regeneration. Test output, selected source assets, licences, change inventory and a fresh SHA-256 manifest are included. Obsolete R1 QA screenshots/logs were not mixed into this release's current evidence.

No production deployment, DNS/email modification, password reset or authentication-policy change was performed. Full source extraction and checksum verification are recorded in the separate release receipt supplied with the ZIP.
