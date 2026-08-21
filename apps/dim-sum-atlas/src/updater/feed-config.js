'use strict';

const DEFAULT_UPDATE_FEED = 'https://github.com/Ding-Ding-Projects/dim-sum-photos/releases/latest/download/update.json';

function credentialFreeHttps(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !url.hash;
  } catch (_) { return false; }
}

function selectUpdateFeed(environment = {}) {
  const override = environment.DIM_SUM_ATLAS_UPDATE_FEED;
  return credentialFreeHttps(override) ? override : DEFAULT_UPDATE_FEED;
}

function updaterEligible({ platform, packaged, primary } = {}) {
  return platform === 'win32' && packaged === true && primary === true;
}

module.exports = { DEFAULT_UPDATE_FEED, credentialFreeHttps, selectUpdateFeed, updaterEligible };
