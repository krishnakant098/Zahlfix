# ZahlFix R2: one-phase implementation plan

## Objective and boundary

Upgrade Scenes 01-05 from an approximate animation prototype into a coherent, restrained, physically plausible visual sequence. Deliver one integrated release after all workstreams pass acceptance. The workstreams below are the order of work inside that phase, not separate releases.

Keep the current static HTML/CSS/JavaScript foundation. Do not introduce React, a physics engine, an animation dependency or a new hosting service merely for this repair. Preserve approved German narrative text, contact/login behavior, the site header logo, accessibility fallback and Scenes 06-20. Only the Scene 05/06 handoff may need narrowly scoped integration changes.

**Already completed:** source audit, licensed vector capture, document-motif adaptation, brand-silhouette preparation, desktop/mobile orbital layout references, matched path keyframes, static previews and preparation-pack validation.
**Not completed:** production choreography, source integration, deployed testing, final art-direction approval or measured smoothness on the user's hardware.

## Locked R2 design choices

1. Use the supplied ribbon-Z silhouette, not the current block/font glyph. Flat deep gold is primary. A restrained satin alternative is included, without glow or rings. The original header logo is not replaced.
2. Keep nine documents but organise them as three records on each of three tracks. Use three logical tracks throughout Scenes 04-05, producing three atom orbits without deleting a fourth object. This is an explicit simplification of the four-track baseline, not an accidental loss of content.
3. Use actual edited Tabler motifs inside a consistent flat record shell. Six variants are ready. Records remain graphic props rather than tiny unreadable mini-pages.
4. Use one coordinate/projection model for each shared visual stage and one master path per logical track. Records and nodes must use that geometry, not separate approximations.
5. No neon glow, coin framing, orbit breathing, random wobble, giant funnel guides, microscopic technical labels or visible spring overshoot.
6. Motion is art-directed and deterministic. Kepler-inspired circular-orbit periods can establish a believable hierarchy, but this is not a literal N-body or quantum simulation.

## Workstream A - replace the visual primitives and fix first paint

Import the prepared Z silhouette, document variants and SVG geometry. Render a complete Scene 01 visual at p=0; first paint must not require scrolling. Use a single symbol registry or deterministic instance ID prefixes. Provide a composed static fallback if the phase engine cannot initialise.

Consolidate `phase1.css` rather than appending a second override layer. Remove the old core/glow/ring template, duplicated paper gradients, CSS-border atom and unused gravity furniture. Keep a source mapping so the fix is reversible in version control.

**Pass condition:** initial load, refresh-at-top and return-to-top all show the Z, nine records and the orbital tracks before any scroll input. No duplicate SVG IDs or unhandled initialisation errors.

## Workstream B - precise orbital motion and shared clock

### Camera and layout

The supplied geometry profiles are layout references: desktop 720x520, mobile 360x360. In production, fit them into a visual panel whose dimensions come from the rendered headline, header, progress rail and Continue control. Use a less flattened mobile projection instead of squeezing the desktop system.

All tracks are projected circular orbits from the same plane. Their screen ellipses and record anchors share the same camera transform. Three records on a track have fixed 120-degree phase separation, one angular velocity and one direction. Outer tracks have longer periods; the reference periods are derived from `T(r) = 42 * (r / 115)^1.5` seconds.

Treat those periods as a tuning starting point. The preparation pack validates non-overlap for its unbanked canonical layouts, not for every later camera effect. Keep banks small and never move a record away from its track to hide a collision.

### Time model

Retain the existing delta-time-based scroll convergence, but remove the independent wall-clock trajectory starts. Maintain a pausable active clock for the ambient opening. When entering the narrative, capture a departure phase and transition into a scroll-driven master time; preserve it for the forward/reverse traversal.

Deep links/direct scene jumps use a deterministic authored seed. Returning across the handoff must land on the stored orbital phase before ambient motion resumes. Resizing changes the projection, not the object's logical orbital angle. Menus, hidden tabs and BFCache restoration must not accumulate a large phase jump.

