// eslint-disable-next-line max-classes-per-file
import { DEFAULT_ELEMENT_NAME } from './constants';
import type { PlayerOptions } from './types';

export class PlayerElement extends HTMLElement {
  videoElement: HTMLVideoElement;

  constructor() {
    super();

    // Create shadow root
    const shadowRoot = this.attachShadow({ mode: 'open' });

    const videoElement = document.createElement('video');
    this.videoElement = videoElement;

    shadowRoot.appendChild(videoElement);
  }
}

class Player /* implements EventTarget */ {
  elementName: string;

  element?: PlayerElement;

  src: string;

  constructor({
    elementName = DEFAULT_ELEMENT_NAME,
    src,
  }: PlayerOptions) {
    this.elementName = elementName;
    this.src = src;
  }

  mount(root: Element) {
    if (root instanceof PlayerElement) {
      this.element = root;
      this.element.videoElement.src = this.src;
      return;
    }

    this.element = document.createElement(this.elementName) as PlayerElement;
    this.element.videoElement.src = this.src;
    root.appendChild(this.element);
  }
}

export function createPlayer({
  elementName = DEFAULT_ELEMENT_NAME,
  ...otherOptions
}: PlayerOptions) {
  // check if player element has been defined before
  if (!customElements.get(elementName)) {
    customElements.define(elementName, PlayerElement);
  }

  return new Player({
    elementName,
    ...otherOptions,
  });
}
