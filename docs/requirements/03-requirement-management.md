# 需求管理需求文档

## 需求概述
- **功能名称**: 需求全生命周期管理
- **业务价值**: 支持需求的新增、编辑、删除、查看和状态跟踪
- **优先级**: 🔴 P0 - 核心功能

## 核心功能

### 1. 新增需求
- 点击"新增需求"按钮打开编辑弹窗
- 必填字段：需求名称、提交人、工作量
- 可选字段：描述、文档、业务影响度、技术复杂度等
- 实时预览权重分和星级
- 保存后自动计算权重分并排序

### 2. 编辑需求
- 点击需求卡片的"编辑"按钮
- 加载现有数据到表单
- 修改后实时更新预览
- 保存后重新计算所有需求的权重分

### 3. 删除需求
- 点击"删除"按钮
- 弹出确认对话框
- 确认后从列表中移除
- 触发权重分重新计算

### 4. 查看需求
- 需求卡片显示核心信息：
  - 第一行：标题 + 权重分 + 星级 + 业务域
  - 第二行：基本信息（提交人、PM、研发等）
  - 第三行：评分卡片（业务影响度、复杂度、工作量等）
- 支持展开/收起详情
- 详情包含：需求相关性、影响指标

## 数据模型

```typescript
interface Requirement {
  id: string;
  name: string;
  submitterName: string;
  submitDate: string;
  submitter: '产品' | '研发' | '业务';
  
  description?: string;
  documents?: Document[];
  
  businessImpactScore?: 1-10;
  complexityScore?: 1-10;
  effortDays: number;
  timeCriticality?: '随时' | '三月窗口' | '一月硬窗口';
  hardDeadline: boolean;
  deadlineDate?: string;
  
  businessDomain: string;
  type: string;
  productManager: string;
  developer: string;
  productProgress: string;
  techProgress: string;
  
  displayScore?: number;  // 1-100
  stars?: number;  // 2-5
}
```

## 验收标准
- [ ] 新增需求保存成功
- [ ] 编辑需求保存成功，数据正确更新
- [ ] 删除需求后列表正确更新
- [ ] 权重分自动重新计算
- [ ] 实时预览准确显示

**最后更新**: 2025-01-19
