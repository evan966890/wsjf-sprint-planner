/**
 * 飞书集成 - 数据验证工具
 *
 * 验证从飞书导入的数据是否符合WSJF要求
 * 文件大小控制: < 200行
 */

import type { Requirement } from '../../types';
import type { FeishuWorkItem } from '../../services/feishu';

/**
 * 验证错误
 */
export class ValidationError extends Error {
  constructor(
    public field: string,
    public message: string
  ) {
    super(`${field}: ${message}`);
    this.name = 'ValidationError';
  }
}

/**
 * 验证结果
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

/**
 * 验证WSJF需求对象
 */
export function validateRequirement(requirement: Requirement): void {
  const errors: string[] = [];

  // 验证必填字段
  if (!requirement.name || requirement.name.trim() === '') {
    errors.push('需求名称不能为空');
  }

  if (!requirement.submitterName || requirement.submitterName.trim() === '') {
    errors.push('提交人姓名不能为空');
  }

  if (!requirement.submitDate) {
    errors.push('提交日期不能为空');
  }

  // 验证日期格式
  if (requirement.submitDate && !isValidDate(requirement.submitDate)) {
    errors.push('提交日期格式不正确，应为YYYY-MM-DD');
  }

  if (requirement.deadlineDate && !isValidDate(requirement.deadlineDate)) {
    errors.push('截止日期格式不正确，应为YYYY-MM-DD');
  }

  // 验证工作量
  if (requirement.effortDays !== undefined) {
    if (typeof requirement.effortDays !== 'number' || requirement.effortDays < 0) {
      errors.push('工作量必须是非负数');
    }
  }

  // 验证提交方类型
  if (requirement.submitter) {
    const validSubmitters = ['业务', '产品', '技术'];
    if (!validSubmitters.includes(requirement.submitter)) {
      errors.push(`提交方必须是：${validSubmitters.join('、')}之一`);
    }
  }

  // 如果有错误，抛出异常
  if (errors.length > 0) {
    throw new ValidationError('requirement', errors.join('; '));
  }
}

/**
 * 批量验证需求
 */
export function validateRequirements(requirements: Requirement[]): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  for (let i = 0; i < requirements.length; i++) {
    try {
      validateRequirement(requirements[i]);
    } catch (error) {
      if (error instanceof ValidationError) {
        errors.push(
          new ValidationError(
            `需求[${i + 1}] ${requirements[i].name}`,
            error.message
          )
        );
      }
    }

    // 检查警告项
    const req = requirements[i];

    if (!req.description || req.description.trim() === '') {
      warnings.push(`需求[${i + 1}] "${req.name}" 缺少描述`);
    }

    if (req.effortDays === 0) {
      warnings.push(`需求[${i + 1}] "${req.name}" 工作量为0`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 验证飞书工作项数据完整性
 */
export function validateWorkItem(workItem: FeishuWorkItem): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  // 验证必需字段
  if (!workItem.id) {
    errors.push(new ValidationError('id', '工作项ID不能为空'));
  }

  if (!workItem.name || workItem.name.trim() === '') {
    errors.push(new ValidationError('name', '工作项名称不能为空'));
  }

  if (!workItem.created_at) {
    errors.push(new ValidationError('created_at', '创建时间不能为空'));
  }

  // 检查警告项
  if (!workItem.description) {
    warnings.push('工作项缺少描述');
  }

  if (!workItem.estimated_hours) {
    warnings.push('工作项未设置预估工时');
  }

  if (!workItem.assignee_id && !workItem.assignee) {
    warnings.push('工作项未分配负责人');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 验证日期格式 (YYYY-MM-DD)
 */
function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;

  if (!regex.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * 检查重复需求（基于名称）
 */
export function findDuplicateRequirements(
  requirements: Requirement[]
): Array<{ name: string; indices: number[] }> {
  const duplicates = new Map<string, number[]>();

  requirements.forEach((req, index) => {
    const normalizedName = req.name.trim().toLowerCase();

    if (!duplicates.has(normalizedName)) {
      duplicates.set(normalizedName, []);
    }

    duplicates.get(normalizedName)!.push(index);
  });

  // 过滤出重复项
  const result: Array<{ name: string; indices: number[] }> = [];

  duplicates.forEach((indices) => {
    if (indices.length > 1) {
      result.push({
        name: requirements[indices[0]].name, // 使用原始名称（保留大小写）
        indices,
      });
    }
  });

  return result;
}

/**
 * 生成验证报告
 */
export function generateValidationReport(result: ValidationResult): string {
  const lines: string[] = [];

  lines.push('=== 数据验证报告 ===\n');

  if (result.valid) {
    lines.push('✅ 验证通过\n');
  } else {
    lines.push('❌ 验证失败\n');
    lines.push(`发现 ${result.errors.length} 个错误：\n`);

    result.errors.forEach((error, index) => {
      lines.push(`${index + 1}. [${error.field}] ${error.message}`);
    });
  }

  if (result.warnings.length > 0) {
    lines.push(`\n⚠️  ${result.warnings.length} 个警告：\n`);

    result.warnings.forEach((warning, index) => {
      lines.push(`${index + 1}. ${warning}`);
    });
  }

  return lines.join('\n');
}
