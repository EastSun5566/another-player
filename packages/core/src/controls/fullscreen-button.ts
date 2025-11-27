import { PlayerControlElement } from './base';

const FULLSCREEN_BUTTON_ELEMENT_NAME = 'another-player-fullscreen-button';

/**
 * Fullscreen toggle button control.
 * Toggles fullscreen mode for the player.
 */
export class FullscreenButtonElement extends PlayerControlElement {
  private button: HTMLButtonElement;

  private handleClick = (): void => {
    if (!this.playerElement) return;

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {
        // Ignore fullscreen exit errors
      });
    } else {
      this.playerElement.requestFullscreen().catch(() => {
        // Ignore fullscreen request errors
      });
    }
  };

  private handleFullscreenChange = (): void => {
    this.updateState();
  };

  constructor() {
    super();

    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: inline-block;
      }

      button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border: none;
        background: transparent;
        cursor: pointer;
        padding: 0;
        color: inherit;
      }

      button:focus-visible {
        outline: 2px solid currentColor;
        outline-offset: 2px;
      }

      .icon {
        width: 24px;
        height: 24px;
        fill: currentColor;
      }
    `;

    this.button = document.createElement('button');
    this.button.type = 'button';
    this.button.setAttribute('aria-label', 'Enter fullscreen');
    this.button.innerHTML = this.getEnterFullscreenIcon();

    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.append(style, this.button);
  }

  // eslint-disable-next-line class-methods-use-this
  private getEnterFullscreenIcon(): string {
    return `<svg class="icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
    </svg>`;
  }

  // eslint-disable-next-line class-methods-use-this
  private getExitFullscreenIcon(): string {
    return `<svg class="icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
    </svg>`;
  }

  private updateState(): void {
    if (document.fullscreenElement) {
      this.button.innerHTML = this.getExitFullscreenIcon();
      this.button.setAttribute('aria-label', 'Exit fullscreen');
    } else {
      this.button.innerHTML = this.getEnterFullscreenIcon();
      this.button.setAttribute('aria-label', 'Enter fullscreen');
    }
  }

  protected setup(): void {
    this.button.addEventListener('click', this.handleClick);
    document.addEventListener('fullscreenchange', this.handleFullscreenChange);
    this.updateState();
  }

  protected cleanup(): void {
    this.button.removeEventListener('click', this.handleClick);
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
  }
}

// Register the custom element if not already registered
if (!customElements.get(FULLSCREEN_BUTTON_ELEMENT_NAME)) {
  customElements.define(FULLSCREEN_BUTTON_ELEMENT_NAME, FullscreenButtonElement);
}

export { FULLSCREEN_BUTTON_ELEMENT_NAME };
