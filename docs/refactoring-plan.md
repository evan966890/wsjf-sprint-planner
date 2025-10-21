# 文件大小重构计划

> **创建日期**: 2025-01-20
> **优先级**: P0（必须执行）
> **预计工时**: 16-20 小时（团队协作）
> **完成期限**: 本周内

---

## 📊 当前状态

### 违规文件清单

| 文件 | 当前行数 | 目标行数 | 超标 | 优先级 |
|------|---------|---------|------|--------|
| src/wsjf-sprint-planner.tsx | 3102 | 480 | 🔴 2622行 | P0 |
| src/components/EditRequirementModal.tsx | 2044 | 480 | 🔴 1564行 | P0 |
| src/components/BatchEvaluationModal.tsx | 744 | 480 | 🔴 264行 | P0 |
| src/components/UnscheduledArea.tsx | 608 | 480 | 🔴 128行 | P0 |
| **总计** | **6498** | **1920** | **4578** | - |

**硬性规定**: 所有文件不得超过 500 行
**当前目标**: 降至 480 行以下（留有 20 行缓冲）

---

## 🎯 重构策略

### 核心原则

1. **UI 和逻辑分离**：组件只负责渲染，业务逻辑提取到 Hook
2. **按功能拆分**：相关功能聚合到独立文件
3. **保持功能完整**：每次重构后立即测试
4. **增量提交**：每个文件重构作为独立 PR

### 执行顺序

**阶段 1（本周一-二）**：核心依赖最少的文件
- [ ] UnscheduledArea.tsx (608 → 480行)
- [ ] BatchEvaluationModal.tsx (744 → 480行)

**阶段 2（本周三-四）**：复杂的 Modal
- [ ] EditRequirementModal.tsx (2044 → 480行)

**阶段 3（本周五）**：主文件
- [ ] wsjf-sprint-planner.tsx (3102 → 480行)

---

## 📋 详细重构方案

### 1. UnscheduledArea.tsx (608 → 480行)

**难度**: ⭐⭐ (简单)
**预计工时**: 2-3 小时
**负责人**: [待分配]

#### 拆分方案

```
src/components/unscheduled/
├── UnscheduledArea.tsx           (主容器，~280行)
├── FilterBar.tsx                 (筛选栏，~150行)
└── hooks/
    └── useRequirementFilter.ts   (筛选逻辑，~150行)
```

#### 提取内容

**useRequirementFilter.ts**:
- 搜索逻辑
- 筛选逻辑（类型、分数、工作量、BV、业务域、RMS）
- 排序逻辑
- 分组逻辑（已评估 vs 未评估）

**FilterBar.tsx**:
- 搜索框
- 所有筛选下拉框
- 排序选择器
- 批量评估按钮

**UnscheduledArea.tsx** (保留):
- 主容器布局
- 需求卡片渲染
- 拖拽处理
- 清空按钮

#### 详细指南

参考: [docs/refactoring-guides/unscheduled-area-refactoring.md](./refactoring-guides/unscheduled-area-refactoring.md)

---

### 2. BatchEvaluationModal.tsx (744 → 480行)

**难度**: ⭐⭐⭐ (中等)
**预计工时**: 3-4 小时
**负责人**: [待分配]

#### 拆分方案

```
src/components/batch-evaluation/
├── BatchEvaluationModal.tsx      (主容器，~280行)
├── EvaluationProgress.tsx        (进度显示，~100行)
├── EvaluationResultItem.tsx      (结果项，~150行)
└── hooks/
    └── useBatchAIEvaluation.ts   (AI评估逻辑，~200行)
```

#### 提取内容

**useBatchAIEvaluation.ts**:
- AI API 调用逻辑
- 批量评估状态管理
- 进度跟踪
- 结果处理

**EvaluationProgress.tsx**:
- 进度条
- 已完成/总数显示
- 模型选择器

**EvaluationResultItem.tsx**:
- 单个需求的评估结果卡片
- 用户分 vs AI分对比
- 勾选框
- 应用按钮

