/**
 * 需求筛选和排序 Hook
 *
 * 功能：
 * - 搜索过滤
 * - 多维度筛选（类型、分数、工作量、BV、业务域、RMS）
 * - 排序（权重分、业务影响度、提交日期、工作量）
 * - 分组（已评估 vs 未评估）
 */

import { useMemo } from 'react';
import type { Requirement } from '../../../types';
import { NOT_READY_STATUSES } from '../../../constants/techProgress';

interface FilterOptions {
  searchTerm: string;
  filterType: string;
  scoreFilter: string;
  effortFilter: string;
  bvFilter: string;
  businessDomainFilter: string;
  rmsFilter: boolean;
  sortBy: 'score' | 'bv' | 'submitDate' | 'effort';
  sortOrder: 'asc' | 'desc';
}

export function useRequirementFilter(
  requirements: Requirement[],
  filters: FilterOptions
) {
  /**
   * 筛选逻辑
   */
  const filteredReqs = useMemo(() => {
    return (Array.isArray(requirements) ? requirements : []).filter(req => {
      // 搜索匹配：需求名称、提交人、产品经理、研发负责人
      const matchesSearch = (req?.name || '').toLowerCase().includes((filters.searchTerm || '').toLowerCase()) ||
                           (req?.submitterName || '').toLowerCase().includes((filters.searchTerm || '').toLowerCase()) ||
                           (req?.productManager || '').toLowerCase().includes((filters.searchTerm || '').toLowerCase()) ||
                           (req?.developer || '').toLowerCase().includes((filters.searchTerm || '').toLowerCase());

      // 类型匹配
      const reqType = req?.type?.trim() || '功能开发';
      const matchesType = filters.filterType === 'all' || reqType === filters.filterType;

      // 权重分匹配
      let matchesScore = true;
      const displayScore = Number(req?.displayScore) || 0;
      if (filters.scoreFilter === 'high') matchesScore = displayScore >= 70;
      else if (filters.scoreFilter === 'medium') matchesScore = displayScore >= 40 && displayScore < 70;
      else if (filters.scoreFilter === 'low') matchesScore = displayScore < 40;

      // 工作量匹配
      let matchesEffort = true;
      const effortDays = Number(req?.effortDays) || 0;
      if (filters.effortFilter === 'tiny') matchesEffort = effortDays <= 3;
      else if (filters.effortFilter === 'small') matchesEffort = effortDays >= 4 && effortDays <= 10;
      else if (filters.effortFilter === 'medium') matchesEffort = effortDays >= 11 && effortDays <= 30;
      else if (filters.effortFilter === 'large') matchesEffort = effortDays >= 31 && effortDays <= 60;
      else if (filters.effortFilter === 'xlarge') matchesEffort = effortDays >= 61 && effortDays <= 100;
      else if (filters.effortFilter === 'huge') matchesEffort = effortDays > 100;

      // 业务影响度匹配
      let matchesBV = true;
      if (filters.bvFilter !== 'all') {
        const score = req?.businessImpactScore;
        if (score) {
          if (filters.bvFilter === '战略平台') matchesBV = score === 10;
          else if (filters.bvFilter === '撬动核心') matchesBV = score >= 8 && score <= 9;
          else if (filters.bvFilter === '明显') matchesBV = score >= 5 && score <= 7;
          else if (filters.bvFilter === '局部') matchesBV = score >= 1 && score <= 4;
        } else {
          matchesBV = req?.bv === filters.bvFilter;
        }
      }

      // 业务域匹配
      let matchesBusinessDomain = true;
      if (filters.businessDomainFilter !== 'all') {
        const reqDomain = req?.businessDomain || '';
        const reqCustomDomain = req?.customBusinessDomain || '';

        if (filters.businessDomainFilter === '国际零售通用') {
          matchesBusinessDomain = reqDomain === '新零售' ||
                                  reqDomain === '渠道零售' ||
                                  reqDomain === '国际零售通用' ||
                                  (!reqDomain && !reqCustomDomain);
        } else if (['新零售', '渠道零售'].includes(filters.businessDomainFilter)) {
          matchesBusinessDomain = reqDomain === filters.businessDomainFilter;
        } else {
          matchesBusinessDomain = (reqDomain === '自定义' && reqCustomDomain === filters.businessDomainFilter) ||
                                  (reqDomain === filters.businessDomainFilter);
        }
      }

      // RMS筛选
      const matchesRMS = !filters.rmsFilter || req?.isRMS === true;

      return matchesSearch && matchesType && matchesScore && matchesEffort &&
             matchesBV && matchesBusinessDomain && matchesRMS;
    });
  }, [requirements, filters]);

  /**
   * 排序逻辑
   */
  const sortedReqs = useMemo(() => {
    return [...filteredReqs].sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case 'score':
          comparison = (Number(b.displayScore) || 0) - (Number(a.displayScore) || 0);
          break;
        case 'bv':
          const bvOrder = { '战略平台': 4, '撬动核心': 3, '明显': 2, '局部': 1 };
          comparison = (bvOrder[b.bv as keyof typeof bvOrder] || 0) - (bvOrder[a.bv as keyof typeof bvOrder] || 0);
          break;
        case 'submitDate':
          comparison = new Date(b.submitDate || 0).getTime() - new Date(a.submitDate || 0).getTime();
          break;
        case 'effort':
          comparison = (Number(b.effortDays) || 0) - (Number(a.effortDays) || 0);
          break;
      }

      return filters.sortOrder === 'asc' ? -comparison : comparison;
    });
  }, [filteredReqs, filters.sortBy, filters.sortOrder]);

  /**
   * 分组逻辑（已评估 vs 未评估）
   */
  const { readyReqs, notReadyReqs } = useMemo(() => {
    const ready = sortedReqs.filter(r =>
      r.techProgress && !(NOT_READY_STATUSES as readonly string[]).includes(r.techProgress)
    );
    const notReady = sortedReqs.filter(r =>
      !r.techProgress || (NOT_READY_STATUSES as readonly string[]).includes(r.techProgress)
    );

    // 验证分组完整性（开发环境）
    if (import.meta.env.DEV) {
      const total = sortedReqs.length;
      const grouped = ready.length + notReady.length;
      if (total !== grouped) {
        console.error(
          `[UnscheduledArea] 分组逻辑有遗漏！总数:${total}, 已评估:${ready.length}, 未评估:${notReady.length}, 分组:${grouped}`
        );
      }
    }

    return { readyReqs: ready, notReadyReqs: notReady };
  }, [sortedReqs]);

  return {
    filteredReqs,
    sortedReqs,
    readyReqs,
    notReadyReqs,
  };
}
