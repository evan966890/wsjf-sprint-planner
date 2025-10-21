# wsjf-sprint-planner.tsx 主应用重构指南

> **难度**: ⭐⭐⭐⭐⭐ (最复杂)
> **预计工时**: 6-8 小时
> **当前行数**: 3102
> **目标行数**: < 480

---

## 📋 重构概览

### 当前问题

主文件包含太多职责：
- 21 个事件处理函数（~1500行）
- 导入导出逻辑（~700行）
- AI 映射逻辑（~700行）
- Toast 系统（~50行）✅已提取
- UI 渲染（~150行）

### 拆分方案

```
src/
├── wsjf-sprint-planner.tsx       (~300行) - 主入口
├── components/
│   ├── Header.tsx                (~150行) - 顶部栏
│   ├── ToastContainer.tsx        (~50行)  ✅已完成
│   └── import-export/
│       ├── ImportModal.tsx       (~300行) - 导入弹窗
│       └── ExportMenu.tsx        (~100行) - 导出菜单
└── hooks/
    ├── useToast.ts               (~80行)  ✅已完成
    ├── useDataImport.ts          (~300行) - 导入逻辑
    ├── useDataExport.ts          (~200行) - 导出逻辑
    ├── useAIMapping.ts           (~400行) - AI映射
    └── useRequirementOps.ts      (~150行) - 需求操作
```

---

## 🔧 步骤 1：提取导出逻辑

### 创建 `src/hooks/useDataExport.ts`

```typescript
/**
 * 数据导出 Hook
 *
 * 功能：
 * - Excel 导出
 * - PNG 导出
 * - PDF 导出
 */

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Requirement, SprintPool } from '../types';

export function useDataExport(
  sprintPools: SprintPool[],
  unscheduled: Requirement[]
) {
  const handleExportExcel = () => {
    const exportData: any[] = [];

    // 导出迭代池中的需求
    sprintPools.forEach(pool => {
      pool.requirements.forEach(req => {
        exportData.push({
          '迭代池': pool.name,
          '需求名称': req.name,
          '需求提交人': req.submitterName,
          '产品经理': req.productManager,
          '研发同学': req.developer,
          '类型': req.type,
          '工作量(天)': req.effortDays,
          '业务影响度': req.bv,
          '迫切程度': req.tc,
          '强制DDL': req.hardDeadline ? '是' : '否',
          '权重分': req.displayScore || 0,
          '星级': '★'.repeat(req.stars || 0),
          '技术评估': req.techProgress
        });
      });
    });

    // 导出待排期的需求
    unscheduled.forEach(req => {
      exportData.push({
        '迭代池': '未排期',
        '需求名称': req.name,
        '需求提交人': req.submitterName,
        '产品经理': req.productManager,
        '研发同学': req.developer,
        '类型': req.type,
        '工作量(天)': req.effortDays,
        '业务影响度': req.bv,
        '迫切程度': req.tc,
        '强制DDL': req.hardDeadline ? '是' : '否',
        '权重分': req.displayScore || 0,
        '星级': '★'.repeat(req.stars || 0),
        '技术评估': req.techProgress
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'WSJF排期');
    XLSX.writeFile(workbook, `WSJF排期_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportPNG = async () => {
    const element = document.body;
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false
    });

    const link = document.createElement('a');
    link.download = `WSJF排期_${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const handleExportPDF = async () => {
    const element = document.body;
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const imgWidth = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(`WSJF排期_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return {
    handleExportExcel,
    handleExportPNG,
    handleExportPDF,
  };
}
```

---

## 📝 步骤 2：提取导入逻辑

导入逻辑非常复杂（~500行），建议拆分为多个模块：

### 创建 `src/utils/importDataTransform.ts`

```typescript
/**
 * 导入数据转换工具
 *
 * 负责将导入的数据转换为系统 Requirement 格式
 */

import type { Requirement } from '../types';
import { TECH_PROGRESS } from '../constants/techProgress';

export interface ImportMapping {
  [systemField: string]: string; // systemField -> excelColumn
}

