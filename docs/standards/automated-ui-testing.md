# 自动化UI测试方案 - AI自主截图和验证

> 🎯 **目标**: 让AI能够自己运行程序、截图、识别UI问题
> 📅 **创建日期**: 2025-10-25
> 🔧 **技术方案**: Playwright + Visual Regression Testing

---

## 💡 核心理念

### 问题：AI的局限性
```
❌ AI看不到浏览器界面
❌ AI不能手动截图
❌ AI不能对比UI差异
```

### 解决方案：自动化测试工具
```
✅ Playwright - AI可以运行自动化脚本
✅ 自动截图 - 脚本自动捕获UI
✅ 像素对比 - 工具自动对比差异
✅ AI读取结果 - 通过测试输出识别问题
```

---

## 🛠️ 技术方案1: Playwright Visual Testing ⭐⭐⭐

### 1.1 安装依赖

```bash
npm install --save-dev @playwright/test
npm install --save-dev pixelmatch
npx playwright install chromium
```

### 1.2 配置 Playwright

**创建**: `playwright.config.ts`

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/visual',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```

### 1.3 创建视觉测试

**创建**: `tests/visual/edit-requirement-modal.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('EditRequirementModal Visual Tests', () => {

  test('should match baseline - default state', async ({ page }) => {
    // 访问页面
    await page.goto('/');

    // 点击"新建需求"按钮
    await page.click('button[title="新增需求"]');

    // 等待弹窗出现
    await page.waitForSelector('.fixed.inset-0', { state: 'visible' });

    // 截图并对比
    await expect(page).toHaveScreenshot('edit-modal-default.png', {
      maxDiffPixels: 100, // 允许最多100个像素差异
    });
  });

  test('should match baseline - expanded state', async ({ page }) => {
    await page.goto('/');
    await page.click('button[title="新增需求"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'visible' });

    // 展开所有折叠section
    const expandButtons = await page.locator('button:has-text("▼")');
    const count = await expandButtons.count();
    for (let i = 0; i < count; i++) {
      await expandButtons.nth(i).click();
    }

    // 截图对比
    await expect(page).toHaveScreenshot('edit-modal-expanded.png', {
      maxDiffPixels: 100,
    });
  });

  test('should have correct colors - header', async ({ page }) => {
    await page.goto('/');
    await page.click('button[title="新增需求"]');

    // 检查标题栏背景色（蓝色渐变）
    const header = page.locator('.bg-gradient-to-r.from-blue-600.to-blue-700');
    await expect(header).toBeVisible();

    // 检查标题文字颜色（白色）
    await expect(header).toHaveClass(/text-white/);
  });

  test('should have correct colors - sections', async ({ page }) => {
    await page.goto('/');
    await page.click('button[title="新增需求"]');

    // 检查业务影响度section（蓝色）
    const businessImpact = page.locator('.bg-blue-50.border-blue-200').first();
    await expect(businessImpact).toBeVisible();

    // 检查AI分析section（紫色渐变）
    const aiSection = page.locator('.bg-gradient-to-br.from-purple-50.to-indigo-50');
    await expect(aiSection).toBeVisible();

    // 检查影响范围section（绿色）
    const impactScope = page.locator('.bg-green-50.border-green-200');
    await expect(impactScope).toBeVisible();
  });

  test('should have type="button" on all buttons', async ({ page }) => {
    await page.goto('/');
    await page.click('button[title="新增需求"]');

    // 获取所有按钮
    const buttons = page.locator('.fixed.inset-0 button');
    const count = await buttons.count();

    // 检查每个按钮是否有 type 属性
    for (let i = 0; i < count; i++) {
      const type = await buttons.nth(i).getAttribute('type');
      expect(type).toBeTruthy(); // 应该有type属性
      expect(type).toBe('button'); // 应该是button
    }
  });

  test('should not trigger file download on button click', async ({ page }) => {
    // 监听下载事件
    let downloadTriggered = false;
    page.on('download', () => {
      downloadTriggered = true;
    });

    await page.goto('/');

    // 点击"新建需求"按钮
    await page.click('button[title="新增需求"]');

    // 等待一下
    await page.waitForTimeout(1000);

    // 验证没有触发下载
    expect(downloadTriggered).toBe(false);
  });
});
```

