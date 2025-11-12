/**
 * 数据导出/导入 Hook
 * v1.6.0升级：支持双模式导出和完整数据导入
 *
 * 功能：
 * - Excel 导出（展示模式 + 数据模式）
 * - JSON 导出（完整数据备份）
 * - PNG 导出（可视化截图）
 * - PDF 导出（可视化PDF）
 * - 数据导入（JSON/Excel）
 * - 导入验证
 */

import { useCallback, useState } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
   * 增强的导出功能（支持双模式）
   */
  const handleExportEnhanced = useCallback((config: ExportConfig) => {
    exportData(sprintPools, unscheduled, config);
  }, [sprintPools, unscheduled]);

  /**
   * 导出为Excel（保留旧接口，兼容现有代码）
   */
  const handleExportExcel = useCallback(() => {
    const exportData: any[] = [];

    // 导出迭代池中的需求
    sprintPools.forEach(pool => {
      pool.requirements.forEach(req => {
        exportData.push({
          '迭代池': pool.name,
          '需求名称': req.name,
          '需求提交人': req.submitterName || '',
          '产品经理': req.productManager || '',
          '研发同学': req.developer || '',
          '类型': req.type,
          '工作量(天)': req.effortDays,
          '业务影响度': req.businessImpactScore || req.bv,
          '技术复杂度': req.complexityScore || '-',
          '迫切程度': req.timeCriticality || req.tc,
          '强制DDL': req.hardDeadline ? '是' : '否',
          'DDL日期': req.deadlineDate || '',
          '权重分': req.displayScore || 0,
          '星级': '★'.repeat(req.stars || 0),
          '技术评估': req.techProgress,
          '业务域': req.businessDomain,
          'RMS': req.isRMS ? '是' : '否'
        });
      });
    });

    // 导出待排期的需求
    unscheduled.forEach(req => {
      exportData.push({
        '迭代池': '未排期',
        '需求名称': req.name,
        '需求提交人': req.submitterName || '',
        '产品经理': req.productManager || '',
        '研发同学': req.developer || '',
        '类型': req.type,
        '工作量(天)': req.effortDays,
        '业务影响度': req.businessImpactScore || req.bv,
        '技术复杂度': req.complexityScore || '-',
        '迫切程度': req.timeCriticality || req.tc,
        '强制DDL': req.hardDeadline ? '是' : '否',
        'DDL日期': req.deadlineDate || '',
        '权重分': req.displayScore || 0,
        '星级': '★'.repeat(req.stars || 0),
        '技术评估': req.techProgress,
        '业务域': req.businessDomain,
        'RMS': req.isRMS ? '是' : '否'
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'WSJF排期');

    // 自动列宽
    const maxWidth = 50;
    const colsWidth = exportData.reduce((acc: any[], row) => {
      Object.keys(row).forEach((key, idx) => {
        const value = String(row[key]);
        const width = Math.min(Math.max(value.length, key.length) + 2, maxWidth);
        if (!acc[idx] || acc[idx].wch < width) {
          acc[idx] = { wch: width };
        }
      });
      return acc;
    }, []);
    worksheet['!cols'] = colsWidth;

    XLSX.writeFile(workbook, `WSJF排期_${new Date().toISOString().split('T')[0]}.xlsx`);
  }, [sprintPools, unscheduled]);

  /**
   * 导出为PNG
   */
  const handleExportPNG = useCallback(async () => {
    const element = document.body;
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#f3f4f6'
    });

    const link = document.createElement('a');
    link.download = `WSJF排期_${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, []);

  /**
   * 导出为PDF
   */
  const handleExportPDF = useCallback(async () => {
    const element = document.body;
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#f3f4f6'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const imgWidth = 297; // A4 landscape width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(`WSJF排期_${new Date().toISOString().split('T')[0]}.pdf`);
  }, []);

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
    // 旧接口（向后兼容）
    handleExportExcel,
    handleExportPNG,
    handleExportPDF,

    // 新增接口
    handleExportEnhanced,
    handleValidateImport,
    handleImport,
    isImporting,
    validationResult,
  };
}
