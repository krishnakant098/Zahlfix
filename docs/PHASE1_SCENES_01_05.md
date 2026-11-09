> Historical 6.10.0-phase1.0 note. The current 6.11.0-r2.0 implementation, asset provenance and evidence are in `R2/`. Do not treat the counts or asset claims below as current R2 results.

# Cinematic Phase 1 - Scenes 01-05

Release: `6.10.0-phase1.0`  
Date: 2026-09-08

This phase redesigns the visual system for story beats 01-05 while preserving the approved German copy, scene timings, navigation destinations, deep-gold brand palette, and all later website scenes.

## Visual continuity

Scenes 01-05 now share one responsive visual coordinate system. The Z core is the same anchor used for the document solar system and for the Scene 03 takeover, so the expansion always originates from the visible Z location on each viewport.

### Scene 01 - System in orbit
- Nine high-detail document objects orbit four mathematically defined elliptical paths.
- Documents use depth-based scale and z-order, but their motion remains deterministic rather than random.
- The central object is a gold Z, not a circular sun.

### Scene 02 - Gravity / consolidation
- Documents leave their orbits one by one using staggered quadratic paths.
- A restrained gravity sink and three directional field lines make the pull legible without turning the scene into a science-fiction effect.
- The sequence deliberately keeps some objects in transit while earlier ones are already near the sink.

### Scene 03 - Recomposition / implementation
- The collapsed documents rebuild into a disciplined 3x3 implementation matrix.
- The Z remains at the exact system anchor.
- During Scene 03 exit, the Z first enlarges as a recognizable Z and then accelerates into a full deep-gold field wipe.

### Scene 04 - Structure
- Four concentric tracks are now visually prominent.
- Every track has its own node/planet.
- Crosshair/radar geometry and a small system caption add structure without competing with the headline.

### Scene 05 - Process transformation
- The same four Scene 04 tracks flatten continuously into process lines.
- Their nodes remain attached throughout the change.
- On Scene 05 exit, three lines reform as intersecting electron paths and the fourth collapses into the nucleus, producing an atom-like system with a Z core.

## Implementation files

- `public/assets/v6/phase1-visuals.js` - animation geometry, responsive anchor, document sequencing, Z takeover, orbit/line/atom transform.
- `public/assets/v6/phase1.css` - vector/document styling and phase-one visual presentation.
- `public/assets/v6/main.js` - integrates the phase-one renderer and replaces the old circular yellow-field reveal.
- `public/assets/v6/webgl-world.js` - early duplicate document rendering disabled; later WebGL worlds remain unchanged.
- `tests/browser/phase1-regression.py` - focused acceptance test for Scenes 01-05.

## Acceptance criteria

1. Nine document objects and four orbit tracks exist.
2. Scene 01 Z is visible and replaces the old sun.
3. Scene 02 has a staggered pull with objects at materially different distances from the sink during the hold.
4. Scene 03 reassembles all nine documents.
5. Z takeover center and Z core center remain within 2 CSS pixels at the expansion checkpoint.
6. Scene 04 exposes four prominent tracks.
7. Scene 05 turns all tracks into lines at its readable hold.
8. Scene 05 exit exposes an atom state.
9. No horizontal overflow is introduced on desktop, mobile, small-mobile, or landscape test viewports.
