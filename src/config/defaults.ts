/**
 * 默认配置数据
 * 包括评分标准和指标定义的默认值
 */

import type { ScoringStandard, MetricDefinition } from '../types';

/**
 * 默认评分标准（10分制）
 */
export const DEFAULT_SCORING_STANDARDS: ScoringStandard[] = [
  {
    score: 10,
    name: '致命缺陷',
    shortDescription: '不修复将导致系统崩溃/业务停摆/法律风险',
    businessConsequence: ['系统崩溃', '业务停摆', '法律风险', '重大安全事故'],
    impactScope: ['全球', '全渠道', '所有门店'],
    typicalCases: ['支付系统崩溃', '数据泄露', '法律合规问题'],
    affectedOKRs: ['系统可用性', '合规性']
  },
  {
    score: 9,
    name: '严重阻塞',
    shortDescription: '严重影响核心流程，影响多国/多渠道',
    businessConsequence: ['核心流程受阻', '多国业务受影响', '重大客诉'],
    impactScope: ['多国', '多渠道', '大量门店'],
    typicalCases: ['订单流程异常', '库存同步失败', '结算系统故障'],
    affectedOKRs: ['GMV', '订单量', '客户满意度']
  },
  {
    score: 8,
    name: '战略必需',
    shortDescription: '战略级OKR关键路径，影响全球/多国',
    businessConsequence: ['战略目标受阻', '年度OKR风险', '竞争力下降'],
    impactScope: ['全球', '多国', '全渠道'],
    typicalCases: ['新市场拓展', '重大产品升级', '战略合作项目'],
    affectedOKRs: ['营收', '市场份额', '战略目标']
  },
  {
    score: 7,
    name: '显著影响',
    shortDescription: '显著影响核心OKR，影响多国/单国全渠道',
    businessConsequence: ['核心指标下降', '用户体验受损', '运营效率降低'],
    impactScope: ['多国', '单国全渠道', '多个渠道'],
    typicalCases: ['促销功能缺失', '报表功能异常', '关键流程优化'],
    affectedOKRs: ['GMV', 'NPS', '运营效率']
  },
  {
    score: 6,
    name: '重要改进',
    shortDescription: '改善核心指标，影响单国多门店',
    businessConsequence: ['指标提升机会', '体验改善', '效率提升'],
    impactScope: ['单国', '多门店', '单一渠道'],
    typicalCases: ['功能优化', '流程简化', '数据分析增强'],
    affectedOKRs: ['转化率', '客单价', '复购率']
  },
  {
    score: 5,
    name: '中等价值',
    shortDescription: '改善过程指标，影响单国部分门店',
    businessConsequence: ['过程指标改善', '局部体验提升'],
    impactScope: ['单国', '部分门店', '特定场景'],
    typicalCases: ['报表优化', '后台功能增强', '数据导出'],
    affectedOKRs: ['操作效率', '数据质量']
  },
  {
    score: 4,
    name: '局部优化',
    shortDescription: '局部流程优化，影响单一门店类型',
    businessConsequence: ['流程小幅优化', '特定场景改善'],
    impactScope: ['单一门店类型', '个别区域'],
    typicalCases: ['界面优化', '小功能增强'],
    affectedOKRs: ['用户体验']
  },
  {
    score: 3,
    name: '小幅提升',
    shortDescription: '小幅改善体验，影响少量门店',
    businessConsequence: ['体验微调', '边缘场景优化'],
    impactScope: ['少量门店', '极少数用户'],
    typicalCases: ['文案优化', '样式调整'],
    affectedOKRs: []
  },
  {
    score: 2,
    name: '微小优化',
    shortDescription: '微小改进，影响极少数场景',
    businessConsequence: ['极小改进'],
    impactScope: ['极少数场景'],
    typicalCases: ['细节优化'],
    affectedOKRs: []
  },
  {
    score: 1,
    name: '可选优化',
    shortDescription: '可有可无的优化',
    businessConsequence: ['可选项'],
    impactScope: ['可忽略'],
    typicalCases: ['Nice to have'],
    affectedOKRs: []
  }
];

/**
 * 默认指标定义
 */
export const DEFAULT_METRIC_DEFINITIONS: MetricDefinition[] = [
  // 核心OKR指标
  {
    key: 'gmv',
    defaultName: 'GMV (商品交易总额)',
    category: '收入相关',
    type: 'okr',
    description: '所有订单的总交易金额'
  },
  {
    key: 'revenue',
    defaultName: '营收',
    category: '收入相关',
    type: 'okr',
    description: '实际收入金额'
  },
  {
    key: 'order_count',
    defaultName: '订单量',
    category: '规模相关',
    type: 'okr',
    description: '总订单数量'
  },
  {
    key: 'customer_count',
    defaultName: '客户数',
    category: '规模相关',
    type: 'okr',
    description: '活跃客户总数'
  },
  {
    key: 'nps',
    defaultName: 'NPS (净推荐值)',
    category: '客户满意度',
    type: 'okr',
    description: '客户满意度和忠诚度指标'
  },
  {
    key: 'market_share',
    defaultName: '市场份额',
    category: '市场竞争力',
    type: 'okr',
    description: '在目标市场的份额占比'
  },

  // 过程指标
  {
    key: 'conversion_rate',
    defaultName: '转化率',
    category: '运营效率类',
    type: 'process',
    description: '访客到成交的转化比例'
  },
  {
    key: 'avg_order_value',
    defaultName: '客单价',
    category: '运营效率类',
    type: 'process',
    description: '平均每笔订单金额'
  },
  {
    key: 'repurchase_rate',
    defaultName: '复购率',
    category: '运营效率类',
    type: 'process',
    description: '客户重复购买比例'
  },
  {
    key: 'inventory_turnover',
    defaultName: '库存周转率',
    category: '运营效率类',
    type: 'process',
    description: '库存周转速度'
  },
  {
    key: 'fulfillment_time',
    defaultName: '履约时效',
    category: '运营效率类',
    type: 'process',
    description: '从下单到交付的时间'
  },
  {
    key: 'operational_cost',
    defaultName: '运营成本',
    category: '成本控制',
    type: 'process',
    description: '运营总成本'
  }
];
