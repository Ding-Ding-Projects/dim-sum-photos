# Dim Sum Atlas

Windows-only open-source Electron gallery for the Hong Kong dim-sum image catalog.

The app browses local catalog metadata and can download missing PNGs from this repository's GitHub Releases into a local cache. Bulk image exports support metadata manifests, ZIP, and portable 7z archives with optional encryption.

## Layout

- `apps/dim-sum-atlas/` - Electron application source.
- `catalog/` - release manifest and catalog metadata.
- `scripts/` - Windows release packaging helpers.

## Image releases

The image set is released as encrypted, split 7z volumes when needed. Run `powershell -ExecutionPolicy Bypass -File scripts/package-image-release.ps1 -ImageRoot <path> -Version catalog-v1` on Windows with portable 7-Zip available. The script never logs passwords.

The app expects release assets at `catalog-v1` and caches downloaded images under the Windows app data directory.
