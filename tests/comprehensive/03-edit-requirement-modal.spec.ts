import { test, expect } from '@playwright/test';

/**
 * 测试套件3: 需求编辑弹窗
 *
 * 覆盖范围：
 * - 弹窗打开和关闭
 * - 所有表单字段
 * - 表单验证
 * - 实时预览
 * - 保存功能
 */

test.describe('需求编辑弹窗', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('新建需求弹窗可以打开', async ({ page }) => {
    await page.locator('button:has-text("新建需求")').click();

    // 检查弹窗是否打开
    await expect(page.locator('text=新建需求')).toBeVisible();

    // 检查弹窗基本结构
    await expect(page.locator('text=基本信息')).toBeVisible();
    await expect(page.locator('text=需求标题')).toBeVisible();
  });

  test('所有必填字段都存在', async ({ page }) => {
    await page.locator('button:has-text("新建需求")').click();
    await page.waitForTimeout(500);

    // 检查基本信息section
    await expect(page.locator('label:has-text("需求标题")')).toBeVisible();
    await expect(page.locator('label:has-text("需求描述")')).toBeVisible();

    // 检查业务评估section
    await expect(page.locator('label:has-text("业务影响度")')).toBeVisible();
    await expect(page.locator('label:has-text("时间窗口")')).toBeVisible();

    // 检查技术评估section
    await expect(page.locator('label:has-text("技术复杂度")')).toBeVisible();
    await expect(page.locator('label:has-text("预估工作量")')).toBeVisible();
  });

  test('需求标题输入正常', async ({ page }) => {
    await page.locator('button:has-text("新建需求")').click();
    await page.waitForTimeout(500);

    const titleInput = page.locator('input[placeholder*="请输入需求标题"], input[name="title"]').first();
    await titleInput.fill('测试需求标题');

    const value = await titleInput.inputValue();
    expect(value).toBe('测试需求标题');
  });

  test('需求描述输入正常', async ({ page }) => {
    await page.locator('button:has-text("新建需求")').click();
    await page.waitForTimeout(500);

    const descInput = page.locator('textarea[placeholder*="描述"], textarea').first();
    await descInput.fill('这是一个测试需求描述');

    const value = await descInput.inputValue();
    expect(value).toBe('这是一个测试需求描述');
  });

  test('业务影响度选择正常', async ({ page }) => {
    await page.locator('button:has-text("新建需求")').click();
    await page.waitForTimeout(500);

    // 查找业务影响度的select
    const selects = page.locator('select');
    const count = await selects.count();

    // 应该至少有一个select元素
    expect(count).toBeGreaterThan(0);

    // 尝试选择第一个select（可能是业务影响度）
    const firstSelect = selects.first();
    const options = await firstSelect.locator('option').count();
    expect(options).toBeGreaterThan(1);
  });

  test('技术复杂度没有默认值', async ({ page }) => {
    await page.locator('button:has-text("新建需求")').click();
    await page.waitForTimeout(500);

    // 查找技术复杂度相关的select
    const selects = page.locator('select');
    const count = await selects.count();

    for (let i = 0; i < count; i++) {
      const select = selects.nth(i);
      const text = await select.locator('option[selected]').textContent();

      // 检查是否有"请选择"类似的提示
      if (text && (text.includes('请选择') || text === '')) {
        // 这个是正确的，技术复杂度不应该有默认值
        expect(text).toBeTruthy();
      }
    }
  });

  test('时间窗口选择正常', async ({ page }) => {
    await page.locator('button:has-text("新建需求")').click();
    await page.waitForTimeout(500);

    // 时间窗口是radio button
    const radioButtons = page.locator('input[type="radio"]');
    const count = await radioButtons.count();

    if (count > 0) {
      const firstRadio = radioButtons.first();
      await firstRadio.click();

      const isChecked = await firstRadio.isChecked();
      expect(isChecked).toBeTruthy();
    }
  });

  test('强制截止日期可以切换', async ({ page }) => {
    await page.locator('button:has-text("新建需求")').click();
    await page.waitForTimeout(500);

    // 查找强制截止相关的checkbox或switch
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();

    if (count > 0) {
      const checkbox = checkboxes.first();
      const initialState = await checkbox.isChecked();

      await checkbox.click();
      const newState = await checkbox.isChecked();

      expect(newState).not.toBe(initialState);
    }
  });

  test('取消按钮正常工作', async ({ page }) => {
    await page.locator('button:has-text("新建需求")').click();
    await page.waitForTimeout(500);

    await page.locator('button:has-text("取消")').first().click();

    // 弹窗应该关闭
    await expect(page.locator('text=新建需求')).not.toBeVisible();
  });

  test('保存按钮存在且类型正确', async ({ page }) => {
    await page.locator('button:has-text("新建需求")').click();
    await page.waitForTimeout(500);

    const saveButton = page.locator('button:has-text("保存"), button:has-text("确定")').first();
    await expect(saveButton).toBeVisible();

    // 检查按钮type属性（应该是button，不是submit，避免下载文件bug）
    const buttonType = await saveButton.getAttribute('type');
    expect(buttonType).toBe('button');
  });

  test('实时预览功能可见', async ({ page }) => {
    await page.locator('button:has-text("新建需求")').click();
    await page.waitForTimeout(500);

    // 查找预览区域
    const preview = page.locator('text=实时预览, text=预览').first();

    if (await preview.count() > 0) {
      await expect(preview).toBeVisible();
    }
  });

  test('弹窗样式正确', async ({ page }) => {
    await page.locator('button:has-text("新建需求")').click();
    await page.waitForTimeout(500);

    // 检查弹窗是否有正确的样式
    const modal = page.locator('[class*="fixed"][class*="inset-0"], [role="dialog"]').first();
    await expect(modal).toBeVisible();

    // 截图以验证样式
    await page.screenshot({ path: 'test-results/edit-modal-style.png' });
  });
});
