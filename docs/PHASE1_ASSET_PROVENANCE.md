> Historical 6.10.0-phase1.0 note. The current 6.11.0-r2.0 implementation, asset provenance and evidence are in `R2/`. Do not treat the counts or asset claims below as current R2 results.

# Phase 1 asset provenance

The phase began with online research into permissively licensed SVG systems suitable for commercial web use. Lucide and Tabler were reviewed because they provide consistent geometric SVG icon languages under permissive open-source licenses.

References reviewed:
- Lucide `FileText` / `Orbit` families and the Lucide ISC license.
- Tabler Icons' SVG library and MIT license.

The shipped Scenes 01-05 do **not** embed copied third-party icon paths. The final document cards, Z mark used by the phase-one animation, orbit geometry, gravity system, process lines, and atom geometry were authored specifically for this build using elementary SVG/DOM primitives. This keeps the cinematic system visually coherent and avoids a runtime or attribution dependency on an external icon CDN.

The existing ZahlFix logo artwork remains the supplied first-party brand asset and is not replaced by an external logo.
