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
