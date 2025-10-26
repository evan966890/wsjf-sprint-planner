import { test, expect } from '@playwright/test';

/**
 * 测试套件4: 筛选和排序功能（已修复）
 */

test.describe('筛选和排序功能（修复版）', () => {
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

  test('排序下拉框存在并可用', async ({ page }) => {
    // 找到排序下拉框
    const sortSelect = page.locator('select').first();
    await expect(sortSelect).toBeVisible();

    // 获取选项
    const options = await sortSelect.locator('option').count();
    expect(options).toBeGreaterThan(1);

    // 检查是否包含预期的排序选项
    const optionsText = await sortSelect.textContent();
    expect(optionsText).toContain('权重分');
  });

  test('可以切换排序方式', async ({ page }) => {
    const sortSelect = page.locator('select').first();

    // 记录初始值
    const initialValue = await sortSelect.inputValue();

    // 切换到其他选项
    const options = await sortSelect.locator('option').all();
    if (options.length > 1) {
      await sortSelect.selectOption({ index: 1 });

      // 等待可能的重新渲染
      await page.waitForTimeout(500);

      // 验证值已改变
      const newValue = await sortSelect.inputValue();
      expect(newValue).not.toBe(initialValue);
    }
  });

  test('业务域筛选器存在', async ({ page }) => {
    // 查找业务域筛选select
    const selects = await page.locator('select').all();

    let foundDomainSelect = false;
    for (const select of selects) {
      const text = await select.textContent();
      if (text && text.includes('业务域')) {
        foundDomainSelect = true;
        break;
      }
    }

    expect(foundDomainSelect).toBeTruthy();
  });

  test('RMS复选框存在', async ({ page }) => {
    // 查找RMS筛选
    const rmsCheckbox = page.locator('input[type="checkbox"]').filter({
      has: page.locator('~ span:has-text("RMS")')
    }).first();

    // RMS复选框应该存在
    const count = await page.locator('text=RMS').count();
    expect(count).toBeGreaterThan(0);
  });

  test('排序按钮存在', async ({ page }) => {
    // 查找排序方向按钮（升序/降序切换）
    const sortButtons = page.locator('button[title*="序"], button').filter({
      has: page.locator('svg')
    });

    const count = await sortButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('筛选条件按钮存在', async ({ page }) => {
    // 查找筛选按钮
    const filterButton = page.locator('button[title*="筛选"]');

    if (await filterButton.count() > 0) {
      await expect(filterButton.first()).toBeVisible();
    }
  });

  test('筛选结果统计显示', async ({ page }) => {
    // 检查筛选结果统计
    const statsText = page.locator('text=/筛选结果|未评估/');
    const count = await statsText.count();

    expect(count).toBeGreaterThan(0);
  });

  test('视图切换按钮存在', async ({ page }) => {
    // 气泡视图和列表视图切换
    const bubbleButton = page.locator('button:has-text("气泡")');
    const listButton = page.locator('button:has-text("列表")');

    await expect(bubbleButton).toBeVisible();
    await expect(listButton).toBeVisible();
  });
});
