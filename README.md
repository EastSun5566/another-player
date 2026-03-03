# Another Player (WIP)

> just another player with good DX

## Design Goals

- Web component base. should be close to web standards.
- Should be "Headless" so that can be fully customized & easily integrates with frameworks like `Tailwind` and `Windi`
- APIs similar to those in `Vue.js`

  ```ts
  import { createPlayer } from "@another-player/core";

  const player = createPlayer({
    src: "https://big-buck-bunny.mp4",
  }).mount("#player");
  ```

- Rich plugin system with APIs similar to those in [`Vite`](https://vitejs.dev/guide/api-plugin.html#plugin-api) and [`Rollup`](https://rollupjs.org/guide/en/#plugin-development)

  ```ts
  import { createPlayer, definePlugin } from "@another-player/core";

  const myPlugin = definePlugin(options);

  const player = createPlayer({
    src: "https://big-buck-bunny.mp4",
  }).use([
    myPlugin(),
  ]).mount("#player");
  ```

- Support for mainstream streaming formats such as DASH and HLS through the use of plugins
- Support for Multi-DRM
  - FairPlay as recently implemented in [`HLS.js`](https://github.com/video-dev/hls.js/pull/4930)

## Roadmap

### Phase 1: Core Foundation

- [x] Basic player implementation with web component
- [x] `createPlayer` API with mount functionality
- [x] Basic media playback controls (play, pause, seek, volume)
- [x] Event system for player state changes

### Phase 2: Plugin System

- [x] `definePlugin` API implementation
- [x] Plugin lifecycle hooks
- [x] Plugin options and configuration
- [x] Built-in plugins architecture

### Phase 3: Streaming Support

- [x] HLS plugin with [`HLS.js`](https://github.com/video-dev/hls.js) integration
- [x] DASH plugin with [`dash.js`](https://github.com/Dash-Industry-Forum/dash.js) integration
- [x] Adaptive bitrate streaming support

### Phase 4: DRM Support

- [x] Widevine DRM integration
- [x] FairPlay DRM integration
- [x] PlayReady DRM integration
- [x] Multi-DRM unified API

## DRM Support

DRM-protected streams are supported via the built-in HLS and DASH plugins.

### DASH – Widevine / PlayReady

Pass `protectionData` to `dashPlugin`. Each key is a [key system string](https://dashif.org/dash.js/pages/usage/drm.html) and the value describes the license server and optional headers.

```ts
import { createPlayer } from "@another-player/core";
import { dashPlugin } from "@another-player/core/plugins";

const player = createPlayer({
  src: "https://example.com/stream.mpd",
}).use(dashPlugin({
  protectionData: {
    "com.widevine.alpha": {
      serverURL: "https://license.example.com/widevine",
      httpRequestHeaders: { Authorization: "Bearer <token>" },
    },
    "com.microsoft.playready": {
      serverURL: "https://license.example.com/playready",
    },
  },
})).mount("#player");
```

`protectionData` is typed as [`ProtectionDataSet`](https://cdn.dashjs.org/latest/jsdoc/module-ProtectionController.html) from `dashjs`, so each entry can also carry `withCredentials`, `httpTimeout`, `serverCertificate`, and more.

### HLS – Widevine / PlayReady / FairPlay

Pass `drmSystems` to `hlsPlugin`. Each key is a key system string and the value is a [`DRMSystemConfiguration`](https://github.com/video-dev/hls.js/blob/master/docs/API.md#drmsystems) from `hls.js`. Setting `drmSystems` automatically enables EME.

> **Note:** This DRM path requires HLS.js to be used as the playback engine (Media Source Extensions must be available). On Safari and other environments where native HLS is available, the current HLS plugin always falls back to the browser's native HLS support when `videoElement.canPlayType('application/vnd.apple.mpegurl')` is truthy, which bypasses HLS.js and ignores `drmSystems`/`emeEnabled`. There is currently no plugin option to override this behavior and force HLS.js when native HLS is detected, so EME-based DRM (e.g. Widevine or PlayReady) is only available in environments where HLS.js is actually used (typically browsers without native HLS support).

```ts
import { createPlayer } from "@another-player/core";
import { hlsPlugin } from "@another-player/core/plugins";

const player = createPlayer({
  src: "https://example.com/stream.m3u8",
}).use(hlsPlugin({
  drmSystems: {
    "com.widevine.alpha": {
      licenseUrl: "https://license.example.com/widevine",
    },
    "com.apple.fps": {
      licenseUrl: "https://license.example.com/fairplay",
      serverCertificateUrl: "https://license.example.com/fairplay/cert",
    },
  },
})).mount("#player");
```

You can also set `emeEnabled: true` explicitly without providing `drmSystems` if you prefer to configure EME through `hlsConfig`.

## Tech Stack

- `PNPM` as the package manager; run `pnpm i` to install dependencies
- `NX` as the monorepo workspace; run `pnpm nx graph` to see a diagram of the dependencies of the projects
- `Typescript` as the language
- `Vite` as the build tool
