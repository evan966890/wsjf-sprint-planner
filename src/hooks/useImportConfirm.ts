/**
 * Import Confirm Hook
 *
 * 处理导入数据的确认和执行逻辑：
 * - AI填充导入：处理AI智能填充的需求数据
 * - 普通映射导入：根据字段映射转换Excel数据
 * - 数据验证和枚举值验证
 * - 清空/追加模式处理
 * - WSJF分数计算
 * - 状态更新和Toast提示
 *
 * @module hooks/useImportConfirm
 */

import { useStore } from '../store/useStore';
import { useToast } from './useToast';
import { calculateScores } from '../utils/scoring';
import { TECH_PROGRESS } from '../constants/techProgress';
import type { Requirement } from '../types';

/**
 * 导入确认Hook
 *
 * @returns {Object} - 导入确认函数
 */
export function useImportConfirm() {
  const { showToast } = useToast();

  /**
   * 确认导入数据
   * 支持两种导入模式：
   * 1. AI填充导入：使用AI智能填充的完整需求数据
   * 2. 普通映射导入：根据字段映射转换Excel原始数据
   */
  const handleConfirmImport = () => {
    const {
      aiFilledData: currentAIFilledData,
      setAIFilledData,
      importData,
      importMapping,
      clearBeforeImport,
      requirements,
      sprintPools,
      unscheduled,
      setRequirements,
      setSprintPools,
      setUnscheduled,
      setShowImportModal,
      setImportData,
      setImportMapping,
      setClearBeforeImport,
      setSearchTerm,
      setFilterType,
      setScoreFilter,
      setEffortFilter,
      setBVFilter,
      setBusinessDomainFilter,
      setRMSFilter,
    } = useStore.getState();

    try {
      // 如果有AI填充的数据，优先使用AI填充的结果
      if (currentAIFilledData && currentAIFilledData.length > 0) {
        // 只导入被勾选的需求
        const selectedRequirements = currentAIFilledData.filter(r => r._isSelected);

        if (selectedRequirements.length === 0) {
          showToast('请至少勾选一条需求进行导入', 'error');
          return;
        }

        // 清理AI元数据字段（以_开头的字段）
        const cleanedRequirements: Requirement[] = selectedRequirements.map(req => {
          // 调试：检查导入前的数据
          console.log('[DEBUG useImportConfirm] 清理前 affectedMetrics:', req.affectedMetrics);
          console.log('[DEBUG useImportConfirm] 清理前 businessImpactScore:', req.businessImpactScore);

          const cleaned: any = { ...req };
          // 删除所有_开头的元数据字段
          Object.keys(cleaned).forEach(key => {
            if (key.startsWith('_')) {
              delete cleaned[key];
            }
          });

          // 调试：检查清理后的数据
          console.log('[DEBUG useImportConfirm] 清理后 affectedMetrics:', cleaned.affectedMetrics);
          console.log('[DEBUG useImportConfirm] 清理后 businessImpactScore:', cleaned.businessImpactScore);

          return cleaned as Requirement;
        });

        // 计算WSJF分数（传入整个数组）
        const scoredRequirements = calculateScores(cleanedRequirements);

        // 调试：检查评分后的数据
        scoredRequirements.forEach((req, index) => {
          console.log(`[DEBUG useImportConfirm] 评分后[${index}] affectedMetrics:`, req.affectedMetrics);
          console.log(`[DEBUG useImportConfirm] 评分后[${index}] businessImpactScore:`, req.businessImpactScore);
        });

        // 根据是否清空模式导入
        if (clearBeforeImport) {
          // 清空模式：清除所有现有数据
          setRequirements(scoredRequirements);
          setUnscheduled(scoredRequirements);
          // 清空所有迭代池中的需求，但保留迭代池结构
          const clearedPools = sprintPools.map(pool => ({ ...pool, requirements: [] }));
          setSprintPools(clearedPools);

          // 重置所有筛选器，确保导入的需求可见
          setSearchTerm('');
          setFilterType('all');
          setScoreFilter('all');
          setEffortFilter('all');
          setBVFilter('all');
          setBusinessDomainFilter('all');
          setRMSFilter(false);

          showToast(`已清空并导入 ${scoredRequirements.length} 条需求！所有需求已按WSJF评分排序，分数已自动计算完成。`, 'success');
        } else {
          // 追加模式：添加到现有数据
          const updatedRequirements = [...requirements, ...scoredRequirements];
          setRequirements(updatedRequirements);

          const updatedUnscheduled = [...unscheduled, ...scoredRequirements];
          setUnscheduled(updatedUnscheduled);

          // 重置所有筛选器，确保导入的需求可见（追加模式也需要重置筛选器！）
          setSearchTerm('');
          setFilterType('all');
          setScoreFilter('all');
          setEffortFilter('all');
          setBVFilter('all');
          setBusinessDomainFilter('all');
          setRMSFilter(false);

          showToast(`成功导入 ${scoredRequirements.length} 条需求！新增需求已添加到待排期区，分数已自动计算完成。`, 'success');
        }

        // 清空导入相关状态
        setShowImportModal(false);
        setImportData([]);
        setAIFilledData([]);
        setClearBeforeImport(false);
        return;
      }

      // 原有的映射导入逻辑
      const newRequirements: Requirement[] = importData.map((row, index) => {
        // 生成唯一ID（使用时间戳+随机数+索引确保唯一性）
        const uniqueId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${index}`;
        const mapped: any = {};

        // 根据映射关系转换数据（不包括id字段，防止被覆盖）
        Object.entries(importMapping).forEach(([systemField, fileField]) => {
          // 跳过id字段，确保ID不会被Excel数据覆盖
          if (systemField === 'id') return;

          let value = row[fileField];

          // 数据类型转换
          if (systemField === 'effortDays') {
            value = Number(value) || 0;
          } else if (systemField === 'hardDeadline' || systemField === 'isRMS') {
            value = value === true || value === 'true' || value === '是' || value === '有' || value === 1;
          }

          mapped[systemField] = value;
        });

        // 设置默认值，使用生成的uniqueId
        // 智能合并工作量：扫描所有可能包含工作量的列，取最大值
        // 这样即使映射不完美，也能尽可能获取到工作量数据
        let effortDays = Number(mapped.effortDays) || 0;

        // 扫描原始行数据中所有可能的工作量列
        const effortKeywords = ['工作量', '人天', '工时', 'workday', 'effort', 'days', 'java', '预估'];
        const allColumns = Object.keys(row);

        allColumns.forEach(colName => {
          // 检查列名是否包含工作量相关关键词
          const lowerColName = colName.toLowerCase();
          const hasKeyword = effortKeywords.some(keyword =>
            lowerColName.includes(keyword.toLowerCase()) || colName.includes(keyword)
          );

          if (hasKeyword) {
            const val = row[colName];
            // 严格验证：值必须存在、不是空字符串、是有效数字、且大于0
            if (val !== null && val !== undefined && val !== '') {
              const num = Number(val);
              if (!isNaN(num) && num > 0 && num > effortDays) {
                effortDays = num;
              }
            }
          }
        });

        // 枚举值验证：确保所有枚举字段都是有效值
        // 如果映射的值不在有效枚举中，使用智能默认值或标准默认值

        // 验证并智能设置技术进展
        // AI映射时只处理常见的3种状态
        const validTechProgress = [
          TECH_PROGRESS.NOT_EVALUATED,
          TECH_PROGRESS.EFFORT_EVALUATED,
          TECH_PROGRESS.DESIGN_COMPLETED
        ];
        let finalTechProgress = validTechProgress.includes(mapped.techProgress)
          ? mapped.techProgress
          : (effortDays > 0 ? TECH_PROGRESS.EFFORT_EVALUATED : TECH_PROGRESS.NOT_EVALUATED);

        // 如果映射的是有效的"未评估"但有工作量数据，自动升级
        if (effortDays > 0 && finalTechProgress === TECH_PROGRESS.NOT_EVALUATED) {
          finalTechProgress = TECH_PROGRESS.EFFORT_EVALUATED;
        }

        // 验证业务影响度
        const validBV = ['局部', '明显', '撬动核心', '战略平台'];
        let finalBV = validBV.includes(mapped.bv) ? mapped.bv : '明显';

        // 智能转换：如果是数字，尝试映射到业务影响度等级
        if (typeof mapped.bv === 'number' || !isNaN(Number(mapped.bv))) {
          const bvNum = Number(mapped.bv);
          if (bvNum >= 9) finalBV = '战略平台';
          else if (bvNum >= 7) finalBV = '撬动核心';
          else if (bvNum >= 5) finalBV = '明显';
          else finalBV = '局部';
        }

        // 验证时间窗口
        const validTC = ['随时', '三月窗口', '一月硬窗口'];
        const finalTC = validTC.includes(mapped.tc) ? mapped.tc : '随时';

        // 验证产品进展
        const validProductProgress = ['未评估', '设计中', '开发中', '已完成'];
        const finalProductProgress = validProductProgress.includes(mapped.productProgress)
          ? mapped.productProgress
          : '未评估';

        // 验证需求类型
        const validType = ['功能开发', '技术债', 'Bug修复'];
        const finalType = validType.includes(mapped.type) ? mapped.type : '功能开发';

        // 验证提交方
        const validSubmitter = ['产品', '技术', '运营', '业务'];
        const finalSubmitter = validSubmitter.includes(mapped.submitter) ? mapped.submitter : '产品';

        return {
          id: uniqueId,
          name: mapped.name || `导入需求-${index + 1}`,
          submitterName: mapped.submitterName || '',
          productManager: mapped.productManager || '',
          developer: mapped.developer || '',
          productProgress: finalProductProgress,
          effortDays: effortDays,
          bv: finalBV,
          tc: finalTC,
          hardDeadline: mapped.hardDeadline || false,
          techProgress: finalTechProgress,
          type: finalType,
          submitDate: mapped.submitDate || new Date().toISOString().split('T')[0],
          submitter: finalSubmitter,
          isRMS: mapped.isRMS || false,
          businessDomain: '国际零售通用', // 导入的需求默认为"国际零售通用"业务域
        };
      });

      // 添加到系统（根据clearBeforeImport决定是否清空已有需求）
      // 重要：先合并所有需求，然后统一计算分数，确保分数归一化基于全局范围
      const allReqs = clearBeforeImport ? newRequirements : [...requirements, ...newRequirements];
      const updated = calculateScores(allReqs);
      setRequirements(updated);

      // 如果清空模式，同时清空所有迭代池和待排期区
      if (clearBeforeImport) {
        const clearedPools = sprintPools.map(pool => ({ ...pool, requirements: [] }));
        setSprintPools(clearedPools);

        // 重置所有筛选器，确保导入的需求可见
        setSearchTerm('');
        setFilterType('all');
        setScoreFilter('all');
        setEffortFilter('all');
        setBVFilter('all');
        setBusinessDomainFilter('all');
        setRMSFilter(false);
      }

      // 从updated中提取新导入的需求（通过ID匹配）
      // 这样确保使用的是经过统一分数计算的对象，而不是旧的对象引用
      const newReqIds = new Set(newRequirements.map(r => r.id));
      const newUnscheduledFromUpdated = updated.filter(r => newReqIds.has(r.id));

      const combined = clearBeforeImport
        ? newUnscheduledFromUpdated
        : [...unscheduled, ...newUnscheduledFromUpdated];
      const sorted = combined.sort((a, b) => (b.displayScore || 0) - (a.displayScore || 0));
      setUnscheduled(sorted);

      // 追加模式：也需要重置筛选器，确保导入的需求可见
      if (!clearBeforeImport) {
        setSearchTerm('');
        setFilterType('all');
        setScoreFilter('all');
        setEffortFilter('all');
        setBVFilter('all');
        setBusinessDomainFilter('all');
        setRMSFilter(false);
      }

      setShowImportModal(false);
      setImportData([]);
      setImportMapping({});
      setClearBeforeImport(false); // 重置清空选项

      const message = clearBeforeImport
        ? `已清空原有需求，成功导入 ${newRequirements.length} 条新需求！`
        : `成功导入 ${newRequirements.length} 条需求！`;
      showToast(message, 'success');
    } catch (error) {
      console.error('导入失败:', error);
      showToast('导入失败：' + (error instanceof Error ? error.message : '未知错误'), 'error');
    }
  };

  return {
    handleConfirmImport,
  };
}
