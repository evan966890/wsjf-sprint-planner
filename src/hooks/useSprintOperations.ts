/**
 * Sprint 操作 Hook
 *
 * 集中管理Sprint相关的所有操作：
 * - 保存Sprint
 * - 删除Sprint
 * - 添加新Sprint
 */

import type { SprintPool } from '../types';
import { useStore } from '../store/useStore';

export function useSprintOperations() {
  const sprintPools = useStore((state) => state.sprintPools);
  const addSprintPool = useStore((state) => state.addSprintPool);
  const updateSprintPool = useStore((state) => state.updateSprintPool);
  const deleteSprintPool = useStore((state) => state.deleteSprintPool);
  const setEditingSprint = useStore((state) => state.setEditingSprint);

  const handleSaveSprint = (sprint: SprintPool) => {
    updateSprintPool(sprint);
  };

  const handleDeleteSprint = (poolId: string) => {
    const pool = sprintPools.find(p => p.id === poolId);
    if (!pool) return;

    if (pool.requirements.length > 0) {
      if (!confirm(`迭代池"${pool.name}"中还有 ${pool.requirements.length} 个需求，删除后这些需求将被移回待排期区。确定删除吗？`)) {
        return;
      }
    } else {
      if (!confirm(`确定要删除迭代池"${pool.name}"吗？`)) {
        return;
      }
    }

    deleteSprintPool(poolId);
  };

  const handleAddSprint = () => {
    const newId = `SPRINT-${Date.now()}`;
    const newSprint: SprintPool = {
      id: newId,
      name: `迭代${sprintPools.length + 1}`,
      startDate: '2026-01',
      endDate: '2026-01-31',
      totalDays: 200,
      bugReserve: 10,
      refactorReserve: 15,
      otherReserve: 5,
      requirements: []
    };
    addSprintPool(newSprint);
    setEditingSprint(newSprint);
  };

  return {
    handleSaveSprint,
    handleDeleteSprint,
    handleAddSprint,
  };
}
