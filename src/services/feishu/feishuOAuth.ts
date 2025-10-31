/**
 * 飞书集成 - OAuth用户授权
 *
 * 处理飞书OAuth 2.0用户授权流程
 * 文件大小控制: < 300行
 */

import type { FeishuConfig, FeishuUserTokenResponse, OAuthTokenInfo } from './feishuTypes';
import { FeishuAPIError } from './feishuTypes';

/**
 * 飞书OAuth授权管理器
 */
export class FeishuOAuthManager {
  private config: FeishuConfig;
  private tokenInfo: OAuthTokenInfo | null = null;
  private readonly TOKEN_BUFFER_TIME = 5 * 60 * 1000; // 提前5分钟刷新
  private readonly STORAGE_KEY = 'feishu_oauth_token';
  private readonly STATE_STORAGE_KEY = 'feishu_oauth_state'; // CSRF防护state存储key

  constructor(config: FeishuConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || 'https://open.feishu.cn/open-apis',
      authMode: config.authMode || 'user',
      redirectUri: config.redirectUri || `${window.location.origin}/feishu-callback`,
    };

    // 尝试从localStorage恢复token
    this.loadTokenFromStorage();
  }

  /**
   * 生成OAuth授权URL
   */
  getAuthorizationUrl(state?: string): string {
    const stateValue = state || this.generateState();

    // 保存state到sessionStorage用于CSRF验证
    this.saveStateToStorage(stateValue);

    const params = new URLSearchParams({
      app_id: this.config.pluginId,
      redirect_uri: this.config.redirectUri!,
      state: stateValue,
    });

    return `https://open.feishu.cn/open-apis/authen/v1/authorize?${params.toString()}`;
  }

  /**
   * 使用授权码换取访问令牌
   */
  async exchangeCodeForToken(code: string): Promise<OAuthTokenInfo> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/authen/v1/oidc/access_token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${btoa(`${this.config.pluginId}:${this.config.pluginSecret}`)}`,
          },
          body: JSON.stringify({
            grant_type: 'authorization_code',
            code: code,
          }),
        }
      );

      if (!response.ok) {
        throw new FeishuAPIError(
          response.status,
          `HTTP请求失败: ${response.statusText}`
        );
      }

      const data: FeishuUserTokenResponse = await response.json();

      if (data.code !== 0 || !data.data) {
        throw new FeishuAPIError(
          data.code,
          data.msg || '获取用户访问令牌失败'
        );
      }

      const tokenInfo: OAuthTokenInfo = {
        accessToken: data.data.access_token,
        refreshToken: data.data.refresh_token,
        expiresAt: Date.now() + data.data.expires_in * 1000,
        tokenType: data.data.token_type,
      };

      // 保存token
      this.tokenInfo = tokenInfo;
      this.saveTokenToStorage();

      console.log('[FeishuOAuth] User access token obtained successfully');

      return tokenInfo;
    } catch (error) {
      console.error('[FeishuOAuth] Failed to exchange code for token:', error);
      throw error;
    }
  }

  /**
   * 使用refresh_token刷新访问令牌
   */
  async refreshAccessToken(): Promise<string> {
    if (!this.tokenInfo?.refreshToken) {
      throw new FeishuAPIError(-1, '没有refresh_token，请重新授权');
    }

    try {
      const response = await fetch(
        `${this.config.baseUrl}/authen/v1/oidc/refresh_access_token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${btoa(`${this.config.pluginId}:${this.config.pluginSecret}`)}`,
          },
          body: JSON.stringify({
            grant_type: 'refresh_token',
            refresh_token: this.tokenInfo.refreshToken,
          }),
        }
      );

      if (!response.ok) {
        throw new FeishuAPIError(
          response.status,
          `HTTP请求失败: ${response.statusText}`
        );
      }

      const data: FeishuUserTokenResponse = await response.json();

      if (data.code !== 0 || !data.data) {
        throw new FeishuAPIError(
          data.code,
          data.msg || '刷新访问令牌失败'
        );
      }

      // 更新token信息
      this.tokenInfo = {
        accessToken: data.data.access_token,
        refreshToken: data.data.refresh_token,
        expiresAt: Date.now() + data.data.expires_in * 1000,
        tokenType: data.data.token_type,
      };

      this.saveTokenToStorage();

      console.log('[FeishuOAuth] Access token refreshed successfully');

      return this.tokenInfo.accessToken;
    } catch (error) {
      console.error('[FeishuOAuth] Failed to refresh access token:', error);

      // 如果refresh失败，清除token，需要重新授权
      this.clearToken();
      throw error;
    }
  }

  /**
   * 获取当前有效的访问令牌
   */
  async getAccessToken(): Promise<string> {
    if (!this.tokenInfo) {
      throw new FeishuAPIError(-1, '未授权，请先进行用户授权');
    }

    // 检查token是否有效
    if (this.isTokenValid()) {
      return this.tokenInfo.accessToken;
    }

    // Token即将过期或已过期，尝试刷新
    return await this.refreshAccessToken();
  }

  /**
   * 检查token是否有效
   */
  private isTokenValid(): boolean {
    if (!this.tokenInfo) {
      return false;
    }

    const now = Date.now();
    return now < this.tokenInfo.expiresAt - this.TOKEN_BUFFER_TIME;
  }

  /**
   * 检查是否已授权
   */
  isAuthorized(): boolean {
    return this.tokenInfo !== null && this.isTokenValid();
  }

  /**
   * 清除token
   */
  clearToken(): void {
    this.tokenInfo = null;
    this.removeTokenFromStorage();
  }

  /**
   * 生成state参数（用于CSRF防护）
   */
  private generateState(): string {
    return `state_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  /**
   * 保存state到sessionStorage
   */
  private saveStateToStorage(state: string): void {
    try {
      sessionStorage.setItem(this.STATE_STORAGE_KEY, state);
      console.log('[FeishuOAuth] State saved for CSRF verification');
    } catch (error) {
      console.error('[FeishuOAuth] Failed to save state:', error);
    }
  }

  /**
   * 验证state参数（防止CSRF攻击）
   * @throws {FeishuAPIError} state验证失败时抛出错误
   */
  verifyState(receivedState: string | null): void {
    try {
      const savedState = sessionStorage.getItem(this.STATE_STORAGE_KEY);

      // 清除已保存的state（一次性使用）
      sessionStorage.removeItem(this.STATE_STORAGE_KEY);

      if (!savedState) {
        throw new FeishuAPIError(-1, 'CSRF验证失败：未找到已保存的state参数');
      }

      if (!receivedState) {
        throw new FeishuAPIError(-1, 'CSRF验证失败：回调中缺少state参数');
      }

      if (savedState !== receivedState) {
        throw new FeishuAPIError(-1, 'CSRF验证失败：state参数不匹配');
      }

      console.log('[FeishuOAuth] State verification passed');
    } catch (error) {
      if (error instanceof FeishuAPIError) {
        throw error;
      }
      console.error('[FeishuOAuth] State verification error:', error);
      throw new FeishuAPIError(-1, 'CSRF验证失败：state验证过程出错');
    }
  }

  /**
   * 保存token到localStorage
   */
  private saveTokenToStorage(): void {
    if (this.tokenInfo) {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.tokenInfo));
      } catch (error) {
        console.error('[FeishuOAuth] Failed to save token to storage:', error);
      }
    }
  }

  /**
   * 从localStorage加载token
   */
  private loadTokenFromStorage(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const tokenInfo = JSON.parse(saved) as OAuthTokenInfo;

        // 检查token是否过期
        if (Date.now() < tokenInfo.expiresAt) {
          this.tokenInfo = tokenInfo;
          console.log('[FeishuOAuth] Token loaded from storage');
        } else {
          console.log('[FeishuOAuth] Stored token expired, clearing');
          this.removeTokenFromStorage();
        }
      }
    } catch (error) {
      console.error('[FeishuOAuth] Failed to load token from storage:', error);
    }
  }

  /**
   * 从localStorage删除token
   */
  private removeTokenFromStorage(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('[FeishuOAuth] Failed to remove token from storage:', error);
    }
  }

  /**
   * 获取token剩余有效时间（毫秒）
   */
  getTokenRemainingTime(): number {
    if (!this.tokenInfo) {
      return 0;
    }

    const remaining = this.tokenInfo.expiresAt - Date.now();
    return Math.max(0, remaining);
  }

  /**
   * 更新配置
   */
  updateConfig(config: FeishuConfig): void {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || 'https://open.feishu.cn/open-apis',
      authMode: config.authMode || 'user',
      redirectUri: config.redirectUri || `${window.location.origin}/feishu-callback`,
    };
  }
}

/**
 * 处理OAuth回调
 * 从URL中提取code参数，并换取access_token
 */
export async function handleOAuthCallback(
  config: FeishuConfig
): Promise<OAuthTokenInfo> {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');

  if (!code) {
    throw new FeishuAPIError(-1, 'URL中缺少授权码(code)参数');
  }

  // 验证state参数防止CSRF攻击
  const oauthManager = new FeishuOAuthManager(config);
  oauthManager.verifyState(state);

  console.log('[FeishuOAuth] Received authorization code:', code, 'state:', state);

  return await oauthManager.exchangeCodeForToken(code);
}

/**
 * 启动OAuth授权流程
 * 跳转到飞书授权页面
 */
export function startOAuthFlow(config: FeishuConfig): void {
  const oauthManager = new FeishuOAuthManager(config);
  const authUrl = oauthManager.getAuthorizationUrl();

  console.log('[FeishuOAuth] Starting OAuth flow, redirecting to:', authUrl);

  // 跳转到授权页面
  window.location.href = authUrl;
}
