# 自动化测试规范

**版本**: v1.0
**生效日期**: 2025-10-26
**适用范围**: 所有新功能开发和重要bug修复

---

## 📋 核心原则

### ⭐ 强制执行规则

1. **所有新功能必须包含测试**
   - 功能开发完成 = 功能代码 + 测试代码
   - 没有测试的PR不允许合并

2. **所有重要bug修复必须添加回归测试**
   - 修复bug后添加测试，防止复发
   - 测试应该能重现原始bug

3. **提交前必须运行测试**
   - 至少运行相关的测试套件
   - 确保没有破坏现有功能

4. **使用稳定的选择器**
   - 优先使用 `data-testid`
   - 避免依赖文本或CSS类名

---

## 🎯 开发流程中的测试

### 新功能开发流程

```
1. 需求分析
   ↓
2. 设计方案
   ↓
3. 开发功能
   ↓
4. 添加 data-testid 属性  ⬅️ 新增
   ↓
5. 编写测试用例  ⬅️ 新增
   ↓
6. 运行测试验证  ⬅️ 新增
   ↓
7. 提交代码
```

### 强制检查清单

**开发新功能前**：
```
□ 阅读测试规范（本文档）
□ 了解如何添加 data-testid
□ 了解如何编写测试用例
```

**开发过程中**：
```
□ 为新添加的按钮/输入框添加 data-testid
□ 为新添加的组件添加 data-testid
□ 保持 data-testid 命名清晰（例如：add-requirement-btn）
```

**开发完成后（提交前）**：
```
□ 编写至少1个测试用例验证核心功能
□ 运行测试：npm run test:quick
□ 确保所有测试通过
□ 如有失败，修复后重新测试
```

---

## 🏷️ data-testid 命名规范

### 命名格式

```
[功能]-[元素类型]-[动作/描述]
```

### 示例

**按钮**：
```tsx
// ✅ 好的命名
<button data-testid="add-requirement-btn">新增需求</button>
<button data-testid="edit-requirement-btn">编辑</button>
<button data-testid="delete-requirement-btn">删除</button>
<button data-testid="save-btn">保存</button>
<button data-testid="cancel-btn">取消</button>

// ❌ 不好的命名
<button data-testid="btn1">新增</button>
<button data-testid="button">编辑</button>
<button data-testid="xz">新增</button>
```

**输入框**：
```tsx
// ✅ 好的命名
<input data-testid="requirement-title-input" />
<input data-testid="search-input" />
<select data-testid="business-value-select" />

// ❌ 不好的命名
<input data-testid="input1" />
<input data-testid="txt" />
```

**容器/区域**：
```tsx
// ✅ 好的命名
<div data-testid="unscheduled-area">...</div>
<div data-testid="sprint-pool-container">...</div>
<div data-testid="requirement-card">...</div>
```

### 命名最佳实践

1. **使用英文**（便于维护）
2. **使用连字符**（kebab-case）
3. **包含语义**（一看就知道是什么）
4. **保持简洁**（不超过3-4个单词）
5. **全局唯一**（同一个testid不要重复使用）

---

## 📝 如何编写测试

### 基本模板

```typescript
import { test, expect } from '@playwright/test';

test.describe('功能名称', () => {
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

  test('测试用例1：按钮可见', async ({ page }) => {
    // 使用 data-testid
    await expect(page.locator('[data-testid="your-button-btn"]')).toBeVisible();
  });

  test('测试用例2：按钮可点击', async ({ page }) => {
    const button = page.locator('[data-testid="your-button-btn"]');
    await button.click();

    // 验证结果
    await expect(page.locator('[data-testid="expected-result"]')).toBeVisible();
  });

  test('测试用例3：表单可以提交', async ({ page }) => {
    await page.locator('[data-testid="input-field"]').fill('测试数据');
    await page.locator('[data-testid="submit-btn"]').click();

    // 验证提交成功
    await expect(page.locator('text=成功')).toBeVisible();
  });
});
```

### 测试文件位置

```
tests/
├── comprehensive-fixed-v2/     # 当前稳定的测试（推荐参考）
│   ├── 01-page-load-ultra-stable.spec.ts
│   └── 03-edit-modal-timeout-fixed.spec.ts
├── your-feature/               # 您的新功能测试
│   └── new-feature.spec.ts     # 放在这里
└── debug/
    └── page-inspector.spec.ts  # 诊断工具
```

