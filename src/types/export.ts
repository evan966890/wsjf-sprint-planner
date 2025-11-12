/**
 * WSJF导出/导入功能类型定义
 * v1.6.0新增：支持双模式导出和完整数据导入
 */

import type { Requirement, SprintPool } from './index';

/**
 * 导出模式
 * - presentation: 展示模式（人类阅读友好，格式化数据）
 * - data: 数据模式（完整备份，100%可还原）
 */
export type ExportMode = 'presentation' | 'data';

/**
 * 导出格式
 * - excel: Excel文件 (.xlsx)
 * - json: JSON文件 (.json)
 */
export type ExportFormat = 'excel' | 'json';

/**
 * 导出配置接口
 */
export interface ExportConfig {
  mode: ExportMode;                    // 导出模式
  format: ExportFormat;                // 导出格式
  includeMetadata?: boolean;           // 是否包含元数据（默认true）
  includeUnscheduled?: boolean;        // 是否包含待排期需求（默认true）
  includeSprintPools?: boolean;        // 是否包含迭代池数据（默认true）
}

/**
 * 导出元数据
 * 包含版本、时间戳、数据统计等信息
 */
export interface ExportMetadata {
  version: string;                     // 数据格式版本（如 "1.6.0"）
  exportedAt: string;                  // 导出时间戳（ISO 8601格式）
  exportMode: ExportMode;              // 导出模式
  appVersion: string;                  // 应用版本号
  dataStatistics: {
    totalRequirements: number;         // 总需求数
    scheduledRequirements: number;     // 已排期需求数
    unscheduledRequirements: number;   // 待排期需求数
    sprintPoolsCount: number;          // 迭代池数量
  };
}

/**
 * 展示模式导出数据（单Sheet）
 * 用于人类阅读和分析
 */
export interface PresentationExportData {
  '迭代池': string;
  '需求名称': string;
  '需求提交人': string;
  '提交方': string;
  '提交日期': string;
  '业务团队': string;
  '产品经理': string;
  '后端研发': string;
  '前端研发': string;
  '测试': string;
  '项目名称': string;
  '产品领域': string;
  '需求类型': string;
  '工作量(天)': number;
  '业务影响度': number | string;
  '影响指标': string;
  '影响范围': string;
  '技术复杂度': number | string;
  '迫切程度': string;
  '强制DDL': string;
  'DDL日期': string;
  '权重分': number;
  '星级': string;
  '产品进度': string;
  '技术进度': string;
  '业务域': string;
  '业务子域': string;
  'RMS': string;
  '依赖需求数': number;
  '产研备注': string;
}

/**
 * 数据模式导出数据（完整备份）
 * 保留所有字段，支持100%还原
 */
export interface DataExportPayload {
  metadata: ExportMetadata;            // 元数据
  requirements: Requirement[];         // 所有需求（包含完整字段）
  sprintPools: SprintPool[];           // 所有迭代池
  unscheduledIds: string[];            // 待排期需求ID列表
}

/**
 * 导入验证结果
 */
export interface ImportValidationResult {
  isValid: boolean;                    // 是否通过验证
  errors: ValidationError[];           // 错误列表
  warnings: ValidationWarning[];       // 警告列表
  metadata?: ExportMetadata;           // 解析到的元数据
  preview?: ImportPreview;             // 导入预览数据
  cleanupStats?: CleanupStats;         // 数据清理统计
}

/**
 * 数据清理统计
 */
export interface CleanupStats {
  cleanedFromPools: number;            // 从迭代池清理的无效引用数
  cleanedFromUnscheduled: number;      // 从待排期列表清理的无效引用数
}

/**
 * 验证错误
 */
export interface ValidationError {
  code: string;                        // 错误代码
  message: string;                     // 错误消息
  severity: 'critical' | 'error' | 'warning';  // 严重程度（新增 warning）
  field?: string;                      // 相关字段
  details?: string;                    // 详细信息
  autoFixed?: boolean;                 // 是否已自动修复
}

/**
 * 验证警告
 */
export interface ValidationWarning {
  code: string;                        // 警告代码
  message: string;                     // 警告消息
  suggestion?: string;                 // 建议操作
}

/**
 * 导入预览数据
 */
export interface ImportPreview {
  totalRequirements: number;           // 总需求数
  scheduledRequirements: number;       // 已排期需求数
  unscheduledRequirements: number;     // 待排期需求数
  sprintPoolsCount: number;            // 迭代池数量
  requirementsSample: Requirement[];   // 需求示例（前5条）
  sprintPoolsSample: SprintPool[];     // 迭代池示例（前3个）
}

/**
 * 导入选项
 */
export interface ImportOptions {
  mergeMode: 'replace' | 'append';     // 合并模式：替换 | 追加
  validateOnly?: boolean;              // 仅验证不导入
  autoFixErrors?: boolean;             // 自动修复可修复的错误
  createBackup?: boolean;              // 导入前创建备份（默认true）
}

/**
 * 导入结果
 */
export interface ImportResult {
  success: boolean;                    // 是否成功
  importedRequirements: number;        // 已导入需求数
  importedSprintPools: number;         // 已导入迭代池数
  skippedRequirements: number;         // 跳过的需求数
  errors: ValidationError[];           // 错误列表
  backupFilePath?: string;             // 备份文件路径
}
