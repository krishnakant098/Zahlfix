# R6.1 seamless authenticated entry

## Objective
R6.1 removes the remaining visual reset between the PIN gate and Scene 01. The authenticated transition is now one geometry system with three continuous orbit paths, one ribbon-Z nucleus and one explicit ownership handoff.

## Geometry ownership
- The login and homepage load the same `public/assets/entry-orbit.css` and the same normalized 720×520 orbit markup.
- The three future Scene 01 ellipses already exist on the login page. In the idle PIN state those exact paths are compressed vertically into three precision rails.
- After server authentication succeeds, the same paths expand in place around the ribbon Z. The login does not fly an approximate loader to the right.
- Immediately before navigation, `login-transition.js` records the rendered system centre, width and core size in a short-lived session handoff.
- `entry-boot.js` runs in the protected homepage `<head>` before body paint, recreating those exact screen-space bounds and applying `entry-auth-pending` before the loader can render.
- After `Phase1Visuals` has measured Scene 01, `main.js` derives the destination from `phase1.snapshot().layout` (`cx`, `cy`, outer radius, projection and Z size). The shared bridge then moves to that measured anchor.
- Once the bridge arrives, the real Phase 1 vector scene fades in underneath it; the temporary bridge fades out and is retired. No bridge asset persists into later scenes.

## Loading behavior
Authenticated entry has no percentage loader or second logo animation. The orbital transition itself is the loading state. Scene copy is held invisible until the vector renderer is ready, eliminating the intermediate text flash.

Normal direct homepage visits keep the existing short loader.

## PIN input behavior
The PIN remains one accessible four-digit numeric field. The visible interface is four dedicated nodes. The native text caret and I-beam cursor are optically suppressed while the field is active; keyboard input, focus, paste and mobile numeric-keyboard behavior remain intact.

## Security boundaries
- PIN verification remains server authoritative.
- No PIN or session secret is written to sessionStorage.
- The handoff stores only geometry plus a short-lived entry mode marker.
- The secure `__Host-zf_session` cookie, R5.2.1 origin handling, rate limits and strict CSP remain unchanged.
- `entry-orbit.css` and the shared 192px ribbon nucleus are explicitly public in the edge-gate exclusion list because the unauthenticated login page needs them.

## Responsive behavior
The cross-document starting frame is measured rather than inferred from percentages. On the homepage, the target frame uses the same responsive Phase 1 layout that owns Scene 01. Phone, portrait tablet and short landscape therefore land on the actual Scene 01 anchor for that viewport.
