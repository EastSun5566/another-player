import { PlayerControlElement } from './base';

const PLAY_BUTTON_ELEMENT_NAME = 'another-player-play-button';

/**
 * Play/Pause button control.
 * Automatically toggles between play and pause states.
 */
export class PlayButtonElement extends PlayerControlElement {
  private button: HTMLButtonElement;

  private handleClick = (): void => {
    const { videoElement } = this;
    if (!videoElement) return;

    if (videoElement.paused) {
      videoElement.play().catch(() => {
        // Ignore autoplay errors
      });
    } else {
      videoElement.pause();
    }
  };

  private handlePlayPause = (): void => {
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
    this.button.setAttribute('aria-label', 'Play');
    this.button.innerHTML = this.getPlayIcon();

    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.append(style, this.button);
  }

  // eslint-disable-next-line class-methods-use-this
  private getPlayIcon(): string {
    return `<svg class="icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 5v14l11-7z"/>
    </svg>`;
  }

  // eslint-disable-next-line class-methods-use-this
  private getPauseIcon(): string {
    return `<svg class="icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
    </svg>`;
  }

  private updateState(): void {
    const { videoElement } = this;
    if (!videoElement) return;

    if (videoElement.paused) {
      this.button.innerHTML = this.getPlayIcon();
      this.button.setAttribute('aria-label', 'Play');
    } else {
      this.button.innerHTML = this.getPauseIcon();
      this.button.setAttribute('aria-label', 'Pause');
    }
  }

  protected setup(): void {
    const { videoElement } = this;
    if (!videoElement) return;

    this.button.addEventListener('click', this.handleClick);
    videoElement.addEventListener('play', this.handlePlayPause);
    videoElement.addEventListener('pause', this.handlePlayPause);
    this.updateState();
  }

  protected cleanup(): void {
    const { videoElement } = this;
    this.button.removeEventListener('click', this.handleClick);
    videoElement?.removeEventListener('play', this.handlePlayPause);
    videoElement?.removeEventListener('pause', this.handlePlayPause);
  }
}

// Register the custom element if not already registered
if (!customElements.get(PLAY_BUTTON_ELEMENT_NAME)) {
  customElements.define(PLAY_BUTTON_ELEMENT_NAME, PlayButtonElement);
}

export { PLAY_BUTTON_ELEMENT_NAME };
