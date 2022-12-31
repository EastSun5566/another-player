/* eslint-disable class-methods-use-this */
// eslint-disable-next-line max-classes-per-file
import { DEFAULT_ELEMENT_NAME } from './constants';
import type { PlayerOptions } from './types';

type PlayerElementAttributeName = keyof HTMLVideoElement;

// should focus to behavior like `HTMLVideoElement`
export class PlayerElement extends HTMLElement {
  static get observedAttributes(): PlayerElementAttributeName[] {
    return ['src'];
  }

  videoElement: HTMLVideoElement;

  src?: string;

  constructor() {
    super();

    // create shadow root
    const shadowRoot = this.attachShadow({ mode: 'open' });

    this.videoElement = document.createElement('video');
    shadowRoot.appendChild(this.videoElement);
  }

  attributeChangedCallback(
    attributeName: PlayerElementAttributeName,
    _oldValue: string,
    newValue: string,
  ) {
    this.videoElement.setAttribute(attributeName, newValue);
  }
}

// should focus to be Player app
class Player /* implements EventTarget */ {
  elementName: string;

  element?: PlayerElement;

  src: string;

  constructor({
    elementName = DEFAULT_ELEMENT_NAME,
    element,
    src,
  }: PlayerOptions) {
    this.elementName = elementName;
    this.src = src;

    // check if player element has been defined before
    if (!customElements.get(elementName)) {
      customElements.define(elementName, PlayerElement);
    }

    if (element) {
      this.element = element;
      this.element.setAttribute('src', src);
    }
  }

  mount(root: Element) {
    this.element = document.createElement(this.elementName) as PlayerElement;
    this.element.setAttribute('src', this.src);
    root.appendChild(this.element);
  }
}

export function createPlayer(options: PlayerOptions) {
  return new Player(options);
}
