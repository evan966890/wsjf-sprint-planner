import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright配置 - 可视化调试版本
 *
 * 特点：
 * - 所有测试都录制视频
 * - 慢速执行，便于观察
 * - 始终显示浏览器
 */
export default defineConfig({
  testDir: './tests',
  timeout: 60 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,

  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],

  use: {
    baseURL: 'http://localhost:3004',

    // 🎥 始终录制视频
    video: 'on',

    // 📸 始终截图
    screenshot: 'on',

    // 🐌 慢速执行，每步延迟500ms
    launchOptions: {
      slowMo: 500,
    },

    viewport: { width: 1920, height: 1080 },
    trace: 'on',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // 🌐 始终显示浏览器
        headless: false,
      },
    },
  ],

  webServer: {
    command: 'npm run dev',
    port: 3004,
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});
