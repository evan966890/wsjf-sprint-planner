/**
 * 数据导入 Hook
 *
 * 功能：
 * - 处理文件导入
 * - 字段映射管理
 * - 导入确认处理
 */

import { parseFileContent, autoMapFields } from '../utils/fileImportHelpers';
import { transformImportRow } from '../utils/importDataTransform';
import { calculateScores } from '../utils/scoring';
import type { Requirement, SprintPool } from '../types';

interface UseDataImportOptions {
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export function useDataImport({ showToast }: UseDataImportOptions) {
  /**
   * 处理文件导入
   */
  const handleFileImport = async (
    e: React.ChangeEvent<HTMLInputElement>,
    onSuccess: (data: any[], mapping: Record<string, string>) => void
  ) => {
    const file = e.target?.files?.[0];
    if (!file) return;

    try {
      const data = await parseFileContent(file);
      if (data && data.length > 0) {
        const mapping = autoMapFields(data[0]);
        onSuccess(data, mapping);
        showToast(`成功读取 ${data.length} 条数据，已自动映射字段`, 'success');
      } else {
        showToast('文件中没有数据', 'error');
      }
    } catch (error) {
      console.error('文件解析失败:', error);
      showToast('文件解析失败，请检查文件格式', 'error');
    }

    // 清空input，允许重复导入同一文件
    e.target.value = '';
  };

  /**
   * 处理导入确认（普通映射导入）
   */
  const processNormalImport = (
    importData: any[],
    importMapping: Record<string, string>,
    requirements: Requirement[],
    sprintPools: SprintPool[],
    clearBeforeImport: boolean
  ): {
    updatedRequirements: Requirement[];
    updatedUnscheduled: Requirement[];
    updatedSprintPools: SprintPool[];
    importedCount: number;
  } => {
    // 转换导入数据为需求对象
    const newRequirements: Requirement[] = importData.map((row, index) =>
      transformImportRow(row, importMapping, index)
    );

    // 合并并计算分数
    const allReqs = clearBeforeImport ? newRequirements : [...requirements, ...newRequirements];
    const updatedRequirements = calculateScores(allReqs);

    // 处理迭代池
    const updatedSprintPools = clearBeforeImport
      ? sprintPools.map(pool => ({ ...pool, requirements: [] }))
      : sprintPools;

    // 从updated中提取新导入的需求（通过ID匹配）
    const newReqIds = new Set(newRequirements.map(r => r.id));
    const newUnscheduledFromUpdated = updatedRequirements.filter(r => newReqIds.has(r.id));

    // 排序待排期需求
    const updatedUnscheduled = newUnscheduledFromUpdated.sort(
      (a, b) => (b.displayScore || 0) - (a.displayScore || 0)
    );

    return {
      updatedRequirements,
      updatedUnscheduled,
      updatedSprintPools,
      importedCount: newRequirements.length,
    };
  };

  /**
   * 处理AI填充导入
   */
  const processAIFilledImport = (
    aiFilledData: Requirement[],
    requirements: Requirement[],
    sprintPools: SprintPool[],
    clearBeforeImport: boolean
  ): {
    updatedRequirements: Requirement[];
    updatedUnscheduled: Requirement[];
    updatedSprintPools: SprintPool[];
    importedCount: number;
  } => {
    // 只导入被勾选的需求
    const selectedRequirements = aiFilledData.filter((r: any) => r._isSelected);

    if (selectedRequirements.length === 0) {
      throw new Error('请至少勾选一条需求进行导入');
    }

    // 清理AI元数据字段（以_开头的字段）
    const cleanedRequirements: Requirement[] = selectedRequirements.map(req => {
      const cleaned: any = { ...req };
      Object.keys(cleaned).forEach(key => {
        if (key.startsWith('_')) {
          delete cleaned[key];
        }
      });
      return cleaned as Requirement;
    });

    // 计算WSJF分数
    const scoredRequirements = calculateScores(cleanedRequirements);

    // 处理迭代池
    const updatedSprintPools = clearBeforeImport
      ? sprintPools.map(pool => ({ ...pool, requirements: [] }))
      : sprintPools;

    // 根据是否清空模式导入
    const updatedRequirements = clearBeforeImport
      ? scoredRequirements
      : [...requirements, ...scoredRequirements];

    return {
      updatedRequirements,
      updatedUnscheduled: scoredRequirements,
      updatedSprintPools,
      importedCount: scoredRequirements.length,
    };
  };

  return {
    handleFileImport,
    processNormalImport,
    processAIFilledImport,
  };
}
