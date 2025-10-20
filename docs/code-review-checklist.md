# 代码审查检查清单

**版本**: 1.5.0
**更新日期**: 2025-01-20
**适用于**: Pull Request 审查、代码提交前自查

本文档提供标准化的代码审查检查清单，确保代码质量和一致性。

---

## 📋 使用方式

### PR作者（提交前自查）

1. 复制下方相关检查清单到PR描述中
2. 逐项检查，在完成的项目前打勾 `[x]`
3. 未涉及的项目可删除或标记为 N/A

### PR审查者

1. 按清单逐项审查代码
2. 发现问题时，引用清单项编号（如 `B-2`）
3. 确保所有必选项（标记⭐）都已通过

---

## 🎯 通用检查清单

### A. 代码质量

- [ ] **A-1** ⭐ 代码通过 TypeScript 编译（`npm run build` 无错误）
- [ ] **A-2** ⭐ 代码通过 ESLint 检查（无 error，warning 有说明）
- [ ] **A-3** 代码符合项目编码规范（缩进、命名、注释）
- [ ] **A-4** 无 console.log / console.error 等调试代码（除非用于错误处理）
- [ ] **A-5** 无注释掉的代码块（应删除）
- [ ] **A-6** 无 TODO/FIXME 注释（应创建 Issue）
- [ ] **A-7** 函数/组件长度合理（< 50行为佳，最多不超过 100行）
- [ ] **A-8** 文件大小符合规范（< 500行，推荐 200-300行）

### B. 数据模型与类型安全 ⭐⭐⭐

- [ ] **B-1** ⭐ 新增的枚举类型是否定义为联合类型（而非 `string`）？
  ```typescript
  // ❌ 错误
  status: string;

  // ✅ 正确
  type Status = 'pending' | 'active' | 'completed';
  status: Status;
  ```

- [ ] **B-2** ⭐ 是否在常量文件中定义了所有可能的值？
  ```typescript
  // constants/status.ts
  export const STATUS = {
    PENDING: 'pending' as const,
    ACTIVE: 'active' as const,
    COMPLETED: 'completed' as const,
  } as const;
  ```

- [ ] **B-3** ⭐ 所有使用该字段的组件是否处理了所有可能的值？
  ```typescript
  // ❌ 错误：遗漏 'pending'
  if (status === 'active') { ... }
  else if (status === 'completed') { ... }

  // ✅ 正确：穷举所有值
  if (status === STATUS.PENDING) { ... }
  else if (status === STATUS.ACTIVE) { ... }
  else if (status === STATUS.COMPLETED) { ... }
  else { /* 处理未知值 */ }
  ```

- [ ] **B-4** 是否添加了运行时验证（开发环境）？
  ```typescript
  if (import.meta.env.DEV) {
    validateStatus(data.status);
  }
  ```

- [ ] **B-5** 默认值是否在常量文件中定义？
  ```typescript
  // ❌ 错误
  const [status, setStatus] = useState('pending');

  // ✅ 正确
  const [status, setStatus] = useState(STATUS.PENDING);
  ```

### C. UI 渲染逻辑

- [ ] **C-1** ⭐ 筛选/分组逻辑是否穷举了所有可能的状态？
  ```typescript
  // ❌ 错误：'pending' 状态会被遗漏
  const activeItems = items.filter(i => i.status === 'active');
  const completedItems = items.filter(i => i.status === 'completed');

  // ✅ 正确：使用辅助函数或明确的分组
  const activeItems = items.filter(i => isActive(i.status));
  const nonActiveItems = items.filter(i => !isActive(i.status));
  ```

- [ ] **C-2** ⭐ 是否验证了分组完整性？
  ```typescript
  // 添加断言
  debugAssert(
    filtered.length === group1.length + group2.length,
    '分组逻辑有遗漏'
  );
  ```

- [ ] **C-3** 条件渲染是否有 else/默认分支？
  ```typescript
  // ❌ 可能有遗漏
  {status === 'active' && <ActiveUI />}
  {status === 'completed' && <CompletedUI />}

  // ✅ 有默认处理
  {status === 'active' ? <ActiveUI /> :
   status === 'completed' ? <CompletedUI /> :
   <DefaultUI />}
  ```

- [ ] **C-4** React key 是否唯一且稳定？
  ```typescript
  // ❌ 错误
  {items.map((item, index) => <Item key={index} ... />)}

  // ✅ 正确
  {items.map(item => <Item key={item.id} ... />)}
  ```

### D. 状态管理

