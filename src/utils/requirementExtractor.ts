/**
 * 需求信息提取工具
 * 从OCR识别的文本中提取结构化的需求信息
 */

// import type { Requirement, BusinessImpactScore, ComplexityScore } from '../types';

/**
 * 提取结果接口
 */
export interface ExtractedRequirement {
  name?: string;
  description?: string;
  businessTeam?: string;
  effortDays?: number;
  deadlineDate?: string;
  businessDomain?: string;
  businessSubDomain?: string;
  type?: string;
  confidence: number; // 提取置信度 0-1
  extractedFields: string[]; // 成功提取的字段名
}

/**
 * 从OCR文本中提取需求信息
 * 使用规则匹配和模式识别
 *
 * @param text - OCR识别的文本
 * @returns 提取的需求信息
 */
export function extractRequirementFromText(text: string): ExtractedRequirement {
  const result: ExtractedRequirement = {
    confidence: 0,
    extractedFields: []
  };

  if (!text || text.trim().length === 0) {
    return result;
  }

  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  let confidenceScore = 0;
  let fieldsExtracted = 0;

  // 1. 提取需求名称/标题
  const titleResult = extractTitle(lines);
  if (titleResult) {
    result.name = titleResult;
    result.extractedFields.push('name');
    fieldsExtracted++;
  }

  // 2. 提取需求描述
  const descResult = extractDescription(lines, text);
  if (descResult) {
    result.description = descResult;
    result.extractedFields.push('description');
    fieldsExtracted++;
  }

  // 3. 提取业务团队
  const teamResult = extractBusinessTeam(text);
  if (teamResult) {
    result.businessTeam = teamResult;
    result.extractedFields.push('businessTeam');
    fieldsExtracted++;
  }

  // 4. 提取工作量
  const effortResult = extractEffortDays(text);
  if (effortResult !== null) {
    result.effortDays = effortResult;
    result.extractedFields.push('effortDays');
    fieldsExtracted++;
  }

  // 5. 提取截止日期
  const deadlineResult = extractDeadline(text);
  if (deadlineResult) {
    result.deadlineDate = deadlineResult;
    result.extractedFields.push('deadlineDate');
    fieldsExtracted++;
  }

  // 6. 提取业务域
  const domainResult = extractBusinessDomain(text);
  if (domainResult.domain) {
    result.businessDomain = domainResult.domain;
    result.extractedFields.push('businessDomain');
    fieldsExtracted++;

    if (domainResult.subDomain) {
      result.businessSubDomain = domainResult.subDomain;
      result.extractedFields.push('businessSubDomain');
      fieldsExtracted++;
    }
  }

  // 7. 提取需求类型
  const typeResult = extractRequirementType(text);
  if (typeResult) {
    result.type = typeResult;
    result.extractedFields.push('type');
    fieldsExtracted++;
  }

  // 计算置信度：基于提取到的字段数量和质量
  const maxFields = 8; // 最多可提取8个字段
  confidenceScore = fieldsExtracted / maxFields;

  // 如果提取到核心字段（名称或描述），增加置信度
  if (result.name && result.description) {
    confidenceScore = Math.min(1, confidenceScore + 0.2);
  }

  result.confidence = Math.round(confidenceScore * 100) / 100;

  return result;
}

/**
 * 提取需求标题
 */
function extractTitle(lines: string[]): string | null {
  // 策略1: 查找明确的标题标记
  const titlePatterns = [
    /(?:需求名称|标题|title|需求主题|需求|subject)[:：\s]*(.+)/i,
    /^(.{10,80})$/  // 第一行如果长度适中，可能是标题
  ];

  for (const pattern of titlePatterns) {
    for (const line of lines) {
      const match = line.match(pattern);
      if (match && match[1]) {
        const title = match[1].trim();
        if (title.length >= 5 && title.length <= 100) {
          return title;
        }
      }
    }
  }

  // 策略2: 如果第一行是合理长度且不包含明显的描述性词汇，可能是标题
  if (lines.length > 0) {
    const firstLine = lines[0];
    if (firstLine.length >= 5 && firstLine.length <= 100 &&
        !firstLine.includes('描述') && !firstLine.includes('说明')) {
      return firstLine;
    }
  }

  return null;
}

/**
 * 提取需求描述
 */
function extractDescription(lines: string[], fullText: string): string | null {
  // 策略1: 查找明确的描述标记
  const descPatterns = [
    /(?:需求描述|描述|description|详细说明|背景|需求内容)[:：\s]*(.+)/is,
  ];

  for (const pattern of descPatterns) {
    const match = fullText.match(pattern);
    if (match && match[1]) {
      const desc = match[1].trim();
      if (desc.length >= 10) {
        return desc.substring(0, 500); // 限制长度
      }
    }
  }

  // 策略2: 如果有多行文本，合并为描述（跳过第一行标题）
  if (lines.length > 2) {
    const descLines = lines.slice(1, Math.min(lines.length, 10));
    const combined = descLines.join(' ');
    if (combined.length >= 10) {
      return combined.substring(0, 500);
    }
  }

  return null;
}

