/* eslint-disable @typescript-eslint/no-explicit-any */
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
export interface Plugin<TOptions = any> extends PluginHooks {
  /** Unique plugin name */
  name: string;
  /** Plugin options (resolved from factory) */
  options?: TOptions;
}

/** Plugin factory function type */
export type PluginFactory<TOptions = any> = (options?: TOptions) => Plugin<TOptions>;

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
export function definePlugin<TOptions = void>(
  factory: PluginFactory<TOptions>,
): PluginFactory<TOptions> {
  return factory;
}
