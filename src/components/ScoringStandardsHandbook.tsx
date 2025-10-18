/**
 * WSJF Sprint Planner - 评分标准说明书组件
 *
 * v1.2.0: 完整的10分制评分标准说明手册
 *
 * 功能：
 * - 以Modal形式展示完整的评分标准
 * - 每个分数等级显示：分数、名称、简短描述、业务后果、影响范围、典型案例、影响的OKR
 * - 支持搜索和筛选
 * - 支持打印/导出
 */

import { useState } from 'react';
import { X, Search, BookOpen, AlertTriangle, Users, Target } from 'lucide-react';
import type { ScoringStandard } from '../types';

interface ScoringStandardsHandbookProps {
  /** 是否显示Modal */
  isOpen: boolean;

  /** 关闭Modal回调 */
  onClose: () => void;

  /** 评分标准列表 */
  scoringStandards: ScoringStandard[];
}

/**
 * 评分标准说明书Modal
 *
 * 展示完整的10分制评分标准，帮助业务团队准确评估需求的业务影响度
 */
const ScoringStandardsHandbook = ({
  isOpen,
  onClose,
  scoringStandards
}: ScoringStandardsHandbookProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  // 按分数降序排列
  const sortedStandards = [...scoringStandards].sort((a, b) => b.score - a.score);

  // 搜索过滤
  const filteredStandards = sortedStandards.filter(standard => {
    const term = searchTerm.toLowerCase();
    return (
      standard.name.toLowerCase().includes(term) ||
      standard.shortDescription.toLowerCase().includes(term) ||
      standard.businessConsequence.some(c => c.toLowerCase().includes(term)) ||
      standard.impactScope.some(s => s.toLowerCase().includes(term)) ||
      standard.typicalCases.some(c => c.toLowerCase().includes(term))
    );
  });

  /**
   * 获取分数对应的颜色
   */
  const getScoreColor = (score: number): string => {
    if (score >= 8) return 'bg-red-500 text-white';
    if (score >= 5) return 'bg-orange-500 text-white';
    if (score >= 3) return 'bg-yellow-500 text-gray-900';
    return 'bg-green-500 text-white';
  };

  /**
   * 获取分数对应的卡片边框颜色
   */
  const getCardBorderColor = (score: number): string => {
    if (score >= 8) return 'border-red-200 bg-red-50';
    if (score >= 5) return 'border-orange-200 bg-orange-50';
    if (score >= 3) return 'border-yellow-200 bg-yellow-50';
    return 'border-green-200 bg-green-50';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-xl">
          <div className="flex items-center gap-3">
            <BookOpen size={24} />
            <div>
              <h2 className="text-xl font-bold">业务影响度评分标准说明书</h2>
              <p className="text-sm text-blue-100 mt-0.5">10分制评分体系 - 帮助您准确评估需求的业务价值</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="搜索评分标准、案例、影响范围..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* 使用说明 */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <AlertTriangle size={18} />
              评分原则
            </h3>
            <ul className="text-sm text-blue-800 space-y-1 ml-6 list-disc">
              <li><strong>业务后果 OR 影响范围</strong>：满足任一维度即可选择该分数</li>
              <li><strong>只评估业务影响</strong>：不考虑技术复杂度，技术复杂度由产品和研发团队评估</li>
              <li><strong>实事求是</strong>：根据实际业务情况评分，不夸大也不低估</li>
              <li><strong>参考典型案例</strong>：对照案例进行评分，如有疑问可咨询产品团队</li>
            </ul>
          </div>

          {/* 评分标准列表 */}
          <div className="space-y-4">
            {filteredStandards.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Search size={48} className="mx-auto mb-4 text-gray-300" />
                <p>未找到匹配的评分标准</p>
              </div>
            ) : (
              filteredStandards.map((standard) => (
                <div
                  key={standard.score}
                  className={`border-2 rounded-lg p-5 ${getCardBorderColor(standard.score)}`}
                >
                  {/* 标题行 */}
                  <div className="flex items-center gap-4 mb-4">
                    {/* 分数徽章 */}
                    <div className={`
                      flex items-center justify-center w-14 h-14 rounded-full font-bold text-2xl flex-shrink-0
                      ${getScoreColor(standard.score)}
                      shadow-lg
                    `}>
                      {standard.score}
                    </div>

                    {/* 名称和描述 */}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900">{standard.name}</h3>
                      <p className="text-gray-700 mt-1">{standard.shortDescription}</p>
                    </div>
                  </div>

                  {/* 详细内容 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-[72px]">
                    {/* 业务后果 */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle size={16} className="text-red-600" />
                        <h4 className="font-semibold text-gray-900">业务后果</h4>
                      </div>
                      <ul className="text-sm text-gray-700 space-y-1.5">
                        {standard.businessConsequence.map((consequence, idx) => (
                          <li key={idx} className="pl-4 border-l-2 border-gray-300">
                            {consequence}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* 影响范围 */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Users size={16} className="text-blue-600" />
                        <h4 className="font-semibold text-gray-900">影响范围</h4>
                      </div>
                      <ul className="text-sm text-gray-700 space-y-1.5">
                        {standard.impactScope.map((scope, idx) => (
                          <li key={idx} className="pl-4 border-l-2 border-gray-300">
                            {scope}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* 典型案例 */}
                    <div className="md:col-span-2">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen size={16} className="text-green-600" />
                        <h4 className="font-semibold text-gray-900">典型案例</h4>
                      </div>
                      <ul className="text-sm text-gray-700 space-y-1.5">
                        {standard.typicalCases.map((case_, idx) => (
                          <li key={idx} className="pl-4 border-l-2 border-green-300 bg-white/50 py-1">
                            {case_}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* 影响的OKR */}
                    <div className="md:col-span-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Target size={16} className="text-purple-600" />
                        <h4 className="font-semibold text-gray-900">影响的OKR</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {standard.affectedOKRs.map((okr, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium"
                          >
                            {okr}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex items-center justify-between">
          <div className="text-sm text-gray-600">
            共 <span className="font-semibold text-gray-900">{filteredStandards.length}</span> 个评分等级
            {searchTerm && <span className="ml-2">（已过滤）</span>}
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScoringStandardsHandbook;
