/**
 * 飞书集成配置
 *
 * 说明：
 * - 这些是只读权限的credentials，用于拉取飞书项目数据
 * - 不会修改飞书项目内容，因此安全性风险较低
 * - 内置credentials可以简化用户体验，无需每次填写
 */

export const FEISHU_CONFIG = {
  /**
   * 飞书Plugin ID
   * 用于项目管理平台API认证
   */
  PLUGIN_ID: import.meta.env.VITE_FEISHU_PLUGIN_ID || 'MII_68F1064FA240006C',

  /**
   * 飞书User Key
   * 用于获取用户的项目列表（只读权限）
   */
  USER_KEY: import.meta.env.VITE_FEISHU_USER_KEY || '',

  /**
   * Plugin Secret（用于获取access token）
   * 注意：此密钥会暴露在前端代码中
   */
  PLUGIN_SECRET: import.meta.env.VITE_FEISHU_PLUGIN_SECRET || '',

  /**
   * 是否自动使用内置credentials（不显示配置步骤）
   */
  AUTO_LOGIN: import.meta.env.VITE_FEISHU_AUTO_LOGIN === 'true',
};

/**
 * 检查是否配置了完整的credentials
 */
export function hasFeishuCredentials(): boolean {
  return !!(FEISHU_CONFIG.PLUGIN_ID && FEISHU_CONFIG.USER_KEY && FEISHU_CONFIG.PLUGIN_SECRET);
}

/**
 * 获取飞书配置（优先使用环境变量）
 */
export function getFeishuConfig() {
  return {
    pluginId: FEISHU_CONFIG.PLUGIN_ID,
    userKey: FEISHU_CONFIG.USER_KEY,
    pluginSecret: FEISHU_CONFIG.PLUGIN_SECRET,
    autoLogin: FEISHU_CONFIG.AUTO_LOGIN,
  };
}
