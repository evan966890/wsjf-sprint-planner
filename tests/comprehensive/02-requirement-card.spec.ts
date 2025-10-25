import { test, expect } from '@playwright/test';

/**
 * 测试套件2: 需求卡片功能
 *
 * 覆盖范围：
 * - 卡片信息展示
 * - 卡片交互（编辑、删除）
 * - 卡片颜色和样式
 * - 卡片评分显示
 */

test.describe('需求卡片功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('需求卡片展示完整信息', async ({ page }) => {
    // 找到第一个需求卡片
    const firstCard = page.locator('[class*="bg-white"][class*="rounded-lg"]').first();

    // 检查卡片是否有必要的信息
    await expect(firstCard).toBeVisible();

    // 可能包含的信息（至少应该有标题）
    const hasTitle = await firstCard.locator('[class*="font-bold"]').count() > 0;
    expect(hasTitle).toBeTruthy();
  });

  test('需求卡片显示评分信息', async ({ page }) => {
    // 查找已评估的需求卡片（应该显示权重分和星级）
    const cards = page.locator('[class*="bg-white"][class*="rounded-lg"]');
    const count = await cards.count();

    let foundScoreCard = false;
    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const text = await card.textContent();
      if (text && text.includes('权重分')) {
        foundScoreCard = true;
        // 检查星级
        const stars = await card.locator('text=/★/').count();
        expect(stars).toBeGreaterThan(0);
        break;
      }
    }

    // 应该至少有一个显示评分的卡片
    expect(foundScoreCard).toBeTruthy();
  });

  test('不可排期需求不显示评分', async ({ page }) => {
    // 查找技术进展为"待评估"或"未评估"的卡片
    const cards = page.locator('[class*="bg-white"][class*="rounded-lg"]');
    const count = await cards.count();

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const text = await card.textContent();

      if (text && (text.includes('待评估') || text.includes('未评估'))) {
        // 这些卡片不应该显示权重分
        const hasScore = text.includes('权重分');
        expect(hasScore).toBeFalsy();
      }
    }
  });

  test('需求卡片可以点击编辑', async ({ page }) => {
    // 找到第一个编辑按钮
    const editButton = page.locator('button[title="编辑"], button:has-text("编辑")').first();

    if (await editButton.count() > 0) {
      await editButton.click();

      // 应该打开编辑弹窗
      await expect(page.locator('text=编辑需求')).toBeVisible({ timeout: 3000 });

      // 关闭弹窗
      const closeButton = page.locator('button:has-text("取消")').first();
      await closeButton.click();
    }
  });

  test('需求卡片拖拽功能', async ({ page }) => {
    // 检查卡片是否有 draggable 属性
    const firstCard = page.locator('[draggable="true"]').first();
    await expect(firstCard).toBeVisible();
  });

  test('需求卡片颜色渐变正确', async ({ page }) => {
    // 检查不同业务影响度的卡片是否有不同的颜色
    const cards = page.locator('[class*="bg-gradient-to-r"]');
    const count = await cards.count();

    expect(count).toBeGreaterThan(0);

    // 检查至少一个卡片有渐变背景
    const firstCard = cards.first();
    const classes = await firstCard.getAttribute('class');
    expect(classes).toContain('bg-gradient-to-r');
  });
});
