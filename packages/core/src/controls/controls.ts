const CONTROLS_ELEMENT_NAME = 'another-player-controls';

/**
 * Container for player controls.
 * Provides a slot-based structure for organizing control elements.
 */
export class PlayerControlsElement extends HTMLElement {
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
        color: white;
      }

      ::slotted(*) {
        flex-shrink: 0;
      }
    `;

    const slot = document.createElement('slot');
    slot.setAttribute('part', 'controls');

    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.append(style, slot);
  }
}

// Register the custom element if not already registered
if (!customElements.get(CONTROLS_ELEMENT_NAME)) {
  customElements.define(CONTROLS_ELEMENT_NAME, PlayerControlsElement);
}

export { CONTROLS_ELEMENT_NAME };
