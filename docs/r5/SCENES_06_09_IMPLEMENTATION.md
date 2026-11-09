# ZahlFix R5 - Scenes 06-09 implementation

Version: 6.14.1-r5.1
Date: 2026-09-09
Baseline: 6.13.0-r4.0

## Implemented narrative system

The approved Scene 05 atom is the source geometry for the next sequence. R5 does not swap in an unrelated visual at the boundary.

1. Scene 06 / REIBUNG
   - The three Scene 05 atom paths open and straighten into three parallel tensioned strings.
   - Three representative existing document motifs become note-like attachments to those strings.
   - Each document is sampled from the exact path being drawn and follows local curve angle.
   - Recoil is deterministic, staggered, damped and driven by narrative progress, so reverse scrolling reconstructs the same curve.
   - The atom nucleus exits as the strings resolve; no unexplained centre object remains in the Scene 06 hold.

2. Scene 07 / FRAGE
   - The same three strings close back into the exact approved Scene 05 three-plane atom geometry.
   - The three tracked bead identities remain authoritative and move slowly along their own paths.
   - Three smaller companion planets intentionally recreate the richer Scene 05 orbital density without double-rendering the outgoing scene.
   - The ribbon Z remains visible at a controlled intermediate strength, then becomes the dominant centre in Scene 08.
   - Source Scene 05, Scene 06 note layers and atom-only decoration have explicit ownership windows so previous assets are retired before the next readable hold.

3. Scene 08 / ZAHLFIX
   - The complete hybrid system expands rather than spawning a new illustration.
   - The supplied ribbon Z returns as the clear nucleus and is paired with a restrained ZAHLFIX system label.
   - The Scene 08 reading target stays on uninterrupted deep gold.

4. Scene 09 / ANSATZ
   - On Scene 08 exit the three orbital paths resolve into two horizontal organising guides and one vertical guide.
   - The paper surface now reveals during this exit, not during Scene 08's readable hold.
   - Those three guides are only transition structure. They do not pretend to map one-to-one to the ten service capabilities.
   - The existing ten service cards, diagrams, controls and Scene 09-to-10 Automation handoff remain the implementation authority.

## Internal two-phase implementation

Phase A implemented Scene 05 -> 06 -> 07 continuity, string deformation, document-note attachments, hybrid orbit geometry and responsive placement.

Phase B implemented Scene 07 -> 08 -> 09 continuity, ribbon-Z emphasis, branded hold, delayed paper reveal, service guides and service-grid settlement.

Both phases are delivered together in this complete source package.

## Files added

- `public/assets/v6/scene0609-geometry.js` - pure cubic geometry, string recoil, hybrid and service-guide curves.
- `public/assets/v6/scene0609-visuals.js` - runtime rendering and object continuity.
- `public/assets/v6/scene0609.css` - small presentation/fallback layer.
- `tests/unit/scene0609.test.mjs` - topology and physics-oriented unit tests.
- `tests/browser/scene0609-regression.py` - focused five-profile browser acceptance.
- `tests/browser/scene0609-fullstory-smoke.py` - fast all-20-scene regression.

## Files intentionally preserved

- German narrative and story registry timing remain unchanged.
- Scenes 01-05 R4/R3 source geometry and ribbon transition remain unchanged.
- Authentication, Netlify functions, contact implementation and legal pages remain unchanged.
- Ten Scene 09 service cards and their diagrams remain unchanged.

## Fallback

The previous challenge visual remains in the DOM. It is suppressed only after the R5 visual bridge has successfully initialized (`html.p2-ready`). If R5 initialization fails, the new SVG group is removed and the legacy readable composition is available again.
