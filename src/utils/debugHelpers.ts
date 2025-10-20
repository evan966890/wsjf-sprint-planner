/**
 * 调试辅助工具
 *
 * 本文件提供系统化的调试工具，帮助快速定位问题
 * 只在开发环境启用，生产环境自动禁用
 *
 * 核心功能：
 * 1. 渲染管道追踪：追踪数据在筛选、排序、分组等阶段的变化
 * 2. 状态差异对比：对比前后状态的差异
 * 3. 性能监控：测量操作耗时
 *
 * @version 1.5.0
 * @since 2025-01-20
 */

/**
 * 调试渲染管道（追踪数据流转）
 *
 * 用于追踪数据在多个处理步骤中的变化
 * 每个步骤输出：输入数量、输出数量、过滤数量
 *
 * @param data - 输入数据
 * @param steps - 处理步骤数组
 * @returns 最终处理结果
 *
 * @example
 * ```ts
 * const readyReqs = debugRenderPipeline(unscheduled, [
 *   { name: '搜索筛选', fn: (items) => items.filter(r => r.name.includes(searchTerm)) },
 *   { name: '状态筛选', fn: (items) => items.filter(r => isReady(r.techProgress)) },
 *   { name: '排序', fn: (items) => items.sort((a, b) => b.score - a.score) },
 * ]);
 * ```
 */
export function debugRenderPipeline<T>(
  data: T[],
  steps: Array<{ name: string; fn: (items: T[]) => T[] }>,
  options: {
    /** 是否启用（默认仅开发环境） */
    enabled?: boolean;
    /** 分组名称 */
    groupName?: string;
    /** 是否展开显示详细信息 */
    expanded?: boolean;
  } = {}
): T[] {
  const {
    enabled = import.meta.env.DEV,
    groupName = '🔍 渲染管道调试',
    expanded = false
  } = options;

  if (!enabled) return steps.reduce((acc, step) => step.fn(acc), data);

  // 开始调试
  console[expanded ? 'group' : 'groupCollapsed'](groupName);
  console.log('📥 输入数据:', data.length, '条');

  let current = data;
  let totalFiltered = 0;

  steps.forEach(({ name, fn }, index) => {
    const before = current.length;
    const startTime = performance.now();

    try {
      current = fn(current);
    } catch (error) {
      console.error(`❌ ${name} 执行失败:`, error);
      throw error;
    }

    const endTime = performance.now();
    const after = current.length;
    const diff = before - after;
    totalFiltered += Math.max(diff, 0);

    const emoji = diff > 0 ? '🔻' : diff < 0 ? '🔺' : '➡️';
    const diffText = diff > 0 ? `-${diff}` : diff < 0 ? `+${Math.abs(diff)}` : '0';
    const timeText = (endTime - startTime).toFixed(2);

    console.log(`${emoji} ${index + 1}. ${name}:`, {
      输入: before,
      输出: after,
      变化: diffText,
      耗时: `${timeText}ms`
    });

    // 警告：数据增加可能有问题
    if (diff < 0) {
      console.warn(`⚠️ "${name}" 增加了数据，可能存在逻辑错误`);
    }

    // 警告：数据全部被过滤
    if (before > 0 && after === 0) {
      console.warn(`⚠️ "${name}" 过滤了所有数据！`);
    }
  });

  console.log('📤 最终输出:', current.length, '条');
  console.log('📊 总计过滤:', totalFiltered, '条');
  console.log('📉 过滤率:', ((totalFiltered / data.length) * 100).toFixed(1) + '%');
  console.groupEnd();

  return current;
}

/**
 * 对比两个对象的差异
 *
 * @param before - 修改前的对象
 * @param after - 修改后的对象
 * @param label - 标签名称
 *
 * @example
 * ```ts
 * const oldReq = { ...requirement };
 * requirement.techProgress = '已评估工作量';
 * debugDiff(oldReq, requirement, '需求状态更新');
 * ```
 */
export function debugDiff<T extends Record<string, any>>(
  before: T,
  after: T,
  label = '对象对比'
): void {
  if (!import.meta.env.DEV) return;

  console.groupCollapsed(`🔄 ${label}`);

  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const changes: Array<{ key: string; before: any; after: any }> = [];

  allKeys.forEach(key => {
    const beforeValue = before[key];
    const afterValue = after[key];

    if (beforeValue !== afterValue) {
      changes.push({ key, before: beforeValue, after: afterValue });
    }
  });

  if (changes.length === 0) {
    console.log('✅ 无变化');
  } else {
    console.log(`📝 发现 ${changes.length} 处变化:`);
    changes.forEach(({ key, before, after }) => {
      console.log(`  ${key}:`, { 前: before, 后: after });
    });
  }

  console.groupEnd();
}

