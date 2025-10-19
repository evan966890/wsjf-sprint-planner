/**
 * WSJF Sprint Planner - 评分规则常量
 *
 * 本文件定义所有评分规则和标准说明
 * 说明书中的评分标准必须从此文件获取
 *
 * 规则：
 * - 修改评分标准后，说明书自动同步
 * - 新增评分维度时，需更新类型定义
 * - 确保规则描述与实际计算逻辑一致
 *
 * @version 1.0.0
 * @date 2025-01-19
 */

// ============================================
// 当前使用的业务价值标准（4档简化版，与 scoring.ts 一致）
// ============================================

export const BUSINESS_VALUE_LEVELS = {
  '局部': {
    score: 3,
    name: '局部体验优化',
    description: '影响范围较小，锦上添花的功能',
    color: { from: '#DBEAFE', to: '#BFDBFE' }, // 浅蓝色
    textColor: 'text-gray-800',
    examples: ['UI微调', '小功能优化', '局部体验提升'],
  },
  '明显': {
    score: 6,
    name: '明显改善',
    description: '能够看到指标改善或明确的节省时间/成本',
    color: { from: '#60A5FA', to: '#3B82F6' }, // 中蓝色
    textColor: 'text-white',
    examples: ['流程优化', '效率提升', '过程指标改善'],
  },
  '撬动核心': {
    score: 8,
    name: '撬动核心指标',
    description: '直接作用于北极星指标或关键KPI',
    color: { from: '#2563EB', to: '#1D4ED8' }, // 深蓝色
    textColor: 'text-white',
    examples: ['转化率提升', 'GMV增长', 'NPS提升'],
  },
  '战略平台': {
    score: 10,
    name: '战略/平台级',
    description: '形成可复用平台能力、显著降低合规/技术风险，或打开新业务线',
    color: { from: '#1E40AF', to: '#1E3A8A' }, // 极深蓝色
    textColor: 'text-white',
    examples: ['平台能力搭建', '新业务线', '战略级项目'],
  },
} as const;

// ============================================
// 业务影响度评分标准（1-10分制，为未来升级预留）
// ============================================

