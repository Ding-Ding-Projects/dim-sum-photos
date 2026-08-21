# Automatic updates

The renderer now contains a persistent, non-blocking update surface in the gallery and in Settings. Core-process bridge integration is provided through the flat preload contract below. The nested `window.atlas.updater` object remains only as a compatibility adapter for focused tests and older callers. Once connected, the surface exposes a manual **Check for updates** action, exact current and available versions, a release-notes link, unsigned-artifact warning, byte-accurate download progress, cancellation, retry, **Restart to install update**, and **Later**. The ready state remains visible until the user chooses an action.

## Expected desktop interface

The renderer calls the flat `window.atlas` updater methods and state through the preload bridge. The core process should expose these methods and events:

```js
window.atlas = {
  updaterState: UpdateState,
  checkForUpdates(): Promise<UpdateState>,
  downloadUpdate(): Promise<UpdateState>,
  cancelUpdate(): Promise<UpdateState>,
  setUpdaterWorkState({ hasUnsavedWork, operationInProgress }): void,
  restartToInstallUpdate(): Promise<UpdateState>,
  onUpdaterState(listener: (state: UpdateState) => void): () => void
}
```

`UpdateState` is a plain object with `status` (`idle`, `checking`, `up-to-date`, `available`, `downloading`, `ready`, `installing`, `postponed`, `cancelled`, `offline`, `malformed-feed`, `invalid-hash`, `corrupt-asset`, `insufficient-storage`, `rollback`, `failed`, or `unavailable`), `currentVersion`, `availableVersion`, `releaseNotesUrl`, `downloadedBytes`, `totalBytes`, `unsigned`, `canRestart`, `restartBlockedReason`, `hasUnsavedWork`, `operationInProgress`, `warning`, `error`, and `lastCheckedAt`. The renderer normalizes reasonable aliases such as `current`, `no update`, `ready-to-restart`, `restarting`, `later`, `invalid hash`, `disk full`, and `malformed feed` without collapsing the canonical states into a generic error. **Later** is local UI state: it renders `postponed` without calling the core or clearing its `ready` state. Retry rechecks the feed by default and redownloads only when the current state identifies a corrupt asset. Release-note navigation accepts only validated HTTPS URLs through an accessible anchor action.

When the bridge is unavailable, the surface says so and does not claim that an update was checked, downloaded, or installed. Restart remains unavailable while unsaved work or another operation is active, and the exact blocking reason is shown beside the disabled action. Release-note navigation accepts only HTTPS URLs.

## Notification history, localization, and accessibility

Updater warnings and failures are persisted locally under the `dim-sum-updater-history` key and remain reviewable in the update notice tray. No credentials, update payloads, or private paths are stored. English, Cantonese, and bilingual modes are read from the shared language settings. Funny levels change only the surrounding voice, while versions, byte counts, URLs, unsigned status, and failure facts stay exact. The update card uses text plus a progress bar, keyboard-reachable buttons, visible focus, reduced-motion-safe styling, and a 320 px layout.

## Failure modes and security

The service reports unavailable, up-to-date, cancelled, failed, and restart-blocked states without a fake success. The UI never downloads an update itself, accepts an arbitrary URL, or treats an unsigned installer as authenticated. The core process owns transport, hash validation, staging, rollback, and restart safety.

## Verification

`node --check apps/dim-sum-atlas/src/updater-ui.js` validates the shipped UI module. Focused tests cover state normalization, byte progress bounds, exact version facts, English/Cantonese/bilingual copy, both funny extremes, and HTTPS release-note validation. Runtime evidence still requires the built Electron artifact with the core bridge wired.

Suggested articles: [Windows Electron companion](electron.md), [Bulk image export](bulk-export.md).
