/* eslint-disable import/no-extraneous-dependencies */
import { html } from 'lit-html';
import { Meta, StoryFn } from '@storybook/web-components';

import {
  createPlayer,
  // PlayerElement,
  type PlayerOptions,
} from '@another-player/core';

const DEFAULT_VIDEO_URL = 'https://cdn.jsdelivr.net/npm/big-buck-bunny-1080p@0.0.6/video.mp4';
export default {
  title: 'Another Player',
  argTypes: {
    src: { defaultValue: DEFAULT_VIDEO_URL },
  },
} as Meta<PlayerOptions>;

let player: ReturnType<typeof createPlayer>;
export const AnotherPlayer: StoryFn<PlayerOptions> = ({ src = DEFAULT_VIDEO_URL }) => {
  player = createPlayer({ src });

  return html`<another-player src="${src}"></another-player>`;
};

AnotherPlayer.args = {
  src: DEFAULT_VIDEO_URL,
};

AnotherPlayer.play = () => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  player.bind(document.querySelector('another-player')!);
};
