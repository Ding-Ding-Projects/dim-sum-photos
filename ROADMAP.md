# Roadmap

## Current

- [ ] Publish and remotely verify the repaired unsigned Squirrel.Windows release; local packaging is verified, but this commit is not integrated or published.
- [ ] Provide fresh-machine verified root dependency, build, and installer scripts with pinned icon generation and artifact verification (local packaging is verified; fresh-machine bootstrap remains unverified).
- [x] Assemble and verify the packaged catalog deterministically at `2919` unique dishes; remote update metadata publication remains open.
- Complete the split image releases without exceeding GitHub's 1,000-asset limit.
- Grow the verified catalog from 2,919 toward the 4,000-image target.
- Continue parity work between the Electron app and the Material Pages gallery.

## Verification rule

Catalog additions must have bilingual metadata, a verified local PNG, and passing data and addition validators before they enter a release.
