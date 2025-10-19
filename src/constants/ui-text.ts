/**
 * WSJF Sprint Planner - UI 文案常量
 *
 * 本文件集中管理所有 UI 文案，确保术语一致性
 * 所有说明书、组件中的术语必须从此文件获取
 *
 * 规则：
 * - 修改此文件后，说明书自动同步更新
 * - 新增术语时，需同步更新 .claude/project-rules.md
 * - 禁止在组件中硬编码术语文案
 *
 * @version 1.0.0
 * @date 2025-01-19
 */

// ============================================
// 核心术语（Core Terminology）
// ============================================

export const UI_TEXT = {
  // === 评分相关术语 ===
  WEIGHT_SCORE: '权重分',
  BUSINESS_IMPACT: '业务影响度',
  COMPLEXITY: '技术复杂度',
  EFFORT: '工作量',
  TIME_CRITICALITY: '时间窗口',
  HARD_DEADLINE: '强制 DDL',
  STAR_RATING: '星级',

  // === 术语描述 ===
  WEIGHT_SCORE_DESC: 'WSJF 计算后的 1-100 归一化分数',
  BUSINESS_IMPACT_DESC: '1-10 分制评分，评估业务价值',
  COMPLEXITY_DESC: '1-10 分制评分，评估技术难度',
  EFFORT_DESC: '预估人天数',
  TIME_CRITICALITY_DESC: '随时/三月窗口/一月硬窗口',
  HARD_DEADLINE_DESC: '是否有强制截止日期',
  STAR_RATING_DESC: '★★★★★ 评级系统（2-5星）',

  // === 时间窗口选项 ===
  TIME_ANYTIME: '随时',
  TIME_THREE_MONTHS: '三月窗口',
  TIME_ONE_MONTH: '一月硬窗口',

  // === 星级文案 ===
  STAR_5: '★★★★★ 强窗口/立即投入',
  STAR_4: '★★★★ 优先执行',
  STAR_3: '★★★ 普通计划项',
  STAR_2: '★★ 择机安排',

  // === 按钮和操作 ===
  BTN_SAVE: '保存',
  BTN_CANCEL: '取消',
  BTN_SUBMIT: '提交',
  BTN_CONFIRM: '确认',
  BTN_EDIT: '编辑',
  BTN_DELETE: '删除',
  BTN_ADD: '添加',
  BTN_EXPORT: '导出',
  BTN_IMPORT: '导入',
  BTN_CLOSE: '关闭',

  // === 表单标签 ===
  LABEL_REQUIREMENT_NAME: '需求名称',
  LABEL_SUBMITTER: '提交人',
  LABEL_SUBMIT_DATE: '提交日期',
  LABEL_BUSINESS_DOMAIN: '业务域',
  LABEL_PRODUCT_MANAGER: '产品经理',
  LABEL_DEVELOPER: '研发负责人',
  LABEL_TYPE: '需求类型',
  LABEL_PRODUCT_PROGRESS: '产品进度',
  LABEL_TECH_PROGRESS: '技术进度',

  // === 说明书标题 ===
  HANDBOOK_TITLE: 'WSJF-Lite 评分说明书',
  HANDBOOK_SUBTITLE: '加权最短作业优先（简化版）',

  // === 提示信息 ===
  MSG_REQUIRED: '必填项',
  MSG_SAVE_SUCCESS: '保存成功',
  MSG_SAVE_FAILED: '保存失败',
  MSG_DELETE_CONFIRM: '确定要删除吗？',
  MSG_LOADING: '加载中...',
  MSG_NO_DATA: '暂无数据',

  // === 业务域选项 ===
  DOMAIN_NEW_RETAIL: '新零售',
  DOMAIN_CHANNEL_RETAIL: '渠道零售',
  DOMAIN_INTERNATIONAL: '国际零售通用',
  DOMAIN_CUSTOM: '自定义',

  // === 需求类型 ===
  TYPE_FEATURE: '功能开发',
  TYPE_TECH_DEBT: '技术债',
  TYPE_BUG: 'Bug修复',
  TYPE_OPTIMIZATION: '优化改进',

  // === 进度状态 ===
  PROGRESS_PENDING: '未开始',
  PROGRESS_IN_PROGRESS: '进行中',
  PROGRESS_COMPLETED: '已完成',
  PROGRESS_BLOCKED: '受阻',

  // === RMS 重构 ===
  RMS_REFACTOR: 'RMS重构',
  RMS_YES: '是',
  RMS_NO: '否',

  // === AI 评估 ===
  AI_EVALUATION: 'AI批量评估',
  AI_MODEL_OPENAI: 'OpenAI GPT-4',
  AI_MODEL_DEEPSEEK: 'DeepSeek',
  AI_ANALYZING: 'AI分析中...',
  AI_ANALYSIS_COMPLETE: 'AI分析完成',
  AI_ANALYSIS_FAILED: 'AI分析失败',

  // === 影响指标分类 ===
  METRICS_OKR: '核心OKR指标',
  METRICS_PROCESS: '过程指标',

  // === 需求相关性 ===
  RELEVANCE_TITLE: '需求相关性',
  RELEVANCE_BUSINESS_TEAM: '业务团队',
  RELEVANCE_STORE_TYPES: '门店类型',
  RELEVANCE_STORE_COUNT: '门店数量',
  RELEVANCE_REGIONS: '影响地区',

  // === 受影响的指标 ===
  AFFECTED_METRICS: '影响的指标',
  ESTIMATED_IMPACT: '预估影响',

} as const;

// 类型导出（用于 TypeScript 类型检查）
export type UITextKey = keyof typeof UI_TEXT;
export type UITextValue = typeof UI_TEXT[UITextKey];
