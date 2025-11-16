/**
 * WSJF Sprint Planner - Zustand Global State Management
 *
 * 全局状态管理 Store
 * 使用 Zustand 替代 React useState，提供更好的状态管理和性能
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Requirement, SprintPool, User, AIModelType, ScoringStandard, MetricDefinition, AIFilledRequirement } from '../types';
import { calculateScores } from '../utils/scoring';
import { SCORING_STANDARDS } from '../config/scoringStandards';
import { OKR_METRICS, PROCESS_METRICS } from '../config/metrics';
import { migrateAllRequirements, needsMigration } from '../utils/migration';
import { logger } from '../utils/logger';
import { needsEvaluation } from '../constants/techProgress';
import { useToastStore } from './useToastStore';

/**
 * Excel导入数据行类型
 * 表示从Excel导入的原始数据
 */
export type ImportDataRow = Record<string, string | number | boolean | null>;

/**
 * Store State Interface
 * 定义全局状态的完整类型
 */
interface StoreState {
  // ========== 用户状态 ==========
  currentUser: User | null;
  showLogin: boolean;

  // ========== 核心数据状态 ==========
  requirements: Requirement[];
  sprintPools: SprintPool[];
  unscheduled: Requirement[];

  // ========== v1.2.0: 配置数据 ==========
  scoringStandards: ScoringStandard[];  // 10分制评分标准配置
  okrMetrics: MetricDefinition[];       // 核心OKR指标定义
  processMetrics: MetricDefinition[];   // 过程指标定义

  // ========== UI控制状态 ==========
  compact: boolean;
  showHandbook: boolean;
  showExportMenu: boolean;
  showImportModal: boolean;
  showFeishuImportModal: boolean;  // 飞书导入Modal显示状态
  importData: ImportDataRow[];
  importMapping: Record<string, string>;
  isAIMappingLoading: boolean;
  clearBeforeImport: boolean;
  selectedAIModel: AIModelType;
  importModalScrollTop: number;  // 导入Modal的滚动位置（用于恢复滚动状态）
  isRestoringImportModalScroll: boolean;  // 是否正在恢复导入Modal滚动位置（防止保存中间状态）

  // ========== AI智能填充状态 ==========
  isAIFillingLoading: boolean;                      // AI填充进度中
  aiFillingProgress: number;                        // 进度百分比 0-100
  aiFillingCurrentIndex: number;                    // 当前分析到第几条
  aiFillingCurrentName: string;                     // 当前分析的需求名称
  aiFilledData: AIFilledRequirement[];              // AI填充后的数据
  selectedRequirementIndex: number | null;          // 侧边栏选中的需求索引
  aiFillingCancelled: boolean;                      // AI填充是否被用户取消
  aiAnalysisLogs: string[];                         // AI分析过程日志

  // ========== 编辑状态 ==========
  editingReq: Requirement | null;
  editingSprint: SprintPool | null;
  isNewReq: boolean;

  // ========== 拖拽状态 ==========
  dragOverPool: string | null;

  // ========== 筛选状态 ==========
  searchTerm: string;
  filterType: string;
  scoreFilter: string;
  effortFilter: string;
  bvFilter: string;
  businessDomainFilter: string;
  businessSubDomainFilter: string;
  rmsFilter: boolean;

  // ========== 布局状态 ==========
  leftPanelWidth: number;
  poolWidths: Record<string, number>;

  // ========== Actions ==========

  // 用户相关
  setCurrentUser: (user: User | null) => void;
  setShowLogin: (show: boolean) => void;
  logout: () => void;

  // 核心数据操作
  setRequirements: (reqs: Requirement[]) => void;
  setSprintPools: (pools: SprintPool[]) => void;
  setUnscheduled: (reqs: Requirement[]) => void;
  addRequirement: (req: Requirement) => void;
  addRequirements: (reqs: Requirement[]) => void;  // 批量添加需求
  updateRequirement: (req: Requirement) => void;
  deleteRequirement: (reqId: string) => void;
  recalculateScores: (allReqs: Requirement[]) => void;
  clearAllRequirements: () => void;

