/**
 * WSJF Sprint Planner - 指标定义配置
 *
 * v1.3.2: 优化指标分类和命名
 *
 * 指标分类：
 * - 核心OKR指标：20个（收入相关、规模相关、效率相关、合作相关、消费者体验、小米人满意度）
 * - 过程指标：20个（运营效率类、数据质量类、协作效率类、合规与风险类）
 */

import type { MetricDefinition } from '../types';

// ========== 核心OKR指标（16个）==========

/**
 * 收入相关指标（3个）
 */
export const REVENUE_METRICS: MetricDefinition[] = [
  {
    key: 'gmv',
    defaultName: 'GMV (总交易额)',
    category: '收入相关',
    type: 'okr',
    description: '所有门店的总交易额，反映业务规模'
  },
  {
    key: 'revenue',
    defaultName: '营收',
    category: '收入相关',
    type: 'okr',
    description: '公司实际营收，扣除退货和折扣后的收入'
  },
  {
    key: 'gross_profit',
    defaultName: '毛利/毛利率',
    category: '收入相关',
    type: 'okr',
    description: '营收减去成本后的毛利润及毛利率'
  }
];

/**
 * 规模相关指标（3个）
 */
export const SCALE_METRICS: MetricDefinition[] = [
  {
    key: 'store_opening',
    defaultName: '门店开设数量',
    category: '规模相关',
    type: 'okr',
    description: '新开门店数量，反映业务扩张速度'
  },
  {
    key: 'store_survival',
    defaultName: '门店存活率/关店率',
    category: '规模相关',
    type: 'okr',
    description: '门店运营健康度指标'
  },
  {
    key: 'active_stores',
    defaultName: '活跃门店数',
    category: '规模相关',
    type: 'okr',
    description: '持续产生交易的门店数量'
  }
];

/**
 * 效率相关指标（4个）
 */
export const EFFICIENCY_METRICS: MetricDefinition[] = [
  {
    key: 'store_efficiency',
    defaultName: '坪效',
    category: '效率相关',
    type: 'okr',
    description: '单位面积的销售额，反映空间利用效率'
  },
  {
    key: 'labor_efficiency',
    defaultName: '人效',
    category: '效率相关',
    type: 'okr',
    description: '人均产出，反映人力效率'
  },
  {
    key: 'inventory_turnover',
    defaultName: '库存周转率',
    category: '效率相关',
    type: 'okr',
    description: '库存周转速度，反映资金使用效率'
  },
  {
    key: 'conversion_rate',
    defaultName: '订单转化率',
    category: '效率相关',
    type: 'okr',
    description: '下单转化率，反映销售效率'
  }
];

/**
 * 合作相关指标（3个）
 */
export const PARTNERSHIP_METRICS: MetricDefinition[] = [
  {
    key: 'dealer_satisfaction_nps',
    defaultName: '授权商满意度/NPS',
    category: '合作相关',
    type: 'okr',
    description: '授权商净推荐值，反映合作伙伴满意度'
  },
  {
    key: 'dealer_retention',
    defaultName: '授权商留存率',
    category: '合作相关',
    type: 'okr',
    description: '授权商持续合作比例'
  },
  {
    key: 'stores_per_dealer',
    defaultName: '单个授权商平均开店数',
    category: '合作相关',
    type: 'okr',
    description: '授权商积极性和成功率指标'
  }
];

/**
 * 消费者体验相关指标（3个）
 */
export const CONSUMER_EXPERIENCE_METRICS: MetricDefinition[] = [
  {
    key: 'customer_nps',
    defaultName: '消费者NPS/满意度',
    category: '消费者体验',
    type: 'okr',
    description: '消费者净推荐值，反映用户满意度'
  },
  {
    key: 'complaint_rate',
    defaultName: '客诉率/客诉处理时长',
    category: '消费者体验',
    type: 'okr',
    description: '客户投诉频率和处理效率'
  },
  {
    key: 'repurchase_rate',
    defaultName: '复购率',
    category: '消费者体验',
    type: 'okr',
    description: '客户复购比例，反映客户忠诚度'
  }
];

/**
 * 小米人满意度指标（4个）
 */
export const FRONTLINE_SATISFACTION_METRICS: MetricDefinition[] = [
  {
    key: 'store_manager_satisfaction',
    defaultName: '店长满意度',
    category: '小米人满意度',
    type: 'okr',
    description: '门店店长对系统和工作的满意度'
  },
  {
    key: 'store_staff_satisfaction',
    defaultName: '店员满意度',
    category: '小米人满意度',
    type: 'okr',
    description: '门店店员对系统和工作的满意度'
  },
  {
    key: 'supervisor_satisfaction',
    defaultName: '督导满意度',
    category: '小米人满意度',
    type: 'okr',
    description: '区域督导对系统和工作的满意度'
  },
  {
    key: 'hq_staff_satisfaction',
    defaultName: '总部小米人满意度',
    category: '小米人满意度',
    type: 'okr',
    description: '总部员工对系统和工作的满意度'
  }
];

/**
 * 所有体验相关指标（7个）
 */
export const EXPERIENCE_METRICS: MetricDefinition[] = [
  ...CONSUMER_EXPERIENCE_METRICS,
  ...FRONTLINE_SATISFACTION_METRICS
];

/**
 * 所有核心OKR指标（20个）
 */
export const OKR_METRICS: MetricDefinition[] = [
  ...REVENUE_METRICS,
  ...SCALE_METRICS,
  ...EFFICIENCY_METRICS,
  ...PARTNERSHIP_METRICS,
  ...CONSUMER_EXPERIENCE_METRICS,
  ...FRONTLINE_SATISFACTION_METRICS
];

// ========== 过程指标（20个）==========

