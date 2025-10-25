/**
 * Word文档解析工具
 *
 * 功能：
 * - 解析Word文档(.docx)为文本
 * - 支持前端直接解析
 *
 * 注意：仅支持.docx格式（不支持旧的.doc格式）
 */

/**
 * 解析Word文档
 *
 * @param file - Word文件对象
 * @returns 提取的文本内容
 */
export async function parseWord(file: File): Promise<string> {
  try {
    // 检查文件类型
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.docx')) {
      throw new Error('仅支持 .docx 格式（不支持旧的 .doc 格式）');
    }

    // 使用mammoth.js解析Word文档
    // 这是一个纯JavaScript库，可以在浏览器中直接使用
    const mammoth = await import('mammoth/mammoth.browser');

    const arrayBuffer = await file.arrayBuffer();

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
    console.error('Word文档解析失败:', error);

    if (error instanceof Error) {
      throw new Error(`Word解析失败: ${error.message}`);
    }

    throw new Error('Word解析失败: 未知错误');
  }
}

/**
 * 检查文件是否是Word文档
 *
 * @param file - 文件对象
 * @returns 是否是Word文档
 */
export function isWordFile(file: File): boolean {
  const fileName = file.name.toLowerCase();
  return fileName.endsWith('.docx');
}

/**
 * 解析Word文档为Markdown格式（高级）
 *
 * @param file - Word文件对象
 * @returns Markdown格式的文本
 */
export async function parseWordToMarkdown(file: File): Promise<string> {
  try {
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.docx')) {
      throw new Error('仅支持 .docx 格式');
    }

    const mammoth = await import('mammoth/mammoth.browser');
    const arrayBuffer = await file.arrayBuffer();

    // 转换为Markdown
    const result = await mammoth.convertToMarkdown({ arrayBuffer });

    if (result.messages && result.messages.length > 0) {
      console.warn('Word转Markdown警告:', result.messages);
    }

    const markdown = result.value;

    if (!markdown || markdown.trim().length === 0) {
      throw new Error('Word文档内容为空');
    }

    return markdown.trim();

  } catch (error) {
    console.error('Word转Markdown失败:', error);

    // 降级到纯文本
    console.warn('降级使用纯文本提取...');
    return await parseWord(file);
  }
}
