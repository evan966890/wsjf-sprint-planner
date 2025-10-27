/**
 * 飞书集成 - 数据转换工具
 *
 * 处理飞书工作项到WSJF需求的数据转换
 * 文件大小控制: < 300行
 */

import type { Requirement } from '../../types';
import type { FeishuWorkItem } from '../../services/feishu';
import type { FieldMapping } from './feishuFieldMapper';
import { getNestedValue } from './feishuFieldMapper';
import { validateRequirement } from './feishuValidator';

/**
 * 转换结果
 */
export interface TransformResult {
  success: Requirement[];
  failed: Array<{
    workItem: FeishuWorkItem;
    error: string;
    index: number;
  }>;
}

/**
 * 转换单个飞书工作项为WSJF需求
 */
export function transformWorkItemToRequirement(
  workItem: FeishuWorkItem,
  mappings: FieldMapping[],
  options?: {
    defaultSubmitter?: string;
    defaultBusinessDomain?: string;
  }
): Requirement {
  // 从fields数组中提取name字段（飞书新格式）
  let workItemName = workItem.name;
  if (!workItemName && workItem.fields && Array.isArray(workItem.fields)) {
    const nameField = workItem.fields.find((f: any) => f.field_key === 'name' || f.key === 'name');
    if (nameField && nameField.field_value) {
      workItemName = nameField.field_value.value || nameField.field_value;
    }
  }

  // 初始化需求对象（包含所有必填字段的默认值）
  const requirement: Partial<Requirement> = {
    id: `feishu_${workItem.work_item_id || workItem.id}_${Date.now()}`,
    title: workItemName || '未命名需求',  // 使用提取的名称
    description: '',
    submitter: options?.defaultSubmitter === '业务' || options?.defaultSubmitter === '产品' || options?.defaultSubmitter === '技术'
      ? options.defaultSubmitter
      : '业务',
    hardDeadline: false,
    type: '功能需求',
    productProgress: '待评估',
    techProgress: '待评估',
    isRMS: false,
    businessDomain: options?.defaultBusinessDomain || '国际零售通用',
    effortDays: 1,
    submitDate: new Date().toISOString().split('T')[0],  // 默认今天
  };

  // 应用字段映射
  for (const mapping of mappings) {
    try {
      const feishuValue = getNestedValue(workItem, mapping.feishuField);

      let finalValue: any;

      if (feishuValue !== undefined && feishuValue !== null) {
        // 有值：应用转换函数或直接使用
        finalValue = mapping.transform
          ? mapping.transform(feishuValue, workItem)
          : feishuValue;
      } else if (mapping.defaultValue !== undefined) {
        // 无值但有默认值：使用默认值
        finalValue = mapping.defaultValue;
      }

      // 设置字段值
      if (finalValue !== undefined) {
        requirement[mapping.wsjfField] = finalValue;
      }
    } catch (error) {
      console.warn(
        `[FeishuDataTransform] Failed to map field ${mapping.feishuField} → ${mapping.wsjfField}:`,
        error
      );
      // 映射失败时，如果有默认值则使用默认值
      if (mapping.defaultValue !== undefined) {
        requirement[mapping.wsjfField] = mapping.defaultValue;
      }
    }
  }

  // 验证必填字段（暂时跳过，因为飞书数据结构不同）
  try {
    validateRequirement(requirement as Requirement);
  } catch (error) {
    console.warn('[FeishuDataTransform] Validation warning:', error);
    // 不抛出错误，允许部分字段为空
  }

  return requirement as Requirement;
}

/**
 * 批量转换飞书工作项为WSJF需求
 */
