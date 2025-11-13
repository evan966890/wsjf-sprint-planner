/**
 * WSJF Sprint Planner - WSJF加权优先级排期可视化工具
 *
 * 项目概述：
 * 基于 WSJF (Weighted Shortest Job First) 方法的迭代需求排期决策工具
 * 帮助团队通过业务影响度、时间窗口、工作量等维度评估需求优先级
 *
 * 技术栈：
 * - React 18 + TypeScript
 * - Tailwind CSS (样式)
 * - Lucide React (图标)
 * - xlsx (Excel导出)
 * - jsPDF + html2canvas (PDF导出)
 *
 * 核心功能：
 * 1. WSJF评分算法：自动计算需求权重分(1-100)和星级(2-5星)
 * 2. 拖拽排期：支持需求在迭代池间拖拽移动
 * 3. 数据持久化：LocalStorage存储用户数据
 * 4. 多维筛选：按业务影响度、时间窗口、截止日期等筛选
 * 5. 数据导入导出：支持Excel、JSON格式导入导出，支持PDF导出
 * 6. 智能映射：AI辅助字段映射(集成Gemini API)
 *
 * @author WSJF Team
 * @version 1.0.0
 */

import React, { useEffect, useState } from 'react';
import { AlertCircle, Plus } from 'lucide-react';
import * as storage from './storage';

// 导入类型定义
import type { Requirement } from './types';

// 导入工具函数
import { calculateScores } from './utils/scoring';

// 导入 Zustand Store
import { useStore } from './store/useStore';

// 导入常量
import { needsEvaluation } from './constants/techProgress';

// 导入UI组件
import HandbookModal from './components/HandbookModal';
import LoginModal from './components/LoginModal';
import EditRequirementModal from './components/EditRequirementModal';
import EditSprintModal from './components/EditSprintModal';
import SprintPoolComponent from './components/SprintPoolComponent';
import UnscheduledArea from './components/UnscheduledArea';
import BatchEvaluationModal from './components/BatchEvaluationModal';
import { Header } from './components/Header';
import ToastContainer from './components/ToastContainer';
import { FeishuImportModal } from './components/FeishuImportModal';
import { ExportMenuModal } from './components/ExportMenuModal';
import { ImportValidationModal } from './components/ImportValidationModal';
import { ConfirmDialog, Toast, useConfirmDialog } from './components/ConfirmDialog';

// 导入Hooks
import { useToast } from './hooks/useToast';
import { useDataExport } from './hooks/useDataExport';
import { useSprintOperations } from './hooks/useSprintOperations';
import { useDragDrop } from './hooks/useDragDrop';

// 导入工具函数
import { createSampleData } from './utils/sampleDataLoader';