/**
 * 性能计时器
 *
 * @param label - 标签名称
 * @returns 停止函数
 *
 * @example
 * ```ts
 * const stopTimer = debugTimer('计算分数');
 * calculateScores(requirements);
 * stopTimer(); // 输出: ⏱️ 计算分数: 125.32ms
 * ```
 */
export function debugTimer(label: string): () => void {
  if (!import.meta.env.DEV) return () => {};

  const startTime = performance.now();

  return () => {
    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);
    console.log(`⏱️ ${label}: ${duration}ms`);
  };
}

/**
 * 断言检查（仅开发环境）
 *
 * @param condition - 条件表达式
 * @param message - 错误消息
 * @param data - 附加数据
 *
 * @example
 * ```ts
 * debugAssert(
 *   filteredReqs.length === readyReqs.length + notReadyReqs.length,
 *   '分组逻辑有遗漏',
 *   { filtered: filteredReqs.length, ready: readyReqs.length, notReady: notReadyReqs.length }
 * );
 * ```
 */
export function debugAssert(
  condition: boolean,
  message: string,
  data?: any
): asserts condition {
  if (!import.meta.env.DEV) return;

  if (!condition) {
    console.error(`❌ 断言失败: ${message}`);
    if (data) {
      console.error('附加数据:', data);
    }
    console.trace('调用栈:');
    throw new Error(`Assertion failed: ${message}`);
  }
}

/**
 * 追踪数组变化
 *
 * 对比两个数组，找出新增、删除、保留的元素
 *
 * @param before - 修改前的数组
 * @param after - 修改后的数组
 * @param getId - 获取元素ID的函数
 * @param label - 标签名称
 *
 * @example
 * ```ts
 * debugArrayChange(
 *   oldRequirements,
 *   newRequirements,
 *   (r) => r.id,
 *   '需求列表更新'
 * );
 * ```
 */
export function debugArrayChange<T>(
  before: T[],
  after: T[],
  getId: (item: T) => string,
  label = '数组变化'
): void {
  if (!import.meta.env.DEV) return;

  const beforeIds = new Set(before.map(getId));
  const afterIds = new Set(after.map(getId));

  const added = after.filter(item => !beforeIds.has(getId(item)));
  const removed = before.filter(item => !afterIds.has(getId(item)));
  const kept = after.filter(item => beforeIds.has(getId(item)));

  console.groupCollapsed(`📊 ${label}`);
  console.log('统计:', {
    修改前: before.length,
    修改后: after.length,
    新增: added.length,
    删除: removed.length,
    保留: kept.length
  });

  if (added.length > 0) {
    console.log('➕ 新增:', added.map(getId));
  }
  if (removed.length > 0) {
    console.log('➖ 删除:', removed.map(getId));
  }

  console.groupEnd();
}

/**
 * 条件日志（避免大量 if 判断）
 *
 * @param condition - 条件
 * @param message - 消息
 * @param data - 数据
 *
 * @example
 * ```ts
 * debugLog(req.techProgress === '待评估', '发现待评估需求', req);
 * ```
 */
export function debugLog(
  condition: boolean,
  message: string,
  data?: any
): void {
  if (!import.meta.env.DEV || !condition) return;

  console.log(`📍 ${message}`, data || '');
}

/**
 * 追踪React组件渲染次数
 *
 * @param componentName - 组件名称
 * @returns 渲染次数
 *
 * @example
 * ```tsx
 * function UnscheduledArea() {
 *   const renderCount = debugRenderCount('UnscheduledArea');
 *   console.log('渲染次数:', renderCount);
 *   // ...
 * }
 * ```
 */
const renderCounts = new Map<string, number>();

export function debugRenderCount(componentName: string): number {
  if (!import.meta.env.DEV) return 0;

  const count = (renderCounts.get(componentName) || 0) + 1;
  renderCounts.set(componentName, count);

  if (count > 100) {
    console.warn(`⚠️ ${componentName} 渲染次数过多 (${count}), 可能存在性能问题`);
  }

  return count;
}

/**
 * 重置渲染计数器
 */
export function resetRenderCount(componentName?: string): void {
  if (!import.meta.env.DEV) return;

  if (componentName) {
    renderCounts.delete(componentName);
  } else {
    renderCounts.clear();
  }
}
