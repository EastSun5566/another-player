import {
  describe, it, expect, beforeEach, afterEach, vi,
} from 'vitest';
import { createPlayer, PlayerElement } from './core';
import { DEFAULT_ELEMENT_NAME } from './constants';

describe('createPlayer', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'player-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should create a player instance', () => {
    const player = createPlayer();
    expect(player).toBeDefined();
    expect(player.src).toBe('');
  });

  it('should create a player with custom options', () => {
    const player = createPlayer({
      src: 'https://example.com/video.mp4',
    });
    expect(player.src).toBe('https://example.com/video.mp4');
  });

  describe('mount', () => {
    it('should mount player to an element', () => {
      const player = createPlayer({ src: 'https://example.com/video.mp4' });
      const result = player.mount(container);

      expect(result).toBe(player); // should return this for chaining
      expect(player.element).toBeInstanceOf(PlayerElement);
      expect(container.querySelector(DEFAULT_ELEMENT_NAME)).toBeTruthy();
    });

    it('should mount player using a CSS selector', () => {
      const player = createPlayer({ src: 'https://example.com/video.mp4' });
      player.mount('#player-container');

      expect(player.element).toBeInstanceOf(PlayerElement);
      expect(container.querySelector(DEFAULT_ELEMENT_NAME)).toBeTruthy();
    });

    it('should throw error when selector does not match any element', () => {
      const player = createPlayer();
      expect(() => player.mount('#non-existent')).toThrow('Cannot find element: #non-existent');
    });

    it('should set the src attribute on the mounted element', () => {
      const player = createPlayer({ src: 'https://example.com/video.mp4' });
      player.mount(container);

      expect(player.element?.src).toBe('https://example.com/video.mp4');
    });

    it('should reject a second attachment', () => {
      const player = createPlayer().mount(container);

      expect(() => player.mount(container)).toThrow('Player is already mounted');
      expect(() => player.bind(player.element!)).toThrow('Player is already mounted');
    });
  });

  describe('bind', () => {
    it('should bind to an existing player element', () => {
      const element = document.createElement(DEFAULT_ELEMENT_NAME) as PlayerElement;
      element.src = 'https://example.com/video.mp4';
      container.appendChild(element);

      const player = createPlayer();
      const result = player.bind(element);

      expect(result).toBe(player); // should return this for chaining
      expect(player.element).toBe(element);
      expect(player.src).toBe('https://example.com/video.mp4');
    });
  });

  describe('playback controls', () => {
    it('should reject play() when not mounted', async () => {
      const player = createPlayer();
      await expect(player.play()).rejects.toThrow('Player not mounted');
    });

    it('should not throw when calling pause() without mount', () => {
      const player = createPlayer();
      expect(() => player.pause()).not.toThrow();
    });

    it('should not throw when calling seek() without mount', () => {
      const player = createPlayer();
      expect(() => player.seek(10)).not.toThrow();
    });

    it('should return default values for properties when not mounted', () => {
      const player = createPlayer();
      expect(player.currentTime).toBe(0);
      expect(player.duration).toBe(0);
      expect(player.volume).toBe(1);
      expect(player.muted).toBe(false);
      expect(player.paused).toBe(true);
      expect(player.ended).toBe(false);
    });

    it('should clamp volume between 0 and 1', () => {
      const player = createPlayer({ src: 'https://example.com/video.mp4' });
      player.mount(container);

      player.volume = 2;
      expect(player.volume).toBe(1);

      player.volume = -1;
      expect(player.volume).toBe(0);

      player.volume = 0.5;
      expect(player.volume).toBe(0.5);
    });

    it('should set muted state', () => {
      const player = createPlayer({ src: 'https://example.com/video.mp4' });
      player.mount(container);

      expect(player.muted).toBe(false);
      player.muted = true;
      expect(player.muted).toBe(true);
    });
  });

  describe('event system', () => {
    it('should register event listeners with on()', () => {
      const player = createPlayer();
      const listener = vi.fn();

      const result = player.on('play', listener);
      expect(result).toBe(player); // should return this for chaining
    });

    it('should remove event listeners with off()', () => {
      const player = createPlayer();
      const listener = vi.fn();

      player.on('play', listener);
      const result = player.off('play', listener);
      expect(result).toBe(player); // should return this for chaining
    });

    it('should support method chaining for event registration', () => {
      const player = createPlayer();
      const playListener = vi.fn();
      const pauseListener = vi.fn();

      const result = player
        .on('play', playListener)
        .on('pause', pauseListener);

      expect(result).toBe(player);
    });
  });

  describe('destroy', () => {
    it('should remove the player element from DOM', async () => {
      const player = createPlayer({ src: 'https://example.com/video.mp4' });
      player.mount(container);

      expect(container.querySelector(DEFAULT_ELEMENT_NAME)).toBeTruthy();

      await player.destroy();

      expect(container.querySelector(DEFAULT_ELEMENT_NAME)).toBeFalsy();
      expect(player.element).toBeUndefined();
    });

    it('should be idempotent when destroying an unmounted player', async () => {
      const player = createPlayer();
      const firstDestroy = player.destroy();
      const secondDestroy = player.destroy();

      expect(secondDestroy).toBe(firstDestroy);
      await expect(firstDestroy).resolves.toBeUndefined();
    });
  });

  describe('load', () => {
    it('should update the source through the lifecycle queue', async () => {
      const player = createPlayer({ src: 'first.mp4' }).mount(container);
      await player.ready;

      await player.load('second.mp4');

      expect(player.src).toBe('second.mp4');
      expect(player.element?.src).toBe('second.mp4');
    });

    it('should serialize rapid source changes', async () => {
      const order: string[] = [];
      const player = createPlayer({ src: 'first.mp4' })
        .use({
          name: 'lifecycle-order',
          install: ({ getSrc }) => { order.push(`install:${getSrc()}`); },
          destroy: ({ getSrc }) => { order.push(`destroy:${getSrc()}`); },
        })
        .mount(container);
      await player.ready;

      const firstLoad = player.load('second.m3u8');
      const secondLoad = player.load('third.mpd');
      await Promise.all([firstLoad, secondLoad]);

      expect(order).toEqual([
        'install:first.mp4',
        'destroy:first.mp4',
        'install:second.m3u8',
        'destroy:second.m3u8',
        'install:third.mpd',
      ]);
      expect(player.src).toBe('third.mpd');
    });
  });
});

