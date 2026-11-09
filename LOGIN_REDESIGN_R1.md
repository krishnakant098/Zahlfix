# ZahlFix Login Redesign R1

## Direction
The uploaded private-access screen was used as art-direction inspiration, not copied. The ZahlFix implementation keeps its strongest visual ideas: dark editorial space, precise gold geometry, centered hierarchy, restrained ornament, and a single obvious access action.

## ZahlFix-specific improvements
- German-only production copy.
- Real ZahlFix Z mark and deep-gold palette.
- `zahlfix.com` is the primary lockup.
- No invitation-code or LinkedIn controls because those flows do not exist in the ZahlFix security model.
- Existing server-side password POST, safe return destination, rate limiting, HttpOnly session cookie, and Netlify setup flow remain untouched.
- Strong keyboard focus, error treatment, autofill handling, responsive composition, and reduced-motion behavior.
- Setup page remains functionally and visually separate so first-run configuration cannot be confused with normal visitor login.

## Visual system
- Black/charcoal textured field created in CSS.
- Fine architectural frame, crosshair details, center axes, and concentric orbital geometry.
- Deep gold #C39438 with champagne #E3C57E.
- Minimal password field with a directional arrow action.
