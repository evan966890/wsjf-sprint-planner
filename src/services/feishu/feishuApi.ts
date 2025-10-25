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
  FeishuAPIResponse,
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
    this.baseUrl = config.baseUrl || 'https://open.feishu.cn/open-apis';
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
    this.baseUrl = config.baseUrl || 'https://open.feishu.cn/open-apis';
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
   */
  async getProjects(params?: {
    space_id?: string;
    page_size?: number;
    page_token?: string;
  }): Promise<FeishuPagedResponse<FeishuProject>> {
    try {
      const queryParams = new URLSearchParams();

      if (params?.space_id) {
        queryParams.append('space_id', params.space_id);
      }

      if (params?.page_size) {
        queryParams.append('page_size', params.page_size.toString());
      }

      if (params?.page_token) {
        queryParams.append('page_token', params.page_token);
      }

      const endpoint = `/project/v1/project?${queryParams.toString()}`;

      const response = await this.request<FeishuPagedResponse<FeishuProject>>(
        endpoint,
        {
          method: 'GET',
        }
      );

      return response;
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
   * 获取工作项列表
   */
  async getWorkItems(params: {
    project_id: string;
    page_size?: number;
    page_token?: string;
    work_item_type_id?: string;
  }): Promise<FeishuPagedResponse<FeishuWorkItem>> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('project_id', params.project_id);

      if (params.page_size) {
        queryParams.append('page_size', params.page_size.toString());
      }

      if (params.page_token) {
        queryParams.append('page_token', params.page_token);
      }

      if (params.work_item_type_id) {
        queryParams.append('work_item_type_id', params.work_item_type_id);
      }

      const endpoint = `/project/v1/work_item/list?${queryParams.toString()}`;

      const response = await this.request<FeishuPagedResponse<FeishuWorkItem>>(
        endpoint,
        {
          method: 'GET',
        }
      );

      return response;
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
    onProgress?: (current: number, total?: number) => void
  ): Promise<FeishuWorkItem[]> {
    const allWorkItems: FeishuWorkItem[] = [];
    let pageToken: string | undefined;
    let hasMore = true;

    while (hasMore) {
      const response = await this.getWorkItems({
        project_id: projectId,
        page_size: 100,
        page_token: pageToken,
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

      // 构建完整URL
      const url = endpoint.startsWith('http')
        ? endpoint
        : `${this.baseUrl}${endpoint}`;

      // 发起请求
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      // 检查HTTP状态
      if (!response.ok) {
        throw new FeishuAPIError(
          response.status,
          `HTTP请求失败: ${response.statusText}`
        );
      }

      // 解析响应
      const data: FeishuAPIResponse<T> = await response.json();

      // 检查飞书API错误码
      if (data.code !== 0) {
        throw new FeishuAPIError(
          data.code,
          data.msg || '飞书API调用失败',
          data
        );
      }

      // 返回数据
      return data.data as T;
    } catch (error) {
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
