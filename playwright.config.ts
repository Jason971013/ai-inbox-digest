import { defineConfig, devices } from '@playwright/test';

// Playwright 配置：统一进行 E2E 与可访问性检查
export default defineConfig({
  testDir: './tests',
  timeout: 120_000, // 单个测试超时：120s（增加稳定性）
  expect: { timeout: 30_000 }, // 增加断言超时
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 3 : 2, // CI环境重试3次，本地重试2次
  workers: process.env.CI ? 1 : undefined, // CI环境单线程，本地并行
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'test-results/junit/results.xml' }],
  ],
  use: {
    // 支持环境变量 BASE_URL 覆盖 baseURL
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 30_000, // 增加操作超时
    navigationTimeout: 45_000, // 增加导航超时
  },
  webServer: {
    command: 'npm run dev',
    // 本地开发时使用 localhost，Preview 环境使用环境变量
    url: process.env.BASE_URL || 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000, // 增加启动超时
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 7'] },
    },
  ],
  // 全局超时设置
  globalTimeout: process.env.CI ? 600_000 : 300_000, // CI环境10分钟，本地5分钟
});