### 1.4 运行测试

```bash
# 第一次运行：生成baseline截图
npx playwright test --update-snapshots

# 后续运行：对比差异
npx playwright test

# 查看测试报告
npx playwright show-report
```

---

## 🤖 AI如何使用这套系统

### 场景：AI进行重构

#### Step 1: 重构前 - AI自动生成baseline
```typescript
AI执行：
1. npm run dev（启动服务器）
2. npx playwright test --update-snapshots（生成基线截图）
3. 检查测试是否通过
4. 保存baseline截图到 tests/visual/snapshots/
```

#### Step 2: 执行重构
```typescript
AI执行重构代码...
```

#### Step 3: 重构后 - AI自动验证
```typescript
AI执行：
1. npx playwright test（运行视觉测试）
2. 读取测试结果
3. 如果失败，查看差异图片
4. 分析问题：
   - 颜色改变？
   - 布局错误？
   - 按钮缺失？
5. 自动修复或报告给用户
```

#### AI可以读取的测试输出示例

```bash
# 测试通过
✓ should match baseline - default state (2.3s)
✓ should have correct colors - header (1.1s)
✓ should have correct colors - sections (1.5s)
✓ should have type="button" on all buttons (0.8s)

# 测试失败
✗ should match baseline - default state (2.1s)
  Error: Screenshot comparison failed:
  Expected: edit-modal-default.png
  Actual:   edit-modal-default-actual.png
  Diff:     edit-modal-default-diff.png

  Difference: 1543 pixels (0.8% of total)
  Changed areas: header background color

✗ should have correct colors - header (0.9s)
  Error: Element not found: .bg-gradient-to-r.from-blue-600.to-blue-700
  Found instead: .bg-white
```

**AI读取后可以知道**:
- ✅ 标题栏背景色改变了（从蓝色渐变变成白色）
- ✅ 有1543个像素不同（0.8%）
- ✅ 需要修复的具体类名

---

## 🛠️ 技术方案2: Percy.io / Chromatic ⭐⭐

### 2.1 什么是Percy

Percy是专业的视觉回归测试SaaS服务：
- 自动截图
- 自动对比
- 可视化diff
- CI/CD集成

### 2.2 安装和配置

```bash
npm install --save-dev @percy/cli @percy/playwright
```

**创建**: `tests/visual/percy.spec.ts`

```typescript
import { test } from '@playwright/test';
import percySnapshot from '@percy/playwright';

test('EditRequirementModal visual test', async ({ page }) => {
  await page.goto('/');
  await page.click('button[title="新增需求"]');

  // Percy自动截图和对比
  await percySnapshot(page, 'Edit Modal - Default');

  // 展开所有section
  await page.click('button:has-text("▼")');
  await percySnapshot(page, 'Edit Modal - Expanded');
});
```

### 2.3 运行Percy

```bash
# 设置环境变量（Percy提供）
export PERCY_TOKEN=your_token

# 运行测试（Percy自动截图和对比）
npx percy exec -- npx playwright test
```

**AI可以做什么**:
- 运行Percy测试
- 读取Percy的对比结果URL
- 查看Percy dashboard上的visual diff
- 识别哪些地方变化了

---

## 🎯 技术方案3: Storybook + Chromatic ⭐⭐⭐

### 3.1 为什么选择Storybook

Storybook可以：
- 独立展示组件
- 自动生成所有状态
- 集成Chromatic自动截图对比
- AI可以读取测试结果

### 3.2 安装Storybook

```bash
npx storybook@latest init
npm install --save-dev chromatic
```

### 3.3 创建Story

**创建**: `src/components/EditRequirementModal.stories.tsx`

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import EditRequirementModal from './EditRequirementModal';

const meta: Meta<typeof EditRequirementModal> = {
  title: 'Components/EditRequirementModal',
  component: EditRequirementModal,
};

export default meta;
type Story = StoryObj<typeof EditRequirementModal>;

// 默认状态
export const Default: Story = {
  args: {
    requirement: null,
    isNew: true,
    onSave: () => {},
    onClose: () => {},
  },
};

