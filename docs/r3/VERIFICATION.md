# ZahlFix Gold Observatory R3 - verification

Release **6.12.0-r3.0** | 2026-09-09 | Baseline **6.11.0-r2.0**

## Executed results

| Check | Result | Evidence |
|---|---|---|
| Source/content/syntax assertions | **169 passed** | `qa/r3/npm-check.log` |
| Node unit tests | **40 passed, 0 failed** | Same log; includes seven new material checks |
| Focused scene/material browser acceptance | **339 passed, 0 failed** across eight layouts | `qa/r3/browser-acceptance.json` |
| Full-site browser regression | **164 passed, 0 failed** | `qa/r3/full-site-browser-results.json` |
| Selected SVG assets | **21 parsed and decoded; 126 checks passed** | `qa/r3/asset-verification.json` |
| Phase renderer failure and lifecycle injection | **13 passed, 0 failed** | `qa/r3/lifecycle-and-fallback.json` |
| Main module fallback checks | **5 passed, 0 failed** | `qa/r3/main-fallback-results.json` |
| Numerical orbital sweep | **Pass; zero overlaps, clipping or text intersections** | `qa/r3/geometry-sweep.json` |
| Numerical capture/reassembly sweep | **Pass; maximum two travellers** | `qa/r3/capture-sweep.json` |
| Sustained browser observation | **60 seconds; no observed collisions/clipping** | `qa/r3/continuous-motion.json` |
| Reproducible asset generation | **Identical generated files on rerun** | `qa/r3/generator-reproducibility.json` |
| Actual local Node HTTP server | **10 routes returned correct source bytes** | `qa/r3/http-smoke.json` |
| Protected source/content comparison | **20 preservation checks passed** | `docs/r3/PRESERVATION.json` |

The focused viewports were 1440 x 900, 1666 x 820, 1920 x 1080, 390 x 844, 320 x 568, 844 x 390, 768 x 1024 and 720 x 450. Mobile/tablet checks also include device pixel ratio 2 where specified by the test suite.

The numerical sweep sampled ten minutes at 40 Hz in each of the eight measured layouts: **192,008 simulated frames and 1,728,072 document poses**. This is a numerical test, not ten minutes of observed browser footage. The separate capture/reassembly sweep covered 31 orbital departure times per layout and 911,648 poses.

The browser observation recorded **3596 animation frames** over 60.01 seconds, sampling the document DOM bounds 449 times. It then exercised 15 seconds of forward/reverse scrolling and returned to the complete zero-scroll opening. The largest measured pose-to-DOM anchor error was 0.000735 CSS pixels.

## Measured timing, not a hardware guarantee

In the instrumented headless observation, the frame-interval 95th percentile was **16.8 ms**, and the maximum was **66.7 ms**. The focused run's Phase 1 JavaScript-update 95th percentiles were approximately 1.3 ms on the desktop profile and 1.0 ms on the mobile profile. These update timings do not include the browser's full paint/composite cost; the frame-interval samples include scheduling effects and occasional outliers.

The implementation avoids new SVG blur/filter chains and does not add an independent animation loop. This is not a claim of zero dropped frames or guaranteed smoothness on every GPU, phone or browser.

## Visual evidence

- `qa/r3/release-preview.jpg`: actual website compositions for Scenes 01-05 and the completed atom.
- `qa/r3/before-after.jpg`: same-viewport R2/R3 comparisons.
- `qa/r3/mobile-preview.jpg`: actual compact layouts.
- `qa/r3/asset-board.png` and `docs/r3/ASSET_REVIEW.html`: isolated editable SVG family.
- `qa/r3/screenshots/`: eight viewport profiles, reading holds and intermediate geometry states.

The diagrams are not raster replacements for the working animation. Their live material layers and nodes derive from the original cubic paths.

## Environment and limits

Executed with Node 22.16.0, Python/Playwright and Chromium 144.0.7559.96 on this Linux runner. Browser navigation to the local HTTP address was attempted and blocked by the environment (`ERR_BLOCKED_BY_ADMINISTRATOR`). Therefore browser acceptance uses the documented in-memory harness: actual source, embedded local styles/media and equivalent data-URL ES-module imports. No application behavior is replaced by fake scene implementations.

The real Node server was separately checked with an HTTP client for HTML, JavaScript, CSS and SVG bytes/content types. This does **not** establish real-browser CSP enforcement or production Netlify behavior. Fault tests inject lifecycle/error events and are not native BFCache/history certification. Native Safari/iOS, representative hardware/GPU performance and Netlify staging remain release checks.

Authentication unit tests retain the existing in-memory storage test double. No production password, authentication record, DNS entry, mail record or deployment was changed. The inherited verified dependency-lockfile gate remains outstanding in a networked development environment. No dependency was added for R3.

## Reproduction

```bash
npm run assets:phase1
npm run check
python tests/browser/phase1-regression.py --harness --executable /usr/bin/chromium --profiles desktop,user-window,large,mobile,small,landscape,tablet,zoom-equivalent --screenshots
python tests/browser/regression.py --harness --executable /usr/bin/chromium
python tests/browser/r3-assets.py --executable /usr/bin/chromium
python tests/browser/phase1-lifecycle.py --executable /usr/bin/chromium
python tests/browser/failure-regression.py --executable /usr/bin/chromium
npm run test:phase1:geometry
npm run test:phase1:capture
python tests/browser/phase1-motion.py --executable /usr/bin/chromium --seconds 60
```

On an unrestricted development machine, run the website server and omit `--harness` for the focused/full browser checks. Pass `--base-url http://127.0.0.1:4173` to the motion script to exercise HTTP. Refer to the README for browser installation and platform-specific executable selection.