  // v1.2.0: 配置数据操作
  updateScoringStandard: (score: number, updates: Partial<ScoringStandard>) => void;
  updateMetricDefinition: (key: string, updates: Partial<MetricDefinition>) => void;

  // 需求移动（拖拽逻辑）
  moveRequirement: (reqId: string, sourcePoolId: string, targetPoolId: string) => void;

  // 迭代池操作
  addSprintPool: (pool: SprintPool) => void;
  updateSprintPool: (pool: SprintPool) => void;
  deleteSprintPool: (poolId: string) => void;

  // UI控制
  toggleCompact: () => void;
  setShowHandbook: (show: boolean) => void;
  setShowExportMenu: (show: boolean) => void;
  setShowImportModal: (show: boolean) => void;
  setShowFeishuImportModal: (show: boolean) => void;
  setImportData: (data: ImportDataRow[]) => void;
  setImportMapping: (mapping: Record<string, string>) => void;
  setImportModalScrollTop: (scrollTop: number) => void;
  setIsRestoringImportModalScroll: (restoring: boolean) => void;
  setIsAIMappingLoading: (loading: boolean) => void;
  setClearBeforeImport: (clear: boolean) => void;
  setSelectedAIModel: (model: AIModelType) => void;

  // AI智能填充
  setIsAIFillingLoading: (loading: boolean) => void;
  setAIFillingProgress: (progress: number) => void;
  setAIFillingCurrentIndex: (index: number) => void;
  setAIFillingCurrentName: (name: string) => void;
  setAIFilledData: (data: AIFilledRequirement[]) => void;
  setSelectedRequirementIndex: (index: number | null) => void;
  setAIFillingCancelled: (cancelled: boolean) => void;
  addAIAnalysisLog: (log: string) => void;
  clearAIAnalysisLogs: () => void;

  // 编辑状态
  setEditingReq: (req: Requirement | null) => void;
  setEditingSprint: (sprint: SprintPool | null) => void;
  setIsNewReq: (isNew: boolean) => void;

  // 拖拽状态
  setDragOverPool: (poolId: string | null) => void;

  // 筛选状态
  setSearchTerm: (term: string) => void;
  setFilterType: (type: string) => void;
  setScoreFilter: (filter: string) => void;
  setEffortFilter: (filter: string) => void;
  setBVFilter: (filter: string) => void;
  setBusinessDomainFilter: (filter: string) => void;
  setBusinessSubDomainFilter: (filter: string) => void;
  setRMSFilter: (filter: boolean) => void;

  // 布局状态
  setLeftPanelWidth: (width: number) => void;
  setPoolWidths: (widths: Record<string, number>) => void;
  setPoolWidth: (poolId: string, width: number) => void;
}

/**
 * 创建 Zustand Store
 *
 * 中间件说明：
 * - devtools: 启用 Redux DevTools 支持，便于调试
 * - persist: 持久化部分状态到 localStorage
 */
