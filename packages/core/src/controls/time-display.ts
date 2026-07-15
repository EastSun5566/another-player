import { PlayerControlElement } from './base';
import { formatTime } from './format-time';

const TIME_DISPLAY_ELEMENT_NAME = 'another-player-time-display';

/**
 * Time display control.
 * Shows current time and total duration.
 */
export class TimeDisplayElement extends PlayerControlElement {
  private timeSpan: HTMLSpanElement;

  private handleTimeUpdate = (): void => {
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
        display: inline-block;
        font-family: monospace;
        font-size: 14px;
        white-space: nowrap;
      }

      span {
        color: inherit;
      }
    `;

    this.timeSpan = document.createElement('span');
    this.timeSpan.setAttribute('part', 'time');
    this.timeSpan.textContent = '0:00 / 0:00';

    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.append(style, this.timeSpan);
  }

  private updateState(): void {
    const { videoElement } = this;
    if (!videoElement) return;

    const currentTime = formatTime(videoElement.currentTime);
    const duration = formatTime(videoElement.duration);
    this.timeSpan.textContent = `${currentTime} / ${duration}`;
  }

  protected setup(): void {
    const { videoElement } = this;
    if (!videoElement) return;

    videoElement.addEventListener('timeupdate', this.handleTimeUpdate);
    videoElement.addEventListener('loadedmetadata', this.handleLoadedMetadata);
    this.updateState();
  }

  protected cleanup(): void {
    const { videoElement } = this;
    videoElement?.removeEventListener('timeupdate', this.handleTimeUpdate);
    videoElement?.removeEventListener('loadedmetadata', this.handleLoadedMetadata);
  }
}

// Register the custom element if not already registered
if (!customElements.get(TIME_DISPLAY_ELEMENT_NAME)) {
  customElements.define(TIME_DISPLAY_ELEMENT_NAME, TimeDisplayElement);
}

export { TIME_DISPLAY_ELEMENT_NAME };
