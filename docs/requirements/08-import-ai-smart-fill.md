# 导入功能AI智能填充升级需求文档

**项目**: WSJF Sprint Planner
**功能模块**: 导入预览与AI智能填充 (ImportPreviewModal)
**版本**: v1.4.0
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

当前导入功能（Excel导入）存在以下限制：
1. **字段映射能力有限**：只支持基础字段的模糊匹配（autoMapFields）
2. **AI映射仅识别字段名**：现有AI映射功能只能推断"Excel列名→系统字段名"的映射关系
3. **无法智能填充字段值**：导入后需要手动填写30+个字段（产品领域、业务域、地区、指标等）
4. **无法处理复杂信息**：Excel单列包含多种信息（如"@杜玥负责 紧急上线"）无法自动拆解

### 用户痛点

**场景案例**：用户从其他系统导出Excel需求清单，包含50条需求：
```
| 需求名称                    | 负责人    | 工作量 | 截止日期    | 备注                  |
|---------------------------|----------|-------|------------|---------------------|
| 英国直营零售通适配          | @杜玥    | 45    | 2025-11-30 | 紧急，Q4必须完成     |
| 韩国授权零售通适配          | @杜玥    | 50    | 2025-12-15 | 涉及店长、区域经理   |
| 智利销服一体试营业          | @张普    | 35    | 2025-11-15 | 影响库存周转率       |
```

**当前导入流程**：
1. 上传Excel → 基础字段映射（需求名称、工作量等）✅
2. 导入到系统 → 逐条打开编辑 → **手动填写**：
   - 产品领域：看到"@杜玥"→手动选择"toC卖货/导购/AI/培训/营销 @杜玥"
   - 业务域：看到"直营"→手动选择"新零售"
   - 地区：看到"英国"→手动勾选"欧洲地区 - 西欧"
   - 影响的指标：看到"库存周转率"→手动勾选对应过程指标
   - 时间窗口：看到"紧急"→手动选择"一月硬窗口"
   - ... 30+个字段

**痛点**：50条需求 × 30个字段/条 = **1500次手动操作** 😱

### 目标

通过AI智能填充，将手动操作从**1500次降低到50次**（仅需确认/微调）：
1. **自动识别并拆解复杂信息**："@杜玥负责 紧急上线" → 产品领域+时间窗口
2. **智能推导30+字段**：产品领域、业务域、地区、角色、指标、时间窗口等
3. **枚举值智能替换**：Excel中的非标准值 → 系统枚举值
4. **保留自由文本**：姓名、描述等自由文本字段保留原值
5. **可视化确认**：表格+侧边栏预览，AI填充字段高亮标注

### 优化范围

**核心功能（P0 - 本次实现）：**
1. ✅ AI智能填充按钮（默认DeepSeek，可选OpenAI）
2. ✅ 逐条分析进度显示（正在分析第3/50条...）
3. ✅ 30+字段智能推导（完整Requirement对象）
4. ✅ 表格+侧边栏预览界面（高亮AI填充字段）
5. ✅ 部分导入功能（勾选导入，支持清空）
6. ✅ 失败处理（标记失败但保留在列表）

**未来优化（P1）：**
- 批量并行分析（提升速度）
- 用户反馈学习（记住映射规则）
- AI分析历史记录

---

## 当前问题分析

### 问题1：字段映射能力有限

**当前实现（autoMapFields）：**
```typescript
const systemFields: Record<string, string[]> = {
  name: ['需求名称', '名称', 'name', 'title', '标题'],
  submitterName: ['提交人', '提交人姓名', 'submitter'],
  productManager: ['产品经理', '产品', 'pm'],
  effortDays: ['工作量', '人天', 'effort', 'days'],
  bv: ['业务影响度', 'bv', 'business value'],
  // ... 仅支持14个字段
};
```

**问题描述**：
- ❌ 仅支持14个基础字段，无法映射30+个扩展字段
- ❌ 只匹配关键词，无法处理复杂信息（如"@杜玥负责"）
- ❌ 无法推导枚举值（如"直营"→"新零售-直营店"）
- ❌ 无法推导复杂对象（如地区、角色、指标数组）

**影响**：
- 导入后需要大量手动填写
- 用户体验差，效率低

---

### 问题2：AI映射仅识别字段名

**当前实现（handleAIMapping）：**
```typescript
const handleAIMapping = async () => {
  const prompt = `请将Excel列名映射到系统字段。

  系统字段：name, submitterName, productManager, effortDays, ...
  Excel列名：需求名称, 负责人, 工作量, ...

  返回映射关系：{"name": "需求名称", "effortDays": "工作量", ...}`;

  // AI仅返回字段名映射，不填充具体值
};
```

**问题描述**：
- ❌ AI只推断"列名映射关系"，不分析"单元格内容"
- ❌ 无法从内容推导字段值（如从"@杜玥"推导产品领域）
- ❌ 无法处理单列多信息（如"紧急 Q4完成"包含时间窗口和截止日期）

**影响**：
- 映射后仍需大量手动填写
- 无法发挥AI的全部能力

---

### 问题3：无法智能填充字段值

**当前导入流程（handleConfirmImport）：**
```typescript
const handleConfirmImport = () => {
  const newRequirements = importData.map((row, index) => {
    const mapped: any = {};

    // 仅根据映射关系复制值
    Object.entries(importMapping).forEach(([systemField, fileField]) => {
      mapped[systemField] = row[fileField];
    });

    // 设置默认值（固定逻辑，不智能）
    return {
      id: `REQ-${Date.now()}-${index}`,
      ...mapped,
      bv: validBV.includes(mapped.bv) ? mapped.bv : '明显',  // 简单验证
      tc: validTC.includes(mapped.tc) ? mapped.tc : '随时',
      // 其他30+字段全部为默认值或空值
    };
  });
};
```

**问题描述**：
- ❌ 只复制已映射字段，其他字段留空
- ❌ 无法从内容推导业务影响度（需手动评分）
- ❌ 无法识别地区（需手动勾选）
- ❌ 无法推导影响的指标（需手动选择）
- ❌ 无法识别产品领域（如从"@杜玥"推导）

**影响**：
- 导入后需求数据不完整
- 手动补全工作量巨大

---

### 问题4：无法处理复杂信息

**场景案例**：

**Excel列值**：`"英国直营零售通适配 @杜玥负责 紧急上线"`

**期望拆解**：
- 需求名称：英国直营零售通适配
- 产品领域：toC卖货/导购/AI/培训/营销 @杜玥
- 业务域：新零售（识别"直营"）
- 地区：欧洲地区 - 西欧（识别"英国"）
- 门店类型：新零售-直营店
- 时间窗口：一月硬窗口（识别"紧急"）

**当前实现**：
- ❌ 只能作为整体映射到某一个字段
- ❌ 无法拆解和推导

**影响**：
- 复杂信息无法利用
- 仍需手动输入

---

## 优化方案设计

### 方案1：AI智能填充架构

#### 1.1 整体流程

```
用户上传Excel
  ↓
基础字段映射（现有autoMapFields）
  ↓
展示导入预览Modal
  ↓
【新增】用户点击"🤖 AI智能填充"按钮
  ↓
逐条调用AI分析（带进度显示）
  │
  ├─ 读取Excel原始行数据（所有列）
  ├─ 构建超详细Prompt（包含配置、枚举、规则、示例）
  ├─ 调用AI API（DeepSeek或OpenAI）
  └─ 解析返回完整Requirement对象
  ↓
更新importData（标记AI填充字段）
  ↓
【新增】展示表格+侧边栏详情（高亮AI填充字段）
  ↓
用户确认/修改 → 勾选部分导入 → 确认导入
```

#### 1.2 核心能力

