/**
 * 文件解析工具
 *
 * 支持的文件类型:
 * - PDF (.pdf)
 * - Excel (.xlsx, .xls)
 * - 文本 (.txt)
 */

import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';
import { detectOCRNeeds, formatOCRSuggestion } from './ocrParser';

// 配置 PDF.js worker（使用国内可访问的CDN）
// 优先使用 unpkg.com（国内速度快），失败则自动降级到 jsdelivr
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

/**
 * PDF文本项类型
 * 兼容pdfjs-dist的TextItem类型
 */
interface PDFTextItem {
  str?: string;
  [key: string]: unknown;
}

/**
 * 解析PDF文件为文本
 * 支持多个CDN fallback机制
 * 自动检测扫描PDF并提供OCR建议
 */
export async function parsePDF(file: File): Promise<string> {
  const cdnList = [
    `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`,
    `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`,
  ];

  let lastError: Error | null = null;

  // 尝试不同的CDN
  for (let i = 0; i < cdnList.length; i++) {
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = cdnList[i];

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let fullText = '';
      const pageCount = pdf.numPages;

      // 逐页提取文本
      for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: unknown) => (item as PDFTextItem).str || '')
          .join(' ');

        fullText += `\n--- 第${pageNum}页 ---\n${pageText}\n`;
      }

      const trimmedText = fullText.trim();

      // 检测是否需要OCR
      const ocrDetection = detectOCRNeeds(trimmedText, pageCount, file.name);

      if (ocrDetection.needsOCR) {
        // 如果需要OCR，添加警告信息
        const warning = `
⚠️ OCR建议
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${formatOCRSuggestion(ocrDetection)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

当前提取的文本内容（可能不完整）：
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

        // 将警告信息添加到文本开头
        return warning + trimmedText;
      }

      return trimmedText;
    } catch (error) {
      console.warn(`CDN ${i + 1} 失败，尝试下一个:`, cdnList[i], error);
      lastError = error instanceof Error ? error : new Error('未知错误');

      // 如果不是最后一个CDN，继续尝试
      if (i < cdnList.length - 1) {
        continue;
      }
    }
  }

  // 所有CDN都失败
  console.error('PDF解析失败，所有CDN都无法访问:', lastError);
  throw new Error(`PDF解析失败: ${lastError?.message || '网络连接失败，请检查网络设置'}`);
}

/**
 * 解析Excel文件为文本
 */
export async function parseExcel(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    let fullText = '';

    // 遍历所有sheet
    workbook.SheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      fullText += `\n=== Sheet: ${sheetName} ===\n`;

      // 将每行数据转换为文本
      sheetData.forEach((row: unknown, index) => {
        if (Array.isArray(row) && row.length > 0) {
          const rowText = row.filter(cell => cell !== null && cell !== undefined).join(' | ');
          if (rowText.trim()) {
            fullText += `${index + 1}. ${rowText}\n`;
          }
        }
      });
    });

    return fullText.trim();
  } catch (error) {
    console.error('Excel解析失败:', error);
    throw new Error(`Excel解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 读取TXT文件
 */
export async function parseTXT(file: File): Promise<string> {
  try {
    const text = await file.text();
    return text.trim();
  } catch (error) {
    console.error('TXT读取失败:', error);
    throw new Error(`TXT读取失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 解析Word文档(.docx)
 */
export async function parseWord(file: File): Promise<string> {
  try {
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.docx')) {
      throw new Error('仅支持 .docx 格式（不支持旧的 .doc 格式）');
    }

    // 动态导入mammoth
    const mammoth = await import('mammoth/mammoth.browser');

    const arrayBuffer = await file.arrayBuffer();

    // 提取纯文本
    const result = await mammoth.extractRawText({ arrayBuffer });

    if (result.messages && result.messages.length > 0) {
      console.warn('Word解析警告:', result.messages);
    }

    const text = result.value;

    if (!text || text.trim().length === 0) {
      throw new Error('Word文档内容为空');
    }

    return text.trim();

  } catch (error) {
    console.error('Word解析失败:', error);
    throw new Error(`Word解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 根据文件类型自动选择解析器
 */
export async function parseFile(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.pdf')) {
    return await parsePDF(file);
  } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    return await parseExcel(file);
  } else if (fileName.endsWith('.docx')) {
    return await parseWord(file);
  } else if (fileName.endsWith('.txt')) {
    return await parseTXT(file);
  } else {
    throw new Error(`不支持的文件类型: ${file.name}`);
  }
}

/**
 * 检查文件类型是否支持
 */
export function isSupportedFile(file: File): boolean {
  const fileName = file.name.toLowerCase();
  return fileName.endsWith('.pdf') ||
         fileName.endsWith('.xlsx') ||
         fileName.endsWith('.xls') ||
         fileName.endsWith('.docx') ||
         fileName.endsWith('.txt');
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
