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

- [ ] Basic player implementation with web component
- [ ] `createPlayer` API with mount functionality
- [ ] Basic media playback controls (play, pause, seek, volume)
- [ ] Event system for player state changes

### Phase 2: Plugin System

- [ ] `definePlugin` API implementation
- [ ] Plugin lifecycle hooks
- [ ] Plugin options and configuration
- [ ] Built-in plugins architecture

### Phase 3: Streaming Support

- [ ] HLS plugin with [`HLS.js`](https://github.com/video-dev/hls.js) integration
- [ ] DASH plugin with [`dash.js`](https://github.com/Dash-Industry-Forum/dash.js) integration
- [ ] Adaptive bitrate streaming support

### Phase 4: DRM Support

- [ ] Widevine DRM integration
- [ ] FairPlay DRM integration
- [ ] PlayReady DRM integration
- [ ] Multi-DRM unified API

## Tech Stack

- `PNPM` as the package manager; run `pnpm i` to install dependencies
- `NX` as the monorepo workspace; run `pnpm nx graph` to see a diagram of the dependencies of the projects
- `Typescript` as the language
- `Vite` as the build tool
