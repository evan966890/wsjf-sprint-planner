# 常见坑点和历史教训

本文档记录项目中反复出现的问题和相应的解决方案，作为血泪教训警示后来者。

---

## ⚠️ 严重Bug：按钮缺少 type 属性

### 🔴 问题严重程度：高危

**症状**：
- 页面刷新时自动下载 HTML 文件
- 点击按钮后页面意外刷新
- 表单数据丢失

**发生次数**：已出现 3+ 次
- ❌ v1.5.0: EditRequirementModal 所有按钮缺少 type
- ❌ v1.6.0: 再次发现多个按钮缺少 type
- ✅ v1.6.1: 批量修复并加入强制规范

### 根本原因

```typescript
// ❌ 错误写法（HTML默认行为）
<button onClick={handleClick}>删除</button>
// 默认 type="submit"，会触发表单提交
```

**HTML规范**：
- `<button>` 的默认 type 是 `"submit"`
- 在表单中会触发提交事件
- React中即使不在form里，某些情况下也会触发

### ✅ 正确写法

```typescript
// ✅ 普通按钮
<button type="button" onClick={handleClick}>删除</button>

// ✅ 表单提交按钮
<button type="submit">提交</button>

// ✅ 重置按钮
<button type="reset">重置</button>
```

### 预防措施

1. **ESLint 规则**（已配置）：
```json
{
  "rules": {
    "react/button-has-type": "error"
  }
}
```

2. **代码检查脚本**：
```bash
# 查找所有缺少 type 的按钮
grep -rn "<button(?!\s+type=)" src/**/*.tsx
```

3. **Code Review 检查清单**：
   - [ ] 所有 `<button>` 都有 type 属性
   - [ ] 普通按钮使用 `type="button"`
   - [ ] 提交按钮使用 `type="submit"`

4. **VS Code 代码片段**（推荐）：
```json
{
  "React Button": {
    "prefix": "btn",
    "body": [
      "<button type=\"button\" onClick={$1}>",
      "  $2",
      "</button>"
    ]
  }
}
```

---

## ⚠️ 用户体验：系统默认弹出框

### 🟡 问题严重程度：中等

**症状**：
- 使用原生 `confirm()`, `alert()`, `prompt()`
- 样式与应用不一致
- 无法定制外观和行为
- E2E测试困难

**发生次数**：项目中有 21+ 处使用

### ✅ 解决方案

使用自定义 ConfirmDialog 和 Toast 组件：

```typescript
// ❌ 错误
if (confirm('确定删除吗？')) {
  deleteItem();
}
alert('删除成功！');

// ✅ 正确
const { showConfirm } = useConfirmDialog();
const { showToast } = useToast();

const confirmed = await showConfirm({
  title: '确认删除',
  message: '确定要删除吗？此操作不可撤销。',
  type: 'danger',
});

if (confirmed) {
  deleteItem();
  showToast('删除成功！', 'success');
}
```

### 预防措施

1. **ESLint 规则**（已配置）：
```json
{
  "rules": {
    "no-alert": "error",
    "no-restricted-globals": ["error", "confirm", "prompt"]
  }
}
```

2. **组件文档**：
   - [ConfirmDialog 使用指南](./standards/ui-design-standards.md#确认弹窗和提示)

---

## 📏 技术债务：文件大小超限

### 🟠 问题严重程度：中等（长期影响大）

**现状**：5个文件超过500行限制
- EditRequirementModal.tsx (2170行)
- FeishuImportModal.tsx (723行)
- wsjf-sprint-planner.tsx (546行)
- feishuApi.ts (539行)
- useStore.ts (529行)

### 为什么限制文件大小？

1. **可维护性差**：超大文件难以理解和修改
2. **合并冲突多**：多人修改容易冲突
3. **代码复用低**：逻辑混杂难以提取
4. **测试困难**：职责不清晰难以单测
5. **性能问题**：加载和编译慢

### ✅ 解决方案

参考文档：
- [架构指导原则](./architecture-guide.md)
- [重构规范](./standards/refactoring-standards.md)
- [文件大小重构计划](./refactoring-plan.md)

**重构优先级**：
1. 🔴 立即处理：超过 500 行
2. 🟡 本周处理：300-500 行
3. 🟢 关注增长：200-300 行

---

## 🔒 类型安全：避免宽泛的 string 类型

### 🟡 问题严重程度：中等

**问题**：使用宽泛的 `string` 类型表示枚举值

```typescript
// ❌ 错误
interface Requirement {
  techProgress: string;  // 任何字符串都可以
  submitter: string;
}

// ✅ 正确
interface Requirement {
  techProgress: TechProgressStatus;  // 只能是特定值
  submitter: SubmitterType;
}

type TechProgressStatus = '待评估' | '未评估' | '已评估工作量' | '已完成技术方案';
type SubmitterType = '业务' | '产品' | '技术';
```

### 预防措施

1. **定义联合类型**：`src/types/`
2. **定义常量对象**：`src/constants/`
3. **运行时验证**：开发环境添加断言
4. **穷举检查**：分组逻辑必须覆盖所有值

详见：[类型安全规范](./standards/coding-standards.md#类型安全规范)

---

## 🐛 常见bug模式

### 1. 忘记 await 异步函数

```typescript
// ❌ 错误：忘记 await
const result = showConfirm('确认删除');
if (result) { ... }  // result 是 Promise，永远是 truthy

// ✅ 正确
const result = await showConfirm('确认删除');
if (result) { ... }
```

### 2. 事件冒泡导致的问题

```typescript
// ❌ 错误：删除按钮触发了卡片点击
<Card onClick={handleCardClick}>
  <button onClick={handleDelete}>删除</button>
</Card>

// ✅ 正确：阻止冒泡
<button
  type="button"
  onClick={(e) => {
    e.stopPropagation();
    handleDelete();
  }}
>
  删除
</button>
```

### 3. 忘记清理副作用

```typescript
// ❌ 错误：定时器没清理，导致内存泄漏
useEffect(() => {
  const timer = setTimeout(() => { ... }, 3000);
}, []);

// ✅ 正确：返回清理函数
useEffect(() => {
  const timer = setTimeout(() => { ... }, 3000);
  return () => clearTimeout(timer);
}, []);
```

---

## 📚 学习资源

### 项目规范文档
1. [编码规范](./standards/coding-standards.md)
2. [UI设计规范](./standards/ui-design-standards.md)
3. [重构规范](./standards/refactoring-standards.md)
4. [架构指导原则](./architecture-guide.md)

### 外部资源
1. [React 官方文档 - 常见错误](https://react.dev/learn/common-mistakes)
2. [MDN - Button type 属性](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#type)
3. [ESLint React 规则](https://github.com/jsx-eslint/eslint-plugin-react)

---

## 🎯 开发检查清单

每次开发新功能前检查：

```
□ 所有按钮都有 type="button" 属性
□ 不使用 confirm/alert/prompt
□ 枚举值使用联合类型而非 string
□ 异步操作正确使用 await
□ 副作用有清理函数
□ 事件冒泡处理正确
□ 文件大小不超过 300 行
□ 运行 ESLint 检查通过
□ 运行 TypeScript 编译通过
□ 运行构建命令验证
```

---

**记住**：血泪教训比任何文档都有价值。每次犯错都是改进的机会，但最好的方式是从别人的错误中学习！