- [ ] **D-1** Store 操作是否正确更新相关状态？
  ```typescript
  // 例如：addRequirement 同时更新 requirements 和 unscheduled
  ```

- [ ] **D-2** 是否避免了直接修改状态（保持不可变性）？
  ```typescript
  // ❌ 错误
  requirements.push(newReq);

  // ✅ 正确
  setRequirements([...requirements, newReq]);
  ```

- [ ] **D-3** 异步操作是否正确处理错误？
  ```typescript
  try {
    await fetchData();
  } catch (error) {
    showToast('操作失败', 'error');
    console.error(error);
  }
  ```

### E. 测试覆盖

- [ ] **E-1** 核心业务逻辑是否有单元测试？
- [ ] **E-2** 边界情况是否有测试覆盖？
  - 空数组
  - undefined/null 值
  - 极端数值（0, 负数, 超大数）
  - 特殊字符串
- [ ] **E-3** 测试是否通过（`npm run test`）？

### F. 性能考量

- [ ] **F-1** 是否避免了不必要的重渲染？
  - 使用 useMemo / useCallback
  - 合理使用 React.memo
- [ ] **F-2** 列表渲染是否使用了虚拟滚动（数据量 > 100）？
- [ ] **F-3** 是否避免了在渲染函数中创建新对象/数组？
  ```typescript
  // ❌ 错误：每次渲染都创建新对象
  <Component style={{ color: 'red' }} />

  // ✅ 正确：提取到常量
  const redStyle = { color: 'red' };
  <Component style={redStyle} />
  ```

### G. 用户体验

- [ ] **G-1** 加载状态是否有友好提示？
- [ ] **G-2** 错误是否有明确的提示信息？
- [ ] **G-3** 操作是否有成功反馈（Toast/通知）？
- [ ] **G-4** 危险操作是否有二次确认？
- [ ] **G-5** 表单验证是否及时且准确？

### H. 可维护性

- [ ] **H-1** 复杂逻辑是否有注释说明？
- [ ] **H-2** 魔法数字是否提取为常量？
  ```typescript
  // ❌ 错误
  if (score >= 70) { ... }

  // ✅ 正确
  const HIGH_SCORE_THRESHOLD = 70;
  if (score >= HIGH_SCORE_THRESHOLD) { ... }
  ```
- [ ] **H-3** 重复代码是否提取为函数/组件？
  - 出现3次以上应提取
- [ ] **H-4** 文件/函数命名是否清晰表达用途？

---

## 🔍 特定场景检查清单

### 场景1：添加新的枚举状态

**适用于**：添加新的 techProgress、productProgress、status 等枚举值

- [ ] **S1-1** ⭐ 在类型定义文件中添加新值（`src/types/*.ts`）
- [ ] **S1-2** ⭐ 在常量文件中添加对应常量（`src/constants/*.ts`）
- [ ] **S1-3** ⭐ 搜索所有使用该枚举的地方，确保处理新值
  ```bash
  # 搜索命令
  grep -r "techProgress ===" src/
  grep -r "switch.*techProgress" src/
  ```
- [ ] **S1-4** ⭐ 更新所有 if/else 或 switch 分支
- [ ] **S1-5** 更新下拉选择器的 options
- [ ] **S1-6** 更新单元测试的测试用例
- [ ] **S1-7** 更新文档（如有）

**检查方式**：
```typescript
// 使用 TypeScript 的 never 类型检查穷举性
type Status = 'pending' | 'active' | 'completed';

function handleStatus(status: Status) {
  if (status === 'pending') { ... }
  else if (status === 'active') { ... }
  else if (status === 'completed') { ... }
  else {
    // 如果漏了某个值，这里会报类型错误
    const _exhaustiveCheck: never = status;
    throw new Error(`Unhandled status: ${status}`);
  }
}
```

### 场景2：修改数据筛选/分组逻辑

**适用于**：修改 filter、sort、group 等数据处理逻辑

- [ ] **S2-1** ⭐ 验证分组完整性（总数 = 各组之和）
  ```typescript
  debugAssert(
    filtered.length === group1.length + group2.length + group3.length,
    '分组逻辑有遗漏',
    { filtered: filtered.length, g1: group1.length, g2: group2.length, g3: group3.length }
  );
  ```
- [ ] **S2-2** ⭐ 使用 debugRenderPipeline 追踪数据流转
- [ ] **S2-3** 测试边界情况：
  - 空数组
  - 单个元素
  - 所有元素都满足条件
  - 所有元素都不满足条件
