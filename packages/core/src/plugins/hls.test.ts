import {
  describe, it, expect, beforeEach, afterEach, vi,
} from 'vitest';
import { createPlayer } from '../core';
import {
  hlsPlugin,
  isHlsSource,
  isHlsSupported,
  type HlsPluginOptions,
} from './hls';

// Mock hls.js module
vi.mock('hls.js', () => {
  const mockHlsInstance = {
    attachMedia: vi.fn(),
    loadSource: vi.fn(),
    destroy: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    levels: [
      { bitrate: 500000, width: 640, height: 360 },
      { bitrate: 1000000, width: 1280, height: 720 },
      { bitrate: 2500000, width: 1920, height: 1080 },
    ],
    currentLevel: 1,
    autoLevelEnabled: true,
    startLoad: vi.fn(),
    recoverMediaError: vi.fn(),
  };

  class MockHls {
    static isSupported = vi.fn(() => true);

    static Events = {
      MANIFEST_PARSED: 'hlsManifestParsed',
      LEVEL_SWITCHED: 'hlsLevelSwitched',
      ERROR: 'hlsError',
    };

    static ErrorTypes = {
      NETWORK_ERROR: 'networkError',
      MEDIA_ERROR: 'mediaError',
      OTHER_ERROR: 'otherError',
    };

    config: Record<string, unknown>;

    attachMedia = mockHlsInstance.attachMedia;

    loadSource = mockHlsInstance.loadSource;

    destroy = mockHlsInstance.destroy;

    on = mockHlsInstance.on;

    off = mockHlsInstance.off;

    levels = mockHlsInstance.levels;

    currentLevel = mockHlsInstance.currentLevel;

    autoLevelEnabled = mockHlsInstance.autoLevelEnabled;

    startLoad = mockHlsInstance.startLoad;

    recoverMediaError = mockHlsInstance.recoverMediaError;

    constructor(config: Record<string, unknown> = {}) {
      this.config = config;
    }
  }

  return { default: MockHls };
});

