/**
 * WSJF Sprint Planner - 常量模块入口
 *
 * 统一导出所有常量，便于模块化管理
 *
 * @version 1.0.0
 * @date 2025-01-19
 */

// 导出 UI 文案常量
export * from './ui-text';

// 导出评分规则常量
export * from './scoring-rules';

// 默认导出（便于按需导入）
export { UI_TEXT } from './ui-text';
export {
  BUSINESS_IMPACT_LEVELS,
  COMPLEXITY_LEVELS,
  TIME_CRITICALITY_MAP,
  EFFORT_BONUS_RULES,
  STAR_RATING_RULES,
  WSJF_CALCULATION_EXPLANATION,
} from './scoring-rules';
