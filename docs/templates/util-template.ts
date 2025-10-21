/**
 * [工具函数名称]
 *
 * 功能说明：
 * - [功能1描述]
 * - [功能2描述]
 *
 * 使用示例：
 * ```typescript
 * import { utilFunction1, utilFunction2 } from './utils/myUtils';
 *
 * const result = utilFunction1(param1, param2);
 * ```
 *
 * @version 1.0.0
 * @author [Your Name]
 */

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 函数选项
 */
export interface FunctionOptions {
  option1?: string;
  option2?: number;
}

/**
 * 函数返回值
 */
export interface FunctionResult {
  success: boolean;
  data?: any;
  error?: string;
}

// ============================================================================
// 常量定义
// ============================================================================

/**
 * 默认配置
 */
const DEFAULT_OPTIONS: FunctionOptions = {
  option1: 'default',
  option2: 0,
};

// ============================================================================
// 主要功能函数
// ============================================================================

/**
 * 工具函数1
 *
 * @param param1 参数1说明
 * @param param2 参数2说明
 * @param options 可选配置
 * @returns 返回值说明
 *
 * @example
 * ```typescript
 * const result = utilFunction1('hello', 42);
 * console.log(result); // { success: true, data: ... }
 * ```
 */
export function utilFunction1(
  param1: string,
  param2: number,
  options: FunctionOptions = DEFAULT_OPTIONS
): FunctionResult {
  try {
    // 参数验证
    if (!param1) {
      return { success: false, error: 'param1 is required' };
    }

    // 主要逻辑
    const result = processData(param1, param2, options);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 工具函数2
 *
 * @param input 输入数据
 * @returns 处理后的数据
 */
export function utilFunction2(input: any[]): any[] {
  return input.filter(item => item !== null && item !== undefined);
}

// ============================================================================
// 辅助函数（内部使用）
// ============================================================================

/**
 * 处理数据（内部函数）
 */
function processData(
  param1: string,
  param2: number,
  options: FunctionOptions
): any {
  // 实现
  return {
    param1,
    param2,
    ...options,
  };
}

/**
 * 验证输入（内部函数）
 */
function validateInput(input: any): boolean {
  return input !== null && input !== undefined;
}
