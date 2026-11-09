# Deployment checklist - cinematic R2 release

This document retains the inherited repair gates and applies to version 6.11.0-r2.0. No production deployment was performed. Current opening-scene verification is documented separately in docs/R2/VERIFICATION.md; it does not close the native-device and cloud gates below.

## Gate 1: dependencies and bundling (not completed here)

On a trusted networked machine, use Node 22, confirm `@netlify/blobs@11.0.2` is obtainable, run `npm run lock`, review/commit the generated lockfile, and run `npm ci --ignore-scripts`. If the inherited version is unavailable, stop and resolve the version deliberately against the official registry; do not invent metadata or silently downgrade.

Run `npm run check`, the GitHub workflow and a real Netlify build. Verify the runtime Netlify actually selects for Functions as well as the build setting. The CI jobs target Node 22 and 24, but only the installed local Node runtime was exercised during this handoff.

## Gate 2: isolated Netlify QA (not completed here)

Use a separate site, not the production site's shared store. Confirm setup is initially protected, new short passwords are rejected, a valid setup closes the route, correct/incorrect logins work, rate limiting is concurrency-safe, and logout/expired/rotated/malformed sessions behave correctly.

Verify that HTML, assets and legal pages remain gated, cookies retain their attributes, no private response is public-cacheable, and a real SDK/storage outage fails closed. Exercise rotation only on the isolated site before approving a production operation.

## Gate 3: browser and visual acceptance

Run the included suite over real HTTP, not only the embedded harness. Open the isolated deployment in current Chrome/Edge, Firefox and Safari. Cover desktop, 390x844, 320x568, 844x390, touch input, 200%/400% zoom and font scaling.

For R2, also run the focused phase1 regression, geometry, capture and continuous-motion checks. Inspect the zero-scroll artwork, exact Z reveal, all ring/line/atom intermediate states, and no initial visual jump.

Check every narrative hold, Continue with pointer/keyboard, menu scroll/focus/Escape, contact inputs with the native mobile keyboard open, service control activation, reverse scrolling and orientation changes. Verify no essential information relies on tiny diagram text. Test the Textansicht link, reduced motion, JavaScript disabled and module-loading failure.

Check the production CSP and real asset requests. Ten service schematics are self-hosted; remaining original photography is external and must load under the actual policy.

## Gate 4: native-device GPU and field performance (still open)

R2 includes headless SVG timing observations, not a native-device or production field measurement. Test hardware WebGL2 on representative mid-range mobile devices, no-WebGL fallback, context loss/restoration, background/foreground transitions and prolonged scrolling. Use DevTools traces and real-user monitoring before making performance claims.

Record representative lab traces and real field Core Web Vitals after launch. LCP <=2.5s, INP <=200ms and CLS <=0.1 are targets, not reported outcomes from the local harness.

## Gate 5: content, privacy and email

Review the unchanged legal documents with the responsible adviser. Confirm contact details and external-image rights. The form only composes an email; test supported email handlers and copy fallback. Never describe this implementation as a server-submitted or delivered enquiry.

Publish project proof only after fact checking and authorisation. Do not add customer logos, quantified results or biographies from assumptions.

## Gate 6: approval and production

Obtain sign-off on the isolated deployment and the exact reviewed commit. Preserve the original deploy as a rollback target. Do not modify existing United Domains MX, SPF, DKIM, DMARC or other email records. This repair does not require a DNS migration.

Promote the approved source using the existing deployment process. A production password rotation is a separate authorised action. Verify anonymously and in a fresh private window after promotion; monitor operational failures rather than treating a build success as acceptance.

## Primary references used for implementation decisions

- Netlify Blobs and conditional writes: https://docs.netlify.com/build/data-and-storage/netlify-blobs/
- Netlify Functions API: https://docs.netlify.com/build/functions/api/
- Netlify rate limiting: https://docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting/
- Node support lifecycle: https://nodejs.org/en/about/eol
- OWASP authentication guidance: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- Core Web Vitals definitions: https://web.dev/articles/vitals

Provider behavior must be checked again at deployment time. References are not evidence that the actual deployment was tested here.