// 编辑状态
export const Editing: Story = {
  args: {
    requirement: {
      id: 'REQ-001',
      name: '测试需求',
      // ... 其他字段
    },
    isNew: false,
    onSave: () => {},
    onClose: () => {},
  },
};
```

### 3.4 运行Chromatic

```bash
# 初始baseline
npx chromatic --project-token=<token>

# 后续运行：自动对比
npx chromatic --project-token=<token>
```

**AI可以做什么**:
- 运行 `npx chromatic`
- 读取Chromatic的输出
- 获取visual diff的URL
- 分析哪些组件变化了
- 自动判断是否acceptable

---

## 🚀 推荐方案：Playwright + 自定义脚本 ⭐⭐⭐

### 为什么推荐这个方案

1. ✅ 完全开源，无需付费服务
2. ✅ AI可以完全控制
3. ✅ 可以读取所有输出
4. ✅ 可以自动化修复

### 完整实施方案

#### 阶段1: 安装和配置

**安装依赖**:
```bash
npm install --save-dev @playwright/test pixelmatch pngjs
npx playwright install chromium
```

**创建配置**: `playwright.config.ts`（上面已提供）

#### 阶段2: 创建测试套件

**创建**: `tests/visual/edit-requirement-modal.spec.ts`（上面已提供）

**创建**: `tests/helpers/visual-compare.ts`

```typescript
import { Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

export async function compareVisual(
  page: Page,
  name: string,
  options: {
    maxDiffPixels?: number;
    threshold?: number;
  } = {}
) {
  const { maxDiffPixels = 100, threshold = 0.1 } = options;

  const baselineDir = path.join(__dirname, '../snapshots/baseline');
  const actualDir = path.join(__dirname, '../snapshots/actual');
  const diffDir = path.join(__dirname, '../snapshots/diff');

  // 确保目录存在
  [baselineDir, actualDir, diffDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  const baselinePath = path.join(baselineDir, `${name}.png`);
  const actualPath = path.join(actualDir, `${name}.png`);
  const diffPath = path.join(diffDir, `${name}.png`);

  // 截图
  await page.screenshot({ path: actualPath, fullPage: true });

  // 如果没有baseline，创建baseline
  if (!fs.existsSync(baselinePath)) {
    fs.copyFileSync(actualPath, baselinePath);
    return {
      status: 'baseline-created',
      message: `Baseline created: ${name}.png`,
    };
  }

  // 读取图片
  const baseline = PNG.sync.read(fs.readFileSync(baselinePath));
  const actual = PNG.sync.read(fs.readFileSync(actualPath));

  // 创建diff图片
  const { width, height } = baseline;
  const diff = new PNG({ width, height });

  // 像素对比
  const numDiffPixels = pixelmatch(
    baseline.data,
    actual.data,
    diff.data,
    width,
    height,
    { threshold }
  );

  // 保存diff图片
  fs.writeFileSync(diffPath, PNG.sync.write(diff));

  // 返回结果
  if (numDiffPixels <= maxDiffPixels) {
    return {
      status: 'passed',
      diffPixels: numDiffPixels,
      percentage: ((numDiffPixels / (width * height)) * 100).toFixed(2),
    };
  } else {
    return {
      status: 'failed',
      diffPixels: numDiffPixels,
      percentage: ((numDiffPixels / (width * height)) * 100).toFixed(2),
      baselinePath,
      actualPath,
      diffPath,
    };
  }
}
```

#### 阶段3: 创建AI可执行的脚本

**创建**: `scripts/ai-visual-test.sh`

```bash
#!/bin/bash

# =============================================================================
# AI自动化视觉测试脚本
# =============================================================================
# AI可以运行此脚本来自动截图和验证UI
# =============================================================================

set -e

ACTION=$1  # baseline | test

case $ACTION in
  baseline)
    echo "🎨 创建视觉测试baseline..."
    npx playwright test --update-snapshots
    echo "✅ Baseline已创建"
    echo "   位置: tests/visual/snapshots/baseline/"
    ;;

  test)
    echo "🔍 运行视觉测试..."

    # 运行测试，捕获输出
    if npx playwright test > test-output.txt 2>&1; then
      echo "✅ 所有视觉测试通过！"
      echo ""
      cat test-output.txt

      # 清理
      rm test-output.txt
      exit 0
    else
      echo "❌ 视觉测试失败！"
      echo ""
      cat test-output.txt
      echo ""
      echo "差异图片位置："
      find tests/visual/snapshots/diff -name "*.png" 2>/dev/null || echo "无"

      # 保留输出供AI读取
      exit 1
    fi
    ;;

  *)
    echo "用法: bash scripts/ai-visual-test.sh [baseline|test]"
    echo ""
    echo "  baseline - 创建baseline截图（重构前运行）"
    echo "  test     - 运行测试对比（重构后运行）"
    exit 1
    ;;
