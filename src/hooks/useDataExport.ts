/**
 * 数据导出/导入 Hook
 * v1.6.0升级：支持双模式导出和完整数据导入
 *
 * 功能：
 * - 双模式导出：展示模式（30+字段）+ 数据模式（完整备份）
 * - 多格式支持：Excel（单/多Sheet）+ JSON
 * - 完整导入：验证 + 预览 + 自动修复
 * - 脏数据兼容：自动清理无效引用
 */

import { useCallback, useState } from 'react';
import type { Requirement, SprintPool } from '../types';
import type {
  ExportConfig,
  ImportOptions,
  ImportValidationResult,
  ImportResult,
} from '../types/export';
import { exportData } from '../services/exportService';
import { readImportFile, importData as executeImport } from '../services/importService';
import { validateImportData } from '../services/validationService';

export function useDataExport(
  sprintPools: SprintPool[],
  unscheduled: Requirement[],
  setRequirements?: (requirements: Requirement[]) => void,
  setSprintPools?: (pools: SprintPool[]) => void,
  setUnscheduled?: (requirements: Requirement[]) => void
) {
  // 导入状态
  const [isImporting, setIsImporting] = useState(false);
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null);

  /**
   * 双模式导出功能
   */
  const handleExport = useCallback((config: ExportConfig) => {
    exportData(sprintPools, unscheduled, config);
  }, [sprintPools, unscheduled]);

  /**
   * 验证导入文件
   */
  const handleValidateImport = useCallback(async (file: File): Promise<ImportValidationResult> => {
    try {
      setIsImporting(true);
      const payload = await readImportFile(file);
      const result = validateImportData(payload);
      setValidationResult(result);
      return result;
    } catch (error) {
      const errorResult: ImportValidationResult = {
        isValid: false,
        errors: [{
          code: 'FILE_READ_ERROR',
          message: '文件读取失败',
          severity: 'critical',
          details: (error as Error).message,
        }],
        warnings: [],
      };
      setValidationResult(errorResult);
      return errorResult;
    } finally {
      setIsImporting(false);
    }
  }, []);

  /**
   * 执行导入
   */
  const handleImport = useCallback(async (
    file: File,
    options: ImportOptions
  ): Promise<ImportResult> => {
    try {
      setIsImporting(true);

      // 1. 读取文件
      const payload = await readImportFile(file);

      // 2. 执行导入
      const result = executeImport(payload, options);

      // 3. 如果成功，根据合并模式更新状态
      if (result.success) {
        if (options.mergeMode === 'replace') {
          // 替换模式：直接覆盖
          if (setRequirements) setRequirements(payload.requirements);
          if (setSprintPools) setSprintPools(payload.sprintPools);

          // 筛选待排期需求
          if (setUnscheduled) {
            const newUnscheduled = payload.requirements.filter(r =>
              payload.unscheduledIds.includes(r.id)
            );
            setUnscheduled(newUnscheduled);
          }
        } else {
          // 追加模式：合并数据（去重）
          if (setRequirements && setSprintPools && setUnscheduled) {
            // 收集当前所有需求ID
            const currentReqIds = new Set<string>();
            unscheduled.forEach(r => currentReqIds.add(r.id));
            sprintPools.forEach(pool => {
              pool.requirements.forEach(r => currentReqIds.add(r.id));
            });

            // 过滤出新的需求（不在当前数据中）
            const newRequirements = payload.requirements.filter(r => !currentReqIds.has(r.id));

            // 合并所有需求
            const allReqs = [...unscheduled, ...sprintPools.flatMap(p => p.requirements), ...newRequirements];
            setRequirements(allReqs);

            // 追加待排期需求
            const newUnscheduledReqs = payload.requirements.filter(r =>
              payload.unscheduledIds.includes(r.id) && !currentReqIds.has(r.id)
            );
            setUnscheduled([...unscheduled, ...newUnscheduledReqs]);

            // 迭代池保持不变（不追加迭代池数据）
          }
        }
      }

      return result;
    } catch (error) {
      return {
        success: false,
        importedRequirements: 0,
        importedSprintPools: 0,
        skippedRequirements: 0,
        errors: [{
          code: 'IMPORT_ERROR',
          message: '导入失败',
          severity: 'critical',
          details: (error as Error).message,
        }],
      };
    } finally {
      setIsImporting(false);
      setValidationResult(null);
    }
  }, [setRequirements, setSprintPools, setUnscheduled]);

  return {
    // 导出功能
    handleExport,

    // 导入功能
    handleValidateImport,
    handleImport,
    isImporting,
    validationResult,
  };
}
