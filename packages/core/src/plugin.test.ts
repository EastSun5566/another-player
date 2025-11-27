import {
  describe, it, expect, beforeEach, afterEach, vi,
} from 'vitest';
import { createPlayer } from './core';
import { definePlugin, type Plugin, type PluginContext } from './plugin';

describe('Plugin System', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'player-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('definePlugin', () => {
    it('should create a plugin factory function', () => {
      const myPlugin = definePlugin(() => ({
        name: 'test-plugin',
      }));

      expect(typeof myPlugin).toBe('function');
    });

    it('should create a plugin with the provided name', () => {
      const myPlugin = definePlugin(() => ({
        name: 'test-plugin',
      }));

      const plugin = myPlugin();
      expect(plugin.name).toBe('test-plugin');
    });

    it('should accept and pass options to the factory', () => {
      interface MyPluginOptions {
        debug?: boolean;
        logLevel?: string;
      }

      const myPlugin = definePlugin<MyPluginOptions>((options = {}) => ({
        name: 'configurable-plugin',
        options,
      }));

      const plugin = myPlugin({ debug: true, logLevel: 'verbose' });
      expect(plugin.options).toEqual({ debug: true, logLevel: 'verbose' });
    });

    it('should use default options when none provided', () => {
      interface MyPluginOptions {
        timeout?: number;
      }

      const myPlugin = definePlugin<MyPluginOptions>((options = { timeout: 1000 }) => ({
        name: 'default-options-plugin',
        options,
      }));

      const plugin = myPlugin();
      expect(plugin.options).toEqual({ timeout: 1000 });
    });
  });

  describe('Player.use()', () => {
    it('should register a single plugin', () => {
      const plugin: Plugin = { name: 'single-plugin' };
      const player = createPlayer();

      const result = player.use(plugin);

      expect(result).toBe(player); // should return this for chaining
      expect(player.getPlugins()).toHaveLength(1);
      expect(player.getPlugins()[0].name).toBe('single-plugin');
    });

    it('should register multiple plugins at once', () => {
      const plugins: Plugin[] = [
        { name: 'plugin-1' },
        { name: 'plugin-2' },
        { name: 'plugin-3' },
      ];
      const player = createPlayer();

      player.use(plugins);

      expect(player.getPlugins()).toHaveLength(3);
    });

    it('should prevent duplicate plugin registration', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const plugin: Plugin = { name: 'duplicate-plugin' };
      const player = createPlayer();

      player.use(plugin);
      player.use(plugin);

      expect(player.getPlugins()).toHaveLength(1);
      expect(consoleWarnSpy).toHaveBeenCalledWith('Plugin "duplicate-plugin" is already registered.');

      consoleWarnSpy.mockRestore();
    });

    it('should support method chaining', () => {
      const player = createPlayer();

      const result = player
        .use({ name: 'plugin-1' })
        .use({ name: 'plugin-2' });

      expect(result).toBe(player);
      expect(player.getPlugins()).toHaveLength(2);
    });

    it('should chain with mount()', () => {
      const player = createPlayer({ src: 'https://example.com/video.mp4' });

      const result = player
        .use({ name: 'plugin-1' })
        .mount(container);

      expect(result).toBe(player);
      expect(player.getPlugins()).toHaveLength(1);
      expect(player.element).toBeDefined();
    });
  });

  describe('Plugin Lifecycle Hooks', () => {
    it('should call install hook when player is mounted', async () => {
      const installFn = vi.fn();
      const plugin = definePlugin(() => ({
        name: 'install-test',
        install: installFn,
      }));

      const player = createPlayer({ src: 'https://example.com/video.mp4' });
      player.use(plugin()).mount(container);

      // Wait for async plugin hooks to complete
      await new Promise((resolve) => { setTimeout(resolve, 10); });

      expect(installFn).toHaveBeenCalledTimes(1);
      expect(installFn).toHaveBeenCalledWith(expect.objectContaining({
        videoElement: expect.any(HTMLVideoElement),
        getSrc: expect.any(Function),
        setSrc: expect.any(Function),
        on: expect.any(Function),
        off: expect.any(Function),
      }));
    });

    it('should call mount hook after install', async () => {
      const callOrder: string[] = [];

      const plugin = definePlugin(() => ({
        name: 'mount-test',
        install: () => { callOrder.push('install'); },
        mount: () => { callOrder.push('mount'); },
      }));

      const player = createPlayer({ src: 'https://example.com/video.mp4' });
      player.use(plugin()).mount(container);

      await new Promise((resolve) => { setTimeout(resolve, 10); });

      expect(callOrder).toEqual(['install', 'mount']);
    });

    it('should call destroy hook when player is destroyed', async () => {
      const destroyFn = vi.fn();
      const plugin = definePlugin(() => ({
        name: 'destroy-test',
        destroy: destroyFn,
      }));

      const player = createPlayer({ src: 'https://example.com/video.mp4' });
      player.use(plugin()).mount(container);

      await new Promise((resolve) => { setTimeout(resolve, 10); });

      player.destroy();

      await new Promise((resolve) => { setTimeout(resolve, 10); });

      expect(destroyFn).toHaveBeenCalledTimes(1);
    });

    it('should call destroy hooks in reverse order', async () => {
      const callOrder: string[] = [];

      const plugin1 = definePlugin(() => ({
        name: 'plugin-1',
        destroy: () => { callOrder.push('plugin-1'); },
      }));

      const plugin2 = definePlugin(() => ({
        name: 'plugin-2',
        destroy: () => { callOrder.push('plugin-2'); },
      }));

      const plugin3 = definePlugin(() => ({
        name: 'plugin-3',
        destroy: () => { callOrder.push('plugin-3'); },
      }));

      const player = createPlayer({ src: 'https://example.com/video.mp4' });
      player
        .use([plugin1(), plugin2(), plugin3()])
        .mount(container);

      await new Promise((resolve) => { setTimeout(resolve, 10); });

      player.destroy();

      await new Promise((resolve) => { setTimeout(resolve, 10); });

      // Destroy should be called in reverse order
      expect(callOrder).toEqual(['plugin-3', 'plugin-2', 'plugin-1']);
    });

    it('should call transformSource hook', async () => {
      const transformFn = vi.fn((src: string) => `transformed-${src}`);

      const plugin = definePlugin(() => ({
        name: 'transform-test',
        transformSource: transformFn,
      }));

      const player = createPlayer({ src: 'original-src' });
      player.use(plugin()).mount(container);

      await new Promise((resolve) => { setTimeout(resolve, 10); });

      expect(transformFn).toHaveBeenCalledWith('original-src', expect.any(Object));
      expect(player.src).toBe('transformed-original-src');
    });

    it('should chain multiple transformSource hooks', async () => {
      const plugin1 = definePlugin(() => ({
        name: 'transform-1',
        transformSource: (src: string) => `${src}-step1`,
      }));

      const plugin2 = definePlugin(() => ({
        name: 'transform-2',
        transformSource: (src: string) => `${src}-step2`,
      }));

      const player = createPlayer({ src: 'base' });
      player.use([plugin1(), plugin2()]).mount(container);

      await new Promise((resolve) => { setTimeout(resolve, 10); });

      expect(player.src).toBe('base-step1-step2');
    });

    it('should support async hooks', async () => {
      const asyncInstall = vi.fn(async () => {
        await new Promise((resolve) => { setTimeout(resolve, 5); });
      });

      const plugin = definePlugin(() => ({
        name: 'async-test',
        install: asyncInstall,
      }));

      const player = createPlayer({ src: 'https://example.com/video.mp4' });
      player.use(plugin()).mount(container);

      await new Promise((resolve) => { setTimeout(resolve, 20); });

      expect(asyncInstall).toHaveBeenCalledTimes(1);
    });
  });

  describe('PluginContext', () => {
    it('should provide access to videoElement', async () => {
      let contextVideoElement: HTMLVideoElement | undefined;

      const plugin = definePlugin(() => ({
        name: 'context-video-test',
        install: (context: PluginContext) => {
          contextVideoElement = context.videoElement;
        },
      }));

      const player = createPlayer({ src: 'https://example.com/video.mp4' });
      player.use(plugin()).mount(container);

      await new Promise((resolve) => { setTimeout(resolve, 10); });

      expect(contextVideoElement).toBeInstanceOf(HTMLVideoElement);
    });

    it('should provide getSrc and setSrc functions', async () => {
      let capturedContext: PluginContext | undefined;

      const plugin = definePlugin(() => ({
        name: 'context-src-test',
        install: (context: PluginContext) => {
          capturedContext = context;
        },
      }));

      const player = createPlayer({ src: 'original-src' });
      player.use(plugin()).mount(container);

      await new Promise((resolve) => { setTimeout(resolve, 10); });

      expect(capturedContext?.getSrc()).toBe('original-src');

      capturedContext?.setSrc('new-src');
      expect(player.src).toBe('new-src');
    });

    it('should allow registering event listeners via context', async () => {
      const playListener = vi.fn();

      const plugin = definePlugin(() => ({
        name: 'context-events-test',
        install: (context: PluginContext) => {
          context.on('play', playListener);
        },
      }));

      const player = createPlayer({ src: 'https://example.com/video.mp4' });
      player.use(plugin()).mount(container);

      await new Promise((resolve) => { setTimeout(resolve, 10); });

      // Trigger a play event internally
      player.element?.videoElement.dispatchEvent(new Event('play'));

      expect(playListener).toHaveBeenCalledTimes(1);
    });

    it('should allow unregistering event listeners via context', async () => {
      const pauseListener = vi.fn();
      let capturedContext: PluginContext | undefined;

      const plugin = definePlugin(() => ({
        name: 'context-off-test',
        install: (context: PluginContext) => {
          capturedContext = context;
          context.on('pause', pauseListener);
        },
      }));

      const player = createPlayer({ src: 'https://example.com/video.mp4' });
      player.use(plugin()).mount(container);

      await new Promise((resolve) => { setTimeout(resolve, 10); });

      // Unregister the listener
      capturedContext?.off('pause', pauseListener);

      // Trigger a pause event
      player.element?.videoElement.dispatchEvent(new Event('pause'));

      expect(pauseListener).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should catch and log errors in install hook', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const plugin = definePlugin(() => ({
        name: 'error-test',
        install: () => {
          throw new Error('Install failed');
        },
      }));

      const player = createPlayer({ src: 'https://example.com/video.mp4' });
      player.use(plugin()).mount(container);

      await new Promise((resolve) => { setTimeout(resolve, 10); });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error in plugin lifecycle:',
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });

    it('should not break player when plugin throws', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const plugin = definePlugin(() => ({
        name: 'throwing-plugin',
        install: () => {
          throw new Error('Plugin error');
        },
      }));

      const player = createPlayer({ src: 'https://example.com/video.mp4' });
      player.use(plugin()).mount(container);

      await new Promise((resolve) => { setTimeout(resolve, 10); });

      // Player should still work
      expect(player.element).toBeDefined();
      expect(() => player.pause()).not.toThrow();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getPlugins()', () => {
    it('should return empty array when no plugins registered', () => {
      const player = createPlayer();
      expect(player.getPlugins()).toEqual([]);
    });

    it('should return a copy of the plugins array', () => {
      const plugin: Plugin = { name: 'test-plugin' };
      const player = createPlayer();
      player.use(plugin);

      const plugins = player.getPlugins();
      plugins.push({ name: 'injected-plugin' });

      expect(player.getPlugins()).toHaveLength(1);
    });
  });
});
