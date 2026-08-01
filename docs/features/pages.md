# Pages deployment

The Pages workflow copies the catalog index into the static site, publishes the Material gallery, and deploys on every `main` push or manual dispatch. The public site includes gallery, favorites, changelog, about, settings, notifications, bulk selection, manifest export, and regex search. Its browser-style tab strip persists order and pinned state, provides a local open-tab search, and exposes an overflow menu for narrow layouts. Right-clicking a tab toggles its pinned state. The changelog view also supports local text/date filtering and exporting the filtered release text; its regex affordance reuses the local builder. Settings include an optional narrator, off by default, with English, Cantonese, or serialized bilingual speech and a one-at-a-time queue.

## Failure modes and security

The catalog is bundled into the Pages artifact. Runtime images use the project release assets, and no analytics or third-party scripts are required.

## Verification

The Pages workflow has completed successfully for recent main commits, and the deployed root, catalog JSON, JavaScript, and stylesheet return HTTP 200.

Suggested articles: [Gallery and fictional lore](gallery.md), [Windows Electron companion](electron.md).
