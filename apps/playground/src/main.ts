import {
  createPlayer,
  dashPlugin,
  hlsPlugin,
} from '@another-player/core';

import './styles.css';

const demos = [
  {
    id: 'mp4',
    channel: '01',
    label: 'Native MP4',
    detail: 'Browser-native playback',
    src: 'https://cdn.jsdelivr.net/npm/big-buck-bunny-1080p@0.0.6/video.mp4',
  },
  {
    id: 'hls',
    channel: '02',
    label: 'Adaptive HLS',
    detail: 'Powered by hls.js',
    src: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
  },
  {
    id: 'dash',
    channel: '03',
    label: 'Adaptive DASH',
    detail: 'Powered by dash.js',
    src: 'https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd',
  },
] as const;

const controls = (includeCaptions: boolean): string => `
  <another-player-controls slot="controls">
    <another-player-play-button></another-player-play-button>
    <another-player-progress-bar></another-player-progress-bar>
    <another-player-time-display></another-player-time-display>
    <another-player-mute-button></another-player-mute-button>
    <another-player-volume-slider></another-player-volume-slider>
    ${includeCaptions ? '<another-player-captions-button></another-player-captions-button>' : ''}
    <another-player-fullscreen-button></another-player-fullscreen-button>
  </another-player-controls>
`;

const app = document.querySelector<HTMLElement>('#app');
if (!app) throw new Error('Playground root element is missing');

app.innerHTML = `
  <header class="masthead">
    <div class="masthead__mark" aria-hidden="true">
      <span></span><span></span><span></span>
    </div>
    <div>
      <p class="eyebrow">Web component media lab · v0.3</p>
      <h1>Another Player<br><span>Signal Bench</span></h1>
    </div>
    <p class="masthead__lede">
      Three sources. One small browser-first API. Use this bench to verify native,
      HLS, and DASH playback with the same controls.
    </p>
  </header>
  <main class="channel-grid" aria-label="Playback demos">
    ${demos.map((demo) => `
      <article class="channel-card">
        <header class="channel-card__header">
          <div class="channel-number"><span aria-hidden="true"></span>CH ${demo.channel}</div>
          <div>
            <h2>${demo.label}</h2>
            <p>${demo.detail}</p>
          </div>
          <output id="${demo.id}-status" class="status" aria-live="polite">Starting</output>
        </header>
        <div id="${demo.id}-mount" class="player-mount"></div>
        <footer class="source-line"><span>Source</span><code>${demo.src}</code></footer>
      </article>
    `).join('')}
  </main>
  <footer class="site-footer">
    <p>Browser-only · ESM · Web Components</p>
    <a href="https://github.com/EastSun5566/another-player">Source on GitHub</a>
  </footer>
`;

demos.forEach((demo) => {
  const mountPoint = document.querySelector<HTMLElement>(`#${demo.id}-mount`);
  const status = document.querySelector<HTMLOutputElement>(`#${demo.id}-status`);
  if (!mountPoint || !status) return;

  const player = createPlayer({ src: demo.src });
  if (demo.id === 'hls') player.use(hlsPlugin());
  if (demo.id === 'dash') player.use(dashPlugin());

  player.mount(mountPoint);
  if (player.element) {
    const captions = demo.id === 'mp4'
      ? `<track kind="captions" src="${import.meta.env.BASE_URL}captions/en.vtt" srclang="en" label="English" default>`
      : '';
    player.element.innerHTML = `${captions}${controls(demo.id === 'mp4')}`;
  }

  void player.ready.then(() => {
    status.value = 'Ready';
    status.classList.add('status--ready');
  }).catch(() => {
    status.value = 'Unavailable';
    status.classList.add('status--error');
  });
});
