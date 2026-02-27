import {
  describe, it, expect, beforeEach, afterEach, vi,
} from 'vitest';
import { createPlayer } from '../core';
import {
  dashPlugin,
  isDashSource,
  type DashPluginOptions,
} from './dash';

// Mock dashjs module
vi.mock('dashjs', () => {
  const mockDashPlayer = {
    initialize: vi.fn(),
    updateSettings: vi.fn(),
    getSettings: vi.fn(() => ({
      streaming: {
        abr: {
          autoSwitchBitrate: { video: true, audio: true },
        },
      },
    })),
    getRepresentationsByType: vi.fn(() => [
      {
        bandwidth: 500000, width: 640, height: 360, absoluteIndex: 0,
      },
      {
        bandwidth: 1000000, width: 1280, height: 720, absoluteIndex: 1,
      },
      {
        bandwidth: 2500000, width: 1920, height: 1080, absoluteIndex: 2,
      },
    ]),
    getCurrentRepresentationForType: vi.fn(() => ({
      bandwidth: 1000000, width: 1280, height: 720, absoluteIndex: 1,
    })),
    setRepresentationForTypeByIndex: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    reset: vi.fn(),
    setProtectionData: vi.fn(),
  };

  return {
    MediaPlayer: () => ({
      create: () => mockDashPlayer,
    }),
    mockDashPlayer,
  };
});

