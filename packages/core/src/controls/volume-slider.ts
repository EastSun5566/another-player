import { PlayerControlElement } from './base';

const VOLUME_SLIDER_ELEMENT_NAME = 'another-player-volume-slider';

/**
 * Volume slider control.
 * Allows users to adjust the volume level.
 */
export class VolumeSliderElement extends PlayerControlElement {
  private slider: HTMLInputElement;

  private handleInput = (e: Event): void => {
    const { videoElement } = this;
    if (!videoElement) return;

    const target = e.target as HTMLInputElement;
    const value = parseFloat(target.value);
    videoElement.volume = value;

    // Unmute if adjusting volume while muted
    if (value > 0 && videoElement.muted) {
      videoElement.muted = false;
    }
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
        width: 80px;
      }

      input[type="range"] {
        width: 100%;
        height: 4px;
        -webkit-appearance: none;
        appearance: none;
        background: linear-gradient(to right, currentColor var(--volume-percent, 100%), rgba(128, 128, 128, 0.3) var(--volume-percent, 100%));
        border-radius: 2px;
        outline: none;
        cursor: pointer;
      }

      input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: currentColor;
        cursor: pointer;
      }

      input[type="range"]::-moz-range-thumb {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: currentColor;
        border: none;
        cursor: pointer;
      }

      input[type="range"]:focus-visible {
        outline: 2px solid currentColor;
        outline-offset: 2px;
      }
    `;

    this.slider = document.createElement('input');
    this.slider.type = 'range';
    this.slider.min = '0';
    this.slider.max = '1';
    this.slider.step = '0.05';
    this.slider.value = '1';
    this.slider.setAttribute('aria-label', 'Volume');

    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.append(style, this.slider);
  }

  private updateState(): void {
    const { videoElement } = this;
    if (!videoElement) return;

    const volume = videoElement.muted ? 0 : videoElement.volume;
    this.slider.value = String(volume);
    this.slider.style.setProperty('--volume-percent', `${volume * 100}%`);
  }

  protected setup(): void {
    const { videoElement } = this;
    if (!videoElement) return;

    this.slider.addEventListener('input', this.handleInput);
    videoElement.addEventListener('volumechange', this.handleVolumeChange);
    this.updateState();
  }

  protected cleanup(): void {
    const { videoElement } = this;
    this.slider.removeEventListener('input', this.handleInput);
    videoElement?.removeEventListener('volumechange', this.handleVolumeChange);
  }
}

// Register the custom element if not already registered
if (!customElements.get(VOLUME_SLIDER_ELEMENT_NAME)) {
  customElements.define(VOLUME_SLIDER_ELEMENT_NAME, VolumeSliderElement);
}

export { VOLUME_SLIDER_ELEMENT_NAME };
