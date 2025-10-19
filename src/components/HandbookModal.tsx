import { X } from 'lucide-react';
import { UI_TEXT, STAR_RATING_RULES, BUSINESS_IMPACT_LEVELS, COMPLEXITY_LEVELS, TIME_CRITICALITY_MAP, EFFORT_BONUS_RULES } from '../constants';

// ============================================================================
// UI组件 - WSJF评分说明书弹窗 (Handbook Modal Component)
// ============================================================================

/**
 * WSJF-Lite排期评分说明书弹窗组件
 *
 * 功能说明：
 * - 展示完整的WSJF评分方法论说明文档
 * - 包含10分制业务影响度和技术复杂度详细标准
 * - 详细解释评分维度、计算公式、分数区间设计
 * - 提供示例帮助用户理解评分逻辑
 *
 * 内容结构：
 * - 第一部分：核心评分维度说明（业务影响度、技术复杂度）
 * - 第二部分：其他评分维度（时间窗口、工作量）
 * - 第三部分：计算公式和星级分档
 * - 第四部分：实战示例
 *
 * @param onClose - 关闭弹窗回调函数
 */
const HandbookModal = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex-shrink-0 p-5 border-b border-gray-200 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-t-xl flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">{UI_TEXT.HANDBOOK_TITLE}</h3>
            <p className="text-sm text-gray-300 mt-1">{UI_TEXT.HANDBOOK_SUBTITLE}</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2 transition">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 prose prose-sm max-w-none">

          {/* 概述 */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
            <p className="text-sm text-gray-700 m-0">
              <strong>WSJF-Lite 方法论</strong>：基于业务影响度、技术复杂度、时间窗口和工作量四个维度，
              自动计算1-100的{UI_TEXT.WEIGHT_SCORE}和{UI_TEXT.STAR_RATING}，帮助团队科学决策需求优先级。
            </p>
          </div>

          {/* ==================== 第一部分：业务影响度 ==================== */}
          <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900 border-b-2 border-gray-300 pb-2">
            一、{UI_TEXT.BUSINESS_IMPACT}（1-10分制）
          </h2>

          <p className="text-gray-700">
            评估需求对业务的实际影响，包括用户影响范围、指标提升、战略价值等。分数越高表示业务价值越大。
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* 10分 - 致命缺陷 */}
            <div className="border-2 border-red-500 rounded-lg p-4 bg-red-50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-lg font-bold text-red-700 m-0">10分 - {BUSINESS_IMPACT_LEVELS[10].name}</h4>
                <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">最高优先级</span>
              </div>
              <p className="text-sm text-gray-700 mb-2"><strong>{BUSINESS_IMPACT_LEVELS[10].shortDescription}</strong></p>
              <p className="text-sm text-gray-600 mb-2">{BUSINESS_IMPACT_LEVELS[10].description}</p>
              <div className="bg-white rounded p-2 mt-2">
                <p className="text-xs font-semibold text-gray-700 mb-1">业务后果：</p>
                <ul className="text-xs text-gray-600 space-y-1 m-0 pl-4">
                  {BUSINESS_IMPACT_LEVELS[10].businessConsequence.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
                <p className="text-xs text-gray-500 mt-2">影响范围：{BUSINESS_IMPACT_LEVELS[10].impactScope}</p>
              </div>
            </div>

            {/* 9分 - 严重阻塞 */}
            <div className="border-2 border-orange-500 rounded-lg p-4 bg-orange-50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-lg font-bold text-orange-700 m-0">9分 - {BUSINESS_IMPACT_LEVELS[9].name}</h4>
                <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold">极高优先级</span>
              </div>
              <p className="text-sm text-gray-700 mb-2"><strong>{BUSINESS_IMPACT_LEVELS[9].shortDescription}</strong></p>
              <p className="text-sm text-gray-600 mb-2">{BUSINESS_IMPACT_LEVELS[9].description}</p>
              <div className="bg-white rounded p-2 mt-2">
                <p className="text-xs font-semibold text-gray-700 mb-1">业务后果：</p>
                <ul className="text-xs text-gray-600 space-y-1 m-0 pl-4">
                  {BUSINESS_IMPACT_LEVELS[9].businessConsequence.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
                <p className="text-xs text-gray-500 mt-2">影响范围：{BUSINESS_IMPACT_LEVELS[9].impactScope}</p>
              </div>
            </div>

            {/* 8分 - 战略必需 */}
            <div className="border-2 border-purple-500 rounded-lg p-4 bg-purple-50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-lg font-bold text-purple-700 m-0">8分 - {BUSINESS_IMPACT_LEVELS[8].name}</h4>
                <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-bold">战略级</span>
              </div>
              <p className="text-sm text-gray-700 mb-2"><strong>{BUSINESS_IMPACT_LEVELS[8].shortDescription}</strong></p>
              <p className="text-sm text-gray-600 mb-2">{BUSINESS_IMPACT_LEVELS[8].description}</p>
              <div className="bg-white rounded p-2 mt-2">
                <p className="text-xs font-semibold text-gray-700 mb-1">业务后果：</p>
                <ul className="text-xs text-gray-600 space-y-1 m-0 pl-4">
                  {BUSINESS_IMPACT_LEVELS[8].businessConsequence.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
                <p className="text-xs text-gray-500 mt-2">影响范围：{BUSINESS_IMPACT_LEVELS[8].impactScope}</p>
              </div>
            </div>

            {/* 7分 - 显著影响 */}
            <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-lg font-bold text-blue-700 m-0">7分 - {BUSINESS_IMPACT_LEVELS[7].name}</h4>
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold">高优先级</span>
              </div>
              <p className="text-sm text-gray-700 mb-2"><strong>{BUSINESS_IMPACT_LEVELS[7].shortDescription}</strong></p>
              <p className="text-sm text-gray-600 mb-2">{BUSINESS_IMPACT_LEVELS[7].description}</p>
              <div className="bg-white rounded p-2 mt-2">
                <p className="text-xs text-gray-500">影响范围：{BUSINESS_IMPACT_LEVELS[7].impactScope}</p>
              </div>
            </div>

            {/* 6分 - 战略加速 */}
            <div className="border-2 border-green-500 rounded-lg p-4 bg-green-50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-lg font-bold text-green-700 m-0">6分 - {BUSINESS_IMPACT_LEVELS[6].name}</h4>
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">中高优先级</span>
              </div>
              <p className="text-sm text-gray-700 mb-2"><strong>{BUSINESS_IMPACT_LEVELS[6].shortDescription}</strong></p>
              <p className="text-sm text-gray-600 mb-2">{BUSINESS_IMPACT_LEVELS[6].description}</p>
              <div className="bg-white rounded p-2 mt-2">
                <p className="text-xs text-gray-500">影响范围：{BUSINESS_IMPACT_LEVELS[6].impactScope}</p>
              </div>
            </div>

            {/* 5分 - 重要优化 */}
            <div className="border-2 border-teal-500 rounded-lg p-4 bg-teal-50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-lg font-bold text-teal-700 m-0">5分 - {BUSINESS_IMPACT_LEVELS[5].name}</h4>
                <span className="bg-teal-500 text-white px-3 py-1 rounded-full text-xs font-bold">中等优先级</span>
              </div>
              <p className="text-sm text-gray-700 mb-2"><strong>{BUSINESS_IMPACT_LEVELS[5].shortDescription}</strong></p>
              <p className="text-sm text-gray-600 mb-2">{BUSINESS_IMPACT_LEVELS[5].description}</p>
              <div className="bg-white rounded p-2 mt-2">
                <p className="text-xs text-gray-500">影响范围：{BUSINESS_IMPACT_LEVELS[5].impactScope}</p>
              </div>
            </div>

            {/* 4分 - 有价值优化 */}
            <div className="border border-gray-400 rounded-lg p-4 bg-gray-50">
              <h4 className="text-base font-bold text-gray-700 m-0 mb-2">4分 - {BUSINESS_IMPACT_LEVELS[4].name}</h4>
              <p className="text-sm text-gray-600 m-0">{BUSINESS_IMPACT_LEVELS[4].shortDescription}</p>
              <p className="text-xs text-gray-500 mt-2">影响范围：{BUSINESS_IMPACT_LEVELS[4].impactScope}</p>
            </div>

            {/* 3分 - 常规功能 */}
            <div className="border border-gray-400 rounded-lg p-4 bg-gray-50">
              <h4 className="text-base font-bold text-gray-700 m-0 mb-2">3分 - {BUSINESS_IMPACT_LEVELS[3].name}</h4>
              <p className="text-sm text-gray-600 m-0">{BUSINESS_IMPACT_LEVELS[3].shortDescription}</p>
              <p className="text-xs text-gray-500 mt-2">影响范围：{BUSINESS_IMPACT_LEVELS[3].impactScope}</p>
            </div>

            {/* 2分 - 小幅改进 */}
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <h4 className="text-base font-bold text-gray-600 m-0 mb-2">2分 - {BUSINESS_IMPACT_LEVELS[2].name}</h4>
              <p className="text-sm text-gray-500 m-0">{BUSINESS_IMPACT_LEVELS[2].shortDescription}</p>
              <p className="text-xs text-gray-400 mt-2">影响范围：{BUSINESS_IMPACT_LEVELS[2].impactScope}</p>
            </div>

            {/* 1分 - Nice-to-have */}
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <h4 className="text-base font-bold text-gray-600 m-0 mb-2">1分 - {BUSINESS_IMPACT_LEVELS[1].name}</h4>
              <p className="text-sm text-gray-500 m-0">{BUSINESS_IMPACT_LEVELS[1].shortDescription}</p>
              <p className="text-xs text-gray-400 mt-2">影响范围：{BUSINESS_IMPACT_LEVELS[1].impactScope}</p>
            </div>
          </div>

          {/* ==================== 第二部分：技术复杂度 ==================== */}
          <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900 border-b-2 border-gray-300 pb-2">
            二、{UI_TEXT.COMPLEXITY}（1-10分制）
          </h2>

          <p className="text-gray-700">
            评估需求的技术实现难度，包括技术栈、架构复杂度、风险等。<strong className="text-red-600">注意：复杂度越高分数越高，但在最终计算中会被反向处理（复杂度高会降低优先级）</strong>。
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* 10分 - 全新技术平台 */}
            <div className="border-2 border-red-500 rounded-lg p-4 bg-red-50">
              <h4 className="text-lg font-bold text-red-700 m-0 mb-2">10分 - {COMPLEXITY_LEVELS[10].name}</h4>
              <p className="text-sm text-gray-700 mb-2"><strong>{COMPLEXITY_LEVELS[10].shortDescription}</strong></p>
              <p className="text-sm text-gray-600">{COMPLEXITY_LEVELS[10].description}</p>
            </div>

            {/* 9分 - 核心架构重构 */}
            <div className="border-2 border-orange-500 rounded-lg p-4 bg-orange-50">
              <h4 className="text-lg font-bold text-orange-700 m-0 mb-2">9分 - {COMPLEXITY_LEVELS[9].name}</h4>
              <p className="text-sm text-gray-700 mb-2"><strong>{COMPLEXITY_LEVELS[9].shortDescription}</strong></p>
              <p className="text-sm text-gray-600">{COMPLEXITY_LEVELS[9].description}</p>
            </div>

            {/* 8分 - 系统级改造 */}
            <div className="border-2 border-purple-500 rounded-lg p-4 bg-purple-50">
              <h4 className="text-lg font-bold text-purple-700 m-0 mb-2">8分 - {COMPLEXITY_LEVELS[8].name}</h4>
              <p className="text-sm text-gray-700 mb-2"><strong>{COMPLEXITY_LEVELS[8].shortDescription}</strong></p>
              <p className="text-sm text-gray-600">{COMPLEXITY_LEVELS[8].description}</p>
            </div>

            {/* 7分 - 复杂功能开发 */}
            <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50">
              <h4 className="text-lg font-bold text-blue-700 m-0 mb-2">7分 - {COMPLEXITY_LEVELS[7].name}</h4>
              <p className="text-sm text-gray-700 mb-2"><strong>{COMPLEXITY_LEVELS[7].shortDescription}</strong></p>
              <p className="text-sm text-gray-600">{COMPLEXITY_LEVELS[7].description}</p>
            </div>

            {/* 6分 - 跨系统集成 */}
            <div className="border-2 border-green-500 rounded-lg p-4 bg-green-50">
              <h4 className="text-lg font-bold text-green-700 m-0 mb-2">6分 - {COMPLEXITY_LEVELS[6].name}</h4>
              <p className="text-sm text-gray-700 mb-2"><strong>{COMPLEXITY_LEVELS[6].shortDescription}</strong></p>
              <p className="text-sm text-gray-600">{COMPLEXITY_LEVELS[6].description}</p>
            </div>

            {/* 5分 - 标准功能开发 */}
            <div className="border-2 border-teal-500 rounded-lg p-4 bg-teal-50">
              <h4 className="text-lg font-bold text-teal-700 m-0 mb-2">5分 - {COMPLEXITY_LEVELS[5].name}</h4>
              <p className="text-sm text-gray-700 mb-2"><strong>{COMPLEXITY_LEVELS[5].shortDescription}</strong></p>
              <p className="text-sm text-gray-600">{COMPLEXITY_LEVELS[5].description}</p>
            </div>

            {/* 4分及以下 - 简化显示 */}
            <div className="border border-gray-400 rounded-lg p-3 bg-gray-50">
              <h4 className="text-base font-bold text-gray-700 m-0 mb-1">4分 - {COMPLEXITY_LEVELS[4].name}</h4>
              <p className="text-xs text-gray-600 m-0">{COMPLEXITY_LEVELS[4].shortDescription}</p>
            </div>

            <div className="border border-gray-400 rounded-lg p-3 bg-gray-50">
              <h4 className="text-base font-bold text-gray-700 m-0 mb-1">3分 - {COMPLEXITY_LEVELS[3].name}</h4>
              <p className="text-xs text-gray-600 m-0">{COMPLEXITY_LEVELS[3].shortDescription}</p>
            </div>

            <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
              <h4 className="text-base font-bold text-gray-600 m-0 mb-1">2分 - {COMPLEXITY_LEVELS[2].name}</h4>
              <p className="text-xs text-gray-500 m-0">{COMPLEXITY_LEVELS[2].shortDescription}</p>
            </div>

            <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
              <h4 className="text-base font-bold text-gray-600 m-0 mb-1">1分 - {COMPLEXITY_LEVELS[1].name}</h4>
              <p className="text-xs text-gray-500 m-0">{COMPLEXITY_LEVELS[1].shortDescription}</p>
            </div>
          </div>

          {/* ==================== 第三部分：其他评分维度 ==================== */}
          <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900 border-b-2 border-gray-300 pb-2">
            三、其他评分维度
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 时间窗口 */}
            <div className="border-2 border-yellow-400 rounded-lg p-4 bg-yellow-50">
              <h3 className="text-lg font-bold text-gray-900 mb-3">{UI_TEXT.TIME_CRITICALITY}</h3>
              <div className="space-y-2">
                <div className="bg-white rounded p-2">
                  <p className="font-semibold text-sm mb-1">{UI_TEXT.TIME_ANYTIME}（+{TIME_CRITICALITY_MAP['随时']}分）</p>
                  <p className="text-xs text-gray-600">任何时间完成效果基本相同</p>
                </div>
                <div className="bg-white rounded p-2">
                  <p className="font-semibold text-sm mb-1">{UI_TEXT.TIME_THREE_MONTHS}（+{TIME_CRITICALITY_MAP['三月窗口']}分）</p>
                  <p className="text-xs text-gray-600">需在3个月内完成，存在明确业务窗口</p>
                </div>
                <div className="bg-white rounded p-2">
                  <p className="font-semibold text-sm mb-1">{UI_TEXT.TIME_ONE_MONTH}（+{TIME_CRITICALITY_MAP['一月硬窗口']}分）</p>
                  <p className="text-xs text-gray-600">必须在1个月内完成，硬性时间限制</p>
                </div>
              </div>
            </div>

            {/* 强制DDL */}
            <div className="border-2 border-red-400 rounded-lg p-4 bg-red-50">
              <h3 className="text-lg font-bold text-gray-900 mb-3">{UI_TEXT.HARD_DEADLINE}</h3>
              <div className="space-y-2">
                <div className="bg-white rounded p-2">
                  <p className="font-semibold text-sm mb-1">无强制截止（+0分）</p>
                  <p className="text-xs text-gray-600">没有明确日期凭据</p>
                </div>
                <div className="bg-white rounded p-2">
                  <p className="font-semibold text-sm mb-1">有强制截止（+5分）</p>
                  <p className="text-xs text-gray-600">存在明确日期凭据（合同、合规函件、活动档期等）</p>
                </div>
              </div>
            </div>

            {/* 工作量奖励 */}
            <div className="border-2 border-green-400 rounded-lg p-4 bg-green-50 md:col-span-2">
              <h3 className="text-lg font-bold text-gray-900 mb-3">{UI_TEXT.EFFORT} - 奖励分机制</h3>
              <p className="text-sm text-gray-700 mb-3">
                <strong>设计理念</strong>：{EFFORT_BONUS_RULES.description}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {EFFORT_BONUS_RULES.rules.map((rule, idx) => (
                  <div key={idx} className="bg-white rounded p-2 border border-green-200">
                    <p className="font-semibold text-sm text-green-700">{rule.range}</p>
                    <p className="text-lg font-bold text-green-600">+{rule.bonus}分</p>
                    <p className="text-xs text-gray-500 mt-1">{rule.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ==================== 第四部分：计算公式 ==================== */}
          <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900 border-b-2 border-gray-300 pb-2">
            四、计算公式与星级分档
          </h2>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-lg p-5 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">当前简化版计算公式</h3>

            <div className="bg-white rounded-lg p-4 mb-4">
              <p className="font-mono text-sm font-bold text-blue-700 mb-2">
                rawScore = 业务影响度 + 时间窗口 + 强制DDL + 工作量奖励
              </p>
              <p className="text-xs text-gray-600">
                当前版本暂未使用技术复杂度参数，采用简化的4档业务影响度（局部3｜明显6｜撬动核心8｜战略平台10）
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 mb-4">
              <p className="font-mono text-sm font-bold text-purple-700 mb-2">
                displayScore = 10 + 90 × (rawScore - minRaw) / (maxRaw - minRaw)
              </p>
              <p className="text-xs text-gray-600">
                归一化到1-100区间，便于直观对比。当所有需求分数相同时，统一为60分。
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-300 rounded p-3">
              <p className="text-xs text-yellow-800 m-0">
                <strong>📌 升级计划</strong>：未来版本将启用完整10分制业务影响度和技术复杂度评分，提供更精细的优先级评估。
              </p>
            </div>
          </div>

          <h3 className="text-lg font-bold text-gray-900 mb-3">星级分档</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-gradient-to-r from-yellow-100 to-yellow-50 border-2 border-yellow-500 rounded-lg p-4">
              <p className="text-2xl mb-1">{STAR_RATING_RULES[5].label}</p>
              <p className="font-bold text-gray-900">≥{STAR_RATING_RULES[5].threshold}分</p>
              <p className="text-sm text-gray-700">{STAR_RATING_RULES[5].description}</p>
            </div>

            <div className="bg-gradient-to-r from-blue-100 to-blue-50 border-2 border-blue-500 rounded-lg p-4">
              <p className="text-xl mb-1">{STAR_RATING_RULES[4].label}</p>
              <p className="font-bold text-gray-900">{STAR_RATING_RULES[4].threshold}-84分</p>
              <p className="text-sm text-gray-700">{STAR_RATING_RULES[4].description}</p>
            </div>

            <div className="bg-gradient-to-r from-green-100 to-green-50 border-2 border-green-500 rounded-lg p-4">
              <p className="text-lg mb-1">{STAR_RATING_RULES[3].label}</p>
              <p className="font-bold text-gray-900">{STAR_RATING_RULES[3].threshold}-69分</p>
              <p className="text-sm text-gray-700">{STAR_RATING_RULES[3].description}</p>
            </div>

            <div className="bg-gradient-to-r from-gray-100 to-gray-50 border-2 border-gray-400 rounded-lg p-4">
              <p className="text-base mb-1">{STAR_RATING_RULES[2].label}</p>
              <p className="font-bold text-gray-900">≤54分</p>
              <p className="text-sm text-gray-700">{STAR_RATING_RULES[2].description}</p>
            </div>
          </div>

          {/* ==================== 第五部分：实战示例 ==================== */}
          <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900 border-b-2 border-gray-300 pb-2">
            五、实战示例
          </h2>

          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300 text-xs">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="border border-gray-300 px-3 py-2 text-left">需求场景</th>
                  <th className="border border-gray-300 px-2 py-2">业务影响</th>
                  <th className="border border-gray-300 px-2 py-2">时间窗口</th>
                  <th className="border border-gray-300 px-2 py-2">强制DDL</th>
                  <th className="border border-gray-300 px-2 py-2">工作量</th>
                  <th className="border border-gray-300 px-2 py-2">原始分</th>
                  <th className="border border-gray-300 px-2 py-2">展示分</th>
                  <th className="border border-gray-300 px-2 py-2">星级</th>
                  <th className="border border-gray-300 px-3 py-2">决策建议</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-red-50">
                  <td className="border border-gray-300 px-3 py-2">支付系统宕机修复</td>
                  <td className="border border-gray-300 px-2 py-2 text-center font-bold text-red-600">10</td>
                  <td className="border border-gray-300 px-2 py-2 text-center">一月硬窗口(5)</td>
                  <td className="border border-gray-300 px-2 py-2 text-center">有(5)</td>
                  <td className="border border-gray-300 px-2 py-2 text-center">3天(+7)</td>
                  <td className="border border-gray-300 px-2 py-2 text-center font-bold">27</td>
                  <td className="border border-gray-300 px-2 py-2 text-center font-bold text-red-600">~98</td>
                  <td className="border border-gray-300 px-2 py-2 text-center">★★★★★</td>
                  <td className="border border-gray-300 px-3 py-2 text-red-700 font-semibold">立即投入，最高优先级</td>
                </tr>

                <tr className="bg-purple-50">
                  <td className="border border-gray-300 px-3 py-2">CEO战略项目（新业务线）</td>
                  <td className="border border-gray-300 px-2 py-2 text-center font-bold text-purple-600">8</td>
                  <td className="border border-gray-300 px-2 py-2 text-center">三月窗口(3)</td>
                  <td className="border border-gray-300 px-2 py-2 text-center">无(0)</td>
                  <td className="border border-gray-300 px-2 py-2 text-center">12天(+5)</td>
                  <td className="border border-gray-300 px-2 py-2 text-center font-bold">16</td>
                  <td className="border border-gray-300 px-2 py-2 text-center font-bold text-purple-600">~78</td>
                  <td className="border border-gray-300 px-2 py-2 text-center">★★★★</td>
                  <td className="border border-gray-300 px-3 py-2 text-purple-700">优先执行，建议切分MVP</td>
                </tr>

                <tr className="bg-blue-50">
                  <td className="border border-gray-300 px-3 py-2">核心指标优化（转化率+5%）</td>
                  <td className="border border-gray-300 px-2 py-2 text-center font-bold text-blue-600">6</td>
                  <td className="border border-gray-300 px-2 py-2 text-center">随时(0)</td>
                  <td className="border border-gray-300 px-2 py-2 text-center">无(0)</td>
                  <td className="border border-gray-300 px-2 py-2 text-center">4天(+7)</td>
                  <td className="border border-gray-300 px-2 py-2 text-center font-bold">13</td>
                  <td className="border border-gray-300 px-2 py-2 text-center font-bold text-blue-600">~65</td>
                  <td className="border border-gray-300 px-2 py-2 text-center">★★★</td>
                  <td className="border border-gray-300 px-3 py-2 text-blue-700">小而美，可插队执行</td>
                </tr>

                <tr className="bg-green-50">
                  <td className="border border-gray-300 px-3 py-2">流程优化（节省20%时间）</td>
                  <td className="border border-gray-300 px-2 py-2 text-center font-bold text-green-600">3</td>
                  <td className="border border-gray-300 px-2 py-2 text-center">三月窗口(3)</td>
                  <td className="border border-gray-300 px-2 py-2 text-center">无(0)</td>
                  <td className="border border-gray-300 px-2 py-2 text-center">8天(+5)</td>
                  <td className="border border-gray-300 px-2 py-2 text-center font-bold">11</td>
                  <td className="border border-gray-300 px-2 py-2 text-center font-bold text-green-600">~58</td>
                  <td className="border border-gray-300 px-2 py-2 text-center">★★★</td>
                  <td className="border border-gray-300 px-3 py-2 text-green-700">窗口内完成，视容量安排</td>
                </tr>

                <tr className="bg-gray-50">
                  <td className="border border-gray-300 px-3 py-2">UI样式微调</td>
                  <td className="border border-gray-300 px-2 py-2 text-center font-bold text-gray-600">3</td>
                  <td className="border border-gray-300 px-2 py-2 text-center">随时(0)</td>
                  <td className="border border-gray-300 px-2 py-2 text-center">无(0)</td>
                  <td className="border border-gray-300 px-2 py-2 text-center">1天(+8)</td>
                  <td className="border border-gray-300 px-2 py-2 text-center font-bold">11</td>
                  <td className="border border-gray-300 px-2 py-2 text-center font-bold text-gray-600">~58</td>
                  <td className="border border-gray-300 px-2 py-2 text-center">★★★</td>
                  <td className="border border-gray-300 px-3 py-2 text-gray-700">极小任务，可快速插入</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ==================== 使用建议 ==================== */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-400 rounded-lg p-5 mt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">💡 使用建议</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-green-600 font-bold mr-2">✓</span>
                <span><strong>大需求必须切分</strong>：工作量超过30天的需求建议拆分为MVP（最小可行版本），优先交付核心价值。</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 font-bold mr-2">✓</span>
                <span><strong>窗口期抓紧</strong>：有时间窗口的需求要在窗口内完成，否则价值衰减。</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 font-bold mr-2">✓</span>
                <span><strong>小任务插队</strong>：1-5天的小需求可以在迭代间隙快速插入，提升整体交付效率。</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 font-bold mr-2">✓</span>
                <span><strong>动态调整</strong>：排期会议中可根据讨论实时修改评分，系统即时重算排序。</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 font-bold mr-2">✗</span>
                <span><strong>避免主观偏见</strong>：评分应基于客观标准，避免个人喜好影响决策。</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="flex-shrink-0 p-5 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium"
          >
            {UI_TEXT.BTN_CLOSE}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HandbookModal;
