# 测试驱动开发（TDD）强制规范

**文档版本**: v1.0.0
**最后更新**: 2025-11-14
**执行级别**: 🔴 **强制执行（MANDATORY）**

---

## ⚠️ 重要声明

**本规范不是建议，是命令！**

所有新功能开发、Bug修复、代码重构**必须**遵守本规范，违反者代码将被**拒绝提交**。

---

## 📋 目录

1. [核心原则](#核心原则)
2. [测试覆盖率要求](#测试覆盖率要求)
3. [测试分层架构](#测试分层架构)
4. [开发流程](#开发流程)
5. [质量门禁](#质量门禁)
6. [强制执行机制](#强制执行机制)

---

## 🎯 核心原则

### 1. 先写测试，再写代码

```
❌ 错误流程：
1. 写功能代码
2. 写测试（如果有时间的话）
3. 提交

✅ 正确流程：
1. 写失败的测试（Red）
2. 写最少的代码使测试通过（Green）
3. 重构优化（Refactor）
4. 提交
```

### 2. 测试即文档

- 每个测试用例都是功能的可执行文档
- 测试名称必须清晰描述行为
- 使用Given-When-Then模式

### 3. 快速反馈

- 单元测试必须在1秒内完成
- 所有测试必须在30秒内完成
- CI/CD管道必须在5分钟内完成

---

## 📊 测试覆盖率要求

### 强制性覆盖率指标

| 类型 | 最低覆盖率 | 目标覆盖率 |
|-----|----------|----------|
| **工具函数** (utils/) | 95% | 100% |
| **业务逻辑** (hooks/, services/) | 85% | 95% |
| **UI组件** (components/) | 75% | 85% |
| **整体项目** | 80% | 90% |

### 检查命令

```bash
# 运行测试并生成覆盖率报告
npm run test:coverage

# 覆盖率未达标将导致构建失败
```

---

## 🏗️ 测试分层架构

### 层级1: 单元测试（Unit Tests）

**测试范围**：独立函数、工具类
**工具**：Vitest + Testing Library
**位置**：`src/**/__tests__/*.test.ts`

**示例**：
```typescript
// src/utils/__tests__/scoring.test.ts
import { describe, it, expect } from 'vitest';
import { calculateScores } from '../scoring';

describe('calculateScores', () => {
  it('should calculate WSJF score correctly', () => {
    const requirement = {
      businessValue: 8,
      timeCriticality: 7,
      riskReduction: 6,
      effort: 5
    };

    const result = calculateScores(requirement);

    expect(result.wsjfScore).toBe(4.2); // (8+7+6)/5
    expect(result.stars).toBeGreaterThanOrEqual(2);
    expect(result.stars).toBeLessThanOrEqual(5);
  });
});
```

### 层级2: 组件测试（Component Tests）

**测试范围**：React组件渲染、交互
**工具**：Vitest + React Testing Library
**位置**：`src/components/__tests__/*.test.tsx`

**示例**：
```typescript
// src/components/__tests__/RequirementCard.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RequirementCard from '../RequirementCard';

describe('RequirementCard', () => {
  it('should display requirement name', () => {
    const req = {
      id: '1',
      name: '测试需求',
      displayScore: 80,
      stars: 4
    };

    render(<RequirementCard requirement={req} />);

    expect(screen.getByText('测试需求')).toBeInTheDocument();
  });
});
```

### 层级3: E2E测试（End-to-End Tests）

**测试范围**：完整用户流程
**工具**：Chrome DevTools MCP
**位置**：`tests/e2e/*.test.ts`

**示例**：
```typescript
// tests/e2e/requirement-workflow.test.ts
import { describe, it } from 'vitest';
import { chromeDevTools } from '@testing-library/chrome-devtools';

describe('需求管理完整流程', () => {
  it('用户可以创建、编辑、删除需求', async () => {
    await chromeDevTools.navigate('http://localhost:3000');
    await chromeDevTools.click('新增需求');
    await chromeDevTools.fill('需求名称', '新功能');
    await chromeDevTools.click('保存');

    expect(await chromeDevTools.findText('新功能')).toBeTruthy();
  });
});
```

---

## 🔄 开发流程（强制）

### 新功能开发

```bash
# 1. 创建功能分支
git checkout -b feature/new-feature

# 2. 编写失败的测试（Red）
vi src/utils/__tests__/newFeature.test.ts

# 3. 运行测试（应该失败）
npm run test:run  # ❌ FAIL

# 4. 实现功能代码（Green）
vi src/utils/newFeature.ts

# 5. 运行测试（应该通过）
npm run test:run  # ✅ PASS

# 6. 重构优化（Refactor）
# 优化代码，确保测试仍然通过

# 7. 提交（自动运行测试）
git add .
git commit -m "feat: add new feature"
# Pre-commit hook会自动运行测试
```

### Bug修复

```bash
# 1. 编写重现Bug的测试
vi src/utils/__tests__/bugFix.test.ts
# 测试应该失败，证明Bug存在

# 2. 修复Bug
vi src/utils/problemFile.ts

# 3. 测试应该通过
npm run test:run

# 4. 提交
git commit -m "fix: resolve bug #123"
```

###重构代码

```bash
# 1. 确保现有测试通过
npm run test:run  # ✅ 全部通过

# 2. 执行重构
# 修改代码结构，保持功能不变

# 3. 测试仍然通过
npm run test:run  # ✅ 仍然全部通过

# 4. 如果测试失败，说明重构破坏了功能
# 必须回滚或修复
```

---

## 🚫 质量门禁

### Pre-commit（提交前检查）

**自动执行**：`npm run pre-commit`

- ✅ 文件大小检查（< 500行）
- ✅ 单元测试通过（100%）
- ✅ 类型检查通过（tsc）

**不通过 = 无法提交**

### Pre-deploy（部署前检查）

**手动执行**：`npm run deploy:tencent`

- ✅ 所有测试通过
- ✅ 测试覆盖率 ≥ 80%
- ✅ 构建成功
- ✅ 无TypeScript错误

**不通过 = 无法部署**

---

## 🔒 强制执行机制

### 1. Git Pre-commit Hook

**文件**：`.husky/pre-commit`

```bash
#!/bin/sh
# WSJF Sprint Planner - Pre-commit Hook
# 强制执行测试和代码质量检查

echo "🔍 Running pre-commit checks..."

# 文件大小检查
npm run check-file-size || exit 1

# 运行所有测试
echo "🧪 Running tests..."
npm run test:run || exit 1

echo "✅ Pre-commit checks passed!"
```

### 2. CI/CD Pipeline

**文件**：`.github/workflows/test.yml`

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - run: npm install
      - run: npm run test:run
      - run: npm run test:coverage

      # 上传覆盖率报告
      - uses: codecov/codecov-action@v3
```

### 3. 代码审查检查清单

**必须包含**：
- [ ] 新功能有对应的测试
- [ ] 测试覆盖了正常流程和边界情况
- [ ] 测试命名清晰，易于理解
- [ ] 测试通过率100%
- [ ] 覆盖率达标

---

## 📝 测试编写规范

### 测试文件命名

```
src/utils/scoring.ts          → src/utils/__tests__/scoring.test.ts
src/components/Header.tsx     → src/components/__tests__/Header.test.tsx
src/hooks/useFeishuAuth.ts    → src/hooks/__tests__/useFeishuAuth.test.ts
```

### 测试用例命名

```typescript
// ❌ 不好的命名
it('test 1', () => {});
it('should work', () => {});

// ✅ 好的命名
it('should calculate WSJF score when all inputs are valid', () => {});
it('should throw error when effort is zero', () => {});
it('should display requirement name on card', () => {});
```

### Arrange-Act-Assert 模式

```typescript
it('should add requirement to sprint pool', () => {
  // Arrange - 准备测试数据
  const pool = { id: '1', requirements: [] };
  const req = { id: 'req-1', name: '需求' };

  // Act - 执行操作
  const result = addRequirementToPool(pool, req);

  // Assert - 验证结果
  expect(result.requirements).toHaveLength(1);
  expect(result.requirements[0]).toBe(req);
});
```

---

## 🎯 测试覆盖重点

### 必须测试的场景

1. **正常流程（Happy Path）**
   - 用户正确使用功能
   - 所有输入有效

2. **边界条件（Edge Cases）**
   - 空值、零值、负值
   - 最小值、最大值
   - 空数组、空对象

3. **异常处理（Error Cases）**
   - 无效输入
   - 网络错误
   - 权限不足

4. **业务规则（Business Rules）**
   - WSJF评分算法
   - 需求筛选逻辑
   - 数据验证规则

---

## 📈 测试度量指标

### 每次提交必须检查

```bash
# 运行测试
npm run test:run

# 检查输出
# Test Files: X passed
# Tests: Y passed
# Coverage: Z%
```

### 必达指标

- ✅ 测试通过率：100%
- ✅ 语句覆盖率：≥ 80%
- ✅ 分支覆盖率：≥ 75%
- ✅ 函数覆盖率：≥ 85%
- ✅ 行覆盖率：≥ 80%

---

## 🚀 快速开始

### 创建新测试

```bash
# 1. 创建测试文件
touch src/utils/__tests__/myUtil.test.ts

# 2. 编写测试
# 参考上面的示例

# 3. 运行测试
npm run test

# 4. 查看覆盖率
npm run test:coverage
```

### 调试测试

```bash
# UI模式（推荐）
npm run test:ui

# Watch模式
npm run test

# 运行特定文件
npx vitest scoring.test.ts
```

---

## ⚡ 常见问题

### Q: 时间紧迫，可以跳过测试吗？

**A: 绝对不行！** 测试是代码质量的保证，跳过测试会导致：
- Bug增加
- 重构困难
- 技术债务累积
- 团队信任度下降

**正确做法**：优先编写核心功能测试，非核心功能可以降低覆盖率要求（但不能没有）。

### Q: 遗留代码没有测试怎么办？

**A: 渐进式补充**
1. 新功能必须有测试（100%）
2. 修改遗留代码时补充测试
3. 每个Sprint至少为1个遗留模块补充测试
4. 目标：6个月内达到80%覆盖率

### Q: 测试失败可以先提交吗？

**A: 绝对不行！** Pre-commit hook会拦截。如果确实需要保存进度：
```bash
git stash  # 暂存代码
# 修复测试后
git stash pop  # 恢复代码
git commit  # 提交
```

---

## 📚 测试示例库

### 工具函数测试

```typescript
// src/utils/__tests__/scoring.test.ts
describe('calculateScores', () => {
  it('should handle zero effort gracefully', () => {
    const req = { businessValue: 8, timeCriticality: 7, effort: 0 };
    expect(() => calculateScores(req)).toThrow('Effort cannot be zero');
  });

  it('should return 5 stars for high WSJF score', () => {
    const req = { businessValue: 10, timeCriticality: 10, effort: 1 };
    const result = calculateScores(req);
    expect(result.stars).toBe(5);
  });
});
```

### React组件测试

```typescript
// src/components/__tests__/Header.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';

describe('Header', () => {
  it('should call onImport when import button clicked', () => {
    const mockOnImport = vi.fn();
    render(<Header onImport={mockOnImport} />);

    fireEvent.click(screen.getByRole('button', { name: /导入/i }));

    expect(mockOnImport).toHaveBeenCalledTimes(1);
  });
});
```

### Hook测试

```typescript
// src/hooks/__tests__/useToast.test.ts
import { renderHook, act } from '@testing-library/react';

describe('useToast', () => {
  it('should add and dismiss toast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('测试消息', 'success');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('测试消息');
  });
});
```

---

## 🔧 配置文件

### Vitest配置

**文件**：`vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.{ts,tsx}',
        '**/__tests__/',
      ],
      thresholds: {
        lines: 80,
        functions: 85,
        branches: 75,
        statements: 80,
      },
    },
  },
});
```

### Test Setup

**文件**：`src/test/setup.ts`

```typescript
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// 每个测试后清理
afterEach(() => {
  cleanup();
});
```

---

## 📋 检查清单

### 提交前检查（Mandatory）

- [ ] 所有新代码有对应测试
- [ ] 测试通过率100%
- [ ] 覆盖率达标（工具函数95%+, 业务逻辑85%+, 组件75%+）
- [ ] 无TypeScript错误
- [ ] 无ESLint警告
- [ ] 文件大小< 500行

### 代码审查检查（Mandatory）

- [ ] 测试覆盖了主要场景
- [ ] 测试命名清晰
- [ ] 测试独立，不依赖执行顺序
- [ ] 无硬编码的测试数据
- [ ] Mock使用正确
- [ ] 异步测试处理正确

---

## 🎓 学习资源

- [Vitest文档](https://vitest.dev/)
- [Testing Library最佳实践](https://testing-library.com/docs/guiding-principles/)
- [TDD实践指南](https://martinfowler.com/bliki/TestDrivenDevelopment.html)

---

## 🔄 规范更新

本规范会根据实践经验持续更新：

- 每月Review一次
- 团队会议讨论优化点
- 新的最佳实践及时补充

---

**记住：测试不是负担，是质量保证！** 🎯

**不写测试 = 不负责任 = 代码被拒绝** ❌

**先写测试 = 高质量代码 = 团队信任** ✅
