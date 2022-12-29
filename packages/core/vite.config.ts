/* eslint-disable import/no-extraneous-dependencies */
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

import { name } from './package.json';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src'),
      name: name.slice(1).split('/')[0],
      fileName: name.slice(1).split('/')[1],
    },
  },
  plugins: [dts()],
});