- [ ] **S2-4** 添加单元测试覆盖新的筛选逻辑

### 场景3：新增React组件

**适用于**：创建新的组件文件

- [ ] **S3-1** 组件文件大小 < 500行（推荐 200-300行）
- [ ] **S3-2** Props 类型是否明确定义？
- [ ] **S3-3** 必需 props 和可选 props 是否清晰区分？
- [ ] **S3-4** 是否使用 React.memo（如果是纯展示组件）？
- [ ] **S3-5** 是否导出组件的 Props 类型（方便其他地方使用）？
  ```typescript
  export interface MyComponentProps {
    data: Data[];
    onSelect: (id: string) => void;
  }

  export const MyComponent: React.FC<MyComponentProps> = ({ data, onSelect }) => {
    // ...
  };
  ```
- [ ] **S3-6** 是否编写了基本的单元测试？

### 场景4：修改 Store 逻辑

**适用于**：修改 Zustand store 的 actions

- [ ] **S4-1** ⭐ 是否正确更新了所有相关状态？
  - 例如：删除需求时，同时更新 requirements、unscheduled、sprintPools
- [ ] **S4-2** ⭐ 是否验证了数据完整性？
  ```typescript
  // 使用 healthCheck
  validateDataIntegrity();
  ```
- [ ] **S4-3** 是否保持了数据的不可变性？
- [ ] **S4-4** 是否添加了错误处理？
- [ ] **S4-5** 是否考虑了并发操作的影响？

---

## 🚀 自动化检查

在提交前自动运行以下命令：

```bash
# 1. TypeScript 编译检查
npx tsc --noEmit

# 2. 代码格式检查
npm run lint

# 3. 单元测试
npm run test

# 4. 构建验证
npm run build

# 5. 文件大小检查
npm run check-file-size
```

建议配置 Git pre-commit hook：

```bash
# .git/hooks/pre-commit
#!/bin/sh

echo "🔍 Running pre-commit checks..."

# TypeScript check
if ! npx tsc --noEmit; then
  echo "❌ TypeScript check failed"
  exit 1
fi

# File size check
if ! npm run check-file-size; then
  echo "❌ File size check failed"
  exit 1
fi

echo "✅ Pre-commit checks passed"
exit 0
```

---

## 📊 PR 描述模板

复制以下模板到 PR 描述中：

````markdown
## 📝 变更说明

<!-- 简要描述本次变更的目的和内容 -->

## 🎯 变更类型

- [ ] 🐛 Bug 修复
- [ ] ✨ 新功能
- [ ] 🔨 重构
- [ ] 📝 文档更新
- [ ] 🎨 样式调整
- [ ] ⚡ 性能优化
- [ ] 🧪 测试相关

## ✅ 自查清单

### 代码质量
- [ ] TypeScript 编译通过
- [ ] ESLint 检查通过
- [ ] 无调试代码

### 数据模型（如适用）
- [ ] 枚举类型已定义为联合类型
- [ ] 常量已在 constants/ 中定义
- [ ] 所有使用处已处理所有可能值
- [ ] 已添加运行时验证

### UI 渲染（如适用）
- [ ] 分组逻辑已穷举所有状态
- [ ] 已验证分组完整性
- [ ] React key 唯一且稳定

### 测试
- [ ] 单元测试已添加/更新
- [ ] 所有测试通过

## 🧪 测试步骤

<!-- 描述如何测试本次变更 -->

1.
2.
3.

## 📸 截图（如适用）

<!-- 添加前后对比截图 -->

## 🔗 相关 Issue

<!-- 关联的 Issue 编号 -->

Closes #

## 📋 审查要点

<!-- 提醒审查者特别关注的地方 -->

-
-

````

---

## 💡 常见问题

### Q1: 如何处理遗留代码不符合规范的情况？

**A**:
- 新代码必须符合规范
- 修改遗留代码时，顺便重构为符合规范
- 大规模重构应单独创建 Issue/PR

### Q2: 检查清单太长，每次都要全部检查吗？

**A**:
- 标记⭐的是必选项，必须检查
- 其他项根据变更类型选择相关的检查
- 建议PR作者在描述中只保留相关检查项

### Q3: 如何确保团队成员都遵守检查清单？

**A**:
- 在 PR 模板中嵌入检查清单
- Code Review 时引用检查项编号
- 定期 Review 会议上讨论常见问题

---

**最后更新**: 2025-01-20
**维护者**: Claude Code Team

有改进建议欢迎提交 PR！
