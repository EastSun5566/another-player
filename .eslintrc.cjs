// @ts-check
// eslint-disable-next-line import/no-extraneous-dependencies, @typescript-eslint/no-var-requires
const { defineConfig } = require('eslint-define-config');

module.exports = defineConfig({
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'airbnb-base',
    'airbnb-typescript/base',
    'plugin:@typescript-eslint/recommended',
    'plugin:wc/recommended',
  ],
  overrides: [
    {
      // Disable import/no-unresolved for playground stories (pnpm workspace packages)
      files: ['apps/playground/**/*.js', 'apps/playground/**/*.ts'],
      rules: {
        'import/no-unresolved': 'off',
      },
    },
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
  },
  rules: {},
});
