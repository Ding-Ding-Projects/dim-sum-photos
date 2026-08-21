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

## Windows installer

The desktop release is packaged only as an intentionally unsigned Squirrel.Windows installer. Run `build-installer.bat /s` for the reproducible local path. It runs `npm ci`, generates the committed multi-resolution `apps/dim-sum-atlas/build/icon.ico`, builds `Setup.exe`, `RELEASES`, the full `.nupkg`, and any delta packages, then writes SHA-256 evidence. Code signing is disabled by policy and the installer is independently checked as `NotSigned`.

For a runnable checkout build, use `build.bat /s`. Both root scripts invoke the repository's dependency bootstrap path and are the supported entry points; release packaging must not bypass them. Release `desktop-66-83613a99` publishes version `0.1.7`, and the installed `0.1.6` artifact was verified through download, hash validation, staging, ready-to-restart, Squirrel installation, and automatic relaunch into current version `0.1.7`.

## Line count and human-time estimate

Run `node scripts/count-lines.mjs` to reproduce the Markdown line-count table for the checked-out commit, or `node scripts/count-lines.mjs --json` for the machine-readable record. The committed counter reports project source, tests, styles/markup, generated data, catch-all project files, and explicitly excluded content with total and non-blank lines. It also attributes surviving project lines with `git blame`; attribution is reported as unavailable when Git cannot prove it, never guessed.

The release workflow runs that command only after verifying the checkout is exactly `GITHUB_SHA`, then embeds its output in the release notes. Release notes are the record for a published count; this README intentionally does not hand-copy an unpublished total.

The human implementation-time figure is an estimate derived from the same published release count, not a measured duration: `hand-written non-blank project lines ÷ 15-30 reviewed lines per developer-hour`, with additional project-specific complexity multipliers stated beside any published estimate. Vendored or third-party files, dependency directories, lockfiles, build output, generated catalog data, and bulk image archives are excluded from the hand-written input. This produces a range rather than false single-number precision, and it must be refreshed from the workflow-produced count when a release is published.

Documentation: [feature index](docs/README.md), [installer and updater proof inventory](docs/features/installer-update-proof.md), [automatic updates](docs/features/automatic-update.md).
