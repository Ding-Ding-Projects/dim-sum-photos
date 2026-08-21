# Roadmap

## Current

- [ ] Publish and remotely verify the repaired unsigned Squirrel.Windows release; local packaging is verified, but this commit is not integrated or published.
- [ ] Provide fresh-machine verified root dependency, build, and installer scripts with pinned icon generation and artifact verification (local packaging is verified; fresh-machine bootstrap remains unverified).
- [x] Assemble and verify the packaged catalog deterministically at `2919` unique dishes; remote update metadata publication remains open.
- [x] Replace the supported Windows installation route with intentionally unsigned Squirrel.Windows packaging and reject parallel NSIS, MSI-only, MSIX-only, WiX-only, Inno Setup, portable-only, self-extracting, ZIP-only, and framework-native installer fallbacks.
- [x] Verify the local candidate package contains `Setup.exe`, `RELEASES`, a full `.nupkg`, and the `2919`-dish packaged catalog, with the setup executable reported as `NotSigned`.
- [x] Verify a silent headless installation and launch the installed pre-release application; the update request correctly reported HTTP 404 because `update.json` is not published yet.
- [ ] Publish immutable `0.1.1` update metadata and verify feed download, hash validation, staging, restart-to-install, rollback, offline, and corrupt-feed behavior against the published release.
- [ ] Capture the current published-update and ready-to-restart states from the installed artifact after the feed exists.
- [ ] Complete the split image releases without exceeding GitHub's 1,000-asset limit.
- [ ] Grow the verified catalog from 2,919 toward the 4,000-image target.
- [ ] Continue parity work between the Electron app and the Material Pages gallery.

## Verification rule

Catalog additions must have bilingual metadata, a verified local PNG, and passing data and addition validators before they enter a release.
