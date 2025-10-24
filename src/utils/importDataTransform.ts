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

  // 根据映射关系转换数据（不包括id字段，防止被覆盖）
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

  // 智能合并工作量：扫描所有可能包含工作量的列，取最大值
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

  // 如果映射的是有效的"未评估"但有工作量数据，自动升级
  if (effortDays > 0 && finalTechProgress === TECH_PROGRESS.NOT_EVALUATED) {
    finalTechProgress = TECH_PROGRESS.EFFORT_EVALUATED;
  }

  // 验证业务影响度
  const validBV = ['局部', '明显', '撬动核心', '战略平台'];
  let finalBV = validBV.includes(mapped.bv) ? mapped.bv : '明显';

  // 智能转换：如果是数字，尝试映射到业务影响度等级
  if (typeof mapped.bv === 'number' || !isNaN(Number(mapped.bv))) {
    const bvNum = Number(mapped.bv);
    if (bvNum >= 9) finalBV = '战略平台';
    else if (bvNum >= 7) finalBV = '撬动核心';
    else if (bvNum >= 5) finalBV = '明显';
    else finalBV = '局部';
  }

  // 验证时间窗口
  const validTC = ['随时', '三月窗口', '一月硬窗口'];
  const finalTC = validTC.includes(mapped.tc) ? mapped.tc : '随时';

  // 验证产品进展
  const validProductProgress = ['未评估', '设计中', '开发中', '已完成'];
  const finalProductProgress = validProductProgress.includes(mapped.productProgress)
    ? mapped.productProgress
    : '未评估';

  // 验证需求类型
  const validType = ['功能开发', '技术债', 'Bug修复'];
  const finalType = validType.includes(mapped.type) ? mapped.type : '功能开发';

  // 验证提交方
  const validSubmitter = ['产品', '技术', '运营', '业务'];
  const finalSubmitter = validSubmitter.includes(mapped.submitter) ? mapped.submitter : '产品';

  return {
    id: uniqueId,
    name: mapped.name || `导入需求-${index + 1}`,
    submitterName: mapped.submitterName || '',
    productManager: mapped.productManager || '',
    developer: mapped.developer || '',
    productProgress: finalProductProgress,
    effortDays: effortDays,
    bv: finalBV,
    tc: finalTC,
    hardDeadline: mapped.hardDeadline || false,
    techProgress: finalTechProgress,
    type: finalType,
    submitDate: mapped.submitDate || new Date().toISOString().split('T')[0],
    submitter: finalSubmitter,
    isRMS: mapped.isRMS || false,
    businessDomain: '国际零售通用', // 导入的需求默认为"国际零售通用"业务域
  };
}

/**
 * 扫描所有列找最大工作量
 * 这样即使映射不完美，也能尽可能获取到工作量数据
 */
function findMaxEffort(row: any, defaultEffort: number): number {
  let maxEffort = Number(defaultEffort) || 0;
  const effortKeywords = ['工作量', '人天', '工时', 'workday', 'effort', 'days', 'java', '预估'];

  Object.keys(row).forEach(colName => {
    const lowerColName = colName.toLowerCase();
    const hasKeyword = effortKeywords.some(keyword =>
      lowerColName.includes(keyword.toLowerCase()) || colName.includes(keyword)
    );

    if (hasKeyword) {
      const val = row[colName];
      // 严格验证：值必须存在、不是空字符串、是有效数字、且大于0
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
