/**
 * 飞书项目 MCP 服务
 *
 * 功能：
 * - 通过 MCP 连接飞书项目
 * - 查询工作项（Story）数据
 * - 转换飞书数据为 WSJF 格式
 * - 支持增量同步
 *
 * @requires mcp-feishu-proj MCP 服务器
 */

import type { Requirement } from '../types';
import { TECH_PROGRESS, PRODUCT_PROGRESS } from '../constants/techProgress';

/**
 * 飞书工作项数据结构
 */
export interface FeishuStory {
  id: string;
  name: string;
  description?: string;
  status?: string;
  priority?: string;

  // 自定义字段
  fields?: Record<string, any>;

  // 时间字段
  created_at?: string;
  updated_at?: string;

  // 关联字段
  owner?: {
    id: string;
    name: string;
  };
  creator?: {
    id: string;
    name: string;
  };
}

/**
 * 飞书查询选项
 */
export interface FeishuQueryOptions {
  viewName?: string;      // 视图名称
  status?: string[];      // 过滤状态
  priority?: string[];    // 过滤优先级
  limit?: number;         // 返回数量
  offset?: number;        // 分页偏移
  updatedAfter?: string;  // 增量同步：仅返回此时间后更新的
}

/**
 * 字段映射配置
 * 定义飞书字段如何映射到 WSJF 字段
 */
export interface FieldMapping {
  // 飞书字段名
  feishuField: string;
  // WSJF 字段名
  wsjfField: keyof Requirement;
  // 转换函数（可选）
  transform?: (value: any) => any;
}

/**
 * 默认字段映射规则
 */
export const DEFAULT_FIELD_MAPPINGS: FieldMapping[] = [
  // 基础字段
  { feishuField: 'name', wsjfField: 'name' },
  { feishuField: 'description', wsjfField: 'description' },

  // 评分字段
  {
    feishuField: 'business_value',
    wsjfField: 'businessImpactScore',
    transform: (val) => Number(val) || undefined
  },
  {
    feishuField: 'complexity',
    wsjfField: 'complexityScore',
    transform: (val) => Number(val) || undefined
  },
  {
    feishuField: 'effort_days',
    wsjfField: 'effortDays',
    transform: (val) => Number(val) || 5
  },

  // 人员字段
  {
    feishuField: 'owner',
    wsjfField: 'developer',
    transform: (val) => val?.name || ''
  },
  {
    feishuField: 'creator',
    wsjfField: 'submitterName',
    transform: (val) => val?.name || ''
  },

  // 日期字段
  {
    feishuField: 'created_at',
    wsjfField: 'submitDate',
    transform: (val) => val ? new Date(val).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  },

  // 状态映射
  {
    feishuField: 'status',
    wsjfField: 'techProgress',
    transform: (val) => mapFeishuStatusToTechProgress(val)
  },
];

/**
 * 映射飞书状态到技术进展
 */
function mapFeishuStatusToTechProgress(status?: string): string {
  const statusMap: Record<string, string> = {
    '待评审': TECH_PROGRESS.PENDING,
    '评审中': TECH_PROGRESS.PENDING,
    '设计中': TECH_PROGRESS.DESIGN_IN_PROGRESS,
    '开发中': TECH_PROGRESS.DEVELOPING,
    '已完成': TECH_PROGRESS.DESIGN_COMPLETED,
    '已上线': TECH_PROGRESS.ONLINE,
  };

  return statusMap[status || ''] || TECH_PROGRESS.NOT_EVALUATED;
}

/**
 * 飞书 MCP 服务类
 */
export class FeishuMCPService {
  private mcpAvailable: boolean = false;

  constructor() {
    this.checkMCPAvailability();
  }

  /**
   * 检查 MCP 是否可用
   */
  private async checkMCPAvailability(): Promise<boolean> {
    try {
      // 尝试调用 MCP 工具（这里需要实际的 MCP 调用）
      // 由于 MCP 在浏览器环境中不直接可用，我们需要通过后端代理

      // 临时：假设 MCP 可用（实际使用时需要真实检查）
      this.mcpAvailable = true;
      return true;
    } catch (error) {
      console.error('[FeishuMCP] MCP 不可用:', error);
      this.mcpAvailable = false;
      return false;
    }
  }

