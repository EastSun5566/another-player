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

  /** The address or URL of the a media resource that is to be considered. */
  get src() {
    return this.getAttribute('src') || '';
  }

  set src(source: string) {
    this.setAttribute('src', source);
  }

  constructor() {
    super();

    const videoElement = document.createElement('video');
    videoElement.style.setProperty('width', '100%');

    this.videoElement = videoElement;

    // const controlsSlot = document.createElement('slot');
    // controlsSlot.name = 'controls';
    // const button = document.createElement('button');
    // button.textContent = 'Play';
    // controlsSlot.append(button);

    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: inline-block;
      }
    `;

    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.append(
      style,
      videoElement,
      // controlsSlot,
    );
  }

  // TODO
  connectedCallback() {}

  disconnectedCallback() {}

  attributeChangedCallback(
    attributeName: PlayerElementAttributeName,
    _oldValue: string,
    newValue: string,
  ) {
    // TODO
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.videoElement[attributeName] = newValue;
  }
}

// should focus to be Player app
class Player /* implements EventTarget */ {
  elementName = DEFAULT_ELEMENT_NAME;

  element?: PlayerElement;

  src = '';

  constructor({
    elementName = DEFAULT_ELEMENT_NAME,
    element,
    src = '',
  }: PlayerOptions = {}) {
    this.elementName = elementName;
    this.src = src;

    // check if player element has been defined before
    if (!customElements.get(elementName)) {
      customElements.define(elementName, PlayerElement);
    }

    if (element) this.bind(element);
  }

  /** bind existing player element to player */
  bind(element: PlayerElement) {
    this.element = element;
    this.src = element.src;
  }

  mount(root: Element) {
    this.element = document.createElement(this.elementName) as PlayerElement;
    this.element.src = this.src;
    root.appendChild(this.element);
  }
}

export function createPlayer(options: PlayerOptions) {
  return new Player(options);
}
