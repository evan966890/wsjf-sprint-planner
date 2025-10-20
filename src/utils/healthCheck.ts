/**
 * 应用健康检查工具
 *
 * 本文件提供开发环境的自动化健康检查
 * 定期检测数据完整性、状态有效性等问题
 *
 * 检查项目：
 * 1. 数据完整性：需求总数 = 待排期 + 已排期
 * 2. 状态值有效性：所有 techProgress 值必须在枚举范围内
 * 3. 分组完整性：filteredReqs = readyReqs + notReadyReqs
 * 4. ID唯一性：所有需求ID必须唯一
 *
 * @version 1.5.0
 * @since 2025-01-20
 */

import type { Requirement } from '../types';
import { useStore } from '../store/useStore';
import { isValidStatus } from '../constants/techProgress';

/**
 * 检查结果类型
 */
interface CheckResult {
  /** 检查项名称 */
  name: string;
  /** 是否通过 */
  passed: boolean;
  /** 错误消息 */
  message?: string;
  /** 附加数据 */
  data?: any;
}

/**
 * 执行所有健康检查
 *
 * @returns 检查结果数组
 */
export function runHealthChecks(): CheckResult[] {
  if (!import.meta.env.DEV) return [];

  const results: CheckResult[] = [
    checkDataIntegrity(),
    checkStatusValidity(),
    checkIDUniqueness(),
    checkOrphanedRequirements(),
  ];

  // 输出检查结果
  const failed = results.filter(r => !r.passed);

  if (failed.length === 0) {
    console.log('✅ 所有健康检查通过');
  } else {
    console.warn(`⚠️ ${failed.length} 项健康检查失败:`);
    failed.forEach(({ name, message, data }) => {
      console.error(`  ❌ ${name}: ${message}`);
      if (data) {
        console.error('    详细信息:', data);
      }
    });
  }

  return results;
}

/**
 * 检查数据完整性
 *
 * 验证：需求总数 = 待排期需求数 + 已排期需求数
 */
function checkDataIntegrity(): CheckResult {
  try {
    const { requirements, unscheduled, sprintPools } = useStore.getState();

    const scheduledReqs = sprintPools.flatMap(p => p.requirements);
    const scheduledCount = scheduledReqs.length;
    const unscheduledCount = unscheduled.length;
    const totalCount = requirements.length;
    const calculatedTotal = scheduledCount + unscheduledCount;

    if (totalCount !== calculatedTotal) {
      return {
        name: '数据完整性',
        passed: false,
        message: '需求总数与待排期+已排期之和不匹配',
        data: {
          总需求数: totalCount,
          待排期数: unscheduledCount,
          已排期数: scheduledCount,
          计算总数: calculatedTotal,
          差异: totalCount - calculatedTotal,
        }
      };
    }

    return {
      name: '数据完整性',
      passed: true,
    };
  } catch (error) {
    return {
      name: '数据完整性',
      passed: false,
      message: '检查过程出错',
      data: error,
    };
  }
}

/**
 * 检查状态值有效性
 *
 * 验证：所有需求的 techProgress 值必须在枚举范围内
 */
function checkStatusValidity(): CheckResult {
  try {
    const { requirements } = useStore.getState();

    const invalidReqs = requirements.filter(
      r => r.techProgress && !isValidStatus(r.techProgress)
    );

    if (invalidReqs.length > 0) {
      return {
        name: '状态值有效性',
        passed: false,
        message: `发现 ${invalidReqs.length} 个需求的 techProgress 值无效`,
        data: invalidReqs.map(r => ({
          id: r.id,
          name: r.name,
          techProgress: r.techProgress,
        })),
      };
    }

    return {
      name: '状态值有效性',
      passed: true,
    };
  } catch (error) {
    return {
      name: '状态值有效性',
      passed: false,
      message: '检查过程出错',
      data: error,
    };
  }
}

/**
 * 检查ID唯一性
 *
 * 验证：所有需求ID必须唯一
 */
function checkIDUniqueness(): CheckResult {
  try {
    const { requirements } = useStore.getState();

    const idMap = new Map<string, number>();
    requirements.forEach(r => {
      idMap.set(r.id, (idMap.get(r.id) || 0) + 1);
    });

    const duplicates = Array.from(idMap.entries())
      .filter(([_, count]) => count > 1)
      .map(([id, count]) => ({ id, count }));

    if (duplicates.length > 0) {
      return {
        name: 'ID唯一性',
        passed: false,
        message: `发现 ${duplicates.length} 个重复的需求ID`,
        data: duplicates,
      };
    }

    return {
      name: 'ID唯一性',
      passed: true,
    };
  } catch (error) {
    return {
      name: 'ID唯一性',
      passed: false,
      message: '检查过程出错',
      data: error,
    };
  }
}

