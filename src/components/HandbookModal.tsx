import { X } from 'lucide-react';
import { UI_TEXT, STAR_RATING_RULES } from '../constants';

// ============================================================================
// UI组件 - WSJF评分说明书弹窗 (Handbook Modal Component)
// ============================================================================

/**
 * WSJF-Lite排期评分说明书弹窗组件
 *
 * 功能说明：
 * - 展示完整的WSJF评分方法论说明文档
 * - 包含业务版和产品/研发版两部分内容
 * - 详细解释评分维度、计算公式、分数区间设计
 * - 提供示例帮助用户理解评分逻辑
 *
 * 内容结构：
 * - 第一部分：业务版（面向业务人员）
 * - 第二部分：产品/研发版（面向PM和研发）
 * - 第三部分：3-28分数区间设计说明
 * - 附注：术语解释
 *
 * @param onClose - 关闭弹窗回调函数
 */
const HandbookModal = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex-shrink-0 p-5 border-b border-gray-200 bg-gray-900 text-white rounded-t-xl flex items-center justify-between">
          <h3 className="text-xl font-semibold">{UI_TEXT.HANDBOOK_TITLE}</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2 transition">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 prose prose-sm max-w-none">
          <p className="text-sm text-gray-600">（业务版 + 产品/研发版，含分数区间"3–28"设计说明）</p>

          <p><strong>说明</strong>：本文将所有缩写在首次出现处标注英文全称与含义。评分全过程仅使用整数，最终对业务侧展示为<strong>1–100 的"热度分"</strong>与星级分档。</p>

          <h2 className="text-xl font-bold mt-6 mb-3">第一部分｜业务版（Business）</h2>

          <h3 className="text-lg font-semibold mt-4 mb-2">1. 需要提供的三项选择（全为选择题，无需计算）</h3>

          <h4 className="font-semibold mt-3 mb-2">业务价值（BV, Business Value）—四选一</h4>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>局部体验优化</strong>：影响范围较小，锦上添花。</li>
            <li><strong>明显改善</strong>：能够看到指标改善或明确的节省时间/成本。</li>
            <li><strong>撬动核心指标</strong>：直接作用于北极星指标或关键 KPI（Key Performance Indicator）。</li>
            <li><strong>战略/平台级</strong>：形成可复用平台能力、显著降低合规/技术风险，或打开新业务线。</li>
          </ul>
          <p className="text-sm text-gray-600 mt-2">说明：原 WSJF 中的 RR/OE（Risk Reduction / Opportunity Enablement，风险降低/机会开启）已并入 BV 的判断口径，不再单独打分。</p>

          <h4 className="font-semibold mt-3 mb-2">迫切程度（TC, Time Criticality）—三选一</h4>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>{UI_TEXT.TIME_ANYTIME}可做</strong>：任何时间完成的效果基本等同。</li>
            <li><strong>需要在未来三个月内完成</strong>：存在明确业务窗口，越晚效果越差。</li>
            <li><strong>必须在未来一个月内完成</strong>：存在硬性时间限制（法规、合同、重大活动等），过期则价值显著衰减或失效。</li>
          </ul>

          <h4 className="font-semibold mt-3 mb-2">强截止（DDL, Hard Deadline）—是/否</h4>
          <p>若存在明确日期且能够提供凭据（合同条款、合规函件、活动档期等），请选择"是"；否则选择"否"。</p>
          <p><strong>开发工作量（人日）</strong>由研发侧评估，不需要业务填写或估算。</p>

          <h3 className="text-lg font-semibold mt-4 mb-2">2. 系统如何使用这些选择</h3>
          <p>系统将上述三项选择与研发评估的开发人日结合，计算出1–100 的热度分并生成排序。颜色越深表示越应优先进入排期；会议过程中可根据讨论实时修改选择项，系统即时重算与重排。大体量需求建议先切分为当期可交付的 MVP（Minimum Viable Product，最小可行版本），更利于在容量限制内获得优先排期。</p>

          <h3 className="text-lg font-semibold mt-4 mb-2">3. 业务示例（面向直觉理解）</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>示例 A</strong>：撬动核心指标 + 必须在未来一个月内完成 + 存在强截止 → 热度显著偏高，即便人日偏大，也应优先排期。</li>
            <li><strong>示例 B</strong>：明显改善 + 随时可做 → 热度中等；若切分为多个小块，更容易在当月容量内安排。</li>
            <li><strong>示例 C</strong>：局部体验优化 + 需要在未来三个月内完成 → 热度中上；建议在窗口前完成以获取更好收益。</li>
            <li><strong>示例 D</strong>：战略/平台级 + 随时可做 → 热度中等；若能证明复用范围广，热度将进一步提高。</li>
            <li><strong>示例 E</strong>：撬动核心指标 + 随时可做 + 人日很小（≤5）→ 常因"见效快"获得优先计划位置。</li>
            <li><strong>示例 F</strong>：存在强截止 + 人日特别大（&gt;30）→ 建议切分并锁定当期 MVP 以确保撞上时间窗口。</li>
          </ul>

          <h2 className="text-xl font-bold mt-6 mb-3">第二部分｜产品/研发版（PM/Dev）</h2>

          <h3 className="text-lg font-semibold mt-4 mb-2">1. 字段与数值映射（统一整数口径）</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>BV（Business Value）</strong>：局部 3｜明显 6｜撬动核心 8｜战略/平台级 10。</li>
            <li><strong>TC（Time Criticality）</strong>：随时 0｜三个月窗口 3｜一月硬窗口 5。</li>
            <li><strong>DDL（Hard Deadline）</strong>：无 0｜有（凭据齐全）5。</li>
            <li><strong>工作量分（WorkloadScore，正向加分）</strong>：≤2 → +8｜3-5 → +7｜6-14 → +5｜15-30 → +3｜31-50 → +2｜51-100 → +1｜101-150 → +0｜&gt;150 → +0。目的：以"加分"方式鼓励切分，避免"扣分"心智负担。</li>
            <li><strong>技术进展</strong>：只有"已评估工作量"或"已完成技术方案"的需求才能拖入迭代池排期；"未评估"状态的需求无法排期。</li>
          </ul>

          <h3 className="text-lg font-semibold mt-4 mb-2">2. 计算与展示（仅整数）</h3>
          <p><strong>原始分（RawScore）</strong>：Raw = BV + TC + DDL + WorkloadScore（典型范围 3–28）。</p>
          <p><strong>归一化展示分（Display，1–100 整分）</strong>：使用当前待排批次的最小/最大 RawScore 进行线性归一化；当 max=min 时统一置为 60。</p>

          <h4 className="font-semibold mt-3 mb-2">星级与分档（用于标签与配色）</h4>
          <ul className="list-disc pl-6 space-y-1">
            <li>≥{STAR_RATING_RULES[5].threshold}：{STAR_RATING_RULES[5].label} "{STAR_RATING_RULES[5].description}"</li>
            <li>{STAR_RATING_RULES[4].threshold}–84：{STAR_RATING_RULES[4].label} "{STAR_RATING_RULES[4].description}"</li>
            <li>{STAR_RATING_RULES[3].threshold}–69：{STAR_RATING_RULES[3].label} "{STAR_RATING_RULES[3].description}"</li>
            <li>≤54：{STAR_RATING_RULES[2].label} "{STAR_RATING_RULES[2].description}/视容量安排"</li>
          </ul>

          <h3 className="text-lg font-semibold mt-4 mb-2">3. 排序与入池规则</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>主排序键</strong>：Display（降序）。</li>
            <li><strong>平手顺序</strong>：① 强 DDL 在前；② TC 高在前（5＞3＞0）；③ 开发人日更小在前；④ 仍并列时由主持人裁量并记录"例外理由"。</li>
            <li><strong>入池校验</strong>：容量（∑人日 ≤ 池容量）、窗口（DDL 不跨期）、就绪（DoR 达标）。</li>
            <li><strong>切分建议</strong>：当人日 &gt;30 或容量不足时，引导填写当期 MVP 范围与承诺人日，余量自动结转下一迭代。</li>
          </ul>

          <h3 className="text-lg font-semibold mt-4 mb-2">4. 技术示例（含整分 Raw 与示意 Display）</h3>
          <p className="text-sm text-gray-600">注：Display 取决于当批次的 min/max，下表仅示意相对高低。</p>
          <div className="overflow-x-auto mt-2">
            <table className="min-w-full border border-gray-300 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-2 py-1">条目</th>
                  <th className="border border-gray-300 px-2 py-1">BV</th>
                  <th className="border border-gray-300 px-2 py-1">TC</th>
                  <th className="border border-gray-300 px-2 py-1">DDL</th>
                  <th className="border border-gray-300 px-2 py-1">人日→WL</th>
                  <th className="border border-gray-300 px-2 py-1">Raw</th>
                  <th className="border border-gray-300 px-2 py-1">典型Display</th>
                  <th className="border border-gray-300 px-2 py-1">解读</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="border border-gray-300 px-2 py-1">A 撬核心+月度+有DDL+12d</td><td className="border border-gray-300 px-2 py-1">8</td><td className="border border-gray-300 px-2 py-1">5</td><td className="border border-gray-300 px-2 py-1">5</td><td className="border border-gray-300 px-2 py-1">+4</td><td className="border border-gray-300 px-2 py-1">22</td><td className="border border-gray-300 px-2 py-1">~95</td><td className="border border-gray-300 px-2 py-1">强窗口高价值，优先锁池</td></tr>
                <tr><td className="border border-gray-300 px-2 py-1">B 明显+随时+无DDL+6d</td><td className="border border-gray-300 px-2 py-1">6</td><td className="border border-gray-300 px-2 py-1">0</td><td className="border border-gray-300 px-2 py-1">0</td><td className="border border-gray-300 px-2 py-1">+4</td><td className="border border-gray-300 px-2 py-1">10</td><td className="border border-gray-300 px-2 py-1">~55</td><td className="border border-gray-300 px-2 py-1">中热度，视容量与切分</td></tr>
                <tr><td className="border border-gray-300 px-2 py-1">C 局部+三月窗口+无DDL+4d</td><td className="border border-gray-300 px-2 py-1">3</td><td className="border border-gray-300 px-2 py-1">3</td><td className="border border-gray-300 px-2 py-1">0</td><td className="border border-gray-300 px-2 py-1">+6</td><td className="border border-gray-300 px-2 py-1">12</td><td className="border border-gray-300 px-2 py-1">~65</td><td className="border border-gray-300 px-2 py-1">窗口前完成更优</td></tr>
                <tr><td className="border border-gray-300 px-2 py-1">D 战略平台+随时+无DDL+20d</td><td className="border border-gray-300 px-2 py-1">10</td><td className="border border-gray-300 px-2 py-1">0</td><td className="border border-gray-300 px-2 py-1">0</td><td className="border border-gray-300 px-2 py-1">+2</td><td className="border border-gray-300 px-2 py-1">12</td><td className="border border-gray-300 px-2 py-1">~60</td><td className="border border-gray-300 px-2 py-1">高价值但体量大，宜切分</td></tr>
                <tr><td className="border border-gray-300 px-2 py-1">E 撬核心+随时+无DDL+3d</td><td className="border border-gray-300 px-2 py-1">8</td><td className="border border-gray-300 px-2 py-1">0</td><td className="border border-gray-300 px-2 py-1">0</td><td className="border border-gray-300 px-2 py-1">+6</td><td className="border border-gray-300 px-2 py-1">14</td><td className="border border-gray-300 px-2 py-1">~70</td><td className="border border-gray-300 px-2 py-1">小而美，常可插队</td></tr>
                <tr><td className="border border-gray-300 px-2 py-1">F 明显+月度+无DDL+28d</td><td className="border border-gray-300 px-2 py-1">6</td><td className="border border-gray-300 px-2 py-1">5</td><td className="border border-gray-300 px-2 py-1">0</td><td className="border border-gray-300 px-2 py-1">+2</td><td className="border border-gray-300 px-2 py-1">13</td><td className="border border-gray-300 px-2 py-1">~68</td><td className="border border-gray-300 px-2 py-1">有窗口但体量大，建议切分</td></tr>
                <tr><td className="border border-gray-300 px-2 py-1">G 战略平台+月度+有DDL+35d</td><td className="border border-gray-300 px-2 py-1">10</td><td className="border border-gray-300 px-2 py-1">5</td><td className="border border-gray-300 px-2 py-1">5</td><td className="border border-gray-300 px-2 py-1">+0</td><td className="border border-gray-300 px-2 py-1">20</td><td className="border border-gray-300 px-2 py-1">~88</td><td className="border border-gray-300 px-2 py-1">必做但需以 MVP 形式入当期</td></tr>
              </tbody>
            </table>
          </div>

          <h2 className="text-xl font-bold mt-6 mb-3">第三部分｜"3–28"区间设计的原因与对比</h2>
          <h3 className="text-lg font-semibold mt-4 mb-2">1. 区间由四个整数映射自然组合而成</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>BV</strong>：3/6/8/10（区分"不错"与"真硬货"）。</li>
            <li><strong>TC</strong>：0/3/5（将"季度窗口"与"月度硬窗口"拉开 2 分）。</li>
            <li><strong>DDL</strong>：0/5（强截止一票难求）。</li>
            <li><strong>工作量分</strong>：+8/+7/+5/+3/+2/+1/+0（8档细分，2天内最高激励，超大需求零加分，强烈鼓励切分）。</li>
          </ul>
          <p className="mt-2">由此，Raw 最小值 = 3 + 0 + 0 + 0 = 3；Raw 最大值 = 10 + 5 + 5 + 8 = 28。</p>

          <h3 className="text-lg font-semibold mt-4 mb-2">2. 为什么不采用 1–10 或 1–11 等更"整齐"的区间</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>区分度不足</strong>：窄区间在几十个条目中容易形成"6–9 分密集带"，大量平手，排序需要频繁口头裁决。</li>
            <li><strong>窗口与体量难以显性影响排序</strong>：例如 TC 若仅为 0/1/2，月度 vs 季度的差值只有 1，易被其他噪声抵消。</li>
            <li><strong>对切分的激励不明显</strong>：工作量若仅为 +3/+2/+1/+0，每档差 1，难以促使大项拆分为可当期交付的 MVP。</li>
          </ul>

          <p className="mt-2"><strong>结论</strong>：3–28 区间是"整数、好解释、能拉开差距、鼓励切分并保障窗口"的平衡点。前端仍统一展示为 1–100 的热度分与星级，业务无需接触底层数字。</p>

          <h2 className="text-xl font-bold mt-6 mb-3">附注（名词解释）</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>WSJF</strong>（Weighted Shortest Job First）：带权重的最短任务优先排序方法。</li>
            <li><strong>BV</strong>（Business Value）：业务价值。</li>
            <li><strong>TC</strong>（Time Criticality）：迫切程度。</li>
            <li><strong>DDL</strong>（Hard Deadline）：强截止日期。</li>
            <li><strong>RR/OE</strong>（Risk Reduction / Opportunity Enablement）：风险降低/机会开启（在本方案中已并入 BV）。</li>
            <li><strong>技术进展</strong>：包含"未评估"、"已评估工作量"、"已完成技术方案"三个状态，只有后两种状态的需求才能排期。</li>
            <li><strong>MVP</strong>（Minimum Viable Product）：最小可行版本。</li>
            <li><strong>KPI</strong>（Key Performance Indicator）：关键绩效指标。</li>
          </ul>
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