describe('DASH Plugin', () => {
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

  describe('isDashSource', () => {
    it('should return true for .mpd files', () => {
      expect(isDashSource('https://example.com/stream.mpd')).toBe(true);
      expect(isDashSource('https://example.com/video.MPD')).toBe(true);
      expect(isDashSource('/path/to/stream.mpd')).toBe(true);
    });

    it('should return true for .mpd files with query params', () => {
      expect(isDashSource('https://example.com/stream.mpd?token=abc')).toBe(true);
      expect(isDashSource('https://example.com/stream.mpd?a=1&b=2')).toBe(true);
    });

    it('should return false for non-DASH files', () => {
      expect(isDashSource('https://example.com/video.mp4')).toBe(false);
      expect(isDashSource('https://example.com/stream.m3u8')).toBe(false);
      expect(isDashSource('https://example.com/video.webm')).toBe(false);
    });
  });

  describe('dashPlugin factory', () => {
    it('should create a plugin factory function', () => {
      expect(typeof dashPlugin).toBe('function');
    });

    it('should create a plugin with name "dash"', () => {
      const plugin = dashPlugin();
      expect(plugin.name).toBe('dash');
    });

    it('should accept options', () => {
      const options: DashPluginOptions = {
        enableAdaptiveBitrate: false,
        initialVideoQuality: 2,
      };
      const plugin = dashPlugin(options);
      expect(plugin.options).toEqual(options);
    });

    it('should have lifecycle hooks', () => {
      const plugin = dashPlugin();
      expect(typeof plugin.install).toBe('function');
      expect(typeof plugin.mount).toBe('function');
      expect(typeof plugin.destroy).toBe('function');
    });
  });

  describe('Plugin registration', () => {
    it('should register with player', () => {
      const player = createPlayer({ src: 'https://example.com/video.mp4' });
      player.use(dashPlugin());

      expect(player.getPlugins()).toHaveLength(1);
      expect(player.getPlugins()[0].name).toBe('dash');
    });

    it('should support method chaining', () => {
      const player = createPlayer({ src: 'https://example.com/video.mp4' });
      const result = player.use(dashPlugin());
      expect(result).toBe(player);
    });

    it('should chain with mount()', () => {
      const player = createPlayer({ src: 'https://example.com/video.mp4' });
      const result = player.use(dashPlugin()).mount(container);

      expect(result).toBe(player);
      expect(player.getPlugins()).toHaveLength(1);
    });
  });

  describe('DASH source handling', () => {
    it('should activate for DASH sources when using bind()', async () => {
      const element = document.createElement('another-player') as HTMLElement & { src: string };
      element.setAttribute('src', 'https://example.com/stream.mpd');
      container.appendChild(element);

      const player = createPlayer({ src: 'https://example.com/stream.mpd' });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      player.use(dashPlugin()).bind(element as any);

      // Wait for async plugin hooks
      await new Promise((resolve) => { setTimeout(resolve, 50); });

      // The dash.js mock should have been used via bind()
      const dashjs = await import('dashjs');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((dashjs as any).mockDashPlayer.initialize).toHaveBeenCalled();
    });

    it('should not activate for non-DASH sources', async () => {
      const player = createPlayer({ src: 'https://example.com/video.mp4' });
      player.use(dashPlugin()).mount(container);

      // Wait for async plugin hooks
      await new Promise((resolve) => { setTimeout(resolve, 20); });

      // The mock should not be called for mp4 sources
      const dashjs = await import('dashjs');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((dashjs as any).mockDashPlayer.initialize).not.toHaveBeenCalled();
    });

    it('should activate for DASH sources', async () => {
      const player = createPlayer({ src: 'https://example.com/stream.mpd' });
      player.use(dashPlugin()).mount(container);

      // Wait for async plugin hooks
      await new Promise((resolve) => { setTimeout(resolve, 50); });

      // The dash.js mock should have been used
      const dashjs = await import('dashjs');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((dashjs as any).mockDashPlayer.initialize).toHaveBeenCalled();
    });

    it('should initialize with correct parameters', async () => {
      const player = createPlayer({ src: 'https://example.com/stream.mpd' });
      player.use(dashPlugin()).mount(container);

      // Wait for async plugin hooks
      await new Promise((resolve) => { setTimeout(resolve, 50); });

      const dashjs = await import('dashjs');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((dashjs as any).mockDashPlayer.initialize).toHaveBeenCalledWith(
        expect.any(HTMLVideoElement),
        'https://example.com/stream.mpd',
        false,
      );
    });

    it('should clear video element src before initializing dash.js', async () => {
      const player = createPlayer({ src: 'https://example.com/stream.mpd' });
      player.use(dashPlugin()).mount(container);

      // Wait for async plugin hooks
      await new Promise((resolve) => { setTimeout(resolve, 50); });

      // The video element should have its src attribute removed
      // dash.js will handle the source loading instead
      const videoElement = player.element?.videoElement;
      expect(videoElement?.getAttribute('src')).toBeNull();
    });
  });

  describe('Plugin with options', () => {
    it('should respect enableAdaptiveBitrate option', async () => {
      const player = createPlayer({ src: 'https://example.com/stream.mpd' });
      player.use(dashPlugin({ enableAdaptiveBitrate: false })).mount(container);

      // Wait for async plugin hooks
      await new Promise((resolve) => { setTimeout(resolve, 50); });

      const dashjs = await import('dashjs');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((dashjs as any).mockDashPlayer.updateSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          streaming: expect.objectContaining({
            abr: expect.objectContaining({
              autoSwitchBitrate: expect.objectContaining({
                video: false,
              }),
            }),
          }),
        }),
      );
    });

    it('should respect initialVideoQuality option', async () => {
      const player = createPlayer({ src: 'https://example.com/stream.mpd' });
      player.use(dashPlugin({ initialVideoQuality: 2 })).mount(container);

      // Wait for async plugin hooks
      await new Promise((resolve) => { setTimeout(resolve, 50); });

      const dashjs = await import('dashjs');
      // When initial quality is set, auto switch should be disabled
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((dashjs as any).mockDashPlayer.updateSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          streaming: expect.objectContaining({
            abr: expect.objectContaining({
              autoSwitchBitrate: expect.objectContaining({
                video: false,
              }),
            }),
          }),
        }),
      );
    });

    it('should use default options when none provided', () => {
      const plugin = dashPlugin();
      expect(plugin.options).toEqual({});
    });
  });

  describe('Plugin destroy', () => {
    it('should clean up on player destroy', async () => {
      const player = createPlayer({ src: 'https://example.com/stream.mpd' });
      player.use(dashPlugin()).mount(container);

      // Wait for async plugin hooks
      await new Promise((resolve) => { setTimeout(resolve, 50); });

      // Destroy player
      player.destroy();

      // Wait for async destroy hooks
      await new Promise((resolve) => { setTimeout(resolve, 20); });

      // Player should be destroyed
      expect(player.element).toBeUndefined();

      // Reset should have been called
      const dashjs = await import('dashjs');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((dashjs as any).mockDashPlayer.reset).toHaveBeenCalled();
    });
  });

  describe('Event listeners', () => {
    it('should register event listeners on install', async () => {
      const player = createPlayer({ src: 'https://example.com/stream.mpd' });
      player.use(dashPlugin()).mount(container);

      // Wait for async plugin hooks
      await new Promise((resolve) => { setTimeout(resolve, 50); });

      const dashjs = await import('dashjs');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((dashjs as any).mockDashPlayer.on).toHaveBeenCalledWith(
        'manifestLoaded',
        expect.any(Function),
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((dashjs as any).mockDashPlayer.on).toHaveBeenCalledWith(
        'qualityChangeRendered',
        expect.any(Function),
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((dashjs as any).mockDashPlayer.on).toHaveBeenCalledWith(
        'error',
        expect.any(Function),
      );
    });
  });

  describe('Plugin with both HLS and DASH', () => {
    it('should work with both plugins registered', async () => {
      // Import hlsPlugin dynamically to avoid circular dependencies in tests
      const { hlsPlugin } = await import('./hls');

      const player = createPlayer({ src: 'https://example.com/stream.mpd' });
      player
        .use(hlsPlugin())
        .use(dashPlugin())
        .mount(container);

      // Wait for async plugin hooks
      await new Promise((resolve) => { setTimeout(resolve, 50); });

      expect(player.getPlugins()).toHaveLength(2);
      expect(player.getPlugins()[0].name).toBe('hls');
      expect(player.getPlugins()[1].name).toBe('dash');
    });
  });

  describe('DRM support', () => {
    it('should accept protectionData option', () => {
      const protectionData = {
        'com.widevine.alpha': { serverURL: 'https://license.example.com/widevine' },
        'com.microsoft.playready': { serverURL: 'https://license.example.com/playready' },
      };
      const plugin = dashPlugin({ protectionData });
      expect(plugin.options?.protectionData).toEqual(protectionData);
    });

    it('should call setProtectionData when protectionData is provided', async () => {
      const protectionData = {
        'com.widevine.alpha': { serverURL: 'https://license.example.com/widevine' },
      };
      const player = createPlayer({ src: 'https://example.com/stream.mpd' });
      player.use(dashPlugin({ protectionData })).mount(container);

      // Wait for async plugin hooks
      await new Promise((resolve) => { setTimeout(resolve, 50); });

      const dashjs = await import('dashjs');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((dashjs as any).mockDashPlayer.setProtectionData).toHaveBeenCalledWith(protectionData);

      player.destroy();
    });

    it('should not call setProtectionData when no protectionData is provided', async () => {
      const player = createPlayer({ src: 'https://example.com/stream.mpd' });
      player.use(dashPlugin()).mount(container);

      // Wait for async plugin hooks
      await new Promise((resolve) => { setTimeout(resolve, 50); });

      const dashjs = await import('dashjs');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((dashjs as any).mockDashPlayer.setProtectionData).not.toHaveBeenCalled();

      player.destroy();
    });

    it('should support protectionData with request headers', async () => {
      const protectionData = {
        'com.widevine.alpha': {
          serverURL: 'https://license.example.com/widevine',
          httpRequestHeaders: { Authorization: 'Bearer token' },
          withCredentials: false,
        },
      };
      const player = createPlayer({ src: 'https://example.com/stream.mpd' });
      player.use(dashPlugin({ protectionData })).mount(container);

      // Wait for async plugin hooks
      await new Promise((resolve) => { setTimeout(resolve, 50); });

      const dashjs = await import('dashjs');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((dashjs as any).mockDashPlayer.setProtectionData).toHaveBeenCalledWith(protectionData);

      player.destroy();
    });
  });
});
