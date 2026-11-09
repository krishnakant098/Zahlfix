# ZahlFix Scenes 01-05: R2 audit

**Baseline:** supplied `ZahlFix_v6_10_0_Cinematic_Phase1_Source_20260908.zip`, package `6.10.0-phase1.0`.
**Date:** 8 September 2026.
**Scope:** the six new user screenshots, the extracted source, and targeted in-memory Chromium geometry checks. This is not an audit of every later scene or a production-device performance certification.
**Status:** audit and asset preparation only. No production source, DNS, hosting or authentication was modified.

## Executive diagnosis

The implementation now communicates the requested sequence, but precision is undermined by inconsistent geometry, clocks, opacity and object identity. It remains a motion prototype rather than a finished cinematic system. More glow or more icons would not repair these defects.

The first screenshot's empty right side has a concrete cause: the complete hero visual is hidden at exactly zero scroll. The atom's loss of precision also has a concrete cause: CSS rounded rectangles are drawn while the nodes are calculated as if the paths were ellipses.

The earlier focused suite was insufficient. It checked selected states after seeking, element counts, bounding boxes and a few opacities. Its passing result did not establish first-paint correctness, collision-free orbital motion, continuity or frame pacing.

## Verified findings and implementation obligations

Source locations below refer to `public/assets/v6/phase1-visuals.js` unless otherwise stated. Line numbers refer to the supplied baseline, not proposed new files.

| ID | Severity | Finding and evidence | Required correction |
|---|---|---|---|
| R01 | Release blocker | Lines 184-187 use `win(p, 0, .001, ...)`, returning zero at p=0. Chromium confirmed `.p1-space` opacity 0 and visibility hidden with scrollY=0. | Render a complete static opening at zero scroll; do not tie first visibility to scrolling. |
| R02 | High | Lines 96-105 assign different speeds and opposite directions to documents on the same orbit. Documents 0 and 3 coincide when `0.14 + 0.145t = 1.62 - 0.128t`, at about 5.421 seconds on the animation clock. | One angular velocity and direction per track; fixed phase gaps; no same-track overtaking. |
| R03 | High | Lines 210-223 recompute a pulling card's starting point from current wall-clock orbital position on every frame. Holding the same scroll progress produces different curved-path positions as time changes. | Store the departure state and preserve its tangent. Scrub against a stable geometric trajectory, not a moving start point. |
| R04 | High | Pull windows are .017 long but begin every .0027 of global progress (line 218). Up to seven cards can be in transit together. The old test only checks min/max distance to the sink. | Explicit capture order with one entry at a time; at most two foreground travellers, rather than overlapping most of the fleet. |
| R05 | High | Lines 288-318 morph width, height and a single pixel-valued border radius. Non-square `border-radius:999px` produces capsule-like rounded rectangles, not the intended ellipses. | Replace this representation with real SVG cubic paths / projected ellipses. Do not merely increase corner radii. |
| R06 | High | Lines 321-340 place nodes using separately blended ring/line positions and ellipse equations. Those points do not describe the rendered capsule borders. A desktop fixture estimated node-to-outline mismatches around 6-13 CSS pixels in the completed atom, before a roughly 1px border-centre adjustment. | Evaluate node positions and tangents on the exact current path. |
| R07 | High | `main.js:633-635` calls the whole Phase1 renderer each frame. Its render methods have no inactive-scene early return. Width/height/border-radius and repeated selectors are updated even when the visual is invisible. | Stop inactive work; cache nodes; update only changed values; keep per-frame work to active geometry and transforms. Measure rather than assume performance. |
| R08 | Medium | Orbit motion uses raw `now * .001`. Rendering pauses for the menu/hidden document, but that time origin does not pause. | Maintain a pausable active clock; clamp deltas on resume; preserve phase across menu/visibility/BFCache transitions. |
| R09 | Design-critical | The core is a block Z with multi-stop shiny fill, Gaussian blur, drop shadow, two rings and a luminous centre dot. It differs from the supplied ribbon-shaped brand logo. The atom uses yet another Z: Arial bold. | One cleaned derivative of the supplied brand silhouette for hero, wipe and nucleus. Flat gold by default; no coin frame, glowing centre or font substitution. |
| R10 | Medium | All nine records use the same detailed template. Fold, chip, four rules and tiny node diagram compete at a small projected size. | A restrained document shell, a small set of purposeful interior motifs and compact-detail variants. |
| R11 | Medium | The document layer has z-index 15, the core 18. Per-card z-index changes cannot move a child above the core's separate higher stacking context. | Sort records and foreground/background path arcs in a coherent common depth model. |
| R12 | Medium | Lines 191-195 pulse the orbit element's scale independently of the orbital point equation at 162-174. | Derive both visible orbit and object positions from the same transformed path; no independent breathing of track geometry. |
| R13 | Design-critical | CSS ring colour alpha .18 is multiplied by JS opacity .23 or lower. The first track's effective opacity is about .0414; the outer one about .0167. | Specify final contrast at the composited level; eliminate accidental opacity multiplication. |
| R14 | Medium | The streams use full-screen `viewBox="0 0 1000 700" preserveAspectRatio="none"` and fixed endpoints (505,340), whereas the sink uses independent responsive fractions. | Attach capture geometry to the actual text-side aperture in the shared coordinate system; remove giant decorative funnel guides. |
| R15 | Medium | All captures finish by approximately .0966, before reassembly begins at .101. The scene can be left with a Z, sink and long lines but no useful visible object activity. | End capture in a designed readable settled state; preserve a purposeful consolidation trace rather than accidental empty space. |
| R16 | Medium | Reassembly overrides captured positions with separately timed interpolation from the sink. It has no actual shared staging representation. | Reuse the same record identities and an explicit concealed consolidation point before docking them into the matrix. |
| R17 | Medium | Z core and takeover share the broad anchor, which is good, but they are separate elements with different base sizes (82 vs 88px desktop, 58 vs 64px mobile), pulse and scale schedules. | Keep the correct anchor concept, but use one master path and one measured transform at handover. Avoid double exposure and size discontinuity. |
| R18 | Medium | Final takeover uses `max(38, maxDim/27)` and a separate gold-field crossfade, not a geometric screen-coverage guarantee. | Compute scale from a safe filled region of the actual Z path and the farthest viewport corner. Switch fields only after coverage is established. |
| R19 | Design-critical | Scene 04 has a larger diagram but weak contrast, extra radar lines and tiny captions. It still does not strongly communicate a deliberate system state. | Three prominent structured tracks and nodes, with meaningful spacing, controlled contrast and no unnecessary radar furniture. |
| R20 | Medium | The system caption is 6px desktop and 4.5px mobile. | Remove nonessential pseudo-technical copy; any retained meaningful label must be readable at its actual display size. |
| R21 | High | The atom becomes complete around .232, while its parent starts fading at .225 and finishes at .238. Thus the complete form arrives already substantially faded. | Reserve a short, fully legible atom hold before the Scene 06 handoff. Retiming must retain Scene 06's existing entry boundary. |
| R22 | Medium | A fourth track is made into a nucleus ring while a new central element appears. This can read as object loss rather than transformation. | Proposed R2 simplification: three persistent system tracks become three process lanes and three atom orbits; the existing brand core becomes the nucleus. |
| R23 | Medium | Responsive sizes rely heavily on independent viewport percentages. The decorative root hides overflow. `scrollWidth <= innerWidth` cannot detect clipping of objects inside it. | Define safe visual panels from real text/header/controls; test bounds and intersections for the shapes themselves. |
| R24 | Medium | The document template repeats `id="p1-paper"` nine times. | Use a single symbol/defs registry or per-instance namespaced IDs. |
| R25 | Medium | The phase-one renderer and WebGL renderer share a catch block, but only the WebGL object is disabled on error. A persistent Phase1 error can recur every frame. | Independent engine failure handling and a stable static fallback. |
| R26 | QA-critical | `tests/browser/phase1-regression.py` first seeks to .02, never tests p=0, and accepts an atom based on opacity and track bounding boxes. It never asserts node-to-path fidelity or continuous motion. | Replace smoke-only acceptance with geometry, timing, first-frame, continuity, screenshot, slow/reverse scroll and real-device performance checks. |

