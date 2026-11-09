> Historical 6.10.0-phase1.0 note. The current 6.11.0-r2.0 implementation, asset provenance and evidence are in `R2/`. Do not treat the counts or asset claims below as current R2 results.

# Phase 1 QA

## Executed checks

- `npm run check` - passed before packaging after the phase-one integration.
- `python3 tests/browser/phase1-regression.py` using system Chromium - 53 passed, 0 failed.
- Representative screenshots were captured at the main hold/transition checkpoints for desktop and mobile under `qa/phase1/` and `qa/phase1-check/`.

## Focused browser coverage

Viewports:
- 1440x900 desktop
- 390x844 mobile
- 320x568 small mobile
- 844x390 landscape

Behavior verified:
- Scene 01 document/orbit count and Z visibility
- Scene 02 gravity sink and staggered pull
- Scene 03 3x3 document reassembly
- exact shared Z expansion origin
- recognizable Z before full-screen flood
- Scene 04 concentric track state
- Scene 05 line state
- Scene 05 atom exit state
- no horizontal overflow from the new visual layer
- no uncaught browser errors in the focused phase-one run

## Boundary

The focused test runs through the in-memory local browser harness. It verifies real Chromium layout/animation behavior but does not certify Netlify authentication, production CSP/network behavior, external photography, or real-device GPU characteristics. Those remain staging/device release checks.
