/**
 * 示例数据加载工具
 *
 * 生成预置的示例数据，帮助新用户快速了解系统
 */

import { generateSampleData } from '../data/sampleData';
import { calculateScores } from './scoring';
import type { SprintPool } from '../types';

export function createSampleData() {
  const sampleReqs = generateSampleData();
  const samplePools: SprintPool[] = [
    { id: 'SPRINT-01', name: '迭代1', startDate: '2025-11', endDate: '2025-11-30', totalDays: 200, bugReserve: 10, refactorReserve: 15, otherReserve: 5, requirements: [] },
    { id: 'SPRINT-02', name: '迭代2', startDate: '2025-12', endDate: '2025-12-31', totalDays: 200, bugReserve: 10, refactorReserve: 15, otherReserve: 5, requirements: [] },
    { id: 'SPRINT-03', name: '迭代3', startDate: '2026-01', endDate: '2026-01-31', totalDays: 200, bugReserve: 10, refactorReserve: 15, otherReserve: 5, requirements: [] },
  ];

  const requirementsWithScores = calculateScores(sampleReqs);
  const sortedUnscheduled = [...requirementsWithScores].sort((a, b) => (b.displayScore || 0) - (a.displayScore || 0));

  return {
    requirements: requirementsWithScores,
    sprintPools: samplePools,
    unscheduled: sortedUnscheduled,
  };
}
