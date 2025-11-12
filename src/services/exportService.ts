/**
 * 导出服务
 * v1.6.0新增：支持双模式导出（展示模式 + 数据模式）
 */

import * as XLSX from 'xlsx';
import type {
  ExportConfig,
  ExportMetadata,
  PresentationExportData,
  DataExportPayload,
} from '../types/export';
import type { Requirement, SprintPool, AffectedMetric, ImpactScope } from '../types';

// 当前数据格式版本
const DATA_FORMAT_VERSION = '1.6.0';

// 应用版本（从package.json读取，这里硬编码）
const APP_VERSION = '1.6.0';

/**
 * 生成导出元数据
 */
function generateMetadata(
  requirements: Requirement[],
  sprintPools: SprintPool[],
  unscheduledIds: string[],
  mode: 'presentation' | 'data'
): ExportMetadata {
  const scheduledCount = sprintPools.reduce((sum, pool) => sum + pool.requirements.length, 0);

  return {
    version: DATA_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    exportMode: mode,
    appVersion: APP_VERSION,
    dataStatistics: {
      totalRequirements: requirements.length,
      scheduledRequirements: scheduledCount,
      unscheduledRequirements: unscheduledIds.length,
      sprintPoolsCount: sprintPools.length,
    },
  };
}

/**
 * 格式化影响指标为字符串
 */
function formatAffectedMetrics(metrics?: AffectedMetric[]): string {
  if (!metrics || metrics.length === 0) return '';

  return metrics
    .map(m => `${m.displayName}(${m.estimatedImpact})`)
    .join('; ');
}

/**
 * 格式化影响范围为字符串
 */
function formatImpactScope(scope?: ImpactScope): string {
  if (!scope) return '';

  const parts: string[] = [];

  if (scope.storeTypes?.length > 0) {
    parts.push(`门店类型: ${scope.storeTypes.join(', ')}`);
  }

  if (scope.regions?.length > 0) {
    parts.push(`区域: ${scope.regions.join(', ')}`);
  }

  if (scope.storeCountRange) {
    parts.push(`门店数: ${scope.storeCountRange}`);
  }

  if (scope.keyRoles?.length > 0) {
    const roles = scope.keyRoles.map(r => r.roleName).join(', ');
    parts.push(`角色: ${roles}`);
  }

  return parts.join(' | ');
}

/**
 * 转换需求为展示模式数据
 */
function convertToPresentationData(
  req: Requirement,
  sprintPoolName: string
): PresentationExportData {
  return {
    '迭代池': sprintPoolName,
    '需求名称': req.name,
    '需求提交人': req.submitterName || '',
    '提交方': req.submitter || '',
    '提交日期': req.submitDate || '',
    '业务团队': req.businessTeam || '',
    '产品经理': req.productManager || '',
    '后端研发': req.backendDeveloper || '',
    '前端研发': req.frontendDeveloper || '',
    '测试': req.tester || '',
    '项目名称': req.project || '',
    '产品领域': req.productArea || '',
    '需求类型': req.type || '',
    '工作量(天)': req.effortDays || 0,
    '业务影响度': req.businessImpactScore || req.bv || '',
    '影响指标': formatAffectedMetrics(req.affectedMetrics),
    '影响范围': formatImpactScope(req.impactScope),
    '技术复杂度': req.complexityScore || '-',
    '迫切程度': req.timeCriticality || req.tc || '',
    '强制DDL': req.hardDeadline ? '是' : '否',
    'DDL日期': req.deadlineDate || '',
    '权重分': req.displayScore || 0,
    '星级': '★'.repeat(req.stars || 0),
    '产品进度': req.productProgress || '',
    '技术进度': req.techProgress || '',
    '业务域': req.businessDomain || '',
    '业务子域': req.businessSubDomain || '',
    'RMS': req.isRMS ? '是' : '否',
    '依赖需求数': req.dependencies?.length || 0,
    '产研备注': req.rdNotes || '',
  };
}

/**
 * 展示模式导出（单Sheet Excel）
 */
