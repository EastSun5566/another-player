module.exports = {
  "stories": ["../stories/**/*.stories.mdx", "../stories/**/*.stories.@(js|jsx|ts|tsx)"],
  "addons": ["@storybook/addon-links", "@storybook/addon-essentials"],
  "framework": {
    name: "@storybook/web-components-webpack5",
    options: {}
  },
  docs: {
    autodocs: true
  }
};