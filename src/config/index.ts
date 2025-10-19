/**
 * WSJF Sprint Planner - 配置文件索引中心
 *
 * 本文件作为所有配置的统一入口，提供：
 * 1. 配置文件地图 - 快速定位配置位置
 * 2. 集中导出 - 统一导入配置项
 * 3. 默认配置加载 - 自动初始化
 *
 * @version 1.2.1
 */

// ========================================
// 配置文件地图
// ========================================

/**
 * 📁 配置文件目录结构
 *
 * src/config/
 * ├── index.ts                    ⭐ 配置索引中心（本文件）
 * ├── api.ts                      🔑 API密钥配置（OpenAI、DeepSeek）
 * ├── defaults.ts                 🎯 默认值配置（表单初始值等）
 * ├── scoringStandards.ts         📊 10分制业务影响度评分标准
 * ├── complexityStandards.ts      🔧 10分制技术复杂度评分标准
 * ├── metrics.ts                  📈 核心OKR指标和过程指标定义
 * ├── businessFields.ts           🏢 业务字段配置（区域、门店类型等）
 * └── aiPrompts.ts                🤖 AI提示词模板配置
 */

// ========================================
// 1. API 配置
// ========================================

/**
 * API 密钥配置
 *
 * 位置：src/config/api.ts
 *
 * 包含内容：
 * - OPENAI_API_KEY: OpenAI GPT API密钥
 * - DEEPSEEK_API_KEY: DeepSeek API密钥
 *
 * 使用场景：
 * - AI批量评估功能
 * - AI文档分析功能
 * - AI字段映射功能
 *
 * 配置方式：
 * 在 src/config/api.ts 中修改对应常量值
 */
export { OPENAI_API_KEY, DEEPSEEK_API_KEY } from './api';

// ========================================
// 2. 默认值配置
// ========================================

/**
 * 默认值配置
 *
 * 位置：src/config/defaults.ts
 *
 * 包含内容：
 * - DEFAULT_SCORING_STANDARDS: 默认评分标准（10分制）
 * - DEFAULT_METRIC_DEFINITIONS: 默认指标定义
 *
 * 使用场景：
 * - 系统初始化时的默认数据
 * - 配置重置时的参考值
 *
 * 注意：实际使用的配置在 scoringStandards.ts 和 metrics.ts 中定义
 */
export {
  DEFAULT_SCORING_STANDARDS,
  DEFAULT_METRIC_DEFINITIONS
} from './defaults';

// ========================================
// 3. 评分标准配置
// ========================================

/**
 * 业务影响度评分标准（10分制）
 *
 * 位置：src/config/scoringStandards.ts
 *
 * 包含内容：
 * - SCORING_STANDARDS: 10个评分档位的完整标准
 *   - 10分: 致命缺陷（系统崩溃级）
 *   - 9分: 严重阻塞（核心流程中断）
 *   - 8分: 战略必需（关键KPI受影响）
 *   - ...
 *   - 1分: 微小改进（锦上添花）
 *
 * 使用场景：
 * - 需求评分时的参考标准
 * - 评分说明书展示
 * - 业务影响度选择器
 */
export { SCORING_STANDARDS } from './scoringStandards';

/**
 * 技术复杂度评分标准（10分制）
 *
 * 位置：src/config/complexityStandards.ts
 *
 * 包含内容：
 * - COMPLEXITY_STANDARDS: 10个复杂度档位的完整标准
 *   - 10分: 全新技术平台（技术栈重建）
 *   - 9分: 核心架构重构（系统级改造）
 *   - 8分: 系统级改造（多模块联动）
 *   - ...
 *   - 1分: 简单修改（配置调整）
 *
 * 使用场景：
 * - 技术复杂度评估
 * - 复杂度说明书展示
 * - 开发工作量估算参考
 */
export { COMPLEXITY_STANDARDS } from './complexityStandards';

// ========================================
// 4. 指标配置
// ========================================

/**
 * 核心OKR指标和过程指标定义
 *
 * 位置：src/config/metrics.ts
 *
 * 包含内容：
 * - OKR_METRICS: 核心OKR指标（GMV、门店数、NPS等）
 * - PROCESS_METRICS: 过程指标（转化率、响应时间等）
 *
 * 每个指标包含：
 * - key: 指标唯一标识
 * - name: 指标名称
 * - description: 指标说明
 * - category: 指标分类
 * - unit: 计量单位
 *
 * 使用场景：
 * - 需求影响指标选择
 * - 指标影响度评估
 * - 需求优先级计算
 */
export { OKR_METRICS, PROCESS_METRICS } from './metrics';

// ========================================
// 5. 业务字段配置
// ========================================

/**
 * 业务字段配置
 *
 * 位置：src/config/businessFields.ts
 *
 * 包含内容：
 * - BUSINESS_DOMAINS: 业务域列表（开店、经销商、门店运营等）
 * - REGIONS: 区域列表（国内、海外、全球）
 * - STORE_TYPES: 门店类型（小米之家、授权店等）
 * - ROLE_CONFIGS: 角色配置（店员、店长等）
 * - STORE_COUNT_RANGES: 门店数量范围
 * - TIME_CRITICALITY_DESCRIPTIONS: 时间窗口描述
 *
 * 使用场景：
 * - 需求表单的下拉选项
 * - 业务信息筛选
 * - 影响范围评估
 */
