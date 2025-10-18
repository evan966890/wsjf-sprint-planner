/**
 * WSJF Sprint Planner - 业务字段配置
 *
 * v1.2.0: 定义业务相关的字段配置
 *
 * 包含：
 * - 门店类型
 * - 区域划分（国际业务颗粒度）
 * - 影响门店数范围
 * - 关键角色（区域 + 总部）
 * - 业务团队
 * - 时间临界性
 */

// ========== 门店类型 ==========

/**
 * 门店类型（5种，包含"与门店无关"）
 */
export const STORE_TYPES = [
  '新零售-直营店',
  '新零售-授权店',
  '新零售-专卖店',
  '渠道零售门店',
  '与门店无关'
] as const;

export type StoreType = typeof STORE_TYPES[number];

/**
 * 根据业务域获取可选的门店类型
 */
export const getStoreTypesByDomain = (domain: string): string[] => {
  if (domain === '新零售') {
    return ['新零售-直营店', '新零售-授权店', '新零售-专卖店', '与门店无关'];
  } else if (domain === '渠道零售') {
    return ['渠道零售门店', '与门店无关'];
  } else {
    // 国际零售通用或自定义，返回所有选项
    return [...STORE_TYPES];
  }
};

// ========== 区域划分 ==========

/**
 * 区域配置接口
 */
export interface RegionConfig {
  name: string;              // 区域名称
  subRegions?: string[];     // 子区域（可选）
  countries?: string[];      // 国家列表（可选）
}

/**
 * 国际业务区域划分
 *
 * 注意：不包含中国大陆业务
 */
export const REGIONS: RegionConfig[] = [
  {
    name: '南亚',
    countries: ['印度', '孟加拉', '巴基斯坦', '斯里兰卡', '尼泊尔', '不丹', '马尔代夫']
  },
  {
    name: '亚太地区（除南亚）',
    subRegions: [
      '东南亚（新加坡/泰国/越南/印尼/马来西亚/菲律宾）',
      '其他亚太（日本/韩国/澳大利亚/新西兰等）'
    ]
  },
  {
    name: '欧洲地区',
    subRegions: [
      '西欧（英国/法国/德国/意大利/西班牙）',
      '东欧（波兰等）',
      '其他欧洲'
    ]
  },
  {
    name: '独联体',
    countries: ['俄罗斯', '乌克兰', '白俄罗斯', '哈萨克斯坦', '乌兹别克斯坦', '其他独联体国家']
  },
  {
    name: '中东非洲地区',
    subRegions: [
      '中东（阿联酋/沙特/以色列等）',
      '非洲（南非/埃及/尼日利亚等）'
    ]
  },
  {
    name: '美洲地区',
    subRegions: [
      '拉美（墨西哥/巴西/智利/阿根廷等）',
      '北美（美国/加拿大）',
      '其他美洲'
    ]
  },
  {
    name: '全球所有市场',
    subRegions: []
  }
];

/**
 * 获取所有区域名称（扁平化）
 */
export const getAllRegionNames = (): string[] => {
  const names: string[] = [];
  REGIONS.forEach(region => {
    names.push(region.name);
    if (region.subRegions) {
      names.push(...region.subRegions);
    }
  });
  return names;
};

// ========== 影响门店数范围 ==========

/**
 * 影响门店数范围（6档）
 */
export const STORE_COUNT_RANGES = [
  '<10家',
  '10-50家',
  '50-200家',
  '200-500家',
  '500+家',
  '全球门店'
] as const;

export type StoreCountRange = typeof STORE_COUNT_RANGES[number];

// ========== 关键角色 ==========

/**
 * 角色分类类型
 */
export type RoleCategory = 'regional' | 'hq-common' | 'hq-new-retail' | 'hq-channel-retail';

/**
 * 角色配置接口
 */
export interface RoleConfig {
  category: RoleCategory;
  categoryName: string;
  roles: string[];
}

/**
 * 关键角色配置
 */
export const KEY_ROLES_CONFIG: RoleConfig[] = [
  // 区域角色
  {
    category: 'regional',
    categoryName: '区域角色',
    roles: [
      '促销员',
      '督导',
      '店长',
      '区域经理',
      '国总',
      '区总'
    ]
  },
  // 总部-通用
  {
    category: 'hq-common',
    categoryName: '总部-通用',
    roles: [
      '培训管理部',
      '终端设计管理部',
      '零售费用部'
    ]
  },
  // 总部-新零售
  {
    category: 'hq-new-retail',
    categoryName: '总部-新零售',
    roles: [
      'GTM',
      '品类运营',
      '门店建设',
      '门店运营',
      '业务支持部',
      '区域对接组',
      '市场部'
    ]
  },
  // 总部-渠道零售
  {
    category: 'hq-channel-retail',
    categoryName: '总部-渠道零售',
    roles: [
      '阵地运营',
      'FF运营',
      '品类运营',
      '市场部'
    ]
  }
];

