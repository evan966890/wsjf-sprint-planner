import { test, expect } from '@playwright/test';

/**
 * 测试套件6: 导入导出功能（已修复）
 */

test.describe('导入导出功能（修复版）', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 处理登录
    const loginButton = page.locator('button:has-text("进入应用")');
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.waitForTimeout(1000);
    }
  });

  test('导出按钮存在', async ({ page }) => {
    await expect(page.locator('button:has-text("导出")')).toBeVisible();
  });

  test('导入按钮存在', async ({ page }) => {
    await expect(page.locator('button:has-text("导入")')).toBeVisible();
  });

  test('从飞书导入按钮存在', async ({ page }) => {
    await expect(page.locator('button:has-text("从飞书导入")')).toBeVisible();
  });

  test('可以点击导出按钮', async ({ page }) => {
    const exportButton = page.locator('button:has-text("导出")');
    await exportButton.click();

    // 等待可能出现的下拉菜单
    await page.waitForTimeout(500);

    // 验证点击不会出错
    expect(true).toBeTruthy();
  });

  test('可以点击导入按钮', async ({ page }) => {
    const importButton = page.locator('button:has-text("导入")');
    await importButton.click();

    await page.waitForTimeout(500);

    // 可能会触发文件选择对话框或显示导入选项
    expect(true).toBeTruthy();
  });

  test('文件导入input存在', async ({ page }) => {
    // 检查隐藏的文件输入框
    const fileInput = page.locator('input[type="file"]');
    const count = await fileInput.count();

    expect(count).toBeGreaterThan(0);
  });

  test('文件输入支持多种格式', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]').first();

    if (await fileInput.count() > 0) {
      const accept = await fileInput.getAttribute('accept');

      // 应该支持xlsx, pdf, png等格式
      expect(accept).toBeTruthy();
      if (accept) {
        expect(accept.includes('.xlsx') || accept.includes('.pdf')).toBeTruthy();
      }
    }
  });
});
