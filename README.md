# Another Player

[![NPM Version](https://img.shields.io/npm/v/%40another-player/core.svg?style=for-the-badge)](https://www.npmjs.com/package/@another-player/core)
[![NPM Downloads](https://img.shields.io/npm/dt/%40another-player/core.svg?style=for-the-badge)](https://www.npmjs.com/package/@another-player/core)
[![Test Status](https://img.shields.io/github/actions/workflow/status/EastSun5566/another-player/ci.yml?style=for-the-badge)](https://github.com/EastSun5566/another-player/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/EastSun5566/another-player.svg?style=for-the-badge)](https://github.com/EastSun5566/another-player/blob/main/LICENSE)

> 🎬 Just another player with a focus on DX

---

## Features

- **Standard-Compliant**: Built on native Web Components.
- **Accessible Controls**: Native buttons and sliders with stateful labels and caption support.
- **Headless & Customisable**: Decouples logic from UI; styles seamlessly with Tailwind, Windi, or custom CSS.
- **Extensible Plugins**: Lifecycle-hook-based system inspired by Vite and Rollup.
- **Streaming Formats**: Play DASH and HLS streams via official plugins.
- **Multi-DRM**: Integrated support for Widevine, PlayReady, and FairPlay.

---

## Quick Start

### Install

```bash
npm install @another-player/core
```

### Basic Usage

```ts
import { createPlayer } from "@another-player/core";

const player = createPlayer({
  src: "https://big-buck-bunny.mp4",
}).mount("#player");

await player.ready;
await player.load("https://example.com/next-video.mp4");

await player.destroy();
```

`mount()` and `bind()` are synchronous and each player instance can be attached only once.
Use `ready` to wait for plugin setup and `load()` to change the source.

### Using Plugins

```ts
import { createPlayer, definePlugin } from "@another-player/core";

const myPlugin = definePlugin((options) => ({
  name: "my-plugin",
  install(context) {
    console.log("Plugin installed", context);
  },
}));

const player = createPlayer({
  src: "https://big-buck-bunny.mp4",
})
  .use(myPlugin())
  .mount("#player");

await player.ready;
```

Official streaming plugins expose their quality controls directly on the plugin instance:

```ts
import { createPlayer, hlsPlugin } from "@another-player/core";

const hls = hlsPlugin();
const player = createPlayer({ src: "https://example.com/stream.m3u8" })
  .use(hls)
  .mount("#player");

await player.ready;
hls.api.setQualityLevel(1);

player.on("hlsQualityChange", ({ level, auto }) => {
  console.log({ level, auto });
});
```

Keep the plugin instance when you need its `api`. `player.getPlugins()` remains available for inspection.

### Browser Support

Another Player is browser-only and distributed as ESM. It accesses Web Component APIs during module evaluation, so SSR applications must dynamically import it from a client-only boundary.

### Declarative Media Attributes and Captions

Standard media configuration lives on `<another-player>` rather than in `PlayerOptions`. Supported attributes and reflected properties are `poster`, `preload`, `autoplay`, `loop`, `muted`, `playsinline`, and `crossorigin`. The source remains managed by `createPlayer()` and `load()`.

Caption and subtitle tracks must be direct children of `<another-player>`:

```html
<another-player
  src="/video.mp4"
  poster="/poster.jpg"
  preload="metadata"
  muted
  playsinline
  crossorigin="anonymous"
>
  <track
    kind="captions"
    src="/captions/en.vtt"
    srclang="en"
    label="English"
    default
  />

  <another-player-controls slot="controls">
    <another-player-play-button></another-player-play-button>
    <another-player-progress-bar></another-player-progress-bar>
    <another-player-time-display></another-player-time-display>
    <another-player-mute-button></another-player-mute-button>
    <another-player-volume-slider></another-player-volume-slider>
    <another-player-captions-button></another-player-captions-button>
    <another-player-fullscreen-button></another-player-fullscreen-button>
  </another-player-controls>
</another-player>
```

Bind the declarative element to the JavaScript lifecycle:

```ts
import { createPlayer, type PlayerElement } from "@another-player/core";

const element = document.querySelector("another-player") as PlayerElement;
const player = createPlayer({ element });
await player.ready;
```

`crossorigin` defaults to `anonymous` when omitted. The captions button enables the default track, then the first available track, and remembers the last selected track. It intentionally provides a toggle rather than a language menu.

### Styling with CSS Parts

The player exposes `container`, `video`, and `controls`. Built-in controls expose `button`, `icon`, `slider`, and `time` where applicable:

```css
another-player::part(video) {
  border-radius: 8px;
}

another-player::part(controls) {
  background: linear-gradient(transparent, rgb(0 0 0 / 80%));
}

another-player-play-button::part(button) {
  color: white;
}

another-player-progress-bar::part(slider) {
  accent-color: tomato;
}
```

### Accessibility Contract

The built-in controls keep native `<button>` and `<input type="range">` behavior, including Tab, Space, and arrow-key handling. Play, mute, captions, and fullscreen expose their current state; sliders provide readable percentage and elapsed-time values. Decorative icons are hidden from assistive technology.

Keyboard and screen-reader behavior is a browser-only contract. Applications that replace the controls remain responsible for equivalent names, states, focus visibility, and keyboard behavior.

---

## DRM Support

### DASH (Widevine / PlayReady)

Pass `protectionData` to `dashPlugin`.

```ts
import { createPlayer, dashPlugin } from "@another-player/core";

const player = createPlayer({
  src: "https://example.com/stream.mpd",
})
  .use([
    dashPlugin({
      protectionData: {
        "com.widevine.alpha": {
          serverURL: "https://license.example.com/widevine",
          httpRequestHeaders: { Authorization: "Bearer <token>" },
        },
        "com.microsoft.playready": {
          serverURL: "https://license.example.com/playready",
        },
      },
    }),
  ])
  .mount("#player");
```

### HLS (Widevine / PlayReady / FairPlay)

Pass `drmSystems` to `hlsPlugin`. Setting `drmSystems` automatically enables EME.

```ts
import { createPlayer, hlsPlugin } from "@another-player/core";

const player = createPlayer({
  src: "https://example.com/stream.m3u8",
})
  .use([
    hlsPlugin({
      drmSystems: {
        "com.widevine.alpha": {
          licenseUrl: "https://license.example.com/widevine",
        },
        "com.apple.fps": {
          licenseUrl: "https://license.example.com/fairplay",
          serverCertificateUrl: "https://license.example.com/fairplay/cert",
        },
      },
    }),
  ])
  .mount("#player");
```

> **Safari Note**: The HLS plugin falls back to native HLS playback on Safari if available, which bypasses HLS.js and EME configuration. EME-based DRM is only active when HLS.js is used. Enable `emeEnabled: true` to configure custom EME through `hlsConfig`.

---

## Tech Stack

- **Package Manager**: [pnpm](https://pnpm.io/)
- **Language**: TypeScript
- **Build & Demo**: Vite
- **Tests**: Vitest

## Development

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm dev
```

## Next

The next product step is a quality-selector UI built on the existing HLS and DASH plugin APIs. Framework adapters remain deferred until the browser contracts have more real-world use.

## License

[MIT](./LICENSE) © Michael Wang
