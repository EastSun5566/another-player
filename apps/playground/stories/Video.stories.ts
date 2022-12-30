/* eslint-disable import/no-extraneous-dependencies */
import { html } from 'lit-html';
import { Meta, Story } from '@storybook/web-components';

import { createPlayer } from '@another-player/core';

createPlayer();

export default {
  title: 'Video',
} as Meta;

export const Video: Story = () => html`<another-player></another-player>`;
