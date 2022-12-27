import { DEFAULT_ELEMENT_NAME } from './constants';
import { AnotherPlayer } from './core';

declare global {
  interface HTMLElementTagNameMap {
    [DEFAULT_ELEMENT_NAME]: AnotherPlayer;
  }
}
