/**
 * 飞书集成服务 - 导出模块
 *
 * 统一导出所有飞书相关的服务、类型和工具函数
 */

// API客户端
export { FeishuAPI, handleFeishuError } from './feishuApi';

// 认证管理
export {
  FeishuAuthManager,
  loadFeishuConfig,
  saveFeishuConfig,
  clearFeishuConfig,
  maskSecret,
} from './feishuAuth';

// OAuth用户授权
export {
  FeishuOAuthManager,
  handleOAuthCallback,
  startOAuthFlow,
} from './feishuOAuth';

// 类型定义
export type {
  FeishuConfig,
  FeishuAuthMode,
  FeishuProject,
  FeishuWorkItem,
  FeishuProjectSpace,
  FeishuProjectStatus,
  FeishuWorkItemStatus,
  FeishuWorkItemPriority,
  FeishuWorkItemType,
  FeishuUser,
  FeishuCustomField,
  FeishuCustomFieldType,
  FeishuPagedResponse,
  FeishuSyncLog,
  FeishuImportConfig,
  FeishuAPIResponse,
  FeishuTokenResponse,
  FeishuUserTokenResponse,
  OAuthTokenInfo,
} from './feishuTypes';

export { FeishuAPIError } from './feishuTypes';
