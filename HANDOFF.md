# Handoff

## Verified state

- Catalog validation passes for 2,919 dishes.
- Addition validation passes for 53 records across two addition files.
- The last known published Windows release is `desktop-43-a89ba3d8` with installer, portable ZIP, and a catalog image. The current Squirrel repair commit is local and unpublished.
- The Pages workflow is green.
- The split image uploader is continuing in `catalog-v1-part-002`, capped below the GitHub release asset limit.
- Installer repair lane adds Squirrel.Windows-only packaging at version `0.1.1`, an original seven-resolution ICO, root silent scripts, and release notes that carry target SHA, measured timing, hashes, and independent `NotSigned` evidence. The local contract test is green; an actual Windows packaging run remains required on integration.

## Active work

The catalog target is 4,000 images. Do not invent missing catalog records or substitute unverified images. Continue from the tracked catalog and the split uploader log.
