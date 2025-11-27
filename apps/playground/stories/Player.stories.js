/* eslint-disable import/no-extraneous-dependencies */
import { html } from 'lit-html';

import {
  createPlayer,
  hlsPlugin,
  dashPlugin,
} from '@another-player/core';

// Sample video URLs
const DEFAULT_VIDEO_URL = 'https://cdn.jsdelivr.net/npm/big-buck-bunny-1080p@0.0.6/video.mp4';
const HLS_VIDEO_URL = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
const DASH_VIDEO_URL = 'https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd';

// Store player instances for cleanup
const playerInstances = new Map();

// Cleanup function to destroy previous player instances
const cleanupPlayer = (storyId) => {
  const existingPlayer = playerInstances.get(storyId);
  if (existingPlayer) {
    existingPlayer.destroy();
    playerInstances.delete(storyId);
  }
};

// Common control bar styles
const controlBarStyles = `
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  padding: 12px;
  color: white;
`;

export default {
  title: 'Another Player',
  argTypes: {
    src: {
      control: 'text',
      description: 'Video source URL',
    },
  },
};

/**
 * Basic MP4 Player
 * Demonstrates the core player functionality with a standard MP4 video file.
 */
export const BasicPlayer = ({ src = DEFAULT_VIDEO_URL }) => {
  cleanupPlayer('basic');
  const player = createPlayer({ src });
  playerInstances.set('basic', player);

  return html`
    <div style="max-width: 800px; margin: 0 auto;">
      <another-player src="${src}"></another-player>
    </div>
  `;
};

BasicPlayer.args = {
  src: DEFAULT_VIDEO_URL,
};

BasicPlayer.play = () => {
  const player = playerInstances.get('basic');
  if (player) {
    player.bind(document.querySelector('another-player'));
  }
};

/**
 * Player with Controls
 * Demonstrates the composable UI controls using slot-based architecture.
 * Shows how to use headless control components like a compound component API.
 */
export const PlayerWithControls = ({ src = DEFAULT_VIDEO_URL }) => {
  cleanupPlayer('controls');
  const player = createPlayer({ src });
  playerInstances.set('controls', player);

  return html`
    <div style="max-width: 800px; margin: 0 auto;">
      <another-player src="${src}">
        <another-player-controls slot="controls" style="${controlBarStyles}">
          <another-player-play-button></another-player-play-button>
          <another-player-progress-bar></another-player-progress-bar>
          <another-player-time-display></another-player-time-display>
          <another-player-mute-button></another-player-mute-button>
          <another-player-volume-slider></another-player-volume-slider>
          <another-player-fullscreen-button></another-player-fullscreen-button>
        </another-player-controls>
      </another-player>
      <div style="margin-top: 16px; padding: 16px; background: #f5f5f5; border-radius: 8px;">
        <h4 style="margin: 0 0 8px 0;">Composable Controls</h4>
        <p style="margin: 0; font-size: 14px; color: #666;">
          This player uses the headless UI control components with a slot-based compound component pattern.
          Each control automatically connects to the parent player element.
        </p>
      </div>
    </div>
  `;
};

PlayerWithControls.args = {
  src: DEFAULT_VIDEO_URL,
};

PlayerWithControls.play = () => {
  const player = playerInstances.get('controls');
  if (player) {
    player.bind(document.querySelector('another-player'));
  }
};

PlayerWithControls.parameters = {
  docs: {
    description: {
      story: 'A media player with composable UI controls using the compound component pattern. Each control component automatically finds and connects to its parent player element.',
    },
  },
};

/**
 * Minimal Controls Player
 * Shows a minimal control setup with just play/pause and progress.
 */
export const MinimalControlsPlayer = ({ src = DEFAULT_VIDEO_URL }) => {
  cleanupPlayer('minimal');
  const player = createPlayer({ src });
  playerInstances.set('minimal', player);

  return html`
    <div style="max-width: 800px; margin: 0 auto;">
      <another-player src="${src}">
        <another-player-controls slot="controls" style="${controlBarStyles}">
          <another-player-play-button></another-player-play-button>
          <another-player-progress-bar></another-player-progress-bar>
          <another-player-time-display></another-player-time-display>
        </another-player-controls>
      </another-player>
    </div>
  `;
};

MinimalControlsPlayer.args = {
  src: DEFAULT_VIDEO_URL,
};

MinimalControlsPlayer.play = () => {
  const player = playerInstances.get('minimal');
  if (player) {
    player.bind(document.querySelector('another-player'));
  }
};

MinimalControlsPlayer.parameters = {
  docs: {
    description: {
      story: 'A minimal player with just play/pause button, progress bar, and time display.',
    },
  },
};

/**
 * HLS Streaming Player
 * Demonstrates HLS streaming support using HLS.js.
 * Features adaptive bitrate streaming.
 */
export const HLSPlayer = ({ src = HLS_VIDEO_URL }) => {
  cleanupPlayer('hls');

  // Use requestAnimationFrame for more reliable DOM timing
  requestAnimationFrame(() => {
    const container = document.getElementById('hls-player-container');
    if (container) {
      const player = createPlayer({ src })
        .use(hlsPlugin({ enableAdaptiveBitrate: true }))
        .mount(container);
      playerInstances.set('hls', player);
    }
  });

  return html`
    <div style="max-width: 800px; margin: 0 auto;">
      <div id="hls-player-container"></div>
      <div style="margin-top: 16px; padding: 16px; background: #f5f5f5; border-radius: 8px;">
        <h4 style="margin: 0 0 8px 0;">HLS Stream Info</h4>
        <p style="margin: 0; font-size: 14px; color: #666;">
          This player uses HLS.js for adaptive bitrate streaming.
          Quality levels are automatically selected based on network conditions.
        </p>
      </div>
    </div>
  `;
};