---

## ⚡ 快速测试命令

### 提交前快速测试（推荐）

```bash
# 运行核心测试（1分钟内完成）
npm run test:quick
```

这会运行最重要的测试，确保核心功能没有被破坏。

### 完整测试（发布前）

```bash
# 运行所有测试
npm run test:visual

# 查看报告
npm run test:visual:report
```

### 可视化调试（开发时）

```bash
# UI模式（推荐）
npm run test:visual:ui

# 有头模式（看到浏览器）
npx playwright test --headed

# 调试模式（逐步执行）
npx playwright test --debug
```

---

## 🎯 测试覆盖目标

### 必须测试的内容

**优先级1（必须）**：
- ✅ 核心功能的主流程
- ✅ 用户最常用的操作
- ✅ 容易出bug的地方

**优先级2（重要）**：
- ✅ 边界条件
- ✅ 错误处理
- ✅ 数据验证

**优先级3（可选）**：
- ✅ UI细节
- ✅ 性能测试
- ✅ 兼容性测试

### 测试覆盖率目标

| 阶段 | 目标覆盖率 | 说明 |
|------|-----------|------|
| **v1.0** | 50%+ | 核心功能有测试 |
| **v2.0** | 70%+ | 大部分功能有测试 |
| **v3.0** | 85%+ | 接近完整覆盖 |

**当前状态**: 约60%（核心功能已覆盖）

---

## 🐛 Bug修复流程

### 发现Bug后

1. **重现Bug**
   - 手动重现问题
   - 记录重现步骤

2. **编写测试**
   - 先写一个**会失败的测试**
   - 测试应该能重现bug

3. **修复Bug**
   - 修改代码
   - 运行测试，直到测试通过

4. **验证修复**
   - 运行所有相关测试
   - 确保没有破坏其他功能

5. **提交**
   - 提交包含：bug修复 + 回归测试

---

## 📊 测试工具对比

### Playwright（主要使用）

**优势**：
- ⚡ 快速自动化
- 🔄 可重复执行
- 🤖 CI/CD集成
- 📝 脚本化

**使用场景**：
- 日常开发测试
- 提交前验证
- CI/CD自动化
- 回归测试

### Chrome DevTools MCP（性能分析）

**优势**：
- 🔍 深度性能分析
- 🐛 复杂问题调试
- 🌐 网络监控
- 💬 AI驱动

**使用场景**：
- 性能优化
- 深度调试
- 探索性测试
- 学习和演示

**参考**: `scripts/run-devtools-mcp-tests.md`

---

## 📖 参考文档

### 本项目文档

- 📄 `COMPLETE_SUCCESS_REPORT.md` - 测试体系成功报告
- 📋 `tests/comprehensive-fixed-v2/` - 测试用例参考
- 🔍 `tests/debug/page-inspector.spec.ts` - 诊断工具

### 外部资源

- [Playwright官方文档](https://playwright.dev/)
- [测试最佳实践](https://playwright.dev/docs/best-practices)
- [Selectors选择器指南](https://playwright.dev/docs/selectors)

---

## ✅ 快速开始

### 1. 添加测试ID到您的组件

```tsx
// 示例：添加一个新按钮
<button
  onClick={handleClick}
  data-testid="my-new-feature-btn"  // ✅ 添加这行
>
  新功能
</button>
```

### 2. 创建测试文件

```bash
# 在 tests/your-feature/ 创建测试文件
# 复制 tests/comprehensive-fixed-v2/01-page-load-ultra-stable.spec.ts 作为模板
```

### 3. 运行测试

```bash
# 快速测试
npm run test:quick

# 查看结果
npm run test:visual:report
```

---

## 🎉 总结

**自动化测试的价值**：
- ✅ 快速发现问题
- ✅ 防止功能退化
- ✅ 提高代码质量
- ✅ 增强重构信心
- ✅ 文档化行为

**投入产出比**：⭐⭐⭐⭐⭐
- 一次投入（添加testid + 写测试）
- 长期收益（每次提交自动验证）

---

**记住**：好的测试应该：
- 🎯 快速（几秒内完成）
- 🔒 可靠（不会随机失败）
- 📖 可读（一看就懂在测什么）
- 🔧 易维护（选择器稳定）

**开始使用测试，让开发更有信心！** 🚀
