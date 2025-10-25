import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright配置 - 视觉回归测试
 *
 * 用途：
 * - 自动化UI测试
 * - 视觉对比（重构前后）
 * - AI可以自动运行和读取结果
 */
export default defineConfig({
  testDir: './tests',

  // 超时设置
  timeout: 60 * 1000,
  expect: {
    timeout: 5000,
  },

  // 不并行运行
  fullyParallel: false,

  // CI环境禁止 only
  forbidOnly: !!process.env.CI,

  // 失败不重试（重构测试应该一次性通过）
  retries: 0,

  // 单线程运行
  workers: 1,

  // 测试报告
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],

  // 浏览器配置
  use: {
    // 基础URL
    baseURL: 'http://localhost:3002',

    // 失败时截图
    screenshot: 'only-on-failure',

    // 失败时录像
    video: 'retain-on-failure',

    // 浏览器视窗大小
    viewport: { width: 1920, height: 1080 },

    // 截图设置
    trace: 'on-first-retry',
  },

  // 项目配置
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // 开发服务器
  webServer: {
    command: 'npm run dev',
    port: 3002,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
