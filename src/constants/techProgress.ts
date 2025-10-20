/**
 * 技术进展状态常量定义
 *
 * 本文件提供：
 * 1. 状态值常量（避免硬编码字符串）
 * 2. 状态分组（用于业务逻辑判断）
 * 3. 辅助函数（状态判断、验证等）
 *
 * 使用原则：
 * - 所有代码中使用状态值时，必须引用本文件的常量
 * - 禁止直接写字符串 '待评估'、'已评估工作量' 等
 * - 新增状态时，必须同时更新类型定义和常量
 *
 * @version 1.5.0
 * @since 2025-01-20
 */

import type { TechProgressStatus } from '../types/techProgress';

/**
 * 技术进展状态常量
 * 使用 as const 确保常量不可变
 */
export const TECH_PROGRESS = {
  /** 待评估 - 新建需求的默认状态 */
  PENDING: '待评估' as const,

  /** 未评估 - 兼容v1.4.0之前的旧数据 */
  NOT_EVALUATED: '未评估' as const,

  /** 已评估工作量 - 可以排期 */
  EFFORT_EVALUATED: '已评估工作量' as const,

  /** 技术方案设计中 */
  DESIGN_IN_PROGRESS: '技术方案设计中' as const,

  /** 已完成技术方案 - 可以排期 */
  DESIGN_COMPLETED: '已完成技术方案' as const,

  /** 开发中 */
  DEVELOPING: '开发中' as const,

  /** 联调测试中 */
  TESTING: '联调测试中' as const,

  /** 已上线 */
  ONLINE: '已上线' as const,
} as const;

/**
 * 未完成技术评估的状态列表（不可排期）
 *
 * 包含：
 * - 待评估：新建需求默认状态
 * - 未评估：兼容旧数据
 */
export const NOT_READY_STATUSES: ReadonlyArray<TechProgressStatus> = [
  TECH_PROGRESS.PENDING,
  TECH_PROGRESS.NOT_EVALUATED,
] as const;

/**
 * 已完成技术评估的状态列表（可以排期）
 *
 * 包含：
 * - 已评估工作量
 * - 技术方案设计中
 * - 已完成技术方案
 * - 开发中
 * - 联调测试中
 * - 已上线
 */
export const READY_STATUSES: ReadonlyArray<TechProgressStatus> = [
  TECH_PROGRESS.EFFORT_EVALUATED,
  TECH_PROGRESS.DESIGN_IN_PROGRESS,
  TECH_PROGRESS.DESIGN_COMPLETED,
  TECH_PROGRESS.DEVELOPING,
  TECH_PROGRESS.TESTING,
  TECH_PROGRESS.ONLINE,
] as const;

/**
 * 所有有效的技术进展状态
 */
export const ALL_TECH_PROGRESS_STATUSES: ReadonlyArray<TechProgressStatus> = [
  ...NOT_READY_STATUSES,
  ...READY_STATUSES,
] as const;

/**
 * 判断需求是否可以排期
 *
 * @param status - 技术进展状态
 * @returns true 表示可以排期，false 表示需要先完成技术评估
 *
 * @example
 * ```ts
 * if (isReadyForSchedule(requirement.techProgress)) {
 *   // 可以拖拽到迭代池
 * } else {
 *   showToast('此需求未完成技术评估，无法排期', 'error');
 * }
 * ```
 */
export function isReadyForSchedule(status: TechProgressStatus | undefined | null): boolean {
  if (!status) return false;
  return (READY_STATUSES as readonly string[]).includes(status);
}

/**
 * 判断需求是否需要完成技术评估
 *
 * @param status - 技术进展状态
 * @returns true 表示需要评估，false 表示已评估
 *
 * @example
 * ```ts
 * const notEvaluatedReqs = requirements.filter(r => needsEvaluation(r.techProgress));
 * console.log(`${notEvaluatedReqs.length} 个需求待评估`);
 * ```
 */
export function needsEvaluation(status: TechProgressStatus | undefined | null): boolean {
  if (!status) return true;  // 空值视为待评估
  return (NOT_READY_STATUSES as readonly string[]).includes(status);
}

/**
 * 验证状态值是否有效
 *
 * @param status - 待验证的状态值
 * @returns true 表示有效，false 表示无效
 *
 * @example
 * ```ts
 * if (!isValidStatus(userInput)) {
 *   console.error('无效的技术进展状态:', userInput);
 * }
 * ```
 */
export function isValidStatus(status: string): status is TechProgressStatus {
  return (ALL_TECH_PROGRESS_STATUSES as readonly string[]).includes(status);
}

/**
 * 获取状态的显示名称
 *
 * @param status - 技术进展状态
 * @returns 显示名称
 */
export function getStatusLabel(status: TechProgressStatus | undefined | null): string {
  if (!status) return '未设置';
  return status;
}

/**
 * 获取下一个状态（工作流）
 *
 * @param current - 当前状态
 * @returns 下一个状态，如果已是最后状态则返回 null
 *
 * @example
 * ```ts
 * const nextStatus = getNextStatus(requirement.techProgress);
 * if (nextStatus) {
 *   requirement.techProgress = nextStatus;
 * }
 * ```
 */
export function getNextStatus(current: TechProgressStatus): TechProgressStatus | null {
  const workflow: TechProgressStatus[] = [
    TECH_PROGRESS.PENDING,
    TECH_PROGRESS.EFFORT_EVALUATED,
    TECH_PROGRESS.DESIGN_IN_PROGRESS,
    TECH_PROGRESS.DESIGN_COMPLETED,
    TECH_PROGRESS.DEVELOPING,
    TECH_PROGRESS.TESTING,
    TECH_PROGRESS.ONLINE,
  ];

  const currentIndex = workflow.indexOf(current);
  if (currentIndex === -1 || currentIndex === workflow.length - 1) {
    return null;
  }

  return workflow[currentIndex + 1];
}