export const BUSINESS_IMPACT_LEVELS = {
  10: {
    name: '致命缺陷',
    shortDescription: '系统崩溃、核心功能失效',
    description: '不解决直接导致系统崩溃或核心业务无法运转',
    businessConsequence: [
      '影响所有用户的核心功能（如支付、下单、登录完全失败）',
      '造成严重的业务损失或法律风险',
    ],
    impactScope: '100%用户受影响',
    typicalCases: ['支付系统宕机', '数据安全漏洞', '核心服务器瘫痪'],
  },
  9: {
    name: '严重阻塞',
    shortDescription: '关键业务流程阻塞',
    description: '阻塞关键业务流程，大面积影响用户',
    businessConsequence: [
      '严重影响1-2个核心OKR指标（如GMV、NPS、门店数）',
      '不解决会导致重大客户流失或收入损失',
    ],
    impactScope: '多个部门/大量用户受影响',
    typicalCases: ['订单无法同步', '库存系统失效', '关键报表无数据'],
  },
  8: {
    name: '战略必需',
    shortDescription: 'CEO级项目、战略转型',
    description: '公司战略级项目，影响多个核心指标',
    businessConsequence: [
      'CEO/高层明确要求的关键项目',
      '行业竞争必须具备的能力',
    ],
    impactScope: '公司战略层面',
    typicalCases: ['新业务模式搭建', '核心竞争力构建', '重大合规要求'],
  },
  7: {
    name: '显著影响',
    shortDescription: '影响多个核心指标',
    description: '明显影响2-3个核心OKR指标',
    businessConsequence: [
      '大范围改善用户体验或运营效率',
      '覆盖50%以上用户或门店的重要功能',
    ],
    impactScope: '50%+用户/门店',
    typicalCases: ['关键流程优化', '核心功能升级', '重要数据分析能力'],
  },
  6: {
    name: '战略加速',
    shortDescription: '加速业务增长',
    description: '对1个核心OKR指标有显著提升',
    businessConsequence: [
      '加速业务增长的重要项目',
      '覆盖20-50%用户的核心功能改进',
    ],
    impactScope: '20-50%用户/门店',
    typicalCases: ['转化率优化', '关键功能补齐', '重要渠道拓展'],
  },
  5: {
    name: '重要优化',
    shortDescription: '改善过程指标',
    description: '改善1-2个过程指标',
    businessConsequence: [
      '提升部分用户体验或运营效率',
      '覆盖10-20%用户的功能优化',
    ],
    impactScope: '10-20%用户/门店',
    typicalCases: ['页面性能优化', '局部流程改进', '数据看板增强'],
  },
  4: {
    name: '有价值优化',
    shortDescription: '小幅体验提升',
    description: '小幅改善用户体验或运营效率',
    businessConsequence: [
      '覆盖5-10%用户的功能增强',
      '减少部分运营成本或时间',
    ],
    impactScope: '5-10%用户/门店',
    typicalCases: ['辅助功能增强', '小流程优化', '报表补充'],
  },
  3: {
    name: '常规功能',
    shortDescription: '常规需求',
    description: '常规功能开发，影响范围有限',
    businessConsequence: [
      '覆盖<5%用户的功能',
      '小幅提升某个指标',
    ],
    impactScope: '<5%用户/门店',
    typicalCases: ['新增辅助工具', '小范围试点功能'],
  },
  2: {
    name: '小幅改进',
    shortDescription: '锦上添花',
    description: '锦上添花的功能',
    businessConsequence: [
      '仅影响少数用户',
      '微小的体验改善',
    ],
    impactScope: '极少数用户',
    typicalCases: ['UI调整', '文案优化', '小工具'],
  },
  1: {
    name: 'Nice-to-have',
    shortDescription: '可有可无',
    description: '可有可无的功能',
    businessConsequence: [
      '几乎没有业务影响',
      '纯粹的技术优化或试验性功能',
    ],
    impactScope: '无明显影响',
    typicalCases: ['代码重构', '技术探索', '内部工具优化'],
  },
} as const;

// ============================================
// 技术复杂度评分标准（1-10分制）
// ============================================

export const COMPLEXITY_LEVELS = {
  10: {
    name: '全新技术平台',
    shortDescription: '全新技术栈、架构重建',
    technicalChallenge: '全新技术栈引入或完整架构重建',
    description: '需要重新搭建技术平台，技术风险极高',
    typicalCases: ['从头搭建新系统', '完全替换技术栈', '核心架构重写'],
  },
  9: {
    name: '核心架构重构',
    shortDescription: '核心系统重构',
    technicalChallenge: '核心架构层面的大规模重构',
    description: '涉及核心系统的深度改造，技术难度很大',
    typicalCases: ['数据库架构迁移', '微服务拆分', '核心模块重构'],
  },
  8: {
    name: '系统级改造',
    shortDescription: '多系统集成、底层改造',
    technicalChallenge: '多个系统深度集成或底层框架改造',
    description: '需要协调多个系统，技术复杂度高',
    typicalCases: ['多系统打通', '底层框架升级', '性能瓶颈攻克'],
  },
  7: {
    name: '复杂功能开发',
    shortDescription: '复杂算法、高并发',
    technicalChallenge: '复杂业务逻辑或高性能要求',
    description: '涉及复杂算法或高并发场景',
    typicalCases: ['复杂调度算法', '实时计算引擎', '高并发优化'],
  },
  6: {
    name: '跨系统集成',
    shortDescription: '多系统对接',
    technicalChallenge: '需要对接2-3个外部系统',
    description: '跨系统数据交互和同步',
    typicalCases: ['ERP对接', '第三方平台集成', '数据同步'],
  },
  5: {
    name: '标准功能开发',
    shortDescription: '常规CRUD+业务逻辑',
    technicalChallenge: '标准的CRUD操作加业务逻辑',
    description: '常规的功能开发，技术难度适中',
    typicalCases: ['标准表单页面', '列表查询', '常规业务流程'],
  },
  4: {
    name: '简单集成',
    shortDescription: '第三方SDK集成',
    technicalChallenge: '集成成熟的第三方服务',
    description: '使用成熟SDK或组件库',
    typicalCases: ['支付SDK接入', '地图服务集成', '统计组件'],
  },
  3: {
    name: '页面开发',
    shortDescription: '纯前端页面',
    technicalChallenge: '纯展示型页面，无复杂逻辑',
    description: '简单的前端页面开发',
    typicalCases: ['静态展示页', '简单表单', '数据展示'],
  },
  2: {
    name: '配置调整',
    shortDescription: '参数配置',
    technicalChallenge: '修改配置参数或规则',
    description: '无需编码或仅需简单配置',
    typicalCases: ['参数调整', '权限配置', '开关控制'],
  },
  1: {
    name: '简单修改',
    shortDescription: '文案、样式调整',
    technicalChallenge: '文案或样式调整',
    description: '极简单的修改，几乎无技术难度',
    typicalCases: ['文案修改', 'CSS调整', '颜色更改'],
  },
} as const;

