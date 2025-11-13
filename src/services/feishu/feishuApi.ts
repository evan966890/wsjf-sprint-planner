/**
 * 飞书集成 - API封装
 *
 * 封装飞书开放平台API调用
 * 文件大小控制: < 500行
 */

import { FeishuAuthManager } from './feishuAuth';
import type {
  FeishuConfig,
  FeishuProject,
  FeishuWorkItem,
  FeishuPagedResponse,
  FeishuProjectSpace,
} from './feishuTypes';
import { FeishuAPIError } from './feishuTypes';

/**
 * 飞书API客户端
 */
export class FeishuAPI {
  private authManager: FeishuAuthManager;
  private baseUrl: string;

  constructor(config: FeishuConfig) {
    this.authManager = new FeishuAuthManager(config);
    // 使用代理路径避免CORS问题
    const isDev = import.meta.env.DEV;

    if (isDev) {
      // 开发环境：使用Vite代理到本地服务器
      this.baseUrl = '/feishu-proxy';
    } else {
      // 生产环境：使用CloudBase云函数代理
      const proxyUrl = import.meta.env.VITE_FEISHU_PROXY_URL;
      if (proxyUrl) {
        this.baseUrl = proxyUrl;
        console.log('[FeishuAPI] Using proxy in production:', proxyUrl);
      } else {
        // 回退：直接调用（会有CORS问题）
        this.baseUrl = config.baseUrl || 'https://project.f.mioffice.cn';
        console.warn('[FeishuAPI] No proxy configured, may encounter CORS issues');
      }
    }
  }

  // ========== 认证相关 ==========

