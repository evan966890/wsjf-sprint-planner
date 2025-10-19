# WSJF Sprint Planner - 配置文件使用指南

本目录包含所有项目配置文件，统一通过 `index.ts` 导出。

---

## 📁 配置文件地图

```
src/config/
├── index.ts                    ⭐ 配置索引中心（统一入口）
├── README.md                   📖 本使用指南
├── api.ts                      🔑 API密钥配置
├── defaults.ts                 🎯 默认值配置
├── scoringStandards.ts         📊 业务影响度评分标准（10分制）
├── complexityStandards.ts      🔧 技术复杂度评分标准（10分制）
├── metrics.ts                  📈 核心OKR指标和过程指标
├── businessFields.ts           🏢 业务字段配置
└── aiPrompts.ts                🤖 AI提示词模板
```

---

## 🚀 快速开始

### 方式1：通过索引文件导入（推荐）

```typescript
// 导入单个配置项
import { SCORING_STANDARDS, OKR_METRICS, OPENAI_API_KEY } from '@/config';

// 使用
console.log(SCORING_STANDARDS[0].name); // "致命缺陷"
console.log(OKR_METRICS[0].name);       // "GMV"
```

### 方式2：导入统一配置对象

```typescript
import { CONFIG } from '@/config';

// 通过命名空间访问
const apiKey = CONFIG.api.openai;
const standards = CONFIG.standards.scoring;
const metrics = CONFIG.metrics.okr;
```

### 方式3：直接从配置文件导入

```typescript
import { SCORING_STANDARDS } from '@/config/scoringStandards';
import { OKR_METRICS } from '@/config/metrics';
```

---

## 📄 配置文件详解

### 1. **api.ts** - API密钥配置

**用途**: 配置AI功能所需的API密钥

**包含内容**:
- `OPENAI_API_KEY`: OpenAI GPT API密钥
- `DEEPSEEK_API_KEY`: DeepSeek API密钥

**使用场景**:
- AI批量评估功能
- AI文档分析功能
- AI字段映射功能

**配置方式**:
```typescript
// src/config/api.ts
export const OPENAI_API_KEY = '你的OpenAI密钥';
export const DEEPSEEK_API_KEY = '你的DeepSeek密钥';
```

**⚠️ 安全注意事项**:
- ❌ 不要提交真实密钥到Git仓库
- ✅ 生产环境使用环境变量或密钥管理服务

---

### 2. **defaults.ts** - 默认值配置

**用途**: 定义表单和数据的默认值

**包含内容**:
- `DEFAULT_REQUIREMENT`: 新增需求的默认值
- `DEFAULT_SPRINT_POOL`: 新增迭代池的默认值
- `DEFAULT_EFFORT_DAYS`: 默认工作量（天）
- `DEFAULT_HARD_DEADLINE`: 默认是否有强制DDL
- `DEFAULT_TIME_CRITICALITY`: 默认时间窗口

**使用场景**:
- 创建新需求时的初始值
- 创建新迭代池时的初始值
- 表单字段的默认值

**示例**:
```typescript
import { DEFAULT_REQUIREMENT } from '@/config';

const newRequirement = {
  ...DEFAULT_REQUIREMENT,
  name: '用户输入的需求名称',
};
```

---

### 3. **scoringStandards.ts** - 业务影响度评分标准

**用途**: 10分制业务影响度评分标准

**数据结构**:
```typescript
interface ScoringStandard {
  score: 1-10;                      // 分值
  name: string;                     // 标准名称
  shortDescription: string;         // 一句话总结
  businessConsequence: string[];    // 业务后果列表
  impactScope: string[];            // 影响范围列表
  typicalCases: string[];           // 典型案例
  affectedOKRs: string[];           // 影响的核心OKR
}
```

**评分档位**:
| 分数 | 名称 | 说明 |
|------|------|------|
| 10分 | 致命缺陷 | 系统崩溃级，不解决直接导致业务中断 |
| 9分 | 严重阻塞 | 核心流程中断，大量用户无法完成关键操作 |
| 8分 | 战略必需 | 关键KPI受影响，业务目标达成受阻 |
| 7分 | 显著影响 | 重要功能缺失，用户体验明显下降 |
| 6分 | 重要改进 | 提升核心流程效率 |
| 5分 | 有价值优化 | 改善用户体验 |
| 4分 | 常规需求 | 补充功能完善性 |
| 3分 | 小幅优化 | 局部体验改进 |
| 2分 | 边缘场景 | 极少数用户受益 |
| 1分 | 微小改进 | 锦上添花 |

