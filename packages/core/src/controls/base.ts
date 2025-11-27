import type { PlayerElement } from '../core';

/**
 * Base class for player control components.
 * Provides connection to parent PlayerElement and common utilities.
 */
// eslint-disable-next-line import/prefer-default-export
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
    // Walk up the DOM tree to find the player element
    let parent = this.parentElement;
    while (parent) {
      if (parent.tagName.toLowerCase() === 'another-player') {
        this.playerElement = parent as PlayerElement;
        break;
      }
      // Check in shadow DOM if we're slotted
      if (parent.parentNode && (parent.parentNode as ShadowRoot).host) {
        const { host } = (parent.parentNode as ShadowRoot);
        if (host.tagName.toLowerCase() === 'another-player') {
          this.playerElement = host as PlayerElement;
          break;
        }
        parent = host as HTMLElement;
      } else {
        parent = parent.parentElement;
      }
    }

    // Also check assignedSlot's host
    if (!this.playerElement && this.assignedSlot) {
      const slotHost = this.assignedSlot.getRootNode() as ShadowRoot;
      if (slotHost.host?.tagName.toLowerCase() === 'another-player') {
        this.playerElement = slotHost.host as PlayerElement;
      }
    }
  }

  /** Override in subclasses to set up event listeners etc. */
  protected abstract setup(): void;

  /** Override in subclasses to clean up event listeners etc. */
  protected abstract cleanup(): void;
}