export const useStore = create<StoreState>()(
  devtools(
    persist(
      (set, get) => ({
        // ========== 初始状态 ==========

        // 用户状态
        currentUser: null,
        showLogin: false,

        // 核心数据状态
        requirements: [],
        sprintPools: [],
        unscheduled: [],

        // v1.2.0: 配置数据
        scoringStandards: SCORING_STANDARDS,
        okrMetrics: OKR_METRICS,
        processMetrics: PROCESS_METRICS,

        // UI控制状态
        compact: false,
        showHandbook: false,
        showExportMenu: false,
        showImportModal: false,
        showFeishuImportModal: false,
        importData: [],
        importMapping: {},
        isAIMappingLoading: false,
        clearBeforeImport: false,
        selectedAIModel: 'deepseek',
        importModalScrollTop: 0,
        isRestoringImportModalScroll: false,

        // AI智能填充状态
        isAIFillingLoading: false,
        aiFillingProgress: 0,
        aiFillingCurrentIndex: 0,
        aiFillingCurrentName: '',
        aiFilledData: [],
        selectedRequirementIndex: null,
        aiFillingCancelled: false,
        aiAnalysisLogs: [],

        // 编辑状态
        editingReq: null,
        editingSprint: null,
        isNewReq: false,

        // 拖拽状态
        dragOverPool: null,

        // 筛选状态
        searchTerm: '',
        filterType: 'all',
        scoreFilter: 'all',
        effortFilter: 'all',
        bvFilter: 'all',
        businessDomainFilter: 'all',
        businessSubDomainFilter: 'all',
        rmsFilter: false,

        // 布局状态
        leftPanelWidth: 320,
        poolWidths: {},

        // ========== Actions 实现 ==========

        // 用户相关
        setCurrentUser: (user) => set({ currentUser: user }),
        setShowLogin: (show) => set({ showLogin: show }),
        logout: () => set({
          currentUser: null,
          showLogin: true,
          requirements: [],
          sprintPools: [],
          unscheduled: []
        }),

        // 核心数据操作
        setRequirements: (reqs) => set({ requirements: reqs }),

        setSprintPools: (pools) => set({ sprintPools: pools }),

        setUnscheduled: (reqs) => set({ unscheduled: reqs }),

        addRequirement: (req) => {
          const { requirements } = get();
          const newReqs = [...requirements, req];
          const updated = calculateScores(newReqs);

          // 将新需求添加到待排期区
          const newReq = updated.find(r => r.id === req.id);
          if (newReq) {
            const unscheduled = get().unscheduled;
            const newUnscheduled = [...unscheduled, newReq];
            set({
              requirements: updated,
              unscheduled: newUnscheduled.sort((a, b) => (b.displayScore || 0) - (a.displayScore || 0))
            });
          } else {
            // 容错处理：即使calculateScores后找不到需求，也要添加到列表
            // 这通常不应该发生，但确保数据一致性
            console.warn('[Store] addRequirement: 未在calculateScores结果中找到新需求，使用原始需求对象', req.id);
            const unscheduled = get().unscheduled;
            // 手动添加必要的分数字段
            const reqWithScores = {
              ...req,
              rawScore: req.rawScore || 10,
              displayScore: req.displayScore || 50,
              stars: req.stars || 3
            };
            const newUnscheduled = [...unscheduled, reqWithScores];
            set({
              requirements: updated,
              unscheduled: newUnscheduled.sort((a, b) => (b.displayScore || 0) - (a.displayScore || 0))
            });
          }
        },

        // 批量添加需求（用于导入）
        addRequirements: (reqs) => {
          const { requirements } = get();
          const newReqs = [...requirements, ...reqs];
          const updated = calculateScores(newReqs);

          // 将新需求添加到待排期区
          const addedReqIds = new Set(reqs.map(r => r.id));
          const newAddedReqs = updated.filter(r => addedReqIds.has(r.id));

          const unscheduled = get().unscheduled;
          const newUnscheduled = [...unscheduled, ...newAddedReqs];

          set({
            requirements: updated,
            unscheduled: newUnscheduled.sort((a, b) => (b.displayScore || 0) - (a.displayScore || 0))
          });

          console.log(`[Store] 批量添加 ${reqs.length} 条需求到待排期区`);
        },

        updateRequirement: (req) => {
          const { requirements } = get();
          const newReqs = requirements.map(r => r.id === req.id ? req : r);
          get().recalculateScores(newReqs);
        },

        deleteRequirement: (reqId) => {
          const { requirements, unscheduled, sprintPools } = get();
          set({
            requirements: requirements.filter(r => r.id !== reqId),
            unscheduled: unscheduled.filter(r => r.id !== reqId),
            sprintPools: sprintPools.map(pool => ({
              ...pool,
              requirements: pool.requirements.filter(r => r.id !== reqId)
            }))
          });
        },

        recalculateScores: (allReqs) => {
          const updated = calculateScores(allReqs);
          const { unscheduled, sprintPools } = get();

          const unscheduledIds = new Set(unscheduled.map(r => r.id));
          const updatedUnscheduled = updated
            .filter(r => unscheduledIds.has(r.id))
            .sort((a, b) => (b.displayScore || 0) - (a.displayScore || 0));

          const updatedPools = sprintPools.map(pool => ({
            ...pool,
            requirements: pool.requirements.map(r => updated.find(u => u.id === r.id) || r)
          }));

          set({
            requirements: updated,
            unscheduled: updatedUnscheduled,
            sprintPools: updatedPools
          });
        },

        clearAllRequirements: () => {
          set({
            requirements: [],
            unscheduled: [],
            sprintPools: get().sprintPools.map(pool => ({ ...pool, requirements: [] }))
          });
        },

        // v1.2.0: 配置数据操作
        updateScoringStandard: (score, updates) => {
          const { scoringStandards } = get();
          set({
            scoringStandards: scoringStandards.map(s =>
              s.score === score ? { ...s, ...updates } : s
            )
          });
        },

        updateMetricDefinition: (key, updates) => {
          const { okrMetrics, processMetrics } = get();
          const updatedOKRs = okrMetrics.map(m => m.key === key ? { ...m, ...updates } : m);
          const updatedProcess = processMetrics.map(m => m.key === key ? { ...m, ...updates } : m);
          set({
            okrMetrics: updatedOKRs,
            processMetrics: updatedProcess
          });
        },

        // 需求移动（拖拽逻辑）
        moveRequirement: (reqId, sourcePoolId, targetPoolId) => {
          if (sourcePoolId === targetPoolId) return;

          const { unscheduled, sprintPools } = get();
          let requirement: Requirement | undefined;

          // 从源位置找到需求
          if (sourcePoolId === 'unscheduled') {
            requirement = unscheduled.find(r => r.id === reqId);
          } else {
            const sourcePool = sprintPools.find(p => p.id === sourcePoolId);
            requirement = sourcePool?.requirements.find(r => r.id === reqId);
          }

          if (!requirement) return;

          // 检查技术评估状态（同时处理 '待评估' 和 '未评估'）
          // 使用常量定义，避免硬编码和拼写错误
          if (targetPoolId !== 'unscheduled' && needsEvaluation(requirement.techProgress)) {
            // 使用 Toast 提示而不是 alert
            useToastStore.getState().showToast('此需求未完成技术评估，无法排期！', 'warning');
            return;
          }

          // 从源位置移除
          let newUnscheduled = [...unscheduled];
          let newSprintPools = [...sprintPools];

          if (sourcePoolId === 'unscheduled') {
            newUnscheduled = newUnscheduled.filter(r => r.id !== reqId);
          } else {
            newSprintPools = newSprintPools.map(p =>
              p.id === sourcePoolId
                ? { ...p, requirements: p.requirements.filter(r => r.id !== reqId) }
                : p
            );
          }

          // 添加到目标位置
          if (targetPoolId === 'unscheduled') {
            newUnscheduled = [...newUnscheduled, requirement];
            newUnscheduled.sort((a, b) => (b.displayScore || 0) - (a.displayScore || 0));
          } else {
            newSprintPools = newSprintPools.map(p =>
              p.id === targetPoolId
                ? { ...p, requirements: [...p.requirements, requirement!] }
                : p
            );
          }

          set({
            unscheduled: newUnscheduled,
            sprintPools: newSprintPools,
            dragOverPool: null
          });
        },

        // 迭代池操作
        addSprintPool: (pool) => {
          const { sprintPools } = get();
          set({ sprintPools: [...sprintPools, pool] });
        },

        updateSprintPool: (pool) => {
          const { sprintPools } = get();
          set({
            sprintPools: sprintPools.map(p => p.id === pool.id ? pool : p)
          });
        },

        deleteSprintPool: (poolId) => {
          const { sprintPools, unscheduled } = get();
          const pool = sprintPools.find(p => p.id === poolId);

          if (!pool) return;

          // 将迭代池中的需求移回待排期区
          if (pool.requirements.length > 0) {
            const newUnscheduled = [...unscheduled, ...pool.requirements];
            newUnscheduled.sort((a, b) => (b.displayScore || 0) - (a.displayScore || 0));
            set({ unscheduled: newUnscheduled });
          }

          set({
            sprintPools: sprintPools.filter(p => p.id !== poolId)
          });
        },

        // UI控制
        toggleCompact: () => set((state) => ({ compact: !state.compact })),
        setShowHandbook: (show) => set({ showHandbook: show }),
        setShowExportMenu: (show) => set({ showExportMenu: show }),
        setShowImportModal: (show) => set({ showImportModal: show }),
        setShowFeishuImportModal: (show) => set({ showFeishuImportModal: show }),
        setImportData: (data) => set({ importData: data }),
        setImportMapping: (mapping) => set({ importMapping: mapping }),
        setImportModalScrollTop: (scrollTop) => set({ importModalScrollTop: scrollTop }),
        setIsRestoringImportModalScroll: (restoring) => set({ isRestoringImportModalScroll: restoring }),
        setIsAIMappingLoading: (loading) => set({ isAIMappingLoading: loading }),
        setClearBeforeImport: (clear) => set({ clearBeforeImport: clear }),
        setSelectedAIModel: (model) => set({ selectedAIModel: model }),

        // AI智能填充
        setIsAIFillingLoading: (loading) => set({ isAIFillingLoading: loading }),
        setAIFillingProgress: (progress) => set({ aiFillingProgress: progress }),
        setAIFillingCurrentIndex: (index) => set({ aiFillingCurrentIndex: index }),
        setAIFillingCurrentName: (name) => set({ aiFillingCurrentName: name }),
        setAIFilledData: (data) => set({ aiFilledData: data }),
        setSelectedRequirementIndex: (index) => set({ selectedRequirementIndex: index }),
        setAIFillingCancelled: (cancelled) => set({ aiFillingCancelled: cancelled }),
        addAIAnalysisLog: (log) => set((state) => ({
          aiAnalysisLogs: [...state.aiAnalysisLogs.slice(-20), log] // 只保留最近21条（显示最新20条）
        })),
        clearAIAnalysisLogs: () => set({ aiAnalysisLogs: [] }),

        // 编辑状态
        setEditingReq: (req) => set({ editingReq: req }),
        setEditingSprint: (sprint) => set({ editingSprint: sprint }),
        setIsNewReq: (isNew) => set({ isNewReq: isNew }),

        // 拖拽状态
        setDragOverPool: (poolId) => set({ dragOverPool: poolId }),

        // 筛选状态
        setSearchTerm: (term) => set({ searchTerm: term }),
        setFilterType: (type) => set({ filterType: type }),
        setScoreFilter: (filter) => set({ scoreFilter: filter }),
        setEffortFilter: (filter) => set({ effortFilter: filter }),
        setBVFilter: (filter) => set({ bvFilter: filter }),
        setBusinessDomainFilter: (filter) => set({ businessDomainFilter: filter }),
        setBusinessSubDomainFilter: (filter) => set({ businessSubDomainFilter: filter }),
        setRMSFilter: (filter) => set({ rmsFilter: filter }),

        // 布局状态
        setLeftPanelWidth: (width) => set({ leftPanelWidth: width }),
        setPoolWidths: (widths) => set({ poolWidths: widths }),
        setPoolWidth: (poolId, width) => {
          const { poolWidths } = get();
          set({ poolWidths: { ...poolWidths, [poolId]: width } });
        },
      }),
      {
        name: 'wsjf-storage',
        version: 7, // v1.3.4: 优化迭代池宽度为340px
        // 只持久化部分数据，避免存储过多临时状态
        // 注意：scoringStandards/okrMetrics/processMetrics 不再持久化
        // 原因：这些是代码配置而非用户数据，应始终从代码读取最新版本
        partialize: (state) => ({
          requirements: state.requirements,
          sprintPools: state.sprintPools,
          unscheduled: state.unscheduled,
          currentUser: state.currentUser,
          compact: state.compact,
          leftPanelWidth: state.leftPanelWidth,
          poolWidths: state.poolWidths,
          selectedAIModel: state.selectedAIModel,
        }),
        // 数据迁移逻辑
        migrate: (persistedState: any, version: number) => {
          logger.log(`[Store] 检测到存储版本: ${version}，当前版本: 7`);

          const state = persistedState;

          if (version < 2) {
            // 从版本1升级到版本2：迁移需求数据
            logger.log('[Store] 开始执行v1→v2数据迁移...');

            // 检查是否需要迁移requirements
            if (state.requirements && needsMigration(state.requirements)) {
              logger.log('[Store] 迁移requirements...');
              state.requirements = migrateAllRequirements(state.requirements);
            }

            // 迁移unscheduled
            if (state.unscheduled && needsMigration(state.unscheduled)) {
              logger.log('[Store] 迁移unscheduled...');
              state.unscheduled = migrateAllRequirements(state.unscheduled);
            }

            // 迁移sprintPools中的requirements
            if (state.sprintPools && Array.isArray(state.sprintPools)) {
              logger.log('[Store] 迁移sprintPools中的requirements...');
              state.sprintPools = state.sprintPools.map((pool: SprintPool) => {
                if (pool.requirements && needsMigration(pool.requirements)) {
                  return {
                    ...pool,
                    requirements: migrateAllRequirements(pool.requirements)
                  };
                }
                return pool;
              });
            }

            logger.log('[Store] v1→v2数据迁移完成！');
          }

          // v1.3.2：移除旧版本持久化的配置数据
          // 这些配置现在始终从代码读取，不再持久化
          if (state.scoringStandards) {
            delete state.scoringStandards;
          }
          if (state.okrMetrics) {
            delete state.okrMetrics;
          }
          if (state.processMetrics) {
            delete state.processMetrics;
          }

          // v1.3.3：重置AI模型默认值为deepseek
          if (version < 4) {
            logger.log('[Store] v3→v4迁移: 重置AI模型为deepseek');
            state.selectedAIModel = 'deepseek';
          }

          // v1.3.4：调整待排期区域和迭代池默认宽度（v5迁移）
          // 注意：不仅检查版本号，还检查实际值，确保旧配置被重置
          if (version < 5 || state.leftPanelWidth === 400 || state.leftPanelWidth > 350) {
            logger.log('[Store] v4→v5迁移: 调整待排期区域宽度为320px，迭代池宽度为300px');
            state.leftPanelWidth = 320;
            // 重置所有迭代池宽度为300px（如果有旧的384px配置）
            if (state.poolWidths && Object.values(state.poolWidths).some((w: any) => w > 350)) {
              logger.log('[Store] 检测到旧的迭代池宽度配置，重置为300px');
              state.poolWidths = {};
            }
          }

          // v1.3.4：强制重置布局（v6迁移）- 确保HMR期间没有正确迁移的用户也能重置
          // 迭代池宽度默认340px以确保内容完整显示
          if (version < 6) {
            logger.log('[Store] v5→v6迁移: 强制重置布局宽度（待排期320px，迭代池340px）');
            state.leftPanelWidth = 320;
            state.poolWidths = {};
          }

          // v1.3.4：优化迭代池宽度到340px（v7迁移）
          if (version < 7) {
            logger.log('[Store] v6→v7迁移: 优化迭代池宽度为340px以完整显示内容');
            state.poolWidths = {};
          }

          return state;
        },
      }
    ),
    {
      name: 'WSJF Store',
    }
  )
);