esac
```

#### 阶段4: AI工作流程

**AI在重构时的新流程**:

```typescript
// 重构前
AI执行：
1. bash scripts/ai-visual-test.sh baseline
2. 读取输出，确认baseline创建成功
3. 记录baseline文件位置

// 执行重构
AI执行重构代码...

// 重构后
AI执行：
1. bash scripts/ai-visual-test.sh test
2. 读取测试输出
3. 分析结果：

   如果输出包含"所有视觉测试通过":
     → 告诉用户："重构成功，自动化测试通过！"

   如果输出包含"视觉测试失败":
     → 分析失败原因
     → 读取 test-output.txt
     → 识别哪个测试失败（颜色？布局？）
     → 提供修复方案或回滚建议
```

---

## 📸 AI可以读取的输出示例

### 成功输出
```
Running 5 tests using 1 worker

  ✓ should match baseline - default state (2.3s)
  ✓ should match baseline - expanded state (3.1s)
  ✓ should have correct colors - header (1.2s)
  ✓ should have correct colors - sections (1.8s)
  ✓ should have type="button" on all buttons (0.9s)

  5 passed (9.3s)
```

**AI理解**: 所有测试通过，UI一致，颜色正确，type属性存在

### 失败输出
```
Running 5 tests using 1 worker

  ✓ should match baseline - default state (2.1s)
  ✗ should have correct colors - header (1.3s)
  ✗ should have correct colors - sections (1.6s)
  ✓ should have type="button" on all buttons (0.8s)

  3 passed, 2 failed (5.8s)

Failures:

  1) should have correct colors - header
     Error: Element not found: .bg-gradient-to-r.from-blue-600.to-blue-700
     Found instead: .bg-white

  2) should have correct colors - sections
     Error: Element not found: .bg-gradient-to-br.from-purple-50.to-indigo-50
     Found instead: .bg-gray-50
```

**AI理解**:
- ❌ 标题栏颜色错误：应该是 `bg-gradient-to-r from-blue-600 to-blue-700`，实际是 `bg-white`
- ❌ AI分析section颜色错误：应该是紫色渐变，实际是 `bg-gray-50`
- ✅ 按钮type属性正确

**AI可以自动修复**:
```typescript
AI分析输出后：
"我发现了2个样式问题：
1. 标题栏丢失了蓝色渐变
2. AI分析section丢失了紫色渐变

我现在修复这些样式..."

AI执行Edit操作修复样式

"已修复，重新运行测试..."
AI执行：npx playwright test

如果通过：
"✅ 修复成功，所有测试通过！"

如果仍失败：
"修复未成功，建议回滚到重构前版本。"
```

---

## 🎨 方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **Playwright自动化** | 完全开源，AI可控 | 需要编写测试代码 | ⭐ 推荐 |
| **Percy.io** | 专业，易用 | 付费，依赖外部服务 | 商业项目 |
| **Storybook+Chromatic** | 组件文档+测试 | 配置复杂 | 组件库 |
| **BackstopJS** | 简单易用 | 功能有限 | 简单项目 |
| **手动截图+对比** | 无需工具 | AI不能执行 | 小型项目 |

---

## 📋 实施步骤（现在就可以开始）

### Step 1: 安装Playwright（5分钟）
```bash
npm install --save-dev @playwright/test pixelmatch pngjs
npx playwright install chromium
```

### Step 2: 复制配置文件（3分钟）
```bash
# 创建上面提供的文件：
# - playwright.config.ts
# - tests/visual/edit-requirement-modal.spec.ts
# - tests/helpers/visual-compare.ts
# - scripts/ai-visual-test.sh
```

### Step 3: 生成baseline（2分钟）
```bash
chmod +x scripts/ai-visual-test.sh
bash scripts/ai-visual-test.sh baseline
```

### Step 4: 下次重构时使用（自动化）
```bash
# AI在重构前运行
bash scripts/ai-visual-test.sh baseline

