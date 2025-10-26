import { test } from '@playwright/test';
import * as fs from 'fs';

/**
 * 页面结构诊断工具
 * 用于检查页面实际的HTML结构，帮助修复测试选择器
 */

test('诊断：检查页面实际结构', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000); // 等待2秒确保页面完全渲染

  console.log('\n========== 页面诊断开始 ==========\n');

  // 1. 获取页面标题
  const title = await page.title();
  console.log('1. 页面标题:', title);

  // 2. 获取页面的主要文本内容
  const bodyText = await page.locator('body').textContent();
  console.log('\n2. 页面是否包含关键文本:');
  console.log('   - 包含 "WSJF":', bodyText?.includes('WSJF'));
  console.log('   - 包含 "待排期":', bodyText?.includes('待排期'));
  console.log('   - 包含 "迭代池":', bodyText?.includes('迭代池'));
  console.log('   - 包含 "新建需求":', bodyText?.includes('新建需求'));

  // 3. 检查所有按钮
  const buttons = await page.locator('button').all();
  console.log('\n3. 页面上的所有按钮 (共', buttons.length, '个):');
  for (let i = 0; i < Math.min(buttons.length, 20); i++) {
    const text = await buttons[i].textContent();
    const visible = await buttons[i].isVisible();
    console.log(`   [${i}]`, text?.trim(), visible ? '✓可见' : '✗隐藏');
  }

  // 4. 检查主要标题元素
  console.log('\n4. 主要标题元素:');
  const h1 = await page.locator('h1').all();
  console.log('   - h1标签数量:', h1.length);
  for (const heading of h1) {
    const text = await heading.textContent();
    console.log('     ·', text?.trim());
  }

  const h2 = await page.locator('h2').all();
  console.log('   - h2标签数量:', h2.length);
  for (let i = 0; i < Math.min(h2.length, 10); i++) {
    const text = await h2[i].textContent();
    console.log('     ·', text?.trim());
  }

  // 5. 检查需求卡片
  console.log('\n5. 需求卡片检查:');

  // 尝试多种可能的卡片选择器
  const selectors = [
    '[class*="bg-white"][class*="rounded"]',
    '.card',
    '[data-testid*="card"]',
    '[class*="requirement"]',
    'article',
  ];

  for (const selector of selectors) {
    const cards = await page.locator(selector).count();
    if (cards > 0) {
      console.log(`   - "${selector}": 找到 ${cards} 个`);
    }
  }

  // 6. 检查区域容器
  console.log('\n6. 主要区域容器:');
  const sections = await page.locator('section, [role="region"], [class*="area"]').all();
  console.log('   - 区域数量:', sections.length);
  for (let i = 0; i < Math.min(sections.length, 10); i++) {
    const text = await sections[i].textContent();
    const firstLine = text?.split('\n')[0].trim().substring(0, 50);
    console.log(`     [${i}]`, firstLine);
  }

  // 7. 截图保存
  await page.screenshot({
    path: 'test-results/debug-screenshot.png',
    fullPage: true
  });
  console.log('\n7. 截图已保存: test-results/debug-screenshot.png');

  // 8. 保存完整HTML
  const html = await page.content();
  fs.writeFileSync('test-results/page-snapshot.html', html);
  console.log('8. HTML快照已保存: test-results/page-snapshot.html');

  // 9. 获取DOM结构概览
  const domInfo = await page.evaluate(() => {
    const getAllText = (el: Element, depth: number = 0): string[] => {
      if (depth > 3) return [];
      const results: string[] = [];

      // 获取当前元素的信息
      const tag = el.tagName.toLowerCase();
      const classes = el.className || '';
      const text = Array.from(el.childNodes)
        .filter(node => node.nodeType === 3) // TEXT_NODE
        .map(node => node.textContent?.trim())
        .filter(t => t && t.length > 0)
        .join(' ');

      if (text) {
        results.push(`${'  '.repeat(depth)}<${tag}${classes ? `.${classes.split(' ')[0]}` : ''}> ${text.substring(0, 40)}`);
      }

      // 递归子元素
      Array.from(el.children).forEach(child => {
        results.push(...getAllText(child, depth + 1));
      });

      return results;
    };

    return {
      mainContainer: document.querySelector('main')?.className || 'N/A',
      bodyClasses: document.body.className,
      appRoot: document.querySelector('#root')?.children.length || 0,
    };
  });

  console.log('\n9. DOM结构信息:');
  console.log('   - Main容器class:', domInfo.mainContainer);
  console.log('   - Body classes:', domInfo.bodyClasses);
  console.log('   - App根元素子元素数:', domInfo.appRoot);

  console.log('\n========== 页面诊断结束 ==========\n');
});
