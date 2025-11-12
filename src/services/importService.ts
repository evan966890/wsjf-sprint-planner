/**
 * 导入服务
 * v1.6.0新增：从JSON或Excel文件导入完整数据
 */

import * as XLSX from 'xlsx';
import type {
  DataExportPayload,
  ImportOptions,
  ImportResult,
  ValidationError,
} from '../types/export';
import type { Requirement, SprintPool, AffectedMetric, ImpactScope } from '../types';
import { validateImportData } from './validationService';

/**
 * 从文件读取并解析数据
 */
export async function readImportFile(file: File): Promise<DataExportPayload> {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();

  if (fileExtension === 'json') {
    return readJSONFile(file);
  } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
    return readExcelFile(file);
  } else {
    throw new Error(`不支持的文件格式: ${fileExtension}`);
  }
}

/**
 * 读取JSON文件
 */
async function readJSONFile(file: File): Promise<DataExportPayload> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);
        resolve(data);
      } catch (error) {
        reject(new Error('JSON解析失败: ' + (error as Error).message));
      }
    };

    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file);
  });
}

/**
 * 读取Excel文件（多Sheet数据模式）
 */
async function readExcelFile(file: File): Promise<DataExportPayload> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        // 检查是否包含必需的Sheet
        const requiredSheets = ['元数据', '需求数据', '迭代池配置', '待排期列表'];
        const missingSheets = requiredSheets.filter(
          sheet => !workbook.SheetNames.includes(sheet)
        );

        if (missingSheets.length > 0) {
          reject(new Error(`缺少必需的Sheet: ${missingSheets.join(', ')}`));
          return;
        }

        // 解析元数据
        const metadataSheet = workbook.Sheets['元数据'];
        const metadataRows = XLSX.utils.sheet_to_json<{ 字段: string; 值: any }>(metadataSheet);
        const metadata = {
          version: metadataRows.find(r => r.字段 === '数据版本')?.值 || '1.0.0',
          exportedAt: metadataRows.find(r => r.字段 === '导出时间')?.值 || '',
          exportMode: 'data' as const,
          appVersion: metadataRows.find(r => r.字段 === '应用版本')?.值 || '1.0.0',
          dataStatistics: {
            totalRequirements: Number(metadataRows.find(r => r.字段 === '总需求数')?.值 || 0),
            scheduledRequirements: Number(metadataRows.find(r => r.字段 === '已排期需求')?.值 || 0),
            unscheduledRequirements: Number(metadataRows.find(r => r.字段 === '待排期需求')?.值 || 0),
            sprintPoolsCount: Number(metadataRows.find(r => r.字段 === '迭代池数量')?.值 || 0),
          },
        };

        // 解析需求数据（反序列化复杂字段）
        const requirementsSheet = workbook.Sheets['需求数据'];
        const requirementsRows = XLSX.utils.sheet_to_json<any>(requirementsSheet);
        const requirements: Requirement[] = requirementsRows.map(row => {
          const req: any = {
            ...row,
            // 反序列化复杂字段
            affectedMetrics: safeJSONParse<AffectedMetric[]>(row.affectedMetrics, []),
            impactScope: safeJSONParse<ImpactScope>(row.impactScope, {} as ImpactScope),
            documents: safeJSONParse(row.documents, []),
            dependencies: safeJSONParse<string[]>(row.dependencies, []),
          };

          // 数据类型自动修复：数字字段
          if (typeof req.effortDays === 'string') {
            req.effortDays = Number(req.effortDays) || 0;
          }
          if (typeof req.businessImpactScore === 'string') {
            const parsed = Number(req.businessImpactScore);
            req.businessImpactScore = (parsed >= 1 && parsed <= 10) ? parsed : undefined;
          }
          if (typeof req.complexityScore === 'string') {
            const parsed = Number(req.complexityScore);
            req.complexityScore = (parsed >= 1 && parsed <= 10) ? parsed : undefined;
          }

          // 数据类型自动修复：布尔字段
          if (typeof req.hardDeadline === 'string') {
            req.hardDeadline = req.hardDeadline === '是' || req.hardDeadline === 'true' || req.hardDeadline === 'TRUE';
          }
          if (typeof req.isRMS === 'string') {
            req.isRMS = req.isRMS === '是' || req.isRMS === 'true' || req.isRMS === 'TRUE';
          }

          return req as Requirement;
        });

        // 解析迭代池配置
        const poolsSheet = workbook.Sheets['迭代池配置'];
        const poolsRows = XLSX.utils.sheet_to_json<any>(poolsSheet);

        // 先创建需求ID映射
        const reqMap = new Map<string, Requirement>();
        requirements.forEach(req => reqMap.set(req.id, req));

        const sprintPools: SprintPool[] = poolsRows.map(row => {
          const requirementIds = safeJSONParse<string[]>(row.requirementIds, []);
          return {
            id: row.id,
            name: row.name,
            startDate: row.startDate,
            endDate: row.endDate,
            totalDays: row.totalDays,
            bugReserve: row.bugReserve,
            refactorReserve: row.refactorReserve,
            otherReserve: row.otherReserve,
            requirements: requirementIds
              .map(id => reqMap.get(id))
              .filter((req): req is Requirement => req !== undefined),
          };
        });

        // 解析待排期需求ID（自动过滤无效引用）
        const unscheduledSheet = workbook.Sheets['待排期列表'];
        const unscheduledRows = XLSX.utils.sheet_to_json<{ 需求ID: string }>(unscheduledSheet);
        const unscheduledIds = unscheduledRows
          .map(row => row.需求ID)
          .filter(id => reqMap.has(id));  // 自动清理无效引用

        const payload: DataExportPayload = {
          metadata,
          requirements,
          sprintPools,
          unscheduledIds,
        };

        resolve(payload);
      } catch (error) {
        reject(new Error('Excel解析失败: ' + (error as Error).message));
      }
    };

    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsBinaryString(file);
  });
}

