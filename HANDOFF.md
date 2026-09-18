# Handoff

## Verified state

- Repository closeout refreshed on 2026-09-18. The primary checkout is `main` at `998c425`, and `git ls-remote origin refs/heads/main` must continue to resolve to that commit before any cleanup is considered.
- Inventory at closeout found no uncommitted files, no linked checkouts, no local Lap Sap Tongs, no non-default local jers, and no open GitHub issues. The fetched `AGENTS.md` change was already on `main` after a fast-forward from `2541e4f`.
- No conflict markers or unmerged index entries were present, so no conflict-resolution choice was required. No task-owned cleanup candidate was identified.

- Catalog validation passes for 2,919 dishes.
- Addition validation passes for 53 records across two addition files.
- The latest verified Windows release is `desktop-66-83613a99` at commit `83613a99439225c13a05a9769ca64f28843e4be4`.
- The Pages workflow is green.
- The split image uploader is continuing in `catalog-v1-part-002`, capped below the GitHub release asset limit.
- Windows delivery is Squirrel.Windows-only at version `0.1.7`, with an original seven-resolution ICO, root silent scripts, immutable release targeting, measured workflow timing, hashes, and independent `NotSigned` evidence.
- The local build now deterministically assembles `2866` base dishes plus `53` sorted additions into `2919` unique dishes at `apps/dim-sum-atlas/catalog.json`, and packaged `resources/app.asar/catalog.json` was independently inspected at exactly `2919`. Local update metadata is explicitly marked unpublished; the workflow generates immutable tag-bound metadata only after the unique tag is known.
- Recorded focused source evidence consists of the installer contract plus 34 updater tests. The metadata and restart contracts were each deliberately broken red and restored green.
- The final root package build at the recorded source candidate produced `Setup.exe`, `RELEASES`, and a full `.nupkg`; package inspection found `2919` catalog records and Authenticode reported `NotSigned`.
- Installed-artifact verification completed from `0.1.6` to `0.1.7`: the app downloaded and hash-validated the published package, staged it, displayed the persistent ready-to-restart surface, ran separate Squirrel update and process-start commands, and automatically relaunched showing current version `0.1.7` with `2919` catalog records.
- Evidence boundaries and the remaining remote checks are inventoried in `docs/features/installer-update-proof.md`.

## Active work

The catalog target is 4,000 images. Do not invent missing catalog records or substitute unverified images. Continue from the tracked catalog and the split uploader log.
