/**
 * FieldMappingTable - 字段映射配置表格
 *
 * 功能说明：
 * 1. 显示Excel字段与系统字段的映射关系
 * 2. 支持手动配置映射关系
 * 3. 显示示例数据预览
 */

import React from 'react';
import { ArrowUpDown, AlertCircle } from 'lucide-react';

interface FieldMappingTableProps {
  /** Excel文件的字段列表 */
  fileFields: string[];
  /** 示例数据（第一行） */
  sampleRow: Record<string, any>;
  /** 当前映射关系 */
  importMapping: Record<string, string>;
  /** 映射关系改变回调 */
  onMappingChange: (mapping: Record<string, string>) => void;
  /** 字段映射区域引用（用于滚动定位） */
  fieldMappingRef?: React.RefObject<HTMLDivElement>;
}

// 系统字段选项
const SYSTEM_FIELD_OPTIONS = [
  { value: '', label: '-- 不映射 --' },
  { value: 'name', label: '需求名称 *' },
  { value: 'submitterName', label: '提交人姓名' },
  { value: 'productManager', label: '产品经理' },
  { value: 'developer', label: '开发人员' },
  { value: 'effortDays', label: '工作量(天数)' },
  { value: 'bv', label: '业务影响度' },
  { value: 'tc', label: '时间窗口' },
  { value: 'hardDeadline', label: '强制截止' },
  { value: 'techProgress', label: '技术进展' },
  { value: 'productProgress', label: '产品进展' },
  { value: 'type', label: '需求类型' },
  { value: 'submitDate', label: '提交日期' },
  { value: 'submitter', label: '提交方' },
  { value: 'isRMS', label: '是否RMS' },
];

export default function FieldMappingTable({
  fileFields,
  sampleRow,
  importMapping,
  onMappingChange,
  fieldMappingRef,
}: FieldMappingTableProps) {
  // 检查是否有必填字段
  const hasRequiredFields = Object.values(importMapping).length > 0 && importMapping.name;

  const handleMappingChange = (excelField: string, systemField: string) => {
    const newMapping = { ...importMapping };

    // 清除该Excel字段的旧映射
    Object.keys(newMapping).forEach((key) => {
      if (newMapping[key] === excelField) {
        delete newMapping[key];
      }
    });

    // 设置新映射
    if (systemField) {
      newMapping[systemField] = excelField;
    }

    onMappingChange(newMapping);
  };

  return (
    <div ref={fieldMappingRef} className="mb-6">
      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <ArrowUpDown size={18} />
        字段映射配置
      </h3>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 w-1/3">Excel列名</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 w-1/4">示例数据</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 w-1/3">映射到系统字段</th>
            </tr>
          </thead>
          <tbody>
            {fileFields.map((field, index) => {
              // 找到当前字段映射到的系统字段
              const mappedSystemField =
                Object.keys(importMapping).find((key) => importMapping[key] === field) || '';

              return (
                <tr key={index} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{field}</td>
                  <td className="px-4 py-3 text-gray-600 truncate max-w-xs">
                    {String(sampleRow[field])}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={mappedSystemField}
                      onChange={(e) => handleMappingChange(field, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                    >
                      {SYSTEM_FIELD_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 警告提示 */}
      {!hasRequiredFields && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800 flex items-center gap-2">
            <AlertCircle size={16} />
            <span className="font-semibold">注意：</span>
            必须映射"需求名称"字段才能导入
          </p>
        </div>
      )}
    </div>
  );
}
