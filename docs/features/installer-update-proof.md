# Installer and updater proof inventory

This hand-written inventory separates evidence that is often incorrectly combined. A source test, packaged file, successful installation, running surface, capture, and published release each prove a different boundary. Version `0.1.7` is published and the installed update cycle is verified.

| Surface or contract | Source evidence | Package evidence | Installation evidence | Installed runtime evidence | Capture evidence | Remote evidence | Current verdict |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Squirrel.Windows-only installer | Focused installer contract passed | `Setup.exe`, `RELEASES`, and full `.nupkg` published | Silent headless installation succeeded | Installed application launched | Installed captures attached to the release | Non-draft `desktop-66-83613a99` targets the exact commit | Verified |
| Unsigned policy | Signing controls disabled in source contract | Authenticode reported `NotSigned` for setup | Installer remained intentionally unsigned | Installed surface shows the unsigned publisher warning | Available and ready captures show the warning | Published release states `NotSigned` and carries hashes | Verified |
| Packaged catalog | Data and addition validators cover the assembled catalog | Packaged `resources/app.asar/catalog.json` inspected at exactly `2919` records | Installed payload came from the inspected package | Installed `0.1.7` rendered `2919` | Post-restart capture shows `2919` | Published application assets verified | Verified |
| Updater engine | Metadata and restart contracts proven red then green; 34 updater tests passed | Updater code and `update.json` published | Installed `0.1.6` includes updater components | Download, validation, staging, update, and relaunch completed | Available, ready, and current captures attached | `update.json` and immutable full package verified | Verified |
| Updater interface | 10 focused UI tests recorded | UI module included in the published payload | Installed surface available | Available, downloading, ready, postponed, and current states exercised | Installed captures attached to the release | Published ready/current states verified | Verified |
| Feed integrity and rollback | Source coverage records malformed feed, invalid hash, corrupt asset, offline, cancellation, and rollback states | Published package hash and size match metadata | Installed package staged atomically | Real update reached current `0.1.7` | Ready and current captures attached | Metadata, assets, hashes, timing, and downloadability verified | Verified |

## Completion rules

- A local source or package result never marks a remote release row complete.
- A successful installation never proves the updater can download or apply a later release.
- The historical HTTP 404 and schema-rejection captures remain failure evidence only; later published success evidence supersedes them for the current verdict.
- Remote completion requires a unique non-draft release, immutable target commit, downloadable `Setup.exe`, `RELEASES`, full `.nupkg`, hashes, unsigned warning, published metadata, and an installed update cycle through ready-to-restart and current.
- Capture completion requires the real installed artifact at the exact verified release commit. A source preview or pre-release error capture cannot substitute for the published success states.
- Release line-count evidence is produced by `node scripts/count-lines.mjs` after the workflow proves `HEAD` equals `GITHUB_SHA`. Its Markdown output is inserted into release notes, while `--json` provides the same category, total, exclusion, and surviving-line attribution arithmetic for machine inspection. No unpublished count is copied into the README.

Suggested articles: [Windows Electron companion](electron.md), [Automatic updates](automatic-update.md), [Documentation index](../README.md).
