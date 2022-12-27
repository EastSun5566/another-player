class AnotherPlayer extends HTMLMediaElement {
  mount(root: Element) {
    if(root instanceof AnotherPlayer) return;

    root.appendChild(this);
  }
}

export function createPlayer() {
  const elementName = 'another-player';
  customElements.define(elementName, AnotherPlayer);

  return document.createElement(elementName);
}


