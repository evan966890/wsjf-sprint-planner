# 技术债务清单

> 记录项目中需要改进的代码质量问题
>
> **目的**: 跟踪和优先处理技术债务，逐步提升代码质量

## 🚨 高优先级（影响用户体验）

### 1. 移除 window.confirm 使用 ⭐⭐⭐⭐

**问题描述**：
- 代码中仍在使用原生 `window.confirm`，违反UI/UX规范
- 阻塞页面，用户体验差
- 样式无法定制，与应用设计不符

**影响位置**：
```
src/components/EditRequirementModal.tsx:278  - 未保存更改确认
src/components/EditRequirementModal.tsx:617 - 忽略AI建议确认
src/components/EditRequirementModal.tsx:628 - 重新分析确认
```

**修复方案**：
- 创建通用的 `ConfirmModal` 组件
- 使用 React state 管理对话框状态
- 替换所有 `window.confirm` 为 `ConfirmModal`

**预期效果**：
- ✅ 符合UI/UX规范
- ✅ 可定制样式，匹配应用设计
- ✅ 非阻塞，提升用户体验
- ✅ 支持更丰富的交互（如显示详细信息、多个按钮等）

**参考实现**：
见 `ai-templates/UI_UX_BEST_PRACTICES.md` - 修复 window.confirm 章节

**状态**: 待修复
**估计工作量**: 2-3小时
**负责人**: 待分配

---

## 📊 中优先级（代码质量）

### 2. 主组件拆分 (wsjf-sprint-planner.tsx)

**问题描述**：
- 主组件文件过大（3500+行）
- 难以维护和理解
- Token消耗高

**修复方案**：
- 拆分为多个小组件（每个<300行）
- 提取独立的功能模块
- 使用组件组合

**预期效果**：
- Token消耗降低 70%
- 代码可维护性提升
- 更好的代码组织

**状态**: 规划中
**估计工作量**: 2-3天
**负责人**: 待分配

---

## 📝 低优先级（优化改进）

### 3. 添加 ESLint 规则

**问题描述**：
- 缺少自动化检测 alert/confirm/prompt 的规则
- 依赖人工代码审查

**修复方案**：
```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'no-alert': 'error',
    'no-restricted-globals': [
      'error',
      { name: 'alert', message: '请使用 Toast 替代 alert' },
      { name: 'confirm', message: '请使用 Modal 对话框替代 confirm' },
      { name: 'prompt', message: '请使用 Input Modal 替代 prompt' },
    ],
  },
};
```

**预期效果**：
- 自动检测违规代码
- 在开发时就发现问题
- 防止新增违规代码

**状态**: 待实施
**估计工作量**: 1小时
**负责人**: 待分配

---

## ✅ 已完成

### ✅ 移除 console.log
- **完成时间**: 2025-01-19
- **Commit**: fc19d2b
- **说明**: 使用 logger 工具替代，生产环境静默

### ✅ 优化 any 类型使用
- **完成时间**: 2025-01-19
- **Commit**: fc19d2b
- **说明**: 定义明确类型，提升类型安全

### ✅ 创建配置索引中心
- **完成时间**: 2025-01-19
- **Commit**: 3e74981
- **说明**: src/config/index.ts 统一管理配置

---

## 📋 技术债务统计

| 优先级 | 数量 | 已完成 | 进行中 | 待处理 |
|--------|------|--------|--------|--------|
| 高 | 1 | 0 | 0 | 1 |
| 中 | 1 | 0 | 0 | 1 |
| 低 | 1 | 0 | 0 | 1 |
| **总计** | **3** | **0** | **0** | **3** |

**已完成历史**: 3项

---

## 🔄 更新日志

### 2025-01-19
- ✅ 完成 console.log 清理
- ✅ 完成 any 类型优化
- ✅ 完成配置索引创建
- 🆕 发现 window.confirm 使用（高优先级）
- 📝 添加主组件拆分任务（中优先级）
- 📝 添加 ESLint 规则任务（低优先级）

---

**维护者**: 开发团队
**最后更新**: 2025-01-19
