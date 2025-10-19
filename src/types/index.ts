/**
 * WSJF Sprint Planner - 类型定义
 *
 * 包含应用中所有的TypeScript接口和类型定义
 */

/**
 * AI模型类型
 * 用于AI字段映射功能的模型选择
 */
export type AIModelType = 'openai' | 'deepseek';

/**
 * 业务影响度评分（1-10分制）
 * v1.2.0新增：替代原有的4档BV评分
 */
export type BusinessImpactScore = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/**
 * 技术复杂度评分（1-10分制）
 * v1.3.0新增：评估技术实现的复杂程度
 */
export type ComplexityScore = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/**
 * 评分标准接口
 * 定义10分制评分标准的完整信息
 */
export interface ScoringStandard {
  score: BusinessImpactScore;      // 分值（1-10）
  name: string;                    // 标准名称：致命缺陷/严重阻塞/战略必需/显著影响/...
  shortDescription: string;        // 一句话总结（用于下拉选择器）
  businessConsequence: string[];   // 业务后果列表（维度A）
  impactScope: string[];           // 影响范围列表（维度B）
  typicalCases: string[];          // 典型场景案例（可配置）
  affectedOKRs: string[];          // 通常影响的核心OKR指标
}

/**
 * 技术复杂度标准接口
 * 定义10分制技术复杂度评分标准的完整信息
 */
export interface ComplexityStandard {
  score: ComplexityScore;          // 分值（1-10）
  name: string;                    // 标准名称：全新技术平台/核心架构重构/系统级改造/...
  shortDescription: string;        // 一句话总结（用于下拉选择器）
  technicalChallenge: string[];    // 技术挑战列表
  architectureImpact: string[];    // 架构影响列表
  technicalRisk: string[];         // 技术风险列表
  typicalCases: string[];          // 典型案例
  testingRequirement: string[];    // 测试要求列表
  estimatedEffort: string;         // 参考工作量（如 "5-10人天"）
}

/**
 * 指标定义接口
 * 定义核心OKR指标和过程指标的元数据
 */
export interface MetricDefinition {
  key: string;                     // 指标唯一键（用于后端归类，如 dealer_satisfaction_nps）
  defaultName: string;             // 系统默认名称（如 "经销商满意度/NPS"）
  category: string;                // 指标分类（如 "收入相关"、"规模相关"、"运营效率类"）
  type: 'okr' | 'process';         // 指标类型：核心OKR指标 或 过程指标
  description?: string;            // 指标说明（可选）
}

/**
 * 影响的指标接口
 * 记录需求影响的具体指标及预估影响
 */
export interface AffectedMetric {
  metricKey: string;               // 指标键（对应 MetricDefinition.key）
  metricName: string;              // 系统默认名称
  customName?: string;             // 用户自定义名称（团队习惯叫法）
  displayName: string;             // 最终显示名称（优先使用 customName，否则使用 metricName）
  estimatedImpact: string;         // 预估影响（如 "+5%"、"明显提升"、"从2天→实时"）
  category: 'okr' | 'process';     // 指标分类
  isAISuggested?: boolean;         // 是否为AI建议（可选）
}

/**
 * 关键角色接口
 * 定义涉及的业务角色
 */
export interface KeyRole {
  category: 'regional' | 'hq-common' | 'hq-new-retail' | 'hq-channel-retail';  // 角色分类
  roleName: string;                // 角色名称
  isCustom: boolean;               // 是否为自定义角色
}

/**
 * 影响范围接口
 * 定义需求的影响范围（门店类型、区域、门店数量、涉及角色）
 */
export interface ImpactScope {
  storeTypes: string[];            // 影响的门店类型（如 ["新零售-直营店", "新零售-授权店"]）
  regions: string[];               // 影响的区域（如 ["南亚", "东南亚"]）
  storeCountRange?: string;        // 影响的门店数量范围（如 "50-200家"）
  keyRoles: KeyRole[];             // 涉及的关键角色
}

/**
 * 文档接口
 * 描述上传的需求文档
 */
export interface Document {
  id: string;                      // 文档唯一标识符
  fileName: string;                // 文件名
  fileType: string;                // 文件类型：word | pdf | excel | image
  fileSize: number;                // 文件大小（字节）
  uploadedAt: string;              // 上传时间
  url?: string;                    // 文件URL（可选）
  extractedContent?: string;       // AI提取的文本内容（可选，用于AI分析）
}

