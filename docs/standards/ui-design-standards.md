# UI设计规范 (UI Design Standards)

本文档定义了WSJF项目的UI设计规范，确保界面一致性和用户体验质量。

---

## 🎨 颜色系统

### 主色调
WSJF使用蓝色系作为主色调，传达专业和可信赖感。

```css
/* 主色 - 用于品牌识别和主要操作 */
--primary: #3b82f6;         /* blue-500 */
--primary-hover: #2563eb;   /* blue-600 */
--primary-active: #1d4ed8;  /* blue-700 */

/* 次要色 - 用于辅助信息 */
--secondary: #6b7280;       /* gray-500 */
--secondary-hover: #4b5563; /* gray-600 */
```

### 语义颜色

#### 成功 (Success)
```css
--success: #10b981;         /* green-500 */
--success-bg: #d1fae5;      /* green-100 */
--success-text: #065f46;    /* green-800 */
```

#### 警告 (Warning)
```css
--warning: #f59e0b;         /* amber-500 */
--warning-bg: #fef3c7;      /* amber-100 */
--warning-text: #92400e;    /* amber-800 */
```

#### 错误 (Error/Danger)
```css
--danger: #ef4444;          /* red-500 */
--danger-bg: #fee2e2;       /* red-100 */
--danger-text: #991b1b;     /* red-800 */
```

#### 信息 (Info)
```css
--info: #3b82f6;            /* blue-500 */
--info-bg: #dbeafe;         /* blue-100 */
--info-text: #1e3a8a;       /* blue-800 */
```

### 业务影响度渐变色

根据业务影响度评分（1-10分）使用不同的渐变背景：

```typescript
// 1-2分：局部影响（浅灰色）
from-gray-50 to-gray-100

// 3-4分：小范围影响（蓝灰色）
from-blue-50 to-gray-100

// 5-6分：明显影响（蓝色）
from-blue-100 to-blue-200

// 7-8分：重要影响（深蓝色）
from-blue-200 to-blue-300

// 9-10分：战略级影响（紫蓝渐变）
from-blue-300 to-purple-300
```

### 时间紧迫性颜色

```typescript
// 随时：绿色（低紧迫）
text-green-600

// 三月窗口：黄色（中等紧迫）
text-yellow-600

// 一月硬窗口：橙色（高紧迫）
text-orange-600

// 强制DDL：红色（紧急）
text-red-600
```

### 中性色

```css
/* 背景色 */
--bg-primary: #ffffff;      /* 主背景 */
--bg-secondary: #f9fafb;    /* gray-50 - 次要背景 */
--bg-tertiary: #f3f4f6;     /* gray-100 - 三级背景 */

/* 边框色 */
--border-light: #e5e7eb;    /* gray-200 */
--border-normal: #d1d5db;   /* gray-300 */
--border-dark: #9ca3af;     /* gray-400 */

/* 文本色 */
--text-primary: #111827;    /* gray-900 */
--text-secondary: #6b7280;  /* gray-500 */
--text-tertiary: #9ca3af;   /* gray-400 */
--text-disabled: #d1d5db;   /* gray-300 */
```

---

## 🔤 字体系统

### 字体家族
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
             'Helvetica Neue', Arial, sans-serif;
```

### 字体大小

```css
/* 标题 */
--text-3xl: 30px;  /* 主标题 */
--text-2xl: 24px;  /* 二级标题 */
--text-xl: 20px;   /* 三级标题 */
--text-lg: 18px;   /* 大标题 */

/* 正文 */
--text-base: 16px; /* 标准文本 */
--text-sm: 14px;   /* 小文本 */
--text-xs: 12px;   /* 辅助文本 */
```

### 字重
```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### 行高
```css
--leading-tight: 1.25;   /* 紧凑 */
--leading-normal: 1.5;   /* 标准 */
--leading-relaxed: 1.75; /* 宽松 */
```

---

## 📐 间距系统

使用8像素网格系统（Tailwind CSS默认）：

