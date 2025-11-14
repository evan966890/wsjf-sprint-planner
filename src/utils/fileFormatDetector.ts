/**
 * 文件格式检测工具
 *
 * 用于检测上传的文件是标准格式（WSJF导出）还是通用格式（外部Excel/PDF等）
 */

import * as XLSX from 'xlsx';

/**
 * 文件格式类型
 */
export type FileFormatType =
  | 'wsjf-standard'  // WSJF系统导出的标准格式（JSON/Excel with metadata）
  | 'generic';       // 通用格式（普通Excel/PDF/图片/Word等）

/**
 * 检测结果
 */
export interface FormatDetectionResult {
  format: FileFormatType;
  confidence: number;  // 置信度 0-1
  reason: string;      // 检测理由
  fileType: string;    // 文件类型（json/xlsx/pdf等）
}

/**
 * 检测文件格式
 */
export async function detectFileFormat(file: File): Promise<FormatDetectionResult> {
  const fileName = file.name.toLowerCase();
  const fileExtension = fileName.split('.').pop() || '';

  console.log('[FileFormatDetector] 文件名:', fileName, '扩展名:', fileExtension);

  // JSON文件检测
  if (fileExtension === 'json') {
    console.log('[FileFormatDetector] 检测为JSON格式');
    return await detectJSONFormat(file);
  }

  // Excel文件检测
  if (fileExtension === 'xlsx' || fileExtension === 'xls' || fileExtension === 'csv') {
    console.log('[FileFormatDetector] 检测为Excel格式');
    return await detectExcelFormat(file);
  }

  // 其他格式（PDF/Word/图片/文本）→ 通用格式（AI智能导入）
  console.log('[FileFormatDetector] 检测为通用格式:', fileExtension);
  return {
    format: 'generic',
    confidence: 1.0,
    reason: `${fileExtension.toUpperCase()}格式文件，使用AI智能导入`,
    fileType: fileExtension,
  };
}

/**
 * 检测JSON格式
 */
async function detectJSONFormat(file: File): Promise<FormatDetectionResult> {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    // 检查是否有WSJF标准格式的元数据标识
    if (data.metadata && data.metadata.exportMode && data.metadata.version) {
      return {
        format: 'wsjf-standard',
        confidence: 1.0,
        reason: `检测到WSJF标准格式（版本${data.metadata.version}）`,
        fileType: 'json',
      };
    }

    // 可能是旧版本的JSON导出（没有metadata）
    if (data.requirements && Array.isArray(data.requirements)) {
      return {
        format: 'wsjf-standard',
        confidence: 0.8,
        reason: '检测到WSJF数据结构（旧版本）',
        fileType: 'json',
      };
    }

    // 其他JSON格式
    return {
      format: 'generic',
      confidence: 0.6,
      reason: 'JSON格式但非WSJF标准，尝试AI智能导入',
      fileType: 'json',
    };
  } catch (error) {
    return {
      format: 'generic',
      confidence: 0.3,
      reason: 'JSON解析失败，使用AI智能导入',
      fileType: 'json',
    };
  }
}

/**
 * 检测Excel格式
 */
async function detectExcelFormat(file: File): Promise<FormatDetectionResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        console.log('[FileFormatDetector] Excel Sheets:', workbook.SheetNames);

        // 检查是否有WSJF标准格式的Sheet结构
        const hasMetadataSheet = workbook.SheetNames.includes('元数据');
        const hasRequirementsSheet = workbook.SheetNames.includes('需求数据');
        const hasSprintPoolsSheet = workbook.SheetNames.includes('迭代池配置');
        const hasUnscheduledSheet = workbook.SheetNames.includes('待排期列表');

        // 完整的标准格式（4个Sheet）- 这是数据模式导出
        if (hasMetadataSheet && hasRequirementsSheet && hasSprintPoolsSheet && hasUnscheduledSheet) {
          console.log('[FileFormatDetector] 检测为完整备份格式');
          resolve({
            format: 'wsjf-standard',
            confidence: 1.0,
            reason: 'WSJF数据模式导出（4个Sheet，支持完整还原）',
            fileType: 'xlsx',
          });
          return;
        }

        // 有元数据Sheet但不完整 - 仍然是标准格式
        if (hasMetadataSheet) {
          console.log('[FileFormatDetector] 检测为标准格式（有元数据）');
          resolve({
            format: 'wsjf-standard',
            confidence: 0.9,
            reason: 'WSJF标准格式（有元数据Sheet）',
            fileType: 'xlsx',
          });
          return;
        }

        // 没有元数据Sheet → 通用Excel格式（包括展示模式导出）
        // 展示模式导出只有1个Sheet，列名虽然是WSJF的，但没有元数据标识
        console.log('[FileFormatDetector] 检测为通用Excel格式');
        resolve({
          format: 'generic',
          confidence: 1.0,
          reason: '普通Excel文件或展示模式导出，使用AI智能导入',
          fileType: 'xlsx',
        });
      } catch (error) {
        console.error('[FileFormatDetector] Excel解析失败:', error);
        resolve({
          format: 'generic',
          confidence: 0.5,
          reason: 'Excel解析失败，尝试AI智能导入',
          fileType: 'xlsx',
        });
      }
    };

    reader.onerror = () => {
      console.error('[FileFormatDetector] 文件读取失败');
      resolve({
        format: 'generic',
        confidence: 0.3,
        reason: '文件读取失败，尝试AI智能导入',
        fileType: 'xlsx',
      });
    };

    reader.readAsBinaryString(file);
  });
}

/**
 * 获取友好的格式说明
 */
export function getFormatDescription(format: FileFormatType): string {
  switch (format) {
    case 'wsjf-standard':
      return '系统导出的标准格式文件（支持完整还原）';
    case 'generic':
      return '外部文件（支持AI智能识别和映射）';
    default:
      return '未知格式';
  }
}
