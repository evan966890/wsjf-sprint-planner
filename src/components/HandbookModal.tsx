import { X } from 'lucide-react';
import { UI_TEXT, STAR_RATING_RULES, BUSINESS_VALUE_LEVELS, TIME_CRITICALITY_MAP, EFFORT_BONUS_RULES } from '../constants';

// ============================================================================
// UI组件 - WSJF评分说明书弹窗 (Handbook Modal Component)
// ============================================================================

/**
 * WSJF-Lite排期评分说明书弹窗组件
 *
 * 功能说明：
 * - 展示实际使用的WSJF-Lite评分方法论
 * - 4档业务影响度标准（蓝色深浅度卡片）
 * - 8档工作量奖励分制度
 * - 详细的计算公式和星级分档
 * - 提供示例帮助用户理解评分逻辑
 *
 * 内容结构：
 * - 第一部分：业务影响度（4档蓝色深浅度）
 * - 第二部分：其他评分维度（时间窗口、工作量）
 * - 第三部分：计算公式和星级分档
 * - 第四部分：实战示例
 *
 * @param onClose - 关闭弹窗回调函数
 */
const HandbookModal = ({ onClose }: { onClose: () => void }) => {
  // 业务影响度数组（按分数排序）
  const bvLevels = Object.entries(BUSINESS_VALUE_LEVELS).sort((a, b) => b[1].score - a[1].score);

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
              <strong>WSJF-Lite 方法论</strong>：基于业务影响度、时间窗口和工作量三个维度，
              自动计算1-100的{UI_TEXT.WEIGHT_SCORE}和{UI_TEXT.STAR_RATING}，帮助团队科学决策需求优先级。
            </p>
          </div>

          {/* ==================== 第一部分：业务影响度 ==================== */}
          <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900 border-b-2 border-gray-300 pb-2">
            一、业务影响度评分（4档蓝色深浅度）
          </h2>

          <p className="text-gray-700 mb-4">
            根据需求对业务的实际影响进行评分，分为4个等级。<strong className="text-blue-600">卡片颜色从浅蓝到深蓝，价值越高颜色越深。</strong>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {bvLevels.map(([key, level]) => {
              const gradient = `linear-gradient(135deg, ${level.color.from} 0%, ${level.color.to} 100%)`;
              const isLight = key === '局部';

              return (
                <div
                  key={key}
                  className={`rounded-lg p-5 border-2 ${isLight ? 'border-gray-300' : 'border-blue-500'}`}
                  style={{ background: gradient }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className={`text-xl font-bold m-0 ${level.textColor}`}>{level.name}</h3>
                      <p className={`text-sm mt-1 ${level.textColor} opacity-90`}>分值：{level.score}分</p>
                    </div>
                    <div className={`px-4 py-2 rounded-full ${isLight ? 'bg-gray-800 text-white' : 'bg-white/20 backdrop-blur-sm text-white'} font-bold text-sm`}>
                      {key}
                    </div>
                  </div>

                  <p className={`text-sm mb-3 ${level.textColor} ${isLight ? '' : 'opacity-95'}`}>
                    {level.description}
                  </p>

                  <div className={`${isLight ? 'bg-white' : 'bg-white/10 backdrop-blur-sm'} rounded p-3`}>
                    <p className={`text-xs font-semibold mb-2 ${level.textColor}`}>典型案例：</p>
                    <ul className={`text-xs space-y-1 m-0 pl-4 ${level.textColor} ${isLight ? '' : 'opacity-90'}`}>
                      {level.examples.map((example, idx) => (
                        <li key={idx}>{example}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mt-4">
            <p className="text-sm text-yellow-800 m-0">
              <strong>💡 提示</strong>：业务影响度是优先级的核心因素。选择时应基于客观的业务影响，而非个人喜好。
            </p>
          </div>

          {/* ==================== 第二部分：其他评分维度 ==================== */}
          <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900 border-b-2 border-gray-300 pb-2">
            二、其他评分维度
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 时间窗口 */}
            <div className="border-2 border-yellow-400 rounded-lg p-5 bg-gradient-to-br from-yellow-50 to-orange-50">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                <span className="bg-yellow-400 text-gray-900 px-2 py-1 rounded mr-2 text-sm">时间因素</span>
                {UI_TEXT.TIME_CRITICALITY}
              </h3>
              <div className="space-y-2">
                <div className="bg-white rounded p-3 border-l-4 border-gray-300">
                  <p className="font-semibold text-sm mb-1">{UI_TEXT.TIME_ANYTIME}（+{TIME_CRITICALITY_MAP['随时']}分）</p>
                  <p className="text-xs text-gray-600">任何时间完成效果基本相同，无明确窗口</p>
                </div>
                <div className="bg-white rounded p-3 border-l-4 border-yellow-400">
                  <p className="font-semibold text-sm mb-1">{UI_TEXT.TIME_THREE_MONTHS}（+{TIME_CRITICALITY_MAP['三月窗口']}分）</p>
                  <p className="text-xs text-gray-600">需在3个月内完成，存在明确业务窗口，越晚效果越差</p>
                </div>
                <div className="bg-white rounded p-3 border-l-4 border-orange-500">
                  <p className="font-semibold text-sm mb-1">{UI_TEXT.TIME_ONE_MONTH}（+{TIME_CRITICALITY_MAP['一月硬窗口']}分）</p>
                  <p className="text-xs text-gray-600">必须在1个月内完成，硬性时间限制（法规、合同、重大活动）</p>
                </div>
              </div>
            </div>

            {/* 强制DDL */}
            <div className="border-2 border-red-400 rounded-lg p-5 bg-gradient-to-br from-red-50 to-pink-50">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                <span className="bg-red-400 text-white px-2 py-1 rounded mr-2 text-sm">截止日期</span>
                {UI_TEXT.HARD_DEADLINE}
              </h3>
              <div className="space-y-2">
                <div className="bg-white rounded p-3 border-l-4 border-gray-300">
                  <p className="font-semibold text-sm mb-1">无强制截止（+0分）</p>
                  <p className="text-xs text-gray-600">没有明确日期凭据，时间相对灵活</p>
                </div>
                <div className="bg-white rounded p-3 border-l-4 border-red-500">
                  <p className="font-semibold text-sm mb-1 text-red-700">有强制截止（+5分）</p>
                  <p className="text-xs text-gray-600">存在明确日期凭据（合同条款、合规函件、活动档期等），过期则价值显著衰减</p>
                  <div className="mt-2 bg-red-50 rounded p-2">
                    <p className="text-xs text-red-700 m-0">⚠️ 强制DDL将使卡片显示为红色，优先级大幅提升</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 工作量奖励 */}
            <div className="border-2 border-green-400 rounded-lg p-5 bg-gradient-to-br from-green-50 to-emerald-50 md:col-span-2">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                <span className="bg-green-400 text-white px-2 py-1 rounded mr-2 text-sm">工作量</span>
                {UI_TEXT.EFFORT} - 奖励分机制（8档细分）
              </h3>
              <p className="text-sm text-gray-700 mb-4">
                <strong>设计理念</strong>：{EFFORT_BONUS_RULES.description}。<strong className="text-green-700">2天以内的需求获得最高+8分奖励！</strong>
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {EFFORT_BONUS_RULES.rules.map((rule, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-3 border-2 border-green-200 hover:border-green-400 transition">
                    <p className="font-bold text-sm text-green-700">{rule.range}</p>
                    <p className="text-2xl font-bold text-green-600 my-1">+{rule.bonus}</p>
                    <p className="text-xs text-gray-600 leading-tight">{rule.description}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 bg-green-100 border border-green-300 rounded p-3">
                <p className="text-xs text-green-800 m-0">
                  <strong>💡 建议</strong>：工作量超过30天的需求建议拆分为MVP（最小可行版本），优先交付核心价值，提升整体交付效率。
                </p>
              </div>
            </div>
          </div>

          {/* ==================== 第三部分：计算公式 ==================== */}
          <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900 border-b-2 border-gray-300 pb-2">
            三、计算公式与星级分档
          </h2>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-lg p-5 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">计算公式</h3>

            <div className="bg-white rounded-lg p-4 mb-4 border-l-4 border-blue-500">
              <p className="text-xs text-gray-600 mb-1">步骤一：计算原始分（rawScore）</p>
              <p className="font-mono text-sm font-bold text-blue-700 mb-2">
                rawScore = 业务影响度 + 时间窗口 + 强制DDL + 工作量奖励
              </p>
              <p className="text-xs text-gray-600">
                范围：3-28分。例如：战略平台(10) + 一月硬窗口(5) + 有DDL(5) + 2天内(+8) = 28分（最高）
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 mb-4 border-l-4 border-purple-500">
              <p className="text-xs text-gray-600 mb-1">步骤二：归一化为展示分（displayScore，1-100）</p>
              <p className="font-mono text-sm font-bold text-purple-700 mb-2">
                displayScore = 10 + 90 × (rawScore - minRaw) / (maxRaw - minRaw)
              </p>
              <p className="text-xs text-gray-600">
                线性归一化到1-100区间，便于直观对比。当所有需求分数相同时，统一为60分。
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 border-l-4 border-yellow-500">
              <p className="text-xs text-gray-600 mb-1">步骤三：星级分档</p>
              <p className="text-sm text-gray-700">
                根据展示分自动划分为2-5星，提供视觉化的优先级标识。
              </p>
            </div>
          </div>

          <h3 className="text-lg font-bold text-gray-900 mb-3">星级分档规则</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-gradient-to-r from-yellow-100 to-yellow-50 border-2 border-yellow-500 rounded-lg p-4 shadow">
              <p className="text-2xl mb-1">{STAR_RATING_RULES[5].label}</p>
              <p className="font-bold text-lg text-gray-900">≥{STAR_RATING_RULES[5].threshold}分</p>
              <p className="text-sm text-gray-700 mt-1">{STAR_RATING_RULES[5].description}</p>
            </div>

            <div className="bg-gradient-to-r from-blue-100 to-blue-50 border-2 border-blue-500 rounded-lg p-4 shadow">
              <p className="text-xl mb-1">{STAR_RATING_RULES[4].label}</p>
              <p className="font-bold text-lg text-gray-900">{STAR_RATING_RULES[4].threshold}-84分</p>
              <p className="text-sm text-gray-700 mt-1">{STAR_RATING_RULES[4].description}</p>
            </div>

            <div className="bg-gradient-to-r from-green-100 to-green-50 border-2 border-green-500 rounded-lg p-4 shadow">
              <p className="text-lg mb-1">{STAR_RATING_RULES[3].label}</p>
              <p className="font-bold text-lg text-gray-900">{STAR_RATING_RULES[3].threshold}-69分</p>
              <p className="text-sm text-gray-700 mt-1">{STAR_RATING_RULES[3].description}</p>
            </div>

            <div className="bg-gradient-to-r from-gray-100 to-gray-50 border-2 border-gray-400 rounded-lg p-4 shadow">
              <p className="text-base mb-1">{STAR_RATING_RULES[2].label}</p>
              <p className="font-bold text-lg text-gray-900">≤54分</p>
              <p className="text-sm text-gray-700 mt-1">{STAR_RATING_RULES[2].description}</p>
            </div>
          </div>

          {/* ==================== 第四部分：实战示例 ==================== */}
          <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900 border-b-2 border-gray-300 pb-2">
            四、实战示例
          </h2>

          <div className="overflow-x-auto">
            <table className="min-w-full border-2 border-gray-300 text-xs">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="border border-gray-300 px-3 py-2 text-left">需求场景</th>
                  <th className="border border-gray-300 px-2 py-2">业务影响度</th>
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
                <tr className="bg-red-50 hover:bg-red-100">
                  <td className="border border-gray-300 px-3 py-2 font-medium">支付系统宕机修复</td>
                  <td className="border border-gray-300 px-2 py-2 text-center font-bold text-blue-600">战略平台(10)</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-xs">一月硬窗口(5)</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-red-600 font-bold">有(5)</td>
                  <td className="border border-gray-300 px-2 py-2 text-center">1天(+8)</td>
                  <td className="border border-gray-300 px-2 py-2 text-center font-bold text-lg">28</td>
                  <td className="border border-gray-300 px-2 py-2 text-center font-bold text-red-600 text-lg">~100</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-yellow-500">★★★★★</td>
                  <td className="border border-gray-300 px-3 py-2 text-red-700 font-semibold">立即投入，最高优先级</td>
                </tr>

                <tr className="bg-purple-50 hover:bg-purple-100">
                  <td className="border border-gray-300 px-3 py-2 font-medium">战略级新业务线搭建</td>
                  <td className="border border-gray-300 px-2 py-2 text-center font-bold text-blue-600">战略平台(10)</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-xs">三月窗口(3)</td>
                  <td className="border border-gray-300 px-2 py-2 text-center">无(0)</td>
                  <td className="border border-gray-300 px-2 py-2 text-center">8天(+5)</td>
                  <td className="border border-gray-300 px-2 py-2 text-center font-bold">18</td>
                  <td className="border border-gray-300 px-2 py-2 text-center font-bold text-purple-600">~82</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-blue-500">★★★★</td>
                  <td className="border border-gray-300 px-3 py-2 text-purple-700">优先执行，建议切分MVP</td>
                </tr>

                <tr className="bg-blue-50 hover:bg-blue-100">
                  <td className="border border-gray-300 px-3 py-2 font-medium">核心指标优化（GMV+5%）</td>
                  <td className="border border-gray-300 px-2 py-2 text-center font-bold text-blue-600">撬动核心(8)</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-xs">随时(0)</td>
                  <td className="border border-gray-300 px-2 py-2 text-center">无(0)</td>
                  <td className="border border-gray-300 px-2 py-2 text-center">4天(+7)</td>
                  <td className="border border-gray-300 px-2 py-2 text-center font-bold">15</td>
                  <td className="border border-gray-300 px-2 py-2 text-center font-bold text-blue-600">~70</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-blue-500">★★★★</td>
                  <td className="border border-gray-300 px-3 py-2 text-blue-700">小而美，可优先执行</td>
                </tr>

                <tr className="bg-green-50 hover:bg-green-100">
                  <td className="border border-gray-300 px-3 py-2 font-medium">流程优化（节省20%时间）</td>
                  <td className="border border-gray-300 px-2 py-2 text-center font-bold text-blue-600">明显(6)</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-xs">三月窗口(3)</td>
                  <td className="border border-gray-300 px-2 py-2 text-center">无(0)</td>
                  <td className="border border-gray-300 px-2 py-2 text-center">10天(+5)</td>
                  <td className="border border-gray-300 px-2 py-2 text-center font-bold">14</td>
                  <td className="border border-gray-300 px-2 py-2 text-center font-bold text-green-600">~66</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-green-500">★★★</td>
                  <td className="border border-gray-300 px-3 py-2 text-green-700">窗口内完成，视容量安排</td>
                </tr>

                <tr className="bg-gray-50 hover:bg-gray-100">
                  <td className="border border-gray-300 px-3 py-2 font-medium">UI样式微调</td>
                  <td className="border border-gray-300 px-2 py-2 text-center font-bold text-blue-600">局部(3)</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-xs">随时(0)</td>
                  <td className="border border-gray-300 px-2 py-2 text-center">无(0)</td>
                  <td className="border border-gray-300 px-2 py-2 text-center">1天(+8)</td>
                  <td className="border border-gray-300 px-2 py-2 text-center font-bold">11</td>
                  <td className="border border-gray-300 px-2 py-2 text-center font-bold text-gray-600">~46</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-gray-500">★★</td>
                  <td className="border border-gray-300 px-3 py-2 text-gray-700">极小任务，可快速插入</td>
                </tr>

                <tr className="bg-amber-50 hover:bg-amber-100">
                  <td className="border border-gray-300 px-3 py-2 font-medium">中等改进（影响10%用户）</td>
                  <td className="border border-gray-300 px-2 py-2 text-center font-bold text-blue-600">明显(6)</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-xs">随时(0)</td>
                  <td className="border border-gray-300 px-2 py-2 text-center">无(0)</td>
                  <td className="border border-gray-300 px-2 py-2 text-center">18天(+3)</td>
                  <td className="border border-gray-300 px-2 py-2 text-center font-bold">9</td>
                  <td className="border border-gray-300 px-2 py-2 text-center font-bold text-amber-600">~35</td>
                  <td className="border border-gray-300 px-2 py-2 text-center text-gray-500">★★</td>
                  <td className="border border-gray-300 px-3 py-2 text-amber-700">体量较大，建议切分后排期</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ==================== 使用建议 ==================== */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-400 rounded-lg p-5 mt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">💡 使用建议与最佳实践</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-green-600 font-bold mr-2 text-lg">✓</span>
                <span><strong>大需求必须切分</strong>：工作量超过30天的需求建议拆分为MVP（最小可行版本），优先交付核心价值。2天内的小需求可获得最高+8分奖励！</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 font-bold mr-2 text-lg">✓</span>
                <span><strong>窗口期抓紧</strong>：有时间窗口的需求要在窗口内完成，否则价值衰减。一月硬窗口+5分，三月窗口+3分。</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 font-bold mr-2 text-lg">✓</span>
                <span><strong>小任务插队</strong>：1-5天的小需求可以在迭代间隙快速插入，提升整体交付效率和团队士气。</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 font-bold mr-2 text-lg">✓</span>
                <span><strong>动态调整</strong>：排期会议中可根据讨论实时修改评分，系统即时重算排序，确保决策基于最新信息。</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 font-bold mr-2 text-lg">✓</span>
                <span><strong>色彩参考</strong>：蓝色深浅代表业务影响度，红色代表有强制DDL。卡片越深色/越红，优先级越高。</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 font-bold mr-2 text-lg">✗</span>
                <span><strong>避免主观偏见</strong>：评分应基于客观标准（业务影响、时间窗口、工作量），避免个人喜好影响决策。</span>
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
