# Windows Electron companion

The installed app is Windows-only, local-first, and caches approved release images under the Electron user-data directory. It provides the full gallery, favorites, details, regex search, settings, bulk selection, export formats, ZIP, and portable 7z operations. Its browser-style tab strip has keyboard navigation, local tab search, and a narrow-layout overflow menu. Settings also include an optional narrator, off by default, with English, Cantonese, or serialized bilingual speech and a non-overlapping queue. The settings surface has its own local search field and adjacent regex-builder access, filtering setting labels without changing catalog data.

## Failure modes and security

Non-Windows launches exit immediately. Network image retrieval is limited to the configured project release URL; unavailable images receive an accessible fallback state.

## Verification

`node --check` passes for the main and renderer processes, `npm run validate:data` passes, and a real Electron Windows process remained alive during a five-second launch smoke test.

Suggested articles: [Bulk image export](bulk-export.md), [Pages deployment](pages.md).
