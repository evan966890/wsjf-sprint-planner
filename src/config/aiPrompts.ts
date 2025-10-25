/**
 * WSJF Sprint Planner - AI分析提示词配置
 *
 * 此文件包含AI智能分析功能的提示词模板
 * 您可以根据实际业务需求编辑和优化这些提示词
 *
 * v1.2.1: 初始版本
 */

/**
 * AI业务影响度评估提示词模板
 *
 * 参数说明：
 * - {documentUrl}: 文档链接
 * - {description}: 需求描述
 * - {currentName}: 当前填写的需求名称
 *
 * 注意事项：
 * 1. 提示词应保持结构化，便于AI理解
 * 2. 评分标准应具体明确，避免模糊性
 * 3. 返回JSON格式需严格定义，确保可解析
 * 4. 不同AI模型（OpenAI、DeepSeek）对相同提示词的理解可能略有差异
 *    建议使用具体的评分标准和案例来减少差异
 */
export const AI_BUSINESS_IMPACT_ANALYSIS_PROMPT = `你是一个专业的产品需求分析专家。请严格按照以下评分标准分析需求的业务影响度，并推荐影响的核心指标。

需求信息：
{documentUrl}
{description}
当前填写的需求名称：{currentName}

## 评分标准（1-10分制）

请严格参考以下标准进行评分，每个分数对应明确的业务场景：

**10分 - 致命缺陷**
- 不解决直接导致系统崩溃或核心业务无法运转
- 影响所有用户的核心功能（如支付、下单、登录完全失败）
- 造成严重的业务损失或法律风险
- 示例：支付系统宕机、数据安全漏洞、核心服务器瘫痪

**9分 - 严重阻塞**
- 阻塞关键业务流程，大面积影响用户
- 严重影响1-2个核心OKR指标（如GMV、NPS、门店数）
- 不解决会导致重大客户流失或收入损失
- 示例：订单无法同步、库存系统失效、关键报表无数据

**8分 - 战略必需**
- 公司战略级项目，影响多个核心指标
- CEO/高层明确要求的关键项目
- 行业竞争必须具备的能力
- 示例：新业务模式搭建、核心竞争力构建、重大合规要求

**7分 - 显著影响**
- 明显影响2-3个核心OKR指标
- 大范围改善用户体验或运营效率
- 覆盖50%以上用户或门店的重要功能
- 示例：关键流程优化、核心功能升级、重要数据分析能力

**6分 - 战略加速**
- 对1个核心OKR指标有显著提升
- 加速业务增长的重要项目
- 覆盖20-50%用户的核心功能改进
- 示例：转化率优化、关键功能补齐、重要渠道拓展

**5分 - 重要优化**
- 改善1-2个过程指标
- 提升部分用户体验或运营效率
- 覆盖10-20%用户的功能优化
- 示例：页面性能优化、局部流程改进、数据看板增强

**4分 - 有价值优化**
- 小幅改善用户体验或运营效率
- 覆盖5-10%用户的功能增强
- 减少部分运营成本或时间
- 示例：辅助功能增强、小流程优化、报表补充

**3分 - 常规功能**
- 常规功能开发，影响范围有限
- 覆盖<5%用户的功能
- 小幅提升某个指标
- 示例：新增辅助工具、小范围试点功能

**2分 - 小幅改进**
- 锦上添花的功能
- 仅影响少数用户
- 微小的体验改善
- 示例：UI调整、文案优化、小工具

**1分 - Nice-to-have**
- 可有可无的功能
- 几乎没有业务影响
- 纯粹的技术优化或试验性功能
- 示例：代码重构、技术探索、内部工具优化

## 指标推荐标准

**⚠️ 重要：必须使用以下准确的 metricKey，不要自己创造新的键值！**

**核心OKR指标**（从以下选择3-6个最相关的，必须使用准确的 metricKey）：

⭐ 指标选择策略：
- 直接影响的核心指标（3-4个）：需求直接改善的主要业务指标
- 间接影响的指标（1-2个）：需求间接带动的次要指标
- 优先选择可量化、可衡量的指标
- 避免选择关联性弱或影响微小的指标

收入相关：
- metricKey: "gmv", metricName: "GMV (总交易额)"
- metricKey: "revenue", metricName: "营收"
- metricKey: "gross_profit", metricName: "毛利/毛利率"

规模相关：
- metricKey: "store_opening", metricName: "门店开设数量"
- metricKey: "store_survival", metricName: "门店存活率/关店率"
- metricKey: "active_stores", metricName: "活跃门店数"

效率相关：
- metricKey: "store_efficiency", metricName: "坪效"
- metricKey: "labor_efficiency", metricName: "人效"
- metricKey: "inventory_turnover", metricName: "库存周转率"
- metricKey: "conversion_rate", metricName: "订单转化率"

合作相关：
- metricKey: "dealer_satisfaction_nps", metricName: "授权商满意度/NPS"
- metricKey: "dealer_retention", metricName: "授权商留存率"
- metricKey: "stores_per_dealer", metricName: "单个授权商平均开店数"

消费者体验：
- metricKey: "customer_nps", metricName: "消费者NPS/满意度"
- metricKey: "complaint_rate", metricName: "客诉率/客诉处理时长"
- metricKey: "repurchase_rate", metricName: "复购率"

小米人满意度：
- metricKey: "store_manager_satisfaction", metricName: "店长满意度"
- metricKey: "store_staff_satisfaction", metricName: "店员满意度"
- metricKey: "supervisor_satisfaction", metricName: "督导满意度"
- metricKey: "hq_staff_satisfaction", metricName: "总部小米人满意度"

**过程指标**（从以下选择2-5个最相关的，必须使用准确的 metricKey）：

⭐ 指标选择策略：
- 直接优化的过程指标（2-3个）：需求直接改善的运营流程、效率、质量等
- 附带提升的指标（1-2个）：需求带来的连锁改进
- 优先选择用户或运营人员能明显感知的改进
- 避免选择改善幅度极小的指标

运营效率类：
- metricKey: "order_processing_time", metricName: "订单处理时长"
- metricKey: "reconciliation_cycle", metricName: "对账周期"
- metricKey: "reconciliation_accuracy", metricName: "对账准确率"
- metricKey: "inventory_check_cycle", metricName: "库存盘点周期"
- metricKey: "inventory_check_accuracy", metricName: "库存盘点准确率"
- metricKey: "product_listing_time", metricName: "商品上架时长"
- metricKey: "promotion_setup_time", metricName: "促销配置时长"
- metricKey: "return_processing_time", metricName: "退换货处理时长"
- metricKey: "report_generation_time", metricName: "报表生成时长"

数据质量类：
- metricKey: "data_accuracy", metricName: "数据准确率"
- metricKey: "system_response_time", metricName: "系统响应时长"
- metricKey: "data_sync_delay", metricName: "数据同步延迟"
- metricKey: "abnormal_order_rate", metricName: "异常订单率"

协作效率类：
- metricKey: "dealer_response_time", metricName: "授权商响应时长"
- metricKey: "cross_system_steps", metricName: "跨系统操作步骤数"
- metricKey: "manual_intervention_rate", metricName: "人工干预率/人工处理工作量"
- metricKey: "training_cost", metricName: "培训成本/上手时长"

合规与风险类：
- metricKey: "compliance_coverage", metricName: "合规检查覆盖率"
- metricKey: "security_incidents", metricName: "数据安全事件数"
- metricKey: "system_availability", metricName: "系统可用性/稳定性"

## 分析流程

1. **理解需求背景**：基于文档链接或描述，理解需求的业务目标
2. **识别影响范围**：判断影响的用户群体、门店数量、业务流程
3. **评估业务影响度**：对照评分标准，选择最匹配的分数档位
4. **推荐关键指标**：
   - 从业务链路出发，识别所有相关的OKR指标（3-6个）
   - 从流程优化角度，识别所有相关的过程指标（2-5个）
   - 为每个指标评估预期影响值（具体数值或描述）
5. **给出分析理由**：列出3-5条具体的评分依据

⚠️ 重要提醒：
- 不要过于保守，应该全面评估所有可能受影响的指标
- 即使影响较小的指标也应该列出，让用户自行判断
- 影响值要具体可衡量，避免模糊描述

## 输出格式

请严格按照以下JSON格式返回，不要添加任何额外文字：

\`\`\`json
{
  "suggestedScore": 7,
  "reasoning": [
    "影响X个核心OKR指标：GMV和门店数",
    "覆盖Y%的用户或Z家门店",
    "预计提升指标A约N%",
    "解决关键业务痛点：...",
    "对比评分标准，符合X分档位特征"
  ],
  "suggestedOKRMetrics": [
    {
      "metricKey": "gmv",
      "metricName": "GMV (总交易额)",
      "estimatedImpact": "+5%",
      "category": "okr"
    },
    {
      "metricKey": "store_opening",
      "metricName": "门店开设数量",
      "estimatedImpact": "+10家/月",
      "category": "okr"
    },
    {
      "metricKey": "conversion_rate",
      "metricName": "订单转化率",
      "estimatedImpact": "+3%",
      "category": "okr"
    },
    {
      "metricKey": "dealer_satisfaction_nps",
      "metricName": "授权商满意度/NPS",
      "estimatedImpact": "+10分",
      "category": "okr"
    }
  ],
  "suggestedProcessMetrics": [
    {
      "metricKey": "order_processing_time",
      "metricName": "订单处理时长",
      "estimatedImpact": "减少50%",
      "category": "process"
    },
    {
      "metricKey": "data_accuracy",
      "metricName": "数据准确率",
      "estimatedImpact": "+15%",
      "category": "process"
    },
    {
      "metricKey": "manual_intervention_rate",
      "metricName": "人工干预率/人工处理工作量",
      "estimatedImpact": "减少60%",
      "category": "process"
    }
  ],
  "basicInfo": {
    "name": "需求名称（如果能从文档中提取）",
    "description": "需求描述（如果能从文档中提取）",
    "businessDomain": "新零售",
    "businessSubDomain": "直营",
    "storeTypes": ["新零售-直营店"],
    "regions": ["南亚"],
    "timeCriticality": "三月窗口"
  }
}
\`\`\`

**业务域和业务子域说明**：
- 业务域选项：新零售 | 渠道零售 | 国际零售通用
- 业务子域（根据业务域不同）：
  - 新零售：直营 | 授权 | 专卖 | 通用能力
  - 渠道零售：数据 | 通用能力
  - 国际零售通用：数据 | 通用能力

**重要提示**：
1. 请务必严格对照评分标准，不要主观臆断
2. 如果信息不足，建议偏向保守评分（5-6分）
3. 理由必须具体，不能含糊其辞
4. **指标推荐要全面**：
   - 必须返回3-6个OKR指标（不要只返回2-3个）
   - 必须返回2-5个过程指标（不要只返回1-2个）
   - 从多个维度思考影响：收入、规模、效率、体验、运营等
   - 宁可多推荐，让用户筛选，也不要遗漏关键指标
5. 影响值要具体可衡量（如: +5%, 减少2天, 提升10分等）
6. **businessDomain 和 businessSubDomain 必须严格使用上述枚举值**
7. 只返回JSON，不要任何额外解释`;

