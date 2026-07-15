import { PlayerControlElement } from './base';

const CAPTIONS_BUTTON_ELEMENT_NAME = 'another-player-captions-button';

export class CaptionsButtonElement extends PlayerControlElement {
  private button: HTMLButtonElement;

  private lastSelected?: TextTrack;

  private handleClick = (): void => {
    const tracks = this.getCaptionTracks();
    if (tracks.length === 0) return;

    const showingTrack = tracks.find((track) => track.mode === 'showing');
    if (showingTrack) {
      this.lastSelected = showingTrack;
      tracks.forEach((track) => { track.mode = 'disabled'; });
    } else {
      const selectedTrack = (
        (this.lastSelected && tracks.includes(this.lastSelected) ? this.lastSelected : undefined)
        ?? this.getDefaultTrack(tracks)
        ?? tracks[0]
      );
      tracks.forEach((track) => {
        track.mode = track === selectedTrack ? 'showing' : 'disabled';
      });
      this.lastSelected = selectedTrack;
    }

    this.updateState();
  };

  private handleTracksChange = (): void => {
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

      button:disabled {
        cursor: default;
        opacity: 0.45;
      }

      button:focus-visible {
        outline: 2px solid currentColor;
        outline-offset: 2px;
      }

      .icon {
        font-family: ui-sans-serif, sans-serif;
        font-size: 14px;
        font-weight: 700;
        letter-spacing: -0.03em;
      }
    `;

    this.button = document.createElement('button');
    this.button.type = 'button';
    this.button.setAttribute('part', 'button');
    this.button.disabled = true;
    this.button.setAttribute('aria-label', 'Show captions');
    this.button.setAttribute('aria-pressed', 'false');

    const icon = document.createElement('span');
    icon.className = 'icon';
    icon.setAttribute('part', 'icon');
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = 'CC';
    this.button.appendChild(icon);

    this.attachShadow({ mode: 'open' }).append(style, this.button);
  }

  private getCaptionTracks(): TextTrack[] {
    const { videoElement } = this;
    if (!videoElement) return [];

    return Array.from(
      { length: videoElement.textTracks.length },
      (_, index) => videoElement.textTracks[index],
    ).filter((track) => track.kind === 'captions' || track.kind === 'subtitles');
  }

  private getDefaultTrack(tracks: TextTrack[]): TextTrack | undefined {
    const { videoElement } = this;
    if (!videoElement) return undefined;

    const defaultElement = Array.from(videoElement.querySelectorAll('track')).find(
      (trackElement) => (
        trackElement.default
        && tracks.includes(trackElement.track)
        && (trackElement.kind === 'captions' || trackElement.kind === 'subtitles')
      ),
    );
    return defaultElement?.track;
  }

  private updateState(): void {
    const tracks = this.getCaptionTracks();
    const showingTrack = tracks.find((track) => track.mode === 'showing');
    if (showingTrack) this.lastSelected = showingTrack;

    this.button.disabled = tracks.length === 0;
    this.button.setAttribute('aria-label', showingTrack ? 'Hide captions' : 'Show captions');
    this.button.setAttribute('aria-pressed', String(Boolean(showingTrack)));
  }

  protected setup(): void {
    const { videoElement } = this;
    if (!videoElement) return;

    this.button.addEventListener('click', this.handleClick);
    videoElement.addEventListener('loadedmetadata', this.handleTracksChange);
    videoElement.textTracks.addEventListener('addtrack', this.handleTracksChange);
    videoElement.textTracks.addEventListener('removetrack', this.handleTracksChange);
    videoElement.textTracks.addEventListener('change', this.handleTracksChange);
    this.updateState();
  }

  protected cleanup(): void {
    const { videoElement } = this;
    this.button.removeEventListener('click', this.handleClick);
    videoElement?.removeEventListener('loadedmetadata', this.handleTracksChange);
    videoElement?.textTracks.removeEventListener('addtrack', this.handleTracksChange);
    videoElement?.textTracks.removeEventListener('removetrack', this.handleTracksChange);
    videoElement?.textTracks.removeEventListener('change', this.handleTracksChange);
  }
}

if (!customElements.get(CAPTIONS_BUTTON_ELEMENT_NAME)) {
  customElements.define(CAPTIONS_BUTTON_ELEMENT_NAME, CaptionsButtonElement);
}

export { CAPTIONS_BUTTON_ELEMENT_NAME };
