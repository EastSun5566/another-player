/* eslint-disable import/no-extraneous-dependencies */
import { html } from 'lit-html';

import { createPlayer, hlsPlugin, dashPlugin } from '@another-player/core';

// Sample video URLs
const MP4_URL = 'https://cdn.jsdelivr.net/npm/big-buck-bunny-1080p@0.0.6/video.mp4';
const HLS_URL = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
const DASH_URL = 'https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd';

// Widevine DASH DRM test stream (Axinom test content)
const DASH_DRM_URL = 'https://media.axprod.net/TestVectors/v7-MultiDRM-SingleKey/Manifest.mpd';
const WIDEVINE_LICENSE_URL = 'https://drm-widevine-licensing.axtest.net/AcquireLicense';
const PLAYREADY_LICENSE_URL = 'https://drm-playready-licensing.axtest.net/AcquireLicense';

// HLS FairPlay DRM test stream (Axinom test content)
const HLS_DRM_URL = 'https://media.axprod.net/TestVectors/v7-MultiDRM-SingleKey/Manifest.m3u8';
const WIDEVINE_HLS_LICENSE_URL = 'https://drm-widevine-licensing.axtest.net/AcquireLicense';

// Player instance management
const players = new Map();

const cleanup = (id) => {
  players.get(id)?.destroy();
  players.delete(id);
};

export default {
  title: 'Another Player',
  argTypes: {
    src: { control: 'text', description: 'Video source URL' },
  },
};

/**
 * Basic Player - Standard MP4 video with full controls
 */
export const BasicPlayer = ({ src = MP4_URL }) => {
  cleanup('basic');

  requestAnimationFrame(() => {
    const el = document.getElementById('basic-player');
    if (el) {
      const player = createPlayer({ src }).bind(el);
      players.set('basic', player);
    }
  });

  return html`
    <div style="max-width: 800px; margin: 0 auto;">
      <another-player id="basic-player" src="${src}">
        <another-player-controls slot="controls">
          <another-player-play-button></another-player-play-button>
          <another-player-progress-bar></another-player-progress-bar>
          <another-player-time-display></another-player-time-display>
          <another-player-mute-button></another-player-mute-button>
          <another-player-volume-slider></another-player-volume-slider>
          <another-player-fullscreen-button></another-player-fullscreen-button>
        </another-player-controls>
      </another-player>
    </div>
  `;
};

BasicPlayer.args = { src: MP4_URL };

/**
 * HLS Player - Adaptive bitrate streaming with HLS.js
 */
export const HLSPlayer = ({ src = HLS_URL }) => {
  cleanup('hls');

  requestAnimationFrame(() => {
    const el = document.getElementById('hls-player');
    if (el) {
      const player = createPlayer({ src })
        .use(hlsPlugin({ enableAdaptiveBitrate: true }))
        .bind(el);
      players.set('hls', player);
    }
  });

  return html`
    <div style="max-width: 800px; margin: 0 auto;">
      <another-player id="hls-player" src="${src}">
        <another-player-controls slot="controls">
          <another-player-play-button></another-player-play-button>
          <another-player-progress-bar></another-player-progress-bar>
          <another-player-time-display></another-player-time-display>
          <another-player-mute-button></another-player-mute-button>
          <another-player-volume-slider></another-player-volume-slider>
          <another-player-fullscreen-button></another-player-fullscreen-button>
        </another-player-controls>
      </another-player>
    </div>
  `;
};

HLSPlayer.args = { src: HLS_URL };

/**
 * DASH Player - Adaptive bitrate streaming with dash.js
 */
export const DASHPlayer = ({ src = DASH_URL }) => {
  cleanup('dash');

  requestAnimationFrame(() => {
    const el = document.getElementById('dash-player');
    if (el) {
      const player = createPlayer({ src })
        .use(dashPlugin({ enableAdaptiveBitrate: true }))
        .bind(el);
      players.set('dash', player);
    }
  });

  return html`
    <div style="max-width: 800px; margin: 0 auto;">
      <another-player id="dash-player" src="${src}">
        <another-player-controls slot="controls">
          <another-player-play-button></another-player-play-button>
          <another-player-progress-bar></another-player-progress-bar>
          <another-player-time-display></another-player-time-display>
          <another-player-mute-button></another-player-mute-button>
          <another-player-volume-slider></another-player-volume-slider>
          <another-player-fullscreen-button></another-player-fullscreen-button>
        </another-player-controls>
      </another-player>
    </div>
  `;
};

DASHPlayer.args = { src: DASH_URL };

/**
 * DASH DRM Player - MPEG-DASH with Widevine/PlayReady DRM via dash.js
 */
export const DASHDRMPlayer = ({ src = DASH_DRM_URL }) => {
  cleanup('dash-drm');

  requestAnimationFrame(() => {
    const el = document.getElementById('dash-drm-player');
    if (el) {
      const player = createPlayer({ src })
        .use(dashPlugin({
          enableAdaptiveBitrate: true,
          protectionData: {
            'com.widevine.alpha': {
              serverURL: WIDEVINE_LICENSE_URL,
              httpRequestHeaders: {
                'X-AxDRM-Message': 'your-drm-token-here',
              },
            },
            'com.microsoft.playready': {
              serverURL: PLAYREADY_LICENSE_URL,
              httpRequestHeaders: {
                'X-AxDRM-Message': 'your-drm-token-here',
              },
            },
          },
        }))
        .bind(el);
      players.set('dash-drm', player);
    }
  });

  return html`
    <div style="max-width: 800px; margin: 0 auto;">
      <p style="font-size: 0.85em; color: #666;">
        DRM-protected DASH stream. Requires valid license server credentials.
      </p>
      <another-player id="dash-drm-player" src="${src}">
        <another-player-controls slot="controls">
          <another-player-play-button></another-player-play-button>
          <another-player-progress-bar></another-player-progress-bar>
          <another-player-time-display></another-player-time-display>
          <another-player-mute-button></another-player-mute-button>
          <another-player-volume-slider></another-player-volume-slider>
          <another-player-fullscreen-button></another-player-fullscreen-button>
        </another-player-controls>
      </another-player>
    </div>
  `;
};

DASHDRMPlayer.args = { src: DASH_DRM_URL };

/**
 * HLS DRM Player - HLS with Widevine DRM via hls.js EME
 */
export const HLSDRMPlayer = ({ src = HLS_DRM_URL }) => {
  cleanup('hls-drm');

  requestAnimationFrame(() => {
    const el = document.getElementById('hls-drm-player');
    if (el) {
      const player = createPlayer({ src })
        .use(hlsPlugin({
          enableAdaptiveBitrate: true,
          drmSystems: {
            'com.widevine.alpha': {
              licenseUrl: WIDEVINE_HLS_LICENSE_URL,
            },
          },
        }))
        .bind(el);
      players.set('hls-drm', player);
    }
  });

  return html`
    <div style="max-width: 800px; margin: 0 auto;">
      <p style="font-size: 0.85em; color: #666;">
        DRM-protected HLS stream. Requires valid license server credentials.
      </p>
      <another-player id="hls-drm-player" src="${src}">
        <another-player-controls slot="controls">
          <another-player-play-button></another-player-play-button>
          <another-player-progress-bar></another-player-progress-bar>
          <another-player-time-display></another-player-time-display>
          <another-player-mute-button></another-player-mute-button>
          <another-player-volume-slider></another-player-volume-slider>
          <another-player-fullscreen-button></another-player-fullscreen-button>
        </another-player-controls>
      </another-player>
    </div>
  `;
};

HLSDRMPlayer.args = { src: HLS_DRM_URL };
