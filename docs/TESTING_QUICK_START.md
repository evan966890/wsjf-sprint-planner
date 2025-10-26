# 自动化测试快速开始 🚀

**5分钟上手Playwright自动化测试**

---

## ⚡ 快速命令

### 提交前必须运行（30秒）
```bash
npm run test:quick
```

### 可视化测试（推荐新手）
```bash
npm run test:visual:ui      # UI模式，可以点击查看
npm run test:visual:headed  # 看到浏览器自动操作
```

### 查看测试报告
```bash
npm run test:visual:report  # 打开HTML报告，有视频录像
```

---

## 📝 开发新功能时

### 第1步：添加测试ID（5分钟）

在您的组件中添加 `data-testid`：

```tsx
// ✅ 示例
<button
  onClick={handleClick}
  data-testid="my-feature-btn"  // ← 添加这行
>
  新功能
</button>

<input
  value={name}
  onChange={handleChange}
  data-testid="name-input"  // ← 添加这行
/>
```

**命名规则**：
- 使用英文
- 使用连字符（kebab-case）
- 格式：`功能-元素类型-动作`
- 例如：`add-requirement-btn`, `search-input`

---

### 第2步：创建测试文件（15分钟）

**复制模板**：
```bash
cp tests/comprehensive-fixed-v2/01-page-load-ultra-stable.spec.ts \
   tests/my-feature/my-feature.spec.ts
```

**修改测试代码**：
```typescript
import { test, expect } from '@playwright/test';

test.describe('我的新功能', () => {
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

  test('新功能按钮可见', async ({ page }) => {
    await expect(
      page.locator('[data-testid="my-feature-btn"]')
    ).toBeVisible();
  });

  test('点击按钮后功能正常', async ({ page }) => {
    await page.locator('[data-testid="my-feature-btn"]').click();

    // 验证结果
    await expect(
      page.locator('[data-testid="expected-result"]')
    ).toBeVisible();
  });
});
```

---

### 第3步：运行测试（30秒）

```bash
npm run test:quick
```

**期望结果**：
```
Running 11 tests using 1 worker

  ✓  1 [...] › 页面标题正确 (2.9s)
  ✓  2 [...] › 我的新功能按钮可见 (2.3s)
  ...

  11 passed (34.5s)
```

---

## 🎯 测试覆盖清单

**新功能至少需要测试**：

```
□ 功能入口可见（按钮/链接/菜单项）
□ 功能可点击/交互
□ 执行后有预期结果
□ 错误处理正常
□ 不会破坏现有功能
```

---

## 🐛 修复Bug时

1. **先写一个会失败的测试**（重现bug）
2. 修复代码
3. 运行测试验证修复
4. 提交（包含bug修复 + 测试）

这样可以防止bug再次出现！

---

## 👁️ 查看测试过程

### UI模式（最直观）
```bash
npm run test:visual:ui
```

**操作**：
1. 左侧：点击测试名称
2. 右侧：查看截图和日志
3. 点击"Actions"查看每一步

### 有头模式（看到浏览器）
```bash
npm run test:visual:headed
```

**效果**：
- 🌐 Chrome浏览器自动打开
- 🤖 自动点击、填表单
- ⚡ 像看电影一样观看测试

### HTML报告（查看录像）
```bash
npm run test:visual:report
```

**内容**：
- 📊 测试结果统计
- 📹 视频录像
- 📸 每步截图
- 📝 详细日志

---

## ❓ 常见问题

### Q: 测试太慢怎么办？

A: 只运行相关的测试
```bash
# 只运行特定文件
npx playwright test tests/my-feature/

# 只运行特定测试
npx playwright test -g "我的功能"
```

### Q: 测试失败了怎么办？

A: 使用UI模式调试
```bash
npm run test:visual:ui
```
点击失败的测试，查看截图和日志，找到问题原因。

### Q: 选择器找不到元素？

A: 使用诊断工具
```bash
npx playwright test tests/debug/page-inspector.spec.ts
```
会列出页面所有元素，帮您找到正确的选择器。

### Q: 必须每次都写测试吗？

A: 是的！原因：
- ✅ 防止功能退化
- ✅ 快速发现问题
- ✅ 文档化行为
- ✅ 重构时有信心

**投入**: 15分钟写测试
**收益**: 每次提交自动验证，节省数小时调试时间

---

## 📚 进阶学习

### 完整文档
- 📖 [测试规范](../standards/testing-standards.md) - 完整规范
- 📄 [成功案例](../../COMPLETE_SUCCESS_REPORT.md) - 9%→91%的提升过程
- 🎯 [AI模板](../../ai-templates/AUTOMATED_TESTING_STANDARDS.md) - 通用模板

### 测试示例
- 📂 `tests/comprehensive-fixed-v2/` - 超稳定版测试
- 📂 `tests/debug/` - 诊断工具

### 外部资源
- [Playwright官方文档](https://playwright.dev/)
- [选择器最佳实践](https://playwright.dev/docs/selectors)

---

## ✅ 检查清单

**开发新功能时**：
```
□ 添加 data-testid 属性
□ 创建测试文件
□ 编写至少1个测试用例
□ 运行 npm run test:quick
□ 确保测试通过
□ 提交代码
```

**提交前**：
```
□ npm run test:quick 通过
□ npm run check-file-size 通过
□ npm run build 成功
```

---

**🎉 开始使用自动化测试，让开发更有信心！**

**5分钟入门，终身受益！**