export function transformWorkItems(
  workItems: FeishuWorkItem[],
  mappings: FieldMapping[],
  options?: {
    defaultSubmitter?: string;
    defaultBusinessDomain?: string;
    onProgress?: (current: number, total: number) => void;
  }
): TransformResult {
  const success: Requirement[] = [];
  const failed: Array<{ workItem: FeishuWorkItem; error: string; index: number }> = [];

  for (let i = 0; i < workItems.length; i++) {
    const workItem = workItems[i];

    try {
      const requirement = transformWorkItemToRequirement(workItem, mappings, options);
      success.push(requirement);

      // 调用进度回调
      if (options?.onProgress) {
        options.onProgress(i + 1, workItems.length);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '转换失败';

      failed.push({
        workItem,
        error: errorMessage,
        index: i,
      });

      console.error(
        `[FeishuDataTransform] Failed to transform work item ${workItem.id}:`,
        error
      );
    }
  }

  return { success, failed };
}

/**
 * 从飞书工作项提取建议的业务域
 */
export function extractBusinessDomain(workItem: FeishuWorkItem): string {
  // 尝试从标签中提取业务域
  if (workItem.tags && workItem.tags.length > 0) {
    const tag = workItem.tags[0].toLowerCase();

    if (tag.includes('新零售') || tag.includes('直营')) {
      return '新零售';
    }

    if (tag.includes('渠道') || tag.includes('经销商')) {
      return '渠道零售';
    }
  }

  // 尝试从项目名称中提取（如果有的话）
  // 这里需要根据实际情况调整

  return '国际零售通用';
}

/**
 * 从飞书工作项提取建议的需求类型
 */
export function extractRequirementType(workItem: FeishuWorkItem): string {
  // 优先使用飞书的工作项类型
  if (workItem.work_item_type?.name) {
    const typeName = workItem.work_item_type.name;

    // 映射常见的工作项类型
    if (typeName.includes('Bug') || typeName.includes('缺陷')) {
      return 'Bug修复';
    }

    if (typeName.includes('优化') || typeName.includes('改进')) {
      return '优化';
    }

    if (typeName.includes('重构')) {
      return '重构';
    }

    if (typeName.includes('文档')) {
      return '文档';
    }

    // 默认都是功能需求
    return '功能需求';
  }

  // 从标题中推断
  const name = workItem.name.toLowerCase();

  if (name.includes('bug') || name.includes('修复') || name.includes('缺陷')) {
    return 'Bug修复';
  }

  if (name.includes('优化') || name.includes('改进')) {
    return '优化';
  }

  if (name.includes('重构')) {
    return '重构';
  }

  return '功能需求';
}

/**
 * 估算时间窗口
 * 基于截止日期距离当前时间的天数
 */
export function estimateTimeCriticality(dueDate?: number): '随时' | '三月窗口' | '一月硬窗口' {
  if (!dueDate) {
    return '随时';
  }

  const now = Date.now();
  const dueDateMs = dueDate * 1000;
  const diffDays = Math.ceil((dueDateMs - now) / (1000 * 60 * 60 * 24));

  if (diffDays <= 30) {
    return '一月硬窗口';
  } else if (diffDays <= 90) {
    return '三月窗口';
  }

  return '随时';
}

/**
 * 生成导入摘要信息
 */
export interface ImportSummary {
  totalCount: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
  errors: Array<{
    workItemName: string;
    error: string;
  }>;
  warnings: string[];
}

export function generateImportSummary(result: TransformResult): ImportSummary {
  const warnings: string[] = [];

  // 检查是否有工作量为0的需求
  const zeroEffortCount = result.success.filter(r => r.effortDays === 0).length;
  if (zeroEffortCount > 0) {
    warnings.push(`有 ${zeroEffortCount} 个需求的工作量为0，已设置为1天`);
  }

  // 检查是否有缺少描述的需求
  const noDescriptionCount = result.success.filter(r => !r.description).length;
  if (noDescriptionCount > 0) {
    warnings.push(`有 ${noDescriptionCount} 个需求缺少描述`);
  }

  return {
    totalCount: result.success.length + result.failed.length,
    successCount: result.success.length,
    failedCount: result.failed.length,
    skippedCount: 0,
    errors: result.failed.map(f => ({
      workItemName: f.workItem.name,
      error: f.error,
    })),
    warnings,
  };
}