```css
/* 基础间距单位：4px */
--spacing-0: 0;
--spacing-1: 4px;
--spacing-2: 8px;
--spacing-3: 12px;
--spacing-4: 16px;
--spacing-5: 20px;
--spacing-6: 24px;
--spacing-8: 32px;
--spacing-10: 40px;
--spacing-12: 48px;
--spacing-16: 64px;
```

### 组件间距规范

```typescript
// 页面边距
p-6 (24px)

// 卡片内边距
p-4 (16px)

// 表单字段间距
space-y-4 (16px vertical)

// 按钮组间距
space-x-2 (8px horizontal)

// Section间距
mb-6 (24px)
```

---

## 🧱 组件样式规范

### 按钮 (Button)

#### 主要按钮
```typescript
<button className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700
                   text-white font-medium px-4 py-2 rounded-lg
                   transition-colors duration-200">
  保存
</button>
```

#### 次要按钮
```typescript
<button className="bg-gray-200 hover:bg-gray-300 active:bg-gray-400
                   text-gray-700 font-medium px-4 py-2 rounded-lg
                   transition-colors duration-200">
  取消
</button>
```

#### 危险按钮
```typescript
<button className="bg-red-500 hover:bg-red-600 active:bg-red-700
                   text-white font-medium px-4 py-2 rounded-lg
                   transition-colors duration-200">
  删除
</button>
```

#### 禁用状态
```typescript
<button className="bg-gray-300 text-gray-500 cursor-not-allowed
                   px-4 py-2 rounded-lg"
        disabled>
  已禁用
</button>
```

**重要**：所有 `<button>` 必须添加 `type="button"` 属性（除非是表单提交按钮）：
```typescript
// ✅ 正确
<button type="button" onClick={handleClick}>...</button>

// ❌ 错误：会导致表单意外提交
<button onClick={handleClick}>...</button>
```

### 确认弹窗和提示 (Confirm Dialog & Toast)

**❌ 禁止使用系统默认弹出框**

```typescript
// ❌ 禁止：使用系统默认弹出框
if (confirm('确定删除吗？')) { ... }
alert('操作成功！');
prompt('请输入名称：');

// ✅ 正确：使用自定义弹窗组件
import { useConfirmDialog, ConfirmDialog, useToast, Toast } from './ConfirmDialog';

// 确认对话框
const { confirm, dialogState, handleCancel } = useConfirmDialog();
const confirmed = await confirm('删除需求', '确定要删除吗？', 'danger');

// 提示消息
const { showToast, toastState, hideToast } = useToast();
showToast('操作成功！', 'success');
```

#### 确认弹窗样式

```typescript
// 危险操作（删除等）
<ConfirmDialog
  isOpen={isOpen}
  title="删除需求"
  message="确定要删除吗？此操作不可撤销。"
  type="danger"  // 红色主题
  confirmText="删除"
  cancelText="取消"
  onConfirm={handleConfirm}
  onCancel={handleCancel}
/>

// 警告操作（覆盖数据等）
<ConfirmDialog
  type="warning"  // 黄色主题
  // ...
/>

// 提示信息
<ConfirmDialog
  type="info"  // 蓝色主题
  // ...
/>
```

#### Toast 提示样式

```typescript
// 成功提示
<Toast
  isOpen={isOpen}
  message="保存成功！"
  type="success"  // 绿色
  duration={3000}
  onClose={hideToast}
/>

// 错误提示
<Toast
  message="保存失败，请重试"
  type="danger"  // 红色
/>

// 警告提示
<Toast
  message="数据格式不正确"
  type="warning"  // 黄色
/>

// 信息提示
<Toast
  message="文件上传中..."
  type="info"  // 蓝色
/>
```

#### 为什么禁止系统默认弹出框？

1. **用户体验差**：系统弹窗样式不统一，无法定制
2. **功能受限**：无法添加图标、颜色、动画等
3. **测试困难**：E2E测试无法模拟系统弹窗
4. **品牌一致性**：无法匹配应用整体设计风格
5. **安全问题**：部分浏览器会拦截 alert/confirm

