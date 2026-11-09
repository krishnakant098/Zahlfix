> **R6.1 note:** The authenticated-entry geometry described below was superseded by the pixel-measured shared-orbit handoff in `R6_1_SEAMLESS_ENTRY.md`. Menu architecture remains current.

# R6 login and navigation continuity

## Objective
R6 makes the protected-entry experience part of the same visual system as the cinematic homepage. The login remains a server-authenticated four-digit PIN gate, but the successful visual state now becomes the homepage's orbital loading state instead of resetting to an unrelated loader.

## Authentication sequence
1. `GET /login` renders one accessible numeric PIN input and three transformable rails.
2. With JavaScript unavailable, the form retains the normal POST -> `303` -> protected page behavior.
3. With local `login-transition.js` available, the form POST asks for JSON with `X-ZahlFix-Transition: orbit-v1`.
4. The Netlify function verifies the PIN and rate limits exactly as before. Only a successful request receives JSON plus the `__Host-zf_session` cookie.
5. The login page then enters its authenticated orbital state and preloads only critical same-origin homepage assets.
6. A short-lived `sessionStorage` handoff tells the homepage loader to start from the matching orbital frame. It is consumed once and deleted.

The success animation never runs before the server confirms authentication.

## Request security
Chrome may emit `Origin: null` for this installation. R5.2.1 already accepted that value only for a verified same-origin top-level POST navigation. R6 adds a second narrowly scoped exception for the enhanced fetch: POST + `Sec-Fetch-Site: same-origin` + `X-ZahlFix-Transition: orbit-v1` + same-origin/CORS fetch mode. Cross-site requests are rejected before these exceptions are evaluated.

## Menu system
The menu is `hidden` in HTML and translated above the viewport in CSS before JavaScript initializes. Opening removes `hidden`, then applies `is-open` on a subsequent frame so the top-deploy transition is visible. Closing reverses the panel and only then returns it to `hidden`/`inert`. An epoch/timer guard prevents rapid toggles from leaving stale state.

The custom cursor is a single global viewport layer. On fine-pointer devices it remains above the menu and receives contextual labels from `data-cursor`. It is disabled on touch layouts. Keyboard focus indicators and Escape-to-close remain independent of the decorative cursor.

## Responsive behavior
Desktop, portrait phone and short-landscape login states use distinct geometry. The mobile PIN field retains `inputmode=numeric`, the success core remains within the viewport, and reduced-motion users receive the same authenticated handoff with substantially reduced spatial motion.