**修改注意事项**:
- ⚠️ 修改评分标准会影响所有需求的分数计算
- ⚠️ 修改后需同步更新说明书组件
- ✅ 建议仅调整描述文案，不改变分数语义

---

### 4. **complexityStandards.ts** - 技术复杂度评分标准

**用途**: 10分制技术复杂度评分标准

**数据结构**:
```typescript
interface ComplexityStandard {
  score: 1-10;                      // 分值
  name: string;                     // 标准名称
  shortDescription: string;         // 一句话总结
  technicalChallenge: string[];     // 技术挑战
  architectureImpact: string[];     // 架构影响
  technicalRisk: string[];          // 技术风险
  typicalCases: string[];           // 典型案例
}
```

**复杂度档位**:
| 分数 | 名称 | 工作量估算 |
|------|------|------------|
| 10分 | 全新技术平台 | 6-12个月 |
| 9分 | 核心架构重构 | 3-6个月 |
| 8分 | 系统级改造 | 2-3个月 |
| 7分 | 跨模块开发 | 1-2个月 |
| 6分 | 单模块重构 | 2-4周 |
| 5分 | 复杂功能 | 1-2周 |
| 4分 | 标准功能 | 5-10天 |
| 3分 | 简单功能 | 2-5天 |
| 2分 | 小改动 | 1-2天 |
| 1分 | 简单修改 | 0.5-1天 |

---

### 5. **metrics.ts** - 指标定义

**用途**: 定义核心OKR指标和过程指标

**包含内容**:
- `OKR_METRICS`: 核心OKR指标（GMV、门店数、NPS等）
- `PROCESS_METRICS`: 过程指标（转化率、响应时间等）

**数据结构**:
```typescript
interface MetricDefinition {
  key: string;          // 指标唯一标识
  name: string;         // 指标名称
  description: string;  // 指标说明
  category: string;     // 指标分类
  unit?: string;        // 计量单位
}
```

**使用场景**:
- 需求影响指标选择
- 指标影响度评估
- 需求优先级计算

**修改注意事项**:
- ⚠️ 修改 `key` 会导致历史数据无法匹配
- ✅ 建议只添加新指标，不删除旧指标
- ✅ 删除前确认无历史需求使用

---

### 6. **businessFields.ts** - 业务字段配置

**用途**: 定义业务相关的下拉选项和配置

**包含内容**:
- `BUSINESS_DOMAINS`: 业务域列表
- `REGIONS`: 区域列表
- `STORE_TYPES`: 门店类型
- `ROLE_CONFIGS`: 角色配置
- `STORE_COUNT_RANGES`: 门店数量范围
- `TIME_CRITICALITY_DESCRIPTIONS`: 时间窗口描述

**使用场景**:
- 需求表单的下拉选项
- 业务信息筛选
- 影响范围评估

**示例**:
```typescript
import { BUSINESS_DOMAINS, getStoreTypesByDomain } from '@/config';

// 获取所有业务域
console.log(BUSINESS_DOMAINS); // ['开店', '经销商', '门店运营', ...]

// 根据业务域获取门店类型
const storeTypes = getStoreTypesByDomain('开店');
console.log(storeTypes); // ['小米之家', '授权店', '体验店']
```

---

### 7. **aiPrompts.ts** - AI提示词配置

**用途**: 配置AI功能的提示词模板

**包含内容**:
- `AI_SYSTEM_MESSAGE`: AI系统角色描述
- `formatAIPrompt()`: AI提示词格式化函数
- `formatBatchAIPrompt()`: 批量评估提示词格式化

**使用场景**:
- AI文档分析功能
- AI批量评估功能
- AI字段映射功能

**优化建议**:
- 根据实际效果调整提示词模板
- 提升AI分析的准确度和专业性
- 添加更多上下文信息

---

## 🔧 配置修改流程

### 步骤1：定位配置文件

