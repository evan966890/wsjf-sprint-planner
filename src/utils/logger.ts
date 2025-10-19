/**
 * 日志工具
 * 仅在开发环境输出日志，生产环境静默
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
  /**
   * 普通日志
   */
  log: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * 警告日志
   */
  warn: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  /**
   * 错误日志（生产环境也输出）
   */
  error: (...args: unknown[]): void => {
    console.error(...args);
  },

  /**
   * 调试日志
   */
  debug: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.debug(...args);
    }
  }
};
