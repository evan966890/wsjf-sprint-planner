# EditRequirementModal.tsx 重构指南

> **难度**: ⭐⭐⭐⭐⭐ (最复杂)
> **预计工时**: 6-8 小时
> **当前行数**: 2044
> **目标行数**: < 480

---

## 📋 重构概览

### 当前问题

这是项目中最复杂的组件，包含：
- **40+ 个 useState**（表单字段、AI状态、文档管理等）
- **AI 分析功能**（~400行代码）
- **文档管理功能**（~300行代码）
- **复杂的表单逻辑**（~500行）
- **大量的 UI 渲染代码**（~800行）

### 拆分方案

```
src/components/edit-requirement/
├── EditRequirementModal.tsx         (~280行) - 主容器
├── sections/
│   ├── BasicInfoSection.tsx         (~150行) - 基础信息
│   ├── BusinessImpactSection.tsx    (~200行) - 业务影响度
│   ├── ComplexitySection.tsx        (~150行) - 复杂度评估
│   ├── AIAnalysisSection.tsx        (~200行) - AI分析
│   └── DocumentSection.tsx          (~200行) - 文档管理
└── hooks/
    ├── useRequirementForm.ts        (~200行) - 表单状态管理
    ├── useAIAnalysis.ts             (~250行) - AI分析逻辑
    └── useDocumentManager.ts        (~150行) - 文档管理逻辑
```

**总计**：从 2044 行拆分为 9 个文件，平均每个文件 ~200 行

---

## 🔧 步骤 1：创建目录结构

```bash
mkdir -p src/components/edit-requirement/sections
mkdir -p src/components/edit-requirement/hooks
```

---

## 📝 步骤 2：提取表单状态管理 Hook

### 创建 `src/components/edit-requirement/hooks/useRequirementForm.ts`

```typescript
/**
 * 需求表单状态管理 Hook
 *
 * 功能：
 * - 管理所有表单字段状态
 * - 表单验证
 * - 实时预览计算
 */

import { useState, useCallback, useMemo } from 'react';
import type { Requirement } from '../../../types';
import { calculateScores } from '../../../utils/scoring';

export function useRequirementForm(initialRequirement: Requirement | null) {
  const [form, setForm] = useState<Requirement>(() => {
    return initialRequirement || {
      id: `REQ-${Date.now()}`,
      name: '',
      submitterName: '',
      productManager: '',
      developer: '',
      effortDays: 0,
      bv: '明显',
      tc: '随时',
      hardDeadline: false,
      techProgress: '未评估',
      productProgress: '未评估',
      type: '功能开发',
      submitDate: new Date().toISOString().split('T')[0],
      submitter: '产品',
      isRMS: false,
      businessDomain: '国际零售通用',
      // ... 其他默认值
    };
  });

  /**
   * 更新单个字段
   */
  const updateField = useCallback(<K extends keyof Requirement>(
    field: K,
    value: Requirement[K]
  ) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  /**
   * 批量更新字段
   */
  const updateFields = useCallback((updates: Partial<Requirement>) => {
    setForm(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * 重置表单
   */
  const resetForm = useCallback(() => {
    if (initialRequirement) {
      setForm(initialRequirement);
    }
  }, [initialRequirement]);

  /**
   * 表单验证
   */
  const validate = useCallback((): string | null => {
    if (!form.name?.trim()) {
      return '需求名称不能为空';
    }
    if (form.effortDays < 0) {
      return '工作量不能为负数';
    }
    return null;
  }, [form]);

  /**
   * 实时预览分数（单个需求）
   */
  const previewScores = useMemo(() => {
    const calculated = calculateScores([form]);
    return calculated[0];
  }, [form]);

  return {
    form,
    updateField,
    updateFields,
    resetForm,
    validate,
    previewScores,
  };
}
```

---

## 🤖 步骤 3：提取 AI 分析逻辑 Hook

### 创建 `src/components/edit-requirement/hooks/useAIAnalysis.ts`

