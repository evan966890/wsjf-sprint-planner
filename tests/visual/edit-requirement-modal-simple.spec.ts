/**
 * EditRequirementModal 简化测试
 * 专注于核心功能验证
 */

import { test, expect } from '@playwright/test';

test.describe('EditRequirementModal - Simple Tests', () => {

  /**
   * 测试1: 首页截图baseline
   */
  test('homepage baseline', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    await expect(page).toHaveScreenshot('homepage-full.png', {
      fullPage: true,
    });
  });

  /**
   * 测试2: 检测页面上的Plus按钮（新建需求）
   */
  test('find add requirement button', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // 查找所有Plus图标的按钮
    const plusButtons = await page.locator('button svg').evaluateAll((svgs) => {
      return svgs
        .map((svg, idx) => ({
          index: idx,
          parent: svg.parentElement?.textContent || '',
          title: svg.parentElement?.getAttribute('title') || '',
        }))
        .filter(btn => btn.title || btn.parent);
    });

    console.log('Buttons with icons:', JSON.stringify(plusButtons, null, 2));

    // 尝试点击侧边栏的第一个Plus按钮
    const addButtons = page.locator('button').filter({ hasText: '' });
    const count = await addButtons.count();
    console.log(`Found ${count} buttons with Plus icon`);

    if (count > 0) {
      // 截图before点击
      await expect(page).toHaveScreenshot('before-click-add.png', { fullPage: true });

      // 点击第一个Plus按钮
      await addButtons.first().click();
      await page.waitForTimeout(1000);

      // 截图after点击
      await expect(page).toHaveScreenshot('after-click-add.png', { fullPage: true });
    }
  });

  /**
   * 测试3: 不应该触发下载
   */
  test('should not trigger download on any button click', async ({ page }) => {
    let downloadTriggered = false;
    let downloadFile = '';

    page.on('download', async (download) => {
      downloadTriggered = true;
      downloadFile = download.suggestedFilename();
    });

    await page.goto('/');
    await page.waitForTimeout(2000);

    // 点击前5个按钮
    const buttons = page.locator('button');
    const count = Math.min(await buttons.count(), 5);

    for (let i = 0; i < count; i++) {
      const buttonText = await buttons.nth(i).textContent();
      console.log(`Clicking button ${i}: ${buttonText?.trim()}`);

      await buttons.nth(i).click();
      await page.waitForTimeout(500);

      if (downloadTriggered) {
        console.error(`❌ Download triggered by button ${i}: ${buttonText} → ${downloadFile}`);
        break;
      }
    }

    expect(downloadTriggered).toBe(false);
  });
});