#### 详细指南

参考: [docs/refactoring-guides/batch-evaluation-refactoring.md](./refactoring-guides/batch-evaluation-refactoring.md)

---

### 3. EditRequirementModal.tsx (2044 → 480行)

**难度**: ⭐⭐⭐⭐⭐ (复杂)
**预计工时**: 6-8 小时
**负责人**: [待分配]

#### 拆分方案

```
src/components/edit-requirement/
├── EditRequirementModal.tsx      (主容器，~250行)
├── sections/
│   ├── BasicInfoSection.tsx      (基础信息，~150行)
│   ├── BusinessImpactSection.tsx (业务影响度，~200行)
│   ├── ComplexitySection.tsx     (复杂度评估，~150行)
│   ├── MetricsSection.tsx        (指标选择，~150行)
│   ├── AIAnalysisSection.tsx     (AI分析，~200行)
│   └── DocumentSection.tsx       (文档管理，~200行)
└── hooks/
    ├── useRequirementForm.ts     (表单状态，~150行)
    ├── useAIAnalysis.ts          (AI分析，~200行)
    └── useDocumentManager.ts     (文档管理，~150行)
```

#### 提取内容（按优先级）

**第1步：提取 Hooks**

1. **useRequirementForm.ts** (~150行)
   - 所有表单字段的 useState
   - 表单验证逻辑
   - handleChange 函数
   - 实时预览计算

2. **useAIAnalysis.ts** (~200行)
   - AI API 调用
   - 文档解析
   - AI 打分逻辑
   - 结果处理

3. **useDocumentManager.ts** (~150行)
   - 文档上传
   - 文档列表管理
   - 文档预览
   - 文档删除

**第2步：拆分 UI Sections**

4. **BasicInfoSection.tsx** (~150行)
   - 需求名称
   - 提交人
   - 产品经理
   - 开发人员
   - 需求类型
   - 提交日期

5. **BusinessImpactSection.tsx** (~200行)
   - 业务域选择
   - 影响门店类型
   - 影响区域
   - 门店数量范围
   - 角色配置影响

6. **ComplexitySection.tsx** (~150行)
   - 工作量输入
   - 技术进展
   - 产品进展
   - 复杂度标准参考

7. **MetricsSection.tsx** (~150行)
   - OKR 指标选择
   - 流程指标选择
   - 指标影响度估算

8. **AIAnalysisSection.tsx** (~200行)
   - AI 模型选择
   - 分析触发按钮
   - 分析结果展示
   - AI 建议应用

9. **DocumentSection.tsx** (~200行)
   - 文档上传区域
   - 文档列表
   - 文档预览
   - 文档操作按钮

**第3步：重构主容器**

10. **EditRequirementModal.tsx** (~250行)
    - Modal 框架
    - Section 组合
    - 保存/取消按钮
    - 整体布局

#### 详细指南

参考: [docs/refactoring-guides/edit-requirement-modal-refactoring.md](./refactoring-guides/edit-requirement-modal-refactoring.md)

---

### 4. wsjf-sprint-planner.tsx (3102 → 480行)

**难度**: ⭐⭐⭐⭐⭐ (最复杂)
**预计工时**: 6-8 小时
**负责人**: [待分配]

#### 拆分方案

```
src/
├── wsjf-sprint-planner.tsx       (主入口，~300行)
├── components/
│   ├── Header.tsx                (顶部栏，~150行)
│   ├── ImportModal.tsx           (导入弹窗，~300行)
│   ├── ExportMenu.tsx            (导出菜单，~100行)
│   └── ToastContainer.tsx        (Toast容器，~50行) ✅已创建
└── hooks/
    ├── useToast.ts               (Toast逻辑，~80行) ✅已创建
    ├── useDataImport.ts          (导入逻辑，~300行)
    ├── useDataExport.ts          (导出逻辑，~200行)
    ├── useAIMapping.ts           (AI映射，~400行)
    └── useRequirementOps.ts      (需求操作，~150行)
```