#### ESLint 规则（自动检测）

```json
{
  "rules": {
    "no-alert": "error",
    "no-restricted-globals": ["error", "confirm", "prompt"]
  }
}
```

### 输入框 (Input)

#### 文本输入
```typescript
<input
  type="text"
  className="w-full px-3 py-2 border border-gray-300 rounded-lg
             focus:outline-none focus:ring-2 focus:ring-blue-500
             focus:border-transparent"
  placeholder="请输入..."
/>
```

#### 选择框 (Select)
```typescript
<select className="w-full px-3 py-2 border border-gray-300 rounded-lg
                   focus:outline-none focus:ring-2 focus:ring-blue-500
                   bg-white">
  <option value="">请选择</option>
  <option value="1">选项1</option>
</select>
```

#### 错误状态
```typescript
<input
  className="w-full px-3 py-2 border-2 border-red-500 rounded-lg
             focus:outline-none focus:ring-2 focus:ring-red-500"
/>
<p className="text-red-500 text-sm mt-1">此字段为必填项</p>
```

### 卡片 (Card)

#### 基础卡片
```typescript
<div className="bg-white rounded-lg shadow-md p-4 border border-gray-200
                hover:shadow-lg transition-shadow duration-200">
  {/* 卡片内容 */}
</div>
```

#### 需求卡片（带渐变）
```typescript
<div className="bg-gradient-to-br from-blue-100 to-blue-200
                rounded-lg shadow-md p-4 border border-blue-300
                hover:shadow-lg transition-all duration-200
                cursor-move">
  {/* 需求信息 */}
</div>
```

### 模态框 (Modal)

#### 遮罩层
```typescript
<div className="fixed inset-0 bg-black bg-opacity-50 z-50
                flex items-center justify-center">
```

#### 模态框容器
```typescript
<div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full
                max-h-[90vh] overflow-y-auto p-6">
```

#### 模态框标题栏
```typescript
<div className="bg-gradient-to-r from-blue-500 to-blue-600
                text-white px-6 py-4 rounded-t-lg
                flex justify-between items-center">
  <h2 className="text-xl font-bold">标题</h2>
  <button type="button" className="hover:bg-blue-700 p-1 rounded">
    <X className="w-6 h-6" />
  </button>
</div>
```

### 标签 (Badge)

```typescript
// 状态标签
<span className="inline-block px-2 py-1 rounded-full text-xs font-medium
                 bg-green-100 text-green-800">
  已完成
</span>

// 星级显示
<div className="flex items-center text-yellow-500">
  {'★'.repeat(stars) + '☆'.repeat(5 - stars)}
</div>
```

---

## 🎭 交互状态规范

### 悬停 (Hover)
- **按钮**：背景色加深一个等级
- **卡片**：阴影增强（shadow-md → shadow-lg）
- **链接**：颜色加深，添加下划线

```typescript
// 按钮悬停
hover:bg-blue-600

// 卡片悬停
hover:shadow-lg

// 链接悬停
hover:text-blue-700 hover:underline
```

### 激活 (Active)
```typescript
// 按钮按下
active:bg-blue-700 active:scale-95

// 可拖拽卡片
active:cursor-grabbing
```

### 焦点 (Focus)
所有可交互元素必须有清晰的焦点样式：

```typescript
focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
```

### 禁用 (Disabled)
```typescript
disabled:opacity-50 disabled:cursor-not-allowed
```

### 过渡动画
所有状态变化使用过渡效果：

```typescript
transition-colors duration-200   // 颜色过渡
transition-shadow duration-200   // 阴影过渡
transition-all duration-200      // 所有属性过渡
```

---

## 📱 响应式设计规范

### 断点
```css
/* Mobile First */
--sm: 640px;   /* 小屏幕 */
--md: 768px;   /* 中等屏幕 */
--lg: 1024px;  /* 大屏幕 */
--xl: 1280px;  /* 超大屏幕 */
--2xl: 1536px; /* 超宽屏幕 */
```

### 布局适配

#### 主容器
```typescript
<div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
```

