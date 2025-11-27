import { DEFAULT_ELEMENT_NAME } from './constants';
import { PlayerElement } from './core';

declare global {
  interface HTMLElementTagNameMap {
    [DEFAULT_ELEMENT_NAME]: PlayerElement;
  }
}

export interface PlayerOptions {
  elementName?: string;
  element?: PlayerElement;
  src?: string | undefined
}

/** Event data for play and pause events */
export interface PlayPauseEvent {
  currentTime: number;
}

/** Event data for time update events */
export interface TimeUpdateEvent {
  currentTime: number;
  duration: number;
}

/** Event data for volume change events */
export interface VolumeChangeEvent {
  volume: number;
  muted: boolean;
}

/** Event data for loaded metadata events */
export interface LoadedMetadataEvent {
  duration: number;
  videoWidth: number;
  videoHeight: number;
}

/** Event data for seeking events */
export interface SeekEvent {
  currentTime: number;
}

/** Event data for error events */
export interface ErrorEvent {
  error: MediaError | null;
}

/** Map of all player events and their corresponding event data */
export interface PlayerEventMap {
  play: PlayPauseEvent;
  pause: PlayPauseEvent;
  timeupdate: TimeUpdateEvent;
  volumechange: VolumeChangeEvent;
  ended: PlayPauseEvent;
  loadedmetadata: LoadedMetadataEvent;
  seeking: SeekEvent;
  seeked: SeekEvent;
  waiting: SeekEvent;
  playing: PlayPauseEvent;
  error: ErrorEvent;
}
