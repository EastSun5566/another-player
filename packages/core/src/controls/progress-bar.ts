import { PlayerControlElement } from './base';

const PROGRESS_BAR_ELEMENT_NAME = 'another-player-progress-bar';

/**
 * Progress bar / timeline control.
 * Shows playback progress and allows seeking.
 */
export class ProgressBarElement extends PlayerControlElement {
  private slider: HTMLInputElement;

  private isSeeking = false;

  private handleInput = (e: Event): void => {
    const { videoElement } = this;
    if (!videoElement) return;

    this.isSeeking = true;
    const target = e.target as HTMLInputElement;
    const value = parseFloat(target.value);
    const { duration } = videoElement;

    // Only seek if duration is a valid finite number
    if (Number.isFinite(duration) && duration > 0) {
      videoElement.currentTime = value * duration;
    }
  };

  private handleChange = (): void => {
    this.isSeeking = false;
  };

  private handleTimeUpdate = (): void => {
    if (this.isSeeking) return;
    this.updateState();
  };

  private handleLoadedMetadata = (): void => {
    this.updateState();
  };

  constructor() {
    super();

    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block;
        flex: 1;
        min-width: 100px;
      }

      input[type="range"] {
        width: 100%;
        height: 4px;
        -webkit-appearance: none;
        appearance: none;
        background: linear-gradient(to right, currentColor var(--progress-percent, 0%), rgba(128, 128, 128, 0.3) var(--progress-percent, 0%));
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
    this.slider.step = '0.001';
    this.slider.value = '0';
    this.slider.setAttribute('aria-label', 'Seek');

    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.append(style, this.slider);
  }

  private updateState(): void {
    const { videoElement } = this;
    if (!videoElement) return;

    const { duration } = videoElement;
    const currentTime = videoElement.currentTime || 0;
    // Only calculate progress if duration is a valid finite number
    const progress = Number.isFinite(duration) && duration > 0
      ? currentTime / duration
      : 0;

    this.slider.value = String(progress);
    this.slider.style.setProperty('--progress-percent', `${progress * 100}%`);
  }

  protected setup(): void {
    const { videoElement } = this;
    if (!videoElement) return;

    this.slider.addEventListener('input', this.handleInput);
    this.slider.addEventListener('change', this.handleChange);
    videoElement.addEventListener('timeupdate', this.handleTimeUpdate);
    videoElement.addEventListener('loadedmetadata', this.handleLoadedMetadata);
    this.updateState();
  }

  protected cleanup(): void {
    const { videoElement } = this;
    this.slider.removeEventListener('input', this.handleInput);
    this.slider.removeEventListener('change', this.handleChange);
    videoElement?.removeEventListener('timeupdate', this.handleTimeUpdate);
    videoElement?.removeEventListener('loadedmetadata', this.handleLoadedMetadata);
  }
}

// Register the custom element if not already registered
if (!customElements.get(PROGRESS_BAR_ELEMENT_NAME)) {
  customElements.define(PROGRESS_BAR_ELEMENT_NAME, ProgressBarElement);
}

export { PROGRESS_BAR_ELEMENT_NAME };
