/**
 * 导出服务单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as XLSX from 'xlsx';
import { exportData, exportPresentationMode, exportDataMode } from '../exportService';
import type { ExportConfig } from '../../types/export';
import type { Requirement, SprintPool } from '../../types';

// Mock XLSX
vi.mock('xlsx', () => ({
  utils: {
    json_to_sheet: vi.fn(() => ({})),
    book_new: vi.fn(() => ({ SheetNames: [] })),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}));

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

describe('exportService', () => {
  describe('exportPresentationMode', () => {
    beforeEach(() => {
      // 清理所有mock调用记录
      vi.clearAllMocks();
    });

    it('应该生成单Sheet Excel', () => {
      const config: ExportConfig = {
        mode: 'presentation',
        format: 'excel',
      };

      exportPresentationMode([mockSprintPool], [], config);

      expect(XLSX.utils.json_to_sheet).toHaveBeenCalled();
      expect(XLSX.utils.book_new).toHaveBeenCalled();
      expect(XLSX.writeFile).toHaveBeenCalled();
    });

    it('应该包含未排期需求', () => {
      const config: ExportConfig = {
        mode: 'presentation',
        format: 'excel',
        includeUnscheduled: true,
      };

      const unscheduled = [{ ...mockRequirement, id: 'req-2' }];

      exportPresentationMode([mockSprintPool], unscheduled, config);

      const callArgs = (XLSX.utils.json_to_sheet as any).mock.calls[0][0];
      expect(callArgs.length).toBe(2); // 1个已排期 + 1个未排期
    });
  });

  describe('exportDataMode', () => {
    beforeEach(() => {
      // 清理所有mock调用记录
      vi.clearAllMocks();
    });

    it('应该生成JSON文件', () => {
      const config: ExportConfig = {
        mode: 'data',
        format: 'json',
      };

      // Mock URL.createObjectURL
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = vi.fn();

      // Mock document.createElement
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      document.createElement = vi.fn(() => mockLink as any);

      exportDataMode([mockSprintPool], [], config);

      expect(mockLink.click).toHaveBeenCalled();
      expect(mockLink.download).toContain('.json');
    });

    it('应该生成Excel多Sheet文件', () => {
      const config: ExportConfig = {
        mode: 'data',
        format: 'excel',
      };

      exportDataMode([mockSprintPool], [], config);

      // 应该调用4次book_append_sheet（元数据、需求数据、迭代池配置、待排期列表）
      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledTimes(4);
    });
  });

  describe('exportData (统一入口)', () => {
    it('展示模式应该调用exportPresentationMode', () => {
      const config: ExportConfig = {
        mode: 'presentation',
        format: 'excel',
      };

      exportData([mockSprintPool], [], config);

      expect(XLSX.writeFile).toHaveBeenCalled();
    });

    it('数据模式应该调用exportDataMode', () => {
      const config: ExportConfig = {
        mode: 'data',
        format: 'json',
      };

      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      const mockLink = { click: vi.fn(), href: '', download: '' };
      document.createElement = vi.fn(() => mockLink as any);

      exportData([mockSprintPool], [], config);

      expect(mockLink.click).toHaveBeenCalled();
    });
  });
});
