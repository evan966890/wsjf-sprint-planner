/**
 * 飞书项目配置文件
 */

export const config = {
  // 飞书项目配置
  feishuProject: {
    // 基础URL
    baseUrl: process.env.FEISHU_PROJECT_URL || 'https://project.f.mioffice.cn',

    // 项目标识
    projectKey: process.env.PROJECT_KEY || 'iretail',

    // 工作项类型
    workItemType: 'story',

    // 插件凭证（从飞书项目后台获取）
    pluginId: process.env.PLUGIN_ID || 'MII_6917280AF9C0006C',
    pluginSecret: process.env.PLUGIN_SECRET || 'D72E9939C94416D05B44DFEA7670EDFB',

    // 用户标识
    userKey: process.env.USER_KEY || '7541721806923694188'
  },

  // 质量指标字段定义
  qualityFields: [
    {
      name: 'Lead Time（交付周期）',
      alias: 'quality_lead_time',
      description: '从需求创建到上线的平均时间（天）',
      type: 'number',
      unit: '天'
    },
    {
      name: '评审一次通过率',
      alias: 'quality_review_pass_rate',
      description: '评审一次通过的比例（%）',
      type: 'number',
      unit: '%'
    },
    {
      name: '并行事项吞吐量',
      alias: 'quality_throughput',
      description: '团队并行处理的工作项数量',
      type: 'number',
      unit: '个'
    },
    {
      name: 'PRD返工率',
      alias: 'quality_prd_rework_rate',
      description: '需求文档返工的比例（%）',
      type: 'number',
      unit: '%'
    },
    {
      name: '试点到GA迭代周期',
      alias: 'quality_pilot_to_ga',
      description: '从试点到全面推广的迭代次数',
      type: 'number',
      unit: '次'
    }
  ]
};

export default config;