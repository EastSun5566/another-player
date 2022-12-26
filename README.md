# Another Player

> just another player 🎬

## Design Goals

- Should be "Headless" so that can be fully customized & easily integrates with frameworks like `Tailwind` and `Windi`
- APIs similar to those in `Vue.js`, such as:

```ts
import { createPlayer } from "@another-player/core";

createPlayer({
  src: "https://big-buck-bunny.mp4",
}).mount("#player");
```

- Rich plugin system with APIs similar to those in [`Vite`](https://vitejs.dev/guide/api-plugin.html#plugin-api) and [`Rollup`](https://rollupjs.org/guide/en/#plugin-development)
- Support for mainstream streaming formats such as DSAH and HLS through the use of plugins
- Support for Multi-DRM
  - FairPlay as recently implemented in [`HLS.js`](https://github.com/video-dev/hls.js/pull/4930)

## Tech Stack

- `PNPM` as the package manager; run `pnpm i` to install dependencies
- `NX` as the monorepo workspace; run `nx graph` to see a diagram of the dependencies of the projects
- `Typescript` as the language
- `Vite` as the build tool
