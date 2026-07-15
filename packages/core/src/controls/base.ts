import type { PlayerElement } from '../core';
import { DEFAULT_ELEMENT_NAME } from '../constants';

/**
 * Base class for player control components.
 * Provides connection to parent PlayerElement and common utilities.
 */
export abstract class PlayerControlElement extends HTMLElement {
  protected playerElement: PlayerElement | null = null;

  /** Get the video element from the parent player */
  protected get videoElement(): HTMLVideoElement | undefined {
    return this.playerElement?.videoElement;
  }

  connectedCallback(): void {
    this.findPlayerElement();
    this.setup();
  }

  disconnectedCallback(): void {
    this.cleanup();
    this.playerElement = null;
  }

  /** Find and connect to parent PlayerElement */
  private findPlayerElement(): void {
    this.playerElement = this.closest(DEFAULT_ELEMENT_NAME) as PlayerElement | null;
  }

  /** Override in subclasses to set up event listeners etc. */
  protected abstract setup(): void;

  /** Override in subclasses to clean up event listeners etc. */
  protected abstract cleanup(): void;
}
