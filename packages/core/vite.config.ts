import { resolve } from 'node:path';
import { defineConfig } from 'vite';

import { name } from './package.json';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src'),
      name: name.slice(1).split('/')[0],
      fileName: name.slice(1).split('/')[1],
    },
  },
})
