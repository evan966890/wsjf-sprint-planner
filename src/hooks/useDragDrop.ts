/**
 * 拖拽操作 Hook
 *
 * 集中管理需求卡片的拖拽功能：
 * - 拖拽进入
 * - 拖拽离开
 * - 放置操作
 */

import { useStore } from '../store/useStore';

export function useDragDrop() {
  const setDragOverPool = useStore((state) => state.setDragOverPool);
  const moveRequirement = useStore((state) => state.moveRequirement);

  const handleDragEnter = (poolId: string) => {
    setDragOverPool(poolId);
  };

  const handleDragLeave = () => {
    setDragOverPool(null);
  };

  const handleDrop = (targetPoolId: string) => {
    const event = window.event as DragEvent;
    if (!event || !event.dataTransfer) return;

    const reqId = event.dataTransfer.getData('requirementId');
    const sourcePoolId = event.dataTransfer.getData('sourcePoolId');

    if (!reqId) return;

    moveRequirement(reqId, sourcePoolId, targetPoolId);
  };

  return {
    handleDragEnter,
    handleDragLeave,
    handleDrop,
  };
}
