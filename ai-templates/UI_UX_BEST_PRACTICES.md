# UI/UX 最佳实践规范

> 通用AI协作规范 - 适用于所有Web应用开发项目
>
> **目的**: 建立现代化、用户友好的UI/UX设计标准，提升用户体验

## 🎯 核心原则

### 用户体验优先

- ✅ 提供清晰、即时的反馈
- ✅ 使用非侵入式的提示方式
- ✅ 保持界面一致性和可预测性
- ✅ 优化加载和响应速度
- ❌ 避免打断用户操作流程

---

## 🚫 禁止使用 alert/confirm/prompt

### ⚠️ 核心规则

**永远不要在现代Web应用中使用原生的 alert、confirm、prompt**

**包括但不限于**：
```typescript
// ❌ 所有这些都禁止使用
alert('...')
confirm('...')
prompt('...')
window.alert('...')
window.confirm('...')
window.prompt('...')
```

**原因**：
1. **破坏用户体验** - 强制阻塞页面，无法进行其他操作
2. **样式无法定制** - 无法匹配应用设计风格
3. **缺乏可访问性** - 对屏幕阅读器不友好
4. **功能单一** - 无法显示富文本、图标、按钮等
5. **不支持异步** - 阻塞JavaScript执行
6. **显得不专业** - 给人业余、过时的感觉

### ❌ 错误示例

```typescript
// ❌ 极其糟糕：使用 alert
function handleSubmit() {
  if (success) {
    alert('提交成功！');
  } else {
    alert('提交失败，请重试');
  }
}

// ❌ 糟糕：使用 confirm
function handleDelete() {
  if (confirm('确定要删除吗？')) {
    deleteItem();
  }
}

// ❌ 糟糕：使用 prompt
function handleRename() {
  const newName = prompt('请输入新名称：');
  if (newName) {
    rename(newName);
  }
}
```

**问题**：
- 阻塞整个页面
- 样式丑陋、无法定制
- 无法提供详细信息
- 用户体验差

---

## ✅ 推荐的替代方案

### 1. Toast 提示（轻量级通知）⭐⭐⭐

**适用场景**：
- 操作成功/失败提示
- 系统通知
- 非阻塞性消息

**特点**：
- 非侵入式
- 自动消失
- 可以显示多个
- 支持不同类型（成功/警告/错误/信息）

**实现方案**：

#### 方案1: react-hot-toast（推荐）⭐

```bash
npm install react-hot-toast
```

```typescript
import toast, { Toaster } from 'react-hot-toast';

// 在根组件中添加
function App() {
  return (
    <>
      <Toaster position="top-center" />
      <YourApp />
    </>
  );
}

// 使用示例
// ✅ 正确：使用 Toast
function handleSubmit() {
  try {
    await submitData();
    toast.success('提交成功！');
  } catch (error) {
    toast.error('提交失败，请重试');
  }
}

// 不同类型的提示
toast.success('操作成功');
toast.error('操作失败');
toast.loading('加载中...');
toast('普通消息');

// 自定义样式
toast.success('删除成功', {
  duration: 3000,
  icon: '🗑️',
  style: {
    background: '#10b981',
    color: '#fff',
  },
});

// Promise提示
toast.promise(
  saveData(),
  {
    loading: '保存中...',
    success: '保存成功！',
    error: '保存失败',
  }
);
```

#### 方案2: sonner（更现代）⭐

```bash
npm install sonner
```

```typescript
import { Toaster, toast } from 'sonner';

// 在根组件中添加
function App() {
  return (
    <>
      <Toaster richColors />
      <YourApp />
    </>
  );
}

// 使用示例
toast.success('操作成功');
toast.error('操作失败');
toast.info('提示信息');
toast.warning('警告信息');

// 带描述
toast.success('操作成功', {
  description: '您的更改已保存',
});

// 带操作按钮
toast.success('文件已上传', {
  action: {
    label: '查看',
    onClick: () => console.log('View'),
  },
});
```

#### 方案3: 自定义Toast组件

```typescript
// components/Toast.tsx
import { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const colorMap = {
  success: 'bg-green-50 text-green-800 border-green-200',
  error: 'bg-red-50 text-red-800 border-red-200',
  warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  info: 'bg-blue-50 text-blue-800 border-blue-200',
};

export function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  const Icon = iconMap[type];

  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`
      fixed top-4 right-4 z-50
      flex items-center gap-3 p-4 rounded-lg border shadow-lg
      animate-in slide-in-from-top-2
      ${colorMap[type]}
    `}>
      <Icon size={20} />
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70">
        <X size={18} />
      </button>
    </div>
  );
}

// 使用示例
const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

<button onClick={() => setToast({ message: '保存成功', type: 'success' })}>
  保存
</button>

{toast && (
  <Toast
    message={toast.message}
    type={toast.type}
    onClose={() => setToast(null)}
  />
)}
```

