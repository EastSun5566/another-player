# Another Player

[![NPM Version](https://img.shields.io/npm/v/%40another-player/core.svg?style=for-the-badge)](https://www.npmjs.com/package/@another-player/core)
[![NPM Downloads](https://img.shields.io/npm/dt/%40another-player/core.svg?style=for-the-badge)](https://www.npmjs.com/package/@another-player/core)
[![Test Status](https://img.shields.io/github/actions/workflow/status/EastSun5566/another-player/ci.yml?style=for-the-badge)](https://github.com/EastSun5566/another-player/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/EastSun5566/another-player.svg?style=for-the-badge)](https://github.com/EastSun5566/another-player/blob/main/LICENSE)

> A small, browser-first media player built with Web Components and typed plugins.

---

## Features

- **Standard-Compliant**: Built on native Web Components.
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
}).use(myPlugin()).mount("#player");

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

---

## DRM Support

### DASH (Widevine / PlayReady)

Pass `protectionData` to `dashPlugin`.

```ts
import { createPlayer, dashPlugin } from "@another-player/core";

const player = createPlayer({
  src: "https://example.com/stream.mpd",
}).use([
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
]).mount("#player");
```

### HLS (Widevine / PlayReady / FairPlay)

Pass `drmSystems` to `hlsPlugin`. Setting `drmSystems` automatically enables EME.

```ts
import { createPlayer, hlsPlugin } from "@another-player/core";

const player = createPlayer({
  src: "https://example.com/stream.m3u8",
}).use([
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
]).mount("#player");
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

## Next: Standards & Accessibility

The next release will focus on native media parity before framework adapters:

- mirror standard video attributes such as `poster`, `preload`, `autoplay`, `loop`, `muted`, `playsinline`, and `crossorigin`
- support declarative caption tracks, a captions control, and a WebVTT playground example
- expose stable CSS parts for the video, controls, buttons, and sliders
- complete keyboard and screen-reader behavior, including pressed states and readable time values

Caption support comes before a quality-selector UI. Framework adapters remain deferred until these browser contracts are stable.
