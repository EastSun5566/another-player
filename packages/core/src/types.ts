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
