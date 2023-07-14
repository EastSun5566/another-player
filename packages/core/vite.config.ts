/* eslint-disable import/no-extraneous-dependencies */
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

import { name } from './package.json';

const entry = resolve(__dirname, 'src');
const names = name.slice(1).split('/');

export default defineConfig({
  build: {
    lib: {
      entry,
      name: names[0],
      fileName: names[1],
    },
  },
  plugins: [dts({
    entryRoot: entry,
  })],
});
