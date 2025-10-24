/**
 * 文件导入辅助工具
 * 包含文件解析和字段自动映射功能
 */

import * as XLSX from 'xlsx';

/**
 * 解析文件（CSV或Excel）
 */
export const parseFileContent = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsBinaryString(file);
  });
};

/**
 * 自动映射字段（模糊匹配）
 * 匹配系统字段和导入文件的字段
 */
export const autoMapFields = (sampleRow: any): Record<string, string> => {
  const mapping: Record<string, string> = {};
  const fileFields = Object.keys(sampleRow);

  // 系统字段定义
  const systemFields: Record<string, string[]> = {
    name: ['需求名称', '名称', 'name', 'title', '标题', '需求', 'requirement', '功能'],
    submitterName: ['提交人', '提交人姓名', 'submitter', 'author', '作者'],
    productManager: ['产品经理', '产品', 'pm', 'product manager', '负责人', '产品主r'],
    developer: ['开发人员', '开发', 'developer', 'dev', '开发者', '研发主r', '研发负责人'],
    effortDays: ['工作量', '人天', 'effort', 'days', '天数', '工时', '预估工时', 'workday'],
    bv: ['业务影响度', 'bv', 'business value', '价值', '重要性', '业务重要性'],
    tc: ['时间窗口', 'tc', 'time critical', '时间临界', '临界性', '紧急', '迫切'],
    hardDeadline: ['强制截止', 'ddl', 'deadline', '截止', '上线时间', '交付时间'],
    type: ['类型', 'type', '需求类型'],
    submitDate: ['提交日期', '日期', 'date', '提交时间', '开始时间'],
    submitter: ['提交者', '提交方', '来源'],
    isRMS: ['是否RMS', 'rms', 'is rms'],
  };

  // 对每个文件字段进行匹配
  fileFields.forEach(fileField => {
    const normalizedFileField = fileField.toLowerCase().trim();

    for (const [systemField, keywords] of Object.entries(systemFields)) {
      const matched = keywords.some(keyword =>
        normalizedFileField.includes(keyword.toLowerCase()) ||
        keyword.toLowerCase().includes(normalizedFileField)
      );

      if (matched && !Object.values(mapping).includes(fileField)) {
        mapping[systemField] = fileField;
        break;
      }
    }
  });

  return mapping;
};
