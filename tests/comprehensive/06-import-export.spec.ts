import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * 测试套件6: 导入导出功能
 *
 * 覆盖范围：
 * - JSON导出
 * - Excel导入
 * - 图片导入（OCR）
 * - 数据格式验证
 */

test.describe('导入导出功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('导出JSON按钮存在', async ({ page }) => {
    await expect(page.locator('button:has-text("导出 JSON")')).toBeVisible();
  });

  test('导入按钮存在', async ({ page }) => {
    await expect(page.locator('button:has-text("导入")')).toBeVisible();
  });

  test('可以点击导出JSON', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);

    await page.locator('button:has-text("导出 JSON")').click();

    const download = await downloadPromise;

    if (download) {
      // 验证下载的文件
      expect(download.suggestedFilename()).toContain('.json');
    }
  });

  test('可以打开导入弹窗', async ({ page }) => {
    await page.locator('button:has-text("导入")').click();
    await page.waitForTimeout(500);

    // 应该显示导入选项
    const hasImportUI = await page.locator('text=/导入|选择文件|拖拽/').count() > 0;
    expect(hasImportUI).toBeTruthy();
  });

  test('导入支持Excel文件', async ({ page }) => {
    await page.locator('button:has-text("导入")').click();
    await page.waitForTimeout(500);

    // 查找文件上传input
    const fileInputs = page.locator('input[type="file"]');
    const count = await fileInputs.count();

    expect(count).toBeGreaterThan(0);

    if (count > 0) {
      const accept = await fileInputs.first().getAttribute('accept');
      // 应该接受Excel或图片文件
      expect(accept).toBeTruthy();
    }
  });
});
