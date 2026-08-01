# Pages deployment

The Pages workflow copies the catalog index into the static site, publishes the Material gallery, and deploys on every `main` push or manual dispatch. The public site includes gallery, favorites, changelog, about, settings, notifications, bulk selection, manifest export, and regex search. Its browser-style tab strip persists order, pinned state, and named group assignment, provides independent open-tab and group searches, an adjacent regex builder for tab text, an overflow menu for narrow layouts, roving keyboard focus with tab/tabpanel roles, and protected bulk-close actions for tabs matching or not matching a query. Bulk-close requires a non-empty query, previews the affected count through confirmation, excludes pinned tabs and the primary Gallery tab, and supports the same optional regex predicate. Right-clicking a tab toggles its pinned state; the group control assigns the active tab to a named group without leaving the strip. Settings have their own local search field and adjacent regex-builder entry point. The changelog view also supports local text/date filtering and exporting the filtered release text; its regex affordance reuses the local builder. Settings include an optional narrator, off by default, with English, Cantonese, or serialized bilingual speech and a one-at-a-time queue. A local History tab records notifications, favorites, exports, and filtered searches with date, action, and text filters plus export; it never sends records off-device.

## Failure modes and security

The catalog is bundled into the Pages artifact. Runtime images use the project release assets, and no analytics or third-party scripts are required.

## Verification

The Pages workflow has completed successfully for recent main commits, and the deployed root, catalog JSON, JavaScript, and stylesheet return HTTP 200.

Suggested articles: [Gallery and fictional lore](gallery.md), [Windows Electron companion](electron.md).