### 2. Modal 对话框（需要用户确认）⭐⭐

**适用场景**：
- 需要用户明确确认的操作（删除、提交）
- 需要用户输入额外信息
- 显示详细信息或表单

**替代 confirm 的方案**：

```typescript
// ✅ 正确：使用 Modal 替代 confirm
import { useState } from 'react';
import { X } from 'lucide-react';

function ConfirmModal({ title, message, onConfirm, onCancel }: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-4">
          <p className="text-gray-600">{message}</p>
        </div>
        <div className="flex gap-3 p-4 border-t justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
          >
            确定删除
          </button>
        </div>
      </div>
    </div>
  );
}

// 使用示例
function MyComponent() {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = () => {
    setShowConfirm(false);
    deleteItem();
    toast.success('删除成功');
  };

  return (
    <>
      <button onClick={() => setShowConfirm(true)}>删除</button>

      {showConfirm && (
        <ConfirmModal
          title="确认删除"
          message="删除后无法恢复，确定要删除这个项目吗？"
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}
```

**使用第三方库**：

```typescript
// shadcn/ui AlertDialog
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

<AlertDialog>
  <AlertDialogTrigger asChild>
    <button>删除</button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>确认删除？</AlertDialogTitle>
      <AlertDialogDescription>
        此操作无法撤销。这将永久删除该项目。
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>取消</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>删除</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### 3. Input Modal（需要用户输入）⭐

**替代 prompt 的方案**：

```typescript
// ✅ 正确：使用 Modal 替代 prompt
function InputModal({ title, placeholder, onConfirm, onCancel }: {
  title: string;
  placeholder: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    if (value.trim()) {
      onConfirm(value);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <div className="p-4">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            autoFocus
          />
        </div>
        <div className="flex gap-3 p-4 border-t justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!value.trim()}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
}

// 使用示例
const [showInput, setShowInput] = useState(false);

const handleRename = (newName: string) => {
  setShowInput(false);
  rename(newName);
  toast.success('重命名成功');
};

<button onClick={() => setShowInput(true)}>重命名</button>

{showInput && (
  <InputModal
    title="重命名项目"
    placeholder="请输入新名称"
    onConfirm={handleRename}
    onCancel={() => setShowInput(false)}
  />
)}
```

### 4. 内联提示（Inline Feedback）⭐

**适用场景**：
- 表单验证错误
- 实时反馈
- 上下文相关的提示

```typescript
// ✅ 正确：表单内联错误提示
<div>
  <label className="block text-sm font-medium mb-1">
    邮箱地址
  </label>
  <input
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    className={`
      w-full px-3 py-2 border rounded
      ${error ? 'border-red-500' : 'border-gray-300'}
    `}
  />
  {error && (
    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
      <AlertCircle size={14} />
      {error}
    </p>
  )}
</div>

// ✅ 正确：操作状态提示
<div className="bg-yellow-50 border border-yellow-200 rounded p-3 flex items-start gap-2">
  <AlertCircle className="text-yellow-600 mt-0.5" size={18} />
  <div>
    <p className="font-medium text-yellow-800">注意</p>
    <p className="text-sm text-yellow-700">此操作将影响所有子项目</p>
  </div>
</div>
```

---

## 📊 提示方式选择指南

| 场景 | 推荐方案 | 理由 |
|------|---------|------|
| **操作成功** | Toast | 非侵入式，自动消失 |
| **操作失败** | Toast（错误类型） | 即时反馈，无需确认 |
| **需要确认删除** | Modal对话框 | 防止误操作，可提供详细说明 |
| **需要用户输入** | Input Modal | 可验证输入，样式可定制 |
| **表单验证错误** | 内联提示 | 上下文明确，便于修正 |
| **系统通知** | Toast | 不打断工作流程 |
| **重要警告** | Modal对话框 | 确保用户注意到 |
| **加载状态** | Toast（loading） 或 Spinner | 提供进度反馈 |
| **永久提示** | Banner | 持续显示重要信息 |

---

## 🎨 UI组件库推荐

### Toast库

1. **react-hot-toast** ⭐⭐⭐
   - 轻量级（~5KB）
   - API简单
   - 样式可定制
   ```bash
   npm install react-hot-toast
   ```

2. **sonner** ⭐⭐⭐
   - 现代设计
   - 更丰富的功能
   - 支持Promise
   ```bash
   npm install sonner
   ```

3. **react-toastify**
   - 功能完整
   - 社区成熟
   ```bash
   npm install react-toastify
   ```

### UI组件库

1. **shadcn/ui** ⭐⭐⭐
   - 基于Radix UI
   - 完全可定制
   - 包含AlertDialog、Toast等

2. **Headless UI**
   - Tailwind官方推荐
   - 无样式组件
   - 完全控制样式

3. **Radix UI**
   - 可访问性优先
   - 无样式基础组件

---

## ✅ 最佳实践

### 1. 提供明确的反馈

```typescript
// ✅ 好：明确的成功提示
toast.success('需求已保存', {
  description: '权重分: 85, 星级: ★★★★★',
});

// ❌ 差：模糊的提示
toast('完成');
```

### 2. 错误提示要有帮助

```typescript
// ✅ 好：提供解决方案
toast.error('保存失败', {
  description: '网络连接中断，请检查网络后重试',
  action: {
    label: '重试',
    onClick: () => retry(),
  },
});

// ❌ 差：只说失败
toast.error('失败');
```

### 3. 保持一致性

```typescript
// ✅ 好：统一的提示风格
const showSuccess = (message: string) => {
  toast.success(message, {
    duration: 3000,
    position: 'top-center',
  });
};

const showError = (message: string) => {
  toast.error(message, {
    duration: 4000,
    position: 'top-center',
  });
};

// 在整个应用中使用这些函数
showSuccess('操作成功');
showError('操作失败');
```

### 4. 避免提示过载

```typescript
// ❌ 差：过多的提示
items.forEach(item => {
  deleteItem(item);
  toast.success(`已删除 ${item.name}`); // 100个提示！
});

// ✅ 好：合并提示
deleteItems(items);
toast.success(`已删除 ${items.length} 个项目`);
```

### 5. 适当的持续时间

```typescript
// 成功提示：3秒
toast.success('保存成功', { duration: 3000 });

// 错误提示：4-5秒（用户需要更多时间阅读）
toast.error('保存失败：网络错误', { duration: 4000 });

// 信息提示：2-3秒
toast('已复制到剪贴板', { duration: 2000 });

// 重要警告：不自动关闭
toast.warning('磁盘空间不足', { duration: Infinity });
```

---

## 🚫 常见错误

### 错误1: 仍然使用alert

```typescript
// ❌ 错误
if (success) {
  alert('成功！');
}

// ✅ 正确
if (success) {
  toast.success('操作成功！');
}
```

### 错误2: 过度使用Modal

```typescript
// ❌ 错误：简单提示用Modal
<Modal>
  <p>保存成功</p>
  <button onClick={close}>确定</button>
</Modal>

// ✅ 正确：简单提示用Toast
toast.success('保存成功');
```

### 错误3: 提示信息不明确

```typescript
// ❌ 错误
toast('完成');
toast('错误');

// ✅ 正确
toast.success('需求已添加到迭代池');
toast.error('保存失败：权重分必须在1-100之间');
```

---

## 📖 AI协作时的规范

### AI不应该做的事 ❌

1. **不应该建议使用alert/confirm/prompt**
   ```
   ❌ "使用 alert('保存成功') 提示用户"
   ❌ "用 confirm('确定删除?') 确认操作"
   ❌ "用 prompt() 获取用户输入"
   ```

2. **不应该在示例代码中使用alert**
   ```typescript
   ❌ // 错误示例
   function handleClick() {
     alert('点击了按钮');
   }
   ```

### AI应该做的事 ✅

1. **应该建议使用Toast**
   ```
   ✅ "使用 Toast 提示操作结果：
       toast.success('保存成功')"
   ```

2. **应该建议使用Modal确认**
   ```
   ✅ "对于删除操作，使用Modal确认对话框
       提供更好的用户体验"
   ```

3. **应该根据场景选择合适的提示方式**
   ```
   ✅ "简单成功提示用Toast
       需要确认的重要操作用Modal
       表单验证错误用内联提示"
   ```

4. **应该提供完整的实现代码**
   ```typescript
   ✅ // 正确示例
   import toast from 'react-hot-toast';

   function handleSubmit() {
     try {
       await save();
       toast.success('保存成功');
     } catch (error) {
       toast.error('保存失败，请重试');
     }
   }
   ```

---

## 🔍 代码检测和修复

### 检测现有代码中的违规使用

**使用 grep 搜索**：
```bash
# 搜索所有 alert/confirm/prompt 使用
grep -rn "window\.confirm\|window\.alert\|window\.prompt\|^alert(\|^confirm(\|^prompt(" src/ --include="*.tsx" --include="*.ts"
```

**常见违规模式**：
```typescript
// ❌ 这些都需要修复
const confirmed = window.confirm('确定删除吗？');
if (window.confirm('确定继续？')) { ... }
window.alert('操作成功');
const name = window.prompt('请输入名称');
```

### 修复指南

#### 修复 window.confirm

**修复前**：
```typescript
// ❌ EditRequirementModal.tsx:278
const confirmed = window.confirm(
  '检测到未保存的更改，是否保存？\n\n' +
  '点击"确定"保存更改\n' +
  '点击"取消"放弃更改'
);
if (confirmed) {
  handleSave();
}
```

**修复后**：
```typescript
// ✅ 使用自定义 Modal
const [showConfirm, setShowConfirm] = useState(false);

// 触发确认
const handleClose = () => {
  if (hasUnsavedChanges) {
    setShowConfirm(true);
  } else {
    onClose();
  }
};

// 渲染 Modal
{showConfirm && (
  <ConfirmModal
    title="未保存的更改"
    message="检测到未保存的更改，是否保存？"
    confirmText="保存"
    cancelText="放弃"
    onConfirm={() => {
      setShowConfirm(false);
      handleSave();
    }}
    onCancel={() => {
      setShowConfirm(false);
      onClose();
    }}
  />
)}
```

#### 修复 window.alert

**修复前**：
```typescript
// ❌ 使用 alert
window.alert('保存成功！');
```

**修复后**：
```typescript
// ✅ 使用 Toast
import toast from 'react-hot-toast';

toast.success('保存成功！');
```

#### 修复 window.prompt

**修复前**：
```typescript
// ❌ 使用 prompt
const newName = window.prompt('请输入新名称');
if (newName) {
  rename(newName);
}
```

**修复后**：
```typescript
// ✅ 使用 Input Modal
const [showInput, setShowInput] = useState(false);

{showInput && (
  <InputModal
    title="重命名"
    placeholder="请输入新名称"
    onConfirm={(value) => {
      setShowInput(false);
      rename(value);
    }}
    onCancel={() => setShowInput(false)}
  />
)}
```

### ESLint 规则（可选）

**禁止使用 alert/confirm/prompt**：

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'no-alert': 'error', // 禁止使用 alert/confirm/prompt
    'no-restricted-globals': [
      'error',
      {
        name: 'alert',
        message: '请使用 Toast 替代 alert',
      },
      {
        name: 'confirm',
        message: '请使用 Modal 对话框替代 confirm',
      },
      {
        name: 'prompt',
        message: '请使用 Input Modal 替代 prompt',
      },
    ],
  },
};
```

---

## 🎓 检查清单

### 新功能开发时

- [ ] 是否使用了 alert/confirm/prompt？（禁止）
- [ ] 是否使用了 window.alert/confirm/prompt？（禁止）
- [ ] 操作成功/失败是否有Toast提示？
- [ ] 重要操作是否有确认Modal？
- [ ] 表单是否有内联验证提示？
- [ ] 加载状态是否有反馈？
- [ ] 提示信息是否清晰明确？
- [ ] 提示样式是否与应用风格一致？

### 代码审查时

- [ ] 检查是否有 alert/confirm/prompt
- [ ] 检查是否有 window.alert/confirm/prompt
- [ ] 检查提示方式是否合适
- [ ] 检查提示信息是否有帮助
- [ ] 检查是否有过多的提示

### 代码迁移/重构时

- [ ] 搜索所有 window.confirm 使用
- [ ] 搜索所有 window.alert 使用
- [ ] 搜索所有 window.prompt 使用
- [ ] 逐一替换为现代化方案
- [ ] 测试替换后的用户体验

---

## 📚 相关资源

### 文档
- [react-hot-toast 文档](https://react-hot-toast.com/)
- [sonner 文档](https://sonner.emilkowal.ski/)
- [Radix UI AlertDialog](https://www.radix-ui.com/docs/primitives/components/alert-dialog)

### 设计指南
- [Material Design - Snackbars](https://material.io/components/snackbars)
- [Apple HIG - Alerts](https://developer.apple.com/design/human-interface-guidelines/alerts)

---

**版本**: 1.0.0
**最后更新**: 2025-01-19
**适用项目**: 所有现代Web应用项目