| 能力 | 说明 | 示例 |
|------|------|------|
| **信息拆解** | 单列多信息自动拆分 | "@杜玥 紧急" → 产品领域+时间窗口 |
| **枚举推导** | 非标准值→标准枚举 | "直营" → "新零售-直营店" |
| **地区识别** | 国家名→地区层级 | "英国" → ["欧洲地区", "欧洲地区 - 西欧"] |
| **指标推导** | 描述→影响的指标 | "库存周转"→勾选"库存周转率"指标 |
| **影响度评分** | 描述→1-10分 | "紧急且影响大" → 8分 |
| **角色识别** | 关键词→角色勾选 | "店长、区域经理" → 勾选对应角色 |

---

### 方案2：字段分类与处理规则

根据用户需求："如果已有值且是枚举类型，AI替换成正确枚举；如果是自由文本，保留原值"

#### 2.1 字段分类

**A. 枚举字段（AI替换）**
Excel有值但不合法 → AI替换成正确枚举

| 字段 | 可选项数量 | 示例规则 |
|------|----------|---------|
| `productArea` | 4个 | "@杜玥" → "toC卖货/导购/AI/培训/营销 @杜玥" |
| `businessDomain` | 4个 | "直营" → "新零售" |
| `submitter` | 3个 | "业务部" → "业务" |
| `type` | 7个 | "新功能" → "功能开发" |
| `timeCriticality` | 3个 | "紧急" → "一月硬窗口" |
| `impactScope.storeTypes` | 5个 | "直营" → ["新零售-直营店"] |
| `impactScope.regions` | 100+ | "英国" → ["欧洲地区", "欧洲地区 - 西欧"] |
| `impactScope.keyRoles` | 20+ | "店长" → [{category: "regional", roleName: "店长"}] |
| `impactScope.storeCountRange` | 6个 | "100家门店" → "50-200家" |
| `productProgress` | 6个 | "设计阶段" → "设计中" |
| `techProgress` | 6个 | "已评估" → "已评估工作量" |

**B. 自由文本字段（保留原值）**
Excel有值 → 保留，空值 → AI尝试推导

| 字段 | 处理逻辑 |
|------|---------|
| `name` | 保留原值 |
| `description` | 保留原值，或从多列合并 |
| `submitterName` | 保留原值，或提取人名 |
| `productManager` | 保留原值，或提取人名 |
| `backendDeveloper` | 保留原值，或提取人名 |
| `frontendDeveloper` | 保留原值，或提取人名 |
| `tester` | 保留原值，或提取人名 |
| `project` | 保留原值 |
| `rdNotes` | 保留原值，或从备注列合并 |
| `deadlineDate` | 保留原值，或识别日期格式 |

**C. 数值字段**

| 字段 | 处理逻辑 |
|------|---------|
| `effortDays` | 保留原值（优先） |
| `businessImpactScore` | AI根据描述推导（1-10分） |
| `complexityScore` | AI根据工作量和描述推导（1-10分） |

**D. 布尔字段**

| 字段 | 处理逻辑 |
|------|---------|
| `hardDeadline` | 识别关键词："截止"、"DDL"、"deadline" |
| `isRMS` | 识别关键词："RMS"、"重构" |

**E. 复杂对象字段（AI推导）**

| 字段 | 处理逻辑 |
|------|---------|
| `affectedMetrics` | 从okrMetrics和processMetrics配置中选择，分析描述推导 |
| `documents` | 从description中提取URL链接 |

#### 2.2 枚举替换示例

**场景**：Excel中productArea列的值是"@杜玥"

```typescript
// 原始Excel值
productArea: "@杜玥"

// AI分析后
productArea: "toC卖货/导购/AI/培训/营销 @杜玥"  // ✅ 替换成正确枚举

_aiFilledFields: ["productArea"]
_aiConfidenceScores: { productArea: 0.95 }  // 高置信度
```

**场景**：Excel中businessDomain列的值是"直营店业务"

```typescript
// 原始Excel值
businessDomain: "直营店业务"

// AI分析后
businessDomain: "新零售"  // ✅ 替换成正确枚举（识别"直营"关键词）

_aiFilledFields: ["businessDomain"]
_aiConfidenceScores: { businessDomain: 0.85 }
```

---

### 方案3：AI Prompt设计策略

#### 3.1 Prompt结构

