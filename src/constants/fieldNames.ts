// ============================================================================
// 字段名中英文映射表
// ============================================================================

/**
 * AI填充字段的中英文对照表
 * 用于在UI中显示友好的中文字段名
 */
export const FIELD_NAME_MAP: Record<string, string> = {
  // 基本信息
  'name': '需求名称',
  'description': '需求描述',
  'submitterName': '提交人姓名',
  'submitDate': '提交日期',
  'submitter': '提交方',
  'businessTeam': '业务团队',

  // 业务影响度相关
  'businessImpactScore': '业务影响度',
  'affectedMetrics': '影响的指标',
  'impactScope': '影响范围',

  // 时间维度
  'timeCriticality': '时间窗口',
  'hardDeadline': '强制截止日期',
  'deadlineDate': '截止日期',

  // 业务域
  'businessDomain': '业务域',
  'customBusinessDomain': '自定义业务域',

  // 技术信息
  'effortDays': '工作量',
  'complexityScore': '技术复杂度',
  'type': '需求类型',
  'productManager': '产品经理',
  'developer': '研发负责人',
  'productProgress': '产品进度',
  'techProgress': '技术进度',
  'dependencies': '依赖需求',
  'isRMS': 'RMS重构项目',

  // 产研扩展字段
  'project': '项目名称',
  'productArea': '产品领域',
  'backendDeveloper': '后端研发',
  'frontendDeveloper': '前端研发',
  'tester': '测试',
  'rdNotes': '产研备注',

  // 影响范围子字段
  'storeTypes': '门店类型',
  'regions': '区域',
  'storeCountRange': '门店数量',
  'keyRoles': '涉及角色'
};
