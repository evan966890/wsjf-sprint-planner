/**
 * 飞书集成 - 类型定义
 *
 * 定义飞书API相关的所有TypeScript类型
 */

/**
 * 飞书授权模式
 */
export type FeishuAuthMode = 'tenant' | 'user' | 'manual';

/**
 * 飞书API配置
 */
export interface FeishuConfig {
  pluginId: string;
  pluginSecret: string;
  baseUrl?: string; // 默认: https://open.feishu.cn/open-apis
  authMode?: FeishuAuthMode; // 授权模式：tenant（租户）、user（用户）、manual（手动token）
  redirectUri?: string; // OAuth回调地址（用户授权模式需要）
  manualToken?: string; // 手动输入的token（manual模式使用）
  usePluginHeader?: boolean; // 是否使用X-Plugin-Token header（飞书项目插件专用）
  userKey?: string; // 用户Key（飞书项目插件需要，配合X-Plugin-Token使用）
}

/**
 * 飞书访问令牌响应（应用授权）
 */
export interface FeishuTokenResponse {
  code: number;
  msg: string;
  tenant_access_token?: string;
  expire: number;
}

/**
 * 飞书用户访问令牌响应（用户授权）
 */
export interface FeishuUserTokenResponse {
  code: number;
  msg: string;
  data?: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  };
}

/**
 * OAuth授权信息
 */
export interface OAuthTokenInfo {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tokenType: string;
}

/**
 * 飞书API通用响应
 */
export interface FeishuAPIResponse<T = any> {
  code: number;
  msg: string;
  data?: T;
}

/**
 * 飞书项目空间
 */
export interface FeishuProjectSpace {
  id: string;
  name: string;
  description?: string;
  owner_id?: string;
  created_at?: number;
  updated_at?: number;
}

/**
 * 飞书项目
 */
export interface FeishuProject {
  id: string;
  name: string;
  description?: string;
  status: FeishuProjectStatus;
  space_id: string;
  created_at: number;
  updated_at: number;
  owner_id?: string;
  template_id?: string;
}

/**
 * 飞书项目状态
 */
export type FeishuProjectStatus =
  | 'active'        // 进行中
  | 'archived'      // 已归档
  | 'completed'     // 已完成
  | 'suspended';    // 已暂停

/**
 * 飞书工作项（任务）
 */
export interface FeishuWorkItem {
  id: string;
  name: string;
  description?: string;
  status: FeishuWorkItemStatus;
  priority?: FeishuWorkItemPriority;
  creator_id: string;
  creator?: FeishuUser;
  assignee_id?: string;
  assignee?: FeishuUser;
  created_at: number;
  updated_at: number;
  start_date?: number;
  due_date?: number;
  estimated_hours?: number;
  actual_hours?: number;
  tags?: string[];
  work_item_type_id?: string;
  work_item_type?: FeishuWorkItemType;
  custom_fields?: FeishuCustomField[];
  project_id: string;
}

/**
 * 飞书工作项状态
 */
export type FeishuWorkItemStatus =
  | 'to_do'         // 待处理
  | 'in_progress'   // 进行中
  | 'testing'       // 测试中
  | 'done'          // 已完成
  | 'blocked'       // 已阻塞
  | 'cancelled';    // 已取消

/**
 * 飞书工作项优先级
 */
export type FeishuWorkItemPriority =
  | 'urgent'        // 紧急
  | 'high'          // 高
  | 'medium'        // 中
  | 'low';          // 低

/**
 * 飞书工作项类型
 */
export interface FeishuWorkItemType {
  id: string;
  name: string;
  icon?: string;
}

/**
 * 飞书用户
 */
export interface FeishuUser {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
}

/**
 * 飞书自定义字段
 */
export interface FeishuCustomField {
  field_id: string;
  field_name: string;
  field_type: FeishuCustomFieldType;
  field_value: any;
}

/**
 * 飞书自定义字段类型
 */
export type FeishuCustomFieldType =
  | 'text'          // 文本
  | 'number'        // 数字
  | 'date'          // 日期
  | 'datetime'      // 日期时间
  | 'select'        // 单选
  | 'multi_select'  // 多选
  | 'user'          // 用户
  | 'url';          // 链接

/**
 * 飞书分页响应
 */
export interface FeishuPagedResponse<T> {
  items: T[];
  page_token?: string;
  has_more: boolean;
  total?: number;
}

/**
 * 飞书API错误
 */
export class FeishuAPIError extends Error {
  constructor(
    public code: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'FeishuAPIError';
  }
}

/**
 * 飞书同步记录
 */
export interface FeishuSyncLog {
  id: string;
  timestamp: string;
  operation: 'import' | 'sync' | 'config_update';
  project_id?: string;
  project_name?: string;
  work_item_count: number;
  success_count: number;
  failed_count: number;
  errors?: string[];
  operator: string;
  duration_ms?: number;
}

/**
 * 飞书导入配置
 */
export interface FeishuImportConfig {
  enable_ai_scoring?: boolean;      // 是否启用AI智能评分
  clear_before_import?: boolean;    // 是否在导入前清空现有数据
  default_submitter?: string;       // 默认提交方
  default_business_domain?: string; // 默认业务域
  auto_calculate_scores?: boolean;  // 是否自动计算WSJF分数
}
