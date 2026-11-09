# Repair plan and implementation status

Baseline: `6.8.2-netlify.login2`. Implemented source: `6.9.0-repair.1`.
This plan tracks the prior design/engineering audit. "Implemented" refers to source and the local evidence described in `qa/VERIFICATION.md`, not automatic production sign-off.

## Sequence

1. Repair navigation, contact access, menu scrolling and timeline ownership. Lock those behaviors with regression tests.
2. Consolidate narrative/navigation configuration, repair typography and separate component CSS ownership.
3. Build a real readable fallback; reduce redundant rendering and define GPU failure/recovery behavior.
4. Harden authentication and add controlled operator recovery without changing live credentials or hosting.
5. Run source/unit/browser checks, document release gates and package verified source with a fresh manifest.

## Audit disposition

| ID | Problem | Implemented repair | Acceptance and remaining boundary |
|---|---|---|---|
| F01 | Contact CTA stops before the form is revealed | Semantic `contact` target lands at the completed hold; destination gets focus | Form effective visibility and reachable controls tested from an unrelated scene, at four viewport sizes |
| F02 | Continue receives no pointer input / lands in a blank transition | Global pointer-enabled button; `nextScene()` uses readable holds; keyboard/pointer paths share navigation | Pointer and keyboard next-scene checks, focus checks and late-story visibility checks |
| F03 | Fixed contact content clips controls/footer | Scrollable contact viewport containing natural-height grid and in-flow footer; single-column narrow layout | Submit, copy and legal navigation reachable at 320x568 and 844x390 as well as larger sizes; real mobile keyboard still needs testing |
| F04 | Mobile service/workflow ownership overlaps | One shared physical scene registry; services release before the workflow owns the screen | Source timeline test and rendered opacity assertions; the wider design retains intentional short transitions |
| F05 | Landscape menu blocks scrolling | Native scrolling on overlay; page underneath locked; focus trap and Escape retained | Wheel scrolling, final destination reachability and Escape tested |
| F06 | Microtype, awkward line breaks, uncontrolled brand colour | Contact typography and line lengths repaired; explicit header themes; service names and short-screen composition revised | Screenshots and computed bounds in local harness; remaining tiny diagrams are decorative, not substitutes for semantic copy |
| F07 | Form suggests submission although it only opens email | Explicit mail-program action, delivery explanation, copy option and direct email | Pure encoding tests and copy interaction; no backend, delivery guarantee, lead database or added data processor |
| F08 | Duplicated scene destinations and component overrides | `scene-registry.js` owns narrative holds/navigation/physical ownership; separate component CSS; superseded selectors removed | Unique ordered scene IDs, valid targets and unchanged approved German copy verified; low-level visual choreography intentionally remains in existing modules |
| F09 | Source-string checks miss real failures | Node unit/handler tests, four-viewport browser regression suite, HTTP-capable CI | Actual local results in `qa/`; restricted harness is not a cloud/CSP test |
| F10 | No-JavaScript loader covers the site | Readable document is the default; module boot is enhancement; loader expires; direct contact remains available | No-JavaScript and reduced-motion paths checked at 320px; `?view=text` is always available |
| F11 | Redundant DOM work, frame-based smoothing, weak GPU lifecycle | Cached selectors/uniforms, dirty updates, active/exit scene groups, delta-time smoothing, context lifecycle | Settled DOM-work assertion passes locally; GPU recovery and performance budgets require real hardware profiling |
| F12 | Weak new-password policy, no controlled recovery, racing failure counter | New-passphrase policy, conditional reservations, request guards, operator rotation and stronger gate validation | Password/handler/concurrency/session tests against a contract double; isolated Netlify QA and operator approval required before real rotation |
| F13 | Node 20 and no reproducible dependency gate | Node 22 setting, Node 22/24 workflow, lockfile requirement and explicit installation instructions | Runtime config implemented. **Lockfile generation and clean SDK installation remain blocked by registry access in this environment.** No fake lockfile included |

## Design improvements included

The scene sequence and visual worlds remain; the repair does not turn the site into an unrelated template. Services now use ten local, coherent technical schematics and functional selection controls. Typography, scene ownership and the contact finish have been corrected first, rather than adding decorative effects.

## Items requiring approval or another environment

- Obtain approved, substantiated project evidence and founder details before adding commercial proof. See `PROOF_CONTENT_BRIEF.md`.
- Verify remaining external photographs and their usage rights; this archive does not bundle those external binaries.
- Generate and review the dependency lockfile on a networked machine, then run the real SDK/Netlify tests.
- Validate hardware-accelerated WebGL, CSP/network delivery, keyboard/assistive technology, iOS/Android native input behavior and real field performance.
- Legal review of the existing terms/privacy/imprint remains an owner responsibility; no legal adequacy certification is made.
- An actual backend enquiry workflow is a separate data-handling decision, not silently added by this repair.
