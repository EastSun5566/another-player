/* eslint-disable class-methods-use-this */
// eslint-disable-next-line max-classes-per-file
import { DEFAULT_ELEMENT_NAME } from './constants';
import type { Plugin, PluginContext } from './plugin';
import type { PlayerEventMap, PlayerOptions } from './types';

type PlayerElementAttributeName = keyof HTMLVideoElement;

// should focus to behavior like `HTMLVideoElement`
export class PlayerElement extends HTMLElement {
  static get observedAttributes(): PlayerElementAttributeName[] {
    return ['src'];
  }

  videoElement: HTMLVideoElement;

  /** The address or URL of the a media resource that is to be considered. */
  get src() {
    return this.getAttribute('src') || '';
  }

  set src(source: string) {
    this.setAttribute('src', source);
  }

  constructor() {
    super();

    const videoElement = document.createElement('video');
    videoElement.style.setProperty('width', '100%');

    this.videoElement = videoElement;

    // const controlsSlot = document.createElement('slot');
    // controlsSlot.name = 'controls';
    // const button = document.createElement('button');
    // button.textContent = 'Play';
    // controlsSlot.append(button);

    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: inline-block;
      }
    `;

    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.append(
      style,
      videoElement,
      // controlsSlot,
    );
  }

  // TODO
  connectedCallback() {}

  disconnectedCallback() {}

  attributeChangedCallback(
    attributeName: PlayerElementAttributeName,
    _oldValue: string,
    newValue: string,
  ) {
    // TODO
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.videoElement[attributeName] = newValue;
  }
}

type PlayerEventListener<K extends keyof PlayerEventMap> = (event: PlayerEventMap[K]) => void;

// should focus to be Player app
class Player {
  elementName = DEFAULT_ELEMENT_NAME;

  element?: PlayerElement;

  src = '';

  private plugins: Plugin[] = [];

  private eventListeners: Map<string, Set<PlayerEventListener<keyof PlayerEventMap>>> = new Map();

  private videoEventCleanup: (() => void)[] = [];

  constructor({
    elementName = DEFAULT_ELEMENT_NAME,
    element,
    src = '',
  }: PlayerOptions = {}) {
    this.elementName = elementName;
    this.src = src;

    // check if player element has been defined before
    if (!customElements.get(elementName)) {
      customElements.define(elementName, PlayerElement);
    }

    if (element) this.bind(element);
  }

  /**
   * Register one or more plugins with the player.
   * Plugins are installed in the order they are registered.
   *
   * @example
   * ```ts
   * player.use([myPlugin(), anotherPlugin({ option: true })]);
   * ```
   */
  use(plugins: Plugin | Plugin[]): this {
    const pluginArray = Array.isArray(plugins) ? plugins : [plugins];

    pluginArray.forEach((plugin) => {
      // Prevent duplicate plugin registration
      if (this.plugins.some((p) => p.name === plugin.name)) {
        // eslint-disable-next-line no-console
        console.warn(`Plugin "${plugin.name}" is already registered.`);
        return;
      }
      this.plugins.push(plugin);
    });

    return this;
  }

  /** Get registered plugins */
  getPlugins(): Plugin[] {
    return [...this.plugins];
  }

  /** Create plugin context for lifecycle hooks */
  private createPluginContext(): PluginContext {
    if (!this.element) {
      throw new Error('Player not mounted');
    }

    return {
      videoElement: this.element.videoElement,
      getSrc: () => this.src,
      setSrc: (src: string) => {
        this.src = src;
        if (this.element) {
          this.element.src = src;
        }
      },
      on: (event, listener) => {
        this.on(event, listener);
      },
      off: (event, listener) => {
        this.off(event, listener);
      },
    };
  }

  /** Call install hook on all registered plugins */
  private async installPlugins(): Promise<void> {
    const context = this.createPluginContext();
    // eslint-disable-next-line no-restricted-syntax
    for (const plugin of this.plugins) {
      if (plugin.install) {
        // eslint-disable-next-line no-await-in-loop
        await plugin.install(context);
      }
    }
  }

  /** Call mount hook on all registered plugins */
  private async mountPlugins(): Promise<void> {
    const context = this.createPluginContext();
    // eslint-disable-next-line no-restricted-syntax
    for (const plugin of this.plugins) {
      if (plugin.mount) {
        // eslint-disable-next-line no-await-in-loop
        await plugin.mount(context);
      }
    }
  }

  /** Call destroy hook on all registered plugins */
  private async destroyPlugins(): Promise<void> {
    if (!this.element) return;
    const context = this.createPluginContext();
    // Process in reverse order for cleanup
    // eslint-disable-next-line no-restricted-syntax
    for (const plugin of [...this.plugins].reverse()) {
      if (plugin.destroy) {
        // eslint-disable-next-line no-await-in-loop
        await plugin.destroy(context);
      }
    }
  }

  /** Transform source through all registered plugins */
  private async transformSource(src: string): Promise<string> {
    if (!this.element) return src;
    const context = this.createPluginContext();
    let transformedSrc = src;
    // eslint-disable-next-line no-restricted-syntax
    for (const plugin of this.plugins) {
      if (plugin.transformSource) {
        // eslint-disable-next-line no-await-in-loop
        transformedSrc = await plugin.transformSource(transformedSrc, context);
      }
    }
    return transformedSrc;
  }

  /** bind existing player element to player */
  bind(element: PlayerElement): this {
    this.element = element;
    this.src = element.src;
    this.setupVideoEventListeners();
    return this;
  }

  /** mount player element to a root element or selector */
  mount(root: Element | string): this {
    const rootElement = typeof root === 'string' ? document.querySelector(root) : root;
    if (!rootElement) {
      throw new Error(`Cannot find element: ${root}`);
    }

    this.element = document.createElement(this.elementName) as PlayerElement;

    // Apply source transform (sync part - actual transform happens async)
    // Note: transformSource and plugin hooks are called async but mount returns sync
    // This allows chaining while still supporting async plugins
    this.applySourceAndPlugins();

    rootElement.appendChild(this.element);
    this.setupVideoEventListeners();
    return this;
  }

  /** Apply source transformation and call plugin hooks */
  private applySourceAndPlugins(): void {
    if (!this.element) return;

    // Immediately set the source
    this.element.src = this.src;

    // Call install and mount hooks asynchronously
    // Fire-and-forget pattern with catch for error handling
    (async () => {
      // Check if player was destroyed before async operations complete
      if (!this.element) return;
      await this.installPlugins();
      // Check again after install
      if (!this.element) return;
      // Transform source through plugins
      const transformedSrc = await this.transformSource(this.src);
      if (this.element && transformedSrc !== this.src) {
        this.src = transformedSrc;
        this.element.src = transformedSrc;
      }
      // Check again before mount
      if (!this.element) return;
      await this.mountPlugins();
    })().catch((error) => {
      // eslint-disable-next-line no-console
      console.error('Error in plugin lifecycle:', error);
    });
  }

  /** Start playback */
  play(): Promise<void> {
    if (!this.element) {
      return Promise.reject(new Error('Player not mounted'));
    }
    return this.element.videoElement.play();
  }

  /** Pause playback */
  pause(): void {
    if (!this.element) return;
    this.element.videoElement.pause();
  }

  /** Seek to a specific time in seconds */
  seek(time: number): void {
    if (!this.element) return;
    this.element.videoElement.currentTime = time;
  }

  /** Get or set the current playback time in seconds */
  get currentTime(): number {
    return this.element?.videoElement.currentTime ?? 0;
  }

  set currentTime(time: number) {
    if (this.element) {
      this.element.videoElement.currentTime = time;
    }
  }

  /** Get the duration of the media in seconds */
  get duration(): number {
    return this.element?.videoElement.duration ?? 0;
  }

  /** Get or set the volume (0.0 to 1.0) */
  get volume(): number {
    return this.element?.videoElement.volume ?? 1;
  }

  set volume(value: number) {
    if (this.element) {
      this.element.videoElement.volume = Math.max(0, Math.min(1, value));
    }
  }

  /** Get or set the muted state */
  get muted(): boolean {
    return this.element?.videoElement.muted ?? false;
  }

  set muted(value: boolean) {
    if (this.element) {
      this.element.videoElement.muted = value;
    }
  }

  /** Check if the player is currently paused */
  get paused(): boolean {
    return this.element?.videoElement.paused ?? true;
  }

  /** Check if the player has ended */
  get ended(): boolean {
    return this.element?.videoElement.ended ?? false;
  }

  /** Add an event listener for player events */
  on<K extends keyof PlayerEventMap>(
    event: K,
    listener: PlayerEventListener<K>,
  ): this {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener as PlayerEventListener<keyof PlayerEventMap>);
    return this;
  }

  /** Remove an event listener for player events */
  off<K extends keyof PlayerEventMap>(
    event: K,
    listener: PlayerEventListener<K>,
  ): this {
    this.eventListeners.get(event)?.delete(listener as PlayerEventListener<keyof PlayerEventMap>);
    return this;
  }

  /** Emit an event to all registered listeners */
  private emit<K extends keyof PlayerEventMap>(event: K, data: PlayerEventMap[K]): void {
    this.eventListeners.get(event)?.forEach((listener) => {
      listener(data);
    });
  }

  /** Set up listeners for native video events and emit player events */
  private setupVideoEventListeners(): void {
    if (!this.element) return;

    const { videoElement } = this.element;

    // Clean up any existing listeners
    this.cleanupVideoEventListeners();

    const eventMappings: Array<{
      nativeEvent: string;
      playerEvent: keyof PlayerEventMap;
      getData: () => PlayerEventMap[keyof PlayerEventMap];
    }> = [
      {
        nativeEvent: 'play',
        playerEvent: 'play',
        getData: () => ({ currentTime: videoElement.currentTime }),
      },
      {
        nativeEvent: 'pause',
        playerEvent: 'pause',
        getData: () => ({ currentTime: videoElement.currentTime }),
      },
      {
        nativeEvent: 'timeupdate',
        playerEvent: 'timeupdate',
        getData: () => ({
          currentTime: videoElement.currentTime,
          duration: videoElement.duration,
        }),
      },
      {
        nativeEvent: 'volumechange',
        playerEvent: 'volumechange',
        getData: () => ({
          volume: videoElement.volume,
          muted: videoElement.muted,
        }),
      },
      {
        nativeEvent: 'ended',
        playerEvent: 'ended',
        getData: () => ({ currentTime: videoElement.currentTime }),
      },
      {
        nativeEvent: 'loadedmetadata',
        playerEvent: 'loadedmetadata',
        getData: () => ({
          duration: videoElement.duration,
          videoWidth: videoElement.videoWidth,
          videoHeight: videoElement.videoHeight,
        }),
      },
      {
        nativeEvent: 'seeking',
        playerEvent: 'seeking',
        getData: () => ({ currentTime: videoElement.currentTime }),
      },
      {
        nativeEvent: 'seeked',
        playerEvent: 'seeked',
        getData: () => ({ currentTime: videoElement.currentTime }),
      },
      {
        nativeEvent: 'waiting',
        playerEvent: 'waiting',
        getData: () => ({ currentTime: videoElement.currentTime }),
      },
      {
        nativeEvent: 'playing',
        playerEvent: 'playing',
        getData: () => ({ currentTime: videoElement.currentTime }),
      },
      {
        nativeEvent: 'error',
        playerEvent: 'error',
        getData: () => ({ error: videoElement.error }),
      },
    ];

    eventMappings.forEach(({ nativeEvent, playerEvent, getData }) => {
      const handler = () => {
        this.emit(playerEvent, getData());
      };
      videoElement.addEventListener(nativeEvent, handler);
      this.videoEventCleanup.push(() => {
        videoElement.removeEventListener(nativeEvent, handler);
      });
    });
  }

  /** Clean up video event listeners */
  private cleanupVideoEventListeners(): void {
    this.videoEventCleanup.forEach((cleanup) => cleanup());
    this.videoEventCleanup = [];
  }

  /** Destroy the player and clean up resources */
  destroy(): void {
    // Store plugins copy and context before cleanup
    const pluginsToDestroy = [...this.plugins];
    const elementRef = this.element;

    // Clear plugins first to prevent any new operations
    this.plugins = [];

    // Call destroy hooks on plugins asynchronously
    if (elementRef) {
      // Create context before clearing element reference
      const context = this.createPluginContext();
      // Process destroy hooks in reverse order
      (async () => {
        // eslint-disable-next-line no-restricted-syntax
        for (const plugin of [...pluginsToDestroy].reverse()) {
          if (plugin.destroy) {
            // eslint-disable-next-line no-await-in-loop
            await plugin.destroy(context);
          }
        }
      })().catch((error) => {
        // eslint-disable-next-line no-console
        console.error('Error in plugin destroy:', error);
      });
    }

    this.cleanupVideoEventListeners();
    this.eventListeners.clear();
    if (this.element?.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = undefined;
  }
}

export function createPlayer(options?: PlayerOptions) {
  return new Player(options);
}
