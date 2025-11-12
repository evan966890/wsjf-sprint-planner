/**
 * 导入验证服务
 * v1.6.0新增：验证导入数据的完整性和合法性
 */

import type {
  DataExportPayload,
  ImportValidationResult,
  ValidationError,
  ValidationWarning,
  ImportPreview,
} from '../types/export';
import type { Requirement, SprintPool } from '../types';

/**
 * 验证导入数据
 */
export function validateImportData(data: unknown): ImportValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // 1. 基础结构验证
  if (!data || typeof data !== 'object') {
    errors.push({
      code: 'INVALID_FORMAT',
      message: '无效的数据格式',
      severity: 'critical',
      details: '数据必须是JSON对象',
    });
    return { isValid: false, errors, warnings };
  }

  const payload = data as Partial<DataExportPayload>;

  // 2. 元数据验证
  if (!payload.metadata) {
    errors.push({
      code: 'MISSING_METADATA',
      message: '缺少元数据',
      severity: 'critical',
      details: '导入文件必须包含metadata字段',
    });
    return { isValid: false, errors, warnings };
  }

  // 3. 版本兼容性检查
  const versionResult = validateVersion(payload.metadata.version);
  if (!versionResult.isCompatible) {
    errors.push({
      code: 'VERSION_INCOMPATIBLE',
      message: `版本不兼容: ${payload.metadata.version}`,
      severity: 'critical',
      details: versionResult.reason,
    });
  }

  // 4. 必需字段验证
  if (!payload.requirements || !Array.isArray(payload.requirements)) {
    errors.push({
      code: 'MISSING_REQUIREMENTS',
      message: '缺少需求数据',
      severity: 'error',
      field: 'requirements',
    });
  }

  if (!payload.sprintPools || !Array.isArray(payload.sprintPools)) {
    errors.push({
      code: 'MISSING_SPRINT_POOLS',
      message: '缺少迭代池数据',
      severity: 'error',
      field: 'sprintPools',
    });
  }

  // 5. 数据完整性验证（容错模式）
  let cleanupStats = { cleanedFromPools: 0, cleanedFromUnscheduled: 0 };
  if (payload.requirements && payload.sprintPools) {
    const integrityResult = validateDataIntegrity(
      payload.requirements,
      payload.sprintPools,
      payload.unscheduledIds || []
    );
    errors.push(...integrityResult.errors);
    warnings.push(...integrityResult.warnings);
    cleanupStats = integrityResult.cleanupStats;
  }

  // 6. 需求字段验证（抽样检查前5条）
  if (payload.requirements && payload.requirements.length > 0) {
    const sampleRequirements = payload.requirements.slice(0, 5);
    sampleRequirements.forEach((req, idx) => {
      const reqErrors = validateRequirement(req, idx);
      errors.push(...reqErrors);
    });
  }

  // 7. 生成预览数据
  const preview = generatePreview(payload);

  // 8. 添加警告信息
  if (payload.metadata.version !== '1.6.0') {
    warnings.push({
      code: 'OLD_VERSION',
      message: `导入文件版本较旧: ${payload.metadata.version}`,
      suggestion: '建议导入后重新导出以更新数据格式',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    metadata: payload.metadata,
    preview,
    cleanupStats,  // 添加清理统计
  };
}

/**
 * 验证版本兼容性
 */
function validateVersion(version: string): { isCompatible: boolean; reason?: string } {
  const supportedVersions = ['1.6.0', '1.5.0', '1.4.0', '1.3.0', '1.2.0'];

  if (supportedVersions.includes(version)) {
    return { isCompatible: true };
  }

  return {
    isCompatible: false,
    reason: `不支持的版本: ${version}。支持的版本: ${supportedVersions.join(', ')}`,
  };
}

/**
 * 验证数据完整性（增强版：容错模式）
 * 将引用完整性问题降级为警告，允许自动清理
 */
function validateDataIntegrity(
  requirements: Requirement[],
  sprintPools: SprintPool[],
  unscheduledIds: string[]
): { errors: ValidationError[]; warnings: ValidationWarning[]; cleanupStats: { cleanedFromPools: number; cleanedFromUnscheduled: number } } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // 创建需求ID集合
  const reqIdSet = new Set(requirements.map(r => r.id));

  // 统计清理信息
  let cleanedFromPools = 0;
  let cleanedFromUnscheduled = 0;

  // 检查迭代池引用（降级为警告）
  sprintPools.forEach((pool) => {
    const invalidRefs: string[] = [];
    pool.requirements.forEach((req) => {
      if (!reqIdSet.has(req.id)) {
        invalidRefs.push(req.id);
        cleanedFromPools++;
      }
    });

    if (invalidRefs.length > 0) {
      warnings.push({
        code: 'AUTO_CLEANED_POOL_REFS',
        message: `迭代池 "${pool.name}" 中有 ${invalidRefs.length} 个无效引用已自动清理`,
        suggestion: `已清理的需求ID: ${invalidRefs.slice(0, 3).join(', ')}${invalidRefs.length > 3 ? ` 等${invalidRefs.length}个` : ''}`,
      });
    }
  });

  // 检查待排期引用（降级为警告）
  const invalidUnscheduledIds = unscheduledIds.filter(id => !reqIdSet.has(id));
  if (invalidUnscheduledIds.length > 0) {
    cleanedFromUnscheduled = invalidUnscheduledIds.length;
    warnings.push({
      code: 'AUTO_CLEANED_UNSCHEDULED_REFS',
      message: `待排期列表中有 ${invalidUnscheduledIds.length} 个无效引用已自动清理`,
      suggestion: `系统将自动过滤这些无效ID，不影响导入`,
    });
  }

  return { errors, warnings, cleanupStats: { cleanedFromPools, cleanedFromUnscheduled } };
}