/**
 * 需求条目接口
 * 描述单个需求的完整信息，包括基本信息、评分维度和计算结果
 */
export interface Requirement {
  // === 基本信息 ===
  id: string;                    // 需求唯一标识符
  name: string;                  // 需求名称
  submitterName: string;         // 需求提交人姓名
  submitDate: string;            // 需求提交日期
  submitter: string;             // 需求提交方：产品/研发/业务
  businessTeam?: string;         // v1.2.0新增：业务团队（如 "开店团队"、"供应链团队"）

  // === 需求描述（v1.2.0新增）===
  description?: string;          // 详细需求描述（长文本，用于AI分析）
  documents?: Document[];        // 上传的需求文档列表

  // === 业务影响度评分（v1.2.0升级）===
  businessImpactScore?: BusinessImpactScore;  // 新：1-10分制评分（v1.2.0）
  affectedMetrics?: AffectedMetric[];         // 新：影响的指标（核心OKR + 过程指标）
  impactScope?: ImpactScope;                  // 新：影响范围（门店类型、区域、角色等）

  // === 时间维度 ===
  timeCriticality?: '随时' | '三月窗口' | '一月硬窗口';  // v1.2.0：标准化类型
  hardDeadline: boolean;         // 是否存在强制截止日期
  deadlineDate?: string;         // 截止日期（可选，hardDeadline为true时应填写）

  // === 业务域 ===
  businessDomain: string;        // 业务域：新零售/渠道零售/国际零售通用/自定义
  customBusinessDomain?: string; // 自定义业务域名称（当businessDomain为"自定义"时填写）

  // === 技术信息（产品/研发后续填写）===
  effortDays: number;            // 预估工作量（人天）
  complexityScore?: ComplexityScore;  // v1.3.0新增：技术复杂度评分（1-10分制）
  type: string;                  // 需求类型
  productManager: string;        // 产品经理
  developer: string;             // 研发负责人
  productProgress: string;       // 产品进度状态
  techProgress: string;          // 技术进度状态
  dependencies?: string[];       // 依赖的其他需求ID列表（可选）
  isRMS: boolean;                // 是否为RMS重构项目

  // === 旧字段（保留用于数据迁移和向后兼容）===
  bv?: string;                   // 旧：Business Value 业务价值（局部/明显/撬动核心/战略平台）
  tc?: string;                   // 旧：Time Criticality 时间临界性（随时/三月窗口/一月硬窗口）

  // === 计算结果（由系统自动计算）===
  rawScore?: number;             // 原始分数（3-28范围，由WSJF算法计算）
  displayScore?: number;         // 展示分数（1-100范围，归一化后的热度分）
  stars?: number;                // 星级评定（2-5星，基于displayScore分档）
}

/**
 * 迭代池接口
 * 描述一个迭代周期的时间范围、资源预留和已排期需求
 */
export interface SprintPool {
  id: string;                    // 迭代池唯一标识符
  name: string;                  // 迭代池名称（如"迭代1"）
  startDate: string;             // 开始日期（YYYY-MM-DD格式）
  endDate: string;               // 结束日期（YYYY-MM-DD格式）
  totalDays: number;             // 迭代总可用人天数
  bugReserve: number;            // Bug修复预留人天（百分比，0-100）
  refactorReserve: number;       // 重构预留人天（百分比，0-100）
  otherReserve: number;          // 其他预留人天（百分比，0-100）
  requirements: Requirement[];   // 已排期的需求列表
}

/**
 * 用户接口
 * 描述登录用户的基本信息
 */
export interface User {
  name: string;                  // 用户姓名
  email: string;                 // 用户邮箱
}

/**
 * AI分析结果接口
 * v1.2.1新增：AI智能分析功能的返回结果
 */
export interface AIAnalysisResult {
  // 建议的业务影响度评分
  suggestedScore: BusinessImpactScore;

  // AI分析理由
  reasoning: string[];

  // 建议的核心OKR指标
  suggestedOKRMetrics: AffectedMetric[];

  // 建议的过程指标
  suggestedProcessMetrics: AffectedMetric[];

  // 用户当前的评分（用于对比）
  currentScore?: BusinessImpactScore;

  // 分析的置信度（0-1）
  confidence?: number;
}
