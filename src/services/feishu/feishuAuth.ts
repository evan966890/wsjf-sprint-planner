/**
 * 飞书集成 - 认证管理
 *
 * 处理飞书应用认证、token管理和刷新
 */

import type { FeishuConfig, FeishuTokenResponse, OAuthTokenInfo } from './feishuTypes';
import { FeishuAPIError as FeishuAPIErrorClass } from './feishuTypes';
import { FeishuOAuthManager } from './feishuOAuth';

/**
 * 飞书认证管理器（统一接口，支持租户和用户授权）
 */
export class FeishuAuthManager {
  private config: FeishuConfig;
  private accessToken: string | null = null;
  private tokenExpireTime: number = 0;
  private oauthManager: FeishuOAuthManager | null = null;
  private readonly TOKEN_BUFFER_TIME = 5 * 60 * 1000; // 提前5分钟刷新token

  constructor(config: FeishuConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || 'https://open.feishu.cn/open-apis',
      authMode: config.authMode || 'user', // 默认使用用户授权模式
    };

    // 如果是用户授权模式，创建OAuth管理器
    if (this.config.authMode === 'user') {
      this.oauthManager = new FeishuOAuthManager(this.config);
    }
  }

  /**
   * 获取访问令牌（自动刷新）
   */
  async getAccessToken(): Promise<string> {
    // 手动token模式（特殊处理：支持自动刷新）
    if (this.config.authMode === 'manual') {
      // Cookie模式：不返回token，由浏览器Cookie认证
      if (this.config.manualToken === 'cookie') {
        return 'cookie'; // 特殊标记，API层会据此跳过Authorization header
      }

      // 检查是否是项目管理平台（支持自动刷新）
      const isProjectPlatform =
        this.config.baseUrl?.includes('project.f.mioffice.cn') ||
        this.config.baseUrl?.includes('project.feishu.cn') ||
        this.config.usePluginHeader;

      if (isProjectPlatform && this.config.pluginId && this.config.pluginSecret) {
        // 项目管理平台：支持自动刷新token
        if (this.isTokenValid()) {
          console.log('[FeishuAuth] Using cached project platform token');
          return this.accessToken!;
        }

        // Token无效或即将过期，自动刷新
        console.log('[FeishuAuth] Token expired or about to expire, auto-refreshing...');
        return await this.refreshAccessToken();
      } else {
        // 非项目管理平台：使用用户提供的token（不自动刷新）
        if (!this.config.manualToken) {
          throw new FeishuAPIErrorClass(-1, '请输入Token');
        }
        return this.config.manualToken;
      }
    }

    // 用户授权模式：使用OAuth管理器
    if (this.config.authMode === 'user') {
      if (!this.oauthManager) {
        throw new FeishuAPIErrorClass(-1, 'OAuth管理器未初始化');
      }
      return await this.oauthManager.getAccessToken();
    }

    // 租户授权模式（原有逻辑）
    if (this.isTokenValid()) {
      return this.accessToken!;
    }

    return await this.refreshAccessToken();
  }

  /**
   * 检查是否已授权
   */
  isAuthorized(): boolean {
    // 手动token模式：检查是否有token
    if (this.config.authMode === 'manual') {
      return !!this.config.manualToken;
    }

    // 用户授权模式：检查OAuth状态
    if (this.config.authMode === 'user') {
      return this.oauthManager?.isAuthorized() || false;
    }

    // 租户授权模式：检查token有效性
    return this.isTokenValid();
  }

  /**
   * 获取OAuth授权URL（仅用户授权模式）
   */
  getAuthorizationUrl(): string {
    if (this.config.authMode !== 'user' || !this.oauthManager) {
      throw new FeishuAPIErrorClass(-1, '仅用户授权模式支持OAuth授权');
    }

    return this.oauthManager.getAuthorizationUrl();
  }

  /**
   * 使用授权码换取token（仅用户授权模式）
   */
  async exchangeCodeForToken(code: string): Promise<OAuthTokenInfo> {
    if (this.config.authMode !== 'user' || !this.oauthManager) {
      throw new FeishuAPIErrorClass(-1, '仅用户授权模式支持OAuth授权');
    }

    return await this.oauthManager.exchangeCodeForToken(code);
  }

  /**
   * 检查token是否有效
   */
  private isTokenValid(): boolean {
    if (!this.accessToken) {
      return false;
    }

    // 检查是否即将过期（提前5分钟刷新）
    const now = Date.now();
    return now < this.tokenExpireTime - this.TOKEN_BUFFER_TIME;
  }

  /**
   * 刷新访问令牌
   */
  async refreshAccessToken(): Promise<string> {
    try {
      // 检测是否是项目管理平台（私有化部署）
      const isProjectPlatform =
        this.config.baseUrl?.includes('project.f.mioffice.cn') ||
        this.config.baseUrl?.includes('project.feishu.cn') ||
        this.config.usePluginHeader;

      if (isProjectPlatform) {
        // 项目管理平台：使用 /open_api/authen/plugin_token
        console.log('[FeishuAuth] Refreshing project platform plugin token');

        // 在开发环境使用代理，避免CORS问题
        const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;
        const baseUrl = isDev ? '/feishu-proxy' : this.config.baseUrl;

        console.log('[FeishuAuth] Using baseUrl:', baseUrl, '(dev mode:', isDev, ')');

        const response = await fetch(
          `${baseUrl}/open_api/authen/plugin_token`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              plugin_id: this.config.pluginId,
              plugin_secret: this.config.pluginSecret,
              type: 0, // plugin_access_token类型
            }),
          }
        );

        if (!response.ok) {
          throw new FeishuAPIErrorClass(
            response.status,
            `HTTP请求失败: ${response.statusText}`
          );
        }

        const data = await response.json();

        if (data.error?.code !== 0) {
          throw new FeishuAPIErrorClass(
            data.error?.code || -1,
            data.error?.msg || '获取插件Token失败'
          );
        }

        if (!data.data?.token) {
          throw new FeishuAPIErrorClass(
            -1,
            '响应中缺少token'
          );
        }

        // 保存token和过期时间
        this.accessToken = data.data.token;
        this.tokenExpireTime = Date.now() + (data.data.expire_time || 7200) * 1000;

        console.log('[FeishuAuth] Project platform token refreshed successfully, expires in', data.data.expire_time, 'seconds');

        return this.accessToken || '';
      } else {
        // 标准飞书API：使用 /auth/v3/tenant_access_token/internal
        const response = await fetch(
          `${this.config.baseUrl}/auth/v3/tenant_access_token/internal`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              app_id: this.config.pluginId,
              app_secret: this.config.pluginSecret,
            }),
          }
        );

        if (!response.ok) {
          throw new FeishuAPIErrorClass(
            response.status,
            `HTTP请求失败: ${response.statusText}`
          );
        }

        const data: FeishuTokenResponse = await response.json();

        if (data.code !== 0) {
          throw new FeishuAPIErrorClass(
            data.code,
            data.msg || '获取访问令牌失败'
          );
        }

        if (!data.tenant_access_token) {
          throw new FeishuAPIErrorClass(
            -1,
            '响应中缺少tenant_access_token'
          );
        }

        // 保存token和过期时间
        this.accessToken = data.tenant_access_token;
        this.tokenExpireTime = Date.now() + data.expire * 1000;

        console.log('[FeishuAuth] Access token refreshed successfully');

        return this.accessToken;
      }
    } catch (error) {
      console.error('[FeishuAuth] Failed to refresh access token:', error);

      if (error instanceof FeishuAPIErrorClass) {
        throw error;
      }

      throw new FeishuAPIErrorClass(
        -1,
        `获取访问令牌失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }

  /**
   * 清除token（用于登出或重新认证）
   */
  clearToken(): void {
    if (this.config.authMode === 'user' && this.oauthManager) {
      this.oauthManager.clearToken();
    } else {
      this.accessToken = null;
      this.tokenExpireTime = 0;
    }
  }

  /**
   * 更新配置
   */
  updateConfig(config: FeishuConfig): void {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || 'https://open.feishu.cn/open-apis',
    };
    // 清除旧token
    this.clearToken();
  }

  /**
   * 获取当前配置
   */
  getConfig(): FeishuConfig {
    return { ...this.config };
  }

  /**
   * 测试连接（验证配置是否正确）
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.refreshAccessToken();
      return true;
    } catch (error) {
      console.error('[FeishuAuth] Connection test failed:', error);
      return false;
    }
  }

  /**
   * 获取token剩余有效时间（毫秒）
   */
  getTokenRemainingTime(): number {
    if (!this.accessToken) {
      return 0;
    }

    const remaining = this.tokenExpireTime - Date.now();
    return Math.max(0, remaining);
  }

  /**
   * 检查token是否即将过期
   */
  isTokenExpiringSoon(): boolean {
    const remaining = this.getTokenRemainingTime();
    return remaining > 0 && remaining < this.TOKEN_BUFFER_TIME;
  }
}

/**
 * 从localStorage加载飞书配置
 */
export function loadFeishuConfig(): FeishuConfig | null {
  try {
    const saved = localStorage.getItem('feishu_config');
    if (!saved) {
      return null;
    }

    const config = JSON.parse(saved) as FeishuConfig;

    // 验证配置完整性
    if (!config.pluginId || !config.pluginSecret) {
      console.warn('[FeishuAuth] Incomplete config in localStorage');
      return null;
    }

    return config;
  } catch (error) {
    console.error('[FeishuAuth] Failed to load config from localStorage:', error);
    return null;
  }
}

/**
 * 保存飞书配置到localStorage
 */
export function saveFeishuConfig(config: FeishuConfig): void {
  try {
    localStorage.setItem('feishu_config', JSON.stringify(config));
    console.log('[FeishuAuth] Config saved to localStorage');
  } catch (error) {
    console.error('[FeishuAuth] Failed to save config to localStorage:', error);
    throw new Error('保存配置失败');
  }
}

/**
 * 清除飞书配置
 */
export function clearFeishuConfig(): void {
  try {
    localStorage.removeItem('feishu_config');
    console.log('[FeishuAuth] Config cleared from localStorage');
  } catch (error) {
    console.error('[FeishuAuth] Failed to clear config from localStorage:', error);
  }
}

/**
 * 脱敏显示密钥
 */
export function maskSecret(secret: string): string {
  if (!secret || secret.length <= 8) {
    return '****';
  }

  const start = secret.slice(0, 4);
  const end = secret.slice(-4);
  const maskLength = secret.length - 8;

  return `${start}${'*'.repeat(maskLength)}${end}`;
}
