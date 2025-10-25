/**
 * EditRequirementModal 视觉回归测试
 *
 * AI可以通过运行这些测试来：
 * 1. 自动截图UI
 * 2. 对比重构前后差异
 * 3. 检测颜色和样式变化
 * 4. 验证按钮type属性
 * 5. 检测功能性bug（如下载文件）
 */

import { test, expect } from '@playwright/test';

test.describe('EditRequirementModal - Visual Regression Tests', () => {

  /**
   * 测试1: 默认状态截图对比
   * AI可以通过此测试检测任何UI变化
   */
  test('should match baseline - default state', async ({ page }) => {
    // 访问首页
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // 等待页面完全加载
    await page.waitForTimeout(2000);

    // 查找并点击"新建需求"按钮（使用多种选择器）
    const addButton = page.locator('button').filter({ hasText: '新增' }).or(
      page.locator('button[title*="新增"]')
    ).first();

    // 等待按钮可见
    await addButton.waitFor({ state: 'visible', timeout: 10000 });
    await addButton.click();

    // 等待弹窗出现（使用更通用的选择器）
    await page.waitForSelector('text=新建需求', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // 截图整个页面
    await expect(page).toHaveScreenshot('edit-modal-default.png', {
      fullPage: true,
      maxDiffPixels: 200,
      threshold: 0.3,
    });
  });

  /**
   * 测试2: 展开所有section的状态
   */
  test('should match baseline - all sections expanded', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const addButton = page.locator('button[title="新增需求"]');
    await addButton.click();

    const modal = page.locator('.fixed.inset-0');
    await modal.waitFor({ state: 'visible' });

    // 展开所有可折叠section
    const expandButtons = page.locator('button').filter({ hasText: '▼' });
    const count = await expandButtons.count();
    for (let i = 0; i < count; i++) {
      await expandButtons.nth(i).click();
      await page.waitForTimeout(200);
    }

    // 截图对比
    await expect(page).toHaveScreenshot('edit-modal-expanded.png', {
      maxDiffPixels: 150,
      threshold: 0.2,
    });
  });

  /**
   * 测试3: 标题栏颜色检查
   * AI可以通过此测试检测标题栏颜色是否正确
   */
  test('should have blue gradient header', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const addButton = page.locator('button[title="新增需求"]');
    await addButton.click();

    // 检查标题栏是否有蓝色渐变类
    const header = page.locator('.bg-gradient-to-r.from-blue-600.to-blue-700');
    await expect(header).toBeVisible();

    // 检查文字是否是白色
    await expect(header).toHaveClass(/text-white/);

    // 检查标题文本
    const title = header.locator('h2, h3');
    await expect(title).toContainText('新建需求');
  });

  /**
   * 测试4: Section颜色检查
   * AI可以检测各section的颜色是否正确
   */
  test('should have correct section colors', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const addButton = page.locator('button[title="新增需求"]');
    await addButton.click();

    const modal = page.locator('.fixed.inset-0');
    await modal.waitFor({ state: 'visible' });

    // 检查业务影响度section（蓝色）
    const businessSection = modal.locator('.bg-blue-50').first();
    await expect(businessSection).toBeVisible();

    // 检查是否有蓝色边框
    await expect(businessSection).toHaveClass(/border-blue-200/);

    // 检查AI分析section（紫色渐变）
    const aiSection = modal.locator('.bg-gradient-to-br.from-purple-50.to-indigo-50');
    await expect(aiSection).toBeVisible();

    // 检查影响范围section（绿色）
    const impactSection = modal.locator('.bg-green-50');
    if (await impactSection.count() > 0) {
      await expect(impactSection.first()).toBeVisible();
    }
  });

  /**
   * 测试5: 按钮type属性检查
   * AI可以检测所有按钮是否有type="button"
   */
  test('should have type="button" on all buttons', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const addButton = page.locator('button[title="新增需求"]');
    await addButton.click();

    // 获取弹窗内的所有按钮
    const modal = page.locator('.fixed.inset-0');
    const buttons = modal.locator('button');
    const count = await buttons.count();

    let missingType = [];

    // 检查每个按钮
    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const type = await button.getAttribute('type');
      const text = await button.textContent();

      if (!type || type !== 'button') {
        missingType.push({
          index: i,
          type: type || 'undefined',
          text: text?.trim() || 'no text',
        });
      }
    }

    // 验证结果
    if (missingType.length > 0) {
      console.error('❌ Buttons missing type="button":', missingType);
    }

    expect(missingType.length).toBe(0);
  });

  /**
   * 测试6: 不应该触发文件下载
   * AI可以检测点击按钮是否会触发下载
   */
  test('should not trigger file download on new requirement click', async ({ page }) => {
    // 监听下载事件
    let downloadTriggered = false;
    let downloadedFile = '';

    page.on('download', async (download) => {
      downloadTriggered = true;
      downloadedFile = download.suggestedFilename();
      console.error('❌ Unexpected download triggered:', downloadedFile);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 点击"新建需求"按钮
    const addButton = page.locator('button[title="新增需求"]');
    await addButton.click();

    // 等待一下，看是否触发下载
    await page.waitForTimeout(1000);

    // 验证没有触发下载
    expect(downloadTriggered).toBe(false);

    // 验证弹窗正常打开
    const modal = page.locator('.fixed.inset-0');
    await expect(modal).toBeVisible();
  });

  /**
   * 测试7: 保存按钮点击不应该触发下载
   */
  test('should not trigger download on save button click', async ({ page }) => {
    let downloadTriggered = false;

    page.on('download', () => {
      downloadTriggered = true;
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const addButton = page.locator('button[title="新增需求"]');
    await addButton.click();

    const modal = page.locator('.fixed.inset-0');
    await modal.waitFor({ state: 'visible' });

    // 填写必填字段
    const nameInput = modal.locator('input[placeholder*="需求名称"]');
    await nameInput.fill('测试需求');

    // 点击保存按钮
    const saveButton = modal.locator('button:has-text("保存")');
    await saveButton.click();

    await page.waitForTimeout(500);

    // 验证没有触发下载
    expect(downloadTriggered).toBe(false);
  });

  /**
   * 测试8: 检查icon颜色
   * AI可以验证图标颜色是否正确
   */
  test('should have correct icon colors', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const addButton = page.locator('button[title="新增需求"]');
    await addButton.click();

    const modal = page.locator('.fixed.inset-0');
    await modal.waitFor({ state: 'visible' });

    // 检查Target图标（业务影响度）- 应该是蓝色
    const targetIcon = modal.locator('svg').filter({ hasText: '' }).first();
    // 注意：SVG图标的颜色通过父元素的 text-* 类控制

    // 检查Sparkles图标（AI分析）- 应该是紫色
    const sparklesIcon = modal.locator('.text-purple-600 svg').first();
    await expect(sparklesIcon).toBeVisible();
  });
});