  /**
   * 获取访问令牌
   */
  async getAccessToken(): Promise<string> {
    return await this.authManager.getAccessToken();
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<boolean> {
    return await this.authManager.testConnection();
  }

  /**
   * 更新配置
   */
  updateConfig(config: FeishuConfig): void {
    this.authManager.updateConfig(config);
    this.baseUrl = config.baseUrl || 'https://project.f.mioffice.cn';
  }

  // ========== 项目空间API ==========

  /**
   * 获取项目空间列表
   * 注意：飞书API可能需要特定权限，如无权限可能返回空列表
   */
  async getProjectSpaces(): Promise<FeishuProjectSpace[]> {
    try {
      // 飞书项目空间API可能需要企业自建应用权限
      // 这里提供基础实现，实际使用时需要根据飞书API文档调整
      const response = await this.request<FeishuPagedResponse<FeishuProjectSpace>>(
        '/project/v1/project_space/list',
        {
          method: 'GET',
        }
      );

      return response.items || [];
    } catch (error) {
      console.error('[FeishuAPI] Failed to get project spaces:', error);
      // 如果没有项目空间权限，返回空数组而不是抛出错误
      if (error instanceof FeishuAPIError && error.code === 403) {
        return [];
      }
      throw error;
    }
  }

  // ========== 项目API ==========

  /**
   * 获取项目列表
   * 飞书项目平台结构：空间→工作项，没有"获取所有空间"的API
   * 需要用户提供已知的空间simple_name
   */
  async getProjects(_params?: {
    space_id?: string;
    page_size?: number;
    page_token?: string;
  }): Promise<FeishuPagedResponse<FeishuProject>> {
    try {
      // 临时Mock模式 - 用于测试流程
      const { ENABLE_MOCK, getProjectsFromMockData } = await import('./mockFeishuData');
      if (ENABLE_MOCK) {
        console.log('[FeishuAPI] Using Mock data for testing');
        const projects = getProjectsFromMockData();
        return {
          items: projects,
          has_more: false,
          total: projects.length,
        };
      }

      // 根据官方文档和PowerShell测试成功的端点
      // /open_api/projects/detail (POST)
      const config = this.authManager.getConfig();
      const knownSpaces = ['mit', 'minrd']; // 已知的空间simple_name

      console.log('[FeishuAPI] Fetching projects from /open_api/projects/detail');

      const response = await this.request<any>(
        '/open_api/projects/detail',
        {
          method: 'POST',
          body: JSON.stringify({
            simple_names: knownSpaces,
            user_key: config.userKey || '',
          }),
        }
      );

      console.log('[FeishuAPI] Projects detail response:', response);

      // response已经被request函数解析，是data.data的值
      // 格式：{ [project_key]: {...} }
      if (response && typeof response === 'object' && !Array.isArray(response)) {
        const projects = Object.values(response).map((p: any) => ({
          id: p.project_key || p._id,
          name: p.name,
          simple_name: p.simple_name,
          description: p.description || '',
          status: 'active' as const,
          space_id: '',
          created_at: p.created_at || Date.now() / 1000,
          updated_at: p.updated_at || Date.now() / 1000,
        }));

        console.log('[FeishuAPI] Parsed projects:', projects);

        return {
          items: projects,
          has_more: false,
          total: projects.length,
        };
      }

      throw new Error('Unexpected response format from /open_api/projects/detail');

    } catch (error) {
      console.error('[FeishuAPI] Failed to get projects:', error);
      throw error;
    }
  }


  /**
   * 获取所有项目（自动处理分页）
   */
  async getAllProjects(spaceId?: string): Promise<FeishuProject[]> {
    const allProjects: FeishuProject[] = [];
    let pageToken: string | undefined;
    let hasMore = true;

    while (hasMore) {
      const response = await this.getProjects({
        space_id: spaceId,
        page_size: 100,
        page_token: pageToken,
      });

      allProjects.push(...response.items);
      hasMore = response.has_more;
      pageToken = response.page_token;

      // 防止无限循环
      if (!hasMore || !pageToken) {
        break;
      }
    }

    return allProjects;
  }

  /**
   * 获取项目详情
   */
  async getProjectDetail(projectId: string): Promise<FeishuProject> {
    try {
      const response = await this.request<FeishuProject>(
        `/project/v1/project/${projectId}`,
        {
          method: 'GET',
        }
      );

      return response;
    } catch (error) {
      console.error('[FeishuAPI] Failed to get project detail:', error);
      throw error;
    }
  }

  // ========== 工作项API ==========

  /**
   * 获取工作项类型列表
   */
  async getWorkItemTypes(projectKey: string): Promise<any[]> {
    try {
      const endpoint = `/open_api/${projectKey}/work_item/types`;

      console.log('[FeishuAPI] Fetching work item types from:', endpoint);

      const response = await this.request<any>(
        endpoint,
        {
          method: 'GET',
        }
      );

      console.log('[FeishuAPI] Work item types response:', response);

      const types = response.work_item_types || response.types || [];
      return types;
    } catch (error) {
      console.error('[FeishuAPI] Failed to get work item types:', error);
      return [];
    }
  }

  /**
   * 获取工作项列表
   * 根据API文档格式：/open_api/:project_key/work_item/filter
   */
  async getWorkItems(params: {
    project_id: string;
    page_size?: number;
    page_token?: string;
    work_item_type_id?: string;
  }): Promise<FeishuPagedResponse<FeishuWorkItem>> {
    try {
      const endpoint = `/open_api/${params.project_id}/work_item/filter`;

      // 使用官方Postman模板中的正确格式
      const body: any = {
        work_item_type_keys: [params.work_item_type_id || 'story'], // 注意：复数keys，数组格式
        page_num: params.page_token ? parseInt(params.page_token) : 1,
        page_size: params.page_size || 100,
        expand: {
          need_workflow: true,
          relation_fields_detail: true,
          need_multi_text: true,
          need_user_detail: true,
          need_sub_task_parent: true
        }
      };

      console.log('[FeishuAPI] Fetching work items from:', endpoint);
      console.log('[FeishuAPI] Request body (official format):', JSON.stringify(body, null, 2));

      const response = await this.request<any>(
        endpoint,
        {
          method: 'POST',
          body: JSON.stringify(body),
        }
      );

      console.log('[FeishuAPI] Work items response:', response);

      // 适配响应格式：response可能直接是数组，也可能是包含items的对象
      let items: any[];
      if (Array.isArray(response)) {
        items = response; // response直接是数组（官方API格式）
        console.log('[FeishuAPI] Response is array, items count:', items.length);
      } else {
        items = response.work_items || response.items || response.data || [];
        console.log('[FeishuAPI] Response is object, extracted items count:', items.length);
      }

      return {
        items,
        has_more: response.has_more || false,
        total: response.total || items.length,
        page_token: response.page_num ? String(response.page_num + 1) : undefined,
      };
    } catch (error) {
      console.error('[FeishuAPI] Failed to get work items:', error);
      throw error;
    }
  }

  /**
   * 获取所有工作项（自动处理分页）
   */
  async getAllWorkItems(
    projectId: string,
    onProgress?: (current: number, total?: number) => void,
    workItemTypeName?: string
  ): Promise<FeishuWorkItem[]> {
    // Mock模式：使用测试数据
    const { ENABLE_MOCK } = await import('./mockFeishuData');
    if (ENABLE_MOCK) {
      console.log('[FeishuAPI] Using Mock work items for testing');
      const { getMockWorkItems } = await import('./mockWorkItems');
      const mockItems = getMockWorkItems();
      return mockItems as any;
    }

    // 使用用户指定的工作项类型名称（如：story、bug、task）
    const typeName = workItemTypeName || 'story';
    console.log('[FeishuAPI] Using work item type name:', typeName);

    const allWorkItems: FeishuWorkItem[] = [];
    let pageToken: string | undefined;
    let hasMore = true;

    while (hasMore) {
      const response = await this.getWorkItems({
        project_id: projectId,
        page_size: 100,
        page_token: pageToken,
        work_item_type_id: typeName, // 直接使用类型名称
      });

      allWorkItems.push(...response.items);
      hasMore = response.has_more;
      pageToken = response.page_token;

      // 调用进度回调
      if (onProgress) {
        onProgress(allWorkItems.length, response.total);
      }

      // 防止无限循环
      if (!hasMore || !pageToken) {
        break;
      }

      // 添加短暂延迟，避免请求过于频繁
      await this.delay(100);
    }

    return allWorkItems;
  }

  /**
   * 获取工作项详情
   */
  async getWorkItemDetail(workItemId: string): Promise<FeishuWorkItem> {
    try {
      const response = await this.request<FeishuWorkItem>(
        `/project/v1/work_item/${workItemId}`,
        {
          method: 'GET',
        }
      );

      return response;
    } catch (error) {
      console.error('[FeishuAPI] Failed to get work item detail:', error);
      throw error;
    }
  }

  // ========== 通用请求方法 ==========

  /**
   * 通用API请求方法
   */
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    try {
      // 获取访问令牌
      const token = await this.authManager.getAccessToken();
      const config = this.authManager.getConfig();

      // 构建完整URL
      const url = endpoint.startsWith('http')
        ? endpoint
        : `${this.baseUrl}${endpoint}`;

      // 构建headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options?.headers as Record<string, string>,
      };

      // Cookie模式：不添加任何认证header，依赖浏览器Cookie
      if (config.manualToken === 'cookie') {
        console.log('[FeishuAPI] Using Cookie authentication (no auth header)');
        // 不添加任何认证header
      } else if (config.usePluginHeader) {
        // 飞书项目插件模式：X-Plugin-Token + X-User-Key
        // 根据错误20039，plugin_access_token必须配合User Key使用
        headers['X-Plugin-Token'] = token;
        if (config.userKey) {
          headers['X-User-Key'] = config.userKey;
          console.log('[FeishuAPI] Using Plugin Token + User Key authentication');
        } else {
          console.warn('[FeishuAPI] Warning: Plugin Token without User Key (may fail)');
        }
      } else {
        // 标准OAuth模式：使用Authorization Bearer
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log('[FeishuAPI] Request:', {
        url,
        method: options?.method || 'GET',
        headers: { ...headers, 'X-Plugin-Token': headers['X-Plugin-Token'] ? headers['X-Plugin-Token'].substring(0, 20) + '...' : undefined },
        useProxy: this.baseUrl.includes('feishu-proxy'),
      });

      // 发起请求
      // Cookie模式需要发送credentials以包含Cookie
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: config.manualToken === 'cookie' ? 'include' : 'same-origin',
      });

