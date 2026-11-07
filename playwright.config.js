import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir: './tests', testMatch: '*.spec.js', timeout: 120000, workers: 1, reporter: 'list',
  use: { baseURL: process.env.PLAYGROUND_URL || 'http://127.0.0.1:4199', viewport: { width: 1100, height: 1100 }, screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: process.env.PLAYGROUND_URL ? undefined : { command: 'npm run preview', url: 'http://127.0.0.1:4199', reuseExistingServer: !process.env.CI },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }, { name: 'webkit', use: { browserName: 'webkit' } }] });
