import type Hls from 'hls.js';
import { definePlugin, type PluginContext } from '../plugin';
import type { PlayerEventMap } from '../types';

/** Quality level representation for HLS streams */
export interface HlsQualityLevel {
  /** Bitrate in bits per second */
  bitrate: number;
  /** Width of the video */
  width: number;
  /** Height of the video */
  height: number;
  /** Original index in the HLS manifest */
  index: number;
}

/** HLS plugin options */
export interface HlsPluginOptions {
  /** Custom HLS.js configuration options */
  hlsConfig?: Partial<Hls['config']>;
  /**
   * Enable adaptive bitrate streaming.
   * When true (default), the player will automatically switch quality levels.
   * When false, the player will stay at the initial quality level.
   */
  enableAdaptiveBitrate?: boolean;
  /**
   * Initial quality level index. -1 means auto.
   */
  startLevel?: number;
}

/** Extended player events for HLS plugin */
export interface HlsPlayerEventMap extends PlayerEventMap {
  /** Emitted when quality levels are loaded */
  hlsQualityLevels: { levels: HlsQualityLevel[] };
  /** Emitted when quality level changes */
  hlsQualityChange: { level: HlsQualityLevel | null; auto: boolean };
  /** Emitted when HLS manifest is parsed */
  hlsManifestParsed: { levels: number };
  /** Emitted on HLS error */
  hlsError: { type: string; details: string; fatal: boolean };
}

/** Check if a source is an HLS stream */
export function isHlsSource(src: string): boolean {
  return /\.m3u8($|\?)/i.test(src);
}

/** Check if HLS.js is supported in the current environment */
export function isHlsSupported(): boolean {
  // Check for Media Source Extensions support
  return typeof MediaSource !== 'undefined'
    && typeof MediaSource.isTypeSupported === 'function'
    && MediaSource.isTypeSupported('video/mp4; codecs="avc1.42E01E,mp4a.40.2"');
}

/**
 * HLS Plugin for Another Player
 *
 * Provides HLS streaming support using HLS.js library.
 *
 * @example
 * ```ts
 * import { createPlayer } from '@another-player/core';
 * import { hlsPlugin } from '@another-player/core/plugins';
 *
 * const player = createPlayer({
 *   src: 'https://example.com/stream.m3u8',
 * }).use(hlsPlugin()).mount('#player');
 * ```
 */
export const hlsPlugin = definePlugin<HlsPluginOptions>((options = {}) => {
  const {
    hlsConfig = {},
    enableAdaptiveBitrate = true,
    startLevel = -1,
  } = options;

  let hlsInstance: Hls | null = null;

  /** Get quality levels from HLS instance */
  const getQualityLevels = (): HlsQualityLevel[] => {
    if (!hlsInstance) return [];

    return hlsInstance.levels.map((level, index) => ({
      bitrate: level.bitrate,
      width: level.width,
      height: level.height,
      index,
    }));
  };

  /** Get current quality level */
  const getCurrentQualityLevel = (): HlsQualityLevel | null => {
    if (!hlsInstance || hlsInstance.currentLevel < 0) return null;

    const level = hlsInstance.levels[hlsInstance.currentLevel];
    if (!level) return null;

    return {
      bitrate: level.bitrate,
      width: level.width,
      height: level.height,
      index: hlsInstance.currentLevel,
    };
  };

  /** Set quality level. -1 for auto */
  const setQualityLevel = (levelIndex: number): void => {
    if (!hlsInstance) return;

    if (levelIndex === -1) {
      // Enable auto quality
      hlsInstance.currentLevel = -1;
    } else if (levelIndex >= 0 && levelIndex < hlsInstance.levels.length) {
      hlsInstance.currentLevel = levelIndex;
    }
  };

  /** Check if auto quality is enabled */
  const isAutoQuality = (): boolean => hlsInstance?.autoLevelEnabled ?? true;

  return {
    name: 'hls',
    options,

    async install(context: PluginContext) {
      const src = context.getSrc();

      // Only activate for HLS sources
      if (!isHlsSource(src)) return;

      // Check if video element natively supports HLS (e.g., Safari)
      const { videoElement } = context;
      if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support, no need for HLS.js
        return;
      }

      // Check if HLS.js is supported
      if (!isHlsSupported()) {
        // eslint-disable-next-line no-console
        console.warn('[HLS Plugin] HLS.js is not supported in this browser');
        return;
      }

      // Dynamically import HLS.js
      // This allows the plugin to be tree-shaken if not used
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const HlsModule = await import('hls.js');
      const Hls = HlsModule.default;

      if (!Hls.isSupported()) {
        // eslint-disable-next-line no-console
        console.warn('[HLS Plugin] HLS.js is not supported in this browser');
        return;
      }

      // Create HLS instance with config
      hlsInstance = new Hls({
        ...hlsConfig,
        startLevel: enableAdaptiveBitrate ? startLevel : 0,
        autoStartLoad: true,
      });

      // Attach to video element
      hlsInstance.attachMedia(videoElement);

      // Set up event listeners
      hlsInstance.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        // Emit custom event for manifest parsed
        videoElement.dispatchEvent(new CustomEvent('hlsManifestParsed', {
          detail: { levels: data.levels.length },
        }));
      });

      hlsInstance.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
        const level = hlsInstance?.levels[data.level];
        if (level) {
          const qualityLevel: HlsQualityLevel = {
            bitrate: level.bitrate,
            width: level.width,
            height: level.height,
            index: data.level,
          };

          videoElement.dispatchEvent(new CustomEvent('hlsQualityChange', {
            detail: {
              level: qualityLevel,
              auto: hlsInstance?.autoLevelEnabled ?? false,
            },
          }));
        }
      });

      hlsInstance.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              // Try to recover from network error
              hlsInstance?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              // Try to recover from media error
              hlsInstance?.recoverMediaError();
              break;
            default:
              // Cannot recover, destroy HLS instance
              hlsInstance?.destroy();
              hlsInstance = null;
              break;
          }
        }

        videoElement.dispatchEvent(new CustomEvent('hlsError', {
          detail: {
            type: data.type,
            details: data.details,
            fatal: data.fatal,
          },
        }));
      });

      // Load the source
      hlsInstance.loadSource(src);
    },

    mount(context: PluginContext) {
      // Expose quality control methods on video element for external access
      const { videoElement } = context;

      // Use a custom property to expose HLS controls
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-underscore-dangle
      (videoElement as any).__hlsControls = {
        getQualityLevels,
        getCurrentQualityLevel,
        setQualityLevel,
        isAutoQuality,
        getInstance: () => hlsInstance,
      };
    },

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    destroy(_context: PluginContext) {
      if (hlsInstance) {
        hlsInstance.destroy();
        hlsInstance = null;
      }
    },
  };
});

export default hlsPlugin;
