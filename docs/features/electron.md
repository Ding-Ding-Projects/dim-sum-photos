# Windows Electron companion

The installed app is Windows-only, local-first, and caches approved release images under the Electron user-data directory. It provides the full gallery, favorites, details, regex search, settings, bulk selection, export formats, ZIP, and portable 7z operations. Its browser-style tab strip has keyboard navigation, local tab search, and a narrow-layout overflow menu. The in-app changelog supports local text/date filtering and filtered text export. Settings also include an optional narrator, off by default, with English, Cantonese, or serialized bilingual speech and a non-overlapping queue. English and Cantonese funny-level sliders are persisted independently and change rendered voice in all language modes without changing dish facts. The settings surface has its own local search field and adjacent regex-builder access; its regex pattern filters settings labels on that same surface without changing catalog search. Missing split-release images receive an accessible local fallback instead of a broken image surface.

## Failure modes and security

Non-Windows launches exit immediately. Network image retrieval is limited to the configured project release URL; unavailable images receive an accessible fallback state.

Installer delivery is Squirrel.Windows-only. `build-installer.bat /s` is the silent reproducible path and produces `Setup.exe`, `RELEASES`, the full `.nupkg`, and supported delta packages. Signing is intentionally disabled, and the release workflow checks the generated setup with Authenticode before publishing it as `NotSigned`. Release notes include the immutable target SHA, measured workflow timestamps and duration, per-asset SHA-256 hashes, and the portable 7-Zip provenance manifest.

This packaging rule is independent of the application framework. Any Windows application payload must be wrapped by the genuine Squirrel.Windows route; a framework's preferred installer is not a supported exception. NSIS, MSI-only, MSIX-only, WiX-only, Inno Setup, portable-only, PowerShell self-extracting, ZIP-only, and other framework-native installers are not supported parallel fallbacks.

The installer is intentionally unsigned. Windows may display an unknown-publisher or SmartScreen warning. The project verifies the setup executable as `NotSigned` and does not claim signature-based authenticity.

## Verification

The current local candidate produced `Setup.exe`, `RELEASES`, and a full `.nupkg`; the packaged catalog contains `2919` records and Authenticode reports `NotSigned`. Silent headless installation succeeded, and the installed pre-release application rendered all `2919` records. Remote publication and the installed update-to-current path remain unverified.

Suggested articles: [Installer and updater proof](installer-update-proof.md), [Automatic updates](automatic-update.md), [Bulk image export](bulk-export.md), [Pages deployment](pages.md).