```
=== 原始Excel数据 ===
{JSON格式的Excel行数据}

=== 任务说明 ===
1. 分析Excel数据中的所有列
2. 推导出完整的Requirement对象（30+字段）
3. 对于枚举字段，必须从可选项中选择
4. 对于自由文本字段，如果Excel中已有值则保留

=== 字段填充规则 ===
（30+字段的详细说明、可选项、识别规则）

**一、基础信息字段（9个）**
1. name - 自由文本，保留Excel值
2. description - 自由文本，可从多列合并
3. submitterName - 自由文本
...

**二、业务影响度（1个）**
9. businessImpactScore (1-10分) - 根据描述推断，参考标准：
   10分: 致命缺陷 - 系统崩溃/核心业务中断
   9分: 严重阻塞 - 关键流程受阻
   8分: 战略必需 - 影响战略KPI
   ...

**三、时间窗口（3个）**
10. timeCriticality - 枚举: ["随时", "三月窗口", "一月硬窗口"]
    规则：
    - "紧急"、"urgent"、"ASAP" → 一月硬窗口
    - "Q1"、"Q2"、"三个月内" → 三月窗口
    - 没有时间要求 → 随时
...

**四、需求相关性（4个复杂对象）**
13. impactScope.storeTypes - 数组
    可选: ["新零售-直营店", "新零售-授权店", "新零售-专卖店", "渠道零售门店", "与门店无关"]
    规则：
    - "直营" → "新零售-直营店"
    - "授权" → "新零售-授权店"

14. impactScope.regions - 数组
    可选项（100+）：
    - 南亚: 印度, 孟加拉, 巴基斯坦, ...
    - 欧洲地区 - 西欧（英国/法国/德国/意大利/西班牙）
    - 美洲地区 - 拉美（墨西哥/巴西/智利/阿根廷等）
    规则：
    - 识别国家名称（如"英国"、"智利"）
    - 同时选择大区和具体国家
    - 英国 → ["欧洲地区", "欧洲地区 - 西欧（英国/法国/德国/意大利/西班牙）"]

15. impactScope.keyRoles - 数组
    可选项（20+，分4类）：
    - 区域角色: 促销员, 督导, 店长, 区域经理, 国总, 区总
    - 总部-通用: 培训管理部, 终端设计管理部, 零售费用部
    - 总部-新零售: GTM, 品类运营, 门店建设, 门店运营, ...
    - 总部-渠道零售: 阵地运营, FF运营, 品类运营, 市场部
    格式：[{ category: "regional", roleName: "店长", isCustom: false }, ...]
...

**五、影响的指标（1个复杂数组）**
17. affectedMetrics - 数组
    格式：
    [{
      metricKey: "dealer_satisfaction_nps",
      metricName: "经销商满意度/NPS",
      displayName: "经销商满意度/NPS",
      estimatedImpact: "明显提升",
      category: "okr"
    }, ...]

    可选OKR指标（15个）：
    - dealer_satisfaction_nps: 经销商满意度/NPS
    - store_opening_count: 门店开设数量
    - gmv_growth: GMV增长
    ...

    可选过程指标（20个）：
    - inventory_turnover: 库存周转率
    - order_processing_time: 订单处理时长
    - reconciliation_cycle: 对账周期
    ...

    规则：
    - 根据需求描述推断影响的指标
    - estimatedImpact填写具体影响（如"+5%"、"明显提升"、"从2天→实时"）
...

**六、产研填写（9个）**
19. productArea (产品领域) - 枚举，**重点规则**
    可选项：
    - "管店/固资/物 @张普"
    - "toC卖货/导购/AI/培训/营销 @杜玥"
    - "管人/SO上报/考勤 @胡馨然"
    - "toB进货/交易/返利 @李建国"

    **识别规则（严格遵守）**：
    - 看到"@杜玥"或"杜玥" → 选择"toC卖货/导购/AI/培训/营销 @杜玥"
    - 看到"@张普"或"张普" → 选择"管店/固资/物 @张普"
    - 看到"@胡馨然"或"胡馨然" → 选择"管人/SO上报/考勤 @胡馨然"
    - 看到"@李建国"或"李建国" → 选择"toB进货/交易/返利 @李建国"
    - 根据需求内容推断（卖货/导购→杜玥，管店/库存→张普，人员/考勤→胡馨然，进货/交易→李建国）
...

=== 示例（Few-shot Learning） ===

**示例1：单列多信息**
输入Excel行：
{
  "需求名称": "英国直营零售通适配",
  "负责人": "@杜玥",
  "工作量": "45",
  "提交日期": "2025-11-30",
  "备注": "紧急，Q4必须完成"
}

输出Requirement对象：
{
  "name": "英国直营零售通适配",
  "productArea": "toC卖货/导购/AI/培训/营销 @杜玥",  // 识别@杜玥
  "productManager": "",  // Excel无此信息，留空
  "effortDays": 45,
  "submitDate": "2025-11-30",
  "businessDomain": "新零售",  // 识别"直营"
  "impactScope": {
    "regions": ["欧洲地区", "欧洲地区 - 西欧（英国/法国/德国/意大利/西班牙）"],  // 识别"英国"
    "storeTypes": ["新零售-直营店"],  // 识别"直营"
    "keyRoles": [],
    "storeCountRange": undefined
  },
  "businessImpactScore": 7,  // 根据"Q4必须完成"推断
  "affectedMetrics": [
    {
      "metricKey": "store_opening_count",
      "metricName": "门店开设数量",
      "displayName": "门店开设数量",
      "estimatedImpact": "+10-20家/年",
      "category": "okr"
    }
  ],
  "timeCriticality": "一月硬窗口",  // 识别"紧急"
  "hardDeadline": true,
  "deadlineDate": "2025-11-30",
  "type": "功能开发",
  "submitter": "业务",
  "productProgress": "待评估",
  "techProgress": "已评估工作量",
  "isRMS": false,
  "complexityScore": 6,

  // 元数据
  "_aiFilledFields": ["productArea", "businessDomain", "impactScope", "businessImpactScore", "affectedMetrics", "timeCriticality", "hardDeadline", "deadlineDate"],
  "_aiConfidenceScores": {
    "productArea": 0.95,
    "businessDomain": 0.8,
    "impactScope.regions": 0.9,
    "timeCriticality": 0.85
  }
}

**示例2：独立字段列**
输入Excel行：
{
  "需求名称": "智利销服一体试营业",
  "产品领域": "@张普",
  "业务域": "国际零售",
  "地区": "智利",
  "影响指标": "库存周转率",
  "工作量": "35"
}

输出Requirement对象：
{
  "name": "智利销服一体试营业",
  "productArea": "管店/固资/物 @张普",  // 替换枚举
  "businessDomain": "国际零售通用",  // 替换枚举（"国际零售"→"国际零售通用"）
  "impactScope": {
    "regions": ["美洲地区", "美洲地区 - 拉美（墨西哥/巴西/智利/阿根廷等）"],  // 识别"智利"
    "storeTypes": [],
    "keyRoles": [],
    "storeCountRange": undefined
  },
  "affectedMetrics": [
    {
      "metricKey": "inventory_turnover",
      "metricName": "库存周转率",
      "displayName": "库存周转率",
      "estimatedImpact": "提升20%",
      "category": "process"
    }
  ],
  "effortDays": 35,
  "businessImpactScore": 7,
  "timeCriticality": "随时",
  "hardDeadline": false,
  "type": "功能开发",
  "submitter": "业务",
  "productProgress": "待评估",
  "techProgress": "已评估工作量",
  "isRMS": false,
  "complexityScore": 5,

  "_aiFilledFields": ["productArea", "businessDomain", "impactScope", "affectedMetrics", "businessImpactScore"],
  "_aiConfidenceScores": {
    "productArea": 0.95,
    "businessDomain": 0.9,
    "impactScope.regions": 0.95,
    "affectedMetrics": 0.85
  }
}

=== 输出要求 ===
1. **必须返回完整的JSON对象**，包含所有字段
2. **枚举字段必须从可选项中选择**，不能自创值
3. **自由文本字段优先保留Excel原值**，空值时才推导
4. **返回_aiFilledFields数组**，列出所有AI推导的字段名
5. **返回_aiConfidenceScores对象**，给出关键字段的置信度（0-1）
6. **不要包含任何额外解释**，只返回JSON
```

#### 3.2 配置注入策略

Prompt构建时，动态注入配置数据：

```typescript
const buildImportAIPrompt = (rawRow: any, config: {
  okrMetrics: MetricDefinition[];
  processMetrics: MetricDefinition[];
  scoringStandards: ScoringStandard[];
  complexityStandards: ComplexityStandard[];
  regions: RegionConfig[];
  roleConfigs: RoleConfig[];
  storeTypes: string[];
  storeCountRanges: string[];
  productAreas: string[];
  businessDomains: string[];
  requirementTypes: string[];
  productProgress: string[];
  techProgress: string[];
  timeCriticalities: string[];
}) => {
  // 从配置生成可选项列表
  const okrMetricsStr = config.okrMetrics
    .map(m => `    - ${m.key}: ${m.defaultName} (${m.category})`)
    .join('\n');

  const regionsStr = config.regions
    .map(r => {
      const countries = r.countries ? ': ' + r.countries.join(',') : '';
      const subRegions = r.subRegions ? ': ' + r.subRegions.join(',') : '';
      return `    - ${r.name}${countries}${subRegions}`;
    })
    .join('\n');

  // ... 其他配置

  return `
=== 原始Excel数据 ===
${JSON.stringify(rawRow, null, 2)}

...

**可选OKR指标：**
${okrMetricsStr}

**可选地区：**
${regionsStr}

...
  `;
};
```

---

### 方案4：UI设计

#### 4.1 ImportPreviewModal增强

**新增区域1：AI智能填充按钮**

```
┌───────────────────────────────────────────────────────────────┐
│ 🤖 AI智能填充（可选）                            [选择模型 ▼] │
├───────────────────────────────────────────────────────────────┤
│ AI将分析每条数据，自动填充产品领域、业务域、地区、指标等30+字段 │
│                                                               │
│ [✨ AI智能填充]  ← DeepSeek（默认） / OpenAI（可选）           │
│                                                               │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ 正在分析第 3 / 50 条  [████████░░░░░░░░░░░░] 35%             │
│ 当前：英国直营零售通适配                                       │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                               │
│ ✅ AI分析完成！共50条数据，成功48条，失败2条                    │
└───────────────────────────────────────────────────────────────┘
```

**新增区域2：表格+侧边栏预览**

```
┌─────────────────────────────────────────────────────────────────┐
│ 预览与确认                                                      │
├──────────────────────────────┬──────────────────────────────────┤
│  表格（70%）                  │  详情侧边栏（30%）                │
│  ──────────────────────────  │  ──────────────────────────────  │
│  [√] 需求名称      PM    状态 │  需求详情                         │
│  ──────────────────────────  │  ──────────────────────────────  │
│  [√] 英国直营... 杜玥  ✓AI   │  需求名称: 英国直营零售通适配      │
│  [√] 韩国授权... 杜玥  ✓AI   │  ──────────────────────────────  │
│  [√] 智利销服... 张普  ✓AI   │  产品领域: toC卖货/导购/... @杜玥 │
│  [ ] 会员积分... -     ✗失败 │            ✓ AI填充 (95%)         │
│  [√] ERA需求...  李建国 ✓AI   │  ──────────────────────────────  │
│                              │  业务域: 新零售                   │
│  (可滚动，50条)               │         ✓ AI填充 (80%)            │
│                              │  ──────────────────────────────  │
│                              │  影响的指标: 3个 ✓ AI填充         │
│                              │  • 门店开设数量 (+10-20家/年)     │
│                              │  • 经销商满意度/NPS (明显提升)    │
│                              │  • 库存周转率 (提升20%)           │
│                              │  ──────────────────────────────  │
│                              │  地区: ✓ AI填充 (90%)             │
│                              │  • 欧洲地区                       │
│                              │  • 欧洲地区 - 西欧（英国/法国/... │
│                              │  ──────────────────────────────  │
│                              │  门店类型: ✓ AI填充               │
│                              │  • 新零售-直营店                  │
│                              │  ──────────────────────────────  │
│                              │  时间窗口: 一月硬窗口 ✓ AI填充    │
│                              │  强制截止: 是 (2025-11-30)        │
│                              │  ──────────────────────────────  │
│                              │  ... (其他字段)                   │
│                              │                                  │
└──────────────────────────────┴──────────────────────────────────┘
```

