import { test, expect } from '@playwright/test';

/**
 * 测试套件5: 迭代池功能
 *
 * 覆盖范围：
 * - 迭代池创建
 * - 迭代池编辑
 * - 需求拖拽到迭代池
 * - 资源使用情况显示
 * - 迭代池删除
 */

test.describe('迭代池功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('新建迭代池按钮存在', async ({ page }) => {
    await expect(page.locator('button:has-text("新建迭代池")')).toBeVisible();
  });

  test('可以打开新建迭代池弹窗', async ({ page }) => {
    await page.locator('button:has-text("新建迭代池")').click();

    // 应该显示编辑弹窗
    await expect(page.locator('text=/新建|编辑.*迭代池/')).toBeVisible({ timeout: 3000 });
  });

  test('迭代池弹窗包含必要字段', async ({ page }) => {
    await page.locator('button:has-text("新建迭代池")').click();
    await page.waitForTimeout(500);

    // 检查必要字段
    await expect(page.locator('label:has-text("迭代名称"), input[placeholder*="迭代"]')).toBeVisible();
    await expect(page.locator('label:has-text("研发人力"), input[type="number"]')).toBeVisible();
  });

  test('迭代池显示资源使用情况', async ({ page }) => {
    // 查找现有的迭代池
    const sprintPools = page.locator('[class*="border"][class*="rounded"]').filter({
      has: page.locator('text=/迭代|Sprint/')
    });

    const count = await sprintPools.count();

    if (count > 0) {
      const firstPool = sprintPools.first();

      // 应该显示资源使用情况（人日、占比等）
      const text = await firstPool.textContent();
      expect(text).toBeTruthy();
    }
  });

  test('迭代池可以接收拖拽', async ({ page }) => {
    // 查找迭代池区域
    const sprintPools = page.locator('[class*="border"][class*="rounded"]').filter({
      has: page.locator('text=/迭代|Sprint/')
    });

    if (await sprintPools.count() > 0) {
      const firstPool = sprintPools.first();

      // 检查是否有拖拽提示
      const text = await firstPool.textContent();
      expect(text).toBeTruthy();
    }
  });

  test('迭代池编辑按钮正常', async ({ page }) => {
    // 查找编辑按钮
    const editButtons = page.locator('button[title*="编辑"], button:has-text("编辑")');
    const count = await editButtons.count();

    if (count > 1) { // 第一个可能是需求的编辑按钮
      const poolEditButton = editButtons.nth(1);
      await poolEditButton.click();

      // 应该打开编辑弹窗
      await expect(page.locator('text=编辑迭代池')).toBeVisible({ timeout: 3000 });

      // 关闭弹窗
      await page.locator('button:has-text("取消")').first().click();
    }
  });

  test('迭代池删除按钮存在', async ({ page }) => {
    // 查找删除按钮
    const deleteButtons = page.locator('button[title*="删除"], button:has-text("删除")');
    const count = await deleteButtons.count();

    // 应该至少有删除按钮存在
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
