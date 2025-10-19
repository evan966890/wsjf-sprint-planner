# AI文档分析功能升级需求文档

**项目**: WSJF Sprint Planner
**功能模块**: AI文档分析（EditRequirementModal）
**版本**: v1.3.1
**创建日期**: 2025-01-19
**负责人**: 开发团队

---

## 📋 目录

- [需求概述](#需求概述)
- [当前问题分析](#当前问题分析)
- [优化方案设计](#优化方案设计)
- [技术实现方案](#技术实现方案)
- [完整交互流程](#完整交互流程)
- [验收标准](#验收标准)
- [实施计划](#实施计划)
- [风险评估](#风险评估)

---

## 需求概述

### 背景

当前AI文档分析功能（位于新增/编辑需求界面）存在以下问题：
1. AI启动条件不严格，可能在内容不足时启动
2. 不支持本地文件上传，只能输入在线文档链接
3. 分项采纳机制不完善，采纳后AI建议消失
4. AI建议区域不可折叠，占用屏幕空间

### 目标

通过本次升级，优化AI文档分析功能的用户体验，提升分析准确性和交互流畅度。

### 优化范围

**核心优化（P0）：**
1. ✅ AI启动条件验证机制
2. ✅ PDF和Excel文件上传功能
3. ✅ 分项采纳机制优化
4. ✅ AI建议区域交互优化

**未来优化（P1）：**
- 自动触发分析机制
- Word文档上传支持
- 剪贴板粘贴图片

---

## 当前问题分析

### 问题1：AI启动条件不严格

**当前代码（EditRequirementModal.tsx:714）：**
```typescript
disabled={isAIAnalyzing || (!newDocUrl.trim() && (!form.documents || form.documents.length === 0))}
```

**问题描述：**
- ❌ 只检查是否有文档URL，不检查内容质量
- ❌ 用户可以输入极短的文档链接就启动AI
- ❌ 需求描述可以为空或只有几个字
- ❌ AI分析内容不足时返回无意义结果，浪费API调用

**影响：**
- 浪费AI API调用次数和成本
- AI返回的分析结果质量差
- 用户体验不佳

---

### 问题2：缺少文件上传功能

**当前实现（EditRequirementModal.tsx:684-730）：**
```typescript
// 只支持输入链接
<input type="url" placeholder="文档链接（如飞书文档、Google Docs等）" />
```

**问题描述：**
- ❌ 不支持本地文件上传
- ❌ 用户必须先把文件上传到在线平台（飞书、Google Docs）
- ❌ 增加操作步骤，降低使用意愿
- ❌ 无法处理本地保存的PDF、Excel需求文档

**影响：**
- 用户体验差，操作步骤繁琐
- 阻碍用户使用AI功能
- 无法覆盖常见的本地文档场景

---

### 问题3：分项采纳机制不完善

**当前实现（EditRequirementModal.tsx:833-876）：**
```typescript
const handleAdoptAll = () => {
  // ... 应用数据
  setAIAnalysisResult(null); // ← AI建议直接删除，无法再查看
};
```

**问题描述：**
- ❌ 采纳后AI建议直接消失，用户无法再次查看分析理由
- ❌ "暂不采纳"逻辑混乱，点击后AI建议也消失
- ❌ 缺少"忽略并折叠"选项
- ❌ 无法保留AI分析记录供后续参考

**影响：**
- 用户无法验证AI分析的合理性
- 无法对比采纳前后的差异
- 无法追溯评分依据

---

### 问题4：AI建议区域不可折叠

**当前实现（EditRequirementModal.tsx:760-878）：**
```typescript
{aiAnalysisResult && (
  <div className="...">
    {/* 固定展开的内容，无法收起 */}
  </div>
)}
```

**问题描述：**
- ❌ AI分析结果显示后，无法收起
- ❌ 占据大量垂直空间，影响查看其他字段
- ❌ 没有区分"待处理"、"已采纳"、"已忽略"状态
- ❌ 用户不知道是否已经处理过AI建议

**影响：**
- 屏幕空间利用率低
- 滚动距离长，操作效率低
- 状态不清晰，容易重复操作

---

## 优化方案设计

### 方案1：AI启动条件验证机制

#### 1.1 验证逻辑

```typescript
// 新增：内容充足性检查函数
const checkContentSufficiency = () => {
  const descLength = (form.description || '').trim().length;
  const hasUploadedFiles = uploadedFiles.length > 0; // 本地上传的文件
  const hasDocLinks = (form.documents || []).length > 0; // 在线文档链接

  return {
    isDescSufficient: descLength >= 50,
    hasFiles: hasUploadedFiles || hasDocLinks,
    canStartAI: descLength >= 50 || hasUploadedFiles || hasDocLinks,
    descLength,
    filesCount: uploadedFiles.length + (form.documents || []).length
  };
};
```

#### 1.2 验证规则

| 条件 | 规则 | 说明 |
|------|------|------|
| **最小可行条件** | 描述≥50字 **OR** 已上传文件 | 至少满足一项 |
| **最佳条件** | 描述≥50字 **AND** 已上传文件 | 两者都有，分析效果最好 |

#### 1.3 UI状态提示

**状态1：内容不足（禁用AI分析）**
```
┌─────────────────────────────────────────────────────────────┐
│ 📝 需求描述 (已输入 35/50字)                                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 当前经销商对账完全靠人工...                             │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ⚠️ 内容不足：请继续补充描述(至少50字) 或上传文档            │
│                                                             │
│ [AI智能分析] ← 禁用，灰色                                   │
└─────────────────────────────────────────────────────────────┘
```

**状态2：内容充足（可启动AI）**
```
┌─────────────────────────────────────────────────────────────┐
│ 📝 需求描述 (已输入 156字) ✓                                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 当前经销商对账完全靠人工，每月月底需要...              │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ✅ 内容充足，可以启动AI分析                                 │
│                                                             │
│ [✨ AI智能分析] ← 可用，紫色高亮                            │
└─────────────────────────────────────────────────────────────┘
```

#### 1.4 实时提示文案

| 状态 | 提示文案 | 颜色 |
|------|---------|------|
| 描述不足 & 无文件 | `⚠️ 内容不足：请补充描述(至少50字)或上传文档` | 黄色警告 |
| 描述不足 & 有文件 | `✅ 已上传文档，可启动AI分析` | 绿色成功 |
| 描述充足 & 无文件 | `✅ 描述充足，可启动AI分析` | 绿色成功 |
| 描述充足 & 有文件 | `✅ 描述和文档齐全，AI分析效果更好` | 蓝色提示 |

---

### 方案2：PDF和Excel文件上传功能

#### 2.1 支持的文件格式

| 格式 | MIME类型 | 最大大小 | 解析方式 |
|------|---------|---------|---------|
| **PDF** | `application/pdf` | 10MB | pdfjs-dist |
| **Excel (.xlsx)** | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | 10MB | xlsx (已有) |
| **Excel (.xls)** | `application/vnd.ms-excel` | 10MB | xlsx (已有) |

#### 2.2 技术实现方案

**文件存储方式：**
- ✅ 前端解析，不上传到服务器（推荐）
- 使用 `File` 对象暂存本地文件
- 使用 FileReader API读取文件内容
- AI分析时将解析后的文本发送给AI

**PDF解析：**
```typescript
import * as pdfjsLib from 'pdfjs-dist';

async function parsePDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n';
  }

  return fullText;
}
```

**Excel解析：**
```typescript
import * as XLSX from 'xlsx';

async function parseExcel(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer);

  let fullText = '';
  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    fullText += `Sheet: ${sheetName}\n`;
    fullText += json.map(row => (row as any[]).join(' | ')).join('\n');
    fullText += '\n\n';
  });

  return fullText;
}
```

#### 2.3 UI组件设计

```
┌─────────────────────────────────────────────────────────────┐
│ 📎 上传需求文档                                             │
│                                                             │
│ ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐ │
│   [📄 点击上传] 或 拖拽文件到这里                          │
│ │                                                         │ │
│   支持格式: PDF, Excel (.xlsx/.xls)                       │
│ │ 最大文件: 10MB                                          │ │
│ └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘ │
│                                                             │
│ 已上传文件:                                                 │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📄 经销商对账PRD.pdf                                     │ │
│ │    5页 | 512KB | 已解析(3200字) ✓                       │ │
│ │    [👁️ 预览文本] [🗑️ 删除]                              │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ 📊 需求数据统计.xlsx                                     │ │
│ │    3个Sheet | 256KB | 已解析(1500字) ✓                  │ │
│ │    [👁️ 预览文本] [🗑️ 删除]                              │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 💡 提示：文档已准备好，建议立即进行AI智能分析               │
│ [✨ 立即AI分析]                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 2.4 文件上传交互流程

1. **上传触发**
   - 点击"点击上传"按钮
   - 拖拽文件到虚线框内

2. **文件验证**
   - 检查文件格式（仅PDF、Excel）
   - 检查文件大小（≤10MB）
   - 显示错误提示（格式不支持或超过大小限制）

3. **文件解析**
   - 显示解析进度："正在解析... ⏳"
   - 解析完成后显示："已解析(N字) ✓"
   - 解析失败显示："解析失败 ❌"

4. **文件管理**
   - 预览文本：在Modal中显示解析后的文本内容
   - 删除文件：从列表中移除

#### 2.5 状态管理

```typescript
// 文件信息接口
interface UploadedFileInfo {
  id: string;
  file: File;
  name: string;
  size: number;
  type: 'pdf' | 'excel';
  uploadedAt: string;
  parseStatus: 'parsing' | 'success' | 'error';
  parsedContent?: string; // 解析后的文本内容
  parsedWordCount?: number; // 字数统计
  pageCount?: number; // PDF页数
  sheetCount?: number; // Excel Sheet数
  errorMessage?: string; // 解析错误信息
}

// 状态
const [uploadedFiles, setUploadedFiles] = useState<UploadedFileInfo[]>([]);
```

---

### 方案3：分项采纳机制优化

#### 3.1 状态管理设计

```typescript
// AI建议状态类型
type AIAdoptionStatus = 'pending' | 'adopted' | 'ignored' | 'partial';

// AI分析状态接口
interface AIAnalysisState {
  result: AIAnalysisResult | null;
  status: AIAdoptionStatus;
  adoptedItems: {
    score: boolean;          // 是否采纳了评分
    okrMetrics: boolean;     // 是否采纳了OKR指标
    processMetrics: boolean; // 是否采纳了过程指标
  };
  adoptedAt?: string;        // 采纳时间
  isCollapsed: boolean;      // 是否折叠
}

// 状态定义
const [aiAnalysis, setAIAnalysis] = useState<AIAnalysisState>({
  result: null,
  status: 'pending',
  adoptedItems: { score: false, okrMetrics: false, processMetrics: false },
  isCollapsed: false
});
```

#### 3.2 采纳选项设计

**待处理状态（status = 'pending'）：**
```
┌─────────────────────────────────────────────────────────┐
│ 选择采纳方式:                                           │
│                                                         │
│ [✨ 一键采纳全部建议]  ← 主要操作，绿色，大按钮          │
│                                                         │
│ 分项采纳:                                               │
│ [📊 仅采纳评分 8分]  [🎯 仅采纳OKR指标(3个)]            │
│ [📈 仅采纳过程指标(3个)]                                │
│                                                         │
│ [❌ 忽略AI建议]  [🔄 重新分析]  ← 次要操作，灰色        │
└─────────────────────────────────────────────────────────┘
```

**已采纳状态（status = 'adopted'）：**
```
┌─────────────────────────────────────────────────────────┐
│ ✅ 已采纳AI建议（全部）                                  │
│ 采纳时间: 2025-01-19 15:35                              │
│                                                         │
│ [🔄 重新分析]  [📝 继续调整]  ← 辅助操作                │
└─────────────────────────────────────────────────────────┘
```

**部分采纳状态（status = 'partial'）：**
```
┌─────────────────────────────────────────────────────────┐
│ ⚡ 部分采纳AI建议                                        │
│ 已采纳: ✓ 评分  ✓ OKR指标  ✗ 过程指标                  │
│                                                         │
│ 继续采纳:                                               │
│ [📈 采纳过程指标(3个)]                                  │
│                                                         │
│ [🔄 重新分析]                                           │
└─────────────────────────────────────────────────────────┘
```

**已忽略状态（status = 'ignored'）：**
```
┌─────────────────────────────────────────────────────────┐
│ ⊗ AI建议已忽略（已折叠）                                 │
│                                                         │
│ [🔄 重新分析]  [👁️ 查看建议]  ← 可重新查看              │
└─────────────────────────────────────────────────────────┘
```

#### 3.3 采纳逻辑实现

```typescript
// 1. 一键采纳全部
const handleAdoptAll = () => {
  setForm(prev => ({
    ...prev,
    businessImpactScore: aiAnalysis.result!.suggestedScore,
    affectedMetrics: [
      ...aiAnalysis.result!.suggestedOKRMetrics,
      ...aiAnalysis.result!.suggestedProcessMetrics
    ]
  }));

  setAIAnalysis(prev => ({
    ...prev,
    status: 'adopted',
    adoptedItems: { score: true, okrMetrics: true, processMetrics: true },
    adoptedAt: new Date().toISOString(),
    isCollapsed: true  // 自动折叠
  }));
};

// 2. 仅采纳评分
const handleAdoptScoreOnly = () => {
  setForm(prev => ({
    ...prev,
    businessImpactScore: aiAnalysis.result!.suggestedScore
  }));

  setAIAnalysis(prev => ({
    ...prev,
    status: 'partial',
    adoptedItems: { ...prev.adoptedItems, score: true },
    adoptedAt: new Date().toISOString(),
    isCollapsed: false  // 保持展开，允许继续采纳其他内容
  }));
};

// 3. 仅采纳OKR指标
const handleAdoptOKRMetrics = () => {
  setForm(prev => ({
    ...prev,
    affectedMetrics: [
      ...(prev.affectedMetrics || []).filter(m => m.category !== 'okr'),
      ...aiAnalysis.result!.suggestedOKRMetrics
    ]
  }));

  setAIAnalysis(prev => ({
    ...prev,
    status: 'partial',
    adoptedItems: { ...prev.adoptedItems, okrMetrics: true },
    adoptedAt: new Date().toISOString()
  }));
};

// 4. 仅采纳过程指标
const handleAdoptProcessMetrics = () => {
  setForm(prev => ({
    ...prev,
    affectedMetrics: [
      ...(prev.affectedMetrics || []).filter(m => m.category !== 'process'),
      ...aiAnalysis.result!.suggestedProcessMetrics
    ]
  }));

  setAIAnalysis(prev => ({
    ...prev,
    status: 'partial',
    adoptedItems: { ...prev.adoptedItems, processMetrics: true },
    adoptedAt: new Date().toISOString()
  }));
};

// 5. 忽略AI建议
const handleIgnoreAI = () => {
  const confirmed = window.confirm('确定忽略AI建议吗？建议将被折叠但保留，可随时查看。');
  if (!confirmed) return;

  setAIAnalysis(prev => ({
    ...prev,
    status: 'ignored',
    isCollapsed: true  // 折叠面板
  }));
};

// 6. 重新分析
const handleReanalyze = () => {
  const confirmed = window.confirm('重新分析将覆盖当前AI建议，是否继续？');
  if (!confirmed) return;

  // 重置AI状态
  setAIAnalysis({
    result: null,
    status: 'pending',
    adoptedItems: { score: false, okrMetrics: false, processMetrics: false },
    isCollapsed: false
  });

  // 调用AI分析
  handleAIAnalyze();
};
```

#### 3.4 采纳效果展示

**采纳前：**
```
业务影响度评分: [ 5 ▼]  ← 默认值

影响的指标:
核心OKR指标: [ ] 未选择任何指标
过程指标: [ ] 未选择任何指标
```

**采纳后（一键全部）：**
```
业务影响度评分: [ 8 ▼] ✓ (AI建议)

影响的指标:
核心OKR指标:
┌────────────────────────────┬────────────────────────────┐
│ [✓] 经销商满意度/NPS        │ [✓] 门店开设数量            │
│     预估影响: [明显提升] ✓  │     预估影响: [+30-50家/年]✓│
│                            │                            │
│ [✓] 经销商留存率            │ [ ] GMV                    │
│     预估影响: [降低流失风险]✓│    预估影响: [________]    │
└────────────────────────────┴────────────────────────────┘

过程指标:
┌────────────────────────────┬────────────────────────────┐
│ [✓] 对账周期                │ [✓] 对账准确率              │
│     预估影响: [缩短至实时]✓ │     预估影响: [提升至99%+]✓ │
│                            │                            │
│ [✓] 人工处理工作量          │ [ ] 订单处理时长            │
│     预估影响: [减少90%] ✓   │     预估影响: [________]    │
└────────────────────────────┴────────────────────────────┘
```

---

### 方案4：AI建议区域交互优化

#### 4.1 折叠/展开机制

```typescript
// 点击标题切换折叠状态
const toggleAIPanel = () => {
  setAIAnalysis(prev => ({
    ...prev,
    isCollapsed: !prev.isCollapsed
  }));
};
```

#### 4.2 状态指示器设计

| 状态 | 标题显示 | 颜色 |
|------|---------|------|
| **待处理** | `💡 AI建议: 8分 (战略必需) [待处理] [展开 ▼]` | 紫色渐变 |
| **已采纳** | `💡 AI建议: 8分 (战略必需) [✓ 已采纳] [展开 ▼]` | 绿色渐变 |
| **部分采纳** | `💡 AI建议: 8分 [⚡ 部分采纳] [展开 ▼]` | 蓝色渐变 |
| **已忽略** | `💡 AI建议 [⊗ 已忽略] [展开 ▼]` | 灰色 |

#### 4.3 折叠状态展示

**折叠状态（isCollapsed = true）：**
```
┌───────────────────────────────────────────────────────────┐
│ 💡 AI建议: 8分 (战略必需) [✓ 已采纳] [展开 ▼]            │
└───────────────────────────────────────────────────────────┘
```

**展开状态（isCollapsed = false）：**
```
┌───────────────────────────────────────────────────────────┐
│ 💡 AI建议: 8分 (战略必需) [✓ 已采纳] [收起 ▲]            │
│                                                           │
│ 采纳状态: ✓ 评分  ✓ OKR指标  ✓ 过程指标                  │
│ 采纳时间: 2025-01-19 15:35                                │
│                                                           │
│ ────────────────────────────────────────────────────────  │
│                                                           │
│ AI分析理由:                                               │
│ • 关键业务流程严重受阻，需大量人工兜底                   │
│ • 2个大经销商已明确抱怨并拒绝开新店                      │
│ • 对账周期2-3天，远高于行业平均                          │
│                                                           │
│ 建议的核心OKR指标: (已采纳 ✓)                             │
│ • 经销商满意度/NPS → 预估影响: 明显提升                  │
│ • 门店开设数量 → 预估影响: +30-50家/年                   │
│ • 经销商留存率 → 预估影响: 降低流失风险                  │
│                                                           │
│ 建议的过程指标: (已采纳 ✓)                                │
│ • 对账周期 → 预估影响: 缩短至实时                        │
│ • 对账准确率 → 预估影响: 提升至99%+                      │
│ • 人工处理工作量 → 预估影响: 减少90%                     │
│                                                           │
│ [🔄 重新分析]                                             │
└───────────────────────────────────────────────────────────┘
```

#### 4.4 自动折叠规则

| 操作 | 折叠行为 |
|------|---------|
| **一键采纳全部** | ✅ 自动折叠 |
| **仅采纳评分** | ❌ 保持展开（允许继续采纳指标） |
| **仅采纳OKR指标** | ❌ 保持展开（允许继续采纳其他） |
| **仅采纳过程指标** | ❌ 保持展开（允许继续采纳其他） |
| **忽略AI建议** | ✅ 自动折叠 |
| **重新分析** | ✅ 展开（显示新结果） |

---

## 技术实现方案

### 依赖库需求

**新增依赖：**
```json
{
  "dependencies": {
    "pdfjs-dist": "^3.11.174"  // PDF解析库
  }
}
```

**已有依赖：**
- `xlsx`: "^0.18.5" - Excel解析（已存在）

### 关键代码模块

#### 1. 文件上传组件

```typescript
// components/FileUploadZone.tsx
interface FileUploadZoneProps {
  onFilesUploaded: (files: UploadedFileInfo[]) => void;
  acceptedTypes: string[];
  maxSize: number;
}

const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFilesUploaded,
  acceptedTypes = ['.pdf', '.xlsx', '.xls'],
  maxSize = 10 * 1024 * 1024
}) => {
  // 点击上传
  const handleClick = () => { /* ... */ };

  // 拖拽上传
  const handleDrop = (e: React.DragEvent) => { /* ... */ };

  // 文件验证
  const validateFile = (file: File) => { /* ... */ };

  return (/* JSX */);
};
```

#### 2. 文件解析工具

```typescript
// utils/fileParser.ts

export async function parseFile(file: File): Promise<{
  content: string;
  wordCount: number;
  metadata: any;
}> {
  const fileType = file.type;

  if (fileType === 'application/pdf') {
    return await parsePDF(file);
  } else if (fileType.includes('spreadsheet') || fileType.includes('excel')) {
    return await parseExcel(file);
  }

  throw new Error('不支持的文件格式');
}

async function parsePDF(file: File): Promise<{...}> { /* ... */ }
async function parseExcel(file: File): Promise<{...}> { /* ... */ }
```

#### 3. AI分析状态管理

```typescript
// EditRequirementModal.tsx

// 使用useState管理AI状态
const [aiAnalysis, setAIAnalysis] = useState<AIAnalysisState>({
  result: null,
  status: 'pending',
  adoptedItems: { score: false, okrMetrics: false, processMetrics: false },
  isCollapsed: false
});

// 或使用useReducer管理复杂状态
type AIAction =
  | { type: 'START_ANALYSIS' }
  | { type: 'ANALYSIS_SUCCESS'; payload: AIAnalysisResult }
  | { type: 'ANALYSIS_ERROR'; payload: string }
  | { type: 'ADOPT_ALL' }
  | { type: 'ADOPT_SCORE' }
  | { type: 'ADOPT_OKR_METRICS' }
  | { type: 'ADOPT_PROCESS_METRICS' }
  | { type: 'IGNORE' }
  | { type: 'TOGGLE_COLLAPSE' };

const aiReducer = (state: AIAnalysisState, action: AIAction): AIAnalysisState => {
  switch (action.type) {
    case 'START_ANALYSIS':
      return { ...state, result: null, status: 'pending' };
    case 'ANALYSIS_SUCCESS':
      return { ...state, result: action.payload, status: 'pending', isCollapsed: false };
    case 'ADOPT_ALL':
      return {
        ...state,
        status: 'adopted',
        adoptedItems: { score: true, okrMetrics: true, processMetrics: true },
        adoptedAt: new Date().toISOString(),
        isCollapsed: true
      };
    // ... 其他cases
    default:
      return state;
  }
};
```

#### 4. AI分析函数增强

```typescript
const handleAIAnalyze = async () => {
  // 1. 检查内容充足性
  const sufficiency = checkContentSufficiency();
  if (!sufficiency.canStartAI) {
    setAIError('内容不足：请补充描述(至少50字)或上传文档');
    return;
  }

  // 2. 准备分析内容
  const descriptionText = form.description?.trim() || '';
  const filesText = uploadedFiles
    .filter(f => f.parseStatus === 'success')
    .map(f => `文件名：${f.name}\n内容：${f.parsedContent}`)
    .join('\n\n');

  const fullContent = `
需求描述：
${descriptionText}

${filesText ? `上传的文档内容：\n${filesText}` : ''}
  `.trim();

  // 3. 调用AI API
  // ... (现有逻辑)
};
```

### 代码组织结构

```
src/
├── components/
│   ├── EditRequirementModal.tsx        (主组件，修改)
│   └── FileUploadZone.tsx             (新增)
├── utils/
│   └── fileParser.ts                   (新增)
├── types/
│   └── index.ts                        (添加新类型)
└── config/
    └── aiPrompts.ts                    (已有，可能需要调整)
```

---

## 完整交互流程

### 场景演示：业务团队录入"经销商对账系统"需求

#### Step 1: 填写基础信息
```
需求名称: [经销商对账系统自动化_____________________________]
提交人: [张三]  提交日期: [2025-01-19]
业务团队: [开店团队]
```

#### Step 2: 输入需求描述（实时验证）

**场景2.1：内容不足**
```
┌─────────────────────────────────────────────────────────────┐
│ 📝 需求描述 (已输入 35/50字) ⚠️                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 当前经销商对账完全靠人工...                             │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ⚠️ 内容不足：请继续补充描述(至少50字)或上传文档              │
│                                                             │
│ [AI智能分析] ← 禁用状态，灰色                               │
└─────────────────────────────────────────────────────────────┘
```

**场景2.2：内容充足**
```
        ↓ 用户继续输入到156字

┌─────────────────────────────────────────────────────────────┐
│ 📝 需求描述 (已输入 156字) ✅                                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 当前经销商对账完全靠人工，每月月底需要财务和经销商各自 │ │
│ │ 导出流水，然后用Excel逐笔核对，平均每个经销商需要2-3天 │ │
│ │ 对账周期。经销商强烈抱怨效率太低，已经有2个大经销商    │ │
│ │ 因此拒绝开设新店...                                    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ✅ 描述充足，可启动AI分析                                   │
│                                                             │
│ [✨ AI智能分析] ← 可用状态，紫色高亮                        │
└─────────────────────────────────────────────────────────────┘
```

#### Step 3: 上传文档

**场景3.1：点击上传**
```
┌─────────────────────────────────────────────────────────────┐
│ 📎 上传需求文档                                             │
│                                                             │
│ ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐ │
│   [📄 点击上传] 或 拖拽文件到这里                          │
│ │                                                         │ │
│   支持格式: PDF, Excel (.xlsx/.xls)                       │
│ │ 最大文件: 10MB                                          │ │
│ └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘ │
└─────────────────────────────────────────────────────────────┘
```

**场景3.2：文件解析中**
```
        ↓ 用户拖拽PDF文件

┌─────────────────────────────────────────────────────────────┐
│ 已上传文件:                                                 │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📄 经销商对账PRD.pdf                                     │ │
│ │    5页 | 512KB | 正在解析... ⏳ 60%                      │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**场景3.3：解析完成**
```
        ↓ 解析完成

┌─────────────────────────────────────────────────────────────┐
│ 已上传文件:                                                 │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📄 经销商对账PRD.pdf ✓                                   │ │
│ │    5页 | 512KB | 已解析(3200字)                         │ │
│ │    [👁️ 预览文本] [🗑️ 删除]                              │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 💡 提示：文档已准备好，建议立即进行AI智能分析               │
│ [✨ 立即AI分析]                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Step 4: AI分析中

```
        ↓ 用户点击"AI智能分析"

┌─────────────────────────────────────────────────────────────┐
│ 💡 AI正在分析... ⏳                                         │
│                                                             │
│ [==================>            ] 60%                       │
│ 正在分析业务影响度...                                       │
│                                                             │
│ 已读取内容：                                                │
│ • 需求描述 (156字) ✓                                        │
│ • 经销商对账PRD.pdf (5页, 3200字) ✓                        │
│                                                             │
│ 预计剩余时间：15秒                                          │
└─────────────────────────────────────────────────────────────┘
```

#### Step 5: AI分析完成，展示建议

```
        ↓ AI分析完成

┌───────────────────────────────────────────────────────────┐
│ 💡 AI建议: 8分 (战略必需) [待处理] [收起 ▲]               │
│                                                           │
│ AI分析理由:                                               │
│ • 关键业务流程严重受阻，需大量人工兜底                   │
│ • 2个大经销商已明确抱怨并拒绝开新店（战略指标受影响）    │
│ • 对账周期2-3天，远高于行业平均（竞争力缺失）             │
│ • 影响范围: 全部经销商 (约200家,覆盖1000+门店)           │
│                                                           │
│ 建议的核心OKR指标:                                        │
│ • 经销商满意度/NPS → 预估影响: 明显提升                  │
│ • 门店开设数量 → 预估影响: +30-50家/年                   │
│ • 经销商留存率 → 预估影响: 降低流失风险                  │
│                                                           │
│ 建议的过程指标:                                           │
│ • 对账周期 → 预估影响: 从2-3天缩短至实时                 │
│ • 对账准确率 → 预估影响: 从95%提升至99%+                 │
│ • 人工处理工作量 → 预估影响: 减少90%                     │
│                                                           │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 选择采纳方式:                                       │   │
│ │                                                     │   │
│ │ [✨ 一键采纳全部建议] ← 主推荐，绿色大按钮           │   │
│ │                                                     │   │
│ │ 分项采纳:                                           │   │
│ │ [📊 仅采纳评分 8分]  [🎯 仅采纳OKR指标(3个)]        │   │
│ │ [📈 仅采纳过程指标(3个)]                            │   │
│ │                                                     │   │
│ │ [❌ 忽略AI建议]  [🔄 重新分析]                      │   │
│ └─────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────┘
```

#### Step 6: 用户采纳（一键采纳全部）

```
        ↓ 用户点击"一键采纳全部建议"

┌───────────────────────────────────────────────────────────┐
│ 💡 AI建议: 8分 (战略必需) [✓ 已采纳] [展开 ▼]            │
└───────────────────────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
业务影响度评分: [ 8 ▼] ✓ (AI建议已采纳)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

影响的指标:

核心OKR指标:
┌────────────────────────────┬────────────────────────────┐
│ [✓] 经销商满意度/NPS        │ [✓] 门店开设数量            │
│     预估影响: [明显提升] ✓  │     预估影响: [+30-50家/年]✓│
│                            │                            │
│ [✓] 经销商留存率            │ [ ] GMV                    │
│     预估影响: [降低流失风险]✓│    预估影响: [________]    │
└────────────────────────────┴────────────────────────────┘

过程指标:
┌────────────────────────────┬────────────────────────────┐
│ [✓] 对账周期                │ [✓] 对账准确率              │
│     预估影响: [缩短至实时]✓ │     预估影响: [提升至99%+]✓ │
│                            │                            │
│ [✓] 人工处理工作量          │ [ ] 订单处理时长            │
│     预估影响: [减少90%] ✓   │     预估影响: [________]    │
└────────────────────────────┴────────────────────────────┘
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### Step 7: 用户微调（可选）

```
用户review后决定调整:
1. 分值8分合适 ✓
2. 门店开设数量的预估有点保守，改为 "+50-80家/年"
3. 想增加一个过程指标"经销商投诉率"

        ↓ 用户手动修改

┌────────────────────────────┐
│ [✓] 门店开设数量            │
│     预估影响: [+50-80家/年] │ ← 手动调整
└────────────────────────────┘

        ↓ 用户新增自定义指标

┌────────────────────────────┐
│ [✓] 经销商投诉率 (自定义)   │
│     预估影响: [显著下降]    │ ← 手动添加
└────────────────────────────┘
```

#### Step 8: 保存需求

```
        ↓ 用户点击"保存"按钮

系统保存:
✓ 业务影响度评分: 8分
✓ 核心OKR指标: 3个（经销商满意度/门店开设数/经销商留存率）
✓ 过程指标: 4个（对账周期/对账准确率/人工工作量/经销商投诉率）
✓ 每个指标的预估影响值
✓ AI分析记录（供后续审计）

显示成功提示："需求已保存 ✓"
```

---

## 验收标准

### 功能验收

#### 1. AI启动条件验证

| 测试场景 | 输入条件 | 期望结果 |
|---------|---------|---------|
| **场景1** | 描述30字 + 无文件 | 按钮禁用 + 显示警告提示 |
| **场景2** | 描述60字 + 无文件 | 按钮可用 + 显示成功提示 |
| **场景3** | 描述30字 + 有PDF文件 | 按钮可用 + 显示成功提示 |
| **场景4** | 无描述 + 有PDF文件 | 按钮可用 + 显示成功提示 |
| **场景5** | 描述60字 + 有PDF文件 | 按钮可用 + 显示最佳提示 |

#### 2. 文件上传功能

| 测试场景 | 输入条件 | 期望结果 |
|---------|---------|---------|
| **上传PDF** | 5MB PDF文件 | 成功解析 + 显示页数和字数 |
| **上传Excel** | 2MB Excel文件 | 成功解析 + 显示Sheet数和字数 |
| **超大文件** | 15MB PDF文件 | 显示错误："文件超过10MB限制" |
| **错误格式** | 上传.docx文件 | 显示错误："不支持的文件格式" |
| **拖拽上传** | 拖拽PDF到虚线框 | 成功上传并解析 |
| **预览文本** | 点击"预览文本"按钮 | 在Modal中显示解析后的文本 |
| **删除文件** | 点击"删除"按钮 | 文件从列表中移除 |

#### 3. 分项采纳机制

| 测试场景 | 操作 | 期望结果 |
|---------|------|---------|
| **一键采纳全部** | 点击"一键采纳全部" | 评分+所有指标已填充 + AI面板折叠 |
| **仅采纳评分** | 点击"仅采纳评分" | 评分已填充 + 指标未填充 + 面板保持展开 |
| **仅采纳OKR指标** | 点击"仅采纳OKR指标" | OKR指标已勾选 + 评分未改 + 面板保持展开 |
| **仅采纳过程指标** | 点击"仅采纳过程指标" | 过程指标已勾选 + 评分未改 + 面板保持展开 |
| **忽略AI建议** | 点击"忽略AI建议" | AI面板折叠 + 状态改为"已忽略" |
| **重新分析** | 点击"重新分析" | 重置AI状态 + 重新调用AI |

#### 4. AI建议区域交互

| 测试场景 | 操作 | 期望结果 |
|---------|------|---------|
| **展开/折叠** | 点击标题栏 | 面板切换展开/折叠状态 |
| **状态显示** | 采纳后查看 | 显示"已采纳"标记 + 采纳时间 |
| **部分采纳显示** | 仅采纳评分后查看 | 显示"部分采纳" + 具体采纳项 |
| **忽略显示** | 忽略后查看 | 显示"已忽略" + 可重新查看 |

### 性能验收

| 指标 | 目标值 | 说明 |
|------|-------|------|
| **PDF解析时间** | < 3秒 | 5页PDF文件 |
| **Excel解析时间** | < 2秒 | 3个Sheet，1000行数据 |
| **AI分析响应时间** | < 20秒 | OpenAI/DeepSeek API调用 |
| **UI交互响应** | < 100ms | 按钮点击、展开折叠 |

### 兼容性验收

| 浏览器 | 版本 | 状态 |
|--------|------|------|
| Chrome | >= 100 | ✅ 必须支持 |
| Edge | >= 100 | ✅ 必须支持 |
| Firefox | >= 100 | ⚠️ 建议支持 |
| Safari | >= 15 | ⚠️ 建议支持 |

---

## 实施计划

### 阶段1：核心功能实施（预计2小时）

#### Task 1.1: AI启动条件验证（30分钟）

**文件：** `EditRequirementModal.tsx`

**实施步骤：**
1. 新增 `checkContentSufficiency` 函数（10分钟）
2. 修改AI分析按钮的 `disabled` 逻辑（5分钟）
3. 添加实时提示UI组件（10分钟）
4. 测试各种场景（5分钟）

**验收：**
- ✅ 描述<50字 + 无文件：按钮禁用
- ✅ 描述≥50字 OR 有文件：按钮可用
- ✅ 实时提示文案正确

---

#### Task 1.2: PDF和Excel文件上传（1小时）

**文件：**
- `components/FileUploadZone.tsx`（新增）
- `utils/fileParser.ts`（新增）
- `EditRequirementModal.tsx`（修改）

**实施步骤：**
1. 安装依赖 `pdfjs-dist`（5分钟）
2. 创建 `fileParser.ts` 工具函数（15分钟）
   - `parsePDF` 函数
   - `parseExcel` 函数
3. 创建 `FileUploadZone` 组件（20分钟）
   - 点击上传
   - 拖拽上传
   - 文件验证
   - 文件列表管理
4. 集成到 `EditRequirementModal`（15分钟）
5. 测试（5分钟）

**验收：**
- ✅ PDF文件上传并解析成功
- ✅ Excel文件上传并解析成功
- ✅ 超大文件拒绝并提示
- ✅ 错误格式拒绝并提示
- ✅ 拖拽上传正常工作

---

#### Task 1.3: 分项采纳机制（30分钟）

**文件：** `EditRequirementModal.tsx`

**实施步骤：**
1. 新增 `AIAnalysisState` 接口和状态（10分钟）
2. 实现采纳逻辑函数（15分钟）
   - `handleAdoptAll`
   - `handleAdoptScoreOnly`
   - `handleAdoptOKRMetrics`
   - `handleAdoptProcessMetrics`
   - `handleIgnoreAI`
   - `handleReanalyze`
3. 测试（5分钟）

**验收：**
- ✅ 一键采纳全部：所有数据填充 + 面板折叠
- ✅ 仅采纳评分：仅评分填充 + 面板保持展开
- ✅ 仅采纳指标：仅指标勾选 + 面板保持展开
- ✅ 忽略建议：面板折叠 + 状态改变

---

### 阶段2：交互优化（预计1小时）

#### Task 2.1: AI建议区域折叠（30分钟）

**文件：** `EditRequirementModal.tsx`

**实施步骤：**
1. 添加折叠状态管理（5分钟）
2. 实现折叠/展开UI（15分钟）
3. 添加状态指示器（10分钟）

**验收：**
- ✅ 点击标题可折叠/展开
- ✅ 不同状态显示不同颜色和标记
- ✅ 采纳后自动折叠

---

#### Task 2.2: 状态管理和UI优化（30分钟）

**文件：** `EditRequirementModal.tsx`

**实施步骤：**
1. 优化AI建议区域的视觉设计（15分钟）
2. 添加采纳状态展示（10分钟）
3. 整体UI调整和polish（5分钟）

**验收：**
- ✅ UI美观统一
- ✅ 状态清晰可见
- ✅ 交互流畅

---

### 阶段3：测试和验证（预计30分钟）

#### Task 3.1: 功能测试

- 测试所有验收场景
- 修复发现的问题

#### Task 3.2: 性能测试

- 测试大文件解析性能
- 测试AI响应时间

#### Task 3.3: 兼容性测试

- 在Chrome、Edge测试
- 确保核心功能正常

---

### 总预计时间

| 阶段 | 预计时间 |
|------|---------|
| **阶段1：核心功能** | 2小时 |
| **阶段2：交互优化** | 1小时 |
| **阶段3：测试验证** | 30分钟 |
| **总计** | 3.5小时 |

---

## 风险评估

### 技术风险

| 风险 | 影响程度 | 缓解措施 |
|------|---------|---------|
| **PDF解析失败** | 中 | 提供降级方案：仅提取简单文本 |
| **AI API超时** | 中 | 添加超时处理和重试机制 |
| **大文件内存占用** | 低 | 限制文件大小≤10MB |
| **浏览器兼容性** | 低 | 主要支持Chrome/Edge |

### 用户体验风险

| 风险 | 影响程度 | 缓解措施 |
|------|---------|---------|
| **用户不理解采纳选项** | 中 | 提供清晰的按钮文案和说明 |
| **AI建议质量差** | 中 | 优化提示词，增加内容验证 |
| **操作步骤复杂** | 低 | 提供"一键采纳"快捷方式 |

---

## 未来优化方向（P1）

### 1. 自动触发分析

- 需求描述失焦3秒后自动分析
- 上传文档完成后立即提示分析

### 2. Word文档支持

- 支持 .docx 文件上传
- 使用 mammoth.js 解析

### 3. 剪贴板粘贴图片

- 监听 `paste` 事件
- 检测图片类型并上传
- OCR识别图片文字（可选）

### 4. AI分析历史记录

- 记录每次AI分析结果
- 允许用户查看和对比历史分析

### 5. 批量分析优化

- 支持一次上传多个文件
- 并行解析提升性能

---

## 附录

### A. 相关文件清单

| 文件路径 | 修改类型 | 说明 |
|---------|---------|------|
| `src/components/EditRequirementModal.tsx` | 修改 | 主组件，核心逻辑 |
| `src/components/FileUploadZone.tsx` | 新增 | 文件上传组件 |
| `src/utils/fileParser.ts` | 新增 | 文件解析工具 |
| `src/types/index.ts` | 修改 | 添加新类型定义 |
| `package.json` | 修改 | 添加 pdfjs-dist 依赖 |

### B. 依赖库版本

```json
{
  "dependencies": {
    "pdfjs-dist": "^3.11.174",
    "xlsx": "^0.18.5"
  }
}
```

### C. 参考资料

- [PDF.js 官方文档](https://mozilla.github.io/pdf.js/)
- [SheetJS (xlsx) 文档](https://docs.sheetjs.com/)
- [项目规范文档](./.claude/project-rules.md)
- [开发指南](./DEVELOPMENT.md)

---

**文档版本**: v1.0
**最后更新**: 2025-01-19
**下次审查**: 实施完成后

---

## 变更记录

| 日期 | 版本 | 变更内容 | 作者 |
|------|------|---------|------|
| 2025-01-19 | v1.0 | 初始版本创建 | Claude |
