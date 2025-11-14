# 测试补充路线图

**当前状态**: v1.6.0
**测试通过率**: 100% (66/66)
**测试覆盖率**: 2.8%
**目标覆盖率**: 80%

---

## 📊 当前测试状态

### 已完成的测试（66个）

| 文件 | 测试数 | 覆盖率 | 状态 |
|-----|-------|--------|------|
| scoring.test.ts | 13 | 96.36% | ✅ 优秀 |
| exportService.test.ts | 6 | 92.34% | ✅ 优秀 |
| RequirementCard.test.tsx | 17 | 82.25% | ✅ 良好 |
| validationService.test.ts | 8 | 78.53% | ✅ 良好 |
| useToast.test.ts | 9 | - | ✅ 新增 |
| Header.test.tsx | 13 | - | ✅ 新增 |

### 覆盖率高的模块

- ✅ scoring.ts: 96.36%
- ✅ exportService.ts: 92.34%
- ✅ RequirementCard.tsx: 82.25%
- ✅ validationService.ts: 78.53%

---

## 🎯 后续测试计划（达到80%覆盖率）

### Phase 1: 核心工具函数（优先级：高）

估计时间：4小时
目标覆盖率：95%+

**需要测试的文件**：

1. **fileParser.ts** (0% → 90%)
   - Excel文件解析
   - JSON文件解析
   - 错误处理
   - 估计：15个测试用例

2. **migration.ts** (0% → 90%)
   - 数据迁移逻辑
   - 版本兼容性
   - 字段映射
   - 估计：12个测试用例

3. **validation.ts** (0% → 90%)
   - 需求验证规则
   - 字段格式检查
   - 估计：10个测试用例

4. **sampleDataLoader.ts** (0% → 100%)
   - 示例数据生成
   - 估计：5个测试用例

**预期成果**：+42个测试，覆盖率提升至~15%

### Phase 2: Hooks（优先级：高）

估计时间：4小时
目标覆盖率：85%+

**需要测试的文件**：

1. **useDragDrop.ts** (0% → 90%)
   - 拖拽事件处理
   - 状态更新
   - 估计：8个测试用例

2. **useDataImport.ts** (0% → 85%)
   - 文件导入
   - 数据验证
   - 估计：10个测试用例

3. **useDataExport.ts** (0% → 85%)
   - 导出功能
   - 格式转换
   - 估计：8个测试用例

4. **useSprintOperations.ts** (0% → 90%)
   - 迭代池操作
   - 需求移动
   - 估计：12个测试用例

**预期成果**：+38个测试，覆盖率提升至~30%

### Phase 3: UI组件（优先级：中）

估计时间：6小时
目标覆盖率：75%+

**需要测试的文件**：

1. **UnscheduledArea.tsx** (0% → 75%)
   - 筛选功能
   - 排序功能
   - 估计：15个测试用例

2. **SprintPoolComponent.tsx** (0% → 75%)
   - 迭代池显示
   - 拖拽区域
   - 估计：12个测试用例

3. **EditRequirementModal.tsx** (0% → 70%)
   - 表单验证
   - 数据保存
   - 估计：20个测试用例

4. **HandbookModal.tsx** (0% → 80%)
   - 说明书显示
   - 估计：5个测试用例

**预期成果**：+52个测试，覆盖率提升至~55%

### Phase 4: 业务逻辑层（优先级：高）

估计时间：4小时
目标覆盖率：85%+

**需要测试的文件**：

1. **useStore.ts** (0% → 85%)
   - 状态管理
   - Actions测试
   - 估计：25个测试用例

2. **wsjf-sprint-planner.tsx** (0% → 60%)
   - 主应用逻辑
   - 集成测试
   - 估计：15个测试用例

**预期成果**：+40个测试，覆盖率提升至~80%

---

## 📈 里程碑目标

| 里程碑 | 测试数 | 覆盖率 | 预计时间 | 状态 |
|-------|--------|--------|---------|------|
| ✅ M0: 基础测试 | 66 | 2.8% | - | 已完成 |
| M1: 核心工具 | 108 | 15% | +4h | 待执行 |
| M2: Hooks层 | 146 | 30% | +4h | 待执行 |
| M3: UI组件 | 198 | 55% | +6h | 待执行 |
| M4: 业务逻辑 | 238 | 80% | +4h | 待执行 |

**总计**：238个测试，80%覆盖率，18小时工作量

---

## 🚀 快速启动下一阶段

### Phase 1 优先执行

```bash
# 1. 创建测试文件
touch src/utils/__tests__/migration.test.ts
touch src/utils/__tests__/validation.test.ts
touch src/utils/__tests__/sampleDataLoader.test.ts

# 2. 运行测试（watch模式）
npm run test

# 3. 参考现有测试编写新测试
# - 参考 scoring.test.ts 的结构
# - 参考 TDD规范文档
```

---

## 📝 测试编写指南

### 优先级排序

1. **高价值高风险**：核心算法、数据处理（utils/, hooks/）
2. **高频使用**：主要组件、常用功能
3. **复杂逻辑**：状态管理、业务规则
4. **低风险**：简单展示组件

### 测试覆盖重点

每个文件应包含：
- ✅ 正常流程（Happy Path）
- ✅ 边界条件（Edge Cases）
- ✅ 错误处理（Error Handling）
- ✅ 数据验证（Validation）

### 时间分配建议

- 简单工具函数：20-30分钟
- 复杂Hook：40-60分钟
- UI组件：30-45分钟
- 状态管理：60-90分钟

---

## 🔧 技术债务

### 已知测试难点

1. **fileParser.ts**
   - 依赖pdf.js，在测试环境有DOMMatrix问题
   - 解决方案：Mock pdf.js或使用真实文件测试
   - 优先级：中（可暂时跳过）

2. **wsjf-sprint-planner.tsx**
   - 大型集成组件（500+行）
   - 测试复杂度高
   - 建议：先重构拆分，再编写测试

3. **飞书集成模块**
   - 依赖外部API
   - 需要Mock HTTP请求
   - 建议：使用MSW (Mock Service Worker)

---

## 📚 参考资源

- [TDD强制规范](../standards/test-driven-development.md)
- [Vitest文档](https://vitest.dev/)
- [Testing Library文档](https://testing-library.com/)

---

**下一步行动**：
1. Review本文档
2. 从Phase 1开始执行
3. 每完成一个Phase提交一次
4. 持续监控覆盖率提升

---

**更新时间**: 2025-11-14
**负责人**: 开发团队
**Review周期**: 每周
