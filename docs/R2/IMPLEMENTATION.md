# Scenes 01-05 R2 implementation

Version: `6.11.0-r2.0` | Baseline: `6.10.0-phase1.0` | Date: 2026-09-09

## Scope

This is one integrated revision of the opening visual system. It consumes the prepared R2 asset kit rather than substituting new stock illustrations. German wording, semantic navigation, later scene content, authentication and enquiry handling remain under the existing baseline. The Scene 06 entrance remains at normalized progress 0.233. Only the Scene 05 end hold is retimed within that existing boundary.

## Implemented workstreams

| Workstream | Implementation |
|---|---|
| First paint | Complete static inline SVG in the HTML before main module initialization; no zero-scroll fade-in dependency. |
| Brand assets | One supplied-logo-derived ribbon Z path, flat gold in the opening, ink in the atom, same path for the takeover. |
| Documents | Six edited Tabler motifs, full and compact variants, instantiated as nine identities. No glow or folded cartoon shells. |
| Orbits | Three shared parametric tracks. Exactly three objects per track, fixed 120-degree phases; periods 42, 101.428 and 176.9638 active seconds. |
| Capture | Stable per-document departure state, quintic Hermite path with matching initial position/velocity/acceleration, controlled acceleration toward the aperture; nine-entry launch order and at most two simultaneous travellers. |
| Matrix | The same objects emerge from the aperture and dock into nine unique positions. |
| Z wipe | Core and takeover use one master path and one SVG coordinate system. Actual screen transform is measured. Conservative filled-region coverage determines scale; the gold field is installed only at completion. |
| Ring-line-atom | Three persistent 32-segment cubic paths. Curvature decreases to an open straight lane, then each lane closes into an ellipse and rotates into an atom plane. |
| Nodes | Arc-length lookup on the same cubic geometry; no independent interpolation between disconnected icons. |
| Motion/lifecycle | Active time pauses on menu, hidden document, pagehide and freeze events; resume resets frame origin and avoids duplicate RAF chains. Narrative motion is scroll-defined and reversible. |
| Isolation/performance | Cached references, attribute-change guards, depth reordering only when needed, inactive/settled phase skips, independent SVG fallback, later WebGL work skipped until its scene. |

The motion is designed kinematics, not a live N-body simulation. Fixed circular tracks projected into ellipses and matched trajectory derivatives provide the intended predictable motion without chaotic collisions.

## Timeline

All values are normalized site scroll progress; they are centrally defined in `phase1-timeline.js`.

| State | Interval |
|---|---|
| Ambient opening / clock handoff | 0.000-0.042 |
| Sequential launch window | Starts 0.058; 0.0043 between launches; 0.0055 flight duration |
| Matrix assembly | Starts 0.101; 0.00125 between entries; 0.009 assembly duration |
| Recognisable Z expansion | 0.136-0.144 |
| Z full-screen coverage | 0.144-0.149 |
| Concentric scene reveal | 0.149-0.156 |
| Ring unrolling | 0.182-0.204 |
| Process-lane reading state | 0.204-0.212 |
| Atom formation | 0.212-0.222 |
| Completed atom hold | 0.222-0.228 |
| Handoff to existing Scene 06 | 0.228-0.233 |

Navigation targets are retained. A Scene 05 navigation jump lands on readable process lanes; further scroll forms the atom. Reverse scroll traverses the same geometric states.

## Responsive geometry

The renderer measures glyph bounds of all five approved statements while temporarily neutralizing their animated transforms. One text-safe hero panel serves Scenes 01-03, so the core and expanding Z cannot diverge because two media queries assigned different anchors. A separate safe panel serves Scenes 04-05.

Narrow and short screens use a rounder projection and compact document details. The mobile aperture is below the combined Scene 02/03 text envelope; capture and reassembly therefore cannot pass through the next statement. The renderer records actual browser measurements for the independent numerical sweeps. Layout is remeasured on viewport/font changes, not each animation frame.

The Z take-over uses the supplied silhouette's conservative interior radius (8.5038 in its 120-unit viewBox) about its actual anchor. Scale covers the farthest viewport corner with a 3% safety margin. Browser tests separately sample the actual SVG fill just before the flat gold handoff; coverage is not inferred merely from a bounding box.

## Geometry/identity continuity

The three system paths keep a consistent cubic topology and coincident endpoints at closed states. The unrolling limit uses a stable sinc evaluation so near-zero curvature does not produce exploding coordinates or a doubled closed border. The atom uses genuine elliptical curves, not CSS border-radius capsules. Near/far subpaths meet without drawing over one another; nodes evaluate the shared master curve.

Orbit document anchors and visible track geometry use the same radii, projection and rotation. A common depth list contains the core and nine documents. It is reordered only when the front/back order actually changes. Document detail remains upright; there is no random wobble or independent ring scale.

Capture departures depend on a frozen ambient handoff time and named scene progress, not the current wall clock. Stopping halfway through capture freezes the same trajectory rather than moving its origin. A quintic Hermite segment preserves incoming first and second derivatives. The mask is on an untransformed ancestor so its aperture remains in viewport coordinates.

## Failure and reduced motion

The renderer can restore its generated static artwork if a runtime SVG error occurs without also disabling navigation or the later WebGL engine. A missing/failed main module selects the existing complete text experience. Reduced-motion users receive all twenty narrative beats in that text experience rather than an accelerated version of the effects.

`freeze`/`resume` and persisted page transition tests inject lifecycle events. They check application behaviour but do not prove native BFCache or OS backgrounding support on every browser. Those remain target-device gates.

## Rebuild and editing

Edit assets in `public/assets/scene-01-05/`, then run `npm run assets:phase1`. The generator rebuilds the named inline SVG section of `public/index.html`. Do not edit the generated section independently. Shared geometry/timing functions are unit-testable without DOM dependencies.

`window.__ZAHLFIX_PHASE1__.snapshot()` is a read-only diagnostics hook containing measured layout, poses, node positions and update-cost samples. It does not provide a mutation/seek API; browser tests use actual document scrolling.

## Preserved boundaries

No authentication files, backend handlers, Netlify configuration, contact module, approved transcript, legal pages, or actual header logo asset are changed. The existing main engine contains only the integration, lifecycle and first-five handoff adjustments. Later effects have not been reauthored. No paid dependency or runtime animation framework was introduced.

The inherited missing reviewed dependency lockfile is still a production release gate. See the root README and existing deployment checklist. This source archive is not a deployment, password rotation, dependency-install certification or legal-content approval.
