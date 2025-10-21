# 文件大小强制执行规范

> **适用场景**：所有 React/TypeScript 项目
> **强制级别**：🔴 **必须遵守**（不遵守将导致提交失败）

---

## 📏 文件大小限制（强制规则）

### 硬性限制（Red Line）

```
❌ 禁止超过 500 行的文件提交到代码库
```

| 文件类型 | 最大行数 | 违规后果 |
|---------|---------|----------|
| 组件文件 (*.tsx) | 500 行 | 提交被拒绝 |
| Hook 文件 (*.ts) | 500 行 | 提交被拒绝 |
| 工具函数 (*.ts) | 300 行 | 提交被拒绝 |
| 类型定义 (*.ts) | 500 行 | 警告（允许通过） |
| 配置文件 (*.ts) | 500 行 | 警告（允许通过） |

### 分级预警系统

```
🟢 < 200 行  安全区    正常开发
🟡 200-300 行 注意区    开始评估拆分
🟠 300-400 行 警告区    必须规划拆分
🔴 400-500 行 危险区    立即拆分，禁止添加
❌ > 500 行  禁止区    拒绝提交
```

---

## 🚀 新项目初始化检查清单

### 第 1 步：安装依赖

```bash
# 安装 Husky (Git hooks)
npm install --save-dev husky

# 安装 ESLint 规则（可选）
npm install --save-dev eslint-plugin-max-lines
```

### 第 2 步：创建检查脚本

创建 `scripts/check-file-size.js`:

```javascript
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const MAX_LINES = 500;
const WARNING_LINES = 300;
const INFO_LINES = 200;

function countLines(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return content.split('\n').filter(line => line.trim()).length; // 只计算非空行
}

function checkFiles(pattern, maxLines = MAX_LINES) {
  const files = glob.sync(pattern, { ignore: ['**/node_modules/**', '**/dist/**', '**/*.test.*'] });

  const errors = [];
  const warnings = [];
  const infos = [];

  files.forEach(file => {
    const lines = countLines(file);

    if (lines > maxLines) {
      errors.push({ file, lines });
    } else if (lines > WARNING_LINES) {
      warnings.push({ file, lines });
    } else if (lines > INFO_LINES) {
      infos.push({ file, lines });
    }
  });

  return { errors, warnings, infos };
}

function main() {
  console.log('🔍 开始检查文件大小...\n');

  // 检查组件文件
  const components = checkFiles('src/components/**/*.{ts,tsx}');
  const hooks = checkFiles('src/hooks/**/*.ts');
  const utils = checkFiles('src/utils/**/*.ts', WARNING_LINES);

  const allErrors = [...components.errors, ...hooks.errors, ...utils.errors];
  const allWarnings = [...components.warnings, ...hooks.warnings, ...utils.warnings];

  if (allErrors.length > 0) {
    console.error('🚫 错误（必须立即处理）:\n');
    allErrors.forEach(({ file, lines }) => {
      console.error(`   ❌ ${file} - ${lines} 行 (超过 ${MAX_LINES} 行)`);
    });
    console.error('');
  }

  if (allWarnings.length > 0) {
    console.warn('⚠️  警告（建议本周内处理）:\n');
    allWarnings.forEach(({ file, lines }) => {
      console.warn(`   ⚠️  ${file} - ${lines} 行 (超过 ${WARNING_LINES} 行)`);
    });
    console.warn('');
  }

  if (allErrors.length > 0) {
    console.error('================================================================================');
    console.error('🔴 发现严重问题！请立即处理超过 500 行的文件。');
    console.error('================================================================================\n');
    process.exit(1);
  }

  console.log('✅ 文件大小检查通过！\n');
}

main();
```

### 第 3 步：配置 package.json

```json
{
  "scripts": {
    "check-file-size": "node scripts/check-file-size.js",
    "precommit": "npm run check-file-size",
    "prepare": "husky install"
  }
}
```

### 第 4 步：配置 Git Hooks

```bash
# 初始化 Husky
npx husky install

# 创建 pre-commit hook
npx husky add .husky/pre-commit "npm run check-file-size"
```

`.husky/pre-commit` 内容：

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 运行文件大小检查..."

