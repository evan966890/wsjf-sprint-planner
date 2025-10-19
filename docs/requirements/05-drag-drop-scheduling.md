# 拖拽排期需求文档

## 需求概述
- **功能名称**: 拖拽式需求排期
- **业务价值**: 直观的拖拽操作，快速完成需求排期
- **优先级**: 🔴 P0 - 核心功能

## 核心功能

### 1. 拖拽操作

**支持的拖拽场景：**
- 从待排期区 → 迭代池
- 从迭代池A → 迭代池B
- 从迭代池 → 待排期区

**交互反馈：**
- 拖拽开始：卡片半透明，显示"拖拽中"状态
- 拖拽悬停：目标区域高亮边框
- 拖拽放下：平滑动画，卡片移动到目标位置
- 拖拽取消：卡片回到原位置

### 2. 容量验证

**规则：**
- 拖入迭代池前检查容量
- 如果超载（使用率>100%），允许拖入但显示警告
- 警告提示："该迭代池已超载 15%，建议调整"

**容量实时更新：**
- 拖入后立即更新迭代池使用率
- 进度条颜色变化：绿色 → 黄色 → 红色

### 3. 排序优化

**待排期区自动排序：**
- 按权重分降序排列
- 5星需求置顶

**迭代池手动排序：**
- 支持在池内拖拽调整顺序
- 顺序代表优先级

## 技术实现

**HTML5 Drag & Drop API：**
```typescript
// 拖拽开始
const handleDragStart = (e: React.DragEvent, reqId: string, poolId?: string) => {
  e.dataTransfer.setData('reqId', reqId);
  e.dataTransfer.setData('sourcePoolId', poolId || 'unscheduled');
  setDraggingId(reqId);
};

// 拖拽悬停
const handleDragOver = (e: React.DragEvent) => {
  e.preventDefault();  // 允许放下
};

// 拖拽放下
const handleDrop = (e: React.DragEvent, targetPoolId?: string) => {
  e.preventDefault();
  const reqId = e.dataTransfer.getData('reqId');
  const sourcePoolId = e.dataTransfer.getData('sourcePoolId');
  
  // 移动需求
  moveRequirement(reqId, sourcePoolId, targetPoolId);
  
  setDraggingId(null);
};
```

## 验收标准
- [ ] 拖拽流畅，无卡顿
- [ ] 容量验证正确
- [ ] 超载时显示警告
- [ ] 使用率实时更新
- [ ] 待排期区自动按权重分排序

**最后更新**: 2025-01-19
