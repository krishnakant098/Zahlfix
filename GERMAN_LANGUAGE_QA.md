# ZahlFix v6 — German Language QA R1

This pass reviews the German language used by the production Netlify package without changing the visual architecture or authentication behavior.

## Scope checked

- 20-scene main narrative and hidden accessibility transcript
- navigation and permanent calls to action
- service/capability tiles and technical visual labels
- workflow, software, AI, support and principles microcopy
- contact form, validation/status copy and footer
- login and first-time setup pages
- Impressum, Datenschutz and AGB language
- accessibility labels and local-preview notice

## Main corrections

- Scene 4 standardized to the idiomatic `Fortschritt scheitert selten an mangelnder Vision.` and made consistent with the accessibility transcript.
- Scene 13 clarified to `Nicht für irgendein Unternehmen. Sondern für Ihr Unternehmen.`
- Remaining public-facing English design labels were Germanized where a clear German equivalent exists, while established technical terms such as `Go-live`, `Support`, `HttpOnly`, `SameSite` and Netlify product names remain intact.
- `E-Mail-Adresse` spelling is consistently retained.
- Awkward compounds and labels such as `ZahlFix Website-Inhalte`, `Herausforderung-Formular`, `Netlify Setup-Schlüssel` and the previous implementation-system labels were corrected.
- Login/setup wording was polished without altering authentication logic.
- Datenschutz section 3 was corrected to describe the Netlify implementation accurately: session cookie attributes, hashed-IP rate state in Netlify Blobs, and infrastructure rate limiting.
- AGB wording in the confidentiality clause was grammatically corrected.

## Important legal note

The language of Impressum, Datenschutz and AGB has been proofread for German grammar and consistency. This is not a legal review. The legal substance should still be approved by qualified German legal/privacy counsel before public launch.

## Regression gate

`npm run build` now runs both the existing Netlify predeploy checks and `tools/german-language-check.mjs`, which prevents the known language regressions from returning unnoticed.
