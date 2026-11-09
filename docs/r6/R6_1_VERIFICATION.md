# R6.1 verification — 2026-09-09

## Executed checks
- `npm run check`: source/deployment checks + 54 unit tests.
- `python3 tests/browser/r61-entry.py`: 13/13 authenticated-entry continuity checks.
- `python3 tests/browser/r61-responsive.py`: 9/9 responsive bridge checks across phone, portrait tablet and short landscape.
- `python3 tests/browser/r6-login-menu.py`: 23/23 R6 login/menu/cursor checks.
- `python3 tests/browser/r4-lifecycle.py`: 46/46 lifecycle/fallback/login/legal checks.
- `python3 tests/browser/scene0609-fullstory-smoke.py`: all 20 scenes readable across small, phone, tablet, landscape and desktop; no uncaught browser errors.

## R6.1-specific assertions
- Login and homepage use exactly three shared orbit elements.
- PIN input has transparent caret and a non-I-beam cursor treatment.
- The same shared orbit system expands only after a successful server response.
- Login handoff geometry is captured from rendered pixels.
- Homepage first-frame CSS variables reproduce the captured login geometry.
- Authenticated entry suppresses the old percentage loader.
- Scene typography is prevented from flashing during bridge travel.
- The bridge arrives within a few pixels of the measured Phase 1 centre and matches the outer Scene 01 diameter.
- Temporary entry ownership is removed after the handoff and the real Phase 1 renderer remains visible.
- Responsive target matching passes on 390×844, 768×1024 and 844×390.

## Environment limitation
The browser harness cannot perform a real network navigation between `/login` and `/` in this environment. The cross-document seam is therefore tested by reproducing the exact stored screen-space handoff in a second document and then installing the real homepage boot module. A Netlify Deploy Preview remains the final staging check for the actual protected navigation boundary.