npm run check-file-size

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ 提交被拒绝：存在超过 500 行的文件"
  echo ""
  echo "📋 解决方案："
  echo "   1. 运行 'npm run check-file-size' 查看问题文件"
  echo "   2. 将超标文件拆分为多个小文件"
  echo "   3. 使用 Hook 提取业务逻辑"
  echo "   4. 使用子组件拆分 UI"
  echo ""
  echo "💡 参考文档："
  echo "   - docs/architecture-guide.md"
  echo "   - ai-templates/REFACTORING_LESSONS_LEARNED.md"
  echo ""
  exit 1
fi

echo "✅ 文件大小检查通过"
```

### 第 5 步：配置 ESLint（可选）

`.eslintrc.js`:

```javascript
module.exports = {
  rules: {
    // 文件最大行数
    'max-lines': ['error', {
      max: 500,
      skipBlankLines: true,
      skipComments: true
    }],

    // 函数最大行数
    'max-lines-per-function': ['warn', {
      max: 50,
      skipBlankLines: true,
      skipComments: true
    }],

    // 文件最大语句数
    'max-statements': ['warn', 50],

    // 复杂度限制
    'complexity': ['warn', 10]
  }
};
```

### 第 6 步：配置 VS Code（可选）

`.vscode/settings.json`:

```json
{
  "editor.rulers": [200, 300, 400, 500],
  "files.associations": {
    "*.tsx": "typescriptreact",
    "*.ts": "typescript"
  },
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

---

## 🔒 CI/CD 集成

### GitHub Actions

创建 `.github/workflows/code-quality.yml`:

```yaml
name: Code Quality Check

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  check-file-size:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run file size check
        run: npm run check-file-size

      - name: Comment PR (if failed)
        if: failure() && github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '❌ **文件大小检查失败**\n\n存在超过 500 行的文件。请先重构后再合并。\n\n查看 [检查日志](${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}) 了解详情。'
            })
```

### GitLab CI

`.gitlab-ci.yml`:

```yaml
check-file-size:
  stage: test
  script:
    - npm ci
    - npm run check-file-size
  only:
    - merge_requests
    - main
    - develop
```

---

## 📋 开发工作流

### 新功能开发前

**必须完成的检查清单**：

```
□ 1. 估算新功能代码行数
     方法：参考类似功能 × 1.5（保守估计）

□ 2. 检查目标文件当前大小
     运行：wc -l src/path/to/file.tsx

□ 3. 计算最终大小
     当前行数 + 预估行数 = ?

□ 4. 判断是否需要拆分
     - 如果 < 300 行：可以直接添加
     - 如果 300-400 行：建议先拆分
     - 如果 > 400 行：必须先拆分

□ 5. 创建拆分方案（如果需要）
     - 确定需要创建的 Hook 文件
     - 确定需要创建的组件文件
     - 规划代码组织结构

□ 6. 开始实现
     严格按照拆分方案执行
```

### 代码审查时

**Reviewer 必须检查**：

```
□ 1. 所有修改的文件都 < 500 行
□ 2. 所有新增的文件都 < 300 行
□ 3. 没有超过 50 行的函数
□ 4. 业务逻辑已提取到 Hook
□ 5. UI 组件没有复杂的业务逻辑
□ 6. 没有"临时"代码需要"稍后重构"
□ 7. CI 检查全部通过
```

---

## 🛠️ 重构指南

### 何时重构？

| 文件大小 | 行动 | 时机 |
|---------|------|------|
| **200-300 行** | 评估是否需要拆分 | 可以等到合适时机 |
| **300-400 行** | 规划拆分方案 | 本周内完成 |
| **400-500 行** | 立即开始拆分 | 立即（不得添加新代码） |
| **> 500 行** | 强制重构 | 提交被拒绝 |

### 拆分策略

#### 1. 提取 Hook（优先）

```typescript
// ❌ Before: 业务逻辑在组件中
function MyComponent() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // 100+ 行的业务逻辑
  const fetchData = async () => { /* ... */ };
  const processData = () => { /* ... */ };
  const saveData = async () => { /* ... */ };

  return <div>...</div>;
}

// ✅ After: 业务逻辑在 Hook 中
function MyComponent() {
  const { data, loading, fetchData, processData, saveData } = useMyData();
  return <div>...</div>;
}
```

#### 2. 拆分子组件（次要）

```typescript
// ❌ Before: 大型组件
function BigComponent() {
  return (
    <div>
      {/* 200 行的 Header */}
      {/* 200 行的 Body */}
      {/* 100 行的 Footer */}
    </div>
  );
}

// ✅ After: 拆分子组件
function BigComponent() {
  return (
    <div>
      <Header />
      <Body />
      <Footer />
    </div>
  );
}
```

#### 3. 提取配置和常量

```typescript
// ❌ Before: 配置在组件中
function MyComponent() {
  const options = {
    /* 100 行的配置对象 */
  };

  return <Select options={options} />;
}

// ✅ After: 配置独立
// constants/myOptions.ts
export const MY_OPTIONS = { /* ... */ };

// MyComponent.tsx
import { MY_OPTIONS } from '../constants/myOptions';

function MyComponent() {
  return <Select options={MY_OPTIONS} />;
}
```

---

## 🎯 成功案例

### 案例 1：EditRequirementModal.tsx

**问题**：
- 原始大小：2229 行
- 包含：40+ useState，大量业务逻辑，复杂 UI

**解决方案**：
1. 提取 3 个 Hook（表单、文档、AI）
2. 提取 2 个子组件（预览、结果面板）
3. 主组件只保留状态协调和布局

**结果**：
- 最终大小：442 行（-80%）
- 创建文件：5 个
- 耗时：2-3 小时

**关键经验**：
> 业务逻辑一律提取到 Hook，UI 拆分为子组件

---

### 案例 2：ImportPreviewModal.tsx

**问题**：
- 原始大小：1082 行
- 大段相似的 JSX 代码
- 多个独立的功能区域

**解决方案**：
1. 识别 6 个独立的 UI 区域
2. 每个区域提取为独立组件
3. 主组件只负责组合

**结果**：
- 最终大小：361 行（-67%）
- 创建文件：6 个
- 耗时：1-2 小时

**关键经验**：
> 大段 JSX 代码应该拆分为独立组件，而不是留在一个文件中

---

## ⚠️ 常见误区

### 误区 1："稍后重构"

```
❌ 错误想法：
   "现在先快速实现，等功能稳定了再重构"

✅ 正确做法：
   "在实现功能的同时就保持代码质量"

💡 原因：
   所有"临时"代码都会变成永久代码
   "稍后"永远不会到来
```

### 误区 2："只超一点点"

```
❌ 错误想法：
   "文件 520 行，只超了 20 行，应该没关系"

✅ 正确做法：
   "500 行是红线，超过 1 行也必须重构"

💡 原因：
   破窗效应：一旦突破红线，就会持续恶化
   从 520 行到 1000 行只需要几次提交
```

### 误区 3："拆分会增加复杂度"

```
❌ 错误想法：
   "拆分成多个文件，反而更难理解"

✅ 正确做法：
   "适当的拆分会降低复杂度"

💡 原因：
   3000 行的单文件 >> 10 个 300 行的文件
   单一职责的小文件更易于理解和维护
```

---

## 📚 相关文档

- [重构经验教训](./REFACTORING_LESSONS_LEARNED.md) - 详细的案例分析
- [架构指导原则](../docs/architecture-guide.md) - 架构规范
- [新功能开发流程](../docs/new-feature-workflow.md) - 开发流程
- [代码审查检查清单](../docs/code-review-checklist.md) - Review 标准

---

## 🔗 快速链接

### 遇到问题时

| 问题 | 查看 |
|------|------|
| 文件超过 500 行怎么办？ | [重构指南](#重构指南) |
| 如何拆分大型组件？ | [拆分策略](#拆分策略) |
| 如何提取业务逻辑？ | [成功案例](#成功案例) |
| Git hook 报错怎么解决？ | [新项目初始化](#新项目初始化检查清单) |

---

**文档版本**：v1.0
**适用项目**：所有 React/TypeScript 项目
**强制级别**：🔴 **必须遵守**
**最后更新**：2025-10-21