#### 提取内容（按顺序）

**第1步：提取工具函数** ✅部分完成

1. ✅ `src/hooks/useToast.ts` - Toast 系统
2. ✅ `src/utils/fileImportHelpers.ts` - 文件解析和字段映射
3. `src/utils/dataTransform.ts` - 数据转换（导入时的字段验证和转换）
4. `src/utils/exportHelpers.ts` - 导出格式化

**第2步：提取 Hooks**

5. **useDataImport.ts** (~300行)
   - handleFileImport
   - handleConfirmImport
   - 数据验证
   - 分数计算集成

6. **useDataExport.ts** (~200行)
   - handleExportExcel
   - handleExportPNG
   - handleExportPDF
   - 数据格式化

7. **useAIMapping.ts** (~400行)
   - handleAIMapping
   - handleAISmartFill
   - AI API 调用逻辑
   - 结果处理

8. **useRequirementOps.ts** (~150行)
   - handleSaveRequirement
   - handleSaveSprint
   - handleDeleteSprint
   - handleAddSprint
   - handleApplyBatchScores

**第3步：拆分 UI 组件**

9. **Header.tsx** (~150行)
   - 标题和作者信息
   - 图例
   - 说明书按钮
   - 用户信息和登出
   - 紧凑模式切换
   - 导入/导出按钮

10. **ImportModal.tsx** (~300行)
    - 映射表格
    - AI 映射按钮
    - AI 智能填充
    - 预览数据
    - 确认/取消按钮
    - 清空选项

11. **ExportMenu.tsx** (~100行)
    - Excel 导出
    - PNG 导出
    - PDF 导出
    - 菜单下拉交互

**第4步：重构主文件**

12. **wsjf-sprint-planner.tsx** (~300行)
    - 数据初始化
    - 主布局
    - 组件组合
    - 拖拽处理（handleDragEnter, handleDragLeave, handleDrop）
    - Modal 条件渲染

#### 详细指南

参考: [docs/refactoring-guides/main-app-refactoring.md](./refactoring-guides/main-app-refactoring.md)

---

## 🛠️ 开发流程

### 每个重构任务的标准流程

#### 1. 准备阶段（5分钟）

```bash
# 创建功能分支
git checkout -b refactor/filename-reduction

# 确保代码最新
git pull origin main

# 运行初始检查
npm run check-file-size
npm run build
```

#### 2. 开发阶段（主要工作）

1. **阅读重构指南**
   - 查看对应文件的详细指南（`docs/refactoring-guides/`）
   - 理解拆分方案和提取内容

2. **创建目录结构**
   ```bash
   # 示例：重构 UnscheduledArea
   mkdir -p src/components/unscheduled/hooks
   ```

3. **逐步提取代码**
   - 先提取最独立的部分（工具函数、常量）
   - 再提取 Hooks（业务逻辑）
   - 最后拆分 UI 组件

4. **持续测试**
   - 每提取一个文件，立即运行 `npm run dev`
   - 测试相关功能是否正常
   - 修复编译错误

5. **检查文件大小**
   ```bash
   npm run check-file-size
   ```

#### 3. 测试阶段（30-60分钟）

**功能测试清单**：

- [ ] 页面加载正常
- [ ] 所有按钮可点击
- [ ] 表单输入正常
- [ ] 数据保存/加载正常
- [ ] 导入/导出功能正常
- [ ] AI 功能正常（如适用）
- [ ] 拖拽功能正常
- [ ] Toast 提示正常

**构建测试**：

```bash
# TypeScript 检查
npx tsc --noEmit

# 构建
npm run build

# 单元测试（如有）
npm run test
```

#### 4. 提交阶段（10分钟）

