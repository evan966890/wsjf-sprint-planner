import { test, expect } from '@playwright/test';

/**
 * 测试套件7: WSJF说明书弹窗
 *
 * 覆盖范围：
 * - 说明书打开
 * - 说明书内容完整性
 * - 说明书关闭
 */

test.describe('WSJF说明书弹窗', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('说明书按钮存在', async ({ page }) => {
    await expect(page.locator('button:has-text("WSJF-Lite 评分说明书")')).toBeVisible();
  });

  test('可以打开说明书', async ({ page }) => {
    await page.locator('button:has-text("WSJF-Lite 评分说明书")').click();

    // 应该显示说明书内容
    await expect(page.locator('text=WSJF-Lite')).toBeVisible({ timeout: 3000 });
  });

  test('说明书包含关键内容', async ({ page }) => {
    await page.locator('button:has-text("WSJF-Lite 评分说明书")').click();
    await page.waitForTimeout(500);

    // 检查是否包含关键维度说明
    const content = await page.textContent('body');

    expect(content).toContain('业务影响度');
    expect(content).toContain('时间窗口');
    expect(content).toContain('工作量');
  });

  test('可以关闭说明书', async ({ page }) => {
    await page.locator('button:has-text("WSJF-Lite 评分说明书")').click();
    await page.waitForTimeout(500);

    // 查找关闭按钮
    const closeButton = page.locator('button:has-text("关闭"), button:has-text("×"), button[aria-label="Close"]').first();
    await closeButton.click();

    // 说明书应该关闭
    await page.waitForTimeout(500);
    const modalVisible = await page.locator('text=WSJF-Lite 评分说明书').nth(1).isVisible().catch(() => false);
    expect(modalVisible).toBeFalsy();
  });

  test('说明书样式正确', async ({ page }) => {
    await page.locator('button:has-text("WSJF-Lite 评分说明书")').click();
    await page.waitForTimeout(500);

    // 截图验证样式
    await page.screenshot({ path: 'test-results/handbook-modal-style.png' });

    // 检查是否有表格或列表结构
    const hasTables = await page.locator('table, ul, ol').count() > 0;
    expect(hasTables).toBeTruthy();
  });
});