/**
 * 安全的JSON解析（增强版）
 * 支持：字符串、对象、数组类型
 * 容错：空值、格式错误、Excel自动解析
 */
function safeJSONParse<T>(value: any, defaultValue: T): T {
  // 1. 如果是 null/undefined，返回默认值
  if (value === null || value === undefined) {
    return defaultValue;
  }

  // 2. 如果已经是对象/数组，直接返回（xlsx 库可能自动解析）
  if (typeof value === 'object') {
    return value as T;
  }

  // 3. 如果是字符串，清理后尝试解析
  if (typeof value === 'string') {
    const trimmed = value.trim();

    // 空字符串或空引号返回默认值
    if (!trimmed || trimmed === '""' || trimmed === "''") {
      return defaultValue;
    }

    try {
      return JSON.parse(trimmed) as T;
    } catch (error) {
      console.warn(`[Import] JSON parse failed for value:`, trimmed, error);
      return defaultValue;
    }
  }

  // 4. 其他类型，返回默认值
  return defaultValue;
}

/**
 * 执行导入
 */
export function importData(
  payload: DataExportPayload,
  options: ImportOptions
): ImportResult {
  const errors: ValidationError[] = [];

  // 1. 验证数据
  const validationResult = validateImportData(payload);
  if (!validationResult.isValid) {
    return {
      success: false,
      importedRequirements: 0,
      importedSprintPools: 0,
      skippedRequirements: 0,
      errors: validationResult.errors,
    };
  }

  // 2. 仅验证模式
  if (options.validateOnly) {
    return {
      success: true,
      importedRequirements: 0,
      importedSprintPools: 0,
      skippedRequirements: 0,
      errors: [],
    };
  }

  // 3. 创建备份（如果需要）
  let backupFilePath: string | undefined;
  if (options.createBackup !== false) {
    try {
      backupFilePath = createBackup();
    } catch (error) {
      errors.push({
        code: 'BACKUP_FAILED',
        message: '备份创建失败',
        severity: 'error',
        details: (error as Error).message,
      });
    }
  }

  // 4. 执行导入（返回导入结果）
  // 注意：这里返回的是占位数据，实际导入逻辑需要在Hook中调用状态管理
  return {
    success: true,
    importedRequirements: payload.requirements.length,
    importedSprintPools: payload.sprintPools.length,
    skippedRequirements: 0,
    errors,
    backupFilePath,
  };
}

/**
 * 创建本地备份（保存到localStorage）
 */
function createBackup(): string {
  const timestamp = new Date().toISOString();
  const backupKey = `wsjf_backup_${timestamp}`;

  // 从localStorage读取当前数据
  const currentData = localStorage.getItem('wsjf_data');
  if (currentData) {
    localStorage.setItem(backupKey, currentData);
  }

  return backupKey;
}