/**
 * 检查孤儿需求
 *
 * 验证：已排期的需求必须在迭代池中，反之亦然
 */
function checkOrphanedRequirements(): CheckResult {
  try {
    const { requirements, unscheduled, sprintPools } = useStore.getState();

    const scheduledReqs = sprintPools.flatMap(p => p.requirements);
    const scheduledIds = new Set(scheduledReqs.map(r => r.id));
    const unscheduledIds = new Set(unscheduled.map(r => r.id));
    const allIds = new Set(requirements.map(r => r.id));

    // 找出既不在待排期也不在已排期的需求（孤儿需求）
    const orphanedIds = Array.from(allIds).filter(
      id => !scheduledIds.has(id) && !unscheduledIds.has(id)
    );

    if (orphanedIds.length > 0) {
      return {
        name: '孤儿需求检测',
        passed: false,
        message: `发现 ${orphanedIds.length} 个孤儿需求（既不在待排期也不在迭代池）`,
        data: orphanedIds,
      };
    }

    return {
      name: '孤儿需求检测',
      passed: true,
    };
  } catch (error) {
    return {
      name: '孤儿需求检测',
      passed: false,
      message: '检查过程出错',
      data: error,
    };
  }
}

/**
 * 启动定期健康检查
 *
 * 在开发环境每10秒自动执行一次检查
 *
 * @returns 停止函数
 *
 * @example
 * ```tsx
 * // 在主组件中启动
 * useEffect(() => {
 *   const stop = startHealthCheckMonitor();
 *   return stop;
 * }, []);
 * ```
 */
export function startHealthCheckMonitor(intervalMs = 10000): () => void {
  if (!import.meta.env.DEV) {
    return () => {};
  }

  console.log('🏥 健康检查监控已启动（间隔: 10秒）');

  const intervalId = setInterval(() => {
    runHealthChecks();
  }, intervalMs);

  return () => {
    clearInterval(intervalId);
    console.log('🏥 健康检查监控已停止');
  };
}

/**
 * 手动触发健康检查
 *
 * 可在控制台调用：window.__healthCheck()
 */
if (import.meta.env.DEV) {
  (window as any).__healthCheck = () => {
    console.clear();
    console.log('🏥 手动执行健康检查...\n');
    runHealthChecks();
  };

  (window as any).__debugStore = () => {
    const state = useStore.getState();
    console.log('📦 Store 当前状态:', {
      需求总数: state.requirements.length,
      待排期: state.unscheduled.length,
      迭代池数: state.sprintPools.length,
      已排期: state.sprintPools.reduce((sum, p) => sum + p.requirements.length, 0),
    });
    console.log('详细数据:', state);
  };

  console.log('💡 调试提示:');
  console.log('  - 执行健康检查: window.__healthCheck()');
  console.log('  - 查看Store状态: window.__debugStore()');
}

/**
 * 验证渲染分组的完整性
 *
 * 用于组件中验证筛选后的数据在分组时没有遗漏
 *
 * @param filteredReqs - 筛选后的需求列表
 * @param readyReqs - 可排期需求列表
 * @param notReadyReqs - 不可排期需求列表
 * @param componentName - 组件名称（用于日志）
 *
 * @example
 * ```tsx
 * // 在 UnscheduledArea 组件中
 * const filteredReqs = unscheduled.filter(...);
 * const readyReqs = filteredReqs.filter(...);
 * const notReadyReqs = filteredReqs.filter(...);
 *
 * validateRenderGroups(filteredReqs, readyReqs, notReadyReqs, 'UnscheduledArea');
 * ```
 */
export function validateRenderGroups(
  filteredReqs: Requirement[],
  readyReqs: Requirement[],
  notReadyReqs: Requirement[],
  componentName = 'Unknown'
): void {
  if (!import.meta.env.DEV) return;

  const total = readyReqs.length + notReadyReqs.length;

  if (total !== filteredReqs.length) {
    console.error(`❌ [${componentName}] 分组逻辑有遗漏！`);
    console.error('数量对比:', {
      筛选后总数: filteredReqs.length,
      可排期数: readyReqs.length,
      不可排期数: notReadyReqs.length,
      分组总数: total,
      遗漏数: filteredReqs.length - total,
    });

    // 找出遗漏的需求
    const readyIds = new Set(readyReqs.map(r => r.id));
    const notReadyIds = new Set(notReadyReqs.map(r => r.id));
    const missing = filteredReqs.filter(
      r => !readyIds.has(r.id) && !notReadyIds.has(r.id)
    );

    if (missing.length > 0) {
      console.error('遗漏的需求:', missing.map(r => ({
        id: r.id,
        name: r.name,
        techProgress: r.techProgress,
      })));
    }

    throw new Error(`[${componentName}] 渲染分组逻辑有遗漏`);
  }
}
