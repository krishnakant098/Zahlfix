# ZahlFix R5.1 verification

Version: 6.14.1-r5.1
Date: 2026-09-09

This report covers the Scene 05 atom-continuity correction and strict Scene 05/06/07/08 visual ownership changes. It distinguishes local source/unit checks, in-memory Chromium rendering, local HTTP preview checks, and native-device boundaries.

## Executed checks

- `npm run check`: PASS. Legacy deployment/content checks, source references/syntax, German narrative checks and 52 Node unit tests passed.
- `tests/browser/scene0609-regression.py`: 111/111 focused checks passed across desktop 1440x900, phone 390x844, small phone 320x568, landscape 844x390 and tablet 768x1024.
- `tests/browser/scene0609-fullstory-smoke.py`: 111/111 checks passed. All 20 reading states remained reachable across the same five layouts, ten service cards remained present, no horizontal overflow was detected and no uncaught browser errors were reported.
- `tests/browser/r4-lifecycle.py`: 46/46 lifecycle, keyboard simulation, fallback, authentication-template and supporting-page checks passed.
- Local preview server: `node tools/serve.mjs` returned HTTP 200 from `http://127.0.0.1:4173/` with the expected local CSP and no authentication in preview mode.
- `tests/browser/r4-regression.py` could not navigate to the local HTTP URL in this execution environment because Chromium HTTP navigation was blocked with `ERR_BLOCKED_BY_ADMINISTRATOR`; this is an environment limitation, not counted as a pass. The repository's in-memory Chromium suites above cover the current scene and responsive behavior.

## R5.1 focused acceptance

- Scene 07 uses the exact approved Scene 05 three-plane atom geometry at zero expansion; unit tests compare sampled points on all three paths.
- Three authoritative tracked planets remain visible in Scene 07.
- Three smaller companion planets are added intentionally to recreate the richer approved atom density without double-rendering Scene 05.
- Scene 05 source SVG is fully retired by the Scene 07 and Scene 08 readable holds.
- Scene 06 document-note layer is fully retired before the Scene 07 readable hold and stays retired in Scene 08.
- Atom-only atmosphere, calibration, framework and registration are suppressed during the Scene 06 string hold.
- The nucleus remains visually consistent through the handoff, is present at controlled strength in Scene 07, and becomes the dominant ZahlFix centre in Scene 08.
- Scene 08 remains fully gold at its reading target.
- The Scene 08-to-09 organising guides retire before the Scene 09 reading hold.
- Reverse scrolling reconstructs the exact Scene 06 string paths.
- No horizontal overflow was detected in any focused profile.

## Environment boundary

Focused browser checks use the repository's in-memory Chromium harness because browser HTTP navigation is blocked in this execution environment. Local HTTP response behavior was checked separately with the included preview server. This does not certify deployed CSP, Netlify authentication, external media, physical iOS Safari, Android browsers, device GPU performance, or mobile keyboard behavior beyond the synthetic lifecycle tests.

An isolated HTTPS staging deployment and physical-device pass remain the final production gates.