**增强区域3：导入选项**

```
┌─────────────────────────────────────────────────────────────────┐
│ 导入选项                                                        │
├─────────────────────────────────────────────────────────────────┤
│ [ ] 清空已有需求后导入（警告：将删除所有现有需求）              │
│ [全选] [反选] 共选中 48 / 50 条                                 │
│                                                                 │
│ [取消]  [确认导入选中的48条]                                     │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.2 字段高亮规则

| 字段状态 | 视觉表现 |
|---------|---------|
| **AI填充成功** | 绿色背景 + ✓ 图标 + 置信度 |
| **Excel原值保留** | 正常显示 |
| **AI分析失败** | 红色背景 + ✗ 图标 + 错误消息 |
| **空值未填充** | 灰色显示"-" |

**示例**：

```
产品领域: toC卖货/导购/AI/培训/营销 @杜玥
          ✓ AI填充 (95%)
          ^^^^^^^^^^^^^ 绿色背景

需求名称: 英国直营零售通适配
          (正常显示，Excel原值)

业务团队: -
          (灰色，未填充)
```

---

## 技术实现方案

### 一、核心函数

#### 1.1 AI智能填充主函数

**文件**：`src/wsjf-sprint-planner.tsx`

```typescript
/**
 * AI智能填充所有导入数据
 * 逐条分析，显示进度，失败标记但继续
 */
