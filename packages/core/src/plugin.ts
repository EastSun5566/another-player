import type { PlayerEventMap } from './types';

/** Plugin context passed to lifecycle hooks */
export interface PluginContext {
  /** The video element being controlled */
  videoElement: HTMLVideoElement;
  /** Get the current source URL */
  getSrc: () => string;
  /** Set the source URL */
  setSrc: (src: string) => void;
  /** Subscribe to player events */
  on: <K extends keyof PlayerEventMap>(
    event: K,
    listener: (data: PlayerEventMap[K]) => void
  ) => void;
  /** Unsubscribe from player events */
  off: <K extends keyof PlayerEventMap>(
    event: K,
    listener: (data: PlayerEventMap[K]) => void
  ) => void;
  /** Emit a typed player event */
  emit: <K extends keyof PlayerEventMap>(event: K, data: PlayerEventMap[K]) => void;
}

/** Plugin lifecycle hooks */
export interface PluginHooks {
  /**
   * Called when the plugin is installed.
   * Use this to set up initial state or register event listeners.
   */
  install?: (context: PluginContext) => void | Promise<void>;
  /**
   * Called before the source is loaded.
   * Can return a modified source URL or object.
   */
  transformSource?: (src: string, context: PluginContext) => string | Promise<string>;
  /**
   * Called when the player is mounted to the DOM.
   */
  mount?: (context: PluginContext) => void | Promise<void>;
  /**
   * Called when the player is destroyed.
   * Use this to clean up resources.
   */
  destroy?: (context: PluginContext) => void | Promise<void>;
}

/** Plugin definition object */
export interface Plugin<TOptions = unknown, TApi = unknown> extends PluginHooks {
  /** Unique plugin name */
  name: string;
  /** Plugin options (resolved from factory) */
  options?: TOptions;
  /** Optional public API exposed by the plugin instance */
  api?: TApi;
}

/** Plugin instance with a guaranteed public API */
export interface PluginWithApi<TOptions = unknown, TApi = unknown>
  extends Plugin<TOptions, TApi> {
  api: TApi;
}

/** Plugin factory function type */
export type PluginFactory<TOptions = void, TApi = unknown> = (
  options?: TOptions
) => Plugin<TOptions, TApi>;

/**
 * Define a plugin with options.
 * This is the recommended way to create plugins.
 *
 * @example
 * ```ts
 * const myPlugin = definePlugin<{ debug?: boolean }>((options = {}) => ({
 *   name: 'my-plugin',
 *   options,
 *   install(context) {
 *     if (options.debug) {
 *       console.log('Plugin installed');
 *     }
 *   },
 * }));
 *
 * // Usage
 * player.use(myPlugin({ debug: true }));
 * ```
 */
export function definePlugin<TOptions = void, TApi = unknown>(
  factory: PluginFactory<TOptions, TApi>,
): PluginFactory<TOptions, TApi> {
  return factory;
}
