/**
 * WSJF Sprint Planner - 数据迁移工具
 *
 * v1.2.0: 自动迁移旧数据格式到新格式
 *
 * 迁移策略：
 * - 旧的4档BV评分 → 新的10分制评分
 * - 保留旧字段（bv, tc）以支持回滚
 * - 初始化新字段为默认值，用户后续可补充完善
 */

import type { Requirement, BusinessImpactScore } from '../types';

/**
 * 业务价值映射表
 * 将旧的4档BV映射到新的10分制基础分
 */
const BV_TO_SCORE_MAP: Record<string, number> = {
  '局部': 3,        // 局部影响 → 3分基础
  '明显': 5,        // 明显价值 → 5分基础
  '撬动核心': 7,    // 撬动核心 → 7分基础
  '战略平台': 9     // 战略平台 → 9分基础
};

/**
 * 时间临界性加分表
 */
const TC_BONUS_MAP: Record<string, number> = {
  '随时': 0,
  '三月窗口': 1,
  '一月硬窗口': 1
};

/**
 * 迁移单个需求
 *
 * @param oldReq - 旧格式的需求
 * @returns 新格式的需求
 */
export const migrateRequirement = (oldReq: Requirement): Requirement => {
  // 如果已经有businessImpactScore，说明已迁移，直接返回
  if (oldReq.businessImpactScore) {
    return oldReq;
  }

  // 计算新的业务影响度评分
  let score = BV_TO_SCORE_MAP[oldReq.bv || '局部'] || 3;

  // 加上时间临界性的加分
  score += TC_BONUS_MAP[oldReq.tc || '随时'] || 0;

  // 如果有强制截止日期，额外加1分
  if (oldReq.hardDeadline) {
    score += 1;
  }

  // 确保分数在1-10范围内
  score = Math.max(1, Math.min(10, score));

  // 构建迁移后的需求对象
  return {
    ...oldReq,
    // 新增字段
    businessImpactScore: score as BusinessImpactScore,
    description: oldReq.description || oldReq.name, // 使用name作为description的默认值
    documents: oldReq.documents || [],
    affectedMetrics: oldReq.affectedMetrics || [],
    impactScope: oldReq.impactScope || {
      storeTypes: [],
      regions: [],
      keyRoles: []
    },
    timeCriticality: (oldReq.tc as '随时' | '三月窗口' | '一月硬窗口') || '随时',

    // 保留旧字段，支持回滚
    bv: oldReq.bv,
    tc: oldReq.tc
  };
};

/**
 * 批量迁移所有需求
 *
 * @param requirements - 需求列表
 * @returns 迁移后的需求列表
 */
export const migrateAllRequirements = (requirements: Requirement[]): Requirement[] => {
  if (!requirements || requirements.length === 0) {
    return [];
  }

  console.log('[数据迁移] 开始迁移需求数据...');

  const migrated = requirements.map(migrateRequirement);

  const migratedCount = migrated.filter(r => r.businessImpactScore).length;
  console.log(`[数据迁移] 成功迁移 ${migratedCount} 条需求`);

  return migrated;
};

/**
 * 检查是否需要迁移
 *
 * @param requirements - 需求列表
 * @returns 是否需要迁移
 */
export const needsMigration = (requirements: Requirement[]): boolean => {
  if (!requirements || requirements.length === 0) {
    return false;
  }

  // 如果有任何需求没有businessImpactScore，则需要迁移
  return requirements.some(req => !req.businessImpactScore && req.bv);
};

/**
 * 获取迁移映射说明（用于UI展示）
 *
 * @returns 迁移映射说明
 */
export const getMigrationMapping = (): Array<{ old: string; new: string; description: string }> => {
  return [
    {
      old: '局部 (BV=3)',
      new: '3-4分',
      description: '局部影响 → 3分基础 + TC/DDL调整'
    },
    {
      old: '明显 (BV=6)',
      new: '5-6分',
      description: '明显价值 → 5分基础 + TC/DDL调整'
    },
    {
      old: '撬动核心 (BV=8)',
      new: '7-8分',
      description: '撬动核心 → 7分基础 + TC/DDL调整'
    },
    {
      old: '战略平台 (BV=10)',
      new: '9-10分',
      description: '战略平台 → 9分基础 + TC/DDL调整'
    },
    {
      old: 'TC: 三月窗口/一月硬窗口',
      new: '+1分',
      description: '有时间窗口要求，增加1分'
    },
    {
      old: '强制截止日期: 是',
      new: '+1分',
      description: '有强制截止日期，增加1分'
    }
  ];
};

/**
 * 生成迁移报告
 *
 * @param originalReqs - 原始需求列表
 * @param migratedReqs - 迁移后的需求列表
 * @returns 迁移报告
 */
export const generateMigrationReport = (
  originalReqs: Requirement[],
  migratedReqs: Requirement[]
): {
  totalCount: number;
  migratedCount: number;
  scoreDistribution: Record<number, number>;
  errors: string[];
} => {
  const report = {
    totalCount: originalReqs.length,
    migratedCount: 0,
    scoreDistribution: {} as Record<number, number>,
    errors: [] as string[]
  };

  migratedReqs.forEach((req, index) => {
    if (req.businessImpactScore) {
      report.migratedCount++;

      // 统计分数分布
      const score = req.businessImpactScore;
      report.scoreDistribution[score] = (report.scoreDistribution[score] || 0) + 1;
    } else if (originalReqs[index].bv) {
      // 如果原来有bv但迁移后没有businessImpactScore，说明迁移失败
      report.errors.push(`需求 ${req.id} (${req.name}) 迁移失败`);
    }
  });

  return report;
};