describe('HLS Plugin', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'player-container';
    document.body.appendChild(container);
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('isHlsSource', () => {
    it('should return true for .m3u8 files', () => {
      expect(isHlsSource('https://example.com/stream.m3u8')).toBe(true);
      expect(isHlsSource('https://example.com/video.M3U8')).toBe(true);
      expect(isHlsSource('/path/to/stream.m3u8')).toBe(true);
    });

    it('should return true for .m3u8 files with query params', () => {
      expect(isHlsSource('https://example.com/stream.m3u8?token=abc')).toBe(true);
      expect(isHlsSource('https://example.com/stream.m3u8?a=1&b=2')).toBe(true);
    });

    it('should return false for non-HLS files', () => {
      expect(isHlsSource('https://example.com/video.mp4')).toBe(false);
      expect(isHlsSource('https://example.com/stream.mpd')).toBe(false);
      expect(isHlsSource('https://example.com/video.webm')).toBe(false);
    });
  });

  describe('isHlsSupported', () => {
    it('should check for MediaSource support', () => {
      // In jsdom, MediaSource may not be available
      const result = isHlsSupported();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('hlsPlugin factory', () => {
    it('should create a plugin factory function', () => {
      expect(typeof hlsPlugin).toBe('function');
    });

    it('should create a plugin with name "hls"', () => {
      const plugin = hlsPlugin();
      expect(plugin.name).toBe('hls');
    });

    it('should accept options', () => {
      const options: HlsPluginOptions = {
        enableAdaptiveBitrate: false,
        startLevel: 2,
      };
      const plugin = hlsPlugin(options);
      expect(plugin.options).toEqual(options);
    });

    it('should have lifecycle hooks', () => {
      const plugin = hlsPlugin();
      expect(typeof plugin.install).toBe('function');
      expect(typeof plugin.mount).toBe('function');
      expect(typeof plugin.destroy).toBe('function');
    });
  });

  describe('Plugin registration', () => {
    it('should register with player', () => {
      const player = createPlayer({ src: 'https://example.com/video.mp4' });
      player.use(hlsPlugin());

      expect(player.getPlugins()).toHaveLength(1);
      expect(player.getPlugins()[0].name).toBe('hls');
    });

    it('should support method chaining', () => {
      const player = createPlayer({ src: 'https://example.com/video.mp4' });
      const result = player.use(hlsPlugin());
      expect(result).toBe(player);
    });

    it('should chain with mount()', () => {
      const player = createPlayer({ src: 'https://example.com/video.mp4' });
      const result = player.use(hlsPlugin()).mount(container);

      expect(result).toBe(player);
      expect(player.getPlugins()).toHaveLength(1);
    });
  });

  describe('HLS source handling', () => {
    it('should not activate for non-HLS sources', async () => {
      const player = createPlayer({ src: 'https://example.com/video.mp4' });
      player.use(hlsPlugin()).mount(container);

      // Wait for async plugin hooks
      await new Promise((resolve) => { setTimeout(resolve, 20); });

      // The mock should not be called for mp4 sources
      const hlsjs = await import('hls.js');
      // Verify the plugin doesn't activate by checking that
      // no hls instance methods were called
      expect(hlsjs.default.isSupported).not.toHaveBeenCalled();
    });

    it('should activate for HLS sources when native support is not available', async () => {
      // Create a player with HLS source
      const player = createPlayer({ src: 'https://example.com/stream.m3u8' });

      // Mock that native HLS is not supported
      const originalCanPlayType = HTMLVideoElement.prototype.canPlayType;
      HTMLVideoElement.prototype.canPlayType = vi.fn(
        () => '' as CanPlayTypeResult,
      );

      // Mock MediaSource to indicate HLS.js is supported
      type GlobalWithMediaSource = {
        MediaSource?: typeof MediaSource;
      };
      const originalMediaSource = (globalThis as unknown as GlobalWithMediaSource).MediaSource;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).MediaSource = {
        isTypeSupported: () => true,
      };

      player.use(hlsPlugin()).mount(container);

      // Wait for async plugin hooks
      await new Promise((resolve) => { setTimeout(resolve, 50); });

      // Restore originals
      HTMLVideoElement.prototype.canPlayType = originalCanPlayType;
      if (originalMediaSource) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (globalThis as any).MediaSource = originalMediaSource;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (globalThis as any).MediaSource;
      }

      // The HLS.js mock should have been used
      const hlsjs = await import('hls.js');
      expect(hlsjs.default.isSupported).toHaveBeenCalled();
    });
  });

  describe('Plugin with options', () => {
    it('should respect enableAdaptiveBitrate option', () => {
      const plugin = hlsPlugin({ enableAdaptiveBitrate: false });
      expect(plugin.options?.enableAdaptiveBitrate).toBe(false);
    });

    it('should respect startLevel option', () => {
      const plugin = hlsPlugin({ startLevel: 2 });
      expect(plugin.options?.startLevel).toBe(2);
    });

    it('should use default options when none provided', () => {
      const plugin = hlsPlugin();
      // Default options should be empty object
      expect(plugin.options).toEqual({});
    });
  });

  describe('Plugin destroy', () => {
    it('should clean up on player destroy', async () => {
      const player = createPlayer({ src: 'https://example.com/stream.m3u8' });

      // Mock that native HLS is not supported
      const originalCanPlayType = HTMLVideoElement.prototype.canPlayType;
      HTMLVideoElement.prototype.canPlayType = vi.fn(
        () => '' as CanPlayTypeResult,
      );

      player.use(hlsPlugin()).mount(container);

      // Wait for async plugin hooks
      await new Promise((resolve) => { setTimeout(resolve, 50); });

      // Destroy player
      player.destroy();

      // Wait for async destroy hooks
      await new Promise((resolve) => { setTimeout(resolve, 20); });

      // Restore original
      HTMLVideoElement.prototype.canPlayType = originalCanPlayType;

      // Player should be destroyed
      expect(player.element).toBeUndefined();
    });
  });
});