#### 卡片网格
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

#### 模态框宽度
```typescript
<div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl">
```

---

## 🎯 特殊组件样式

### 需求权重分显示

#### 高分需求（85+）
```typescript
<div className="bg-gradient-to-br from-purple-500 to-blue-500
                text-white font-bold text-2xl p-4 rounded-lg
                shadow-lg">
  {displayScore}
</div>
```

#### 中等需求（55-84）
```typescript
<div className="bg-gradient-to-br from-blue-400 to-blue-500
                text-white font-semibold text-xl p-3 rounded-lg">
  {displayScore}
</div>
```

#### 低分需求（<55）
```typescript
<div className="bg-gradient-to-br from-gray-300 to-gray-400
                text-gray-700 font-medium text-lg p-2 rounded-lg">
  {displayScore}
</div>
```

### 进度条

```typescript
<div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
  <div
    className={`h-full rounded-full transition-all duration-500 ${
      percentage > 100 ? 'bg-red-500' :
      percentage > 80 ? 'bg-yellow-500' :
      'bg-green-500'
    }`}
    style={{ width: `${Math.min(percentage, 100)}%` }}
  >
    <span className="text-xs font-bold text-white px-2">
      {percentage}%
    </span>
  </div>
</div>
```

### AI分析结果展示

```typescript
<div className="bg-gradient-to-r from-purple-50 to-blue-50
                border-2 border-purple-200 rounded-lg p-4">
  <div className="flex items-center gap-2 mb-2">
    <Sparkles className="w-5 h-5 text-purple-500" />
    <h3 className="font-bold text-purple-700">AI 分析结果</h3>
  </div>
  {/* 分析内容 */}
</div>
```

---

## 📋 图标使用规范

使用 Lucide React 图标库，保持图标一致性。

### 常用图标
```typescript
import {
  Save,         // 保存
  X,            // 关闭
  Plus,         // 添加
  Edit,         // 编辑
  Trash2,       // 删除
  Upload,       // 上传
  Download,     // 下载
  Search,       // 搜索
  Filter,       // 筛选
  Calendar,     // 日期
  Clock,        // 时间
  AlertCircle,  // 警告
  CheckCircle,  // 成功
  Info,         // 信息
  Sparkles,     // AI/特殊功能
  Users,        // 用户/团队
  Target        // 目标/指标
} from 'lucide-react';
```

### 图标大小
```typescript
// 小图标
<Icon className="w-4 h-4" />

// 标准图标
<Icon className="w-5 h-5" />

// 大图标
<Icon className="w-6 h-6" />
```

---

## ✅ UI开发检查清单

开发新UI时必须检查：

```
□ 颜色是否符合设计系统？
□ 间距是否使用8px网格？
□ 字体大小是否符合规范？
□ 是否有悬停/焦点/激活状态？
□ 是否有过渡动画？
□ 按钮是否添加type属性？
□ 是否支持响应式？
□ 禁用状态是否清晰？
□ 图标是否统一使用Lucide React？
□ 是否符合无障碍访问标准？
```

---

## 🎨 Figma/设计稿对照

重构UI时必须：

1. **截图保存**：重构前截取所有状态的UI
2. **样式对比**：逐一对比颜色、间距、字体
3. **交互验证**：测试所有交互状态
4. **用户验证**：让用户确认UI无差异

参考：[重构规范 - UI验证流程](./refactoring-standards.md#ui验证流程)

---

## 🚀 性能优化

### 避免不必要的重渲染
```typescript
// ✅ 使用 React.memo
export const ExpensiveComponent = React.memo(({ data }) => {
  // ...
});

// ✅ 使用 useMemo 缓存计算结果
const sortedData = useMemo(() =>
  data.sort((a, b) => b.score - a.score),
  [data]
);
```

### 图片优化
```typescript
// 使用适当的图片尺寸
<img
  src="..."
  loading="lazy"  // 懒加载
  width="200"
  height="150"
/>
```

---

**记住**：一致的UI设计不仅提升用户体验，也减少开发和维护成本！
