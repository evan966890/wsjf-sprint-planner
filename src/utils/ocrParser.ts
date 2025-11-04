/**
 * OCR解析工具
 *
 * 功能：
 * - 检测PDF是否需要OCR
 * - 提供OCR转换指引
 * - 支持双OCR后端（OCR.space + 百度OCR）
 * - 用户可选择使用哪个后端
 */

export type OCRBackend = 'ocrspace' | 'baidu' | 'auto';

/**
 * 检测PDF是否是扫描件（需要OCR）
 *
 * @param extractedText - 从PDF提取的文本
 * @param pageCount - PDF页数
 * @returns 是否需要OCR
 */
export function needsOCR(extractedText: string, pageCount: number = 1): boolean {
  const trimmedText = extractedText.trim();
  const charCount = trimmedText.length;

  // 规则1: 完全没有文本
  if (charCount === 0) {
    return true;
  }

  // 规则2: 文本过少（平均每页少于50字符）
  const charsPerPage = charCount / pageCount;
  if (charsPerPage < 50) {
    return true;
  }

  // 规则3: 文本密度太低（每页少于100字符）
  if (charsPerPage < 100) {
    return true;
  }

  return false;
}

/**
 * OCR检测结果
 */
export interface OCRDetectionResult {
  needsOCR: boolean;
  charCount: number;
  pageCount: number;
  charsPerPage: number;
  suggestion: string;
  guideUrl: string;
}

/**
 * 检测并提供OCR建议
 *
 * @param extractedText - 从PDF提取的文本
 * @param pageCount - PDF页数
 * @param fileName - 文件名
 * @returns OCR检测结果
 */
export function detectOCRNeeds(
  extractedText: string,
  pageCount: number,
  fileName: string
): OCRDetectionResult {
  const trimmedText = extractedText.trim();
  const charCount = trimmedText.length;
  const charsPerPage = charCount / pageCount;
  const isOCRNeeded = needsOCR(extractedText, pageCount);

  let suggestion = '';
  let guideUrl = '';

  if (isOCRNeeded) {
    if (charCount === 0) {
      suggestion = `此PDF文件 "${fileName}" 没有文字层，是扫描件或图片PDF，需要使用OCR识别。

系统会自动调用OCR API进行识别：
- 自动选择最佳OCR后端（中文→百度，英文→OCR.space）
- 识别完成后自动填充表单字段
- 支持智能提取需求信息

请确保OCR服务器已启动（npm run dev:full）`;

      guideUrl = '';
    } else {
      suggestion = `此PDF文件 "${fileName}" 文本内容较少（共${charCount}字符，${pageCount}页，平均每页${Math.round(charsPerPage)}字符），可能是扫描质量较差或部分页面为图片。

建议使用OCR识别获得更好效果：
- 系统会自动选择最佳OCR引擎
- 智能提取需求字段
- 自动填充表单

或者，您可以继续使用当前提取的文本（可能不完整）。`;

      guideUrl = '';
    }
  }

  return {
    needsOCR: isOCRNeeded,
    charCount,
    pageCount,
    charsPerPage,
    suggestion,
    guideUrl
  };
}

/**
 * 调用后端OCR服务（支持双后端）
 *
 * 注意：需要后端提供 /api/ocr 接口
 * 支持 OCR.space 和百度OCR两种后端
 *
 * @param file - 文件对象
 * @param backend - OCR后端选择 ('ocrspace', 'baidu', 'auto')
 * @param apiUrl - 后端API地址
 * @returns 转换后的文本内容
 */
export async function callOCRAPI(
  file: File,
  backend: OCRBackend = 'auto',
  apiUrl: string = '/api/ocr'
): Promise<{ text: string; backend_used: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('backend', backend);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'OCR转换失败');
    }

    return {
      text: data.text,
      backend_used: data.backend_used || backend
    };

  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        throw new Error(
          'OCR服务器未启动或无法连接。\n' +
          '请运行: npm run dev:full 或 npm run ocr:server\n' +
          '详见：docs/OCR_INTEGRATION_GUIDE.md'
        );
      }
      throw error;
    }
    throw new Error('OCR转换失败');
  }
}

/**
 * OCR服务状态检查
 *
 * @returns OCR服务是否可用
 * @deprecated 请使用 ocrClient.ts 中的 checkOCRService()
 */
export async function checkOCRServiceAvailable(): Promise<boolean> {
  // 已弃用：请使用 src/utils/ocrClient.ts 中的 checkOCRService()
  return false;
}

/**
 * 格式化OCR建议为用户友好的消息
 *
 * @param result - OCR检测结果
 * @returns 格式化的消息
 */
export function formatOCRSuggestion(result: OCRDetectionResult): string {
  if (!result.needsOCR) {
    return '';
  }

  return result.suggestion;
}
