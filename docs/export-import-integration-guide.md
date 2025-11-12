# WSJF 导出/导入功能集成指南

## 📋 概述

本文档说明如何将新的双模式导出和完整导入功能集成到主应用中。

## ✅ 已完成的工作

### 核心服务层（100%完成）
- ✅ [src/types/export.ts](../src/types/export.ts) - 161行 - 类型定义
- ✅ [src/services/exportService.ts](../src/services/exportService.ts) - 299行 - 导出服务
- ✅ [src/services/validationService.ts](../src/services/validationService.ts) - 225行 - 验证服务
- ✅ [src/services/importService.ts](../src/services/importService.ts) - 237行 - 导入服务

### Hook层（100%完成）
- ✅ [src/hooks/useDataExport.ts](../src/hooks/useDataExport.ts) - 250行 - 增强的导出/导入Hook

### UI组件（100%完成）
- ✅ [src/components/ExportMenuModal.tsx](../src/components/ExportMenuModal.tsx) - 191行 - 导出菜单
- ✅ [src/components/ImportValidationModal.tsx](../src/components/ImportValidationModal.tsx) - 310行 - 导入验证

### 测试（基础完成）
- ✅ [src/services/__tests__/exportService.test.ts](../src/services/__tests__/exportService.test.ts) - 导出服务测试
- ✅ [src/services/__tests__/validationService.test.ts](../src/services/__tests__/validationService.test.ts) - 验证服务测试

## 🔧 集成步骤

### 第一步：在 Zustand Store 中添加状态

**文件**: `src/store/useStore.ts`

```typescript
// 添加导入相关状态
interface WSJFStore {
  // ... 现有状态 ...

  // 导入相关状态（新增）
  showImportModal: boolean;
  setShowImportModal: (show: boolean) => void;
}

// 在 create 函数中添加
export const useStore = create<WSJFStore>()(
  devtools(
    persist(
      (set, get) => ({
        // ... 现有状态 ...

        // 导入相关状态（新增）
        showImportModal: false,
        setShowImportModal: (show) => set({ showImportModal: show }),
      }),
      { name: 'wsjf-storage' }
    )
  )
);
```

### 第二步：在主应用中集成组件

**文件**: `src/wsjf-sprint-planner.tsx`

```typescript
// 1. 导入新组件
import { ExportMenuModal } from './components/ExportMenuModal';
import { ImportValidationModal } from './components/ImportValidationModal';

// 2. 在组件中使用增强的 Hook
export default function WSJFPlanner() {
  // 获取状态
  const showImportModal = useStore((state) => state.showImportModal);
  const setShowImportModal = useStore((state) => state.setShowImportModal);

  // 使用增强的 Hook（支持导入回调）
  const {
    handleExportExcel,
    handleExportPNG,
    handleExportPDF,
    handleExportEnhanced,    // 新增：增强的导出
    handleValidateImport,    // 新增：验证导入
    handleImport,            // 新增：执行导入
    isImporting,             // 新增：导入状态
  } = useDataExport(sprintPools, unscheduled, (requirements, pools, unscheduledIds) => {
    // 导入成功回调：更新应用状态
    setRequirements(requirements);
    setSprintPools(pools);

    // 重建未排期需求列表
    const unscheduledReqs = requirements.filter(r =>
      unscheduledIds.includes(r.id)
    );
    setUnscheduled(unscheduledReqs);

    showToast('导入成功！', 'success');
  });

  // 3. 渲染组件
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ... 现有内容 ... */}

      {/* 导出菜单模态框（替换原有的简单导出） */}
      <ExportMenuModal
        isOpen={showExportMenu}
        onClose={() => setShowExportMenu(false)}
        onExport={(config) => {
          handleExportEnhanced(config);
          showToast('导出成功！', 'success');
        }}
      />

      {/* 导入验证模态框（新增） */}
      <ImportValidationModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onValidate={handleValidateImport}
        onImport={async (file, options) => {
          await handleImport(file, options);
        }}
        isImporting={isImporting}
      />
    </div>
  );
}
```

### 第三步：在 Header 组件中添加导入按钮

**文件**: `src/components/Header.tsx`

```typescript
// 添加导入按钮
<button
  onClick={() => setShowImportModal(true)}
  className="px-3 py-1.5 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors flex items-center gap-1"
>
  <Upload className="w-4 h-4" />
  导入
</button>
```

## 📊 功能说明

### 双模式导出

#### 展示模式（Presentation Mode）
- **用途**：人类阅读、数据分析、报表生成
- **格式**：单Sheet Excel
- **字段**：30+ 扩展字段
- **限制**：不支持完整还原

**导出字段列表**：
```
迭代池、需求名称、需求提交人、提交方、提交日期、业务团队
产品经理、后端研发、前端研发、测试、项目名称、产品领域
需求类型、工作量(天)、业务影响度、影响指标、影响范围
技术复杂度、迫切程度、强制DDL、DDL日期、权重分、星级
产品进度、技术进度、业务域、业务子域、RMS、依赖需求数、产研备注
```

