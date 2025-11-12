/**
 * 验证服务单元测试
 */

import { describe, it, expect } from 'vitest';
import { validateImportData } from '../validationService';
import type { DataExportPayload } from '../../types/export';
import type { Requirement, SprintPool } from '../../types';

// Mock数据
const mockRequirement: Requirement = {
  id: 'req-1',
  name: '测试需求',
  submitterName: '张三',
  submitDate: '2025-01-01',
  submitter: '业务',
  type: '功能需求',
  effortDays: 5,
  productManager: 'PM1',
  developer: 'Dev1',
  productProgress: '需求评审中',
  techProgress: '已评估工作量',
  hardDeadline: false,
  isRMS: false,
  businessDomain: '新零售',
};

const mockSprintPool: SprintPool = {
  id: 'pool-1',
  name: '迭代1',
  startDate: '2025-01-15',
  endDate: '2025-01-28',
  totalDays: 100,
  bugReserve: 20,
  refactorReserve: 10,
  otherReserve: 10,
  requirements: [mockRequirement],
};

const validPayload: DataExportPayload = {
  metadata: {
    version: '1.6.0',
    exportedAt: new Date().toISOString(),
    exportMode: 'data',
    appVersion: '1.6.0',
    dataStatistics: {
      totalRequirements: 1,
      scheduledRequirements: 1,
      unscheduledRequirements: 0,
      sprintPoolsCount: 1,
    },
  },
  requirements: [mockRequirement],
  sprintPools: [mockSprintPool],
  unscheduledIds: [],
};

describe('validationService', () => {
  describe('validateImportData', () => {
    it('应该接受有效的数据', () => {
      const result = validateImportData(validPayload);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('应该拒绝null数据', () => {
      const result = validateImportData(null);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('INVALID_FORMAT');
    });

    it('应该拒绝缺少元数据的数据', () => {
      const invalidPayload = { ...validPayload, metadata: undefined };
      const result = validateImportData(invalidPayload);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('MISSING_METADATA');
    });

    it('应该拒绝不兼容的版本', () => {
      const invalidPayload = {
        ...validPayload,
        metadata: { ...validPayload.metadata, version: '0.1.0' },
      };
      const result = validateImportData(invalidPayload);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'VERSION_INCOMPATIBLE')).toBe(true);
    });

    it('应该拒绝缺少需求数据的数据', () => {
      const invalidPayload = { ...validPayload, requirements: undefined };
      const result = validateImportData(invalidPayload);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_REQUIREMENTS')).toBe(true);
    });

    it('应该检测需求引用完整性', () => {
      const invalidPool: SprintPool = {
        ...mockSprintPool,
        requirements: [{ ...mockRequirement, id: 'non-existent' }],
      };
      const invalidPayload = {
        ...validPayload,
        sprintPools: [invalidPool],
      };

      const result = validateImportData(invalidPayload);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_REQUIREMENT_REF')).toBe(true);
    });

    it('应该生成预览数据', () => {
      const result = validateImportData(validPayload);

      expect(result.preview).toBeDefined();
      expect(result.preview?.totalRequirements).toBe(1);
      expect(result.preview?.sprintPoolsCount).toBe(1);
    });

    it('应该对旧版本生成警告', () => {
      const oldPayload = {
        ...validPayload,
        metadata: { ...validPayload.metadata, version: '1.2.0' },
      };

      const result = validateImportData(oldPayload);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0].code).toBe('OLD_VERSION');
    });
  });
});
