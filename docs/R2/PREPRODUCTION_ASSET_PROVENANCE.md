# Asset sourcing, edits and scope

## Acquisition

The original Tabler repository and MIT license were checked online. Direct raw SVG downloads were not available through this runtime, so the actual vector bodies were captured from the web-readable **Iconify distribution of Tabler Icons**, which declares version **3.46.0**. The exact captured subset is in `upstream/tabler-subset.json`, and equivalent locally wrapped SVGs are in `upstream/tabler/`.

Do not describe those wrappers as byte-identical downloads of the original GitHub SVG files. No upstream Git commit was obtained. The source body snapshot and package hashes preserve the exact geometry used here.

Distribution source: https://raw.githubusercontent.com/iconify/icon-sets/master/json/tabler.json
Official source: https://github.com/tabler/tabler-icons
Official license: https://raw.githubusercontent.com/tabler/tabler-icons/main/LICENSE

## Actual sourced assets

`file-description`, `file-analytics`, `file-code`, `file-spreadsheet`, `schema`, `file-check`, and `atom` were captured. The first six supply the edited document motifs. The atom is a reference only: the animated three-track system must be bespoke to maintain shape identity through unrolling.

The Tabler MIT copyright and permission notice is included in `upstream/tabler/LICENSE.txt`. Preserve it when distributing the adapted assets/source. No paid pack, attribution service, external icon font or runtime CDN is needed for these prepared vectors.

## Edits already made

Six document interior motifs were extracted and recomposed into a shared 64x88 flat document shell. The outer stock file/fold shape was removed. Geometry was resized, relative command starts normalised where necessary, padding and stroke weight harmonised, and palette converted to ZahlFix ink/paper/deep gold. Each document also has a compact version without footer detail. Source identities and specific modifications are recorded in `upstream/ASSET_LEDGER.json`.

The Z uses the opaque outer silhouette of the user-supplied `zahlfix-z-logo.png`. It was simplified into a scalable path, preserving the ribbon-like terminal geometry. Flat gold, ink, white mask and restrained satin variants share exactly the same path. This is a **motion-specific derivative**, not a claim to have obtained an official vector brand master. The header logo remains unchanged.

The orbit layout, capture aperture, curvature-unroll paths, process lines and three-ellipse atom are custom geometry. They are not stock vectors falsely labelled as downloaded assets. The preferred final atom reference has separate near/far arc groups generated from the same three master paths.

## Why a stock full scene was not used

A large stock solar-system or atom illustration would introduce an unrelated style and generally would not have the control-point topology needed for this transition. Small licensed motifs are useful; the motion-bearing tracks need to be authored as a single shared system.

## Runtime selection

There are 27 prepared SVGs, including compact alternatives and intermediate geometry studies. Only the chosen runtime variants and necessary path data should be integrated. The entire preparation pack is not a production asset bundle to copy blindly into `public/`.