```bash
# 提交代码
git add .
git commit -m "refactor: reduce [filename] from XXX to YYY lines

- Extract [功能1] to [文件1]
- Extract [功能2] to [文件2]
- Update imports and exports

✅ File size: XXX → YYY lines
✅ All tests passing
✅ Build successful
"

# 推送分支
git push origin refactor/filename-reduction
```

#### 5. Code Review

**自检清单**：

- [ ] 文件大小 < 500 行
- [ ] 无 TypeScript 错误
- [ ] 无 ESLint 错误
- [ ] 功能测试通过
- [ ] 构建成功
- [ ] commit message 清晰

**提交 PR**：

在 GitHub 上创建 Pull Request，使用模板：

```markdown
## 重构说明

重构文件：`src/xxx.tsx`

原始行数：XXX
重构后：YYY
减少：ZZZ 行

## 拆分方案

- 提取 xxx 到 `src/yyy.ts`
- 提取 xxx 到 `src/zzz.tsx`

## 测试

- [x] 功能测试通过
- [x] 构建成功
- [x] 无 TS/ESLint 错误

## 截图

[如有 UI 变化，添加截图]
```

---

## 📚 参考文档

### 项目规范

- [架构指导原则](./architecture-guide.md)
- [新功能开发流程](./new-feature-workflow.md)
- [代码审查检查清单](./code-review-checklist.md)

### 重构指南（详细）

- [UnscheduledArea 重构指南](./refactoring-guides/unscheduled-area-refactoring.md)
- [BatchEvaluationModal 重构指南](./refactoring-guides/batch-evaluation-refactoring.md)
- [EditRequirementModal 重构指南](./refactoring-guides/edit-requirement-modal-refactoring.md)
- [主应用文件重构指南](./refactoring-guides/main-app-refactoring.md)

### 代码模板

- [Hook 模板](./templates/hook-template.ts)
- [组件模板](./templates/component-template.tsx)
- [工具函数模板](./templates/util-template.ts)

---

## ⚠️ 注意事项

### 常见陷阱

1. **循环依赖**
   - 提取代码时注意导入关系
   - 避免 A 导入 B，B 又导入 A

2. **状态丢失**
   - 确保 Zustand store 状态正确传递
   - 测试状态更新是否同步

3. **类型错误**
   - 提取后更新所有类型导入
   - 确保接口定义在正确位置

4. **性能问题**
   - 避免在 Hook 中创建不必要的状态
   - 使用 useMemo/useCallback 优化

### 遇到问题时

1. **编译错误**
   - 检查导入路径是否正确
   - 确认类型定义是否导出

2. **功能异常**
   - 对比原文件和新文件的逻辑
   - 使用 git diff 查看差异
   - 添加 console.log 调试

3. **不确定如何拆分**
   - 参考详细重构指南
   - 咨询团队其他成员
   - 在 PR 中标记为 "需要讨论"

---

## 📊 进度追踪

| 文件 | 负责人 | 状态 | 开始日期 | 完成日期 | PR链接 |
|------|--------|------|---------|---------|--------|
| UnscheduledArea.tsx | [待分配] | ⏳待开始 | - | - | - |
| BatchEvaluationModal.tsx | [待分配] | ⏳待开始 | - | - | - |
| EditRequirementModal.tsx | [待分配] | ⏳待开始 | - | - | - |
| wsjf-sprint-planner.tsx | [待分配] | ⏳待开始 | - | - | - |

**图例**：
- ⏳ 待开始
- 🔄 进行中
- ✅ 已完成
- ⚠️ 遇到问题

---

## 🎉 完成标准

### 全部重构完成后

1. **运行完整检查**
   ```bash
   npm run check-file-size
   npm run build
   npm run test
   ```

2. **验证输出**
   ```
   ✅ 所有文件 < 500 行
   ✅ TypeScript 编译通过
   ✅ 所有测试通过
   ✅ 构建成功
   ```

3. **更新文档**
   - 更新 CHANGELOG.md
   - 更新架构文档
   - 庆祝完成！🎊

---

**最后更新**: 2025-01-20
**维护者**: Claude Code Team