Depth-sort visible record planes and split foreground/background orbit arcs using the same depth value. Keep the Z upright; cards can be camera-facing with a very small velocity-related bank, rather than tumbling like playing cards.

**Pass condition:** no same-track catches; no unintended record/record or record/text overlaps in the tested loop; anchor-to-visible-path error at most 0.75 CSS pixel; equivalent trajectories at 60 and 120Hz simulations.

## Workstream C - capture and implementation choreography

Scene 02's aperture is a text-edge destination, not a second bright astronomical core. Place it from actual headline geometry: beside the text on desktop, beneath the final line on narrow screens. Keep the trajectory outside the glyph safe area until deliberate occlusion.

Give each record a known launch order, launch position and launch velocity. Use tangent-matched cubic/quintic segments to redirect the orbital trajectory toward the aperture. Preserve position and tangent; use a continuous acceleration profile at transitions. Do not recalculate an earlier point from the current clock.

One record crosses the aperture at a time; allow no more than two foreground travellers. Remaining records stay on their true paths. Increase apparent attraction as a record approaches the aperture, then hide it behind a mask before any terminal stop. No rubber-band bounce, random rotations or premature fade halfway through the path. Optional trails must come from the actual trajectory and remain subordinate.

Maintain a designed consolidated state when capture finishes. In Scene 03, reuse the same records from the concealed staging point and dock them into the existing 3x3 matrix in a clear order. The user should perceive a transformation of the same information, not a new set of icons.

**Pass condition:** nine identities conserved; launch order deterministic; one aperture crossing at a time; reverse scrubbing reconstructs the same poses; no moving-start-point drift during a paused transition; no unexplained empty hold.

## Workstream D - one Z becomes the background

The hero core, takeover and atom nucleus use the exact path from `geometry/z-master.json`. Keep a single authoritative anchor. Read the current local-to-screen matrix with `getScreenCTM()` or an equivalent measured coordinate transform, once per relevant layout change. Do not maintain separate desktop/mobile origins for the visible core and the wipe.

At takeover, replace neither the shape nor its size: begin from the core's exact current transform. Remove the pulse before this handover. Scale the crisp path, not a filtered bitmap. The prepared anchor is inside the solid diagonal and has a conservative safe fill radius. Calculate sufficient coverage as the farthest viewport-corner distance divided by the transformed safe radius, with a margin. Verify that all viewport corners lie inside the safe filled region before settling to the plain gold field.

Header theme changes should follow the actual local background state, not an unrelated early global threshold. Maintain a clear reading interval for the Scene 03 copy before it gives way.

**Pass condition:** core/takeover displacement below 1 CSS pixel on all supported viewports and after resize; no double Z, circular reveal, visible black corner or mismatched gold during the field handoff.

## Workstream E - rings become lanes, then a higher-quality atom

### Scene 04

Present three clearly legible concentric paths and three nodes. Use the prepared dark-on-gold stroke system. Remove radar ticks and pseudo-technical captions unless they earn a clear semantic role. This state expresses that an organised vision exists; the subsequent lane state shifts emphasis to the operating processes.

### Unrolling

Use the same three path objects throughout. A circle is represented as an open path with coincident endpoints; the endpoints separate at a controlled seam as it unrolls. This avoids collapsing a closed outline onto itself and doubling its stroke.

The reference curvature model reduces the swept angle from 2*pi toward zero while converging path length to the lane length. Center it within the visual panel. Nodes are evaluated on the current path, with a consistent arc-length parameter and controlled retiming when path length changes. Cache geometry/tables when possible rather than resampling the DOM many times per frame.

The prepared `morph-keyframes.json` uses 32 cubic segments per track. Ring, unrolling, line and atom fixtures all share command topology. The preview's linear atom interpolation is deliberately a geometry stress fixture, NOT the final motion prescription.

### Atom formation

