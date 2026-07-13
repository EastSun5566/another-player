# Another Player

[![NPM Version](https://img.shields.io/npm/v/%40another-player/core.svg?style=for-the-badge)](https://www.npmjs.com/package/@another-player/core)
[![NPM Downloads](https://img.shields.io/npm/dt/%40another-player/core.svg?style=for-the-badge)](https://www.npmjs.com/package/@another-player/core)
[![Test Status](https://img.shields.io/github/actions/workflow/status/EastSun5566/another-player/ci.yml?style=for-the-badge)](https://github.com/EastSun5566/another-player/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/EastSun5566/another-player.svg?style=for-the-badge)](https://github.com/EastSun5566/another-player/blob/main/LICENSE)

> A modern, headless, standard-compliant media player with a rich plugin architecture.

---

## Features

- **Standard-Compliant**: Built on native Web Components.
- **Headless & Customisable**: Decouples logic from UI; styles seamlessly with Tailwind, Windi, or custom CSS.
- **Vue-like API**: Simple and familiar lifecycle/setup API.
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
```

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
}).use([
  myPlugin(),
]).mount("#player");
```

---

## DRM Support

### DASH (Widevine / PlayReady)

Pass `protectionData` to `dashPlugin`.

```ts
import { createPlayer } from "@another-player/core";
import { dashPlugin } from "@another-player/core/plugins";

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
import { createPlayer } from "@another-player/core";
import { hlsPlugin } from "@another-player/core/plugins";

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

- **Package Manager**: [PNPM](https://pnpm.io/) (`pnpm i`)
- **Monorepo Manager**: [NX](https://nx.dev/) (`pnpm nx graph`)
- **Language**: TypeScript
- **Build Tool**: Vite