// ============================================
// 时间窗口映射
// ============================================

export const TIME_CRITICALITY_MAP = {
  '随时': 0,
  '三月窗口': 3,
  '一月硬窗口': 5,
} as const;

// ============================================
// 工作量奖励分数（8档细分，与 scoring.ts 一致）
// ============================================

export const EFFORT_BONUS_RULES = {
  description: '优先小任务，鼓励快速交付',
  rules: [
    { range: '≤2天', bonus: 8, description: '极小任务，最高奖励' },
    { range: '3-5天', bonus: 7, description: '小任务，高优先级' },
    { range: '6-14天', bonus: 5, description: '常规任务，正常推进' },
    { range: '15-30天', bonus: 3, description: '中等任务，需要规划' },
    { range: '31-50天', bonus: 2, description: '大任务，建议切分' },
    { range: '51-100天', bonus: 1, description: '超大任务，必须切分' },
    { range: '101-150天', bonus: 0, description: '巨型任务，严重超标' },
    { range: '>150天', bonus: 0, description: '不可接受，禁止入池' },
  ],
} as const;

// ============================================
// 星级分档规则
// ============================================

export const STAR_RATING_RULES = {
  5: { threshold: 85, label: '★★★★★', description: '强窗口/立即投入' },
  4: { threshold: 70, label: '★★★★', description: '优先执行' },
  3: { threshold: 55, label: '★★★', description: '普通计划项' },
  2: { threshold: 0, label: '★★', description: '择机安排' },
} as const;

// ============================================
// WSJF 权重分计算说明
// ============================================

export const WSJF_CALCULATION_EXPLANATION = {
  step1: {
    title: '第一步：计算原始分（rawScore）',
    formula: 'rawScore = 业务影响度 + 复杂度因子 + 时间因子 + 工作量奖励',
    details: [
      '业务影响度：1-10分（直接使用）',
      '复杂度因子：(11 - 技术复杂度) × 0.5（复杂度越高，分数越低）',
      '时间因子：时间窗口分数 + 强制DDL分数',
      '工作量奖励：根据预估天数给予奖励分',
    ],
  },
  step2: {
    title: '第二步：归一化到1-100（displayScore）',
    formula: 'displayScore = 10 + 90 × (rawScore - minRaw) / (maxRaw - minRaw)',
    description: '将原始分归一化到1-100区间，便于对比',
    specialCase: '当所有需求原始分相同时，统一为60分',
  },
  step3: {
    title: '第三步：星级分档',
    description: '根据权重分进行星级评定',
    rules: STAR_RATING_RULES,
  },
} as const;

// ============================================
// 类型导出
// ============================================

export type BusinessImpactLevel = keyof typeof BUSINESS_IMPACT_LEVELS;
export type ComplexityLevel = keyof typeof COMPLEXITY_LEVELS;
export type TimeCriticality = keyof typeof TIME_CRITICALITY_MAP;
export type StarRating = keyof typeof STAR_RATING_RULES;