Keep a readable process-lane hold at the existing Scene 05 target (.21). Curl the three lanes into their projected elliptical planes using a continuous arc construction, then rotate the planes into place. Keep the node identity and sampled path relationship throughout. Use a shared shallow camera and near/far arc hierarchy, rather than spinning the whole diagram or building three capsules.

Use the prepared `system-atom-depth.svg` as the final art-direction reference. The same Z returns as the nucleus; no Arial glyph or new glowing badge. An atom is a systems metaphor here, not a literal model of electron trajectories.

Retiming draft inside the existing first-five-scene window: line hold through about .212, atom formation .212-.222, fully legible atom .222-.228, exit .228-.233. Validate this against the existing Scene 05 text and keep Scene 06's .233 entry boundary. Do not move later scenes merely to make the atom fit. Reverse motion must use the same state function.

**Pass condition:** three track and node identities persist; node-to-stroke error below 0.75 CSS pixel; no pinching, doubled-back stroke, accidental path popping or delayed low-opacity final atom. The final atom must be clearly visible before the handoff.

## Workstream F - integration, QA and one release package

### Planned source touchpoints

| File / area | Planned work |
|---|---|
| `public/assets/v6/phase1-visuals.js` | Replace approximate motion/state implementation; active-scene early exits and independent failure handling. |
| `public/assets/v6/phase1.css` | Consolidate styling, safe panels, contrast, static fallback, no glow/capsule remnants. |
| New `phase1-geometry.js` / `phase1-timeline.js` | Pure geometry and timing data; no direct DOM access in geometry functions. |
| `main.js` | Minimal clock, lifecycle, field/theme and renderer integration; keep later scenes intact. |
| `scene-registry.js` | Share named holds/handoffs; constrain internal Phase1 timing to the existing Scene 06 boundary. |
| `index.html` / boot path | Reliable initial visual and symbol/fallback setup, only as necessary. |
| `public/assets/scene-01-05/` | Approved subset of this kit; do not ship unused studies or upstream references as runtime payload. |
| Tests and docs | Geometry/continuity tests, first-frame regression, real browser traces, source notices and a final change log. |

### Acceptance matrix

Test 1440x900 and the user's approximately 1666x820 content viewport, 1920x1080, 390x844, 320x568, tablet portrait and 844x390 landscape. Validate device pixel ratios 1 and 2, resize/orientation changes, 200% zoom, keyboard/direct navigation and reduced motion.

Run initial-load tests at p=0 rather than seeking past it. Test slow scrolling, fast flicks, reverse scrubbing, abrupt scene jumps and holding the scroll midway through every transformation. Test 60 seconds of ambient motion and simulated timing at 60/120Hz. Exercise menu/visibility pause and BFCache return.

Measure individual SVG/card bounds; page `scrollWidth` alone is not an overflow test. Check intersections with the actual text/control safe zones. Assert ID uniqueness, node-path fidelity, same-core wipe anchoring, object count and target hold opacity. Capture start/middle/end and several in-between frames for each transformation.

On a representative 60Hz device, target p95 frame intervals at or below about 20ms and no repeatable visible hitches during normal scrolling; record the hardware and trace. Treat a roughly 4ms p95 main-thread Phase1 update budget as an initial target, not a result already achieved. Profile mobile separately; remove decorative work before dropping object/path fidelity.

Reduced motion uses composed static states and direct readable navigation, not accelerated dramatic motion. Separate Phase1 failure from WebGL failure and keep a readable static visual if either engine fails.

Finally, rerun the later-scene, contact, navigation, content and authentication unit regressions. Produce one complete source ZIP with the selected assets, notices, lock/build status, change inventory, test evidence and integrity manifest. Do not deploy or reset credentials as part of this scoped change.

## Definition of done

The work is finished only when the visual review and continuous-motion checks pass together. Element counts, a screenshot of one checkpoint or a large passing-test total alone are not evidence of cinematic quality.
