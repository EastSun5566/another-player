import { PlayerControlElement } from './base';

const CONTROLS_ELEMENT_NAME = 'another-player-controls';

/**
 * Container for player controls.
 * Provides a slot-based structure for organizing control elements.
 */
export class PlayerControlsElement extends PlayerControlElement {
  constructor() {
    super();

    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px;
        box-sizing: border-box;
      }

      ::slotted(*) {
        flex-shrink: 0;
      }
    `;

    const slot = document.createElement('slot');

    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.append(style, slot);
  }

  // eslint-disable-next-line class-methods-use-this
  protected setup(): void {
    // Controls container doesn't need video-specific setup
  }

  // eslint-disable-next-line class-methods-use-this
  protected cleanup(): void {
    // No cleanup needed
  }
}

// Register the custom element if not already registered
if (!customElements.get(CONTROLS_ELEMENT_NAME)) {
  customElements.define(CONTROLS_ELEMENT_NAME, PlayerControlsElement);
}

export { CONTROLS_ELEMENT_NAME };
