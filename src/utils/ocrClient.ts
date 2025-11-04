/**
 * OCR 客户端工具
 * 调用本地 OCR API 服务器
 */

import { OCRBackend } from './ocrParser';
import { extractRequirementFromText, type ExtractedRequirement } from './requirementExtractor';

const OCR_API_URL = 'http://localhost:3001/api/ocr';

export interface OCRResult {
  success: boolean;
  text?: string;
  backend_used?: string;
  filename?: string;
  elapsed?: number;
  error?: string;
  extractedRequirement?: ExtractedRequirement; // 新增：提取的需求信息
}

/**
 * 调用 OCR API 识别文件
 *
 * @param file - 文件对象（PDF 或图片）
 * @param backend - OCR 后端选择
 * @param extractRequirement - 是否自动提取需求信息（默认true）
 * @returns OCR 识别结果
 */
export async function recognizeFile(
  file: File,
  backend: OCRBackend = 'auto',
  extractRequirement: boolean = true
): Promise<OCRResult> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('backend', backend);

    const response = await fetch(OCR_API_URL, {
      method: 'POST',
      body: formData
    });

    const result: OCRResult = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'OCR 识别失败');
    }

    // 自动提取需求信息
    if (extractRequirement && result.text) {
      const extracted = extractRequirementFromText(result.text);
      result.extractedRequirement = extracted;
    }

    return result;

  } catch (error) {
    if (error instanceof Error) {
      // 网络错误
      if (error.message.includes('Failed to fetch')) {
        throw new Error(
          'OCR 服务器未启动\n' +
          '请运行: npm run ocr:server\n' +
          '或同时启动: npm run dev:full'
        );
      }
      throw error;
    }
    throw new Error('OCR 识别失败');
  }
}

/**
 * 检查 OCR 服务是否可用
 *
 * @returns 服务是否在线
 */
export async function checkOCRService(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:3001/health', {
      method: 'GET',
      signal: AbortSignal.timeout(3000)
    });

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * 获取可用的 OCR 后端列表
 *
 * @returns 后端列表
 */
export async function getAvailableBackends() {
  try {
    const response = await fetch('http://localhost:3001/api/ocr/backends');
    const data = await response.json();
    return data.backends || [];
  } catch {
    return [];
  }
}