HLSPlayer.args = {
  src: HLS_VIDEO_URL,
};

HLSPlayer.parameters = {
  docs: {
    description: {
      story: 'HLS streaming player with adaptive bitrate support using HLS.js.',
    },
  },
};

/**
 * HLS Player with Controls
 * HLS streaming player with composable UI controls.
 */
export const HLSPlayerWithControls = ({ src = HLS_VIDEO_URL }) => {
  cleanupPlayer('hls-controls');

  // Use requestAnimationFrame for more reliable DOM timing
  requestAnimationFrame(() => {
    const playerElement = document.getElementById('hls-controls-player');
    if (playerElement) {
      const player = createPlayer({ src })
        .use(hlsPlugin({ enableAdaptiveBitrate: true }))
        .bind(playerElement);
      playerInstances.set('hls-controls', player);
    }
  });

  return html`
    <div style="max-width: 800px; margin: 0 auto;">
      <another-player id="hls-controls-player" src="${src}">
        <another-player-controls slot="controls" style="${controlBarStyles}">
          <another-player-play-button></another-player-play-button>
          <another-player-progress-bar></another-player-progress-bar>
          <another-player-time-display></another-player-time-display>
          <another-player-mute-button></another-player-mute-button>
          <another-player-volume-slider></another-player-volume-slider>
          <another-player-fullscreen-button></another-player-fullscreen-button>
        </another-player-controls>
      </another-player>
      <div style="margin-top: 16px; padding: 16px; background: #f5f5f5; border-radius: 8px;">
        <h4 style="margin: 0 0 8px 0;">HLS with Controls</h4>
        <p style="margin: 0; font-size: 14px; color: #666;">
          HLS streaming player with composable UI controls.
        </p>
      </div>
    </div>
  `;
};

HLSPlayerWithControls.args = {
  src: HLS_VIDEO_URL,
};

HLSPlayerWithControls.parameters = {
  docs: {
    description: {
      story: 'HLS streaming player with adaptive bitrate support and composable UI controls.',
    },
  },
};

/**
 * DASH Streaming Player
 * Demonstrates MPEG-DASH streaming support using dash.js.
 * Features adaptive bitrate streaming.
 */
export const DASHPlayer = ({ src = DASH_VIDEO_URL }) => {
  cleanupPlayer('dash');

  // Use requestAnimationFrame for more reliable DOM timing
  requestAnimationFrame(() => {
    const container = document.getElementById('dash-player-container');
    if (container) {
      const player = createPlayer({ src })
        .use(dashPlugin({ enableAdaptiveBitrate: true }))
        .mount(container);
      playerInstances.set('dash', player);
    }
  });

  return html`
    <div style="max-width: 800px; margin: 0 auto;">
      <div id="dash-player-container"></div>
      <div style="margin-top: 16px; padding: 16px; background: #f5f5f5; border-radius: 8px;">
        <h4 style="margin: 0 0 8px 0;">DASH Stream Info</h4>
        <p style="margin: 0; font-size: 14px; color: #666;">
          This player uses dash.js for MPEG-DASH adaptive bitrate streaming.
          Quality levels are automatically selected based on network conditions.
        </p>
      </div>
    </div>
  `;
};

DASHPlayer.args = {
  src: DASH_VIDEO_URL,
};

DASHPlayer.parameters = {
  docs: {
    description: {
      story: 'MPEG-DASH streaming player with adaptive bitrate support using dash.js.',
    },
  },
};

/**
 * DASH Player with Controls
 * DASH streaming player with composable UI controls.
 */
export const DASHPlayerWithControls = ({ src = DASH_VIDEO_URL }) => {
  cleanupPlayer('dash-controls');

  // Use requestAnimationFrame for more reliable DOM timing
  requestAnimationFrame(() => {
    const playerElement = document.getElementById('dash-controls-player');
    if (playerElement) {
      const player = createPlayer({ src })
        .use(dashPlugin({ enableAdaptiveBitrate: true }))
        .bind(playerElement);
      playerInstances.set('dash-controls', player);
    }
  });

  return html`
    <div style="max-width: 800px; margin: 0 auto;">
      <another-player id="dash-controls-player" src="${src}">
        <another-player-controls slot="controls" style="${controlBarStyles}">
          <another-player-play-button></another-player-play-button>
          <another-player-progress-bar></another-player-progress-bar>
          <another-player-time-display></another-player-time-display>
          <another-player-mute-button></another-player-mute-button>
          <another-player-volume-slider></another-player-volume-slider>
          <another-player-fullscreen-button></another-player-fullscreen-button>
        </another-player-controls>
      </another-player>
      <div style="margin-top: 16px; padding: 16px; background: #f5f5f5; border-radius: 8px;">
        <h4 style="margin: 0 0 8px 0;">DASH with Controls</h4>
        <p style="margin: 0; font-size: 14px; color: #666;">
          DASH streaming player with composable UI controls.
        </p>
      </div>
    </div>
  `;
};

DASHPlayerWithControls.args = {
  src: DASH_VIDEO_URL,
};

DASHPlayerWithControls.parameters = {
  docs: {
    description: {
      story: 'DASH streaming player with adaptive bitrate support and composable UI controls.',
    },
  },
};