```typescript
/**
 * AI 分析功能 Hook
 *
 * 功能：
 * - 调用 AI API 分析需求
 * - 解析文档内容
 * - AI 打分建议
 * - 结果应用
 */

import { useState, useCallback } from 'react';
import type { Requirement, AIModelType, AIAnalysisResult } from '../../../types';
import { OPENAI_API_KEY, DEEPSEEK_API_KEY } from '../../../config/api';
import { parseFile } from '../../../utils/fileParser';

export type AIAdoptionStatus = 'pending' | 'partial' | 'full';

export function useAIAnalysis() {
  const [selectedAIModel, setSelectedAIModel] = useState<AIModelType>('deepseek');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStep, setAnalysisStep] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adoptionStatus, setAdoptionStatus] = useState<AIAdoptionStatus>('pending');

  /**
   * 执行 AI 分析
   */
  const analyze = useCallback(async (
    requirement: Requirement,
    documents: Array<{ title: string; content?: string; url?: string }>
  ) => {
    const apiKey = selectedAIModel === 'openai' ? OPENAI_API_KEY : DEEPSEEK_API_KEY;

    if (!apiKey) {
      setError(`${selectedAIModel === 'openai' ? 'OpenAI' : 'DeepSeek'} API Key 未配置`);
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisProgress(0);

    try {
      // 步骤1：解析文档
      setAnalysisStep('正在解析文档...');
      setAnalysisProgress(20);
      const documentContents = await parseDocuments(documents);

      // 步骤2：构建提示词
      setAnalysisStep('正在构建分析提示词...');
      setAnalysisProgress(40);
      const prompt = buildAnalysisPrompt(requirement, documentContents);

      // 步骤3：调用 AI API
      setAnalysisStep('正在调用 AI 分析...');
      setAnalysisProgress(60);
      const result = await callAIAPI(prompt, selectedAIModel, apiKey);

      // 步骤4：解析结果
      setAnalysisStep('正在解析分析结果...');
      setAnalysisProgress(80);
      const parsedResult = parseAIResponse(result);

      setAnalysisResult(parsedResult);
      setAnalysisProgress(100);
      setAnalysisStep('分析完成');
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析失败');
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedAIModel]);

  /**
   * 采纳全部 AI 建议
   */
  const adoptAll = useCallback(() => {
    setAdoptionStatus('full');
  }, []);

  /**
   * 采纳部分 AI 建议
   */
  const adoptPartial = useCallback((fields: string[]) => {
    setAdoptionStatus('partial');
  }, []);

  /**
   * 重置分析
   */
  const resetAnalysis = useCallback(() => {
    setAnalysisResult(null);
    setError(null);
    setAnalysisProgress(0);
    setAnalysisStep('');
    setAdoptionStatus('pending');
  }, []);

  return {
    selectedAIModel,
    setSelectedAIModel,
    isAnalyzing,
    analysisProgress,
    analysisStep,
    analysisResult,
    error,
    adoptionStatus,
    analyze,
    adoptAll,
    adoptPartial,
    resetAnalysis,
  };
}

// ============================================================================
// 辅助函数
// ============================================================================

async function parseDocuments(documents: any[]): Promise<string[]> {
  // 解析文档内容
  return documents.map(doc => doc.content || doc.url || '');
}

function buildAnalysisPrompt(requirement: Requirement, documents: string[]): string {
  return `请分析以下需求：

需求名称：${requirement.name}
业务域：${requirement.businessDomain}
工作量：${requirement.effortDays} 天

相关文档：
${documents.join('\n\n')}

请评估：
1. 业务影响度（局部/明显/撬动核心/战略平台）
2. 复杂度评估
3. 相关指标影响

以 JSON 格式返回结果。`;
}

async function callAIAPI(prompt: string, model: AIModelType, apiKey: string): Promise<string> {
  const apiUrl = model === 'openai'
    ? 'https://api.openai.com/v1/chat/completions'
    : 'https://api.deepseek.com/v1/chat/completions';

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model === 'openai' ? 'gpt-3.5-turbo' : 'deepseek-chat',
      messages: [
        { role: 'system', content: '你是一个专业的产品需求分析专家。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    throw new Error(`API 调用失败: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

function parseAIResponse(response: string): AIAnalysisResult {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('解析 AI 响应失败:', error);
  }

  return {
    businessImpactScore: '明显',
    reasoning: '解析失败',
    suggestedMetrics: [],
  };
}
```

---

## 📄 步骤 4：提取文档管理逻辑 Hook

### 创建 `src/components/edit-requirement/hooks/useDocumentManager.ts`

```typescript
/**
 * 文档管理 Hook
 *
 * 功能：
 * - 文档上传
 * - 文档列表管理
 * - 文档预览
 * - 文档删除
 */

import { useState, useCallback } from 'react';
import { parseFile, isSupportedFile } from '../../../utils/fileParser';

export interface Document {
  id: string;
  title: string;
  url?: string;
  content?: string;
  fileInfo?: {
    name: string;
    size: number;
    type: string;
  };
}

