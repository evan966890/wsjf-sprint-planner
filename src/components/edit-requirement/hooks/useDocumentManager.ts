/**
 * 文档管理 Hook
 *
 * 功能：
 * - 文档链接添加/删除
 * - 文件上传（PDF/Excel）
 * - 文件解析
 * - 文件预览
 */

import { useState, useCallback } from 'react';
import type { Document } from '../../../types';
import { parseFile } from '../../../utils/fileParser';

/**
 * 上传文件信息接口
 */
export interface UploadedFileInfo {
  id: string;
  file: File;
  name: string;
  size: number;
  type: 'pdf' | 'excel';
  uploadedAt: string;
  parseStatus: 'parsing' | 'success' | 'error';
  parsedContent?: string;
  parsedWordCount?: number;
  pageCount?: number;
  sheetCount?: number;
  errorMessage?: string;
}

export function useDocumentManager(initialDocuments: Document[] = []) {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileInfo[]>([]);
  const [previewFileId, setPreviewFileId] = useState<string | null>(null);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocUrl, setNewDocUrl] = useState('');

  /**
   * 从URL中提取文件名
   */
  const extractFileNameFromUrl = useCallback((url: string): string => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      // 从路径中获取最后一段作为文件名
      const segments = pathname.split('/').filter(s => s.length > 0);
      if (segments.length > 0) {
        const lastSegment = segments[segments.length - 1];
        return decodeURIComponent(lastSegment);
      }

      // 如果无法提取，使用主机名
      return urlObj.hostname || '文档链接';
    } catch {
      // URL解析失败，尝试从路径中提取
      const parts = url.split('/').filter(p => p.trim().length > 0);
      if (parts.length > 0) {
        return parts[parts.length - 1].substring(0, 50); // 限制长度
      }
      return '文档链接';
    }
  }, []);

  /**
   * URL变化时自动提取标题
   */
  const handleUrlChange = useCallback((url: string) => {
    setNewDocUrl(url);

    // 如果用户还没有输入标题，自动从URL提取
    if (!newDocTitle.trim() && url.trim()) {
      const extractedTitle = extractFileNameFromUrl(url);
      setNewDocTitle(extractedTitle);
    }
  }, [newDocTitle, extractFileNameFromUrl]);

  /**
   * 添加文档链接
   */
  const addDocument = useCallback(() => {
    if (!newDocUrl.trim()) return;

    // 如果没有标题，自动从URL提取
    const finalTitle = newDocTitle.trim() || extractFileNameFromUrl(newDocUrl);

    const newDoc: Document = {
      id: `DOC-${Date.now()}`,
      fileName: finalTitle,
      fileType: 'link',
      fileSize: 0,
      uploadedAt: new Date().toISOString(),
      url: newDocUrl
    };

    setDocuments(prev => [...prev, newDoc]);
    setNewDocTitle('');
    setNewDocUrl('');
  }, [newDocUrl, newDocTitle, extractFileNameFromUrl]);

  /**
   * 删除文档
   */
  const removeDocument = useCallback((index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  }, []);

  /**
   * 上传文件并解析
   */
  const uploadFile = useCallback(async (file: File) => {
    // 文件类型验证
    const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isExcel = file.type.includes('spreadsheet') ||
                    file.name.toLowerCase().endsWith('.xlsx') ||
                    file.name.toLowerCase().endsWith('.xls');

    if (!isPDF && !isExcel) {
      throw new Error('仅支持 PDF 和 Excel 文件');
    }

    // 文件大小验证（10MB）
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new Error(`文件大小不能超过 ${(MAX_SIZE / 1024 / 1024).toFixed(0)}MB`);
    }

    // 创建文件信息对象
    const fileInfo: UploadedFileInfo = {
      id: `FILE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      name: file.name,
      size: file.size,
      type: isPDF ? 'pdf' : 'excel',
      uploadedAt: new Date().toISOString(),
      parseStatus: 'parsing'
    };

    // 添加到列表（正在解析状态）
    setUploadedFiles(prev => [...prev, fileInfo]);

    // 异步解析文件
    try {
      const parsedText = await parseFile(file);
      const wordCount = parsedText?.trim().length || 0;

      // 检查内容是否为空或过少
      if (!parsedText || wordCount < 50) {
        setUploadedFiles(prev =>
          prev.map(f =>
            f.id === fileInfo.id
              ? {
                  ...f,
                  parseStatus: 'error' as const,
                  parsedContent: parsedText,
                  parsedWordCount: wordCount,
                  errorMessage: wordCount === 0
                    ? '文件内容为空，请检查文件是否正确'
                    : `内容过少（仅 ${wordCount} 字符），可能影响AI分析质量`
                }
              : f
          )
        );
        return;
      }

      // 解析成功
      setUploadedFiles(prev =>
        prev.map(f =>
          f.id === fileInfo.id
            ? {
                ...f,
                parseStatus: 'success' as const,
                parsedContent: parsedText,
                parsedWordCount: wordCount
              }
            : f
        )
      );
    } catch (err) {
      console.error('文件解析失败:', err);
      setUploadedFiles(prev =>
        prev.map(f =>
          f.id === fileInfo.id
            ? {
                ...f,
                parseStatus: 'error' as const,
                errorMessage: err instanceof Error ? err.message : '解析失败'
              }
            : f
        )
      );
    }
  }, []);

  /**
   * 删除已上传的文件
   */
  const removeFile = useCallback((fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  /**
   * 预览文件
   */
  const previewFile = useCallback((fileId: string) => {
    setPreviewFileId(fileId);
  }, []);

  /**
   * 关闭预览
   */
  const closePreview = useCallback(() => {
    setPreviewFileId(null);
  }, []);

  /**
   * 更新文档列表（用于同步表单状态）
   */
  const setDocumentList = useCallback((docs: Document[]) => {
    setDocuments(docs);
  }, []);

  return {
    // 文档链接管理
    documents,
    newDocTitle,
    newDocUrl,
    setNewDocTitle,
    setNewDocUrl,
    handleUrlChange,
    addDocument,
    removeDocument,
    setDocumentList,

    // 文件上传管理
    uploadedFiles,
    uploadFile,
    removeFile,
    previewFileId,
    previewFile,
    closePreview,
  };
}
