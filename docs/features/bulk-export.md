# Bulk image export

The Windows companion supports multi-selection with Ctrl or Shift, metadata exports as JSON, CSV, Markdown, TXT, or HTML, image-only exports, ZIP archives, and 7z archives with optional passwords. Its 7z operation surface includes add, extract, list, test, update, delete, and benchmark when a portable 7-Zip executable is available.

## Failure modes and security

The app validates selections before export and reports missing 7-Zip or archive errors without silently claiming success. Passwords are passed to the local 7-Zip process and are not persisted.

## Verification

The Electron main process exposes `archive:capabilities` and `archive:run`; the Windows launch smoke test confirms the app opens successfully.

Suggested articles: [Gallery and fictional lore](gallery.md), [Windows Electron companion](electron.md).
