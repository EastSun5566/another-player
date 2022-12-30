/* eslint-disable import/no-extraneous-dependencies */
import { html } from 'lit-html';
import { Meta, Story } from '@storybook/web-components';

import { createPlayer, PlayerElement, type PlayerOptions } from '@another-player/core';

const VIDEO_URL = 'https://cdn.jsdelivr.net/npm/big-buck-bunny-1080p@0.0.6/video.mp4';

const player = createPlayer({
  src: VIDEO_URL,
});

export default {
  title: 'Another Player',
} as Meta<PlayerOptions>;

export const AnotherPlayer: Story<PlayerOptions> = () => html`<div id="player"></div>`;

AnotherPlayer.play = () => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  player.mount(document.querySelector<PlayerElement>('#player')!);
};