export {
  BUSINESS_DOMAINS,
  REGIONS,
  getStoreTypesByDomain,
  getRoleConfigsByDomain,
  STORE_COUNT_RANGES,
  TIME_CRITICALITY_DESCRIPTIONS
} from './businessFields';

// ========================================
// 6. AI 提示词配置
// ========================================

/**
 * AI 提示词模板配置
 *
 * 位置：src/config/aiPrompts.ts
 *
 * 包含内容：
 * - AI_SYSTEM_MESSAGE: AI系统角色描述
 * - formatAIPrompt: AI提示词格式化函数
 * - formatBatchAIPrompt: 批量评估提示词格式化
 *
 * 使用场景：
 * - AI文档分析功能
 * - AI批量评估功能
 * - AI字段映射功能
 *
 * 优化建议：
 * 根据实际效果调整提示词模板，提升AI分析准确度
 */
export { AI_SYSTEM_MESSAGE, formatAIPrompt } from './aiPrompts';

// ========================================
// 统一配置对象（可选）
// ========================================

/**
 * 统一配置对象
 *
 * 如果需要一次性导入所有配置，可以使用：
 * import { CONFIG } from '@/config';
 *
 * 然后通过：
 * - CONFIG.api.openai
 * - CONFIG.standards.scoring
 * - CONFIG.metrics.okr
 * 等方式访问
 */
import { OPENAI_API_KEY as _OPENAI_KEY, DEEPSEEK_API_KEY as _DEEPSEEK_KEY } from './api';
import { SCORING_STANDARDS as _SCORING_STANDARDS } from './scoringStandards';
import { COMPLEXITY_STANDARDS as _COMPLEXITY_STANDARDS } from './complexityStandards';
import { OKR_METRICS as _OKR_METRICS, PROCESS_METRICS as _PROCESS_METRICS } from './metrics';
import {
  DEFAULT_SCORING_STANDARDS as _DEFAULT_SCORING_STANDARDS,
  DEFAULT_METRIC_DEFINITIONS as _DEFAULT_METRIC_DEFINITIONS
} from './defaults';
import {
  BUSINESS_DOMAINS as _BUSINESS_DOMAINS,
  REGIONS as _REGIONS,
  STORE_COUNT_RANGES as _STORE_COUNT_RANGES,
  TIME_CRITICALITY_DESCRIPTIONS as _TIME_CRITICALITY_DESCRIPTIONS
} from './businessFields';

export const CONFIG = {
  // API配置
  api: {
    openai: _OPENAI_KEY,
    deepseek: _DEEPSEEK_KEY,
  },

  // 评分标准
  standards: {
    scoring: _SCORING_STANDARDS,
    complexity: _COMPLEXITY_STANDARDS,
  },

  // 指标定义
  metrics: {
    okr: _OKR_METRICS,
    process: _PROCESS_METRICS,
  },

  // 默认值
  defaults: {
    scoringStandards: _DEFAULT_SCORING_STANDARDS,
    metricDefinitions: _DEFAULT_METRIC_DEFINITIONS,
  },

  // 业务字段
  business: {
    domains: _BUSINESS_DOMAINS,
    regions: _REGIONS,
    storeCountRanges: _STORE_COUNT_RANGES,
    timeCriticalityDescriptions: _TIME_CRITICALITY_DESCRIPTIONS,
  },
} as const;

// ========================================
// 快速使用指南
// ========================================

/**
 * 📖 快速使用指南
 *
 * 1. 导入单个配置项：
 *    import { SCORING_STANDARDS, OKR_METRICS } from '@/config';
 *
 * 2. 导入统一配置对象：
 *    import { CONFIG } from '@/config';
 *    const openaiKey = CONFIG.api.openai;
 *
 * 3. 导入特定配置文件：
 *    import { SCORING_STANDARDS } from '@/config/scoringStandards';
 *
 * 4. 修改配置：
 *    - 找到对应的配置文件（见上方文件地图）
 *    - 修改导出的常量值
 *    - 配置会自动通过本文件重新导出
 *
 * 5. 新增配置：
 *    - 创建新的配置文件（如 newConfig.ts）
 *    - 在本文件中添加导出
 *    - 更新文件地图和说明
 */

/**
 * ⚠️ 配置修改注意事项
 *
 * 1. API密钥（api.ts）：
 *    - 不要提交真实密钥到Git
 *    - 生产环境使用环境变量
 *
 * 2. 评分标准（scoringStandards.ts, complexityStandards.ts）：
 *    - 修改后需同步更新说明书组件
 *    - 影响历史需求的分数计算
 *
 * 3. 指标定义（metrics.ts）：
 *    - 修改key会导致历史数据无法匹配
 *    - 建议只添加新指标，不删除旧指标
 *
 * 4. 默认值（defaults.ts）：
 *    - 只影响新创建的需求/迭代池
 *    - 不影响已存在的数据
 *
 * 5. 业务字段（businessFields.ts）：
 *    - 影响表单下拉选项
 *    - 删除选项前确认无历史数据使用
 */
