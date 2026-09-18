# Roadmap

## Current

- [x] Reconcile the primary checkout with `origin/main` at `998c425`, refresh the handoff, and complete the closeout inventory with no uncommitted, unmerged, or unpushed task-owned work found.
- [x] Verify the default branch ref and preserve the current clean state without removing any ownership-uncertain or load-bearing item.

- [x] Publish and remotely verify the repaired unsigned Squirrel.Windows release at exact commit `83613a99439225c13a05a9769ca64f28843e4be4`.
- [ ] Provide fresh-machine verified root dependency, build, and installer scripts with pinned icon generation and artifact verification (local packaging is verified; fresh-machine bootstrap remains unverified).
- [x] Assemble and verify the packaged catalog deterministically at `2919` unique dishes and publish immutable update metadata.
- [x] Replace the supported Windows installation route with intentionally unsigned Squirrel.Windows packaging and reject parallel NSIS, MSI-only, MSIX-only, WiX-only, Inno Setup, portable-only, self-extracting, ZIP-only, and framework-native installer fallbacks.
- [x] Verify the local candidate package contains `Setup.exe`, `RELEASES`, a full `.nupkg`, and the `2919`-dish packaged catalog, with the setup executable reported as `NotSigned`.
- [x] Verify silent headless installation and installed startup with `2919` catalog records.
- [x] Publish immutable update metadata and verify feed download, hash validation, staging, restart-to-install, rollback, offline, and corrupt-feed behavior.
- [x] Capture published-update available, ready-to-restart, postponed, and post-restart current states from the installed artifact.
- [ ] Complete the split image releases without exceeding GitHub's 1,000-asset limit.
- [ ] Grow the verified catalog from 2,919 toward the 4,000-image target.
- [ ] Continue parity work between the Electron app and the Material Pages gallery.

## Verification rule

Catalog additions must have bilingual metadata, a verified local PNG, and passing data and addition validators before they enter a release.
