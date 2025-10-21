/**
 * 需求表单状态管理 Hook
 *
 * 功能：
 * - 管理所有表单字段状态
 * - 表单验证
 * - 实时预览计算
 * - 日期格式验证
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { Requirement, BusinessImpactScore, ComplexityScore, AffectedMetric, Document } from '../../../types';
import { getStoreTypesByDomain, getRoleConfigsByDomain } from '../../../config/businessFields';

export function useRequirementForm(initialRequirement: Requirement | null) {
  // 辅助函数：验证日期格式是否为 YYYY-MM-DD
  const isValidDateFormat = (dateStr: string | undefined): boolean => {
    if (!dateStr) return false;
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    return dateRegex.test(dateStr);
  };

  // 初始化表单状态
  const [form, setForm] = useState<Requirement>(() => {
    if (initialRequirement) {
      // 编辑现有需求：保留所有原始字段，但修复日期格式错误
      const fixedSubmitDate = isValidDateFormat(initialRequirement.submitDate)
        ? initialRequirement.submitDate
        : new Date().toISOString().split('T')[0];

      const fixedDeadlineDate = initialRequirement.deadlineDate && isValidDateFormat(initialRequirement.deadlineDate)
        ? initialRequirement.deadlineDate
        : undefined;

      return {
        ...initialRequirement,
        submitDate: fixedSubmitDate,
        deadlineDate: fixedDeadlineDate
      };
    }

    // 新建需求：使用默认值
    return {
      id: `REQ-${Date.now()}`,
      name: '',
      description: '',
      submitterName: '',
      productManager: '',
      developer: '',
      submitDate: new Date().toISOString().split('T')[0],
      submitter: '业务',
      type: '功能开发',
      businessDomain: '国际零售通用',
      businessTeam: '',
      businessImpactScore: 5 as BusinessImpactScore,
      affectedMetrics: [] as AffectedMetric[],
      impactScope: {
        storeTypes: [],
        regions: [],
        keyRoles: [],
        storeCountRange: undefined
      },
      timeCriticality: '随时' as '随时' | '三月窗口' | '一月硬窗口',
      hardDeadline: false,
      deadlineDate: undefined,
      documents: [] as Document[],
      productProgress: '待评估',
      techProgress: '待评估',
      effortDays: 0,
      complexityScore: 5 as ComplexityScore,
      isRMS: false,
      bv: '明显',
      tc: '随时'
    };
  });

  // 根据业务域更新可选项
  const availableStoreTypes = useMemo(() =>
    getStoreTypesByDomain(form.businessDomain),
    [form.businessDomain]
  );

  const availableRoleConfigs = useMemo(() =>
    getRoleConfigsByDomain(form.businessDomain),
    [form.businessDomain]
  );

  // 仅获取总部角色（用于基础信息区域的业务团队选择）
  const hqRolesOnly = useMemo(() => {
    const roles = availableRoleConfigs
      .filter(config => config.category.startsWith('hq-'))
      .flatMap(config => config.roles);
    return Array.from(new Set(roles)); // 去重
  }, [availableRoleConfigs]);

  // 当业务域变化时，清理不合法的选项
  useEffect(() => {
    const validStoreTypes = (form.impactScope?.storeTypes || []).filter(
      type => availableStoreTypes.includes(type)
    );

    const availableRoles = availableRoleConfigs.flatMap(c => c.roles);
    const validKeyRoles = (form.impactScope?.keyRoles || []).filter(
      kr => availableRoles.includes(kr.roleName)
    );

    if (validStoreTypes.length !== (form.impactScope?.storeTypes || []).length ||
        validKeyRoles.length !== (form.impactScope?.keyRoles || []).length) {
      setForm(prev => ({
        ...prev,
        impactScope: {
          storeTypes: validStoreTypes,
          regions: prev.impactScope?.regions || [],
          keyRoles: validKeyRoles,
          storeCountRange: prev.impactScope?.storeCountRange
        }
      }));
    }
  }, [form.businessDomain, availableStoreTypes, availableRoleConfigs]);

  /**
   * 更新单个字段
   */
  const updateField = useCallback(<K extends keyof Requirement>(
    field: K,
    value: Requirement[K]
  ) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  /**
   * 批量更新字段
   */
  const updateFields = useCallback((updates: Partial<Requirement>) => {
    setForm(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * 更新整个表单
   */
  const setFormData = useCallback((newForm: Requirement) => {
    setForm(newForm);
  }, []);

  /**
   * 重置表单
   */
  const resetForm = useCallback(() => {
    if (initialRequirement) {
      setForm(initialRequirement);
    }
  }, [initialRequirement]);

  /**
   * 表单验证
   */
  const validate = useCallback((): string | null => {
    if (!form.name?.trim()) {
      return '需求名称不能为空';
    }
    if (form.effortDays < 0) {
      return '工作量不能为负数';
    }
    return null;
  }, [form]);

  /**
   * 实时预览分数计算
   */
  const previewScore = useMemo(() => {
    const BV_MAP: Record<string, number> = { '局部': 3, '明显': 6, '撬动核心': 8, '战略平台': 10 };
    const TC_MAP: Record<string, number> = { '随时': 0, '三月窗口': 3, '一月硬窗口': 5 };

    const getWL = (d: number) => {
      const validDays = Math.max(0, Number(d) || 0);
      if (validDays <= 2) return 8;
      if (validDays <= 5) return 7;
      if (validDays <= 14) return 5;
      if (validDays <= 30) return 3;
      if (validDays <= 50) return 2;
      if (validDays <= 100) return 1;
      return 0;
    };

    const raw = (BV_MAP[form.bv || '明显'] || 3) + (TC_MAP[form.tc || '随时'] || 0) + (form.hardDeadline ? 5 : 0) + getWL(form.effortDays);
    const display = Math.round(10 + 90 * (raw - 3) / (28 - 3));

    return { raw, display };
  }, [form.bv, form.tc, form.hardDeadline, form.effortDays]);

  /**
   * 是否可以编辑工作量
   */
  const canEditEffort = form.techProgress === '已评估工作量' || form.techProgress === '已完成技术方案';

  return {
    form,
    updateField,
    updateFields,
    setFormData,
    resetForm,
    validate,
    previewScore,
    canEditEffort,
    availableStoreTypes,
    availableRoleConfigs,
    hqRolesOnly,
  };
}
