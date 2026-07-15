import {
  describe, it, expect, beforeEach, afterEach, vi,
} from 'vitest';
import { createPlayer } from '../core';
import {
  PlayerControlsElement,
  PlayButtonElement,
  MuteButtonElement,
  VolumeSliderElement,
  ProgressBarElement,
  TimeDisplayElement,
  FullscreenButtonElement,
  CaptionsButtonElement,
  CONTROLS_ELEMENT_NAME,
  PLAY_BUTTON_ELEMENT_NAME,
  MUTE_BUTTON_ELEMENT_NAME,
  VOLUME_SLIDER_ELEMENT_NAME,
  PROGRESS_BAR_ELEMENT_NAME,
  TIME_DISPLAY_ELEMENT_NAME,
  FULLSCREEN_BUTTON_ELEMENT_NAME,
  CAPTIONS_BUTTON_ELEMENT_NAME,
} from './index';

type MutableTextTrackList = TextTrackList & {
  setTracks: (tracks: TextTrack[]) => void;
};

const createTextTrack = (
  kind: TextTrackKind = 'captions',
  mode: TextTrackMode = 'disabled',
): TextTrack => ({ kind, mode } as TextTrack);

const createTextTrackList = (initialTracks: TextTrack[] = []): MutableTextTrackList => {
  let tracks = initialTracks;
  const list = new EventTarget() as MutableTextTrackList;
  Object.defineProperty(list, 'length', { get: () => tracks.length });
  Array.from({ length: 10 }, (_, index) => index).forEach((index) => {
    Object.defineProperty(list, index, { get: () => tracks[index] });
  });
  list.setTracks = (nextTracks) => { tracks = nextTracks; };
  return list;
};

