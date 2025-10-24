/**
 * WSJF Sprint Planner - 评分算法
 *
 * WSJF (Weighted Shortest Job First) 评分算法实现
 * 用于计算需求的权重分和星级
 */

import type { Requirement } from '../types';

/**
 * 计算WSJF分数
 *
 * 算法说明：
 * 1. 计算原始分(rawScore): BV + TC + DDL + WorkloadScore，范围3-28
 * 2. 归一化为展示分(displayScore): 线性映射到1-100范围
 * 3. 分档为星级(stars): 根据展示分划分为2-5星
 *
 * 评分维度：
 * - BV(业务影响度-旧字段): 局部3 | 明显6 | 撬动核心8 | 战略平台10
 * - TC(时间窗口): 随时0 | 三月窗口3 | 一月硬窗口5
 * - DDL(强制截止): 无0 | 有5
 * - WorkloadScore(工作量奖励): ≤2天+8 | 3-5天+7 | 6-14天+5 | 15-30天+3 | 31-50天+2 | 51-100天+1 | 101-150天+0 | >150天+0
 *
 * @param requirements - 需求列表
 * @returns 带有计算分数的需求列表
 */
export const calculateScores = (requirements: Requirement[]): Requirement[] => {
  // 空数组检查：如果没有需求，直接返回空数组
  if (!requirements || requirements.length === 0) {
    return [];
  }

  // 业务影响度映射表（默认值为最低档"局部"的3分）
  const BV_MAP: Record<string, number> = {
    '局部': 3,
    '明显': 6,
    '撬动核心': 8,
    '战略平台': 10
  };

  // 时间窗口映射表（默认值为"随时"的0分）
  const TC_MAP: Record<string, number> = {
    '随时': 0,
    '三月窗口': 3,
    '一月硬窗口': 5
  };

  /**
   * 根据工作量计算加分
   * 鼓励需求拆分，小需求获得更高加分
   * @param days - 工作量天数
   * @returns 工作量加分（0-8分）
   */
  const getWorkloadScore = (days: number): number => {
    // 健壮性检查：确保days是有效数字
    const validDays = Math.max(0, Number(days) || 0);

    if (validDays <= 2) return 8;
    if (validDays <= 5) return 7;
    if (validDays <= 14) return 5;
    if (validDays <= 30) return 3;
    if (validDays <= 50) return 2;
    if (validDays <= 100) return 1;
    if (validDays <= 150) return 0;
    return 0; // >150天
  };

  // 第一步：计算原始分数（rawScore）
  const withRawScores = requirements.map(req => {
    // 使用默认值确保计算安全性
    const bvScore = BV_MAP[req.bv || '局部'] || 3;           // 业务影响度分
    const tcScore = TC_MAP[req.tc || '随时'] || 0;           // 时间窗口分
    const ddlScore = req.hardDeadline ? 5 : 0;     // 强制截止加分
    const wlScore = getWorkloadScore(req.effortDays); // 工作量加分

    // 原始分 = 各维度分数之和（范围: 3-28）
    const rawScore = bvScore + tcScore + ddlScore + wlScore;

    return { ...req, rawScore };
  });

  // 第二步：归一化为展示分数（displayScore, 1-100）
  const rawScores = withRawScores.map(r => r.rawScore!);

  // 处理空数组情况
  if (rawScores.length === 0) {
    return withRawScores;
  }

  // 获取当前批次的最小值和最大值
  const minRaw = Math.min(...rawScores);
  const maxRaw = Math.max(...rawScores);

  return withRawScores.map(req => {
    let displayScore = 60; // 默认展示分（所有需求分数相同时使用）

    // 当最大值和最小值不同时，进行线性归一化
    // 公式: DisplayScore = 10 + 90 * (RawScore - MinRaw) / (MaxRaw - MinRaw)
    if (maxRaw !== minRaw) {
      displayScore = Math.round(10 + 90 * (req.rawScore! - minRaw) / (maxRaw - minRaw));
    }

    // 第三步：根据展示分确定星级（2-5星）
    let stars = 2; // 默认2星
    if (displayScore >= 85) stars = 5;      // ★★★★★ 强窗口/立即投入
    else if (displayScore >= 70) stars = 4; // ★★★★ 优先执行
    else if (displayScore >= 55) stars = 3; // ★★★ 普通计划项
    // ≤54: ★★ 择机安排

    return { ...req, displayScore, stars };
  });
};

/**
 * 四舍五入工具函数
 * 用于修复JavaScript浮点数精度问题
 * @param num - 需要四舍五入的数字
 * @param decimals - 保留的小数位数，默认1位
 * @returns 四舍五入后的数字
 */
export const roundNumber = (num: number, decimals: number = 1): number => {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
};
