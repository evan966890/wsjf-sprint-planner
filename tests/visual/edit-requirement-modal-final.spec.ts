/**
 * EditRequirementModal 视觉测试 - 处理登录流程
 */

import { test, expect } from '@playwright/test';

test.describe('EditRequirementModal Visual Tests', () => {

  // 登录helper
  async function login(page) {
    // 等待登录弹窗出现
    const loginModal = page.locator('text=登录');
    if (await loginModal.isVisible()) {
      // 填写用户信息
      await page.fill('input[placeholder*="姓名"]', 'Test User');
      await page.fill('input[type="email"]', 'test@test.com');

      // 点击登录
      await page.click('button:has-text("登录")');
      await page.waitForTimeout(1000);
    }
  }

  /**
   * 测试1: 首页完整截图
   */
  test('homepage after login', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    await login(page);

    await expect(page).toHaveScreenshot('dashboard.png', {
      fullPage: true,
    });
  });

  /**
   * 测试2: 打开新建需求弹窗
   */
  test('open new requirement modal', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    await login(page);

    // 找到"新增需求"按钮（title="新增需求"）
    const addButton = page.locator('button[title="新增需求"]');
    await addButton.click();
    await page.waitForTimeout(1000);

    // 截图整个页面（包含弹窗）
    await expect(page).toHaveScreenshot('new-requirement-modal.png', {
      fullPage: true,
    });
  });

  /**
   * 测试3: 检查标题栏颜色（蓝色渐变）
   */
  test('check header gradient color', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    await login(page);

    const addButton = page.locator('button[title="新增需求"]');
    await addButton.click();
    await page.waitForTimeout(1000);

    // 检查蓝色渐变标题栏是否存在
    const gradientHeader = page.locator('.bg-gradient-to-r.from-blue-600.to-blue-700');

    // 方法1: 检查元素是否可见
    const isVisible = await gradientHeader.count() > 0;

    if (!isVisible) {
      console.error('❌ Blue gradient header NOT FOUND!');
      console.error('Expected: bg-gradient-to-r from-blue-600 to-blue-700');

      // 找找实际的标题栏是什么
      const actualHeaders = await page.locator('h2, h3').all();
      for (const header of actualHeaders) {
        const text = await header.textContent();
        const className = await header.evaluate(el => el.parentElement?.className);
        console.log(`Header: "${text}" - Parent class: "${className}"`);
      }
    }

    expect(isVisible).toBe(true);
  });

  /**
   * 测试4: 检查section颜色
   */
  test('check section colors', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    await login(page);

    const addButton = page.locator('button[title="新增需求"]');
    await addButton.click();
    await page.waitForTimeout(1000);

    const results = {
      blueSection: await page.locator('.bg-blue-50').count() > 0,
      purpleGradient: await page.locator('.bg-gradient-to-br.from-purple-50.to-indigo-50').count() > 0,
      greenSection: await page.locator('.bg-green-50').count() > 0,
    };

    console.log('Section colors check:', JSON.stringify(results, null, 2));

    // 至少应该有蓝色section（业务影响度）
    expect(results.blueSection).toBe(true);
  });

  /**
   * 测试5: 检查所有按钮是否有type属性
   */
  test('check button type attributes in modal', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    await login(page);

    const addButton = page.locator('button[title="新增需求"]');
    await addButton.click();
    await page.waitForTimeout(1000);

    // 获取弹窗内的所有按钮
    const modal = page.locator('.fixed.inset-0').last(); // 最后一个fixed元素（弹窗）
    const buttons = modal.locator('button');
    const count = await buttons.count();

    console.log(`Found ${count} buttons in modal`);

    let missingType = 0;

    for (let i = 0; i < count; i++) {
      const type = await buttons.nth(i).getAttribute('type');
      if (!type || type !== 'button') {
        const text = await buttons.nth(i).textContent();
        console.warn(`❌ Button ${i} missing type: "${text?.trim()}"`);
        missingType++;
      }
    }

    console.log(`Buttons missing type="button": ${missingType}/${count}`);

    expect(missingType).toBe(0);
  });

  /**
   * 测试6: 不应该触发下载
   */
  test('should not trigger download', async ({ page }) => {
    let downloadTriggered = false;

    page.on('download', (download) => {
      downloadTriggered = true;
      console.error('❌ Download triggered:', download.suggestedFilename());
    });

    await page.goto('/');
    await page.waitForTimeout(2000);

    await login(page);

    // 点击"新增需求"
    const addButton = page.locator('button[title="新增需求"]');
    await addButton.click();
    await page.waitForTimeout(1000);

    expect(downloadTriggered).toBe(false);
  });
});
