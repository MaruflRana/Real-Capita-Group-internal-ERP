import path from 'node:path';
import { defineConfig } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3100';
const workspaceRoot = path.resolve(__dirname, '../..');

export default defineConfig({
  testDir: '.',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: '../../playwright-report' }],
  ],
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command:
          'node -e "try { require(\'node:fs\').rmSync(\'apps/web/.next/lock\', { force: true }); } catch {}" && corepack pnpm build:web && node ./node_modules/next/dist/bin/next start ./apps/web --hostname 127.0.0.1 --port 3100',
        cwd: workspaceRoot,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        url: baseURL,
      },
});