      console.log('[FeishuAPI] Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        url: response.url,
      });

      // 检查HTTP状态
      if (!response.ok) {
        // 尝试读取错误响应
        const errorText = await response.text();
        console.error('[FeishuAPI] Error response:', errorText.substring(0, 500));

        throw new FeishuAPIError(
          response.status,
          `HTTP请求失败: ${response.statusText}`
        );
      }

      // 尝试解析响应
      const responseText = await response.text();
      console.log('[FeishuAPI] Response body:', responseText.substring(0, 500));

      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('[FeishuAPI] JSON parse failed:', responseText.substring(0, 200));
        throw new FeishuAPIError(
          -1,
          'API返回的不是有效的JSON格式'
        );
      }

      // 飞书项目OpenAPI格式：{err_code: 0, data: {...}}
      if ('err_code' in data) {
        console.log('[FeishuAPI] Using Feishu Project OpenAPI format (err_code)');
        if (data.err_code !== 0) {
          throw new FeishuAPIError(
            data.err_code,
            data.err_msg || data.err?.msg || '飞书项目API调用失败',
            data
          );
        }
        return data.data as T;
      }

      // 飞书项目平台格式：{statusCode: 0, data: {value: [...]}}
      if ('statusCode' in data) {
        console.log('[FeishuAPI] Using Feishu Project format (statusCode)');
        if (data.statusCode !== 0) {
          throw new FeishuAPIError(
            data.statusCode,
            data.message || '飞书项目API调用失败',
            data
          );
        }
        return data.data as T;
      }

      // 标准飞书API格式：{code: 0, data: {...}}
      if ('code' in data) {
        console.log('[FeishuAPI] Using standard Feishu format (code)');
        if (data.code !== 0) {
          throw new FeishuAPIError(
            data.code,
            data.msg || '飞书API调用失败',
            data
          );
        }
        return data.data as T;
      }

      // 未知格式
      console.warn('[FeishuAPI] Unknown response format:', data);
      throw new FeishuAPIError(
        -1,
        '未知的API响应格式'
      );
    } catch (error) {
      console.error('[FeishuAPI] Request failed:', error);

      // 重新抛出FeishuAPIError
      if (error instanceof FeishuAPIError) {
        throw error;
      }

      // 网络错误
      if (error instanceof TypeError) {
        throw new FeishuAPIError(
          -1,
          `网络请求失败: ${error.message}`
        );
      }

      // 其他错误
      throw new FeishuAPIError(
        -1,
        `未知错误: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }

  /**
   * 延迟函数（用于避免请求过于频繁）
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ========== 批量操作 ==========

  /**
   * 批量获取工作项详情
   */
  async batchGetWorkItems(
    workItemIds: string[],
    onProgress?: (current: number, total: number) => void
  ): Promise<FeishuWorkItem[]> {
    const workItems: FeishuWorkItem[] = [];

    for (let i = 0; i < workItemIds.length; i++) {
      try {
        const workItem = await this.getWorkItemDetail(workItemIds[i]);
        workItems.push(workItem);

        if (onProgress) {
          onProgress(i + 1, workItemIds.length);
        }

        // 添加短暂延迟，避免请求过于频繁
        if (i < workItemIds.length - 1) {
          await this.delay(100);
        }
      } catch (error) {
        console.error(`[FeishuAPI] Failed to get work item ${workItemIds[i]}:`, error);
        // 继续处理下一个，不中断整个流程
      }
    }

    return workItems;
  }
}

/**
 * 处理飞书API错误
 */
export function handleFeishuError(
  error: unknown,
  showToast?: (message: string, type: 'success' | 'error' | 'info') => void
): void {
  let errorMessage = '未知错误';

  if (error instanceof FeishuAPIError) {
    switch (error.code) {
      case 401:
      case 10014: // app_access_token invalid
        errorMessage = '飞书认证失败，请检查Plugin ID和Secret是否正确';
        break;
      case 403:
      case 10016: // app permission denied
        errorMessage = '权限不足，请检查飞书应用权限配置';
        break;
      case 404:
        errorMessage = '资源不存在，请刷新后重试';
        break;
      case 429:
        errorMessage = '请求过于频繁，请稍后重试';
        break;
      case 500:
      case 99991692: // system error
        errorMessage = '飞书服务异常，请稍后重试';
        break;
      default:
        errorMessage = `飞书API错误 (${error.code}): ${error.message}`;
    }
  } else if (error instanceof TypeError) {
    errorMessage = '网络连接失败，请检查网络';
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  console.error('[FeishuAPI] Error:', error);

  if (showToast) {
    showToast(errorMessage, 'error');
  }
}
