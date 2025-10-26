import { test, expect } from '@playwright/test';

/**
 * 测试套件1: 页面加载和基础渲染（超稳定版）
 *
 * 使用 data-testid 属性，更稳定的选择器
 */

test.describe('页面加载和基础渲染（超稳定版）', () => {
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

  test('页面标题正确', async ({ page }) => {
    await expect(page).toHaveTitle(/WSJF/);
  });

  test('核心按钮全部渲染（使用data-testid）', async ({ page }) => {
    // 使用新添加的 data-testid
    await expect(page.locator('[data-testid="add-requirement-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-batch-evaluate-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="add-sprint-pool-btn"]')).toBeVisible();
  });

  test('页面核心区域渲染正确', async ({ page }) => {
    await expect(page.locator('h1:has-text("WSJF-Lite Tools")')).toBeVisible();
    await expect(page.locator('h2:has-text("待排期区")')).toBeVisible();
    await expect(page.locator('[data-testid="add-sprint-pool-btn"]')).toBeVisible();
  });

  test('新增需求按钮可点击（使用data-testid）', async ({ page }) => {
    const addBtn = page.locator('[data-testid="add-requirement-btn"]');
    await expect(addBtn).toBeVisible();
    await expect(addBtn).toBeEnabled();
  });

  test('AI评估按钮可点击（使用data-testid）', async ({ page }) => {
    const aiBtn = page.locator('[data-testid="ai-batch-evaluate-btn"]');
    await expect(aiBtn).toBeVisible();
    await expect(aiBtn).toBeEnabled();
  });

  test('新增迭代池按钮可点击（使用data-testid）', async ({ page }) => {
    const sprintBtn = page.locator('[data-testid="add-sprint-pool-btn"]');
    await expect(sprintBtn).toBeVisible();
    await expect(sprintBtn).toBeEnabled();
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

    const loginButton = page.locator('button:has-text("进入应用")');
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.waitForTimeout(1000);
    }

    expect(errors).toHaveLength(0);
  });
});