export function exportPresentationMode(
  sprintPools: SprintPool[],
  unscheduled: Requirement[],
  config: ExportConfig
): void {
  const exportData: PresentationExportData[] = [];

  // 导出迭代池中的需求
  sprintPools.forEach(pool => {
    pool.requirements.forEach(req => {
      exportData.push(convertToPresentationData(req, pool.name));
    });
  });

  // 导出待排期需求
  if (config.includeUnscheduled !== false) {
    unscheduled.forEach(req => {
      exportData.push(convertToPresentationData(req, '未排期'));
    });
  }

  // 创建工作簿
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'WSJF排期');

  // 自动列宽
  const maxWidth = 50;
  const colsWidth = exportData.reduce((acc: any[], row) => {
    Object.keys(row).forEach((key, idx) => {
      const value = String(row[key as keyof PresentationExportData]);
      const width = Math.min(Math.max(value.length, key.length) + 2, maxWidth);
      if (!acc[idx] || acc[idx].wch < width) {
        acc[idx] = { wch: width };
      }
    });
    return acc;
  }, []);
  worksheet['!cols'] = colsWidth;

  // 下载文件
  const fileName = `WSJF排期_展示模式_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

/**
 * 数据模式导出（多Sheet Excel 或 JSON）
 */
export function exportDataMode(
  sprintPools: SprintPool[],
  unscheduled: Requirement[],
  config: ExportConfig
): void {
  // 收集所有需求
  const allRequirements: Requirement[] = [];
  sprintPools.forEach(pool => {
    allRequirements.push(...pool.requirements);
  });
  allRequirements.push(...unscheduled);

  // 生成元数据
  const metadata = generateMetadata(
    allRequirements,
    sprintPools,
    unscheduled.map(r => r.id),
    'data'
  );

  // 构建完整数据载荷
  const payload: DataExportPayload = {
    metadata,
    requirements: allRequirements,
    sprintPools,
    unscheduledIds: unscheduled.map(r => r.id),
  };

  if (config.format === 'json') {
    // JSON导出
    exportAsJSON(payload);
  } else {
    // Excel多Sheet导出
    exportAsExcelMultiSheet(payload);
  }
}

/**
 * 导出为JSON文件
 */
function exportAsJSON(payload: DataExportPayload): void {
  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `WSJF排期_数据备份_${new Date().toISOString().split('T')[0]}.json`;
  link.click();

  URL.revokeObjectURL(url);
}

/**
 * 导出为Excel多Sheet文件
 */
function exportAsExcelMultiSheet(payload: DataExportPayload): void {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: 元数据
  const metadataSheet = XLSX.utils.json_to_sheet([
    { 字段: '数据版本', 值: payload.metadata.version },
    { 字段: '导出时间', 值: payload.metadata.exportedAt },
    { 字段: '导出模式', 值: payload.metadata.exportMode },
    { 字段: '应用版本', 值: payload.metadata.appVersion },
    { 字段: '总需求数', 值: payload.metadata.dataStatistics.totalRequirements },
    { 字段: '已排期需求', 值: payload.metadata.dataStatistics.scheduledRequirements },
    { 字段: '待排期需求', 值: payload.metadata.dataStatistics.unscheduledRequirements },
    { 字段: '迭代池数量', 值: payload.metadata.dataStatistics.sprintPoolsCount },
  ]);
  XLSX.utils.book_append_sheet(workbook, metadataSheet, '元数据');

  // Sheet 2: 需求数据（完整字段，序列化复杂对象）
  const requirementsData = payload.requirements.map(req => ({
    ...req,
    affectedMetrics: JSON.stringify(req.affectedMetrics || []),
    impactScope: JSON.stringify(req.impactScope || {}),
    documents: JSON.stringify(req.documents || []),
    dependencies: JSON.stringify(req.dependencies || []),
  }));
  const requirementsSheet = XLSX.utils.json_to_sheet(requirementsData);
  XLSX.utils.book_append_sheet(workbook, requirementsSheet, '需求数据');

  // Sheet 3: 迭代池配置
  const poolsData = payload.sprintPools.map(pool => ({
    id: pool.id,
    name: pool.name,
    startDate: pool.startDate,
    endDate: pool.endDate,
    totalDays: pool.totalDays,
    bugReserve: pool.bugReserve,
    refactorReserve: pool.refactorReserve,
    otherReserve: pool.otherReserve,
    requirementIds: JSON.stringify(pool.requirements.map(r => r.id)),
  }));
  const poolsSheet = XLSX.utils.json_to_sheet(poolsData);
  XLSX.utils.book_append_sheet(workbook, poolsSheet, '迭代池配置');

  // Sheet 4: 待排期需求ID
  const unscheduledSheet = XLSX.utils.json_to_sheet(
    payload.unscheduledIds.map(id => ({ 需求ID: id }))
  );
  XLSX.utils.book_append_sheet(workbook, unscheduledSheet, '待排期列表');

  // 下载文件
  const fileName = `WSJF排期_完整备份_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

/**
 * 统一导出入口
 */
export function exportData(
  sprintPools: SprintPool[],
  unscheduled: Requirement[],
  config: ExportConfig
): void {
  if (config.mode === 'presentation') {
    exportPresentationMode(sprintPools, unscheduled, config);
  } else {
    exportDataMode(sprintPools, unscheduled, config);
  }
}