参考上方**配置文件地图**，找到需要修改的配置文件。

### 步骤2：修改配置

打开对应文件，修改导出的常量值。

```typescript
// 示例：修改默认工作量
// src/config/defaults.ts

export const DEFAULT_EFFORT_DAYS = 10; // 改为10天
```

### 步骤3：验证修改

```bash
# 运行TypeScript检查
npx tsc --noEmit

# 运行构建测试
npm run build
```

### 步骤4：测试功能

启动开发服务器，测试修改是否生效。

```bash
npm run dev
```

---

## 📊 配置影响范围

| 配置文件 | 影响范围 | 是否影响历史数据 |
|---------|---------|----------------|
| **api.ts** | AI功能 | ❌ 否 |
| **defaults.ts** | 新建表单 | ❌ 否（仅影响新数据） |
| **scoringStandards.ts** | 评分计算、说明书 | ⚠️ 是（重新计算分数） |
| **complexityStandards.ts** | 复杂度评估 | ⚠️ 是（影响复杂度显示） |
| **metrics.ts** | 指标选择 | ⚠️ 是（key变更会导致匹配失败） |
| **businessFields.ts** | 下拉选项 | ⚠️ 是（删除选项影响历史数据） |
| **aiPrompts.ts** | AI分析质量 | ❌ 否 |

---

## ⚠️ 重要注意事项

### 1. API密钥安全

```typescript
// ❌ 错误：提交真实密钥到Git
export const OPENAI_API_KEY = 'sk-proj-abc123...';

// ✅ 正确：使用空字符串或占位符
export const OPENAI_API_KEY = ''; // 请在此填入您的密钥

// ✅ 生产环境：使用环境变量
export const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
```

### 2. 评分标准修改

修改 `scoringStandards.ts` 或 `complexityStandards.ts` 后：

- ✅ 同步更新说明书组件的示例
- ✅ 验证已有需求的分数是否合理
- ✅ 通知团队评分规则变更

### 3. 指标修改

修改 `metrics.ts` 时：

```typescript
// ❌ 不要修改已有指标的key
{
  key: 'gmv',           // 修改此key会导致历史数据无法匹配
  name: 'GMV',
  ...
}

// ✅ 添加新指标
export const NEW_METRIC: MetricDefinition = {
  key: 'new_metric_key',
  name: '新指标名称',
  description: '新指标说明',
  category: 'okr',
};

// 添加到数组
export const OKR_METRICS = [
  ...原有指标,
  NEW_METRIC,
];
```

### 4. 业务字段修改

删除 `BUSINESS_DOMAINS` 或其他选项前：

```bash
# 检查是否有历史需求使用此选项
grep -r "要删除的选项" src/
```

---

## 📚 常见问题

### Q1: 如何添加新的业务域？

```typescript
// src/config/businessFields.ts

export const BUSINESS_DOMAINS = [
  '开店',
  '经销商',
  '新的业务域', // 添加在此
];
```

### Q2: 如何修改默认工作量？

```typescript
// src/config/defaults.ts

export const DEFAULT_EFFORT_DAYS = 15; // 改为15天
```

### Q3: 如何优化AI提示词？

```typescript
// src/config/aiPrompts.ts

export const AI_SYSTEM_MESSAGE = `
你是专业的需求评估专家，擅长...
（在此调整AI角色描述）
`;
```

### Q4: 配置修改后需要重新部署吗？

| 修改类型 | 是否需要重新部署 |
|---------|----------------|
| 修改配置值 | ✅ 是 |
| 修改注释/文档 | ❌ 否（但建议同步） |
| 添加新配置 | ✅ 是 |

---

## 🎯 最佳实践

1. **集中管理**: 所有配置通过 `index.ts` 统一导出
2. **类型安全**: 使用 TypeScript 类型定义
3. **文档同步**: 修改配置后更新本README
4. **版本控制**: 重大配置变更记录在CHANGELOG中
5. **环境分离**: 生产环境使用环境变量管理密钥

---

## 📞 技术支持

如有配置相关问题，请：
1. 查看本README
2. 查看 `index.ts` 中的详细注释
3. 提交 GitHub Issue

---

**最后更新**: 2025-01-19
**维护者**: 开发团队
**版本**: v1.2.1