## Observations that are not established defects

The faded Scene 02 headline may have been photographed during its exit transition. A screenshot cannot establish that its final reading state is permanently dim. Test the full-opacity hold separately before changing its approved content styling.

The supplied stills do not measure actual frame rate, dropped frames or input latency. Source inspection identifies avoidable work and continuity errors, but claims about measured smoothness require a recording/trace on target hardware.

The existing shared Z centre is broadly correct. R2 should improve its representation and coverage proof rather than discard that successful part.

## Proposed visual direction

An editorial engineering diagram rather than a game collectible: sharp silhouette, flat records, one subtle depth system, deliberate orbital spacing and a clear continuous path transformation. Preserve the deep-gold brand (`#C39438`), dark surface, approved German narrative, navigation and later scenes.

## Evidence

`evidence/baseline-findings.json` records the targeted Chromium and mathematical checks. The browser checks used the in-memory harness because localhost navigation was blocked in this environment. `baseline-at-scroll-zero.png` shows the reproduced empty initial visual. These are not network/CSP or real-GPU certifications.

## Technical references

- SVG path sampling: https://developer.mozilla.org/en-US/docs/Web/API/SVGGeometryElement/getPointAtLength
- SVG coordinate transforms: https://developer.mozilla.org/en-US/docs/Web/API/SVGGraphicsElement/getScreenCTM
- CSS border radii and percentages: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/border-radius
- Animation timestamps and background behavior: https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