describe('Control Elements', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'player-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  describe('PlayerControlsElement', () => {
    it('should be registered as a custom element', () => {
      expect(customElements.get(CONTROLS_ELEMENT_NAME)).toBe(PlayerControlsElement);
    });

    it('should create a shadow DOM with slot', () => {
      const controls = document.createElement(CONTROLS_ELEMENT_NAME) as PlayerControlsElement;
      document.body.appendChild(controls);

      expect(controls.shadowRoot).toBeTruthy();
      expect(controls.shadowRoot?.querySelector('slot')).toBeTruthy();
      expect(controls.shadowRoot?.querySelector('[part~="controls"]')).toBeTruthy();
    });
  });

  describe('PlayButtonElement', () => {
    it('should be registered as a custom element', () => {
      expect(customElements.get(PLAY_BUTTON_ELEMENT_NAME)).toBe(PlayButtonElement);
    });

    it('should create a shadow DOM with button', () => {
      const button = document.createElement(PLAY_BUTTON_ELEMENT_NAME) as PlayButtonElement;
      document.body.appendChild(button);

      expect(button.shadowRoot).toBeTruthy();
      expect(button.shadowRoot?.querySelector('button')).toBeTruthy();
    });

    it('should have play aria-label by default', () => {
      const button = document.createElement(PLAY_BUTTON_ELEMENT_NAME) as PlayButtonElement;
      document.body.appendChild(button);

      const btn = button.shadowRoot?.querySelector('button');
      expect(btn?.getAttribute('aria-label')).toBe('Play');
      expect(btn?.getAttribute('aria-pressed')).toBe('false');
      expect(btn?.getAttribute('part')).toBe('button');
    });
  });

  describe('MuteButtonElement', () => {
    it('should be registered as a custom element', () => {
      expect(customElements.get(MUTE_BUTTON_ELEMENT_NAME)).toBe(MuteButtonElement);
    });

    it('should create a shadow DOM with button', () => {
      const button = document.createElement(MUTE_BUTTON_ELEMENT_NAME) as MuteButtonElement;
      document.body.appendChild(button);

      expect(button.shadowRoot).toBeTruthy();
      expect(button.shadowRoot?.querySelector('button')).toBeTruthy();
    });

    it('should have mute aria-label by default', () => {
      const button = document.createElement(MUTE_BUTTON_ELEMENT_NAME) as MuteButtonElement;
      document.body.appendChild(button);

      const btn = button.shadowRoot?.querySelector('button');
      expect(btn?.getAttribute('aria-label')).toBe('Mute');
      expect(btn?.getAttribute('aria-pressed')).toBe('false');
    });
  });

  describe('VolumeSliderElement', () => {
    it('should be registered as a custom element', () => {
      expect(customElements.get(VOLUME_SLIDER_ELEMENT_NAME)).toBe(VolumeSliderElement);
    });

    it('should create a shadow DOM with range input', () => {
      const slider = document.createElement(VOLUME_SLIDER_ELEMENT_NAME) as VolumeSliderElement;
      document.body.appendChild(slider);

      expect(slider.shadowRoot).toBeTruthy();
      const input = slider.shadowRoot?.querySelector('input[type="range"]');
      expect(input).toBeTruthy();
    });

    it('should have volume aria-label', () => {
      const slider = document.createElement(VOLUME_SLIDER_ELEMENT_NAME) as VolumeSliderElement;
      document.body.appendChild(slider);

      const input = slider.shadowRoot?.querySelector('input');
      expect(input?.getAttribute('aria-label')).toBe('Volume');
      expect(input?.getAttribute('aria-valuetext')).toBeNull();
      expect(input?.getAttribute('part')).toBe('slider');
    });
  });

  describe('ProgressBarElement', () => {
    it('should be registered as a custom element', () => {
      expect(customElements.get(PROGRESS_BAR_ELEMENT_NAME)).toBe(ProgressBarElement);
    });

    it('should create a shadow DOM with range input', () => {
      const bar = document.createElement(PROGRESS_BAR_ELEMENT_NAME) as ProgressBarElement;
      document.body.appendChild(bar);

      expect(bar.shadowRoot).toBeTruthy();
      const input = bar.shadowRoot?.querySelector('input[type="range"]');
      expect(input).toBeTruthy();
    });

    it('should have seek aria-label', () => {
      const bar = document.createElement(PROGRESS_BAR_ELEMENT_NAME) as ProgressBarElement;
      document.body.appendChild(bar);

      const input = bar.shadowRoot?.querySelector('input');
      expect(input?.getAttribute('aria-label')).toBe('Seek');
      expect(input?.getAttribute('part')).toBe('slider');
    });
  });

  describe('TimeDisplayElement', () => {
    it('should be registered as a custom element', () => {
      expect(customElements.get(TIME_DISPLAY_ELEMENT_NAME)).toBe(TimeDisplayElement);
    });

    it('should create a shadow DOM with span', () => {
      const display = document.createElement(TIME_DISPLAY_ELEMENT_NAME) as TimeDisplayElement;
      document.body.appendChild(display);

      expect(display.shadowRoot).toBeTruthy();
      expect(display.shadowRoot?.querySelector('span')).toBeTruthy();
    });

    it('should display 0:00 / 0:00 by default', () => {
      const display = document.createElement(TIME_DISPLAY_ELEMENT_NAME) as TimeDisplayElement;
      document.body.appendChild(display);

      const span = display.shadowRoot?.querySelector('span');
      expect(span?.textContent).toBe('0:00 / 0:00');
      expect(span?.getAttribute('part')).toBe('time');
    });
  });

  describe('FullscreenButtonElement', () => {
    it('should be registered as a custom element', () => {
      const registered = customElements.get(FULLSCREEN_BUTTON_ELEMENT_NAME);
      expect(registered).toBe(FullscreenButtonElement);
    });

    it('should create a shadow DOM with button', () => {
      const fsButton = document.createElement(
        FULLSCREEN_BUTTON_ELEMENT_NAME,
      ) as FullscreenButtonElement;
      document.body.appendChild(fsButton);

      expect(fsButton.shadowRoot).toBeTruthy();
      expect(fsButton.shadowRoot?.querySelector('button')).toBeTruthy();
    });

    it('should have enter fullscreen aria-label by default', () => {
      const fsButton = document.createElement(
        FULLSCREEN_BUTTON_ELEMENT_NAME,
      ) as FullscreenButtonElement;
      document.body.appendChild(fsButton);

      const btn = fsButton.shadowRoot?.querySelector('button');
      expect(btn?.getAttribute('aria-label')).toBe('Enter fullscreen');
      expect(btn?.getAttribute('aria-pressed')).toBe('false');
    });
  });

  describe('CaptionsButtonElement', () => {
    it('should be registered as a custom element', () => {
      expect(customElements.get(CAPTIONS_BUTTON_ELEMENT_NAME)).toBe(CaptionsButtonElement);
    });

    it('should start disabled with an accessible toggle state', () => {
      const captionsButton = document.createElement(
        CAPTIONS_BUTTON_ELEMENT_NAME,
      ) as CaptionsButtonElement;
      document.body.appendChild(captionsButton);

      const button = captionsButton.shadowRoot?.querySelector('button');
      expect(button?.disabled).toBe(true);
      expect(button?.getAttribute('aria-label')).toBe('Show captions');
      expect(button?.getAttribute('aria-pressed')).toBe('false');
      expect(button?.getAttribute('part')).toBe('button');
      expect(button?.querySelector('[part~="icon"]')).toBeTruthy();
    });
  });

  describe('Control integration with player', () => {
    const mountControl = (elementName: string) => {
      const player = createPlayer({ src: 'https://example.com/video.mp4' }).mount(container);
      const control = document.createElement(elementName);
      player.element?.appendChild(control);
      return { player, control, video: player.element!.videoElement };
    };

    const mountCaptions = (tracks: TextTrack[]) => {
      const player = createPlayer({ src: 'https://example.com/video.mp4' }).mount(container);
      const video = player.element!.videoElement;
      const textTracks = createTextTrackList(tracks);
      Object.defineProperty(video, 'textTracks', {
        configurable: true,
        value: textTracks,
      });
      const control = document.createElement(CAPTIONS_BUTTON_ELEMENT_NAME);
      player.element?.appendChild(control);
      const button = control.shadowRoot?.querySelector('button') as HTMLButtonElement;
      return {
        player, video, textTracks, control, button,
      };
    };

    it('should support slotted controls in player element', () => {
      const player = createPlayer({ src: 'https://example.com/video.mp4' });
      player.mount(container);

      expect(player.element).toBeTruthy();

      // Check that controls slot exists in shadow DOM
      const controlsSlot = player.element?.shadowRoot?.querySelector('slot[name="controls"]');
      expect(controlsSlot).toBeTruthy();
    });

    it('should play and pause from the play button', () => {
      const { control, video } = mountControl(PLAY_BUTTON_ELEMENT_NAME);
      const play = vi.spyOn(video, 'play').mockResolvedValue(undefined);
      const pause = vi.spyOn(video, 'pause').mockImplementation(() => {});
      const button = control.shadowRoot?.querySelector('button');

      button?.click();
      expect(play).toHaveBeenCalledOnce();

      Object.defineProperty(video, 'paused', { configurable: true, value: false });
      video.dispatchEvent(new Event('play'));
      expect(button?.getAttribute('aria-pressed')).toBe('true');

      button?.click();
      expect(pause).toHaveBeenCalledOnce();

      Object.defineProperty(video, 'paused', { configurable: true, value: true });
      video.dispatchEvent(new Event('pause'));
      expect(button?.getAttribute('aria-pressed')).toBe('false');
    });

    it('should toggle mute and update its state', () => {
      const { control, video } = mountControl(MUTE_BUTTON_ELEMENT_NAME);
      const button = control.shadowRoot?.querySelector('button');

      button?.click();
      video.dispatchEvent(new Event('volumechange'));

      expect(video.muted).toBe(true);
      expect(button?.getAttribute('aria-label')).toBe('Unmute');
      expect(button?.getAttribute('aria-pressed')).toBe('true');
    });

    it('should restore the last audible volume when unmuting from zero', () => {
      const { control, video } = mountControl(MUTE_BUTTON_ELEMENT_NAME);
      const button = control.shadowRoot?.querySelector('button');
      video.volume = 0.35;
      video.dispatchEvent(new Event('volumechange'));
      video.volume = 0;
      video.dispatchEvent(new Event('volumechange'));

      button?.click();

      expect(video.volume).toBe(0.35);
      expect(video.muted).toBe(false);
      expect(button?.getAttribute('aria-label')).toBe('Mute');
      expect(button?.getAttribute('aria-pressed')).toBe('false');
    });

    it('should apply volume input and unmute playback', () => {
      const { control, video } = mountControl(VOLUME_SLIDER_ELEMENT_NAME);
      const input = control.shadowRoot?.querySelector('input') as HTMLInputElement;
      video.muted = true;
      input.value = '0.35';

      input.dispatchEvent(new Event('input'));

      expect(video.volume).toBe(0.35);
      expect(video.muted).toBe(false);
      video.dispatchEvent(new Event('volumechange'));
      expect(input.getAttribute('aria-valuetext')).toBe('35%');
    });

    it('should seek from progress input and update the time display', () => {
      const player = createPlayer({ src: 'https://example.com/video.mp4' }).mount(container);
      const progress = document.createElement(PROGRESS_BAR_ELEMENT_NAME);
      const display = document.createElement(TIME_DISPLAY_ELEMENT_NAME);
      player.element?.append(progress, display);
      const video = player.element!.videoElement;
      Object.defineProperty(video, 'duration', { configurable: true, value: 120 });
      const input = progress.shadowRoot?.querySelector('input') as HTMLInputElement;
      input.value = '0.5';

      input.dispatchEvent(new Event('input'));
      input.dispatchEvent(new Event('change'));
      video.dispatchEvent(new Event('timeupdate'));

      expect(video.currentTime).toBe(60);
      expect(display.shadowRoot?.querySelector('span')?.textContent).toBe('1:00 / 2:00');
      expect(input.getAttribute('aria-valuetext')).toBe('1:00 of 2:00');
    });

    it('should request fullscreen from the fullscreen button', () => {
      const { player, control } = mountControl(FULLSCREEN_BUTTON_ELEMENT_NAME);
      const requestFullscreen = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(player.element, 'requestFullscreen', {
        configurable: true,
        value: requestFullscreen,
      });

      control.shadowRoot?.querySelector('button')?.click();

      expect(requestFullscreen).toHaveBeenCalledOnce();
    });

    it('should update fullscreen pressed state only for its own player', () => {
      const { player, control } = mountControl(FULLSCREEN_BUTTON_ELEMENT_NAME);
      const button = control.shadowRoot?.querySelector('button');
      Object.defineProperty(document, 'fullscreenElement', {
        configurable: true,
        value: player.element,
      });

      document.dispatchEvent(new Event('fullscreenchange'));

      expect(button?.getAttribute('aria-label')).toBe('Exit fullscreen');
      expect(button?.getAttribute('aria-pressed')).toBe('true');
      Reflect.deleteProperty(document, 'fullscreenElement');
    });

    it('should enable and toggle the default captions track', () => {
      const first = createTextTrack('captions');
      const second = createTextTrack('subtitles');
      const { video, button } = mountCaptions([first, second]);
      const defaultTrack = document.createElement('track');
      defaultTrack.kind = 'subtitles';
      defaultTrack.default = true;
      Object.defineProperty(defaultTrack, 'track', { value: second });
      video.appendChild(defaultTrack);

      button.click();

      expect(button.disabled).toBe(false);
      expect(first.mode).toBe('disabled');
      expect(second.mode).toBe('showing');
      expect(button.getAttribute('aria-label')).toBe('Hide captions');
      expect(button.getAttribute('aria-pressed')).toBe('true');
    });

    it('should remember the last selected captions track', () => {
      const first = createTextTrack('captions', 'showing');
      const second = createTextTrack('subtitles');
      const { button, textTracks } = mountCaptions([first, second]);
      textTracks.dispatchEvent(new Event('change'));

      button.click();
      expect(first.mode).toBe('disabled');
      expect(button.getAttribute('aria-pressed')).toBe('false');

      button.click();
      expect(first.mode).toBe('showing');
      expect(second.mode).toBe('disabled');
    });

    it('should select the first captions track when no default or previous track exists', () => {
      const first = createTextTrack('captions');
      const second = createTextTrack('subtitles');
      const { button } = mountCaptions([first, second]);

      button.click();

      expect(first.mode).toBe('showing');
      expect(second.mode).toBe('disabled');
    });

    it('should react to external track list and mode changes and clean up listeners', () => {
      const track = createTextTrack('captions');
      const { button, textTracks, control } = mountCaptions([]);

      expect(button.disabled).toBe(true);
      textTracks.setTracks([track]);
      textTracks.dispatchEvent(new Event('addtrack'));
      expect(button.disabled).toBe(false);

      textTracks.setTracks([]);
      textTracks.dispatchEvent(new Event('removetrack'));
      expect(button.disabled).toBe(true);

      textTracks.setTracks([track]);
      textTracks.dispatchEvent(new Event('addtrack'));

      track.mode = 'showing';
      textTracks.dispatchEvent(new Event('change'));
      expect(button.getAttribute('aria-label')).toBe('Hide captions');

      control.remove();
      track.mode = 'disabled';
      textTracks.dispatchEvent(new Event('change'));
      expect(button.getAttribute('aria-label')).toBe('Hide captions');
    });

    it('should keep native controls keyboard focusable', () => {
      const play = mountControl(PLAY_BUTTON_ELEMENT_NAME).control;
      const progress = mountControl(PROGRESS_BAR_ELEMENT_NAME).control;

      expect((play.shadowRoot?.querySelector('button') as HTMLButtonElement).tabIndex).toBe(0);
      expect((progress.shadowRoot?.querySelector('input') as HTMLInputElement).tabIndex).toBe(0);
    });

    it('should remove event handlers when disconnected', () => {
      const { control, video } = mountControl(MUTE_BUTTON_ELEMENT_NAME);
      const button = control.shadowRoot?.querySelector('button');
      control.remove();

      button?.click();

      expect(video.muted).toBe(false);
    });
  });
});
