/**
 * 运行时数据验证工具
 *
 * 本文件提供开发环境的运行时验证功能
 * - 类型安全：TypeScript 提供编译时检查
 * - 运行时验证：本工具提供运行时检查，捕获意外数据
 *
 * 使用场景：
 * 1. API 返回数据验证
 * 2. 用户输入数据验证
 * 3. 导入数据验证
 * 4. localStorage 数据验证（防止数据损坏）
 *
 * @version 1.5.0
 * @since 2025-01-20
 */

import type { TechProgressStatus } from '../types/techProgress';
import { ALL_TECH_PROGRESS_STATUSES, isValidStatus, TECH_PROGRESS } from '../constants/techProgress';

/**
 * 验证技术进展状态值
 *
 * 开发环境：抛出错误，强制修复
 * 生产环境：仅记录警告，避免崩溃
 *
 * @param status - 待验证的状态值
 * @param context - 上下文信息（用于错误日志）
 * @throws {Error} 开发环境下，无效值会抛出错误
 *
 * @example
 * ```ts
 * // 在组件中验证
 * const requirement = { ...data, techProgress: userInput };
 * validateTechProgress(requirement.techProgress, '需求编辑表单');
 * ```
 */
export function validateTechProgress(
  status: string | undefined | null,
  context = '未知'
): asserts status is TechProgressStatus {
  // 空值检查
  if (!status) {
    const message = `[Validation] techProgress 为空 | 上下文: ${context}`;
    if (import.meta.env.DEV) {
      console.error(message);
      console.trace('调用栈:');
      throw new Error(`Invalid techProgress: empty value in ${context}`);
    } else {
      console.warn(message);
    }
    return;
  }

  // 类型检查
  if (typeof status !== 'string') {
    const message = `[Validation] techProgress 类型错误: ${typeof status} | 上下文: ${context}`;
    if (import.meta.env.DEV) {
      console.error(message, { value: status });
      throw new Error(`Invalid techProgress type in ${context}`);
    } else {
      console.warn(message);
    }
    return;
  }

  // 值有效性检查
  if (!isValidStatus(status)) {
    const message = `[Validation] 无效的 techProgress 值: "${status}" | 上下文: ${context}`;
    const validValues = ALL_TECH_PROGRESS_STATUSES.join(', ');

    if (import.meta.env.DEV) {
      console.error(message);
      console.error('有效值:', validValues);
      console.error('当前值:', status);
      console.trace('调用栈:');
      throw new Error(`Invalid techProgress: "${status}" in ${context}. Valid values: ${validValues}`);
    } else {
      console.warn(message);
      console.warn('有效值:', validValues);
    }
  }
}

/**
 * 批量验证需求列表的状态值
 *
 * @param requirements - 需求列表
 * @param context - 上下文信息
 * @returns 验证失败的需求列表
 *
 * @example
 * ```ts
 * const invalidReqs = validateRequirements(importedData, '数据导入');
 * if (invalidReqs.length > 0) {
 *   showToast(`发现 ${invalidReqs.length} 条无效数据`, 'error');
 * }
 * ```
 */
export function validateRequirements<T extends { id: string; techProgress?: string }>(
  requirements: T[],
  context = '需求列表'
): T[] {
  const invalidReqs: T[] = [];

  requirements.forEach((req, index) => {
    try {
      validateTechProgress(req.techProgress, `${context}[${index}] (ID: ${req.id})`);
    } catch (error) {
      invalidReqs.push(req);
    }
  });

  if (invalidReqs.length > 0 && import.meta.env.DEV) {
    console.warn(`[Validation] 发现 ${invalidReqs.length} 条无效需求:`, invalidReqs);
  }

  return invalidReqs;
}

/**
 * 安全地获取状态值（容错处理）
 *
 * 如果状态无效，返回默认值而非抛出错误
 * 用于处理历史数据或第三方数据
 *
 * @param status - 待验证的状态值
 * @param defaultValue - 默认值（默认为 TECH_PROGRESS.PENDING）
 * @returns 有效的状态值或默认值
 *
 * @example
 * ```ts
 * // 处理可能损坏的 localStorage 数据
 * const savedReqs = JSON.parse(localStorage.getItem('requirements') || '[]');
 * savedReqs.forEach(req => {
 *   req.techProgress = safeGetStatus(req.techProgress);
 * });
 * ```
 */
export function safeGetStatus(
  status: string | undefined | null,
  defaultValue: TechProgressStatus = TECH_PROGRESS.PENDING
): TechProgressStatus {
  if (!status || typeof status !== 'string') {
    return defaultValue;
  }

  if (isValidStatus(status)) {
    return status;
  }

  if (import.meta.env.DEV) {
    console.warn(`[Validation] 无效状态值 "${status}"，使用默认值 "${defaultValue}"`);
  }

  return defaultValue;
}

/**
 * 创建验证装饰器（用于关键数据操作）
 *
 * @param operation - 操作名称
 * @returns 装饰后的验证函数
 *
 * @example
 * ```ts
 * const validateBeforeSave = createValidator('保存需求');
 * validateBeforeSave(requirement.techProgress);
 * saveRequirement(requirement);
 * ```
 */
export function createValidator(operation: string) {
  return (status: string | undefined | null) => {
    validateTechProgress(status, operation);
  };
}
