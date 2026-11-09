# Runtime asset provenance - R2

Version `6.11.0-r2.0`, assembled from the user's approved 2026-09-08 R2 preparation kit.

## Included assets

`public/assets/scene-01-05/` contains 15 selected SVGs: two Z variants (gold and ink), a restrained capture aperture, and six document motifs in full and compact variants. Their matching inline symbols are generated into the HTML for first paint. The Z takeover is the same master path rather than a second illustration. The orbit/line/atom geometry is constructed by the first-party geometry module, not loaded from a stock icon.

| Runtime motif | Captured source motif | Treatment |
|---|---|---|
| Report | Tabler `file-description` | Interior text motif, rebuilt flat record shell |
| Analytics | Tabler `file-analytics` | Interior bars, same padding and stroke rules |
| Code | Tabler `file-code` | Interior chevrons, same record shell |
| Data | Tabler `file-spreadsheet` | Grid motif, same record shell |
| Workflow | Tabler `schema` | Schema motif, same record shell |
| Approval | Tabler `file-check` | Check motif, same record shell |
| Z | User-supplied ZahlFix raster logo silhouette | Motion-specific vector derivative, not a newly obtained official brand master |
| Aperture and transforming tracks | Custom geometry in the approved preparation kit / R2 implementation | First-party shape construction; no third-party atom path used in the animation |

The preparation kit captured Tabler SVG bodies from the Iconify distribution (declared version 3.46.0). Exact captured SVG bodies, capture method and transformations are retained in **`licenses/PHASE1_R2_ASSET_LEDGER.json`**. The ledger explicitly does not claim a pinned upstream Git commit or a byte-identical raw-SVG download. The release checksum manifest pins the actual files delivered here.

The original file shells/folds were removed; the source motifs were recomposed into a shared 64x88 layout, with a consistent gold/ink/paper palette and compact-detail alternatives. No external SVG fetch, CDN or icon runtime is required.

## Licence

The captured Tabler work is under the MIT licence. **`licenses/TABLER-MIT.txt`** retains the copyright and permission notice. Keep that file when redistributing the source or derived document artwork. The supplied brand artwork remains the user's asset; the motion silhouette is not a claim to third-party trademark rights.

## Scope exclusions

The preparatory satin Z, static atom reference, unused alternate diagrams and asset-review UI are not loaded by the website. Earlier header branding and external photography remain inherited, not relicensed by this change. The more extensive preparation research is preserved in `PREPRODUCTION_ASSET_PROVENANCE.md` as historical context.
