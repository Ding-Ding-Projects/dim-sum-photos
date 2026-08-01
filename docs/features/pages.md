# Pages deployment

The Pages workflow copies the catalog index into the static site, publishes the Material gallery, and deploys on every `main` push or manual dispatch. The public site includes gallery, favorites, changelog, about, settings, notifications, bulk selection, manifest export, and regex search. Its browser-style tab strip persists order and pinned state, provides a local open-tab search, and exposes an overflow menu for narrow layouts. Right-clicking a tab toggles its pinned state.

## Failure modes and security

The catalog is bundled into the Pages artifact. Runtime images use the project release assets, and no analytics or third-party scripts are required.

## Verification

The Pages workflow has completed successfully for recent main commits, and the deployed root, catalog JSON, JavaScript, and stylesheet return HTTP 200.

Suggested articles: [Gallery and fictional lore](gallery.md), [Windows Electron companion](electron.md).