describe('PlayerElement', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should be a custom element', () => {
    // Ensure the element is registered
    createPlayer();
    expect(customElements.get(DEFAULT_ELEMENT_NAME)).toBe(PlayerElement);
  });

  it('should create a video element in shadow DOM', () => {
    createPlayer();
    const element = document.createElement(DEFAULT_ELEMENT_NAME) as PlayerElement;
    document.body.appendChild(element);

    expect(element.shadowRoot).toBeTruthy();
    expect(element.videoElement).toBeInstanceOf(HTMLVideoElement);
  });

  it('should sync src attribute to video element', () => {
    createPlayer();
    const element = document.createElement(DEFAULT_ELEMENT_NAME) as PlayerElement;
    document.body.appendChild(element);

    element.src = 'https://example.com/video.mp4';
    expect(element.videoElement.src).toBe('https://example.com/video.mp4');
  });

  it('should clear the video source when the src attribute is removed', () => {
    createPlayer();
    const element = document.createElement(DEFAULT_ELEMENT_NAME) as PlayerElement;
    element.src = 'https://example.com/video.mp4';

    element.src = '';

    expect(element.hasAttribute('src')).toBe(false);
    expect(element.videoElement.hasAttribute('src')).toBe(false);
  });

  it('should set crossOrigin attribute to anonymous for CORS support', () => {
    createPlayer();
    const element = document.createElement(DEFAULT_ELEMENT_NAME) as PlayerElement;
    document.body.appendChild(element);

    expect(element.videoElement.crossOrigin).toBe('anonymous');
  });
});
