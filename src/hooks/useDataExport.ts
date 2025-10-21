/**
 * 数据导出 Hook
 *
 * 功能：
 * - Excel 导出（所有需求数据）
 * - PNG 导出（可视化截图）
 * - PDF 导出（可视化PDF）
 */

import { useCallback } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Requirement, SprintPool } from '../types';

export function useDataExport(
  sprintPools: SprintPool[],
  unscheduled: Requirement[]
) {
  /**
   * 导出为Excel
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

  return {
    handleExportExcel,
    handleExportPNG,
    handleExportPDF,
  };
}
