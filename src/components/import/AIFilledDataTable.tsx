/**
 * AIFilledDataTable - AI填充结果预览表格
 *
 * 功能说明：
 * 1. 显示AI智能填充后的数据预览
 * 2. 支持选择性导入（勾选需求）
 * 3. 显示AI填充成功/失败状态
 * 4. 点击行查看详细字段信息
 */

import { Sparkles, X } from 'lucide-react';
import { FIELD_NAME_MAP } from '../../constants/fieldNames';

interface AIFilledDataTableProps {
  /** AI填充后的数据 */
  aiFilledData: any[];
  /** 选中的需求索引 */
  selectedRequirementIndex: number | null;
  /** 选中需求改变回调 */
  onSelectedRequirementChange: (index: number | null) => void;
  /** AI填充数据更新回调 */
  onAIFilledDataChange: (data: any[]) => void;
}

export default function AIFilledDataTable({
  aiFilledData,
  selectedRequirementIndex,
  onSelectedRequirementChange,
  onAIFilledDataChange,
}: AIFilledDataTableProps) {
  const successCount = aiFilledData.filter((r) => r._aiAnalysisStatus === 'success').length;
  const failedCount = aiFilledData.filter((r) => r._aiAnalysisStatus === 'failed').length;

  const handleSelectAll = (checked: boolean) => {
    const updated = aiFilledData.map((r) => ({
      ...r,
      _isSelected: checked,
    }));
    onAIFilledDataChange(updated);
  };

  const handleSelectRow = (index: number, checked: boolean) => {
    const updated = [...aiFilledData];
    updated[index] = { ...updated[index], _isSelected: checked };
    onAIFilledDataChange(updated);
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Sparkles className="text-purple-600" size={18} />
          AI智能填充结果预览
        </h3>
        <span className="text-sm text-gray-600">
          ✅ {successCount} 成功 | ❌ {failedCount} 失败
        </span>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
        <p className="text-sm text-yellow-800">
          💡 提示：请检查AI填充的数据，勾选需要导入的需求。失败的需求已标记为红色，您可以取消勾选或手动修正后再导入。
        </p>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-auto max-h-96">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left w-12">
                <input
                  type="checkbox"
                  checked={aiFilledData.every((r) => r._isSelected)}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
              </th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">状态</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">需求名称</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">业务影响度</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">技术复杂度</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">产品领域</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">工作量</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">AI字段数</th>
            </tr>
          </thead>
          <tbody>
            {aiFilledData.map((req, index) => {
              const isSuccess = req._aiAnalysisStatus === 'success';
              const aiFieldCount = req._aiFilledFields?.length || 0;

              return (
                <tr
                  key={index}
                  className={`border-t border-gray-200 cursor-pointer hover:bg-gray-50 ${
                    !isSuccess ? 'bg-red-50' : ''
                  } ${selectedRequirementIndex === index ? 'bg-blue-100' : ''}`}
                  onClick={() => onSelectedRequirementChange(index)}
                >
                  <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={req._isSelected || false}
                      onChange={(e) => handleSelectRow(index, e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                  </td>
                  <td className="px-3 py-2">
                    {isSuccess ? (
                      <span className="text-green-600 font-semibold">✅ 成功</span>
                    ) : (
                      <span className="text-red-600 font-semibold" title={req._aiErrorMessage}>
                        ❌ 失败
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 font-medium text-gray-800 max-w-xs truncate">
                    {req.name}
                  </td>
                  <td className="px-3 py-2">
                    {req.businessImpactScore ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="font-semibold text-blue-600">{req.businessImpactScore}分</span>
                        {req._aiFilledFields?.includes('businessImpactScore') && (
                          <Sparkles size={12} className="text-purple-500" />
                        )}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {req.complexityScore ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="font-semibold text-orange-600">{req.complexityScore}分</span>
                        {req._aiFilledFields?.includes('complexityScore') && (
                          <Sparkles size={12} className="text-purple-500" />
                        )}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-3 py-2 text-gray-600 max-w-xs truncate">
                    {req.productArea || '-'}
                  </td>
                  <td className="px-3 py-2 text-gray-600">{req.effortDays || 0}天</td>
                  <td className="px-3 py-2">
                    <span
                      className="text-purple-600 font-semibold cursor-help flex items-center gap-1"
                      title={req._aiFilledFields?.map((f: string) => FIELD_NAME_MAP[f] || f).join('、') || '无AI填充字段'}
                    >
                      <Sparkles size={14} className="text-purple-600" />
                      {aiFieldCount}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 选中需求的详细信息 */}
      {selectedRequirementIndex !== null && aiFilledData[selectedRequirementIndex] && (
        <RequirementDetailPanel
          requirement={aiFilledData[selectedRequirementIndex]}
          index={selectedRequirementIndex}
          onClose={() => onSelectedRequirementChange(null)}
        />
      )}
    </div>
  );
}

// 需求详情面板子组件
interface RequirementDetailPanelProps {
  requirement: any;
  index: number;
  onClose: () => void;
}

function RequirementDetailPanel({ requirement, index, onClose }: RequirementDetailPanelProps) {
  const aiFilledFields = requirement._aiFilledFields || [];

  // 字段分组
  const basicFields = ['name', 'description', 'submitterName', 'submitDate', 'submitter', 'businessTeam'];
  const businessFields = ['businessImpactScore', 'affectedMetrics', 'impactScope', 'businessDomain', 'customBusinessDomain'];
  const timeFields = ['timeCriticality', 'hardDeadline', 'deadlineDate'];
  const techFields = ['effortDays', 'complexityScore', 'type', 'productManager', 'developer', 'productProgress', 'techProgress', 'dependencies', 'isRMS'];
  const extendedFields = ['project', 'productArea', 'backendDeveloper', 'frontendDeveloper', 'tester', 'rdNotes'];

  // 计算字段统计
  const allFieldKeys = [...basicFields, ...businessFields, ...timeFields, ...techFields, ...extendedFields];
  const totalFieldsCount = allFieldKeys.filter((key) => {
    const value = requirement[key];
    return value !== undefined && value !== null && value !== '' && (!Array.isArray(value) || value.length > 0);
  }).length;
  const aiFilledCount = aiFilledFields.length;
  const directMatchedCount = totalFieldsCount - aiFilledCount;

  // 渲染单个字段
  const renderField = (fieldKey: string, fieldValue: any) => {
    if (fieldKey.startsWith('_') || fieldKey === 'id') return null;
    if (fieldValue === undefined || fieldValue === null || fieldValue === '' || (Array.isArray(fieldValue) && fieldValue.length === 0))
      return null;

    const isAIFilled = aiFilledFields.includes(fieldKey);
    const fieldLabel = FIELD_NAME_MAP[fieldKey] || fieldKey;

    // 格式化字段值
    let displayValue: string;
    if (Array.isArray(fieldValue)) {
      if (fieldKey === 'affectedMetrics') {
        displayValue = fieldValue.map((m: any) => m.displayName || m.metricName).join('、');
      } else if (fieldKey === 'dependencies') {
        displayValue = fieldValue.join('、');
      } else {
        displayValue = fieldValue.join('、');
      }
    } else if (typeof fieldValue === 'object') {
      if (fieldKey === 'impactScope') {
        const parts = [];
        if (fieldValue.storeTypes?.length) parts.push(`门店类型: ${fieldValue.storeTypes.join('、')}`);
        if (fieldValue.regions?.length) parts.push(`区域: ${fieldValue.regions.join('、')}`);
        if (fieldValue.storeCountRange) parts.push(`门店数: ${fieldValue.storeCountRange}`);
        displayValue = parts.join(' | ');
      } else {
        displayValue = JSON.stringify(fieldValue);
      }
    } else if (typeof fieldValue === 'boolean') {
      displayValue = fieldValue ? '是' : '否';
    } else {
      displayValue = String(fieldValue);
    }

    return (
      <div key={fieldKey} className="flex items-start gap-2 py-1.5 border-b border-gray-200 last:border-0">
        <div className="flex items-center gap-1 min-w-[100px]">
          {isAIFilled && <Sparkles size={12} className="text-purple-600 flex-shrink-0" />}
          <span className={`text-xs font-semibold ${isAIFilled ? 'text-purple-700' : 'text-gray-700'}`}>
            {fieldLabel}:
          </span>
        </div>
        <div className="flex-1 text-xs text-gray-900 break-words">{displayValue}</div>
      </div>
    );
  };

  return (
    <div className="mt-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3">
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-sm font-bold text-blue-900 flex items-center gap-2">
          <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">
            {index + 1}
          </span>
          需求详情预览 - 完整信息
        </h4>
        <button onClick={onClose} className="text-blue-600 hover:text-blue-800 transition">
          <X size={18} />
        </button>
      </div>

      {/* 字段统计信息 */}
      <div className="mb-2 px-2 py-1.5 bg-white/60 rounded text-xs text-gray-700 flex items-center gap-3">
        <span className="font-semibold">共 {totalFieldsCount} 个字段</span>
        <span className="text-gray-400">|</span>
        <span className="text-green-700">{directMatchedCount} 个直接匹配</span>
        <span className="text-gray-400">|</span>
        <span className="text-purple-700 flex items-center gap-1">
          <Sparkles size={10} className="text-purple-600" />
          {aiFilledCount} 个AI推导
        </span>
        <span className="text-gray-400">|</span>
        <span className="text-orange-600 font-medium">请仔细核对</span>
      </div>

      <div className="space-y-3 text-xs max-h-[500px] overflow-y-auto">
        {/* 基本信息 */}
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <h5 className="font-bold text-blue-800 mb-2 flex items-center gap-1">
            <span className="w-1 h-4 bg-blue-600 rounded"></span>
            基本信息
          </h5>
          {basicFields.map((field) => renderField(field, requirement[field]))}
        </div>

        {/* 业务影响度 */}
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <h5 className="font-bold text-blue-800 mb-2 flex items-center gap-1">
            <span className="w-1 h-4 bg-blue-600 rounded"></span>
            业务影响度
          </h5>
          {businessFields.map((field) => renderField(field, requirement[field]))}
        </div>

        {/* 时间维度 */}
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <h5 className="font-bold text-blue-800 mb-2 flex items-center gap-1">
            <span className="w-1 h-4 bg-orange-600 rounded"></span>
            时间维度
          </h5>
          {timeFields.map((field) => renderField(field, requirement[field]))}
        </div>

        {/* 技术信息 */}
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <h5 className="font-bold text-blue-800 mb-2 flex items-center gap-1">
            <span className="w-1 h-4 bg-green-600 rounded"></span>
            技术信息
          </h5>
          {techFields.map((field) => renderField(field, requirement[field]))}
        </div>

        {/* 产研扩展 */}
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <h5 className="font-bold text-blue-800 mb-2 flex items-center gap-1">
            <span className="w-1 h-4 bg-purple-600 rounded"></span>
            产研扩展
          </h5>
          {extendedFields.map((field) => renderField(field, requirement[field]))}
        </div>
      </div>
    </div>
  );
}
