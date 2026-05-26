const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60000,
  expect: { timeout: 15000 },
  use: {
    channel: 'msedge',
    headless: true,
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    {
      name: 'edge',
      use: { channel: 'msedge' },
    },
  ],
});