#### 数据模式（Data Mode）
- **用途**：数据备份、跨设备迁移、版本归档
- **格式**：多Sheet Excel 或 JSON
- **字段**：完整保留所有字段（包括复杂对象）
- **功能**：支持100%导入还原

**Excel 结构**：
- Sheet 1: 元数据（版本、时间戳、统计信息）
- Sheet 2: 需求数据（完整字段，复杂对象序列化为JSON）
- Sheet 3: 迭代池配置（时间、资源预留、需求关联）
- Sheet 4: 待排期列表（需求ID列表）

### 导入验证流程

1. **文件格式检测**：自动识别 JSON 或 Excel 格式
2. **多层次验证**：
   - 基础结构验证（必需字段）
   - 版本兼容性检查（支持 1.2.0 - 1.6.0）
   - 数据完整性验证（引用关系）
   - 需求字段验证（抽样检查）
3. **预览生成**：显示导入数据统计和示例
4. **导入前备份**：自动保存当前数据到 localStorage

### 错误处理

**错误级别**：
- `critical`: 致命错误，阻止导入
- `error`: 错误，建议修复
- `warning`: 警告，可继续导入

**常见错误**：
- `INVALID_FORMAT`: 文件格式无效
- `MISSING_METADATA`: 缺少元数据
- `VERSION_INCOMPATIBLE`: 版本不兼容
- `MISSING_REQUIREMENTS`: 缺少需求数据
- `MISSING_REQUIREMENT_REF`: 需求引用丢失

## 🧪 测试验证

### 运行单元测试

```bash
npm run test
```

### 手动测试流程

#### 测试导出功能
1. 打开应用，添加一些测试数据
2. 点击"导出"按钮
3. 选择"展示模式" → 导出 Excel → 用 Excel 打开验证
4. 选择"数据模式" → 导出 Excel → 验证4个Sheet
5. 选择"数据模式" → 导出 JSON → 用文本编辑器验证

#### 测试导入功能
1. 使用"数据模式"导出一个文件
2. 清空应用数据
3. 点击"导入"按钮
4. 选择刚导出的文件
5. 验证数据预览显示正确
6. 确认导入
7. 验证所有数据完整还原

#### 测试错误处理
1. 尝试导入"展示模式"导出的文件（应该显示错误）
2. 尝试导入格式错误的JSON文件
3. 验证错误消息清晰明确

## 📝 向后兼容性

### 旧接口保留

```typescript
// 旧接口继续可用（向后兼容）
const { handleExportExcel, handleExportPNG, handleExportPDF } = useDataExport(...);

// 新接口（推荐使用）
const { handleExportEnhanced, handleImport } = useDataExport(...);
```

### 旧版本数据迁移

支持导入以下版本的数据：
- ✅ v1.6.0 (当前版本)
- ✅ v1.5.0
- ✅ v1.4.0
- ✅ v1.3.0
- ✅ v1.2.0

导入旧版本数据时会自动：
- 显示版本警告
- 尝试自动修复常见问题
- 建议重新导出更新格式

## 🚀 性能优化建议

### 大数据量处理

当需求数量 > 1000 时，建议：
1. 使用 JSON 格式导出（文件更小）
2. 导入时使用"替换模式"而非"追加模式"
3. 考虑分批处理（未来优化）

### 内存优化

- 导出时使用流式处理（XLSX库内置）
- 导入时分块读取文件（已实现）
- 及时清理临时对象（已实现）

## 🔒 安全注意事项

1. **输入验证**：所有导入数据都经过严格验证
2. **XSS防护**：不直接渲染用户输入的HTML
3. **文件大小限制**：建议限制上传文件大小（未实现，建议添加）
4. **敏感信息**：不在导出文件中包含敏感信息

## 📌 后续优化建议

### 短期（1-2周）
- [ ] 添加文件大小限制（建议 10MB）
- [ ] 添加导入进度条
- [ ] 优化大数据量性能
- [ ] 添加更多单元测试

### 中期（1个月）
- [ ] Web Worker 后台处理
- [ ] 断点续传支持
- [ ] 增量导入功能
- [ ] 导入预览优化

### 长期（3个月）
- [ ] 云端备份集成
- [ ] 多用户协作支持
- [ ] 版本历史管理
- [ ] 数据diff和合并

## 🆘 故障排查

### 导出失败
1. 检查浏览器控制台错误
2. 验证 XLSX 库是否正确加载
3. 检查是否有足够的内存

### 导入失败
1. 验证文件格式是否正确
2. 检查文件是否损坏
3. 查看验证错误详情

### 数据不完整
1. 确保使用"数据模式"导出
2. 验证导出时没有错误
3. 检查导入时的警告信息

## 📞 技术支持

遇到问题请：
1. 查看本文档的故障排查章节
2. 检查浏览器控制台错误
3. 提交 GitHub Issue（包含错误日志和复现步骤）

---

**版本**: v1.6.0
**最后更新**: 2025-01-12
**维护者**: WSJF Team