export default function WSJFPlanner() {
  // ========== Zustand Store 状态 ==========

  // 用户相关状态
  const currentUser = useStore((state) => state.currentUser);
  const showLogin = useStore((state) => state.showLogin);
  const setCurrentUser = useStore((state) => state.setCurrentUser);
  const setShowLogin = useStore((state) => state.setShowLogin);

  // 核心数据状态
  const requirements = useStore((state) => state.requirements);
  const sprintPools = useStore((state) => state.sprintPools);
  const unscheduled = useStore((state) => state.unscheduled);
  const setRequirements = useStore((state) => state.setRequirements);
  const setSprintPools = useStore((state) => state.setSprintPools);
  const setUnscheduled = useStore((state) => state.setUnscheduled);

  // 拖拽相关状态
  const dragOverPool = useStore((state) => state.dragOverPool);

  // 编辑相关状态
  const editingReq = useStore((state) => state.editingReq);
  const editingSprint = useStore((state) => state.editingSprint);
  const isNewReq = useStore((state) => state.isNewReq);
  const setEditingReq = useStore((state) => state.setEditingReq);
  const setEditingSprint = useStore((state) => state.setEditingSprint);
  const setIsNewReq = useStore((state) => state.setIsNewReq);

  // UI控制状态
  const compact = useStore((state) => state.compact);
  const showHandbook = useStore((state) => state.showHandbook);
  const showFeishuImportModal = useStore((state) => state.showFeishuImportModal);
  const toggleCompact = useStore((state) => state.toggleCompact);
  const setShowHandbook = useStore((state) => state.setShowHandbook);
  const setShowFeishuImportModal = useStore((state) => state.setShowFeishuImportModal);
  const deleteRequirement = useStore((state) => state.deleteRequirement);

  // 筛选和搜索状态
  const searchTerm = useStore((state) => state.searchTerm);
  const filterType = useStore((state) => state.filterType);
  const scoreFilter = useStore((state) => state.scoreFilter);
  const effortFilter = useStore((state) => state.effortFilter);
  const bvFilter = useStore((state) => state.bvFilter);
  const businessDomainFilter = useStore((state) => state.businessDomainFilter);
  const businessSubDomainFilter = useStore((state) => state.businessSubDomainFilter);
  const rmsFilter = useStore((state) => state.rmsFilter);
  const setSearchTerm = useStore((state) => state.setSearchTerm);
  const setFilterType = useStore((state) => state.setFilterType);
  const setScoreFilter = useStore((state) => state.setScoreFilter);
  const setEffortFilter = useStore((state) => state.setEffortFilter);
  const setBVFilter = useStore((state) => state.setBVFilter);
  const setBusinessDomainFilter = useStore((state) => state.setBusinessDomainFilter);
  const setBusinessSubDomainFilter = useStore((state) => state.setBusinessSubDomainFilter);
  const setRMSFilter = useStore((state) => state.setRMSFilter);

  // 布局相关状态
  const leftPanelWidth = useStore((state) => state.leftPanelWidth);
  const poolWidths = useStore((state) => state.poolWidths);
  const setLeftPanelWidth = useStore((state) => state.setLeftPanelWidth);
  const setPoolWidth = useStore((state) => state.setPoolWidth);

  // Store Actions
  const addRequirement = useStore((state) => state.addRequirement);
  const updateRequirement = useStore((state) => state.updateRequirement);
  const clearAllRequirements = useStore((state) => state.clearAllRequirements);

  // ========== 批量评估状态 ==========
  const [showBatchEvalModal, setShowBatchEvalModal] = useState(false);

  // ========== 新导出/导入状态 ==========
  const [showExportMenuModal, setShowExportMenuModal] = useState(false);
  const [showImportValidationModal, setShowImportValidationModal] = useState(false);

  // ========== Toast 通知系统 (使用Hook) ==========
  const { toasts, showToast, dismissToast } = useToast();

  // ========== 确认对话框 (使用Hook) ==========
  const { showConfirm } = useConfirmDialog();

  // ========== 数据导出/导入 (使用Hook) ==========
  const {
    handleExport,
    handleValidateImport,
    handleImport,
    isImporting,
  } = useDataExport(
    sprintPools,
    unscheduled,
    setRequirements,
    setSprintPools,
    setUnscheduled
  );





  // ========== 飞书导入处理 ==========
  const handleFeishuImport = (importedRequirements: Requirement[]) => {
    // 计算WSJF分数
    const allRequirements = [...requirements, ...importedRequirements];
    const scoredRequirements = calculateScores(allRequirements);

    // 更新需求列表
    setRequirements(scoredRequirements);

    // 将新导入的需求添加到待排期区
    const importedIds = new Set(importedRequirements.map(r => r.id));
    const newlyImported = scoredRequirements.filter(r => importedIds.has(r.id));
    const updatedUnscheduled = [...unscheduled, ...newlyImported].sort(
      (a, b) => (b.displayScore || 0) - (a.displayScore || 0)
    );
    setUnscheduled(updatedUnscheduled);

    showToast(`成功从飞书导入 ${importedRequirements.length} 个需求`, 'success');
  };

  // ========== Sprint 操作 (使用Hook) ==========
  const { handleSaveSprint, handleDeleteSprint, handleAddSprint } = useSprintOperations();

  // ========== 拖拽操作 (使用Hook) ==========
  const { handleDragEnter, handleDragLeave, handleDrop } = useDragDrop();

  // 全局滚动监听已移除 - 用于诊断页面跳动问题

  // ========== 数据初始化和持久化 ==========

  const loadSampleData = () => {
    const { requirements, sprintPools, unscheduled } = createSampleData();
    setRequirements(requirements);
    setSprintPools(sprintPools);
    setUnscheduled(unscheduled);
  };

  // 初始化：检查用户登录状态
  useEffect(() => {
    const user = storage.getCurrentUser();

    if (user) {
      // 只设置当前用户，数据由 Zustand persist 自动加载
      setCurrentUser(user);

      // 如果 Zustand persist 中没有数据（首次使用），加载示例数据
      const storeState = useStore.getState();
      if (storeState.requirements.length === 0 && storeState.sprintPools.length === 0) {
        loadSampleData();
      }
    } else {
      setShowLogin(true);
    }
  }, []);

  // 注意：自动保存现在由 Zustand persist 中间件自动处理，无需手动 useEffect
  // recalculateScores 也由 store action 提供，无需本地定义

  const handleSaveRequirement = (req: Requirement) => {
    if (isNewReq) {
      addRequirement(req);
    } else {
      updateRequirement(req);
    }
  };

  const handleLogin = (user: storage.User) => {
    setCurrentUser(user);
    setShowLogin(false);

    // 数据由 Zustand persist 自动加载，无需手动加载
    // 如果 store 中没有数据（首次登录），加载示例数据
    const storeState = useStore.getState();

    if (storeState.requirements.length === 0 && storeState.sprintPools.length === 0) {
      loadSampleData();
    }
  };

  const handleLogout = async () => {
    const confirmed = await showConfirm({
      title: '确认退出',
      message: '确定要退出登录吗？数据已自动保存。',
      type: 'warning',
      confirmText: '退出',
      cancelText: '取消',
    });

    if (confirmed) {
      storage.logout();
      const logout = useStore.getState().logout;
      logout();
    }
  };

  /**
   * 处理批量评估分数应用
   */
  const handleApplyBatchScores = (updates: Map<string, number>) => {
    // 更新需求的businessImpactScore
    const updatedRequirements: Requirement[] = requirements.map(req => {
      if (updates.has(req.id)) {
        const score = updates.get(req.id)!;
        return { ...req, businessImpactScore: Math.max(1, Math.min(10, Math.round(score))) as any };
      }
      return req;
    });

    // 重新计算分数
    const withScores = calculateScores(updatedRequirements);
    setRequirements(withScores);

    // 更新unscheduled列表
    const newUnscheduled = withScores.filter(r => !sprintPools.some(p => p.requirements.some(pr => pr.id === r.id)));
    const sorted = newUnscheduled.sort((a, b) => (b.displayScore || 0) - (a.displayScore || 0));
    setUnscheduled(sorted);

    showToast(`成功应用 ${updates.size} 个需求的AI评分！`, 'success');
  };



  // Wrap export functions to close menu after export

  const totalScheduled = sprintPools.reduce((sum, pool) => sum + pool.requirements.length, 0);
  const hardDeadlineReqs = unscheduled.filter(r => r.hardDeadline);
  const totalResourceUsed = sprintPools.reduce((sum, p) => sum + p.requirements.reduce((s, r) => s + r.effortDays, 0), 0);
  const totalResourceAvailable = sprintPools.reduce((sum, p) => sum + p.totalDays * (1 - (p.bugReserve + p.refactorReserve + p.otherReserve) / 100), 0);
  const notEvaluatedCount = unscheduled.filter(r => needsEvaluation(r.techProgress)).length;


  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header Component */}
      <Header
        currentUser={currentUser}
        compact={compact}
        onToggleCompact={toggleCompact}
        onShowHandbook={() => setShowHandbook(true)}
        onFeishuImport={() => {
          console.log('[WSJFPlanner] onFeishuImport called');
          console.log('[WSJFPlanner] Current showFeishuImportModal:', showFeishuImportModal);
          setShowFeishuImportModal(true);
          console.log('[WSJFPlanner] setShowFeishuImportModal(true) called');
        }}
        onImport={() => setShowImportValidationModal(true)}
        onExport={() => setShowExportMenuModal(true)}
        onLogout={handleLogout}
      />

      {hardDeadlineReqs.length > 0 && (
        <div className="bg-red-500 border-b border-red-600 px-6 py-3 flex-shrink-0">
          <div className="flex items-center gap-2 text-white">
            <AlertCircle size={20} />
            <span className="font-medium">
              {hardDeadlineReqs.length} 个强制DDL需求未排期
            </span>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <div onDragEnter={() => handleDragEnter('unscheduled')} onDragLeave={handleDragLeave} className="flex-shrink-0">
          <UnscheduledArea
            unscheduled={unscheduled}
            onRequirementClick={(req) => {
              setEditingReq(req);
              setIsNewReq(false);
            }}
            onRequirementDelete={deleteRequirement}
            onDrop={() => handleDrop('unscheduled')}
            isDragOver={dragOverPool === 'unscheduled'}
            onAddNew={() => {
              setEditingReq(null);
              setIsNewReq(true);
            }}
            onBatchEvaluate={() => setShowBatchEvalModal(true)}
            compact={compact}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filterType={filterType}
            onFilterChange={setFilterType}
            scoreFilter={scoreFilter}
            onScoreFilterChange={setScoreFilter}
            effortFilter={effortFilter}
            onEffortFilterChange={setEffortFilter}
            bvFilter={bvFilter}
            onBVFilterChange={setBVFilter}
            businessDomainFilter={businessDomainFilter}
            onBusinessDomainFilterChange={setBusinessDomainFilter}
            businessSubDomainFilter={businessSubDomainFilter}
            onBusinessSubDomainFilterChange={setBusinessSubDomainFilter}
            rmsFilter={rmsFilter}
            onRMSFilterChange={setRMSFilter}
            leftPanelWidth={leftPanelWidth}
            onClearAll={clearAllRequirements}
          />
        </div>

        {/* 拖动条 */}
        <div
          className="w-1 bg-gray-300 hover:bg-blue-500 cursor-col-resize transition-colors flex-shrink-0 h-full"
          onMouseDown={(e) => {
            e.preventDefault();
            const startX = e.clientX;
            const startWidth = leftPanelWidth;

            const handleMouseMove = (e: MouseEvent) => {
              const diff = e.clientX - startX;
              const newWidth = Math.max(300, Math.min(1400, startWidth + diff));
              setLeftPanelWidth(newWidth);
            };

            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
        />

        <div className="flex-1 p-3 overflow-x-auto overflow-y-hidden bg-gray-100">
          <div className="flex items-stretch min-w-min h-full">
            {sprintPools.map((pool) => (
              <React.Fragment key={pool.id}>
                <div
                  onDragEnter={() => handleDragEnter(pool.id)}
                  onDragLeave={handleDragLeave}
                  className="h-full flex-shrink-0"
                  style={{ width: `${poolWidths[pool.id] || 340}px` }}
                >
                  <SprintPoolComponent
                    pool={pool}
                    onRequirementClick={(req) => {
                      setEditingReq(req);
                      setIsNewReq(false);
                    }}
                    onDrop={(poolId) => handleDrop(poolId)}
                    isDragOver={dragOverPool === pool.id}
                    onEdit={() => setEditingSprint(pool)}
                    onDelete={() => handleDeleteSprint(pool.id)}
                    compact={compact}
                  />
                </div>

                {/* 拖动条 - 每个池右侧都有 */}
                <div
                  className="w-1 mx-3 bg-gray-300 hover:bg-blue-500 cursor-col-resize transition-colors flex-shrink-0 h-full"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const startX = e.clientX;
                    const startWidth = poolWidths[pool.id] || 340;

                    const handleMouseMove = (e: MouseEvent) => {
                      const diff = e.clientX - startX;
                      const newWidth = Math.max(300, Math.min(800, startWidth + diff));
                      setPoolWidth(pool.id, newWidth);
                    };

                    const handleMouseUp = () => {
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };

                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                />
              </React.Fragment>
            ))}

            {/* 新增迭代池按钮 */}
            <div className="flex-shrink-0 w-96 h-full">
              <button
                onClick={handleAddSprint}
                className="w-full h-full bg-white border-2 border-dashed border-gray-300 rounded-xl hover:border-teal-500 hover:bg-teal-50 transition-all flex flex-col items-center justify-center gap-3 text-gray-500 hover:text-teal-600"
                data-testid="add-sprint-pool-btn"
              >
                <Plus size={48} className="opacity-50" />
                <span className="text-lg font-medium">新增迭代池</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-t border-gray-200 px-6 py-3 shadow-sm flex-shrink-0">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex gap-6">
            <span>总需求 <strong className="text-gray-900">{requirements.length}</strong></span>
            <span>已排期 <strong className="text-gray-900">{totalScheduled}</strong></span>
            <span>未排期 <strong className="text-gray-900">{unscheduled.length}</strong></span>
            <span>未评估 <strong className="text-red-600">{notEvaluatedCount}</strong></span>
          </div>
          <div className="flex gap-6">
            <span>强DDL <strong className="text-red-600">{requirements.filter(r => r.hardDeadline).length}</strong></span>
            <span>资源使用 <strong className="text-gray-900">{totalResourceUsed}/{Math.round(totalResourceAvailable)}</strong> ({Math.round(totalResourceUsed / totalResourceAvailable * 100)}%)</span>
          </div>
        </div>
      </div>

      {(editingReq || isNewReq) && (
        <EditRequirementModal 
          requirement={editingReq}
          onSave={handleSaveRequirement}
          onClose={() => {
            setEditingReq(null);
            setIsNewReq(false);
          }}
          isNew={isNewReq}
        />
      )}

      {editingSprint && (
        <EditSprintModal 
          sprint={editingSprint}
          onSave={handleSaveSprint}
          onClose={() => setEditingSprint(null)}
        />
      )}

      {showLogin && (
        <LoginModal onLogin={handleLogin} />
      )}

      {showHandbook && (
        <HandbookModal onClose={() => setShowHandbook(false)} />
      )}


      {/* 飞书导入Modal */}
      <FeishuImportModal
        isOpen={showFeishuImportModal}
        onClose={() => setShowFeishuImportModal(false)}
        onImport={handleFeishuImport}
      />

      {/* 批量AI评估Modal */}
      {showBatchEvalModal && (
        <BatchEvaluationModal
          requirements={requirements}
          onClose={() => setShowBatchEvalModal(false)}
          onApplyScores={handleApplyBatchScores}
        />
      )}

      {/* Toast通知容器 */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* 导出菜单模态框 */}
      <ExportMenuModal
        isOpen={showExportMenuModal}
        onClose={() => setShowExportMenuModal(false)}
        onExport={(config) => {
          handleExport(config);
          setShowExportMenuModal(false);
          showToast('导出成功！', 'success');
        }}
      />

      {/* 导入验证模态框 */}
      <ImportValidationModal
        isOpen={showImportValidationModal}
        onClose={() => setShowImportValidationModal(false)}
        onValidate={handleValidateImport}
        onImport={async (file, options) => {
          await handleImport(file, options);
        }}
        isImporting={isImporting}
      />

      {/* 全局确认对话框 */}
      <ConfirmDialog />

      {/* 全局Toast组件（使用 useToastStore）*/}
      <Toast />
    </div>
  );
}