// eslint-disable-next-line max-classes-per-file
import { DEFAULT_ELEMENT_NAME } from './constants';

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

export class Player /* implements HTMLVideoElement */ {
  element: PlayerElement;

  constructor(playerElement: PlayerElement) {
    this.element = playerElement;
  }

  mount(root: Element) {
    if (root instanceof PlayerElement) {
      this.element = root;
      return;
    }

    root.appendChild(this.element);
  }
}

export function createPlayer({
  elementName = DEFAULT_ELEMENT_NAME,
}) {
  customElements.define(elementName, PlayerElement);

  return new Player(document.createElement(elementName) as PlayerElement);
}
