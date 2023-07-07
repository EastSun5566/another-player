/* eslint-disable import/prefer-default-export */
/* eslint-disable import/no-extraneous-dependencies */
import { html } from 'lit-html';
// import { styleMap } from 'lit-html/directives/style-map';
import './button.css';

/**
 * Primary UI component for user interaction
 */
export const Button = ({
  primary,
  backgroundColor = null,
  size,
  label,
  onClick,
}) => {
  const mode = primary ? 'storybook-button--primary' : 'storybook-button--secondary';

  // style=${styleMap({ backgroundColor })}
  return html`
    <button
      type="button"
      class=${['storybook-button', `storybook-button--${size || 'medium'}`, mode].join(' ')}
      @click=${onClick}
    >
      ${label}
    </button>
  `;
};
