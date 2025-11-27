import type { MediaPlayerClass, MediaPlayerSettingClass, Representation } from 'dashjs';
import { definePlugin, type PluginContext } from '../plugin';
import type { PlayerEventMap } from '../types';

/** Quality level representation for DASH streams */
export interface DashQualityLevel {
  /** Bitrate in bits per second */
  bitrate: number;
  /** Width of the video */
  width: number;
  /** Height of the video */
  height: number;
  /** Original index in the DASH manifest */
  index: number;
  /** Quality ID from DASH manifest */
  qualityId: string;
}

/** DASH plugin options */
export interface DashPluginOptions {
  /** Custom dash.js settings */
  dashConfig?: Partial<MediaPlayerSettingClass>;
  /**
   * Enable adaptive bitrate streaming.
   * When true (default), the player will automatically switch quality levels.
   * When false, ABR is disabled.
   */
  enableAdaptiveBitrate?: boolean;
  /**
   * Initial quality index for video. -1 means auto.
   */
  initialVideoQuality?: number;
}

/** Extended player events for DASH plugin */
export interface DashPlayerEventMap extends PlayerEventMap {
  /** Emitted when quality levels are loaded */
  dashQualityLevels: { levels: DashQualityLevel[] };
  /** Emitted when quality level changes */
  dashQualityChange: { level: DashQualityLevel | null; auto: boolean };
  /** Emitted when DASH manifest is loaded */
  dashManifestLoaded: { type: string };
  /** Emitted on DASH error */
  dashError: { error: string };
}

/** Check if a source is a DASH stream */
export function isDashSource(src: string): boolean {
  return /\.mpd($|\?)/i.test(src);
}

/**
 * DASH Plugin for Another Player
 *
 * Provides MPEG-DASH streaming support using dash.js library.
 *
 * @example
 * ```ts
 * import { createPlayer } from '@another-player/core';
 * import { dashPlugin } from '@another-player/core/plugins';
 *
 * const player = createPlayer({
 *   src: 'https://example.com/stream.mpd',
 * }).use(dashPlugin()).mount('#player');
 * ```
 */
export const dashPlugin = definePlugin<DashPluginOptions>((options = {}) => {
  const {
    dashConfig = {},
    enableAdaptiveBitrate = true,
    initialVideoQuality = -1,
  } = options;

  let dashPlayer: MediaPlayerClass | null = null;

  /** Convert Representation to DashQualityLevel */
  const representationToQualityLevel = (
    rep: Representation,
    index: number,
  ): DashQualityLevel => ({
    bitrate: rep.bandwidth,
    width: rep.width,
    height: rep.height,
    index,
    qualityId: `${rep.width}x${rep.height}@${rep.bandwidth}`,
  });

  /** Get quality levels from DASH player */
  const getQualityLevels = (): DashQualityLevel[] => {
    if (!dashPlayer) return [];

    const representations = dashPlayer.getRepresentationsByType('video');
    if (!representations) return [];

    return representations.map((rep, index) => representationToQualityLevel(rep, index));
  };

  /** Get current quality level */
  const getCurrentQualityLevel = (): DashQualityLevel | null => {
    if (!dashPlayer) return null;

    const currentRep = dashPlayer.getCurrentRepresentationForType('video');
    if (!currentRep) return null;

    const levels = getQualityLevels();
    const index = levels.findIndex((level) => level.bitrate === currentRep.bandwidth
        && level.width === currentRep.width
        && level.height === currentRep.height);

    if (index === -1) return null;

    return levels[index];
  };

  /** Set quality level. -1 for auto */
  const setQualityLevel = (levelIndex: number): void => {
    if (!dashPlayer) return;

    if (levelIndex === -1) {
      // Enable auto quality
      dashPlayer.updateSettings({
        streaming: {
          abr: {
            autoSwitchBitrate: { video: true },
          },
        },
      });
    } else {
      const levels = getQualityLevels();
      if (levelIndex >= 0 && levelIndex < levels.length) {
        // Disable auto quality and set specific level
        dashPlayer.updateSettings({
          streaming: {
            abr: {
              autoSwitchBitrate: { video: false },
            },
          },
        });
        dashPlayer.setRepresentationForTypeByIndex('video', levelIndex);
      }
    }
  };

  /** Check if auto quality is enabled */
  const isAutoQuality = (): boolean => {
    if (!dashPlayer) return true;
    const settings = dashPlayer.getSettings();
    return settings.streaming?.abr?.autoSwitchBitrate?.video ?? true;
  };

  return {
    name: 'dash',
    options,

    async install(context: PluginContext) {
      const src = context.getSrc();

      // Only activate for DASH sources
      if (!isDashSource(src)) return;

      // Dynamically import dash.js
      const dashjs = await import('dashjs');
      const { videoElement } = context;

      // Create DASH player instance
      dashPlayer = dashjs.MediaPlayer().create();

      // Apply initial settings
      dashPlayer.updateSettings({
        ...dashConfig,
        streaming: {
          ...dashConfig.streaming,
          abr: {
            ...dashConfig.streaming?.abr,
            autoSwitchBitrate: {
              video: enableAdaptiveBitrate,
              audio: enableAdaptiveBitrate,
            },
          },
        },
      });

      // Set initial quality if specified
      if (initialVideoQuality >= 0) {
        dashPlayer.updateSettings({
          streaming: {
            abr: {
              autoSwitchBitrate: { video: false },
              initialBitrate: { video: 0 },
            },
          },
        });
      }

      // Initialize the player
      dashPlayer.initialize(videoElement, src, false);

      // Set up event listeners
      dashPlayer.on('manifestLoaded', () => {
        videoElement.dispatchEvent(new CustomEvent('dashManifestLoaded', {
          detail: { type: 'manifest' },
        }));

        // Emit quality levels after manifest is loaded
        const levels = getQualityLevels();
        videoElement.dispatchEvent(new CustomEvent('dashQualityLevels', {
          detail: { levels },
        }));

        // Set initial quality if specified (after manifest is parsed)
        if (initialVideoQuality >= 0 && levels.length > 0) {
          const qualityIndex = Math.min(initialVideoQuality, levels.length - 1);
          dashPlayer?.setRepresentationForTypeByIndex('video', qualityIndex);
        }
      });

      dashPlayer.on('qualityChangeRendered', (e: { mediaType?: string; newQuality?: number }) => {
        if (e.mediaType === 'video' && typeof e.newQuality === 'number') {
          const levels = getQualityLevels();
          const level = levels[e.newQuality] ?? null;

          videoElement.dispatchEvent(new CustomEvent('dashQualityChange', {
            detail: {
              level,
              auto: isAutoQuality(),
            },
          }));
        }
      });

      dashPlayer.on('error', (e: { error?: string }) => {
        videoElement.dispatchEvent(new CustomEvent('dashError', {
          detail: {
            error: e.error ?? 'Unknown error',
          },
        }));
      });
    },

    mount(context: PluginContext) {
      // Expose quality control methods on video element for external access
      const { videoElement } = context;

      // Use a custom property to expose DASH controls
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-underscore-dangle
      (videoElement as any).__dashControls = {
        getQualityLevels,
        getCurrentQualityLevel,
        setQualityLevel,
        isAutoQuality,
        getInstance: () => dashPlayer,
      };
    },

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    destroy(_context: PluginContext) {
      if (dashPlayer) {
        dashPlayer.reset();
        dashPlayer = null;
      }
    },
  };
});

export default dashPlugin;
