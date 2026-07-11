# Another Player

> A modern, headless, standard-compliant media player with a rich plugin architecture and great Developer Experience (DX).

Another Player is built on top of web standards and modern web components. It provides a flexible, robust, and extensible framework for media playback, designed from the ground up to be headless and easily customisable.

---

## Key Features

- **Standard-Compliant Web Components**: Leverages native web technologies, ensuring robust performance and compatibility with modern web standards.
- **Headless & Customisable**: Decouples logic from UI. Easily integrates with styling frameworks like `Tailwind CSS`, `Windi CSS`, or vanilla CSS to design custom player skins.
- **Vue-like API**: Simple and intuitive lifecycle/setup API that feels instantly familiar.
- **Extensible Plugin System**: Features a lifecycle-hook-based plugin architecture inspired by `Vite` and `Rollup`, allowing developers to extend behavior seamlessly.
- **Mainstream Format Support**: Play DASH and HLS streams effortlessly using dedicated, official plugins.
- **Comprehensive Multi-DRM**: Built-in support for Widevine, PlayReady, and FairPlay (including recent FairPlay EME implementation in HLS.js).

---

## Quick Start

### Installation

Install the core package using your preferred package manager:

```bash
# Using npm
npm install @another-player/core

# Using pnpm
pnpm add @another-player/core

# Using yarn
yarn add @another-player/core
```

### Basic Usage

Instantiate and mount the player with a simple source:

```ts
import { createPlayer } from "@another-player/core";

const player = createPlayer({
  src: "https://big-buck-bunny.mp4",
}).mount("#player");
```

### Using Plugins

Extend the player's core capabilities by using plugins. The example below demonstrates creating and attaching a custom plugin:

```ts
import { createPlayer, definePlugin } from "@another-player/core";

// Define a custom plugin
const myPlugin = definePlugin((options) => ({
  name: "my-plugin",
  install(context) {
    console.log("Plugin installed on player", context);
  },
}));

// Instantiate player and attach the plugin
const player = createPlayer({
  src: "https://big-buck-bunny.mp4",
}).use([
  myPlugin(),
]).mount("#player");
```

---

## DRM Support

Another Player supports DRM-protected streams via official, built-in plugins for **HLS** and **DASH**.

### DASH – Widevine & PlayReady

To configure DRM for DASH playback, pass the `protectionData` option to `dashPlugin`. Each key is a standard key system string, and the value contains the license server configuration and optional request headers.

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

> **Note:** `protectionData` is typed as [`ProtectionDataSet`](https://cdn.dashjs.org/latest/jsdoc/module-ProtectionController.html) from `dashjs`. Each entry can also carry other parameters such as `withCredentials`, `httpTimeout`, `serverCertificate`, etc.

### HLS – Widevine, PlayReady, & FairPlay

To configure DRM for HLS playback, pass the `drmSystems` option to `hlsPlugin`. Setting `drmSystems` automatically configures Encrypted Media Extensions (EME).

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

> **Safari & Native Playback Compatibility:**
> This DRM integration relies on HLS.js to serve as the playback engine. Under Safari or environments where native HLS support is natively preferred, the current HLS plugin defaults back to the browser's native HLS support when `videoElement.canPlayType('application/vnd.apple.mpegurl')` evaluates to true, bypassing HLS.js and ignoring the custom `drmSystems` or `emeEnabled` options. Therefore, EME-based DRM (e.g. Widevine or PlayReady) is only functional in browsers and environments where HLS.js is actively utilised as the playback engine.
>
> If you prefer to configure EME through your custom `hlsConfig`, you may also explicitly enable it by passing `emeEnabled: true` without providing `drmSystems` to the plugin.

---

## Tech Stack & Development

This repository is managed as a high-performance monorepo workspace:

- **Package Manager**: [PNPM](https://pnpm.io/) for fast, disk-efficient workspace installs. Run `pnpm i` to install dependencies.
- **Monorepo Manager**: [NX](https://nx.dev/) to orchestrate builds, runs, and dependencies. Run `pnpm nx graph` to visualize workspace dependencies.
- **Language**: [TypeScript](https://www.typescriptlang.org/) for type safety and exceptional DX.
- **Build Tool**: [Vite](https://vite.dev/) for quick development starts and optimized builds.
