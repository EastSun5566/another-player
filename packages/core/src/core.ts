import { DEFAULT_ELEMENT_NAME } from './constants';
import type { Plugin, PluginContext } from './plugin';
import type { PlayerEventMap, PlayerOptions } from './types';

type PlayerEventListener<K extends keyof PlayerEventMap> = (event: PlayerEventMap[K]) => void;

export class PlayerElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['src'];
  }

  readonly videoElement: HTMLVideoElement;

  get src(): string {
    return this.getAttribute('src') ?? '';
  }

  set src(source: string) {
    if (source) {
      this.setAttribute('src', source);
    } else {
      this.removeAttribute('src');
    }
  }

  constructor() {
    super();

    const videoElement = document.createElement('video');
    videoElement.style.setProperty('width', '100%');
    videoElement.crossOrigin = 'anonymous';
    this.videoElement = videoElement;

    const controlsSlot = document.createElement('slot');
    controlsSlot.name = 'controls';

    const defaultSlot = document.createElement('slot');

    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: inline-block;
        position: relative;
      }

      .container {
        position: relative;
        display: inline-block;
        width: 100%;
      }

      .controls-container {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 1;
        background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.3) 70%, transparent 100%);
      }
    `;

    const container = document.createElement('div');
    container.className = 'container';

    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'controls-container';
    controlsContainer.appendChild(controlsSlot);

    container.append(videoElement, controlsContainer, defaultSlot);
    this.attachShadow({ mode: 'open' }).append(style, container);
  }

  attributeChangedCallback(
    attributeName: string,
    _oldValue: string | null,
    newValue: string | null,
  ): void {
    if (attributeName !== 'src') return;

    if (newValue === null) {
      this.videoElement.removeAttribute('src');
      return;
    }

    this.videoElement.src = newValue;
  }
}

class Player {
  element?: PlayerElement;

  ready: Promise<void> = Promise.resolve();

  private currentSrc: string;

  private plugins: Plugin[] = [];

  private eventListeners = new Map<
    keyof PlayerEventMap,
    Set<PlayerEventListener<keyof PlayerEventMap>>
  >();

  private videoEventCleanup: Array<() => void> = [];

  private lifecycleQueue: Promise<void> = Promise.resolve();

  private activeContext?: PluginContext;

  private attached = false;

  private destroyed = false;

  private destroyPromise?: Promise<void>;

  constructor({ element, src = '' }: PlayerOptions = {}) {
    this.currentSrc = src;

    if (!customElements.get(DEFAULT_ELEMENT_NAME)) {
      customElements.define(DEFAULT_ELEMENT_NAME, PlayerElement);
    }

    if (element) this.bind(element);
  }

  get src(): string {
    return this.currentSrc;
  }

  use(plugins: Plugin | Plugin[]): this {
    if (this.attached) {
      throw new Error('Plugins must be registered before the player is mounted');
    }
    if (this.destroyed) {
      throw new Error('Player has been destroyed');
    }

    const pluginArray = Array.isArray(plugins) ? plugins : [plugins];
    pluginArray.forEach((plugin) => {
      if (this.plugins.some((registeredPlugin) => registeredPlugin.name === plugin.name)) {
        console.warn(`Plugin "${plugin.name}" is already registered.`);
        return;
      }
      this.plugins.push(plugin);
    });

    return this;
  }

  getPlugins(): Plugin[] {
    return [...this.plugins];
  }

  bind(element: PlayerElement): this {
    this.assertCanAttach();
    this.element = element;
    this.attached = true;
    this.currentSrc = element.src || this.currentSrc;
    this.setElementSource(this.currentSrc);
    this.setupVideoEventListeners();
    this.ready = this.enqueueLifecycle(() => this.initializePlugins());
    return this;
  }

  mount(root: Element | string): this {
    this.assertCanAttach();

    const rootElement = typeof root === 'string' ? document.querySelector(root) : root;
    if (!rootElement) {
      throw new Error(`Cannot find element: ${root}`);
    }

    this.element = document.createElement(DEFAULT_ELEMENT_NAME) as PlayerElement;
    this.attached = true;
    this.setElementSource(this.currentSrc);
    rootElement.appendChild(this.element);
    this.setupVideoEventListeners();
    this.ready = this.enqueueLifecycle(() => this.initializePlugins());
    return this;
  }

  load(src: string): Promise<void> {
    if (!this.attached || !this.element) {
      return Promise.reject(new Error('Player not mounted'));
    }
    if (this.destroyed) {
      return Promise.reject(new Error('Player has been destroyed'));
    }

    return this.enqueueLifecycle(async () => {
      await this.cleanupPluginCycle();
      this.currentSrc = src;
      this.setElementSource(src);
      await this.initializePlugins();
    });
  }

  play(): Promise<void> {
    if (!this.element) {
      return Promise.reject(new Error('Player not mounted'));
    }
    return this.element.videoElement.play();
  }

  pause(): void {
    this.element?.videoElement.pause();
  }

  seek(time: number): void {
    if (this.element) this.element.videoElement.currentTime = time;
  }

  get currentTime(): number {
    return this.element?.videoElement.currentTime ?? 0;
  }

  set currentTime(time: number) {
    if (this.element) this.element.videoElement.currentTime = time;
  }

  get duration(): number {
    return this.element?.videoElement.duration ?? 0;
  }

  get volume(): number {
    return this.element?.videoElement.volume ?? 1;
  }

  set volume(value: number) {
    if (this.element) {
      this.element.videoElement.volume = Math.max(0, Math.min(1, value));
    }
  }

  get muted(): boolean {
    return this.element?.videoElement.muted ?? false;
  }

  set muted(value: boolean) {
    if (this.element) this.element.videoElement.muted = value;
  }

  get paused(): boolean {
    return this.element?.videoElement.paused ?? true;
  }

  get ended(): boolean {
    return this.element?.videoElement.ended ?? false;
  }

  on<K extends keyof PlayerEventMap>(event: K, listener: PlayerEventListener<K>): this {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)?.add(
      listener as PlayerEventListener<keyof PlayerEventMap>,
    );
    return this;
  }

  off<K extends keyof PlayerEventMap>(event: K, listener: PlayerEventListener<K>): this {
    this.eventListeners.get(event)?.delete(
      listener as PlayerEventListener<keyof PlayerEventMap>,
    );
    return this;
  }

  destroy(): Promise<void> {
    if (this.destroyPromise) return this.destroyPromise;

    this.destroyed = true;
    this.destroyPromise = this.enqueueLifecycle(async () => {
      let cleanupError: unknown;
      try {
        await this.cleanupPluginCycle();
      } catch (error) {
        cleanupError = error;
      }

      this.cleanupVideoEventListeners();
      this.eventListeners.clear();
      this.element?.remove();
      this.element = undefined;
      this.attached = false;
      this.plugins = [];

      if (cleanupError) throw cleanupError;
    });
    return this.destroyPromise;
  }

  private assertCanAttach(): void {
    if (this.destroyed) throw new Error('Player has been destroyed');
    if (this.attached) throw new Error('Player is already mounted');
  }

  private setElementSource(src: string): void {
    if (this.element) this.element.src = src;
  }

  private enqueueLifecycle(operation: () => Promise<void>): Promise<void> {
    const result = this.lifecycleQueue.then(operation);
    this.lifecycleQueue = result.catch(() => undefined);
    this.ready = result;
    return result;
  }

  private createPluginContext(): PluginContext {
    const element = this.element;
    if (!element) throw new Error('Player not mounted');

    return {
      videoElement: element.videoElement,
      getSrc: () => this.currentSrc,
      setSrc: (src: string) => {
        this.currentSrc = src;
        this.setElementSource(src);
      },
      on: (event, listener) => {
        this.on(event, listener);
      },
      off: (event, listener) => {
        this.off(event, listener);
      },
      emit: (event, data) => {
        this.emit(event, data);
      },
    };
  }

  private async initializePlugins(): Promise<void> {
    const context = this.createPluginContext();
    this.activeContext = context;

    try {
      for (const plugin of this.plugins) {
        await plugin.install?.(context);
      }

      let transformedSrc = this.currentSrc;
      for (const plugin of this.plugins) {
        if (plugin.transformSource) {
          transformedSrc = await plugin.transformSource(transformedSrc, context);
        }
      }

      if (transformedSrc !== this.currentSrc) {
        this.currentSrc = transformedSrc;
        this.setElementSource(transformedSrc);
      }

      for (const plugin of this.plugins) {
        await plugin.mount?.(context);
      }
    } catch (error) {
      try {
        await this.cleanupPluginCycle();
      } catch (cleanupError) {
        throw new AggregateError(
          [error, cleanupError],
          'Plugin initialization and cleanup failed',
        );
      }
      throw error;
    }
  }

  private async cleanupPluginCycle(): Promise<void> {
    const context = this.activeContext;
    if (!context) return;

    this.activeContext = undefined;
    const errors: unknown[] = [];
    for (const plugin of [...this.plugins].reverse()) {
      try {
        await plugin.destroy?.(context);
      } catch (error) {
        errors.push(error);
      }
    }

    if (errors.length > 0) {
      throw new AggregateError(errors, 'Plugin cleanup failed');
    }
  }

  private emit<K extends keyof PlayerEventMap>(event: K, data: PlayerEventMap[K]): void {
    this.eventListeners.get(event)?.forEach((listener) => listener(data));
  }

  private setupVideoEventListeners(): void {
    const videoElement = this.element?.videoElement;
    if (!videoElement) return;

    this.cleanupVideoEventListeners();
    const eventMappings: Array<{
      nativeEvent: string;
      playerEvent: keyof PlayerEventMap;
      getData: () => PlayerEventMap[keyof PlayerEventMap];
    }> = [
      { nativeEvent: 'play', playerEvent: 'play', getData: () => ({ currentTime: videoElement.currentTime }) },
      { nativeEvent: 'pause', playerEvent: 'pause', getData: () => ({ currentTime: videoElement.currentTime }) },
      {
        nativeEvent: 'timeupdate',
        playerEvent: 'timeupdate',
        getData: () => ({ currentTime: videoElement.currentTime, duration: videoElement.duration }),
      },
      {
        nativeEvent: 'volumechange',
        playerEvent: 'volumechange',
        getData: () => ({ volume: videoElement.volume, muted: videoElement.muted }),
      },
      { nativeEvent: 'ended', playerEvent: 'ended', getData: () => ({ currentTime: videoElement.currentTime }) },
      {
        nativeEvent: 'loadedmetadata',
        playerEvent: 'loadedmetadata',
        getData: () => ({
          duration: videoElement.duration,
          videoWidth: videoElement.videoWidth,
          videoHeight: videoElement.videoHeight,
        }),
      },
      { nativeEvent: 'seeking', playerEvent: 'seeking', getData: () => ({ currentTime: videoElement.currentTime }) },
      { nativeEvent: 'seeked', playerEvent: 'seeked', getData: () => ({ currentTime: videoElement.currentTime }) },
      { nativeEvent: 'waiting', playerEvent: 'waiting', getData: () => ({ currentTime: videoElement.currentTime }) },
      { nativeEvent: 'playing', playerEvent: 'playing', getData: () => ({ currentTime: videoElement.currentTime }) },
      { nativeEvent: 'error', playerEvent: 'error', getData: () => ({ error: videoElement.error }) },
    ];

    eventMappings.forEach(({ nativeEvent, playerEvent, getData }) => {
      const handler = () => this.emit(playerEvent, getData());
      videoElement.addEventListener(nativeEvent, handler);
      this.videoEventCleanup.push(() => videoElement.removeEventListener(nativeEvent, handler));
    });
  }

  private cleanupVideoEventListeners(): void {
    this.videoEventCleanup.forEach((cleanup) => cleanup());
    this.videoEventCleanup = [];
  }
}

export function createPlayer(options?: PlayerOptions): Player {
  return new Player(options);
}
