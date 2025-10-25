/**
 * 文件导入辅助工具
 * 包含文件解析和字段自动映射功能
 */

import * as XLSX from 'xlsx';
import { parseFile } from './fileParser';

/**
 * 判断文件类型
 */
const getFileType = (file: File): 'excel' | 'word' | 'pdf' | 'image' | 'text' | 'unknown' => {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')) {
    return 'excel';
  }

  if (fileName.endsWith('.docx')) {
    return 'word';
  }

  if (fileName.endsWith('.pdf')) {
    return 'pdf';
  }

  if (fileName.endsWith('.png') || fileName.endsWith('.jpg') ||
      fileName.endsWith('.jpeg') || fileName.endsWith('.webp') ||
      fileName.endsWith('.bmp') || fileName.endsWith('.tiff')) {
    return 'image';
  }

  if (fileName.endsWith('.txt')) {
    return 'text';
  }

  return 'unknown';
};

/**
 * 解析Excel文件
 */
const parseExcelFile = (file: File): Promise<any[]> => {
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
 * 解析PDF/图片/文本文件为表格数据
 * 将提取的文本转换为单行数据格式
 */
const parseTextBasedFile = async (file: File): Promise<any[]> => {
  try {
    // 使用已有的parseFile函数（支持PDF和图片）
    const extractedText = await parseFile(file);

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('文件内容为空或无法提取文本');
    }

    // 将提取的文本转换为单条记录
    // 用户可以在导入界面手动映射字段
    const record = {
      '文件名': file.name,
      '提取内容': extractedText,
      '文件类型': file.type || '未知',
      '文件大小': `${(file.size / 1024).toFixed(2)} KB`,
      '提取时间': new Date().toLocaleString('zh-CN'),
    };

    return [record];
  } catch (error) {
    console.error('文本文件解析失败:', error);
    throw new Error(`文件解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
};

/**
 * 解析文件（支持Excel、CSV、Word、PDF、图片、文本）
 */
export const parseFileContent = async (file: File): Promise<any[]> => {
  const fileType = getFileType(file);

  switch (fileType) {
    case 'excel':
      return parseExcelFile(file);

    case 'word':
    case 'pdf':
    case 'image':
    case 'text':
      return parseTextBasedFile(file);

    default:
      throw new Error(`不支持的文件类型: ${file.name}`);
  }
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
    name: ['需求名称', '名称', 'name', 'title', '标题', '需求', 'requirement', '功能', '文件名'],
    submitterName: ['提交人', '提交人姓名', 'submitter', 'author', '作者'],
    productManager: ['产品经理', '产品', 'pm', 'product manager', '负责人', '产品主r'],
    developer: ['开发人员', '开发', 'developer', 'dev', '开发者', '研发主r', '研发负责人'],
    effortDays: ['工作量', '人天', 'effort', 'days', '天数', '工时', '预估工时', 'workday'],
    bv: ['业务影响度', 'bv', 'business value', '价值', '重要性', '业务重要性'],
    tc: ['时间窗口', 'tc', 'time critical', '时间临界', '临界性', '紧急', '迫切'],
    hardDeadline: ['强制截止', 'ddl', 'deadline', '截止', '上线时间', '交付时间'],
    type: ['类型', 'type', '需求类型', '文件类型'],
    submitDate: ['提交日期', '日期', 'date', '提交时间', '开始时间', '提取时间'],
    submitter: ['提交者', '提交方', '来源'],
    isRMS: ['是否RMS', 'rms', 'is rms'],
    // PDF/图片提取的内容字段
    description: ['提取内容', 'content', '内容', 'description', '描述', '说明'],
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
