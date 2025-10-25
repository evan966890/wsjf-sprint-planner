/**
 * OCR解析工具
 *
 * 功能：
 * - 检测PDF是否需要OCR
 * - 提供OCR转换指引
 * - 支持调用后端OCR服务（可选）
 */

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

建议操作：
1. 使用批量转换工具：双击运行 scripts/ocr-tools/batch-convert.bat
2. 或使用命令行：python scripts/ocr-tools/batch-convert.py <文件路径>
3. 详细说明参见：scripts/ocr-tools/README.md

转换后的Markdown文件可以重新上传使用。`;

      guideUrl = 'scripts/ocr-tools/README.md';
    } else {
      suggestion = `此PDF文件 "${fileName}" 文本内容较少（共${charCount}字符，${pageCount}页，平均每页${Math.round(charsPerPage)}字符），可能是扫描质量较差或部分页面为图片。

建议操作：
1. 如果确认是扫描件，使用OCR工具获得更好的识别效果
2. 批量转换工具：scripts/ocr-tools/batch-convert.bat
3. 详细说明：scripts/ocr-tools/README.md

或者，您可以继续使用当前提取的文本（可能不完整）。`;

      guideUrl = 'scripts/ocr-tools/README.md';
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
 * 调用后端OCR服务（可选）
 *
 * 如果您部署了OCR API服务器，可以使用此函数
 *
 * @param file - 文件对象
 * @param apiUrl - API服务器地址（默认：http://localhost:8000）
 * @returns 转换后的Markdown内容
 */
export async function callOCRAPI(
  file: File,
  apiUrl: string = 'http://localhost:8000/api/convert-document'
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'OCR转换失败');
    }

    return data.markdown;

  } catch (error) {
    if (error instanceof Error) {
      // 网络错误或服务器错误
      if (error.message.includes('Failed to fetch')) {
        throw new Error(
          'OCR服务器无法连接。请确认：\n' +
          '1. OCR API服务已启动（运行 scripts/ocr-tools/api-server.py）\n' +
          '2. 服务地址正确（默认: http://localhost:8000）\n' +
          '3. 或使用批量转换工具：scripts/ocr-tools/batch-convert.bat'
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
 * @param apiUrl - API服务器地址
 * @returns 服务是否可用
 */
export async function checkOCRServiceAvailable(
  apiUrl: string = 'http://localhost:8000'
): Promise<boolean> {
  try {
    const response = await fetch(`${apiUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000) // 3秒超时
    });

    return response.ok;
  } catch {
    return false;
  }
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
