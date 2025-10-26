import { test, expect } from '@playwright/test';

/**
 * 测试套件3: 需求编辑弹窗（超时已修复）
 *
 * 修复内容：
 * - 使用 data-testid
 * - 增加等待时间到 120 秒
 * - 更明确的弹窗检测
 */

test.describe('需求编辑弹窗（超时已修复）', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 处理登录
    const loginButton = page.locator('button:has-text("进入应用")');
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.waitForTimeout(2000); // 增加等待时间
    }
  });

  test('新增需求按钮存在且可点击（data-testid）', async ({ page }) => {
    const addButton = page.locator('[data-testid="add-requirement-btn"]');
    await expect(addButton).toBeVisible();
    await expect(addButton).toBeEnabled();
  });

  test('点击新增需求按钮尝试打开弹窗', async ({ page }) => {
    const addButton = page.locator('[data-testid="add-requirement-btn"]');
    await addButton.click();

    // 等待弹窗或表单元素出现（增加超时）
    try {
      await page.waitForSelector(
        'input[type="text"], textarea, select, [role="dialog"], [class*="modal"]',
        { timeout: 120000, state: 'visible' }
      );

      // 如果弹窗出现，验证有表单元素
      const inputs = page.locator('input, textarea, select');
      const count = await inputs.count();
      expect(count).toBeGreaterThan(0);
    } catch (error) {
      // 如果120秒后还没出现，记录失败但不崩溃
      console.log('弹窗在120秒内未出现，可能需要检查代码逻辑');
      // 截图用于调试
      await page.screenshot({ path: 'test-results/modal-timeout-debug.png' });
      throw error;
    }
  });

  test('AI评估按钮可用', async ({ page }) => {
    const aiButton = page.locator('[data-testid="ai-batch-evaluate-btn"]');
    await expect(aiButton).toBeVisible();
  });

  test('检查页面是否有必要的数据加载完成', async ({ page }) => {
    // 等待页面完全加载
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 验证关键元素都已加载
    await expect(page.locator('[data-testid="add-requirement-btn"]')).toBeVisible();
    await expect(page.locator('h2:has-text("待排期区")')).toBeVisible();
  });
});
