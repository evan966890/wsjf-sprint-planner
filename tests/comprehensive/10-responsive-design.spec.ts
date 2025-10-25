import { test, expect } from '@playwright/test';

/**
 * 测试套件10: 响应式设计
 *
 * 覆盖范围：
 * - 桌面端布局
 * - 不同分辨率下的显示
 * - 元素适配
 */

test.describe('响应式设计', () => {
  test('桌面端全高清分辨率正常显示', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 检查关键元素是否可见
    await expect(page.locator('text=WSJF Sprint Planner')).toBeVisible();
    await expect(page.locator('text=待排期')).toBeVisible();

    // 截图
    await page.screenshot({ path: 'test-results/desktop-1920x1080.png', fullPage: true });
  });

  test('桌面端标准分辨率正常显示', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=WSJF Sprint Planner')).toBeVisible();

    // 截图
    await page.screenshot({ path: 'test-results/desktop-1366x768.png', fullPage: true });
  });

  test('超宽屏幕正常显示', async ({ page }) => {
    await page.setViewportSize({ width: 2560, height: 1440 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=WSJF Sprint Planner')).toBeVisible();

    // 截图
    await page.screenshot({ path: 'test-results/desktop-2560x1440.png', fullPage: true });
  });

  test('所有关键元素在不同分辨率下都可见', async ({ page }) => {
    const resolutions = [
      { width: 1920, height: 1080 },
      { width: 1366, height: 768 },
      { width: 1440, height: 900 },
    ];

    for (const resolution of resolutions) {
      await page.setViewportSize(resolution);
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // 检查关键元素
      await expect(page.locator('button:has-text("新建需求")')).toBeVisible();
      await expect(page.locator('button:has-text("新建迭代池")')).toBeVisible();
      await expect(page.locator('button:has-text("WSJF-Lite 评分说明书")')).toBeVisible();
    }
  });
});
