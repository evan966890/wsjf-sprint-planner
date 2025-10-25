import { test, expect } from '@playwright/test';

/**
 * 测试套件1: 页面加载和基础渲染
 *
 * 覆盖范围：
 * - 页面是否正常加载
 * - 核心元素是否存在
 * - 初始状态是否正确
 */

test.describe('页面加载和基础渲染', () => {
  test('页面标题正确', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/WSJF/);
  });

  test('页面核心区域渲染正确', async ({ page }) => {
    await page.goto('/');

    // 等待页面加载完成
    await page.waitForLoadState('networkidle');

    // 检查顶部区域
    await expect(page.locator('text=WSJF Sprint Planner')).toBeVisible();

    // 检查待排期区域
    await expect(page.locator('text=待排期')).toBeVisible();

    // 检查迭代池区域
    await expect(page.locator('text=迭代池')).toBeVisible();

    // 检查说明书按钮
    await expect(page.locator('button:has-text("WSJF-Lite 评分说明书")')).toBeVisible();
  });

  test('初始数据加载正确', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 检查是否有需求卡片
    const cards = page.locator('[class*="bg-white"][class*="rounded-lg"][class*="shadow"]').filter({
      has: page.locator('text=/权重分|业务影响度/')
    });

    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('控制按钮组正确渲染', async ({ page }) => {
    await page.goto('/');

    // 检查主要操作按钮
    await expect(page.locator('button:has-text("新建需求")')).toBeVisible();
    await expect(page.locator('button:has-text("新建迭代池")')).toBeVisible();
    await expect(page.locator('button:has-text("导出 JSON")')).toBeVisible();
    await expect(page.locator('button:has-text("导入")')).toBeVisible();
  });

  test('页面无控制台错误', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(errors).toHaveLength(0);
  });
});