/**
 * 提取业务团队
 */
function extractBusinessTeam(text: string): string | null {
  const teamPatterns = [
    /(?:业务团队|团队|提交团队|所属团队)[:：\s]*(.+?)(?:\n|$|。|，)/i,
    /(?:开店|供应链|物流|客服|营销|销售|运营|技术|产品)团队/i
  ];

  for (const pattern of teamPatterns) {
    const match = text.match(pattern);
    if (match) {
      const team = match[1] ? match[1].trim() : match[0];
      if (team.length >= 2 && team.length <= 30) {
        return team;
      }
    }
  }

  return null;
}

/**
 * 提取工作量（人天）
 */
function extractEffortDays(text: string): number | null {
  const effortPatterns = [
    /(?:工作量|预估工作量|工期|开发周期)[:：\s]*(\d+(?:\.\d+)?)\s*(?:人天|天|人\/天|pd)/i,
    /(\d+(?:\.\d+)?)\s*人天/i,
    /(\d+(?:\.\d+)?)\s*天/i
  ];

  for (const pattern of effortPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const days = parseFloat(match[1]);
      if (days > 0 && days <= 500) { // 合理范围
        return days;
      }
    }
  }

  return null;
}

/**
 * 提取截止日期
 */
function extractDeadline(text: string): string | null {
  const datePatterns = [
    /(?:截止日期|deadline|交付日期|上线日期)[:：\s]*(\d{4}[-\/年]\d{1,2}[-\/月]\d{1,2}[日]?)/i,
    /(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})(?:\s|$)/,
    /(\d{4}年\d{1,2}月\d{1,2}日)/
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      let dateStr = match[1];
      // 标准化日期格式为 YYYY-MM-DD
      dateStr = dateStr.replace(/[年月]/g, '-').replace(/[日]/g, '').replace(/\//g, '-');

      // 验证日期有效性
      if (isValidDate(dateStr)) {
        return dateStr;
      }
    }
  }

  return null;
}

/**
 * 提取业务域
 */
function extractBusinessDomain(text: string): { domain: string | null; subDomain: string | null } {
  const result = { domain: null as string | null, subDomain: null as string | null };

  // 业务域关键词
  const domainKeywords = {
    '新零售': ['新零售', '直营', '授权店', '小米之家'],
    '渠道零售': ['渠道', '经销商', '分销'],
    '国际零售通用': ['国际', '海外', '全球', '南亚', '东南亚', '欧洲', '拉美']
  };

  for (const [domain, keywords] of Object.entries(domainKeywords)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        result.domain = domain;
        break;
      }
    }
    if (result.domain) break;
  }

  // 子域提取（如果找到了主域）
  if (result.domain === '新零售') {
    if (text.includes('开店') || text.includes('选址')) {
      result.subDomain = '开店扩展';
    } else if (text.includes('门店运营') || text.includes('店铺管理')) {
      result.subDomain = '门店运营';
    } else if (text.includes('供应链')) {
      result.subDomain = '供应链';
    }
  }

  return result;
}

/**
 * 提取需求类型
 */
function extractRequirementType(text: string): string | null {
  const typeKeywords = {
    '功能开发': ['新功能', '功能开发', '功能需求', '新增'],
    '技术债': ['重构', '优化', '技术债', '性能优化'],
    'Bug修复': ['bug', 'Bug', 'BUG', '修复', '缺陷'],
    '体验优化': ['体验', '交互优化', 'UI优化', '易用性']
  };

  for (const [type, keywords] of Object.entries(typeKeywords)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return type;
      }
    }
  }

  return '功能开发'; // 默认类型
}

/**
 * 验证日期格式
 */
function isValidDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * 使用AI增强提取（可选功能）
 * 需要配置AI API才能使用
 *
 * @param text - OCR识别的文本
 * @param apiKey - AI API密钥
 * @param modelType - AI模型类型
 * @returns 提取的需求信息
 */
export async function extractRequirementWithAI(
  text: string,
  _apiKey?: string,
  _modelType: 'openai' | 'deepseek' = 'deepseek'
): Promise<ExtractedRequirement> {
  // 首先使用规则提取
  const ruleBasedResult = extractRequirementFromText(text);

  // 如果规则提取的置信度已经很高，直接返回
  if (ruleBasedResult.confidence >= 0.8) {
    return ruleBasedResult;
  }

  // TODO: 实现AI增强提取
  // 调用AI API来提取更复杂的需求信息
  // 这里可以集成现有的AI分析功能

  return ruleBasedResult;
}