const handleAISmartFill = async () => {
  const apiKey = selectedAIModel === 'openai' ? OPENAI_API_KEY : DEEPSEEK_API_KEY;
  const modelName = selectedAIModel === 'openai' ? 'OpenAI' : 'DeepSeek';

  if (!apiKey) {
    alert(`${modelName} API Key未配置`);
    return;
  }

  setIsAIFillingLoading(true);
  setAIFillingProgress(0);

  const filledData: AIFilledRequirement[] = [];

  for (let i = 0; i < importData.length; i++) {
    const rawRow = importData[i];

    // 更新进度
    setAIFillingCurrentIndex(i + 1);
    setAIFillingCurrentName(rawRow[importMapping.name] || `第${i+1}条`);
    setAIFillingProgress(Math.round((i / importData.length) * 100));

    try {
      // 调用AI分析单条数据
      const filledReq = await analyzeRequirementWithAI(rawRow, {
        okrMetrics,
        processMetrics,
        scoringStandards,
        complexityStandards,
        regions: REGIONS,
        roleConfigs: KEY_ROLES_CONFIG,
        storeTypes: STORE_TYPES,
        storeCountRanges: STORE_COUNT_RANGES,
        productAreas: PRODUCT_AREAS,
        businessDomains: BUSINESS_DOMAINS,
        requirementTypes: REQUIREMENT_TYPES,
        productProgress: PRODUCT_PROGRESS,
        techProgress: TECH_PROGRESS,
        timeCriticalities: TIME_CRITICALITY
      });

      filledReq._aiAnalysisStatus = 'success';
      filledReq._isSelected = true; // 默认勾选
      filledData.push(filledReq);

    } catch (error) {
      // 分析失败，保留原始数据并标记
      const failedReq: AIFilledRequirement = {
        ...rawRow,
        id: `REQ-${Date.now()}-${i}`,
        _aiAnalysisStatus: 'failed',
        _aiErrorMessage: error instanceof Error ? error.message : '未知错误',
        _isSelected: true
      };
      filledData.push(failedReq);
    }

    // 每10条延迟一下，避免API限流
    if ((i + 1) % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // 完成
  setAIFillingProgress(100);
  setAIFilledData(filledData);
  setIsAIFillingLoading(false);
};
```

#### 1.2 单条数据AI分析函数

```typescript
/**
 * 使用AI分析单条需求数据
 */
const analyzeRequirementWithAI = async (
  rawRow: any,
  config: {
    okrMetrics: MetricDefinition[];
    processMetrics: MetricDefinition[];
    scoringStandards: ScoringStandard[];
    complexityStandards: ComplexityStandard[];
    regions: RegionConfig[];
    roleConfigs: RoleConfig[];
    storeTypes: string[];
    storeCountRanges: string[];
    productAreas: string[];
    businessDomains: string[];
    requirementTypes: string[];
    productProgress: string[];
    techProgress: string[];
    timeCriticalities: string[];
  }
): Promise<AIFilledRequirement> => {

  const prompt = buildImportAIPrompt(rawRow, config);

  const apiUrl = selectedAIModel === 'openai'
    ? 'https://api.openai.com/v1/chat/completions'
    : 'https://api.deepseek.com/v1/chat/completions';

  const requestBody = {
    model: selectedAIModel === 'openai' ? 'gpt-3.5-turbo' : 'deepseek-chat',
    messages: [
      {
        role: 'system',
        content: 'You are a requirement data analysis expert. Analyze Excel data and output complete Requirement objects in JSON format.'
      },
      { role: 'user', content: prompt }
    ],
    temperature: 0.2, // 降低温度提高确定性
    max_tokens: 3000
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${selectedAIModel === 'openai' ? OPENAI_API_KEY : DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.error?.message || response.statusText;
      throw new Error(`API请求失败: ${errorMsg}`);
    }

    const result = await response.json();
    const aiText = result.choices?.[0]?.message?.content || '';

    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('无法解析AI返回数据');
    }

    const parsedData = JSON.parse(jsonMatch[0]);

    return parsedData as AIFilledRequirement;

  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};
```

#### 1.3 Prompt构建函数

```typescript
/**
 * 构建导入AI智能填充的Prompt
 */
const buildImportAIPrompt = (rawRow: any, config: any): string => {
  // 构建OKR指标列表
  const okrMetricsStr = config.okrMetrics
    .map((m: MetricDefinition) => `    - ${m.key}: ${m.defaultName} (${m.category})`)
    .join('\n');

  // 构建过程指标列表
  const processMetricsStr = config.processMetrics
    .map((m: MetricDefinition) => `    - ${m.key}: ${m.defaultName} (${m.category})`)
    .join('\n');

  // 构建地区列表
  const regionsStr = config.regions
    .map((r: RegionConfig) => {
      const countries = r.countries ? ': ' + r.countries.join(',') : '';
      const subRegions = r.subRegions ? ': ' + r.subRegions.join(',') : '';
      return `    - ${r.name}${countries}${subRegions}`;
    })
    .join('\n');

  // 构建角色列表
  const rolesStr = config.roleConfigs
    .map((rc: RoleConfig) => `    ${rc.categoryName}: ${rc.roles.join(', ')}`)
    .join('\n');

  // 构建评分标准
  const scoringStandardsStr = config.scoringStandards
    .map((s: ScoringStandard) => `    ${s.score}分: ${s.name} - ${s.shortDescription}`)
    .join('\n');

  // 构建技术复杂度标准
  const complexityStandardsStr = config.complexityStandards
    .map((s: ComplexityStandard) => `    ${s.score}分: ${s.name} (${s.estimatedEffort})`)
    .join('\n');

  return `
你是一个需求数据分析专家。请根据Excel行数据，智能推导完整的需求对象。

=== 原始Excel数据 ===
${JSON.stringify(rawRow, null, 2)}

=== 任务说明 ===
1. 分析Excel数据中的所有列
2. 推导出完整的Requirement对象（30+字段）
3. 对于枚举字段，必须从可选项中选择，不能自创值
4. 对于自由文本字段，如果Excel中已有值则保留，否则尝试从其他列推导

=== 字段填充规则 ===

**一、基础信息字段（9个）**
1. name (需求名称) - 自由文本，优先保留Excel值
2. description (需求描述) - 自由文本，可从多列合并
3. submitterName (提交人) - 自由文本
4. submitDate (提交日期) - 日期格式YYYY-MM-DD
5. submitter (提交部门) - 枚举: ${JSON.stringify(config.submitters || ['产品', '研发', '业务'])}
6. businessDomain (业务域) - 枚举: ${JSON.stringify(config.businessDomains)}
7. customBusinessDomain (自定义业务域) - 当businessDomain="自定义"时填写
8. businessTeam (业务团队) - 自由文本或根据businessDomain选择
9. type (需求类型) - 枚举: ${JSON.stringify(config.requirementTypes)}

**二、业务影响度（1个）**
10. businessImpactScore (1-10分) - 根据描述推断，参考标准：
${scoringStandardsStr}

**三、时间窗口（3个）**
11. timeCriticality - 枚举: ${JSON.stringify(config.timeCriticalities)}
    规则：
    - "紧急"、"urgent"、"ASAP" → 一月硬窗口
    - "Q1"、"Q2"、"三个月内" → 三月窗口
    - 没有时间要求 → 随时
12. hardDeadline - 布尔值，识别关键词："截止"、"deadline"、"DDL"
13. deadlineDate - 日期格式，hardDeadline=true时填写

**四、需求相关性（4个复杂对象）**
14. impactScope.storeTypes - 数组，可选: ${JSON.stringify(config.storeTypes)}
    规则：识别"直营"→"新零售-直营店"，"授权"→"新零售-授权店"

15. impactScope.regions - 数组，可选项见下：
${regionsStr}
    规则：
    - 识别国家名称（如"英国"、"智利"、"韩国"）
    - 同时选择大区和具体国家，如：["欧洲地区", "欧洲地区 - 西欧（英国/法国/德国/意大利/西班牙）"]

16. impactScope.keyRoles - 数组，对象格式：
${rolesStr}
    格式：[{ category: "regional", roleName: "店长", isCustom: false }, ...]

17. impactScope.storeCountRange - 枚举: ${JSON.stringify(config.storeCountRanges)}

**五、影响的指标（1个复杂数组）**
18. affectedMetrics - 数组，格式：
    [
      {
        metricKey: "dealer_satisfaction_nps",
        metricName: "经销商满意度/NPS",
        displayName: "经销商满意度/NPS",
        estimatedImpact: "明显提升",
        category: "okr"
      },
      ...
    ]

    可选OKR指标：
${okrMetricsStr}

    可选过程指标：
${processMetricsStr}

    规则：
    - 根据需求描述推断影响的指标
    - estimatedImpact填写具体影响（如"+5%"、"明显提升"、"从2天→实时"）

**六、产研填写（9个）**
19. project (项目名称) - 自由文本
20. productArea (产品领域) - 枚举，**重点规则**：
    可选项：
    - "管店/固资/物 @张普"
    - "toC卖货/导购/AI/培训/营销 @杜玥"
    - "管人/SO上报/考勤 @胡馨然"
    - "toB进货/交易/返利 @李建国"

    **识别规则（必须严格遵守）**：
    - 看到"@杜玥"或"杜玥" → 选择"toC卖货/导购/AI/培训/营销 @杜玥"
    - 看到"@张普"或"张普" → 选择"管店/固资/物 @张普"
    - 看到"@胡馨然"或"胡馨然" → 选择"管人/SO上报/考勤 @胡馨然"
    - 看到"@李建国"或"李建国" → 选择"toB进货/交易/返利 @李建国"
    - 根据需求内容推断（卖货/导购→杜玥，管店/库存→张普，人员/考勤→胡馨然，进货/交易→李建国）

21. productManager (产品经理) - 自由文本，提取人名
22. backendDeveloper (后端) - 自由文本
23. frontendDeveloper (前端) - 自由文本
24. tester (测试) - 自由文本
25. productProgress - 枚举: ${JSON.stringify(config.productProgress)}
26. techProgress - 枚举: ${JSON.stringify(config.techProgress)}
27. effortDays (工作量天数) - 数字，优先保留Excel值
28. complexityScore (技术复杂度1-10) - 参考标准：
${complexityStandardsStr}
29. isRMS - 布尔值，识别关键词：RMS、重构
30. rdNotes (产研备注) - 自由文本

**七、文档（1个）**
31. documents - 数组，从description中提取URL链接

=== 示例 ===

**输入Excel行：**
{
  "需求名称": "英国直营零售通适配",
  "负责人": "@杜玥",
  "产品经理": "Andy Wei魏有峰",
  "工作量": "45",
  "提交日期": "2025-11-30",
  "类别": "国际部新增"
}

**输出Requirement对象：**
{
  "name": "英国直营零售通适配",
  "productArea": "toC卖货/导购/AI/培训/营销 @杜玥",
  "productManager": "Andy Wei魏有峰",
  "effortDays": 45,
  "submitDate": "2025-11-30",
  "businessDomain": "新零售",
  "impactScope": {
    "regions": ["欧洲地区", "欧洲地区 - 西欧（英国/法国/德国/意大利/西班牙）"],
    "storeTypes": ["新零售-直营店"],
    "keyRoles": [],
    "storeCountRange": undefined
  },
  "businessImpactScore": 7,
  "affectedMetrics": [
    {
      "metricKey": "store_opening_count",
      "metricName": "门店开设数量",
      "displayName": "门店开设数量",
      "estimatedImpact": "+10-20家/年",
      "category": "okr"
    }
  ],
  "timeCriticality": "三月窗口",
  "hardDeadline": true,
  "deadlineDate": "2025-11-30",
  "type": "功能开发",
  "submitter": "业务",
  "productProgress": "待评估",
  "techProgress": "已评估工作量",
  "isRMS": false,
  "complexityScore": 6,

  "_aiFilledFields": ["productArea", "businessDomain", "impactScope", "businessImpactScore", "affectedMetrics", "timeCriticality"],
  "_aiConfidenceScores": {
    "productArea": 0.95,
    "businessDomain": 0.8,
    "impactScope.regions": 0.9
  }
}

=== 输出要求 ===
1. **必须返回完整的JSON对象**，包含所有字段
2. **枚举字段必须从可选项中选择**，不能自创值
3. **自由文本字段优先保留Excel原值**，空值时才推导
4. **返回_aiFilledFields数组**，列出所有AI推导的字段名
5. **返回_aiConfidenceScores对象**，给出关键字段的置信度（0-1）
6. **不要包含任何额外解释**，只返回JSON

现在请分析并返回结果：
`;
};
```

---

### 二、数据结构

#### 2.1 类型定义扩展

**文件**：`src/types/index.ts`

```typescript
/**
 * AI分析状态
 */
export type AIAnalysisStatus = 'pending' | 'analyzing' | 'success' | 'failed';

/**
 * AI填充的需求对象（扩展Requirement）
 * 包含AI填充的元数据，用于UI标注
 */
export interface AIFilledRequirement extends Requirement {
  _aiFilledFields?: string[];                       // AI填充的字段名列表
  _aiConfidenceScores?: Record<string, number>;     // 各字段置信度 0-1
  _aiAnalysisStatus?: AIAnalysisStatus;             // 分析状态
  _aiErrorMessage?: string;                         // 分析失败的错误消息
  _isSelected?: boolean;                            // 是否被用户勾选导入
}
```

#### 2.2 Store状态扩展

**文件**：`src/store/useStore.ts`

```typescript
interface StoreState {
  // ... 现有状态

  // AI智能填充相关（新增）
  isAIFillingLoading: boolean;                      // AI填充进度中
  aiFillingProgress: number;                        // 进度百分比 0-100
  aiFillingCurrentIndex: number;                    // 当前分析到第几条
  aiFillingCurrentName: string;                     // 当前分析的需求名称
  aiFilledData: AIFilledRequirement[];              // AI填充后的数据
  selectedRequirementIndex: number | null;          // 侧边栏选中的需求索引

  setIsAIFillingLoading: (loading: boolean) => void;
  setAIFillingProgress: (progress: number) => void;
  setAIFillingCurrentIndex: (index: number) => void;
  setAIFillingCurrentName: (name: string) => void;
  setAIFilledData: (data: AIFilledRequirement[]) => void;
  setSelectedRequirementIndex: (index: number | null) => void;
}

// 实现
export const useStore = create<StoreState>((set) => ({
  // ... 现有状态

  // AI智能填充状态
  isAIFillingLoading: false,
  aiFillingProgress: 0,
  aiFillingCurrentIndex: 0,
  aiFillingCurrentName: '',
  aiFilledData: [],
  selectedRequirementIndex: null,

  setIsAIFillingLoading: (loading) => set({ isAIFillingLoading: loading }),
  setAIFillingProgress: (progress) => set({ aiFillingProgress: progress }),
  setAIFillingCurrentIndex: (index) => set({ aiFillingCurrentIndex: index }),
  setAIFillingCurrentName: (name) => set({ aiFillingCurrentName: name }),
  setAIFilledData: (data) => set({ aiFilledData: data }),
  setSelectedRequirementIndex: (index) => set({ selectedRequirementIndex: index }),
}));
```

---

### 三、UI组件

#### 3.1 ImportPreviewModal增强

在现有Modal中添加AI智能填充区域和预览区域（详见"优化方案设计 - 方案4"）

#### 3.2 RequirementDetailPanel组件（新增）

**文件**：`src/components/RequirementDetailPanel.tsx`

```typescript
import React from 'react';
import { AIFilledRequirement } from '../types';

interface RequirementDetailPanelProps {
  requirement: AIFilledRequirement;
}

const RequirementDetailPanel: React.FC<RequirementDetailPanelProps> = ({ requirement }) => {
  const aiFields = requirement._aiFilledFields || [];

  return (
    <div className="space-y-3 text-sm">
      <h4 className="font-semibold text-gray-900 border-b pb-2">需求详情</h4>

      {/* AI分析状态 */}
      {requirement._aiAnalysisStatus === 'failed' && (
        <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
          <div className="font-medium">AI分析失败</div>
          <div>{requirement._aiErrorMessage}</div>
        </div>
      )}

      {requirement._aiAnalysisStatus === 'success' && (
        <div className="p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800">
          ✅ AI已智能填充 {aiFields.length} 个字段
        </div>
      )}

      {/* 字段列表 */}
      <DetailItem label="需求名称" value={requirement.name} isAI={aiFields.includes('name')} />
      <DetailItem label="产品领域" value={requirement.productArea} isAI={aiFields.includes('productArea')} confidence={requirement._aiConfidenceScores?.productArea} />
      <DetailItem label="业务域" value={requirement.businessDomain} isAI={aiFields.includes('businessDomain')} />
      <DetailItem label="业务影响度" value={`${requirement.businessImpactScore}分`} isAI={aiFields.includes('businessImpactScore')} />

      {/* 影响的指标 */}
      {requirement.affectedMetrics && requirement.affectedMetrics.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-gray-700 flex items-center gap-1">
            影响的指标
            {aiFields.includes('affectedMetrics') && <span className="text-green-600">✓ AI填充</span>}
          </div>
          <div className="text-xs text-gray-600 space-y-1 pl-2">
            {requirement.affectedMetrics.map((m, i) => (
              <div key={i}>• {m.metricName} ({m.estimatedImpact})</div>
            ))}
          </div>
        </div>
      )}

      {/* 地区 */}
      {requirement.impactScope?.regions && requirement.impactScope.regions.length > 0 && (
        <DetailItem
          label="地区"
          value={requirement.impactScope.regions.join(', ')}
          isAI={aiFields.includes('impactScope')}
        />
      )}

      {/* 门店类型 */}
      {requirement.impactScope?.storeTypes && requirement.impactScope.storeTypes.length > 0 && (
        <DetailItem
          label="门店类型"
          value={requirement.impactScope.storeTypes.join(', ')}
          isAI={aiFields.includes('impactScope')}
        />
      )}

      {/* 时间窗口 */}
      <DetailItem label="时间窗口" value={requirement.timeCriticality} isAI={aiFields.includes('timeCriticality')} />
      {requirement.hardDeadline && (
        <DetailItem label="截止日期" value={requirement.deadlineDate} isAI={aiFields.includes('deadlineDate')} />
      )}

      {/* 更多字段... */}
    </div>
  );
};

interface DetailItemProps {
  label: string;
  value?: string | number;
  isAI?: boolean;
  confidence?: number;
}

const DetailItem: React.FC<DetailItemProps> = ({ label, value, isAI, confidence }) => (
  <div className="space-y-1">
    <div className="text-xs font-medium text-gray-700 flex items-center gap-1">
      {label}
      {isAI && <span className="text-green-600">✓</span>}
      {confidence && (
        <span className="text-xs text-gray-500">
          ({Math.round(confidence * 100)}%)
        </span>
      )}
    </div>
    <div className={`text-sm ${isAI ? 'text-green-700 bg-green-50 px-2 py-1 rounded' : 'text-gray-900'}`}>
      {value || '-'}
    </div>
  </div>
);

export default RequirementDetailPanel;
```

---

## 完整交互流程

### 场景演示：导入50条需求并使用AI智能填充

#### Step 1: 上传Excel文件

```
用户操作：点击"导入"按钮 → 选择Excel文件

Excel文件内容（50条需求）：
| 需求名称                    | 负责人    | 工作量 | 截止日期    | 备注                  |
|---------------------------|----------|-------|------------|---------------------|
| 英国直营零售通适配          | @杜玥    | 45    | 2025-11-30 | 紧急，Q4必须完成     |
| 韩国授权零售通适配          | @杜玥    | 50    | 2025-12-15 | 涉及店长、区域经理   |
| 智利销服一体试营业          | @张普    | 35    | 2025-11-15 | 影响库存周转率       |
| ... (共50条)
```

**系统响应**：
- 解析Excel文件 ✅
- 自动字段映射（autoMapFields）✅
- 显示导入预览Modal

---

#### Step 2: 基础字段映射（现有功能）

```
┌───────────────────────────────────────────────────────────────┐
│ 导入预览与字段映射                                            │
├───────────────────────────────────────────────────────────────┤
│ 检测到 50 条记录，共 5 个字段                                  │
│                                                               │
│ 字段映射配置：                                                │
│ ─────────────────────────────────────────────────────────────│
│ Excel列名        示例数据           映射到系统字段             │
│ ─────────────────────────────────────────────────────────────│
│ 需求名称         英国直营...       → [需求名称 ▼]             │
│ 负责人           @杜玥             → [不映射 ▼]  ← 基础映射无法识别 │
│ 工作量           45                → [工作量(天数) ▼]          │
│ 截止日期         2025-11-30        → [强制截止 ▼]             │
│ 备注             紧急，Q4...        → [不映射 ▼]  ← 基础映射无法识别 │
│ ─────────────────────────────────────────────────────────────│
│                                                               │
│ ⚠️ 提示：仅映射了基础字段，其他30+字段需手动填写             │
└───────────────────────────────────────────────────────────────┘
```

---

#### Step 3: 点击"🤖 AI智能填充"按钮

```
用户操作：点击"AI智能填充"按钮

系统响应：
┌───────────────────────────────────────────────────────────────┐
│ 🤖 AI智能填充（DeepSeek）                                      │
├───────────────────────────────────────────────────────────────┤
│ AI将分析每条数据，自动填充产品领域、业务域、地区、指标等30+字段 │
│                                                               │
│ [✨ AI智能填充] ← 点击                                         │
│                                                               │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ 正在分析第 3 / 50 条  [████████░░░░░░░░░░░░] 35%             │
│ 当前：英国直营零售通适配                                       │
│ 预计剩余时间：2分钟                                           │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
└───────────────────────────────────────────────────────────────┘

分析过程：
[3/50] 英国直营零售通适配
  → 读取Excel行数据 ✅
  → 构建Prompt（含配置） ✅
  → 调用DeepSeek API ✅
  → 解析JSON返回 ✅
  → AI推导字段：productArea, businessDomain, impactScope.regions,
     impactScope.storeTypes, businessImpactScore, affectedMetrics,
     timeCriticality, hardDeadline, deadlineDate ✅
```

---

#### Step 4: AI分析完成

```
        ↓ 3分钟后，分析完成

┌───────────────────────────────────────────────────────────────┐
│ ✅ AI分析完成！共50条数据，成功48条，失败2条                    │
│                                                               │
│ 失败的2条：                                                   │
│ • 第25条："会员积分系统升级" - 错误：API超时                  │
│ • 第37条："智能客服机器人" - 错误：无法解析返回数据            │
└───────────────────────────────────────────────────────────────┘
```

---

#### Step 5: 预览AI填充结果（表格+侧边栏）

```
用户操作：查看预览表格

┌─────────────────────────────────────────────────────────────────┐
│ 预览与确认                                                      │
├──────────────────────────────┬──────────────────────────────────┤
│  表格（70%）                  │  详情侧边栏（30%）                │
│  ──────────────────────────  │  ──────────────────────────────  │
│  [√] 需求名称      PM    状态 │  (点击左侧表格行查看详情)         │
│  ──────────────────────────  │                                  │
│  [√] 英国直营... 杜玥  ✓AI   │                                  │
│  [√] 韩国授权... 杜玥  ✓AI   │                                  │
│  [√] 智利销服... 张普  ✓AI   │                                  │
│  ...                         │                                  │
│  [ ] 会员积分... -     ✗失败 │                                  │
│  ...                         │                                  │
│  [ ] 智能客服... -     ✗失败 │                                  │
│  ...                         │                                  │
│  [√] ERA需求...  李建国 ✓AI   │                                  │
│                              │                                  │
└──────────────────────────────┴──────────────────────────────────┘

用户点击第1行：英国直营零售通适配
        ↓

│  详情侧边栏（30%）                │
│  ──────────────────────────────  │
│  需求详情                         │
│  ──────────────────────────────  │
│  ✅ AI已智能填充 12 个字段        │
│  ──────────────────────────────  │
│  需求名称: 英国直营零售通适配      │
│  ──────────────────────────────  │
│  产品领域: toC卖货/导购/... @杜玥 │
│            ✓ AI填充 (95%)         │
│  ──────────────────────────────  │
│  业务域: 新零售                   │
│         ✓ AI填充 (80%)            │
│  ──────────────────────────────  │
│  业务影响度: 7分                  │
│              ✓ AI填充 (85%)       │
│  ──────────────────────────────  │
│  影响的指标: ✓ AI填充             │
│  • 门店开设数量 (+10-20家/年)     │
│  • 经销商满意度/NPS (明显提升)    │
│  ──────────────────────────────  │
│  地区: ✓ AI填充 (90%)             │
│  • 欧洲地区                       │
│  • 欧洲地区 - 西欧（英国/法国/... │
│  ──────────────────────────────  │
│  门店类型: ✓ AI填充               │
│  • 新零售-直营店                  │
│  ──────────────────────────────  │
│  时间窗口: 一月硬窗口 ✓ AI填充    │
│  强制截止: 是 (2025-11-30)        │
│  ──────────────────────────────  │
│  工作量: 45天                     │
│  技术复杂度: 6分 ✓ AI填充         │
│  ──────────────────────────────  │
│  ... (其他字段)                   │
│                                  │
```

---

#### Step 6: 确认导入

```
用户操作：
1. 查看AI填充结果 ✅
2. 微调个别字段（可选）
3. 取消勾选失败的2条
4. 勾选"清空已有需求后导入"（可选）
5. 点击"确认导入选中的48条"

┌─────────────────────────────────────────────────────────────────┐
│ 导入选项                                                        │
├─────────────────────────────────────────────────────────────────┤
│ [√] 清空已有需求后导入（警告：将删除所有现有需求）              │
│ [全选] [反选] 共选中 48 / 50 条                                 │
│                                                                 │
│ [取消]  [确认导入选中的48条] ← 点击                              │
└─────────────────────────────────────────────────────────────────┘

系统响应：
1. 清空已有需求（如果勾选） ✅
2. 导入48条需求 ✅
3. 每条需求包含30+字段完整数据 ✅
4. 显示成功提示："已成功导入48条需求 ✅"
```

---

#### 结果对比

**导入前（无AI智能填充）**：
- 导入50条需求
- 仅映射5个基础字段（需求名称、工作量、截止日期等）
- 其他30+字段为空或默认值
- **需要手动填写**：50条 × 30字段 = **1500次操作** 😱

**导入后（有AI智能填充）**：
- 导入48条需求（2条失败）
- 自动填充30+字段（产品领域、业务域、地区、指标、时间窗口等）
- 只需确认/微调：48条 × 1次点击 = **48次操作** ✅
- **效率提升**：1500次 → 48次 = **96.8%减少** 🎉

---

## 验收标准

### 功能验收

#### 1. AI智能填充功能

| 测试场景 | 输入条件 | 期望结果 |
|---------|---------|---------|
| **场景1** | 上传50条需求Excel，点击AI智能填充 | 逐条分析，显示进度（1/50, 2/50, ...），3分钟完成 |
| **场景2** | Excel列："负责人" = "@杜玥" | AI推导：productArea = "toC卖货/导购/AI/培训/营销 @杜玥" |
| **场景3** | Excel列："需求名称" = "英国直营零售通适配" | AI推导：regions = ["欧洲地区", "欧洲地区 - 西欧"], storeTypes = ["新零售-直营店"] |
| **场景4** | Excel列："备注" = "紧急，Q4必须完成" | AI推导：timeCriticality = "一月硬窗口", hardDeadline = true |
| **场景5** | Excel列："影响指标" = "库存周转率" | AI推导：affectedMetrics包含库存周转率指标 |
| **场景6** | 某条数据AI分析失败（超时） | 标记为"失败"，显示错误消息，继续下一条 |

#### 2. 枚举值替换

| 测试场景 | Excel值 | 期望AI替换结果 |
|---------|---------|---------------|
| **场景1** | productArea = "@杜玥" | "toC卖货/导购/AI/培训/营销 @杜玥" |
| **场景2** | businessDomain = "直营店业务" | "新零售" |
| **场景3** | submitter = "业务部" | "业务" |
| **场景4** | type = "新功能" | "功能开发" |
| **场景5** | timeCriticality = "紧急" | "一月硬窗口" |

#### 3. 自由文本保留

| 测试场景 | Excel值 | 期望结果 |
|---------|---------|---------|
| **场景1** | name = "英国直营零售通适配" | 保留原值 |
| **场景2** | productManager = "Andy Wei魏有峰" | 保留原值 |
| **场景3** | description = "当前经销商对账..." | 保留原值 |

#### 4. 预览界面

| 测试场景 | 操作 | 期望结果 |
|---------|------|---------|
| **场景1** | 点击表格某行 | 右侧侧边栏显示该需求详情 |
| **场景2** | 查看AI填充字段 | 绿色背景 + ✓ 图标 + 置信度 |
| **场景3** | 查看AI分析失败的行 | 红色背景 + ✗ 图标 + 错误消息 |
| **场景4** | 勾选/取消勾选某行 | 勾选状态更新，底部统计更新 |

#### 5. 部分导入

| 测试场景 | 操作 | 期望结果 |
|---------|------|---------|
| **场景1** | 勾选48条，取消勾选2条失败的 | 底部显示"共选中 48 / 50 条" |
| **场景2** | 点击"全选" | 所有50条被勾选 |
| **场景3** | 点击"反选" | 勾选状态反转 |
| **场景4** | 勾选"清空已有需求后导入" | 显示警告提示 |
| **场景5** | 点击"确认导入选中的48条" | 仅导入勾选的48条 |

---

### 性能验收

| 指标 | 目标值 | 说明 |
|------|-------|------|
| **AI分析单条耗时** | < 4秒 | DeepSeek平均响应时间 |
| **AI分析50条总耗时** | < 4分钟 | 50条 × 4秒 = 200秒 ≈ 3.5分钟 |
| **UI交互响应** | < 100ms | 点击表格行、勾选框 |
| **进度更新频率** | 实时 | 每条分析完立即更新进度 |

---

### 准确度验收

| 指标 | 目标值 | 说明 |
|------|-------|------|
| **productArea识别准确率** | > 95% | 识别@人名的准确率 |
| **地区识别准确率** | > 90% | 识别国家名的准确率 |
| **枚举替换准确率** | > 85% | 非标准值→标准枚举 |
| **整体字段填充完整度** | > 80% | 30+字段的填充率 |

---

## 实施计划

### 阶段1：核心功能实施（预计6小时）

#### Task 1.1: 数据结构和Store扩展（1小时）

**文件**：
- `src/types/index.ts`（修改）
- `src/store/useStore.ts`（修改）

**实施步骤**：
1. 添加AIFilledRequirement类型定义（20分钟）
2. 扩展Store状态（AI填充相关状态）（20分钟）
3. 测试类型正确性（20分钟）

**验收**：
- ✅ TypeScript编译无错误
- ✅ Store状态正确初始化

---

#### Task 1.2: AI Prompt构建函数（2小时）

**文件**：
- `src/wsjf-sprint-planner.tsx`（修改）

**实施步骤**：
1. 实现buildImportAIPrompt函数（60分钟）
   - 读取配置数据（REGIONS, KEY_ROLES_CONFIG, OKR_METRICS等）
   - 构建完整Prompt（字段规则、示例、输出要求）
2. 测试Prompt生成（30分钟）
3. 优化Prompt模板（30分钟）

**验收**：
- ✅ Prompt包含所有配置项
- ✅ Prompt格式正确
- ✅ Few-shot示例准确

---

#### Task 1.3: AI分析核心函数（2小时）

**文件**：
- `src/wsjf-sprint-planner.tsx`（修改）

**实施步骤**：
1. 实现analyzeRequirementWithAI函数（60分钟）
   - API调用（DeepSeek/OpenAI）
   - 超时控制（30秒）
   - 错误处理
2. 实现handleAISmartFill函数（40分钟）
   - 逐条分析循环
   - 进度更新
   - 失败处理
3. 测试AI分析（20分钟）

**验收**：
- ✅ AI API调用成功
- ✅ JSON解析正确
- ✅ 失败标记正确

---

#### Task 1.4: UI组件实现（1小时）

**文件**：
- `src/wsjf-sprint-planner.tsx`（修改ImportPreviewModal）
- `src/components/RequirementDetailPanel.tsx`（新增）

**实施步骤**：
1. 在ImportPreviewModal中添加AI智能填充按钮区域（20分钟）
2. 添加进度显示组件（15分钟）
3. 实现表格+侧边栏布局（20分钟）
4. 创建RequirementDetailPanel组件（5分钟 - 复用EditRequirementModal逻辑）

**验收**：
- ✅ UI美观统一
- ✅ 进度实时更新
- ✅ 表格+侧边栏交互流畅

---

### 阶段2：测试和优化（预计2小时）

#### Task 2.1: 功能测试（1小时）

- 测试所有验收场景
- 修复发现的问题
- 边界情况测试（空值、超长文本、特殊字符等）

#### Task 2.2: 性能优化（30分钟）

- 优化Prompt长度（减少不必要内容）
- 添加API调用间隔（避免限流）
- 测试大批量数据（100条）

#### Task 2.3: 用户体验优化（30分钟）

- 优化提示文案
- 添加帮助说明
- 优化错误提示

---

### 总预计时间

| 阶段 | 预计时间 |
|------|---------|
| **阶段1：核心功能** | 6小时 |
| **阶段2：测试优化** | 2小时 |
| **总计** | 8小时 |

---

## 风险评估

### 技术风险

| 风险 | 影响程度 | 缓解措施 |
|------|---------|---------|
| **AI API超时/失败** | 高 | 添加30秒超时 + 重试机制 + 失败标记继续 |
| **AI返回数据格式错误** | 中 | 严格JSON解析 + 降级处理 |
| **API调用成本** | 中 | 估算成本（50条×￥0.02≈￥1），可接受 |
| **Prompt过长** | 低 | 优化配置注入，控制在3000 tokens内 |

### 用户体验风险

| 风险 | 影响程度 | 缓解措施 |
|------|---------|---------|
| **AI填充准确率低** | 高 | 优化Prompt + Few-shot学习 + 用户可修改 |
| **分析时间长** | 中 | 显示进度 + 预估时间 + 允许中断 |
| **用户不理解AI填充** | 低 | 提供清晰说明 + 高亮标注 + 置信度显示 |

---

## 未来优化方向（P1）

### 1. 批量并行分析

- 当前：逐条串行分析（50条 ≈ 3.5分钟）
- 优化：批量并行分析（50条 ≈ 1分钟）
- 方案：一次性发送多条数据给AI，返回批量结果

### 2. 用户反馈学习

- 记录用户修正的映射规则
- 下次导入时自动应用学习到的规则
- 提升准确率

### 3. AI分析历史记录

- 记录每次AI分析的结果
- 允许用户查看和对比历史分析
- 方便审计和追溯

### 4. 更多AI模型支持

- 支持Gemini
- 支持国产大模型（通义千问、文心一言）
- 模型性能对比

---

## 附录

### A. 相关文件清单

| 文件路径 | 修改类型 | 说明 |
|---------|---------|------|
| `src/wsjf-sprint-planner.tsx` | 修改 | 主组件，添加AI智能填充逻辑 |
| `src/types/index.ts` | 修改 | 添加AIFilledRequirement类型 |
| `src/store/useStore.ts` | 修改 | 扩展AI填充相关状态 |
| `src/components/RequirementDetailPanel.tsx` | 新增 | 详情侧边栏组件 |
| `IMPORT_AI_SMART_FILL_REQUIREMENTS.md` | 新增 | 本需求文档 |

### B. 依赖库

无新增依赖，使用现有库：
- `fetch` - API调用（浏览器原生）
- `zustand` - 状态管理（已有）

### C. 配置文件依赖

| 配置文件 | 用途 |
|---------|------|
| `src/config/index.ts` | 配置索引中心 |
| `src/config/businessFields.ts` | 地区、角色、门店类型配置 |
| `src/config/metrics.ts` | OKR指标和过程指标配置 |
| `src/config/scoringStandards.ts` | 业务影响度评分标准 |
| `src/config/complexityStandards.ts` | 技术复杂度评分标准 |
| `src/config/api.ts` | API密钥配置 |

---

**文档版本**: v1.0
**最后更新**: 2025-01-19
**下次审查**: 实施完成后

---

## 变更记录

| 日期 | 版本 | 变更内容 | 作者 |
|------|------|---------|------|
| 2025-01-19 | v1.0 | 初始版本创建 | Claude |
