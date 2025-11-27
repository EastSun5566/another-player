import { PlayerControlElement } from './base';

const MUTE_BUTTON_ELEMENT_NAME = 'another-player-mute-button';

/**
 * Mute/Unmute button control.
 * Toggles the muted state of the video.
 */
export class MuteButtonElement extends PlayerControlElement {
  private button: HTMLButtonElement;

  private handleClick = (): void => {
    const { videoElement } = this;
    if (!videoElement) return;

    videoElement.muted = !videoElement.muted;
  };

  private handleVolumeChange = (): void => {
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
    this.button.setAttribute('aria-label', 'Mute');
    this.button.innerHTML = this.getVolumeIcon();

    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.append(style, this.button);
  }

  // eslint-disable-next-line class-methods-use-this
  private getVolumeIcon(): string {
    return `<svg class="icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
    </svg>`;
  }

  // eslint-disable-next-line class-methods-use-this
  private getMutedIcon(): string {
    return `<svg class="icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
    </svg>`;
  }

  private updateState(): void {
    const { videoElement } = this;
    if (!videoElement) return;

    if (videoElement.muted || videoElement.volume === 0) {
      this.button.innerHTML = this.getMutedIcon();
      this.button.setAttribute('aria-label', 'Unmute');
    } else {
      this.button.innerHTML = this.getVolumeIcon();
      this.button.setAttribute('aria-label', 'Mute');
    }
  }

  protected setup(): void {
    const { videoElement } = this;
    if (!videoElement) return;

    this.button.addEventListener('click', this.handleClick);
    videoElement.addEventListener('volumechange', this.handleVolumeChange);
    this.updateState();
  }

  protected cleanup(): void {
    const { videoElement } = this;
    this.button.removeEventListener('click', this.handleClick);
    videoElement?.removeEventListener('volumechange', this.handleVolumeChange);
  }
}

// Register the custom element if not already registered
if (!customElements.get(MUTE_BUTTON_ELEMENT_NAME)) {
  customElements.define(MUTE_BUTTON_ELEMENT_NAME, MuteButtonElement);
}

export { MUTE_BUTTON_ELEMENT_NAME };
