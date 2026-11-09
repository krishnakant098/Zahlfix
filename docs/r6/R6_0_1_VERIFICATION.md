# ZahlFix R6.0.1 Menu Cursor Hotfix — Verification

Date: 2026-09-09
Version: `6.16.1-r6.0.1`

## Defect fixed

R6 intentionally pauses cinematic scene/world motion while the full-screen menu is open. The viewport-level custom cursor renderer was mistakenly inside that same pause branch. On fine-pointer desktop devices the native cursor was hidden, so the custom cursor remained frozen at its last rendered location (commonly the top-right menu trigger/close control).

R6.0.1 renders the cursor independently from the scene-motion pause. Scene/orbit motion still pauses while the menu is open, but the cursor continues to interpolate toward live pointer coordinates. Pointer-leave now also resets cursor visibility state so pointer re-entry restores the custom cursor.

## Executed checks

- `npm run check` — PASS; 54/54 unit tests passed.
- `python3 tests/browser/r6-login-menu.py` — PASS; 23/23 focused R6 UI checks passed.
  - menu remains interactive while open;
  - custom cursor remains in menu mode/context mode;
  - rendered cursor transform follows a pointer move far away from the menu trigger while scene motion is paused;
  - cursor continues tracking across distant navigation entries;
  - pointer leave hides the cursor and pointer re-entry restores it;
  - Escape closes the menu and restores focus.
- `npm run test:failure` — PASS; 46/46 lifecycle/fallback checks passed, including the existing assertion that opening the menu pauses orbital time.
- `npm run test:fullstory-smoke` — PASS; all 20 scenes remained readable across small, phone, tablet, landscape and desktop profiles with no uncaught browser errors.

## Preservation

No login/PIN behavior, authentication storage, CSP, menu choreography, story copy, Scene 01–09 geometry, contact behavior or production data was changed by this hotfix.

## Browser boundary

Focused browser tests use the project's in-memory Chromium harness. The final source ZIP is additionally extracted and verified against its checksum manifest. Physical browser/device checks remain a deployment/staging responsibility.