export function useDocumentManager(initialDocuments: Document[] = []) {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [previewFileId, setPreviewFileId] = useState<string | null>(null);

  /**
   * 添加链接文档
   */
  const addLinkDocument = useCallback((title: string, url: string) => {
    const newDoc: Document = {
      id: `DOC-${Date.now()}`,
      title,
      url,
    };
    setDocuments(prev => [...prev, newDoc]);
  }, []);

  /**
   * 上传文件文档
   */
  const uploadFileDocument = useCallback(async (file: File) => {
    if (!isSupportedFile(file.name)) {
      throw new Error('不支持的文件格式');
    }

    // 解析文件内容
    const parsedContent = await parseFile(file);

    const fileInfo = {
      id: `FILE-${Date.now()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      parsedContent,
    };

    setUploadedFiles(prev => [...prev, fileInfo]);
    return fileInfo;
  }, []);

  /**
   * 删除文档
   */
  const removeDocument = useCallback((docId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== docId));
  }, []);

  /**
   * 删除上传的文件
   */
  const removeFile = useCallback((fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
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

  return {
    documents,
    uploadedFiles,
    previewFileId,
    addLinkDocument,
    uploadFileDocument,
    removeDocument,
    removeFile,
    previewFile,
    closePreview,
  };
}
```

---

## 🎨 步骤 5：拆分 UI Section 组件

### 创建 `src/components/edit-requirement/sections/BasicInfoSection.tsx`

```typescript
/**
 * 基础信息 Section
 */

import type { Requirement } from '../../../types';

interface BasicInfoSectionProps {
  form: Requirement;
  onUpdate: <K extends keyof Requirement>(field: K, value: Requirement[K]) => void;
}

const BasicInfoSection = ({ form, onUpdate }: BasicInfoSectionProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">基础信息</h3>

      {/* 需求名称 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          需求名称 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => onUpdate('name', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="请输入需求名称"
        />
      </div>

      {/* 提交人 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            提交人
          </label>
          <input
            type="text"
            value={form.submitterName || ''}
            onChange={(e) => onUpdate('submitterName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="提交人姓名"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            产品经理
          </label>
          <input
            type="text"
            value={form.productManager || ''}
            onChange={(e) => onUpdate('productManager', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="产品经理姓名"
          />
        </div>
      </div>

      {/* 开发人员 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          开发负责人
        </label>
        <input
          type="text"
          value={form.developer || ''}
          onChange={(e) => onUpdate('developer', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          placeholder="开发负责人姓名"
        />
      </div>

      {/* 需求类型 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          需求类型
        </label>
        <select
          value={form.type}
          onChange={(e) => onUpdate('type', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="功能开发">功能开发</option>
          <option value="技术债">技术债</option>
          <option value="Bug修复">Bug修复</option>
        </select>
      </div>
    </div>
  );
};

export default BasicInfoSection;
```

### 创建其他 Section 组件

按照相同模式创建：
- `BusinessImpactSection.tsx` - 业务影响度选择
- `ComplexitySection.tsx` - 复杂度和工作量
- `AIAnalysisSection.tsx` - AI 分析面板
- `DocumentSection.tsx` - 文档管理

（由于篇幅限制，这里仅展示基础信息 Section，其他 Section 按照相同模式创建）

---

## 📦 步骤 6：重构主组件

### 修改 `src/components/EditRequirementModal.tsx`

大幅精简，使用提取的 Hooks 和 Sections：

```typescript
/**
 * 需求编辑弹窗 - 重构版
 */

import { X, Save } from 'lucide-react';
import type { Requirement } from '../types';
import { useRequirementForm } from './edit-requirement/hooks/useRequirementForm';
import { useAIAnalysis } from './edit-requirement/hooks/useAIAnalysis';
import { useDocumentManager } from './edit-requirement/hooks/useDocumentManager';
import BasicInfoSection from './edit-requirement/sections/BasicInfoSection';
import BusinessImpactSection from './edit-requirement/sections/BusinessImpactSection';
import ComplexitySection from './edit-requirement/sections/ComplexitySection';
import AIAnalysisSection from './edit-requirement/sections/AIAnalysisSection';
import DocumentSection from './edit-requirement/sections/DocumentSection';

interface EditRequirementModalProps {
  requirement: Requirement | null;
  onSave: (req: Requirement) => void;
  onClose: () => void;
  isNew?: boolean;
}

const EditRequirementModal = ({
  requirement,
  onSave,
  onClose,
  isNew = false
}: EditRequirementModalProps) => {
  // Hooks
  const {
    form,
    updateField,
    updateFields,
    validate,
    previewScores
  } = useRequirementForm(requirement);

  const aiAnalysis = useAIAnalysis();
  const documentManager = useDocumentManager();

  // 保存处理
  const handleSave = () => {
    const error = validate();
    if (error) {
      alert(error);
      return;
    }

    onSave({
      ...form,
      displayScore: previewScores.displayScore,
      stars: previewScores.stars,
    });
    onClose();
  };

  // AI 分析处理
  const handleAIAnalyze = async () => {
    await aiAnalysis.analyze(form, documentManager.documents);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {isNew ? '新增需求' : '编辑需求'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 基础信息 */}
          <BasicInfoSection form={form} onUpdate={updateField} />

          {/* 业务影响度 */}
          <BusinessImpactSection form={form} onUpdate={updateField} />

          {/* 复杂度评估 */}
          <ComplexitySection form={form} onUpdate={updateField} />

          {/* 文档管理 */}
          <DocumentSection
            documents={documentManager.documents}
            uploadedFiles={documentManager.uploadedFiles}
            onAddLink={documentManager.addLinkDocument}
            onUploadFile={documentManager.uploadFileDocument}
            onRemoveDocument={documentManager.removeDocument}
            onRemoveFile={documentManager.removeFile}
          />

          {/* AI 分析 */}
          <AIAnalysisSection
            analysis={aiAnalysis}
            onAnalyze={handleAIAnalyze}
            onAdopt={(fields) => updateFields(fields)}
          />

          {/* 实时预览 */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">实时预览</h3>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">权重分:</span>
              <span className="text-2xl font-bold text-blue-600">
                {previewScores.displayScore?.toFixed(1) || 0}
              </span>
              <span className="text-yellow-500">
                {'★'.repeat(previewScores.stars || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2"
          >
            <Save size={18} />
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditRequirementModal;
```

---

## ✅ 步骤 7：测试

### 功能测试清单

- [ ] 表单所有字段输入正常
- [ ] 基础信息保存正常
- [ ] 业务影响度选择正常
- [ ] 复杂度评估正常
- [ ] 文档上传正常
- [ ] 文档链接添加正常
- [ ] AI 分析功能正常
- [ ] AI 建议采纳正常
- [ ] 实时预览计算正确
- [ ] 保存功能正常
- [ ] 取消关闭正常

### 文件大小验证

```bash
npm run check-file-size
```

**期望输出**：
```
✅ src/components/EditRequirementModal.tsx - ~280 行
✅ src/components/edit-requirement/sections/BasicInfoSection.tsx - ~150 行
✅ src/components/edit-requirement/sections/BusinessImpactSection.tsx - ~200 行
✅ src/components/edit-requirement/sections/ComplexitySection.tsx - ~150 行
✅ src/components/edit-requirement/sections/AIAnalysisSection.tsx - ~200 行
✅ src/components/edit-requirement/sections/DocumentSection.tsx - ~200 行
✅ src/components/edit-requirement/hooks/useRequirementForm.ts - ~200 行
✅ src/components/edit-requirement/hooks/useAIAnalysis.ts - ~250 行
✅ src/components/edit-requirement/hooks/useDocumentManager.ts - ~150 行
```

---

## 📝 步骤 8：提交

```bash
git add .
git commit -m "refactor: reduce EditRequirementModal from 2044 to ~280 lines

Major refactoring of the most complex component:

Extracted Hooks:
- useRequirementForm.ts - Form state management (~200 lines)
- useAIAnalysis.ts - AI analysis logic (~250 lines)
- useDocumentManager.ts - Document management (~150 lines)

Extracted Sections:
- BasicInfoSection.tsx - Basic fields (~150 lines)
- BusinessImpactSection.tsx - Impact selection (~200 lines)
- ComplexitySection.tsx - Complexity assessment (~150 lines)
- AIAnalysisSection.tsx - AI analysis panel (~200 lines)
- DocumentSection.tsx - Document management (~200 lines)

✅ File size: 2044 → 280 lines (reduced by 1764 lines!)
✅ All tests passing
✅ Build successful
"
```

---

## 🎉 完成！

EditRequirementModal.tsx 已从 2044 行减少到 ~280 行！

这是项目中最复杂的重构任务。完成后，整个项目将符合文件大小规范。

**恭喜！🎊**
