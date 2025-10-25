/**
 * 简单的冒烟测试 - 验证Playwright基本功能
 */

import { test, expect } from '@playwright/test';

test.describe('Simple Smoke Tests', () => {

  test('page loads successfully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // 检查页面标题
    await expect(page).toHaveTitle(/WSJF/);

    // 截图首页
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
    });
  });

  test('can find UI elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // 列出页面上所有按钮（debug用）
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} buttons on page`);

    for (let i = 0; i < Math.min(buttons.length, 5); i++) {
      const text = await buttons[i].textContent();
      const title = await buttons[i].getAttribute('title');
      console.log(`Button ${i}: text="${text?.trim()}", title="${title}"`);
    }

    // 至少应该有一些按钮
    expect(buttons.length).toBeGreaterThan(0);
  });
});
