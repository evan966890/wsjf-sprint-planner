/**
 * 飞书集成 - 字段映射工具
 *
 * 处理飞书字段到WSJF字段的映射配置和管理
 * 文件大小控制: < 300行
 */

import type { Requirement } from '../../types';
import type { FeishuWorkItem, FeishuWorkItemStatus, FeishuWorkItemPriority } from '../../services/feishu';
import type { TechProgressStatus, ProductProgressStatus } from '../../types/techProgress';

/**
 * 字段映射配置
 */
export interface FieldMapping {
  feishuField: string;                    // 飞书字段路径（支持嵌套，如 creator.name）
  wsjfField: keyof Requirement;           // WSJF字段名
  transform?: (value: any, workItem: FeishuWorkItem) => any;  // 转换函数
  required?: boolean;                     // 是否必填
  defaultValue?: any;                     // 默认值
}

/**
 * 映射模板
 */
export interface MappingTemplate {
  id: string;
  name: string;
  description: string;
  mappings: FieldMapping[];
  createdAt: string;
  updatedAt: string;
}

/**
 * 飞书状态 → WSJF技术进度映射
 */
export function mapFeishuStatusToTechProgress(status: FeishuWorkItemStatus): TechProgressStatus {
  const statusMap: Record<FeishuWorkItemStatus, TechProgressStatus> = {
    'to_do': '待评估',
    'in_progress': '已评估工作量',
    'testing': '已完成技术方案',
    'done': '已完成技术方案',
    'blocked': '待评估',
    'cancelled': '待评估',
  };

  return statusMap[status] || '待评估';
}

/**
 * 飞书状态 → WSJF产品进度映射
 */
export function mapFeishuStatusToProductProgress(status: FeishuWorkItemStatus): ProductProgressStatus {
  const statusMap: Record<FeishuWorkItemStatus, ProductProgressStatus> = {
    'to_do': '待评估',
    'in_progress': '需求评审中',
    'testing': '开发中',
    'done': '已完成',
    'blocked': '待评估',
    'cancelled': '待评估',
  };

  return statusMap[status] || '待评估';
}

/**
 * 飞书优先级 → 业务影响度评分（参考值）
 */
export function mapFeishuPriorityToBusinessImpact(priority?: FeishuWorkItemPriority): number {
  if (!priority) return 5; // 默认中等影响

  const priorityMap: Record<FeishuWorkItemPriority, number> = {
    'urgent': 9,   // 紧急 → 高影响
    'high': 7,     // 高 → 较高影响
    'medium': 5,   // 中 → 中等影响
    'low': 3,      // 低 → 较低影响
  };

  return priorityMap[priority] || 5;
}

/**
 * 预定义的字段映射规则（默认模板）
 */
export const DEFAULT_FIELD_MAPPINGS: FieldMapping[] = [
  // 基本信息
  {
    feishuField: 'name',
    wsjfField: 'name',
    required: true,
  },
  {
    feishuField: 'description',
    wsjfField: 'description',
  },

  // 提交人信息
  {
    feishuField: 'creator.name',
    wsjfField: 'submitterName',
    required: true,
    defaultValue: '飞书用户',
  },
  {
    feishuField: 'created_at',
    wsjfField: 'submitDate',
    transform: (timestamp: number) => {
      return new Date(timestamp * 1000).toISOString().split('T')[0];
    },
    required: true,
  },

  // 时间相关
  {
    feishuField: 'due_date',
    wsjfField: 'deadlineDate',
    transform: (timestamp: number) => {
      return timestamp ? new Date(timestamp * 1000).toISOString().split('T')[0] : undefined;
    },
  },
  {
    feishuField: 'due_date',
    wsjfField: 'hardDeadline',
    transform: (timestamp: number) => !!timestamp,
    defaultValue: false,
  },

  // 工作量
  {
    feishuField: 'estimated_hours',
    wsjfField: 'effortDays',
    transform: (hours: number) => {
      // 8小时 = 1天
      return hours ? Math.ceil(hours / 8) : 1;
    },
    defaultValue: 1,
  },

  // 负责人
  {
    feishuField: 'assignee.name',
    wsjfField: 'productManager',
    defaultValue: '待分配',
  },
  {
    feishuField: 'assignee.name',
    wsjfField: 'developer',
    defaultValue: '待分配',
  },

  // 状态映射
  {
    feishuField: 'status',
    wsjfField: 'techProgress',
    transform: (status: FeishuWorkItemStatus) => mapFeishuStatusToTechProgress(status),
    defaultValue: '待评估',
  },
  {
    feishuField: 'status',
    wsjfField: 'productProgress',
    transform: (status: FeishuWorkItemStatus) => mapFeishuStatusToProductProgress(status),
    defaultValue: '待评估',
  },

  // 类型（使用工作项类型名称）
  {
    feishuField: 'work_item_type.name',
    wsjfField: 'type',
    defaultValue: '功能需求',
  },
];

/**
 * 从嵌套对象中获取值（支持路径如 'creator.name'）
 */
export function getNestedValue(obj: any, path: string): any {
  if (!path) return undefined;

  return path.split('.').reduce((current, key) => {
    return current?.[key];
  }, obj);
}

/**
 * 保存映射模板到localStorage
 */
export function saveMappingTemplate(template: MappingTemplate): void {
  try {
    const templates = loadMappingTemplates();
    const existingIndex = templates.findIndex(t => t.id === template.id);

    if (existingIndex >= 0) {
      templates[existingIndex] = {
        ...template,
        updatedAt: new Date().toISOString(),
      };
    } else {
      templates.push(template);
    }

    localStorage.setItem('feishu_mapping_templates', JSON.stringify(templates));
  } catch (error) {
    console.error('[FeishuFieldMapper] Failed to save mapping template:', error);
    throw new Error('保存映射模板失败');
  }
}

/**
 * 加载所有映射模板
 */
export function loadMappingTemplates(): MappingTemplate[] {
  try {
    const saved = localStorage.getItem('feishu_mapping_templates');
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('[FeishuFieldMapper] Failed to load mapping templates:', error);
    return [];
  }
}

/**
 * 删除映射模板
 */
export function deleteMappingTemplate(templateId: string): void {
  try {
    const templates = loadMappingTemplates();
    const filtered = templates.filter(t => t.id !== templateId);
    localStorage.setItem('feishu_mapping_templates', JSON.stringify(filtered));
  } catch (error) {
    console.error('[FeishuFieldMapper] Failed to delete mapping template:', error);
    throw new Error('删除映射模板失败');
  }
}

/**
 * 创建默认映射模板
 */
export function createDefaultTemplate(): MappingTemplate {
  return {
    id: `template_${Date.now()}`,
    name: '默认映射模板',
    description: '飞书工作项到WSJF需求的标准映射',
    mappings: DEFAULT_FIELD_MAPPINGS,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
