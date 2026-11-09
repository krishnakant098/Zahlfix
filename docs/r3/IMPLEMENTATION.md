# R3 Gold Observatory - implementation notes

Release: **6.12.0-r3.0**  
Date: 2026-09-09  
Parent: supplied **6.11.0-r2.0** source archive

## Scope

The approved R3 direction is integrated into Scenes 01-05. The new artwork is authored as layered SVG. The supplied v8 PNG was used as a style reference, not embedded as scene artwork or misrepresented as original editable SVG masters. The reference's literal Berlin, satellite and support illustrations have not been inserted into unrelated opening scenes.

This is a presentation and asset revision on the repaired R2 engine. The geometric/timing modules, main application controller, later WebGL worlds, German narrative, navigation, enquiry behavior and authentication are retained. See `PRESERVATION.json` for byte-level checks against the input ZIP.

## What is implemented

### Materials

`public/assets/v6/phase1-materials.js` owns named, shared SVG material definitions: satin gold, dark gold sidewall, ink/brass, warm paper, gold beads, local atmosphere and engraved rails. Lighting consistently reads from the upper left. All effects use ordinary linear/radial gradient fills and strokes; there are no SVG blur/filter chains and no added rendering framework or network dependency.

The Z remains the supplied-logo-derived R2 silhouette. The hero uses a shallow side edge, a metallic face, clipped fine brush marks and a restrained local halo. The gold-scene nucleus uses ink/brass. The header logo is unchanged. The takeover references the same master silhouette and measured anchor; face detail dissolves to plain brand gold before it could become an oversized bevel or light band. The halo recedes before the handover.

The six Tabler-derived semantic document motifs remain inside a redesigned ivory plate. Sidewall, top rule, gold accent, internal padding and full/compact variants preserve readability within the same 64 x 88 object envelope. The licence and motif attribution ledger are retained. A narrow docking edge catch is scroll-deterministic and does not create an independent animation timer.

### Scene 01

The exact three orbital tracks and nine document identities remain. One subordinate, broken calibration perimeter, selective near-arc highlights, sparse static points and a local charcoal-blue atmosphere turn the opening into an instrument-like composition. Main tracks and all document positions still share the same numerical geometry. Within-track spacing and orbit periods were not changed.

### Scene 02

The aperture now has an elliptical shaded rim and a deeper inner well. Its document mask is sized to the same inner aperture geometry. Its placement remains measured relative to the actual heading. Documents retain the existing sequential capture, stable departure trajectories and at most two travellers. A subdued nine-mark accumulation cue resolves the capture state. No decorative full-screen funnel was introduced.

### Scene 03

The implementation matrix gains a measured module frame, corner brackets, short docking contacts and one connection to the Z. A single travelling connection highlight is tied to scroll progress. The nine document positions themselves are unchanged. Module furniture is generated around those actual positions rather than aligned to an independently designed illustration.

### Scenes 04-05

The master ring/line/atom paths remain the R2 cubic curves. Each track is subdivided into material sections; the rail body, inset edge and light catch use identical section geometry. Material sections, beads and nucleus are sorted through a shared projected-depth approximation. This is deliberately a layered vector rendering, not a physically simulated 3D ray-tracing system.

The three circles receive dimensional beads and a restrained calibration border. Decoration recedes while paths unroll, terminals appear only at the resolved rail state, and the final atom uses a larger dimensional Z nucleus. Secondary construction detail returns only after the atom resolves. The fully formed hold and Scene 06 boundary remain unchanged. No autonomous spinning or flashing was added to the final atom.

## Architecture / editable files

- `phase1-materials.js`: material definitions and core/document/aperture source layers.
- `phase1-artwork.js`: decorative instrument geometry, bead layers and static artwork composition.
- `phase1-visuals.js`: measured layout and material integration into the retained geometry/clock.
- `phase1.css`: material styling and compact detail suppression; R2 typography preserved.
- `tools/lib/document-motifs.json`: retained Tabler interior motifs; their paths are unchanged.
- `tools/build-phase1-assets.mjs`: reproducible SVG and inline-stage generator.
- `public/assets/scene-01-05/`: selected generated SVGs plus inherited R2 source resources.

After editing the source material functions, run:

```bash
npm run assets:phase1
npm run check
```

The generator updates only the delimited `PHASE1_STAGE_START` / `PHASE1_STAGE_END` block in `public/index.html`. It also writes 21 selected standalone R3 SVGs. The rest of the document is not separately hand-maintained. Decorative assets have no business-content or accessibility role; the approved semantic narrative remains the authority.

## Responsive and fallback behavior

Fine brush/engraving/star detail is suppressed on narrow screens. Primary materials, symbols, visible tracks and nodes are retained. Full and compact document variants have the same bounds. The existing reduced-motion text presentation remains unchanged. Static initial SVG artwork remains present before the renderer starts and is restored on an isolated Phase 1 failure.

## Verification boundary

Read `VERIFICATION.md` for executed checks. Headless tests use the actual source embedded in an in-memory document because browser HTTP navigation is blocked by the execution environment. This is not a Netlify/CSP, native mobile GPU, Safari, or real BFCache certification. The actual local Node server was separately exercised through HTTP. No deployment or authentication/DNS/email mutation was performed.