# AI重构代码...

# AI在重构后运行
bash scripts/ai-visual-test.sh test

# AI读取输出，自动判断是否通过
```

---

## 🤖 AI使用示例对话

### 用户
```
请重构 EditRequirementModal.tsx
```

### AI（新工作流程）
```
好的，我会使用自动化视觉测试来确保重构质量。

Step 1: 创建baseline
执行：bash scripts/ai-visual-test.sh baseline
[读取输出]
✓ Baseline已创建，包含5个测试快照

Step 2: 执行重构
[AI重构代码...]
已完成重构：2229 → 618行

Step 3: 运行视觉测试
执行：bash scripts/ai-visual-test.sh test
[读取输出]

测试结果：
✗ 2个测试失败
- 标题栏颜色错误（bg-white 应该是 bg-gradient-to-r from-blue-600 to-blue-700）
- AI section颜色错误（bg-gray-50 应该是 bg-gradient-to-br from-purple-50 to-indigo-50）

我发现了样式丢失问题，现在修复...
[AI自动修复样式]

重新运行测试：
执行：bash scripts/ai-visual-test.sh test
✓ 所有5个测试通过！

✅ 重构成功！自动化测试验证通过。

您可以：
1. 手动查看 http://localhost:3000 确认UI
2. 如果满意，提交代码

需要我帮您创建commit吗？
```

---

## 📊 预期效果

### 使用自动化测试后

| 指标 | 手动验证 | 自动化测试 | 改进 |
|------|----------|------------|------|
| AI能否自主验证 | ❌ 不能 | ✅ 能 | +100% |
| 发现UI问题耗时 | 用户手动10分钟 | AI自动30秒 | -95% |
| 修复问题耗时 | 2小时（发现晚） | 5分钟（立即发现） | -96% |
| 用户参与度 | 必须全程参与 | 可选参与 | 减负90% |
| 准确性 | 依赖用户经验 | 像素级精确 | +100% |

---

## 🎯 立即实施建议

### 最小可行方案（MVP）

**只需30分钟配置，立即可用**:

```bash
# 1. 安装Playwright（5分钟）
npm install --save-dev @playwright/test
npx playwright install chromium

# 2. 创建一个简单测试（10分钟）
# 复制上面的 edit-requirement-modal.spec.ts

# 3. 运行测试（5分钟）
npx playwright test --update-snapshots  # 创建baseline
npx playwright test                     # 验证通过

# 4. 修改样式测试（10分钟）
# 把标题栏改成灰色，运行测试
# 应该会失败并告诉你颜色错了
```

### 完整方案

如果您想要完整的自动化测试体系：

1. **本周**: 配置Playwright + 基础测试
2. **下周**: 添加更多测试用例（所有UI组件）
3. **下个月**: 集成到CI/CD，PR自动运行视觉测试

---

## 📚 实施文件清单

需要创建的文件：

```
WSJF/
├── playwright.config.ts           # Playwright配置
├── tests/
│   ├── visual/
│   │   ├── edit-requirement-modal.spec.ts  # 视觉测试
│   │   ├── unscheduled-area.spec.ts
│   │   └── sprint-pool.spec.ts
│   ├── helpers/
│   │   └── visual-compare.ts      # 对比工具
│   └── snapshots/
│       ├── baseline/              # 基线截图（重构前）
│       ├── actual/                # 实际截图（重构后）
│       └── diff/                  # 差异图片
└── scripts/
    └── ai-visual-test.sh          # AI执行脚本
```

---

## 🚀 现在就试试？

我可以立即为您配置Playwright视觉测试系统：

1. 安装依赖
2. 创建配置文件
3. 创建测试文件
4. 创建AI脚本
5. 生成baseline
6. 运行测试验证

**需要我现在配置吗？大约需要10-15分钟。**

配置完成后，下次重构我就可以：
- ✅ 自己运行程序
- ✅ 自己截图
- ✅ 自己识别问题
- ✅ 自己修复或报告

您要现在配置，还是先了解一下？
