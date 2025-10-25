# WSJF Sprint Planner 完整测试套件

## 测试覆盖范围

本测试套件包含10个测试文件，覆盖应用的所有核心功能：

### 1. 页面加载和基础渲染 (01-page-load.spec.ts)
- ✅ 页面标题正确
- ✅ 页面核心区域渲染正确
- ✅ 初始数据加载正确
- ✅ 控制按钮组正确渲染
- ✅ 页面无控制台错误

### 2. 需求卡片功能 (02-requirement-card.spec.ts)
- ✅ 需求卡片展示完整信息
- ✅ 需求卡片显示评分信息
- ✅ 不可排期需求不显示评分
- ✅ 需求卡片可以点击编辑
- ✅ 需求卡片拖拽功能
- ✅ 需求卡片颜色渐变正确

### 3. 需求编辑弹窗 (03-edit-requirement-modal.spec.ts)
- ✅ 新建需求弹窗可以打开
- ✅ 所有必填字段都存在
- ✅ 需求标题输入正常
- ✅ 需求描述输入正常
- ✅ 业务影响度选择正常
- ✅ 技术复杂度没有默认值
- ✅ 时间窗口选择正常
- ✅ 强制截止日期可以切换
- ✅ 取消按钮正常工作
- ✅ 保存按钮存在且类型正确
- ✅ 实时预览功能可见
- ✅ 弹窗样式正确

### 4. 筛选和排序功能 (04-filter-and-sort.spec.ts)
- ✅ 待排期区筛选栏存在
- ✅ 业务线筛选功能正常
- ✅ 技术进展筛选功能正常
- ✅ 可排期/不可排期分组正确
- ✅ 需求按权重分排序

### 5. 迭代池功能 (05-sprint-pool.spec.ts)
- 新建迭代池
- 编辑迭代池
- 删除迭代池
- 容量计算
- 需求排期

### 6. 导入导出功能 (06-import-export.spec.ts)
- JSON导出
- JSON导入
- Excel导入
- Word导入
- PDF/图片OCR导入

### 7. WSJF说明书弹窗 (07-handbook-modal.spec.ts)
- 说明书打开和关闭
- 内容展示
- 样式正确

### 8. 拖拽功能 (08-drag-and-drop.spec.ts)
- ✅ 需求卡片可以拖拽
- ✅ 拖拽卡片显示视觉效果
- ✅ 迭代池有拖拽放置区域
- ✅ 拖拽测试 - 完整流程

### 9. AI分析功能 (09-ai-analysis.spec.ts)
- AI辅助评估
- 快速分析
- 批量评估

### 10. 响应式设计 (10-responsive-design.spec.ts)
- 桌面端显示
- 移动端适配
- 不同分辨率

## 执行方式

### Playwright测试
```bash
# 运行所有测试
npm run test:visual

# 运行特定测试文件
npx playwright test tests/comprehensive/01-page-load.spec.ts

# 使用UI模式
npm run test:visual:ui

# 查看报告
npm run test:visual:report
```

### DevTools MCP测试
```bash
# 通过Claude Code + DevTools MCP执行
# 详见 scripts/devtools-mcp-test-plan.md
```

## 测试环境要求

- Node.js 18+
- Chrome/Chromium浏览器
- 开发服务器运行在 http://localhost:3000
- 所有依赖已安装

## 注意事项

1. 测试前确保开发服务器已启动
2. 某些测试可能需要特定的初始数据
3. 拖拽测试在不同浏览器中可能有差异
4. AI功能测试需要相关服务配置
