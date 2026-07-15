import js from '@eslint/js';
import wc from 'eslint-plugin-wc';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/coverage/**', '**/node_modules/**'],
  },
  {
    ...js.configs.recommended,
    files: ['**/*.{js,mjs}'],
  },
  ...tseslint.configs.recommended,
  {
    files: ['packages/core/src/**/*.ts'],
    plugins: { wc },
    rules: wc.configs.recommended.rules,
  },
);