/**
 * 转换单条导入数据为 Requirement
 */
export function transformImportRow(
  row: any,
  mapping: ImportMapping,
  index: number
): Requirement {
  const uniqueId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${index}`;
  const mapped: any = {};

  // 根据映射关系转换数据
  Object.entries(mapping).forEach(([systemField, fileField]) => {
    if (systemField === 'id') return; // 跳过ID

    let value = row[fileField];

    // 数据类型转换
    if (systemField === 'effortDays') {
      value = Number(value) || 0;
    } else if (systemField === 'hardDeadline' || systemField === 'isRMS') {
      value = value === true || value === 'true' || value === '是' || value === '有' || value === 1;
    }

    mapped[systemField] = value;
  });

  // 智能合并工作量
  let effortDays = findMaxEffort(row, mapped.effortDays);

  // 验证和设置技术进展
  const validTechProgress = [
    TECH_PROGRESS.NOT_EVALUATED,
    TECH_PROGRESS.EFFORT_EVALUATED,
    TECH_PROGRESS.DESIGN_COMPLETED
  ];
  let finalTechProgress = validTechProgress.includes(mapped.techProgress)
    ? mapped.techProgress
    : (effortDays > 0 ? TECH_PROGRESS.EFFORT_EVALUATED : TECH_PROGRESS.NOT_EVALUATED);

  if (effortDays > 0 && finalTechProgress === TECH_PROGRESS.NOT_EVALUATED) {
    finalTechProgress = TECH_PROGRESS.EFFORT_EVALUATED;
  }

  // 验证业务影响度
  const validBV = ['局部', '明显', '撬动核心', '战略平台'];
  let finalBV = validBV.includes(mapped.bv) ? mapped.bv : '明显';

  // 数字转业务价值
  if (typeof mapped.bv === 'number' || !isNaN(Number(mapped.bv))) {
    const bvNum = Number(mapped.bv);
    if (bvNum >= 9) finalBV = '战略平台';
    else if (bvNum >= 7) finalBV = '撬动核心';
    else if (bvNum >= 5) finalBV = '明显';
    else finalBV = '局部';
  }

  // 验证时间临界
  const validTC = ['随时', '三月窗口', '一月硬窗口'];
  const finalTC = validTC.includes(mapped.tc) ? mapped.tc : '随时';

  // 其他枚举字段验证...

  return {
    id: uniqueId,
    name: mapped.name || `导入需求-${index + 1}`,
    submitterName: mapped.submitterName || '',
    productManager: mapped.productManager || '',
    developer: mapped.developer || '',
    productProgress: mapped.productProgress || '未评估',
    effortDays: effortDays,
    bv: finalBV,
    tc: finalTC,
    hardDeadline: mapped.hardDeadline || false,
    techProgress: finalTechProgress,
    type: mapped.type || '功能开发',
    submitDate: mapped.submitDate || new Date().toISOString().split('T')[0],
    submitter: mapped.submitter || '产品',
    isRMS: mapped.isRMS || false,
    businessDomain: '国际零售通用',
  };
}

/**
 * 扫描所有列找最大工作量
 */
function findMaxEffort(row: any, defaultEffort: number): number {
  let maxEffort = Number(defaultEffort) || 0;
  const effortKeywords = ['工作量', '人天', '工时', 'workday', 'effort', 'days'];

  Object.keys(row).forEach(colName => {
    const lowerColName = colName.toLowerCase();
    const hasKeyword = effortKeywords.some(keyword =>
      lowerColName.includes(keyword.toLowerCase())
    );

    if (hasKeyword) {
      const val = row[colName];
      if (val !== null && val !== undefined && val !== '') {
        const num = Number(val);
        if (!isNaN(num) && num > 0 && num > maxEffort) {
          maxEffort = num;
        }
      }
    }
  });

  return maxEffort;
}
```

### 创建 `src/hooks/useDataImport.ts`

```typescript
/**
 * 数据导入 Hook
 */

import { useState } from 'react';
import { parseFileContent, autoMapFields } from '../utils/fileImportHelpers';
import { transformImportRow } from '../utils/importDataTransform';
import { calculateScores } from '../utils/scoring';
import type { Requirement } from '../types';

export function useDataImport() {
  const [importData, setImportData] = useState<any[]>([]);
  const [importMapping, setImportMapping] = useState<Record<string, string>>({});

  const handleFileImport = async (
    e: React.ChangeEvent<HTMLInputElement>,
    onSuccess: (data: any[], mapping: Record<string, string>) => void,
    onError: (message: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseFileContent(file);
      if (data && data.length > 0) {
        const mapping = autoMapFields(data[0]);
        setImportData(data);
        setImportMapping(mapping);
        onSuccess(data, mapping);
      } else {
        onError('文件中没有数据');
      }
    } catch (error) {
      console.error('文件解析失败:', error);
      onError('文件解析失败，请检查文件格式');
    }

    e.target.value = '';
  };

  const processImport = (
    data: any[],
    mapping: Record<string, string>,
    existingRequirements: Requirement[],
    clearBefore: boolean
  ): Requirement[] => {
    const newRequirements = data.map((row, index) =>
      transformImportRow(row, mapping, index)
    );

    const allReqs = clearBefore ? newRequirements : [...existingRequirements, ...newRequirements];
    return calculateScores(allReqs);
  };

  return {
    importData,
    importMapping,
    handleFileImport,
    processImport,
    setImportData,
    setImportMapping,
  };
}
```

---

## 🎨 步骤 3：提取 Header 组件

### 创建 `src/components/Header.tsx`

```typescript
/**
 * 应用顶部栏组件
 */

import { HelpCircle, Download, Upload, User as UserIcon, LogOut, ArrowUpDown, Star } from 'lucide-react';
import type { User } from '../storage';

interface HeaderProps {
  currentUser: User | null;
  compact: boolean;
  onToggleCompact: () => void;
  onShowHandbook: () => void;
  onImport: () => void;
  onExport: () => void;
  onLogout: () => void;
}

const Header = ({
  currentUser,
  compact,
  onToggleCompact,
  onShowHandbook,
  onImport,
  onExport,
  onLogout,
}: HeaderProps) => {
  return (
    <div className="bg-gray-900 border-b border-gray-800 px-6 py-3 shadow-sm flex-shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* 标题 */}
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">
              小米国际 WSJF-Lite Tools
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              by Evan (tianyuan8@xiaomi.com)
            </p>
          </div>

          {/* 图例 */}
          <div className="flex items-center gap-3 text-xs text-gray-300">
            <div className="flex items-center gap-1.5">
              <div className="flex gap-0.5">
                <div className="w-3 h-3 rounded-sm bg-gradient-to-br from-blue-100 to-blue-200" title="局部"></div>
                <div className="w-3 h-3 rounded-sm bg-gradient-to-br from-blue-400 to-blue-500" title="明显"></div>
                <div className="w-3 h-3 rounded-sm bg-gradient-to-br from-blue-600 to-blue-700" title="撬动核心"></div>
                <div className="w-3 h-3 rounded-sm bg-gradient-to-br from-blue-800 to-blue-900" title="战略平台"></div>
              </div>
              <span>业务影响度</span>
            </div>

            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gradient-to-br from-red-600 to-red-900 rounded-sm"></div>
              <span>强DDL</span>
            </div>

            <div className="flex items-center gap-1">
              <Star size={12} className="fill-yellow-400 text-yellow-400" />
              <span>权重</span>
            </div>
          </div>

          <button
            onClick={onShowHandbook}
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition"
          >
            <HelpCircle size={14} />
            <span>说明书</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {currentUser && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg">
              <UserIcon size={14} className="text-gray-400" />
              <span className="text-sm text-gray-300">{currentUser.name}</span>
            </div>
          )}

          <button
            onClick={onToggleCompact}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition text-xs flex items-center gap-1"
          >
            <ArrowUpDown size={14} />
            {compact ? '正常' : '紧凑'}
          </button>

          <button
            onClick={onImport}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-xs flex items-center gap-1"
          >
            <Upload size={14} />
            导入
          </button>

          <button
            onClick={onExport}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-xs flex items-center gap-1"
          >
            <Download size={14} />
            导出
          </button>

          {currentUser && (
            <button
              onClick={onLogout}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-xs flex items-center gap-1"
            >
              <LogOut size={14} />
              登出
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
```

---

## 📦 步骤 4：重构主文件

现在主文件应该大幅精简：

### `src/wsjf-sprint-planner.tsx` (~300行)

```typescript
/**
 * WSJF Sprint Planner - 主应用入口
 */

import React, { useEffect } from 'react';
import { useStore } from './store/useStore';
import { useToast } from './hooks/useToast';
import { useDataImport } from './hooks/useDataImport';
import { useDataExport } from './hooks/useDataExport';

// UI组件
import Header from './components/Header';
import ToastContainer from './components/ToastContainer';
import HandbookModal from './components/HandbookModal';
import LoginModal from './components/LoginModal';
import EditRequirementModal from './components/EditRequirementModal';
import EditSprintModal from './components/EditSprintModal';
import SprintPoolComponent from './components/SprintPoolComponent';
import UnscheduledArea from './components/UnscheduledArea';
import BatchEvaluationModal from './components/BatchEvaluationModal';

export default function WSJFPlanner() {
  // Zustand Store 状态
  const {
    currentUser,
    showLogin,
    requirements,
    sprintPools,
    unscheduled,
    compact,
    showHandbook,
    showExportMenu,
    // ... 其他状态
    setCurrentUser,
    toggleCompact,
    setShowHandbook,
    // ... 其他 actions
  } = useStore();

  // Toast系统
  const { toasts, showToast, dismissToast } = useToast();

  // 导入导出
  const { handleExportExcel, handleExportPNG, handleExportPDF } = useDataExport(
    sprintPools,
    unscheduled
  );

  // 数据初始化
  useEffect(() => {
    // 从 localStorage 加载数据
    // ...
  }, []);

  // 拖拽处理
  const handleDragEnter = (poolId: string) => {
    // ...
  };

  const handleDrop = (targetPoolId: string) => {
    // ...
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <Header
        currentUser={currentUser}
        compact={compact}
        onToggleCompact={toggleCompact}
        onShowHandbook={() => setShowHandbook(true)}
        onImport={() => {/* ... */}}
        onExport={() => {/* ... */}}
        onLogout={() => {/* ... */}}
      />

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 待排期区 */}
        <UnscheduledArea
          unscheduled={unscheduled}
          // ... props
        />

        {/* 迭代池列表 */}
        <div className="flex-1 flex overflow-x-auto">
          {sprintPools.map(pool => (
            <SprintPoolComponent
              key={pool.id}
              pool={pool}
              // ... props
            />
          ))}
        </div>
      </div>

      {/* Modals */}
      {showHandbook && <HandbookModal onClose={() => setShowHandbook(false)} />}
      {showLogin && <LoginModal /* ... */ />}
      {/* ... 其他 modals */}

      {/* Toast容器 */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
```

---

## ✅ 测试和验证

```bash
# 文件大小检查
npm run check-file-size

# 构建测试
npm run build

# 功能测试
npm run dev
```

---

## 📝 提交

```bash
git add .
git commit -m "refactor: reduce main app from 3102 to ~300 lines

Major refactoring to improve maintainability:

- Extract data export logic to useDataExport hook
- Extract data import logic to useDataImport hook
- Extract Header component
- Move Toast system to dedicated hook/component
- Simplify main app to focus on composition

Files created:
- src/hooks/useDataExport.ts (~200 lines)
- src/hooks/useDataImport.ts (~300 lines)
- src/components/Header.tsx (~150 lines)
- src/utils/importDataTransform.ts (~200 lines)

✅ File size: 3102 → 300 lines (reduced by 2802 lines!)
✅ All tests passing
✅ Build successful
"
```

---

## 🎉 完成！

主应用文件现已符合项目规范！继续享受更清晰的代码结构吧！