/**
 * 运营效率类指标（9个）
 */
export const OPERATIONAL_EFFICIENCY_METRICS: MetricDefinition[] = [
  {
    key: 'order_processing_time',
    defaultName: '订单处理时长',
    category: '运营效率类',
    type: 'process',
    description: '从订单生成到处理完成的时间'
  },
  {
    key: 'reconciliation_cycle',
    defaultName: '对账周期',
    category: '运营效率类',
    type: 'process',
    description: '完成对账所需的时间'
  },
  {
    key: 'reconciliation_accuracy',
    defaultName: '对账准确率',
    category: '运营效率类',
    type: 'process',
    description: '对账结果的准确性'
  },
  {
    key: 'inventory_check_cycle',
    defaultName: '库存盘点周期',
    category: '运营效率类',
    type: 'process',
    description: '完成库存盘点所需的时间'
  },
  {
    key: 'inventory_check_accuracy',
    defaultName: '库存盘点准确率',
    category: '运营效率类',
    type: 'process',
    description: '库存盘点结果的准确性'
  },
  {
    key: 'product_listing_time',
    defaultName: '商品上架时长',
    category: '运营效率类',
    type: 'process',
    description: '新商品上架所需的时间'
  },
  {
    key: 'promotion_setup_time',
    defaultName: '促销配置时长',
    category: '运营效率类',
    type: 'process',
    description: '配置促销活动所需的时间'
  },
  {
    key: 'return_processing_time',
    defaultName: '退换货处理时长',
    category: '运营效率类',
    type: 'process',
    description: '处理退换货所需的时间'
  },
  {
    key: 'report_generation_time',
    defaultName: '报表生成时长',
    category: '运营效率类',
    type: 'process',
    description: '生成各类报表所需的时间'
  }
];

/**
 * 数据质量类指标（4个）
 */
export const DATA_QUALITY_METRICS: MetricDefinition[] = [
  {
    key: 'data_accuracy',
    defaultName: '数据准确率',
    category: '数据质量类',
    type: 'process',
    description: '数据的准确性（如库存、价格、商品信息）'
  },
  {
    key: 'system_response_time',
    defaultName: '系统响应时长',
    category: '数据质量类',
    type: 'process',
    description: '系统操作的响应速度'
  },
  {
    key: 'data_sync_delay',
    defaultName: '数据同步延迟',
    category: '数据质量类',
    type: 'process',
    description: '跨系统数据同步的延迟时间'
  },
  {
    key: 'abnormal_order_rate',
    defaultName: '异常订单率',
    category: '数据质量类',
    type: 'process',
    description: '需要人工干预的异常订单比例'
  }
];

/**
 * 协作效率类指标（4个）
 */
export const COLLABORATION_EFFICIENCY_METRICS: MetricDefinition[] = [
  {
    key: 'dealer_response_time',
    defaultName: '授权商响应时长',
    category: '协作效率类',
    type: 'process',
    description: '授权商响应请求所需的时间'
  },
  {
    key: 'cross_system_steps',
    defaultName: '跨系统操作步骤数',
    category: '协作效率类',
    type: 'process',
    description: '完成某项任务需要切换系统的次数'
  },
  {
    key: 'manual_intervention_rate',
    defaultName: '人工干预率/人工处理工作量',
    category: '协作效率类',
    type: 'process',
    description: '需要人工处理的比例或工作量'
  },
  {
    key: 'training_cost',
    defaultName: '培训成本/上手时长',
    category: '协作效率类',
    type: 'process',
    description: '新用户学习使用系统所需的时间和成本'
  }
];

/**
 * 合规与风险类指标（3个）
 */
export const COMPLIANCE_RISK_METRICS: MetricDefinition[] = [
  {
    key: 'compliance_coverage',
    defaultName: '合规检查覆盖率',
    category: '合规与风险类',
    type: 'process',
    description: '合规检查覆盖的业务范围'
  },
  {
    key: 'security_incidents',
    defaultName: '数据安全事件数',
    category: '合规与风险类',
    type: 'process',
    description: '数据泄露或安全事件的发生次数'
  },
  {
    key: 'system_availability',
    defaultName: '系统可用性/稳定性',
    category: '合规与风险类',
    type: 'process',
    description: '系统正常运行时间比例'
  }
];

/**
 * 所有过程指标（20个）
 */
export const PROCESS_METRICS: MetricDefinition[] = [
  ...OPERATIONAL_EFFICIENCY_METRICS,
  ...DATA_QUALITY_METRICS,
  ...COLLABORATION_EFFICIENCY_METRICS,
  ...COMPLIANCE_RISK_METRICS
];

// ========== 工具函数 ==========

/**
 * 根据key获取指标定义
 */
export const getMetricDefinition = (key: string): MetricDefinition | undefined => {
  return [...OKR_METRICS, ...PROCESS_METRICS].find(m => m.key === key);
};

/**
 * 根据分类获取指标列表
 */
export const getMetricsByCategory = (category: string): MetricDefinition[] => {
  return [...OKR_METRICS, ...PROCESS_METRICS].filter(m => m.category === category);
};

/**
 * 获取所有OKR指标分类
 */
export const getOKRCategories = (): string[] => {
  return ['收入相关', '规模相关', '效率相关', '合作相关', '消费者体验', '小米人满意度'];
};

/**
 * 获取所有过程指标分类
 */
export const getProcessMetricCategories = (): string[] => {
  return ['运营效率类', '数据质量类', '协作效率类', '合规与风险类'];
};

/**
 * 获取所有指标（OKR + 过程指标）
 */
export const getAllMetrics = (): MetricDefinition[] => {
  return [...OKR_METRICS, ...PROCESS_METRICS];
};
