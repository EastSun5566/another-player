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
  CONTROLS_ELEMENT_NAME,
  PLAY_BUTTON_ELEMENT_NAME,
  MUTE_BUTTON_ELEMENT_NAME,
  VOLUME_SLIDER_ELEMENT_NAME,
  PROGRESS_BAR_ELEMENT_NAME,
  TIME_DISPLAY_ELEMENT_NAME,
  FULLSCREEN_BUTTON_ELEMENT_NAME,
} from './index';

describe('Control Elements', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'player-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
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
    });
  });

  describe('Control integration with player', () => {
    const mountControl = (elementName: string) => {
      const player = createPlayer({ src: 'https://example.com/video.mp4' }).mount(container);
      const control = document.createElement(elementName);
      player.element?.appendChild(control);
      return { player, control, video: player.element!.videoElement };
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
      button?.click();
      expect(pause).toHaveBeenCalledOnce();
    });

    it('should toggle mute and update its state', () => {
      const { control, video } = mountControl(MUTE_BUTTON_ELEMENT_NAME);
      const button = control.shadowRoot?.querySelector('button');

      button?.click();
      video.dispatchEvent(new Event('volumechange'));

      expect(video.muted).toBe(true);
      expect(button?.getAttribute('aria-label')).toBe('Unmute');
    });

    it('should apply volume input and unmute playback', () => {
      const { control, video } = mountControl(VOLUME_SLIDER_ELEMENT_NAME);
      const input = control.shadowRoot?.querySelector('input') as HTMLInputElement;
      video.muted = true;
      input.value = '0.35';

      input.dispatchEvent(new Event('input'));

      expect(video.volume).toBe(0.35);
      expect(video.muted).toBe(false);
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

    it('should remove event handlers when disconnected', () => {
      const { control, video } = mountControl(MUTE_BUTTON_ELEMENT_NAME);
      const button = control.shadowRoot?.querySelector('button');
      control.remove();

      button?.click();

      expect(video.muted).toBe(false);
    });
  });
});
