# Dim Sum Atlas

Windows-only open-source Electron gallery for the Hong Kong dim-sum image catalog.

The app browses local catalog metadata and can download missing PNGs from this repository's GitHub Releases into a local cache. Bulk image exports support JSON, CSV, Markdown, plain text, HTML, ZIP, and portable encrypted 7z archives. The public Pages gallery provides the same catalog browsing and multi-format metadata export without requiring installation.

## Layout

- `apps/dim-sum-atlas/` - Electron application source.
- `catalog/` - release manifest and catalog metadata.
- `scripts/` - Windows release packaging helpers.

## Image releases

The image set is released in capped GitHub release volumes because one release cannot hold the full image set. `catalog-v1` contains the first volume, followed by `catalog-v1-part-002`, `catalog-v1-part-003`, and later parts as needed. The uploader caps each volume at 990 assets, leaving headroom below GitHub's 1,000-asset limit. Run `powershell -ExecutionPolicy Bypass -File scripts/package-image-release.ps1 -ImageRoot <path> -Version catalog-v1` on Windows with portable 7-Zip available when packaging encrypted volumes. The script never logs passwords.

The app maps each catalog image to its split release part and caches downloaded images under the Windows app data directory. The verified catalog is growing toward the 4,000-image target.
