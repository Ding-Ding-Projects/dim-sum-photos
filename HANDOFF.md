# Handoff

## Verified state

- Catalog validation passes for 2,919 dishes.
- Addition validation passes for 53 records across two addition files.
- The latest published Windows release is the NSIS-era `desktop-58-f77ea116` at commit `f77ea116`. The current Squirrel repair commits are local and unpublished.
- The Pages workflow is green.
- The split image uploader is continuing in `catalog-v1-part-002`, capped below the GitHub release asset limit.
- Installer repair lane adds Squirrel.Windows-only packaging at version `0.1.1`, an original seven-resolution ICO, root silent scripts, and release notes that carry target SHA, measured timing, hashes, and independent `NotSigned` evidence. Local packaging and contract checks are green; remote integration and publication remain required.
- The local build now deterministically assembles `2866` base dishes plus `53` sorted additions into `2919` unique dishes at `apps/dim-sum-atlas/catalog.json`, and packaged `resources/app.asar/catalog.json` was independently inspected at exactly `2919`. Local update metadata is explicitly marked unpublished; the workflow generates immutable tag-bound metadata only after the unique tag is known.

## Active work

The catalog target is 4,000 images. Do not invent missing catalog records or substitute unverified images. Continue from the tracked catalog and the split uploader log.