  /**
   * 查询飞书工作项
   * 通过后端代理调用 MCP
   */
  async queryStories(options: FeishuQueryOptions = {}): Promise<FeishuStory[]> {
    if (!this.mcpAvailable) {
      throw new Error('MCP 服务不可用。请确保已正确配置 mcp-feishu-proj。');
    }

    try {
      const API_BASE_URL = '/api';  // 使用相对路径，通过 Vite 代理

      console.log('[FeishuMCP] 通过代理查询飞书工作项:', options);

      // 调用后端代理 API
      const response = await fetch(`${API_BASE_URL}/feishu/query-stories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          viewName: options.viewName || '国际销服数字化全集',
          status: options.status,
          priority: options.priority,
          limit: options.limit || 50,
          offset: options.offset || 0,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '查询失败');
      }

      console.log(`[FeishuMCP] 查询成功，获取 ${result.data.length} 条工作项`);

      // 转换为 FeishuStory 格式
      return result.data as FeishuStory[];
    } catch (error) {
      console.error('[FeishuMCP] 查询失败:', error);

      // 如果后端未启动，返回友好提示
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('无法连接到 MCP 代理服务器。请确保后端服务已启动（npm run server）。');
      }

      throw new Error(`查询飞书工作项失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 转换飞书工作项为 WSJF 需求
   */
  convertStoryToRequirement(
    story: FeishuStory,
    mappings: FieldMapping[] = DEFAULT_FIELD_MAPPINGS
  ): Requirement {
    // 基础需求对象
    const requirement: Partial<Requirement> = {
      id: `FS-${story.id}`,

      // 默认值
      submitter: '产品',
      businessTeam: '',
      businessDomain: '新零售',
      type: '功能开发',
      productManager: '',
      productProgress: PRODUCT_PROGRESS.PENDING,
      hardDeadline: false,
      isRMS: false,
    };

    // 应用字段映射
    mappings.forEach(mapping => {
      let value: any;

      // 从 story 或 story.fields 中获取值
      if (story.hasOwnProperty(mapping.feishuField)) {
        value = (story as any)[mapping.feishuField];
      } else if (story.fields && story.fields[mapping.feishuField] !== undefined) {
        value = story.fields[mapping.feishuField];
      }

      // 应用转换函数
      if (value !== undefined) {
        const transformedValue = mapping.transform ? mapping.transform(value) : value;
        (requirement as any)[mapping.wsjfField] = transformedValue;
      }
    });

    // 生成唯一ID（如果还没有）
    if (!requirement.id) {
      requirement.id = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // 添加飞书来源标记
    (requirement as any)._source = 'feishu';
    (requirement as any)._feishuId = story.id;
    (requirement as any)._feishuUpdatedAt = story.updated_at;

    return requirement as Requirement;
  }

  /**
   * 批量转换
   */
  convertStoriesToRequirements(
    stories: FeishuStory[],
    mappings?: FieldMapping[]
  ): Requirement[] {
    return stories.map(story => this.convertStoryToRequirement(story, mappings));
  }

  /**
   * 增量同步
   * 根据最后同步时间，只获取更新的工作项
   */
  async syncUpdatedStories(lastSyncTime: string): Promise<Requirement[]> {
    try {
      const API_BASE_URL = '/api';  // 使用相对路径，通过 Vite 代理

      console.log('[FeishuMCP] 增量同步，最后同步时间:', lastSyncTime);

      const response = await fetch(`${API_BASE_URL}/feishu/sync-updates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lastSyncTime }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '同步失败');
      }

      const stories = result.data as FeishuStory[];
      console.log(`[FeishuMCP] 同步成功，获取 ${stories.length} 条更新`);

      return this.convertStoriesToRequirements(stories);
    } catch (error) {
      console.error('[FeishuMCP] 同步失败:', error);

      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('无法连接到 MCP 代理服务器。请确保后端服务已启动（npm run server）。');
      }

      throw new Error(`增量同步失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
}

/**
 * 全局单例实例
 */
export const feishuMCPService = new FeishuMCPService();
