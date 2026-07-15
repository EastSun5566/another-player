import type Hls from 'hls.js';
import type { DRMSystemsConfiguration } from 'hls.js';
import type { PluginContext, PluginWithApi } from '../plugin';

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
  /**
   * DRM system configurations keyed by key system string (e.g. 'com.widevine.alpha').
   * When provided, EME is automatically enabled unless overridden by the `emeEnabled` option
   * or `hlsConfig.emeEnabled`.
   *
   * @example
   * ```ts
   * hlsPlugin({
   *   drmSystems: {
   *     'com.widevine.alpha': { licenseUrl: 'https://license.example.com/widevine' },
   *     'com.microsoft.playready': { licenseUrl: 'https://license.example.com/playready' },
   *   },
   * })
   * ```
   */
  drmSystems?: DRMSystemsConfiguration;
  /**
   * Explicitly enable or disable EME (Encrypted Media Extensions) for DRM.
   * Takes precedence over `hlsConfig.emeEnabled` and the automatic derivation from `drmSystems`.
   * When not set, falls back to `hlsConfig.emeEnabled`, then defaults to `true` when
   * `drmSystems` (or `hlsConfig.drmSystems`) is provided, and `false` otherwise.
   */
  emeEnabled?: boolean;
}

export interface HlsPluginApi {
  getQualityLevels: () => HlsQualityLevel[];
  getCurrentQualityLevel: () => HlsQualityLevel | null;
  setQualityLevel: (levelIndex: number) => void;
  isAutoQuality: () => boolean;
  getInstance: () => Hls | null;
}

declare module '../types' {
  interface PlayerEventMap {
    hlsQualityLevels: { levels: HlsQualityLevel[] };
    hlsQualityChange: { level: HlsQualityLevel | null; auto: boolean };
    hlsManifestParsed: { levels: number };
    hlsError: { type: string; details: string; fatal: boolean };
  }
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
 * import { createPlayer, hlsPlugin } from '@another-player/core';
 *
 * const player = createPlayer({
 *   src: 'https://example.com/stream.m3u8',
 * }).use(hlsPlugin()).mount('#player');
 * ```
 */
export const hlsPlugin = (
  options: HlsPluginOptions = {},
): PluginWithApi<HlsPluginOptions, HlsPluginApi> => {
  const {
    hlsConfig = {},
    enableAdaptiveBitrate = true,
    startLevel = -1,
    drmSystems,
    emeEnabled: explicitEmeEnabled,
  } = options;

  // Local type to safely access DRM-related fields that may be present in hlsConfig
  // even when not part of the official HlsConfig TypeScript type.
  type HlsConfigWithDrm = {
    emeEnabled?: boolean;
    drmSystems?: DRMSystemsConfiguration;
  };
  const rawHlsConfig = hlsConfig as HlsConfigWithDrm;
  let emeEnabled: boolean;
  if (explicitEmeEnabled !== undefined) {
    emeEnabled = explicitEmeEnabled;
  } else if (rawHlsConfig.emeEnabled !== undefined) {
    emeEnabled = rawHlsConfig.emeEnabled;
  } else {
    emeEnabled = drmSystems !== undefined || rawHlsConfig.drmSystems !== undefined;
  }

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

  const api: HlsPluginApi = {
    getQualityLevels,
    getCurrentQualityLevel,
    setQualityLevel,
    isAutoQuality,
    getInstance: () => hlsInstance,
  };

  return {
    name: 'hls',
    options,
    api,

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
        console.warn('[HLS Plugin] HLS.js is not supported in this browser');
        return;
      }

      // Dynamically import HLS.js
      // This allows the plugin to be tree-shaken if not used
      const HlsModule = await import('hls.js');
      const Hls = HlsModule.default;

      if (!Hls.isSupported()) {
        console.warn('[HLS Plugin] HLS.js is not supported in this browser');
        return;
      }

      // Create HLS instance with config
      hlsInstance = new Hls({
        ...hlsConfig,
        startLevel: enableAdaptiveBitrate ? startLevel : 0,
        autoStartLoad: true,
        emeEnabled,
        ...(drmSystems !== undefined ? { drmSystems } : {}),
      });

      // Attach to video element
      hlsInstance.attachMedia(videoElement);

      // Set up event listeners
      hlsInstance.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        context.emit('hlsManifestParsed', { levels: data.levels.length });
        context.emit('hlsQualityLevels', { levels: getQualityLevels() });
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

          context.emit('hlsQualityChange', {
            level: qualityLevel,
            auto: hlsInstance?.autoLevelEnabled ?? false,
          });
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

        context.emit('hlsError', {
          type: data.type,
          details: data.details,
          fatal: data.fatal,
        });
      });

      // Load the source
      hlsInstance.loadSource(src);
    },

    destroy() {
      if (hlsInstance) {
        hlsInstance.destroy();
        hlsInstance = null;
      }
    },
  };
};

export default hlsPlugin;
