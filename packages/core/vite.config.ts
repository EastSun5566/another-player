/// <reference types="vitest/config" />

import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const entry = fileURLToPath(new URL('./src/index.ts', import.meta.url));
const sourceRoot = fileURLToPath(new URL('./src', import.meta.url));

export default defineConfig({
  build: {
    emptyOutDir: true,
    lib: {
      entry,
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: ['dashjs', 'hls.js'],
    },
  },
  plugins: [dts({
    entryRoot: sourceRoot,
    exclude: ['**/*.test.ts'],
  })],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
});
