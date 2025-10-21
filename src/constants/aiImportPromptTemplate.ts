/**
 * AI导入智能填充的Prompt模板
 *
 * 这个模板用于指导AI从Excel原始数据中智能推导需求的30+个字段
 *
 * @module constants/aiImportPromptTemplate
 */

import type { OKR_METRICS, PROCESS_METRICS } from '../config/metrics';
import type { SCORING_STANDARDS } from '../config/scoringStandards';
import type { COMPLEXITY_STANDARDS } from '../config/complexityStandards';

/**
 * 构建AI导入Prompt
 *
 * @param rawDataStr - 格式化后的原始Excel数据JSON字符串
 * @param config - 配置数据（枚举选项、评分标准等）
 * @returns 完整的AI prompt字符串
 */
export function buildAIImportPromptTemplate(
  rawDataStr: string,
  config: {
    okrMetrics: typeof OKR_METRICS;
    processMetrics: typeof PROCESS_METRICS;
    scoringStandards: typeof SCORING_STANDARDS;
    complexityStandards: typeof COMPLEXITY_STANDARDS;
    businessDomains: string[];
    requirementTypes: string[];
    regions: string[];
    storeTypes: string[];
    productAreas: string[];
    timeCriticalityOptions: string[];
  }
): string {
  return `你是WSJF需求管理系统的数据分析助手。请分析以下Excel导入的原始数据,智能推导并填充30+个字段。

# 原始Excel数据
\`\`\`json
${rawDataStr}
\`\`\`

# 字段填充规则

## 一、基本信息字段（9个）

### 1. name（需求名称）- 自由文本
- **规则**：保留Excel中的原始需求名称
- **示例**：如果Excel有"需求名称"列为"门店库存预警功能"，则填充："门店库存预警功能"

### 2. description（需求描述）- 自由文本
- **规则**：提取Excel中的描述信息，可能来自"需求描述"、"详细说明"、"备注"等列
- **处理**：如果有多列包含描述信息，合并为一个完整描述

### 3. submitterName（提交人姓名）- 自由文本
- **规则**：提取人名，去除@符号和额外信息
- **示例**："@张三 产品经理" → "张三"

### 4. submitDate（提交日期）- 日期格式 YYYY-MM-DD
- **规则**：将Excel日期转换为标准格式
- **默认**：如果缺失，使用当前日期

### 5. submitter（提交方）- 枚举
- **可选值**：${['产品', '研发', '业务'].join(', ')}
- **推导规则**：
  - 如果描述中提到"业务需求"、"门店反馈"、"区域要求" → "业务"
  - 如果提到"技术债"、"重构"、"架构" → "研发"
  - 默认 → "产品"

### 6. businessTeam（业务团队）- 自由文本
- **规则**：识别团队名称关键词
- **示例**："开店团队"、"供应链团队"、"运营团队"、"经销商团队"

### 7. businessDomain（业务域）- 枚举
- **可选值**：${config.businessDomains.join(', ')}
- **推导规则**：
  - 提到"直营店"、"授权店"、"专卖店" → "新零售"
  - 提到"经销商"、"渠道"、"toB" → "渠道零售"
  - 提到"通用"、"全局" → "国际零售通用"

### 8. customBusinessDomain（自定义业务域）- 自由文本
- **规则**：仅当businessDomain为"自定义"时填写

### 9. type（需求类型）- 枚举
- **可选值**：${config.requirementTypes.join(', ')}

---

## 二、业务影响度评分（1个核心+2个辅助）

### 10. businessImpactScore（业务影响度评分）- 枚举 1-10
- **评分标准**：
  - **10分（致命缺陷）**：系统崩溃、业务停摆、合规风险
  - **9分（严重阻塞）**：关键流程严重受阻，需大量人工兜底
  - **8分（战略必需）**：影响关键KPI，CEO/CTO级关注
  - **7分（显著影响）**：明确影响OKR指标，跨部门协作
  - **6分（重要改进）**：显著提升效率或体验
  - **5分（有价值功能）**：解决明确痛点
  - **4分（优化改进）**：改善现有功能
  - **3分（小改进）**：小幅优化
  - **2分（边缘改进）**：少数人受益
  - **1分（微小改进）**：锦上添花

- **推导策略**：
  1. 看业务后果：提到"无法"、"崩溃"、"停摆" → 9-10分
  2. 看影响范围：提到"全球"、"所有门店" → 7-10分
  3. 看OKR关联：提到"GMV"、"营收"、"NPS" → 6-8分
  4. 看紧急度：提到"紧急"、"立即" → 6-8分
  5. 默认：5分

### 11. affectedMetrics（影响的指标）- 复杂数组
- **结构**：
\`\`\`json
[
  {
    "metricKey": "gmv",
    "metricName": "GMV/营收",
    "displayName": "GMV/营收",
    "estimatedImpact": "+5%",
    "category": "okr",
    "isAISuggested": true
  }
]
\`\`\`

- **核心OKR指标**：${config.okrMetrics.map(m => `${m.key}:${m.defaultName}`).slice(0, 5).join(', ')}...
- **过程指标**：${config.processMetrics.map(m => `${m.key}:${m.defaultName}`).slice(0, 5).join(', ')}...

- **推导规则**：
  1. 分析需求描述，识别关键词
  2. "收入"、"GMV"、"销售" → gmv指标
  3. "满意度"、"NPS"、"体验" → dealer_satisfaction_nps
  4. "效率"、"时间"、"自动化" → 对应过程指标
  5. 预估影响度："+X%"、"明显提升"、"从X小时→X分钟"

### 12. impactScope（影响范围）- 复杂对象
- **结构**：
\`\`\`json
{
  "storeTypes": ["新零售-直营店", "新零售-授权店"],
  "regions": ["南亚", "东南亚"],
  "storeCountRange": "50-200家",
  "keyRoles": [
    {
      "category": "regional",
      "roleName": "店员",
      "isCustom": false
    }
  ]
}
\`\`\`

- **门店类型可选值**：${config.storeTypes.join(', ')}
- **区域可选值**：${config.regions.join(', ')}
- **门店数量范围**：<10家, 10-50家, 50-200家, 200-500家, 500-1000家, >1000家, 全球所有门店

---

## 三、时间维度（3个）

### 13. timeCriticality（时间临界度）- 枚举
- **可选值**：${config.timeCriticalityOptions.join(', ')}
- **推导规则**：
  - 提到"紧急"、"立即"、"本月必须" → "一月硬窗口"
  - 提到"尽快"、"季度内"、"Q1完成" → "三月窗口"
  - 默认 → "随时"

### 14. hardDeadline（是否有强制截止日期）- 布尔值
- **规则**：如果提到具体日期或"必须在X之前"、"deadline" → true

### 15. deadlineDate（截止日期）- 日期 YYYY-MM-DD
- **规则**：提取Excel中的日期字段

---

## 四、技术信息（9个）

### 16. effortDays（预估工作量）- 数字
- **规则**：
  - 提取"X人天"、"X天"、"X工时"
  - 如果是"X人周"，换算：1人周=5人天
  - 默认：5（如果完全没有信息）

### 17. complexityScore（技术复杂度）- 枚举 1-10
- **评分标准**：
  - **10分**：全新技术平台，技术栈重建
  - **9分**：核心架构重构，系统级改造
  - **8分**：系统级改造，多模块联动
  - **5分**：中等功能开发，单模块改造
  - **3分**：简单功能，少量代码
  - **1分**：配置调整，文案修改

- **推导规则**：
  - 工作量 >100天 → 9-10分
  - 工作量 50-100天 → 7-8分
  - 工作量 20-50天 → 5-6分
  - 工作量 5-20天 → 3-4分
  - 工作量 <5天 → 1-2分

### 18. productArea（产品领域）- 枚举 ⭐ 特殊规则
- **可选值**：${config.productAreas.join(' | ')}

- **识别规则**：
  - 看到"@张普" → "管店/固资/物 @张普"
  - 看到"@杜玥" → "toC卖货/导购/AI/培训/营销 @杜玥"
  - 看到"@胡馨然" → "管人/SO上报/考勤 @胡馨然"
  - 看到"@李建国" → "toB进货/交易/返利 @李建国"
  - 看内容关键词：
    - "固资"、"资产"、"门店管理" → 张普
    - "导购"、"卖货"、"AI"、"培训" → 杜玥
    - "考勤"、"上报"、"SO" → 胡馨然
    - "进货"、"经销商"、"返利"、"toB" → 李建国

### 19. productManager（产品经理）- 自由文本
- **规则**：提取人名，可能与productArea中的@人名一致

### 20. developer（研发负责人）- 自由文本（保留字段）
- **规则**：提取"研发"、"开发"相关的人名

### 21. backendDeveloper（后端研发）- 自由文本
- **规则**：提取后端开发人员姓名

### 22. frontendDeveloper（前端研发）- 自由文本
- **规则**：提取前端开发人员姓名

### 23. tester（测试）- 自由文本
- **规则**：提取测试人员姓名

### 24. project（项目名称）- 自由文本
- **规则**：识别项目名称，如"RMS重构"、"开店系统V2"

### 25. productProgress（产品进度）- 自由文本
- **默认**："待评估"

### 26. techProgress（技术进度）- 自由文本
- **默认**："已评估工作量"（因为AI会推导effortDays，表示工作量已评估）

### 27. rdNotes（产研备注）- 自由文本
- **规则**：提取备注、说明、进展信息

---

## 五、其他字段

### 28. dependencies（依赖需求）- 字符串数组
- **规则**：提取"依赖XX需求"、"前置需求"等信息
- **格式**：["需求ID1", "需求ID2"]

### 29. isRMS（是否RMS重构项目）- 布尔值
- **规则**：提到"RMS"、"重构"、"refactor" → true

### 30. documents（需求文档）- 数组
- **规则**：如果有附件链接或文档路径，提取
- **默认**：[]

---

# Few-Shot 示例

## 示例1：紧急需求
**输入Excel**：
\`\`\`json
{
  "需求名称": "门店收银系统崩溃修复 @杜玥 紧急",
  "描述": "印度地区所有直营店收银系统无法使用，影响GMV，CEO要求立即修复",
  "工作量": "3人天"
}
\`\`\`

**输出JSON**：
\`\`\`json
{
  "name": "门店收银系统崩溃修复",
  "description": "印度地区所有直营店收银系统无法使用，影响GMV，CEO要求立即修复",
  "submitterName": "杜玥",
  "submitDate": "2025-01-19",
  "submitter": "业务",
  "businessTeam": "",
  "businessDomain": "新零售",
  "customBusinessDomain": "",
  "type": "Bug修复",
  "businessImpactScore": 10,
  "affectedMetrics": [
    {
      "metricKey": "gmv",
      "metricName": "GMV/营收",
      "displayName": "GMV/营收",
      "estimatedImpact": "直接受损",
      "category": "okr",
      "isAISuggested": true
    }
  ],
  "impactScope": {
    "storeTypes": ["新零售-直营店"],
    "regions": ["南亚"],
    "storeCountRange": "全球所有门店",
    "keyRoles": [
      {"category": "regional", "roleName": "店员", "isCustom": false}
    ]
  },
  "timeCriticality": "一月硬窗口",
  "hardDeadline": true,
  "deadlineDate": "2025-01-20",
  "effortDays": 3,
  "complexityScore": 6,
  "productArea": "toC卖货/导购/AI/培训/营销 @杜玥",
  "productManager": "杜玥",
  "developer": "",
  "backendDeveloper": "",
  "frontendDeveloper": "",
  "tester": "",
  "project": "",
  "productProgress": "待评估",
  "techProgress": "已评估工作量",
  "rdNotes": "",
  "dependencies": [],
  "isRMS": false,
  "documents": [],
  "_aiFilledFields": ["businessImpactScore", "affectedMetrics", "impactScope", "timeCriticality", "hardDeadline", "complexityScore", "productArea", "submitter"],
  "_aiConfidenceScores": {
    "businessImpactScore": 0.95,
    "productArea": 0.99
  }
}
\`\`\`

## 示例2：战略级需求
**输入Excel**：
\`\`\`json
{
  "领域": "toB进货 @李建国",
  "需求": "经销商返利自动化系统",
  "详情": "覆盖全球经销商，每月自动计算返利，提升经销商满意度NPS +10分，预计50人天",
  "业务团队": "经销商团队"
}
\`\`\`

**输出JSON**：
\`\`\`json
{
  "name": "经销商返利自动化系统",
  "description": "覆盖全球经销商，每月自动计算返利，提升经销商满意度NPS +10分，预计50人天",
  "submitterName": "李建国",
  "submitDate": "2025-01-19",
  "submitter": "业务",
  "businessTeam": "经销商团队",
  "businessDomain": "渠道零售",
  "customBusinessDomain": "",
  "type": "新功能",
  "businessImpactScore": 7,
  "affectedMetrics": [
    {
      "metricKey": "dealer_satisfaction_nps",
      "metricName": "经销商满意度/NPS",
      "displayName": "经销商满意度/NPS",
      "estimatedImpact": "+10分",
      "category": "okr",
      "isAISuggested": true
    }
  ],
  "impactScope": {
    "storeTypes": ["与门店无关"],
    "regions": ["全球所有市场"],
    "storeCountRange": "全球所有门店",
    "keyRoles": [
      {"category": "hq-channel-retail", "roleName": "经销商/代理商", "isCustom": false}
    ]
  },
  "timeCriticality": "三月窗口",
  "hardDeadline": false,
  "deadlineDate": "",
  "effortDays": 50,
  "complexityScore": 7,
  "productArea": "toB进货/交易/返利 @李建国",
  "productManager": "李建国",
  "developer": "",
  "backendDeveloper": "",
  "frontendDeveloper": "",
  "tester": "",
  "project": "",
  "productProgress": "待评估",
  "techProgress": "已评估工作量",
  "rdNotes": "",
  "dependencies": [],
  "isRMS": false,
  "documents": [],
  "_aiFilledFields": ["businessImpactScore", "affectedMetrics", "impactScope", "timeCriticality", "complexityScore", "productArea", "businessDomain", "submitter"],
  "_aiConfidenceScores": {
    "businessImpactScore": 0.90,
    "productArea": 0.95
  }
}
\`\`\`

---

# 输出要求

1. **必须返回完整的JSON对象**，包含所有30个字段
2. **枚举字段**：必须从可选值中精确选择，不能自创
3. **自由文本字段**：尽量保留Excel原始值
4. **元数据字段**：
   - \`_aiFilledFields\`: 列出所有由AI推导的字段名
   - \`_aiConfidenceScores\`: 关键字段的置信度（0-1）
5. **缺失字段处理**：
   - 字符串：填 ""
   - 数字：填合理默认值
   - 数组：填 []
   - 对象：填空对象或合理默认结构
6. **只返回JSON**，不要有其他解释文字

请开始分析并输出JSON：`;
}
