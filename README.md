# Another Player

> just another player 🎬

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

const myPlugin definePlugin(options);

const player = createPlayer({
  src: "https://big-buck-bunny.mp4",
}).use([
  myPlugin(),
]).mount("#player");
```

- Support for mainstream streaming formats such as DSAH and HLS through the use of plugins
- Support for Multi-DRM
  - FairPlay as recently implemented in [`HLS.js`](https://github.com/video-dev/hls.js/pull/4930)

## Tech Stack

- `PNPM` as the package manager; run `pnpm i` to install dependencies
- `NX` as the monorepo workspace; run `pnpm nx graph` to see a diagram of the dependencies of the projects
- `Typescript` as the language
- `Vite` as the build tool
