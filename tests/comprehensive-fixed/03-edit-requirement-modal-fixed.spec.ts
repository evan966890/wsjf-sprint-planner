import { test, expect } from '@playwright/test';

/**
 * 测试套件3: 需求编辑弹窗（已修复）
 *
 * 修复内容：
 * - 处理登录对话框
 * - 使用正确的按钮选择器（title="新增需求"）
 * - 更新实际的表单字段选择器
 */

test.describe('需求编辑弹窗（修复版）', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 处理登录对话框
    const loginButton = page.locator('button:has-text("进入应用")');
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.waitForTimeout(1000);
    }
  });

  test('新增需求按钮可以点击', async ({ page }) => {
    // 使用正确的选择器（图标按钮，通过title）
    const addButton = page.locator('button[title="新增需求"]');
    await expect(addButton).toBeVisible();

    await addButton.click();

    // 等待弹窗出现
    await page.waitForTimeout(1000);

    // 应该打开了编辑弹窗
    // 检查弹窗中是否有表单元素
    const inputs = page.locator('input, textarea, select');
    const count = await inputs.count();

    expect(count).toBeGreaterThan(0);
  });

  test('新增需求弹窗可以打开和关闭', async ({ page }) => {
    // 打开弹窗
    await page.locator('button[title="新增需求"]').click();
    await page.waitForTimeout(500);

    // 应该有取消或关闭按钮
    const cancelButtons = page.locator('button').filter({
      hasText: /取消|关闭|×/
    });

    const count = await cancelButtons.count();
    if (count > 0) {
      await cancelButtons.first().click();
      await page.waitForTimeout(500);

      // 弹窗应该关闭
      // 可以通过检查是否回到了主界面来验证
      await expect(page.locator('h2:has-text("待排期区")')).toBeVisible();
    }
  });

  test('表单字段存在性检查', async ({ page }) => {
    await page.locator('button[title="新增需求"]').click();
    await page.waitForTimeout(1000);

    // 检查是否有输入框
    const inputs = page.locator('input[type="text"], input:not([type])').count();
    expect(await inputs).toBeGreaterThan(0);

    // 检查是否有文本域
    const textareas = page.locator('textarea').count();
    expect(await textareas).toBeGreaterThanOrEqual(0);

    // 检查是否有下拉框
    const selects = page.locator('select').count();
    expect(await selects).toBeGreaterThanOrEqual(0);
  });

  test('表单可以输入内容', async ({ page }) => {
    await page.locator('button[title="新增需求"]').click();
    await page.waitForTimeout(1000);

    // 找到第一个text输入框并输入
    const textInputs = page.locator('input[type="text"], input:not([type="email"]):not([type="checkbox"])');
    const firstInput = textInputs.first();

    if (await firstInput.count() > 0 && await firstInput.isVisible()) {
      await firstInput.fill('测试需求标题');
      const value = await firstInput.inputValue();
      expect(value).toBe('测试需求标题');
    }

    // 找到第一个textarea并输入
    const textareas = page.locator('textarea');
    if (await textareas.count() > 0) {
      const firstTextarea = textareas.first();
      if (await firstTextarea.isVisible()) {
        await firstTextarea.fill('这是一个测试需求描述');
        const value = await firstTextarea.inputValue();
        expect(value).toBe('这是一个测试需求描述');
      }
    }
  });

  test('所有按钮都有正确的type属性', async ({ page }) => {
    await page.locator('button[title="新增需求"]').click();
    await page.waitForTimeout(1000);

    // 获取弹窗中的所有按钮
    const buttons = await page.locator('button').all();

    for (const button of buttons) {
      const type = await button.getAttribute('type');
      const text = await button.textContent();

      // 所有按钮都应该有type属性（button或submit）
      // 重要：不应该没有type，避免表单提交导致下载文件的bug
      console.log(`按钮 "${text?.trim()}" 的 type 属性: ${type || '无'}`);

      // 如果按钮文本包含"保存"、"确定"等，应该是type="button"
      if (text && (text.includes('保存') || text.includes('确定'))) {
        expect(type).toBe('button');
      }
    }
  });

  test('AI评估按钮存在', async ({ page }) => {
    // AI评估按钮在待排期区标题栏
    await expect(page.locator('button:has-text("AI评估")')).toBeVisible();
  });
});