/**
 * 获取所有角色（扁平化）
 */
export const getAllRoles = (): string[] => {
  return KEY_ROLES_CONFIG.flatMap(config => config.roles);
};

/**
 * 根据分类获取角色列表
 */
export const getRolesByCategory = (category: RoleCategory): string[] => {
  const config = KEY_ROLES_CONFIG.find(c => c.category === category);
  return config ? config.roles : [];
};

/**
 * 获取角色所属的分类
 */
export const getRoleCategory = (roleName: string): RoleCategory | undefined => {
  for (const config of KEY_ROLES_CONFIG) {
    if (config.roles.includes(roleName)) {
      return config.category;
    }
  }
  return undefined;
};

/**
 * 根据业务域获取可选的关键角色配置
 */
export const getRoleConfigsByDomain = (domain: string): RoleConfig[] => {
  // 区域角色和总部-通用角色对所有业务域开放
  const commonConfigs = KEY_ROLES_CONFIG.filter(
    config => config.category === 'regional' || config.category === 'hq-common'
  );

  if (domain === '新零售') {
    // 新零售：区域 + 通用 + 新零售
    const newRetailConfig = KEY_ROLES_CONFIG.find(c => c.category === 'hq-new-retail');
    return newRetailConfig ? [...commonConfigs, newRetailConfig] : commonConfigs;
  } else if (domain === '渠道零售') {
    // 渠道零售：区域 + 通用 + 渠道零售
    const channelRetailConfig = KEY_ROLES_CONFIG.find(c => c.category === 'hq-channel-retail');
    return channelRetailConfig ? [...commonConfigs, channelRetailConfig] : commonConfigs;
  } else {
    // 国际零售通用或自定义：所有角色
    return KEY_ROLES_CONFIG;
  }
};

// ========== 业务团队 ==========

/**
 * 业务团队列表
 */
export const BUSINESS_TEAMS = [
  '开店团队',
  '门店销售团队',
  '供应链计划团队',
  '商品运营团队',
  '市场营销团队',
  '客户服务团队',
  '财务团队',
  '其他'
] as const;

export type BusinessTeam = typeof BUSINESS_TEAMS[number];

// ========== 时间临界性 ==========

/**
 * 时间临界性（3档）
 */
export const TIME_CRITICALITY = [
  '随时',
  '三月窗口',
  '一月硬窗口'
] as const;

export type TimeCriticality = typeof TIME_CRITICALITY[number];

/**
 * 时间临界性描述
 */
export const TIME_CRITICALITY_DESCRIPTIONS: Record<TimeCriticality, string> = {
  '随时': '没有明确的时间要求，可以在适当的时候做',
  '三月窗口': '有一个3个月左右的时间窗口，窗口期内做效果更好',
  '一月硬窗口': '必须在1个月内完成，否则会错失机会或造成损失'
};

// ========== 业务域 ==========

/**
 * 业务域列表
 */
export const BUSINESS_DOMAINS = [
  '新零售',
  '渠道零售',
  '国际零售通用',
  '自定义'
] as const;

export type BusinessDomain = typeof BUSINESS_DOMAINS[number];

// ========== 需求类型 ==========

/**
 * 需求类型列表
 */
export const REQUIREMENT_TYPES = [
  '功能开发',
  'Bug修复',
  '技术重构',
  '性能优化',
  '体验优化',
  '数据需求',
  '其他'
] as const;

export type RequirementType = typeof REQUIREMENT_TYPES[number];

// ========== 进度状态 ==========

/**
 * 产品进度状态
 */
export const PRODUCT_PROGRESS = [
  '待评估',
  '需求分析中',
  '设计中',
  '待评审',
  '已完成设计',
  '开发中'
] as const;

/**
 * 技术进度状态
 */
export const TECH_PROGRESS = [
  '待评估',
  '已评估工作量',
  '技术方案设计中',
  '开发中',
  '联调测试中',
  '已上线'
] as const;

export type ProductProgress = typeof PRODUCT_PROGRESS[number];
export type TechProgress = typeof TECH_PROGRESS[number];
