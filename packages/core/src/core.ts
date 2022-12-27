import { DEFAULT_ELEMENT_NAME } from './constants';

export class AnotherPlayer extends HTMLMediaElement {
  mount(root: Element) {
    if (root instanceof AnotherPlayer) return;

    root.appendChild(this);
  }
}

export function createPlayer({
  elementName = DEFAULT_ELEMENT_NAME,
}) {
  customElements.define(elementName, AnotherPlayer);

  return document.createElement(elementName);
}
