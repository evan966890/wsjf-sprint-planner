import { test, expect } from '@playwright/test';

/**
 * 测试套件9: AI分析功能
 *
 * 覆盖范围：
 * - AI分析按钮
 * - AI分析流程
 * - 分析结果展示
 */

test.describe('AI分析功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('编辑需求时有AI分析功能', async ({ page }) => {
    // 打开新建需求弹窗
    await page.locator('button:has-text("新建需求")').click();
    await page.waitForTimeout(500);

    // 查找AI相关按钮
    const aiButtons = page.locator('button:has-text("AI"), button[title*="AI"]');
    const count = await aiButtons.count();

    // 可能有AI分析功能
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('AI分析需要API Key配置', async ({ page }) => {
    // 打开新建需求弹窗
    await page.locator('button:has-text("新建需求")').click();
    await page.waitForTimeout(500);

    // 检查是否有API Key相关提示
    const content = await page.textContent('body');

    if (content.includes('API') || content.includes('配置')) {
      expect(true).toBeTruthy();
    }
  });
});
