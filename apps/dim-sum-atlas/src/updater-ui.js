(function updaterUiModule(global) {
  'use strict';

  const HISTORY_KEY = 'dim-sum-updater-history';
  const MAX_HISTORY = 100;
  const CANONICAL_STATES = ['idle', 'checking', 'up-to-date', 'available', 'downloading', 'ready', 'installing', 'postponed', 'cancelled', 'offline', 'malformed-feed', 'invalid-hash', 'corrupt-asset', 'insufficient-storage', 'rollback', 'failed', 'unavailable'];
  const STATUS_ALIASES = {
    current: 'idle', 'current-version': 'idle',
    'no-update': 'up-to-date', 'no-update-found': 'up-to-date', 'up-to-date': 'up-to-date',
    'ready-to-restart': 'ready', 'ready-to-install': 'ready',
    restarting: 'installing', 'installing-restart': 'installing', 'installing-or-restarting': 'installing',
    later: 'postponed', deferred: 'postponed', postponed: 'postponed',
    'network-offline': 'offline', offline: 'offline',
    'invalid-feed': 'malformed-feed', 'malformed-feed': 'malformed-feed',
    'hash-invalid': 'invalid-hash', 'invalid-hash': 'invalid-hash',
    'corrupted-asset': 'corrupt-asset', 'corrupt-download': 'corrupt-asset', 'corrupt-asset': 'corrupt-asset',
    'disk-full': 'insufficient-storage', 'storage-insufficient': 'insufficient-storage', 'insufficient-storage': 'insufficient-storage',
    'rolled-back': 'rollback', rollback: 'rollback',
    error: 'failed', failure: 'failed', failed: 'failed', unavailable: 'unavailable', disconnected: 'unavailable', disabled: 'unavailable'
  };

  const copy = {
    idle: { en: ['Updates are ready to check.', 'The update tea tray is ready whenever you are.'], yue: ['更新已準備檢查。', '更新茶盤準備好，等你有需要先睇。'] },
    checking: { en: ['Checking for updates…', 'Checking the tea tray for a fresher build…'], yue: ['正在檢查更新…', '而家幫你睇下有冇新版本出爐…'] },
    upToDate: { en: ['You are up to date.', 'No newer basket on the shelf. You are up to date.'], yue: ['你已經係最新版本。', '架上冇更新嘅蒸籠，你已經係最新版本。'] },
    available: { en: ['An update is available.', 'A fresher build is waiting in the steamer.'], yue: ['有更新可以安裝。', '新版本喺蒸籠度等緊你。'] },
    downloading: { en: ['Downloading update…', 'The new build is making its entrance.'], yue: ['正在下載更新…', '新版本準備緊登場。'] },
    ready: { en: ['Update ready to install.', 'The new build is plated and ready.'], yue: ['更新已準備好安裝。', '新版本已經上碟，等你重新啟動。'] },
    error: { en: ['Update could not be completed.', 'The update kitchen hit a snag.'], yue: ['更新未能完成。', '更新廚房撞到少少阻滯。'] },
    cancelled: { en: ['Update download cancelled.', 'The download paused before the basket reached the table.'], yue: ['更新下載已取消。', '下載喺蒸籠到枱之前停咗。'] },
    installing: { en: ['Installing update and restarting…', 'The new build is taking the last step to the table.'], yue: ['正在安裝更新並重新啟動…', '新版本行緊最後一步入枱。'] },
    postponed: { en: ['Update postponed.', 'The fresher basket is waiting for a later serving.'], yue: ['更新已延後。', '新蒸籠留返遲啲先上枱。'] },
    offline: { en: ['Update check is offline.', 'The update tea tray cannot reach the kitchen right now.'], yue: ['更新檢查目前離線。', '更新茶盤而家未去到廚房。'] },
    'malformed-feed': { en: ['The update feed is malformed.', 'The update menu arrived with the wrong shape.'], yue: ['更新來源格式錯誤。', '更新餐牌返嚟個樣唔啱。'] },
    'invalid-hash': { en: ['The update hash is invalid.', 'The update basket failed its hash check, so it stays off the table.'], yue: ['更新雜湊值無效。', '更新蒸籠過唔到雜湊檢查，所以唔會上枱。'] },
    'corrupt-asset': { en: ['The downloaded update is corrupt.', 'The update basket arrived broken, so it stays untouched.'], yue: ['下載嘅更新已損壞。', '更新蒸籠返到嚟已經壞咗，所以保持原狀。'] },
    'insufficient-storage': { en: ['There is not enough storage for this update.', 'There is not enough room on the table for this basket.'], yue: ['儲存空間不足，未能更新。', '枱面位唔夠，放唔落呢個蒸籠。'] },
    rollback: { en: ['The update was rolled back.', 'The new basket stepped back safely and the current build remains in place.'], yue: ['更新已回滾。', '新蒸籠安全咁退返後，現有版本保持原位。'] },
    failed: { en: ['The update failed.', 'The update kitchen stopped before serving anything new.'], yue: ['更新失敗。', '更新廚房喺上新版本之前停咗。'] },
    unavailable: { en: ['Update service is not connected.', 'The update tea tray is not connected yet.'], yue: ['更新服務未連接。', '更新茶盤而家未連接住。'] },
    check: { en: ['Check for updates', 'Check the tea tray'], yue: ['檢查更新', '睇下有冇新版本'] },
    download: { en: ['Download update', 'Bring in the fresher basket'], yue: ['下載更新', '接新蒸籠入枱'] },
    cancel: { en: ['Cancel download', 'Pause the basket delivery'], yue: ['取消下載', '暫停蒸籠送貨'] },
    retry: { en: ['Retry update', 'Give the update another careful stir'], yue: ['重試更新', '再幫個更新撈一撈'] },
    restart: { en: ['Restart to install update', 'Restart and serve the new build'], yue: ['重新啟動以安裝更新', '重新啟動，送上新版本'] },
    later: { en: ['Later', 'Save it for later'], yue: ['稍後', '遲啲先做'] },
    releaseNotes: { en: ['Release notes', 'Read what changed before serving'], yue: ['版本說明', '先睇下今次改咗啲乜'] },
    settingsHeading: { en: ['Updates', 'Updates, now with extra steam'], yue: ['更新', '更新，而家蒸氣加碼'] },
    historyHeading: { en: ['Update notices', 'The update notice tray'], yue: ['更新通知記錄', '更新通知茶盤'] },
    noHistory: { en: ['No update warnings or failures yet.', 'No update kitchen mishaps have been recorded.'], yue: ['暫時冇更新警告或失敗記錄。', '更新廚房暫時冇記低任何失手。'] },
    surfaceLabel: { en: ['Application updates', 'Application updates, with a fresh steam check'], yue: ['應用程式更新', '應用程式更新，而家加埋新鮮蒸氣檢查'] },
    settingsLabel: { en: ['Update settings', 'Update settings, the little tea counter'], yue: ['更新設定', '更新設定，小小更新茶櫃檯'] },
    progressLabel: { en: ['Update download progress', 'Update basket progress'], yue: ['更新下載進度', '更新蒸籠進度'] },
    progressUnavailable: { en: ['Progress unavailable', 'Progress is taking a tea break'], yue: ['進度未能提供', '進度而家去咗飲茶'] },
    bytesOf: { en: ['of', 'of'], yue: ['／', '／'] },
    unsigned: { en: ['This update is unsigned and may show an operating-system publisher warning.', 'This unsigned update may arrive with a publisher-warning chaperone.'], yue: ['此更新未簽署，作業系統可能顯示未知發佈者警告。', '呢個未簽署更新可能會帶住發佈者警告一齊到。'] },
    restartBlocked: { en: ['Restart is unavailable while work is unsaved or an operation is in progress.', 'Restart is waiting politely while your work is still on the table.'], yue: ['有未儲存工作或操作進行中，暫時未可以重新啟動。', '你嘅工作仲喺枱面，重新啟動要等一等。'] },
    integration: { en: ['Update controls will appear when the desktop update service is connected.', 'The update counter is ready, but the desktop service still needs to join the table.'], yue: ['桌面更新服務連接後，更新控制會正式啟用。', '更新櫃檯準備好，但桌面服務仲未入座。'] }
  };
  copy['up-to-date'] = copy.upToDate;

  function safeSettings(storage) {
    try {
      const value = JSON.parse(storage?.getItem('dim-sum-language-settings') || '{}');
      return { language: ['en', 'yue', 'bilingual'].includes(value.language) ? value.language : 'en', funnyEn: clamp(Number(value.funnyEn) || 2, 1, 5), funnyYue: clamp(Number(value.funnyYue) || 2, 1, 5) };
    } catch {
      return { language: 'en', funnyEn: 2, funnyYue: 2 };
    }
  }

  function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }

  function localizeUpdater(key, settings, override) {
    const entry = copy[key] || copy.unavailable;
    const level = override || (settings.language === 'yue' ? settings.funnyYue : settings.funnyEn);
    const index = level >= 4 ? 1 : 0;
    if (settings.language === 'yue') return entry.yue[index];
    if (settings.language === 'bilingual') return `${entry.en[index]} · ${entry.yue[index]}`;
    return entry.en[index];
  }

  function formatBytes(value) {
    const bytes = Number(value);
    if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
    if (bytes < 1024) return `${Math.round(bytes)} B`;
    const units = ['KiB', 'MiB', 'GiB'];
    let amount = bytes;
    let unit = 'B';
    for (const candidate of units) {
      amount /= 1024;
      unit = candidate;
      if (amount < 1024 || candidate === units.at(-1)) break;
    }
    return `${amount.toFixed(amount >= 100 ? 0 : amount >= 10 ? 1 : 2)} ${unit}`;
  }

  function normalizeState(input) {
    const raw = input && typeof input === 'object' ? input : {};
    const rawStatus = String(raw.status || raw.state || 'idle').trim().toLowerCase().replace(/[ _]+/g, '-');
    const status = rawStatus;
    const state = STATUS_ALIASES[status] || (CANONICAL_STATES.includes(status) ? status : 'failed');
    const downloadedBytes = Math.max(0, Number(raw.downloadedBytes ?? raw.bytesDownloaded ?? raw.transferredBytes ?? 0) || 0);
    const totalBytes = Math.max(0, Number(raw.totalBytes ?? raw.bytesTotal ?? raw.contentLength ?? 0) || 0);
    const availableVersion = String(raw.availableVersion || raw.version || '').trim();
    const currentVersion = String(raw.currentVersion || raw.current || '').trim();
    const releaseNotesUrl = String(raw.releaseNotesUrl || raw.releaseUrl || '').trim();
    const restartBlockedReason = String(raw.restartBlockedReason || raw.blockedReason || '').trim();
    return {
      status: state,
      currentVersion,
      availableVersion,
      releaseNotesUrl,
      downloadedBytes,
      totalBytes,
      percent: progressPercent(downloadedBytes, totalBytes),
      error: String(raw.error || raw.errorMessage || raw.reason || raw.message || '').trim(),
      warning: String(raw.warning || '').trim(),
      serviceDisabled: rawStatus === 'disabled' || raw.disabled === true || raw.unconfigured === true || raw.serviceDisabled === true,
      unsigned: raw.unsigned !== false,
      canRestart: raw.canRestart !== false && !restartBlockedReason && raw.hasUnsavedWork !== true && raw.operationInProgress !== true,
      restartBlockedReason,
      hasUnsavedWork: raw.hasUnsavedWork === true,
      operationInProgress: raw.operationInProgress === true,
      lastCheckedAt: String(raw.lastCheckedAt || '').trim()
    };
  }

  function progressPercent(downloadedBytes, totalBytes) {
    if (!Number.isFinite(totalBytes) || totalBytes <= 0) return 0;
    return clamp(Math.round((downloadedBytes / totalBytes) * 100), 0, 100);
  }

  function readHistory(storage) {
    try {
      const rows = JSON.parse(storage?.getItem(HISTORY_KEY) || '[]');
      if (!Array.isArray(rows)) return [];
      return rows.filter(row => row && typeof row === 'object').slice(0, MAX_HISTORY);
    } catch {
      return [];
    }
  }

  function appendHistory(rows, entry) {
    const existing = Array.isArray(rows) ? rows.filter(row => row && typeof row === 'object') : [];
    return [entry, ...existing].slice(0, MAX_HISTORY);
  }

  function recordHistoryEntry(storage, kind, state, message) {
    const rows = appendHistory(readHistory(storage), { at: new Date().toISOString(), kind, status: state.status, version: state.availableVersion || state.currentVersion, message: String(message || '') });
    try { storage?.setItem(HISTORY_KEY, JSON.stringify(rows)); } catch { /* local history is best effort when storage is unavailable */ }
    return rows;
  }

  function createHistoryRecorder(storage) {
    return (kind, state, message) => recordHistoryEntry(storage, kind, state, message);
  }

  function safeUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' ? url.toString() : '';
    } catch {
      return '';
    }
  }

  function escapeAttribute(value) { return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character])); }

  function apiMethod(api, names) {
    return names.map(name => api && typeof api[name] === 'function' ? api[name].bind(api) : null).find(Boolean);
  }

  function createFlatUpdaterAdapter(atlas) {
    if (!atlas || (!('updaterState' in atlas) && typeof atlas.checkForUpdates !== 'function' && typeof atlas.onUpdaterState !== 'function')) return null;
    const readState = () => typeof atlas.updaterState === 'function' ? atlas.updaterState() : atlas.updaterState;
    return {
      getState: () => Promise.resolve(readState()),
      checkForUpdates: () => atlas.checkForUpdates(),
      downloadUpdate: () => atlas.downloadUpdate(),
      cancelUpdate: () => atlas.cancelUpdate(),
      setUpdaterWorkState: (workState) => atlas.setUpdaterWorkState(workState),
      restartToInstall: () => atlas.restartToInstallUpdate(),
      onStateChanged: (listener) => atlas.onUpdaterState(listener)
    };
  }

  function postponeLocalState(state) { return { ...normalizeState(state), status: 'postponed' }; }

  function readRendererWorkState(documentRef, current = {}) {
    const unsavedMarker = documentRef?.querySelector?.('[data-unsaved-work="true"]');
    const operationMarker = documentRef?.querySelector?.('[data-operation-in-progress="true"]');
    const archiveButton = documentRef?.getElementById?.('run-archive');
    return {
      hasUnsavedWork: current.hasUnsavedWork === true || Boolean(unsavedMarker),
      operationInProgress: current.operationInProgress === true || Boolean(operationMarker) || archiveButton?.dataset?.operationInProgress === 'true'
    };
  }

  const RETRYABLE_STATES = new Set(['offline', 'malformed-feed', 'invalid-hash', 'corrupt-asset', 'insufficient-storage', 'rollback', 'failed', 'unavailable', 'cancelled']);
  function isCheckDisabled(state, hasApi) { return !hasApi || state.serviceDisabled === true || ['checking', 'downloading', 'installing'].includes(state.status); }
  function shouldShowRetry(state) { return state.serviceDisabled !== true && RETRYABLE_STATES.has(state.status); }
  function shouldRecordFailure(state) { return state.serviceDisabled !== true && (state.status === 'failed' || RETRYABLE_STATES.has(state.status)); }
  function actionsForState(state) {
    const actions = ['check'];
    if (state.status === 'available') actions.push('download');
    if (state.status === 'downloading') actions.push('cancel');
    if (shouldShowRetry(state)) actions.push('retry');
    if (state.status === 'ready') actions.push('restart', 'later');
    if (['available', 'ready'].includes(state.status) && safeUrl(state.releaseNotesUrl)) actions.push('release-notes');
    return actions;
  }

  function mount(options = {}) {
    const documentRef = options.document || global.document;
    if (!documentRef) return null;
    const root = options.root || documentRef.getElementById('updater-surface');
    if (!root || root.dataset.updaterMounted === 'true') return null;
    root.dataset.updaterMounted = 'true';
    const settingsRoot = options.settingsRoot || documentRef.getElementById('updater-settings');
    const storage = options.storage || global.localStorage;
    const api = options.api || createFlatUpdaterAdapter(global.atlas) || global.atlas?.updater || null;
    const state = normalizeState(options.initialState || {});
    const settings = () => safeSettings(storage);
    const record = createHistoryRecorder(storage);
    let unsubscribe = null;
    let focusTarget = null;
    let focusAction = '';
    let localPostponed = false;
    let current = state;

    root.innerHTML = '<div class="updater-card" role="region" aria-labelledby="updater-title"><div class="updater-card-head"><div><p class="eyebrow">Updates</p><h2 id="updater-title" data-updater-copy="heading"></h2></div><span class="updater-state" data-updater-state></span></div><p class="updater-message" data-updater-message role="status" aria-live="polite"></p><div class="updater-facts" data-updater-facts></div><div class="updater-progress-wrap" data-updater-progress-wrap hidden><div class="updater-progress-label"><span data-updater-progress-text></span><span data-updater-progress-bytes></span></div><progress data-updater-progress aria-label="Update download progress" min="0" max="100" value="0"></progress></div><p class="updater-warning" data-updater-warning hidden></p><p class="updater-error" data-updater-error hidden role="alert"></p><p class="updater-blocked" data-updater-blocked hidden></p><div class="updater-actions" data-updater-actions></div><details class="updater-history"><summary data-updater-history-heading></summary><div data-updater-history-list></div></details></div>';
    root.setAttribute('tabindex', '-1');
    if (settingsRoot) settingsRoot.innerHTML = '<p class="eyebrow" data-updater-settings-heading></p><p class="updater-settings-copy" data-updater-settings-copy></p><button type="button" class="filter-button" data-updater-action="check"></button><div class="updater-settings-status" data-updater-settings-status role="status"></div>';

    const q = selector => root.querySelector(selector);
    const actionButton = (action, label, disabled = false) => `<button type="button" class="filter-button" data-updater-action="${action}"${disabled ? ' disabled' : ''}>${label}</button>`;
    const actionLink = (action, label, href) => `<a class="filter-button" data-updater-action="${action}" href="${escapeAttribute(href)}" target="_blank" rel="noopener noreferrer">${label}</a>`;

    function restoreFocus() {
      const fallback = (focusAction && (root.querySelector(`[data-updater-action="${focusAction}"]`) || settingsRoot?.querySelector(`[data-updater-action="${focusAction}"]`))) || root;
      if (focusTarget && typeof focusTarget.focus === 'function' && documentRef.contains(focusTarget)) focusTarget.focus();
      else if (fallback && typeof fallback.focus === 'function') fallback.focus();
      focusTarget = null;
      focusAction = '';
    }

    function captureFocus() {
      const active = documentRef.activeElement;
      if (active && active !== documentRef.body) { focusTarget = active; focusAction = active.dataset?.updaterAction || ''; }
    }

    function renderHistory() {
      const rows = readHistory(storage);
      const list = q('[data-updater-history-list]');
      list.replaceChildren();
      if (!rows.length) { const empty = documentRef.createElement('p'); empty.textContent = localizeUpdater('noHistory', settings()); list.append(empty); return; }
      rows.forEach(row => {
        const entry = documentRef.createElement('article'); entry.className = 'updater-history-entry';
        const time = documentRef.createElement('time'); time.dateTime = String(row.at || ''); time.textContent = new Date(row.at).toLocaleString();
        const kind = documentRef.createElement('strong'); kind.textContent = String(row.kind || 'notice');
        const detail = documentRef.createElement('span'); detail.textContent = `${String(row.message || '')}${row.version ? ` · ${String(row.version)}` : ''}`;
        entry.append(time, kind, detail); list.append(entry);
      });
    }

    function render(next) {
      current = normalizeState(next);
      const activeSettings = settings();
      const title = q('[data-updater-copy="heading"]');
      const message = q('[data-updater-message]');
      const stateLabel = q('[data-updater-state]');
      const facts = q('[data-updater-facts]');
      const warning = q('[data-updater-warning]');
      const errorDetail = q('[data-updater-error]');
      const blocked = q('[data-updater-blocked]');
      const progressWrap = q('[data-updater-progress-wrap]');
      const progress = q('[data-updater-progress]');
      const progressText = q('[data-updater-progress-text]');
      const progressBytes = q('[data-updater-progress-bytes]');
      const actions = q('[data-updater-actions]');
      const labels = { idle: ['Idle', '閒置'], checking: ['Checking', '檢查中'], 'up-to-date': ['Up to date', '最新版本'], available: ['Available', '有更新'], downloading: ['Downloading', '下載中'], ready: ['Ready to restart', '準備重新啟動'], installing: ['Installing / restarting', '安裝／重新啟動中'], postponed: ['Postponed', '已延後'], cancelled: ['Cancelled', '已取消'], offline: ['Offline', '離線'], 'malformed-feed': ['Malformed feed', '來源格式錯誤'], 'invalid-hash': ['Invalid hash', '雜湊值無效'], 'corrupt-asset': ['Corrupt asset', '資產損壞'], 'insufficient-storage': ['Insufficient storage', '儲存空間不足'], rollback: ['Rollback', '回滾'], failed: ['Failed', '失敗'], unavailable: ['Unavailable', '未連接'] };
      const key = current.status === 'up-to-date' ? 'upToDate' : current.status;
      title.textContent = localizeUpdater('settingsHeading', activeSettings);
      message.textContent = localizeUpdater(key, activeSettings);
      root.setAttribute('aria-label', localizeUpdater('surfaceLabel', activeSettings));
      documentRef.getElementById('updater-title').textContent = localizeUpdater('settingsHeading', activeSettings);
      if (settingsRoot) settingsRoot.setAttribute('aria-label', localizeUpdater('settingsLabel', activeSettings));
      const stateLabelPair = labels[current.status] || labels.error;
      stateLabel.textContent = activeSettings.language === 'yue' ? stateLabelPair[1] : activeSettings.language === 'bilingual' ? `${stateLabelPair[0]} · ${stateLabelPair[1]}` : stateLabelPair[0];
      stateLabel.dataset.state = current.status;
      facts.replaceChildren();
      const factLabels = activeSettings.language === 'yue' ? ['目前版本', '可用版本', '檢查時間'] : activeSettings.language === 'bilingual' ? ['Current version · 目前版本', 'Available version · 可用版本', 'Checked · 檢查時間'] : ['Current version', 'Available version', 'Checked'];
      [[factLabels[0], current.currentVersion], [factLabels[1], current.availableVersion], [factLabels[2], current.lastCheckedAt]].forEach(([label, value]) => {
        if (!value) return;
        const fact = documentRef.createElement('span'); const strong = documentRef.createElement('strong');
        strong.textContent = label; fact.append(strong, documentRef.createTextNode(` ${value}`)); facts.append(fact);
      });
      const hasProgress = current.status === 'downloading' || current.totalBytes > 0;
      progressWrap.hidden = !hasProgress;
      progress.value = current.percent;
      progress.setAttribute('aria-label', localizeUpdater('progressLabel', activeSettings));
      progress.setAttribute('aria-valuetext', current.totalBytes ? `${current.percent}%` : localizeUpdater('progressUnavailable', activeSettings));
      progressText.textContent = current.totalBytes ? `${current.percent}%` : localizeUpdater('progressUnavailable', activeSettings);
      progressBytes.textContent = current.totalBytes ? `${formatBytes(current.downloadedBytes)} ${localizeUpdater('bytesOf', activeSettings)} ${formatBytes(current.totalBytes)}` : formatBytes(current.downloadedBytes);
      warning.hidden = !(current.warning || (current.unsigned && ['available', 'downloading', 'ready'].includes(current.status)));
      warning.textContent = warning.hidden ? '' : (current.warning || localizeUpdater('unsigned', activeSettings));
      errorDetail.hidden = !current.error;
      errorDetail.textContent = current.error;
      blocked.hidden = current.canRestart || !['ready', 'available'].includes(current.status);
      blocked.textContent = blocked.hidden ? '' : (current.restartBlockedReason || localizeUpdater('restartBlocked', activeSettings));
      const buttons = actionsForState(current).map(action => {
        if (action === 'check') return actionButton(action, localizeUpdater('check', activeSettings), isCheckDisabled(current, Boolean(api)));
        if (action === 'download') return actionButton(action, localizeUpdater('download', activeSettings));
        if (action === 'cancel') return actionButton(action, localizeUpdater('cancel', activeSettings));
        if (action === 'retry') return actionButton(action, localizeUpdater('retry', activeSettings));
        if (action === 'restart') return actionButton(action, localizeUpdater('restart', activeSettings), !current.canRestart);
        if (action === 'later') return actionButton(action, localizeUpdater('later', activeSettings));
        return actionLink(action, localizeUpdater('releaseNotes', activeSettings), safeUrl(current.releaseNotesUrl));
      }).join('');
      actions.innerHTML = buttons;
      root.dataset.state = current.status;
      root.hidden = false;
      if (settingsRoot) {
        settingsRoot.querySelector('[data-updater-settings-heading]').textContent = localizeUpdater('settingsHeading', activeSettings);
        settingsRoot.querySelector('[data-updater-settings-copy]').textContent = api ? localizeUpdater('check', activeSettings) : localizeUpdater('integration', activeSettings);
        settingsRoot.querySelector('[data-updater-action="check"]').textContent = localizeUpdater('check', activeSettings);
        settingsRoot.querySelector('[data-updater-action="check"]').disabled = isCheckDisabled(current, Boolean(api));
        settingsRoot.querySelector('[data-updater-settings-status]').textContent = localizeUpdater(key, activeSettings);
      }
      q('[data-updater-history-heading]').textContent = `${localizeUpdater('historyHeading', activeSettings)} (${readHistory(storage).length})`;
      renderHistory();
    }

    async function call(names, payload) {
      const method = apiMethod(api, names);
      if (!method) throw new Error('The desktop update service is not connected.');
      const result = await method(payload);
      return result && typeof result === 'object' ? result : current;
    }

    async function execute(action) {
      captureFocus();
      try {
        if (action === 'later') {
          localPostponed = true;
          render(postponeLocalState(current));
          restoreFocus();
          return;
        }
        if (!api) throw new Error('The desktop update service is not connected.');
        localPostponed = false;
        let next;
        if (action === 'check') next = await call(['checkForUpdates', 'check'], {});
        else if (action === 'download') next = await call(['downloadUpdate', 'download'], {});
        else if (action === 'cancel') next = await call(['cancelUpdate', 'cancelDownload', 'cancel'], {});
        else if (action === 'retry') {
          const redownload = current.status === 'corrupt-asset' && Boolean(current.availableVersion);
          next = await call(redownload ? ['downloadUpdate', 'download'] : ['checkForUpdates', 'check', 'retryUpdate', 'retry'], {});
        }
        else if (action === 'restart') {
          const workState = readRendererWorkState(documentRef, current);
          const setWorkState = apiMethod(api, ['setUpdaterWorkState']);
          if (setWorkState) await setWorkState(workState);
          const getCurrentState = apiMethod(api, ['getState', 'getStatus']);
          if (getCurrentState) {
            const refreshed = normalizeState(await getCurrentState());
            current = normalizeState({ ...refreshed, hasUnsavedWork: refreshed.hasUnsavedWork || workState.hasUnsavedWork, operationInProgress: refreshed.operationInProgress || workState.operationInProgress });
          } else current = normalizeState({ ...current, ...workState });
          if (!current.canRestart) { record('warning', current, current.restartBlockedReason || localizeUpdater('restartBlocked', settings())); render(current); restoreFocus(); return; }
          next = await call(['restartToInstall', 'restartToInstallUpdate', 'restart'], {});
        }
        else if (action === 'release-notes') { restoreFocus(); return; }
        const normalized = normalizeState(next);
        if (shouldRecordFailure(normalized)) record('failure', normalized, normalized.error || localizeUpdater(normalized.status, settings()));
        if (normalized.warning) record('warning', normalized, normalized.warning);
        render(normalized);
      } catch (error) {
        const failed = normalizeState({ ...current, status: api ? 'error' : 'unavailable', serviceDisabled: !api, error: error.message });
        if (shouldRecordFailure(failed)) record('failure', failed, failed.error || localizeUpdater('unavailable', settings()));
        render(failed);
      } finally {
        restoreFocus();
      }
    }

    root.addEventListener('click', event => {
      const button = event.target.closest('[data-updater-action]');
      if (!button || button.disabled) return;
      if (button.dataset.updaterAction === 'release-notes') return;
      execute(button.dataset.updaterAction);
    });
    settingsRoot?.addEventListener('click', event => {
      const button = event.target.closest('[data-updater-action]');
      if (!button || button.disabled) return;
      if (button.dataset.updaterAction === 'release-notes') return;
      execute(button.dataset.updaterAction);
    });
    const subscribe = apiMethod(api, ['onStateChanged', 'onUpdateState', 'subscribe']);
    if (subscribe) {
      try {
        unsubscribe = subscribe(next => {
          const normalized = normalizeState(next);
          if (localPostponed && normalized.status === 'ready') normalized.status = 'postponed';
          if (normalized.warning || (normalized.error && shouldRecordFailure(normalized))) record(normalized.warning ? 'warning' : 'failure', normalized, normalized.warning || normalized.error || localizeUpdater(normalized.status, settings()));
          render(normalized);
        });
      } catch { unsubscribe = null; }
    }
    const getState = apiMethod(api, ['getState', 'getStatus']);
    if (getState) Promise.resolve(getState()).then(next => { const normalized = normalizeState(next); render(localPostponed && normalized.status === 'ready' ? postponeLocalState(normalized) : normalized); }).catch(error => { const failed = { status: 'error', error: error?.message || 'The update service did not return its current state.' }; record('failure', normalizeState(failed), failed.error); render(failed); });
    else render(api ? current : { status: 'unavailable', serviceDisabled: true, error: 'The desktop update service is not connected.' });

    return { destroy: () => { if (typeof unsubscribe === 'function') unsubscribe(); root.dataset.updaterMounted = 'false'; }, render, getState: () => current, execute };
  }

  const exported = { CANONICAL_STATES, copy, formatBytes, normalizeState, progressPercent, localizeUpdater, readHistory, appendHistory, recordHistoryEntry, createFlatUpdaterAdapter, postponeLocalState, readRendererWorkState, isCheckDisabled, shouldShowRetry, shouldRecordFailure, actionsForState, safeUrl, mount };
  if (typeof module !== 'undefined' && module.exports) module.exports = exported;
  global.DimSumUpdater = exported;
  if (global.document) {
    const start = () => mount();
    if (global.document.readyState === 'loading') global.document.addEventListener('DOMContentLoaded', start, { once: true });
    else start();
  }
}(typeof window !== 'undefined' ? window : globalThis));
