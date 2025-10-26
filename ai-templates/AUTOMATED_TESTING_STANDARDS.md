# 自动化测试标准（通用AI模板）

**适用范围**: 所有前端Web应用项目
**工具**: Playwright
**版本**: v1.0

---

## 📌 为什么需要自动化测试？

### 痛点场景

❌ **没有测试时**：
```
开发者：改了一个小功能
        ↓
      提交代码
        ↓
      部署上线
        ↓
      用户发现：登录按钮坏了！
        ↓
      紧急回滚，加班修复
```

✅ **有测试时**：
```
开发者：改了一个小功能
        ↓
      运行测试（30秒）
        ↓
      测试失败：登录按钮坏了！
        ↓
      立即修复，重新测试
        ↓
      测试通过 → 放心提交
```

### 投入产出比

**投入**：
- 添加 `data-testid`：5分钟
- 编写测试用例：15-30分钟

**产出**：
- 每次提交自动验证：30秒
- 发现问题时间：从天级 → 秒级
- 修复成本：降低90%

**ROI**: ⭐⭐⭐⭐⭐（极高）

---

## 🎯 实施步骤（适用于任何新项目）

### 第1步：安装Playwright

```bash
npm init playwright@latest
```

选择：
- TypeScript
- tests目录
- GitHub Actions（可选）

### 第2步：创建测试规范

复制本文档到新项目的 `docs/standards/testing-standards.md`

### 第3步：添加快速测试脚本

在 `package.json` 中：
```json
{
  "scripts": {
    "test:quick": "playwright test tests/critical/ --reporter=list",
    "test:visual": "playwright test --reporter=html",
    "test:visual:ui": "playwright test --ui",
    "test:visual:report": "playwright show-report"
  }
}
```

### 第4步：配置Git Hook（可选但推荐）

```bash
# 安装husky
npm install --save-dev husky
npx husky init

# 添加pre-commit hook
echo "npm run test:quick" > .husky/pre-commit
```

### 第5步：培训团队

- 📖 分享本文档
- 🎬 演示如何编写测试
- 🎯 要求：新功能必须包含测试

---

## 🏷️ data-testid 标准（通用）

### 命名规范

```
[功能]-[元素类型]-[动作]

例如：
- add-user-btn
- delete-item-btn
- user-name-input
- email-input
- submit-form-btn
- cancel-btn
- modal-container
- error-message
```

### 添加位置

**所有交互元素**：
```tsx
// 按钮
<button data-testid="save-btn">保存</button>
<button data-testid="cancel-btn">取消</button>

// 输入框
<input data-testid="username-input" />
<textarea data-testid="description-input" />
<select data-testid="category-select" />

// 链接
<a data-testid="nav-home-link">首页</a>

// 容器
<div data-testid="user-list-container">...</div>
<div data-testid="modal-overlay">...</div>
```

### 不需要添加的地方

- ❌ 纯展示的文本
- ❌ 装饰性图标
- ❌ 不需要测试的内部组件

---

## 📝 测试用例模板

### 模板1：基础功能测试

```typescript
import { test, expect } from '@playwright/test';

test.describe('功能名称', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 如果有登录，在这里处理
  });

  test('功能可见', async ({ page }) => {
    await expect(page.locator('[data-testid="feature-btn"]')).toBeVisible();
  });

  test('功能可用', async ({ page }) => {
    const btn = page.locator('[data-testid="feature-btn"]');
    await btn.click();
    await expect(page.locator('[data-testid="result"]')).toBeVisible();
  });
});
```

### 模板2：表单测试

```typescript
test('表单可以提交', async ({ page }) => {
  await page.locator('[data-testid="name-input"]').fill('测试用户');
  await page.locator('[data-testid="email-input"]').fill('test@test.com');
  await page.locator('[data-testid="submit-btn"]').click();

  await expect(page.locator('text=提交成功')).toBeVisible();
});
```

### 模板3：列表/CRUD测试

```typescript
test('可以添加、编辑、删除项目', async ({ page }) => {
  // 添加
  await page.locator('[data-testid="add-btn"]').click();
  await page.locator('[data-testid="title-input"]').fill('新项目');
  await page.locator('[data-testid="save-btn"]').click();

  // 验证添加成功
  await expect(page.locator('text=新项目')).toBeVisible();

  // 编辑
  await page.locator('[data-testid="edit-btn"]').first().click();
  await page.locator('[data-testid="title-input"]').fill('修改后');
  await page.locator('[data-testid="save-btn"]').click();

  // 验证编辑成功
  await expect(page.locator('text=修改后')).toBeVisible();

  // 删除
  await page.locator('[data-testid="delete-btn"]').first().click();
  await page.locator('[data-testid="confirm-btn"]').click();

  // 验证删除成功
  await expect(page.locator('text=修改后')).not.toBeVisible();
});
```

---

## 🚀 CI/CD 集成（可选）

### GitHub Actions 示例

```yaml
# .github/workflows/test.yml
name: Playwright Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:visual
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 📊 成功案例

### 本项目（WSJF Sprint Planner）

**成果**：
- 测试通过率：9% → 91%（提升10倍）
- 测试用例：55+个
- 发现并修复：登录遮挡、选择器问题等

**经验**：
- ✅ data-testid 是关键（稳定性100%）
- ✅ 诊断工具很重要（快速定位问题）
- ✅ 渐进式修复（一步步提升）

**参考文件**：
- `COMPLETE_SUCCESS_REPORT.md` - 完整报告
- `tests/comprehensive-fixed-v2/` - 测试示例

---

## 🎓 培训建议

### 新人培训检查清单

```
□ 阅读本测试标准文档
□ 观看一次Playwright UI模式测试
□ 编写第一个测试用例（在导师指导下）
□ 独立编写测试用例
□ 学习调试失败的测试
```

### 团队实践

1. **Code Review要求**
   - 新功能必须包含测试
   - 测试必须通过才能合并

2. **定期审查**
   - 每月检查测试覆盖率
   - 删除过时的测试
   - 更新选择器

3. **持续改进**
   - 收集测试编写的痛点
   - 优化测试框架
   - 分享最佳实践

---

## 📞 快速参考

### 常用命令

```bash
# 快速测试
npm run test:quick

# 完整测试
npm run test:visual

# UI模式
npm run test:visual:ui

# 查看报告
npm run test:visual:report

# 调试模式
npx playwright test --debug

# 有头模式
npx playwright test --headed
```

### 常用选择器

```typescript
// ✅ 推荐：data-testid
page.locator('[data-testid="save-btn"]')

// ✅ 可用：语义属性
page.locator('button[aria-label="保存"]')
page.locator('button[title="保存"]')

// ⚠️ 慎用：文本（可能变化）
page.locator('button:has-text("保存")')

// ❌ 避免：CSS类名（不稳定）
page.locator('.btn-primary')
```

---

**将本模板复制到新项目，快速建立测试体系！** 🎉

**预计收益**：
- 🐛 Bug发现速度：提升10倍
- ⚡ 修复效率：提升5倍
- 💪 开发信心：显著增强
- 📈 代码质量：持续提升