/**
 * 验证单个需求（增强版）
 */
function validateRequirement(req: any, index: number): ValidationError[] {
  const errors: ValidationError[] = [];

  // 必需字段检查
  if (!req.id) {
    errors.push({
      code: 'MISSING_FIELD',
      message: `需求[${index + 1}] 缺少必需字段: id`,
      severity: 'error',
      field: `requirements[${index}].id`,
      details: '请确保每个需求都有唯一的ID',
    });
  }

  if (!req.name) {
    errors.push({
      code: 'MISSING_FIELD',
      message: `需求[${index + 1}] 缺少必需字段: name`,
      severity: 'error',
      field: `requirements[${index}].name`,
      details: '请确保每个需求都有名称',
    });
  }

  // 数据类型验证（非严格，只检查明显错误）
  if (req.effortDays !== undefined && typeof req.effortDays !== 'number' && typeof req.effortDays !== 'string') {
    errors.push({
      code: 'INVALID_TYPE',
      message: `需求[${index + 1}] "${req.name || 'Unknown'}" 工作量字段格式错误`,
      severity: 'error',
      field: `requirements[${index}].effortDays`,
      details: `期望数字类型，实际为: ${typeof req.effortDays}`,
    });
  }

  return errors;
}

/**
 * 生成导入预览
 */
function generatePreview(payload: Partial<DataExportPayload>): ImportPreview {
  const requirements = payload.requirements || [];
  const sprintPools = payload.sprintPools || [];
  const unscheduledIds = payload.unscheduledIds || [];

  const scheduledCount = sprintPools.reduce(
    (sum, pool) => sum + (pool.requirements?.length || 0),
    0
  );

  return {
    totalRequirements: requirements.length,
    scheduledRequirements: scheduledCount,
    unscheduledRequirements: unscheduledIds.length,
    sprintPoolsCount: sprintPools.length,
    requirementsSample: requirements.slice(0, 5),
    sprintPoolsSample: sprintPools.slice(0, 3),
  };
}