/**
 * 系统提示词（System Message）
 *
 * 用于设定AI的角色和行为准则
 */
export const AI_SYSTEM_MESSAGE = `你是一个专业的产品需求分析专家，擅长评估业务影响度和推荐关键指标。

你的职责：
1. 严格按照提供的评分标准进行评估
2. 提供客观、具体的分析理由
3. **全面推荐所有相关的业务指标**（OKR指标3-6个，过程指标2-5个）
4. 返回结构化的JSON数据

你的行为准则：
1. 保持客观中立，不夸大也不贬低
2. 当信息不足时，给出保守估计
3. 分析理由必须具体且可验证
4. **指标推荐要全面**：宁可多推荐让用户筛选，也不要遗漏关键指标
5. 从多个维度思考影响：收入、规模、效率、满意度、运营质量等
6. 严格遵守JSON格式要求和metricKey的准确性`;

/**
 * 格式化提示词模板
 *
 * @param documentUrl 文档链接
 * @param description 需求描述
 * @param currentName 当前需求名称
 * @returns 格式化后的提示词
 */
export function formatAIPrompt(
  documentUrl: string,
  description: string,
  currentName: string
): string {
  let prompt = AI_BUSINESS_IMPACT_ANALYSIS_PROMPT;

  // 替换文档链接部分
  const docPart = documentUrl ? `文档链接：${documentUrl}` : '';
  prompt = prompt.replace('{documentUrl}', docPart);

  // 替换需求描述部分
  const descPart = description ? `需求描述：${description}` : '';
  prompt = prompt.replace('{description}', descPart);

  // 替换需求名称
  prompt = prompt.replace('{currentName}', currentName || '未填写');

  return prompt;
}
