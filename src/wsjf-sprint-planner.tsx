/**
 * WSJF Sprint Planner - WSJF加权优先级排期可视化工具
 *
 * 项目概述：
 * 基于 WSJF (Weighted Shortest Job First) 方法的迭代需求排期决策工具
 * 帮助团队通过业务价值、时间临界性、工作量等维度评估需求优先级
 *
 * 技术栈：
 * - React 18 + TypeScript
 * - Tailwind CSS (样式)
 * - Lucide React (图标)
 * - xlsx (Excel导出)
 * - jsPDF + html2canvas (PDF导出)
 *
 * 核心功能：
 * 1. WSJF评分算法：自动计算需求热度分(1-100)和星级(2-5星)
 * 2. 拖拽排期：支持需求在迭代池间拖拽移动
 * 3. 数据持久化：LocalStorage存储用户数据
 * 4. 多维筛选：按业务价值、时间临界性、截止日期等筛选
 * 5. 数据导入导出：支持Excel、JSON格式导入导出，支持PDF导出
 * 6. 智能映射：AI辅助字段映射(集成Gemini API)
 *
 * @author WSJF Team
 * @version 1.0.0
 */

import React, { useEffect, useState } from 'react';
import { AlertCircle, X, Save, Plus, Star, HelpCircle, Download, Upload, FileSpreadsheet, FileText, Image as ImageIcon, LogOut, User as UserIcon, ArrowUpDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as storage from './storage';

// 导入类型定义
import type { Requirement, SprintPool, AIModelType } from './types';

// 导入配置
import { OPENAI_API_KEY, DEEPSEEK_API_KEY } from './config/api';

// 导入工具函数
import { calculateScores } from './utils/scoring';

// 导入 Zustand Store
import { useStore } from './store/useStore';


// 导入UI组件
import HandbookModal from './components/HandbookModal';
import LoginModal from './components/LoginModal';
import EditRequirementModal from './components/EditRequirementModal';
import EditSprintModal from './components/EditSprintModal';
import SprintPoolComponent from './components/SprintPoolComponent';
import UnscheduledArea from './components/UnscheduledArea';
import BatchEvaluationModal from './components/BatchEvaluationModal';

// ============================================================================
// 辅助函数 - 生成示例数据
// ============================================================================

/**
 * 生成示例数据用于演示
 * 包含真实的需求数据供新用户参考
 */
const generateSampleData = (): Requirement[] => {
  // 真实数据来自专卖系统开发影响其他功能上线评估.pdf
  const realData = [
    // 评分10分：必须要做的功能
    { name: '英国直营零售通适配', owner: 'Zhisheng1 Liu 刘智晟', pm: 'Andy Wei魏有峰', days: 45, importance: 10, status: 'todo', deadline: '2025-11-30', category: '国际部新增' },
    { name: '韩国授权零售通适配', owner: 'Zhisheng1 Liu 刘智晟', pm: 'Andy Wei魏有峰', days: 50, importance: 10, status: 'todo', deadline: '2025-12-15', category: '国际部新增' },
    { name: '展位规划', owner: 'Jaye 朴景雯', pm: 'Nick Su 苏梦醒', days: 40, importance: 10, status: 'todo', deadline: '2025-11-20', category: '国际部新增' },
    { name: '智利销服一体11.15试营业', owner: 'Andy Wei魏有峰', pm: 'Zhisheng1 Liu 刘智晟', days: 35, importance: 10, status: 'doing', deadline: '2025-11-15', category: '国际部新增' },
    { name: '浮窗&金刚位优化', owner: 'Nick Su 苏梦醒', pm: 'Jamie 吴静姗', days: 30, importance: 10, status: 'todo', deadline: '2025-12-01', category: '国际部新增' },
    { name: '越南销服一体12月试营业', owner: 'Andy Wei魏有峰', pm: 'Zhisheng1 Liu 刘智晟', days: 40, importance: 10, status: 'todo', deadline: '2025-12-01', category: '国际部新增' },
    { name: 'ERA需求Cashback', owner: 'Asher 徐泽一', pm: 'Andy Wei魏有峰', days: 35, importance: 10, status: 'todo', deadline: '2025-11-25', category: '国际部新增' },
    { name: 'ERA需求盘点优化', owner: 'Asher 徐泽一', pm: 'Andy Wei魏有峰', days: 45, importance: 10, status: 'todo', deadline: '2025-12-10', category: '国际部新增' },
    { name: '授权大家电退货', owner: '李申宇', pm: 'Asher 徐泽一', days: 40, importance: 10, status: 'todo', deadline: '2025-11-30', category: '国际部新增' },

    // 评分9分：重点功能
    { name: 'ERA需求APP端授权商采购单、汇总看板&批量审批', owner: 'Asher 徐泽一', pm: 'Andy Wei魏有峰', days: 55, importance: 9, status: 'todo', deadline: '2025-12-20', category: '国际部新增' },
    { name: '进货单部分拒收', owner: '李申宇', pm: 'Asher 徐泽一', days: 35, importance: 9, status: 'todo', deadline: '2025-11-28', category: '国际部新增' },
    { name: '授权坏品返仓', owner: '李申宇', pm: 'Asher 徐泽一', days: 40, importance: 9, status: 'todo', deadline: '2025-12-05', category: '国际部新增' },

    // 评分8分：中等优先级
    { name: '物料系统搭建', owner: 'Jaye 朴景雯', pm: 'Andy Wei魏有峰', days: 60, importance: 8, status: 'todo', category: '国际部新增' },
    { name: 'CPS的买赠活动', owner: 'Jamie 吴静姗', pm: 'Nick Su 苏梦醒', days: 30, importance: 8, status: 'todo', deadline: '2025-11-30', category: '国际部新增' },
    { name: 'CPS订单消费者感知', owner: 'Jamie 吴静姗', pm: 'Nick Su 苏梦醒', days: 25, importance: 8, status: 'todo', deadline: '2025-12-10', category: '国际部新增' },
    { name: '小票各国统一优化', owner: 'Nick Su 苏梦醒', pm: 'Jamie 吴静姗', days: 20, importance: 8, status: 'todo', category: '国际部新增' },
    { name: '授权店活动预算优化迭代', owner: 'Asher 徐泽一', pm: 'Andy Wei魏有峰', days: 30, importance: 8, status: 'todo', category: '国际部新增' },

    // 评分7分：建议做的功能
    { name: '政策日历(促销)', owner: 'Nick Su 苏梦醒', pm: 'Jamie 吴静姗', days: 20, importance: 7, status: 'todo', category: '中国区导入' },
    { name: '目标复理二期迭代', owner: 'Zhisheng1 Liu 刘智晟', pm: 'Andy Wei魏有峰', days: 35, importance: 7, status: 'todo', category: '国际部新增' },
    { name: '直营店非串码坏品返仓', owner: '李申宇', pm: 'Asher 徐泽一', days: 25, importance: 7, status: 'todo', category: '国际部新增' },
    { name: 'PC端员工看板 2.0', owner: 'Zhisheng1 Liu 刘智晟', pm: 'Andy Wei魏有峰', days: 30, importance: 7, status: 'todo', category: '国际部新增' },
    { name: '坏品、良品互转', owner: '李申宇', pm: 'Asher 徐泽一', days: 15, importance: 7, status: 'todo', category: '中国区导入' },
    { name: '理赔返仓', owner: '李申宇', pm: 'Asher 徐泽一', days: 20, importance: 7, status: 'todo', category: '中国区导入' },
    { name: '商品周转看板', owner: 'Jaye 朴景雯', pm: 'Andy Wei魏有峰', days: 25, importance: 7, status: 'todo', category: '中国区导入' },
    { name: 'ROI看板1.1', owner: 'Zhisheng1 Liu 刘智晟', pm: 'Andy Wei魏有峰', days: 30, importance: 7, status: 'todo', category: '国际部新增' },
    { name: '串码轨迹查询', owner: '李申宇', pm: 'Asher 徐泽一', days: 20, importance: 7, status: 'todo', category: '国际部新增' },

    // 评分6分：如果有资源建议做
    { name: '门店补差', owner: 'Jamie 吴静姗', pm: 'Nick Su 苏梦醒', days: 15, importance: 6, status: 'todo', category: '中国区导入' },
    { name: '满减满赠', owner: 'Jamie 吴静姗', pm: 'Nick Su 苏梦醒', days: 20, importance: 6, status: 'todo', category: '中国区导入' },
    { name: '固资盘点', owner: 'Jaye 朴景雯', pm: 'Andy Wei魏有峰', days: 25, importance: 6, status: 'todo', category: '中国区导入' },
    { name: '员工激励与提成', owner: 'Zhisheng1 Liu 刘智晟', pm: 'Andy Wei魏有峰', days: 40, importance: 6, status: 'todo', category: '国际部新增' },

    // 评分5分：次优先级
    { name: 'MBR(月报、周报)', owner: 'Zhisheng1 Liu 刘智晟', pm: 'Andy Wei魏有峰', days: 18, importance: 5, status: 'todo', category: '中国区导入' },
    { name: '异业券', owner: 'Jamie 吴静姗', pm: 'Nick Su 苏梦醒', days: 15, importance: 5, status: 'todo', category: '中国区导入' },
    { name: '固资处理', owner: 'Jaye 朴景雯', pm: 'Andy Wei魏有峰', days: 20, importance: 5, status: 'todo', category: '中国区导入' },
    { name: '组织中台3.0', owner: 'Zhisheng1 Liu 刘智晟', pm: 'Andy Wei魏有峰', days: 50, importance: 5, status: 'todo', category: '国际部新增' },
    { name: '库存查询APP多角色看板&PC看板', owner: 'Asher 徐泽一', pm: 'Andy Wei魏有峰', days: 30, importance: 5, status: 'todo', category: '国际部新增' },

    // 评分4分：NSS体验改善
    { name: 'NSS体验改善——扫码场景提示优化', owner: 'Nick Su 苏梦醒', pm: 'Jamie 吴静姗', days: 8, importance: 4, status: 'todo', category: '国际部新增' },
    { name: 'NSS体验改善——商品搜索能力优化', owner: 'Nick Su 苏梦醒', pm: 'Jamie 吴静姗', days: 10, importance: 4, status: 'todo', category: '国际部新增' },
    { name: 'NSS体验改善——订单筛选能力优化', owner: 'Nick Su 苏梦醒', pm: 'Jamie 吴静姗', days: 8, importance: 4, status: 'todo', category: '国际部新增' },
    { name: 'NSS体验改善——收货地址查询体验优化', owner: 'Nick Su 苏梦醒', pm: 'Jamie 吴静姗', days: 7, importance: 4, status: 'todo', category: '国际部新增' },
    { name: 'NSS体验改善——退款效率与提示优化', owner: 'Nick Su 苏梦醒', pm: 'Jamie 吴静姗', days: 10, importance: 4, status: 'todo', category: '国际部新增' },

    // 评分3分：可延期到26年初
    { name: '新品专区', owner: 'Jamie 吴静姗', pm: 'Nick Su 苏梦醒', days: 12, importance: 3, status: 'todo', category: '中国区导入' },
    { name: '商场礼品卡', owner: 'Jamie 吴静姗', pm: 'Nick Su 苏梦醒', days: 15, importance: 3, status: 'todo', category: '国际部新增' },
    { name: '客流数据二期迭代', owner: 'Nick Su 苏梦醒', pm: 'Jamie 吴静姗', days: 20, importance: 3, status: 'todo', category: '国际部新增' },
    { name: '专属LDU活动报价机取', owner: 'Asher 徐泽一', pm: 'Andy Wei魏有峰', days: 18, importance: 3, status: 'todo', category: '国际部新增' },

    // 评分2分：低优先级
    { name: '串批流加催办', owner: '李申宇', pm: 'Asher 徐泽一', days: 8, importance: 2, status: 'todo', category: '国际部新增' },
    { name: '建店系统和ISP建立机构打通', owner: 'Zhisheng1 Liu 刘智晟', pm: 'Andy Wei魏有峰', days: 10, importance: 2, status: 'todo', category: '国际部新增' },

    // 评分1分：最低优先级
    { name: '2C部分退款', owner: 'Jamie 吴静姗', pm: 'Nick Su 苏梦醒', days: 5, importance: 1, status: 'todo', category: '国际部新增' },

    // 未评估工作量的需求（用于测试hover不显示工作量字段）
    { name: '会员积分系统升级', owner: 'Jamie 吴静姗', pm: 'Nick Su 苏梦醒', days: 0, importance: 7, status: 'todo', category: '国际部新增' },
    { name: '供应商协同平台', owner: 'Jaye 朴景雯', pm: 'Andy Wei魏有峰', days: 0, importance: 8, status: 'todo', category: '国际部新增' },
    { name: '智能客服机器人', owner: 'Nick Su 苏梦醒', pm: 'Jamie 吴静姗', days: 0, importance: 6, status: 'todo', category: '国际部新增' },
  ];

  const bvMapping: Record<number, string> = {
    10: '战略平台',
    9: '撬动核心',
    8: '撬动核心',
    7: '明显',
    6: '明显',
    5: '明显',
    4: '局部',
    3: '局部',
    2: '局部',
    1: '局部'
  };

  return realData.map((item, i) => {
    const hasDeadline = !!item.deadline;
    const isUrgent = hasDeadline && new Date(item.deadline) < new Date('2025-11-15');

    // 生成提交日期：高优先级的需求提交时间较早
    const baseDate = new Date('2025-10-01');
    let daysOffset = 0;
    if (item.importance >= 9) {
      daysOffset = i % 10;
    } else if (item.importance >= 7) {
      daysOffset = 10 + (i % 10);
    } else if (item.importance >= 5) {
      daysOffset = 20 + (i % 10);
    } else if (item.importance >= 3) {
      daysOffset = 30 + (i % 10);
    } else {
      daysOffset = 40 + (i % 10);
    }

    const submitDate = new Date(baseDate);
    submitDate.setDate(submitDate.getDate() + daysOffset);

    // 根据类别分配需求提交方
    let submitter: '产品' | '研发' | '业务' = '产品';
    if (item.category === '中国区导入') {
      submitter = '业务';
    } else if (item.name.includes('优化') || item.name.includes('体验改善') || item.name.includes('看板')) {
      submitter = i % 2 === 0 ? '产品' : '研发';
    } else {
      submitter = '产品';
    }

    // 判断是否为RMS重构项目
    const isRMS = item.name.includes('系统') || item.name.includes('中台') ||
                  item.name.includes('平台') || item.name.includes('架构') ||
                  (item.days > 40 && item.importance >= 8);

    const developer = item.owner;

    // 生成复杂度评分：根据工作量和是否RMS项目智能推断
    // 注意：复杂度可以在评估工作量之前就预估（基于需求描述和技术方案）
    let complexityScore: number | undefined;
    if (item.days > 0) {
      // 已评估工作量的需求：根据工作量推断复杂度
      if (isRMS || item.days > 50) {
        complexityScore = 8 + Math.floor(Math.random() * 3); // 8-10分
      } else if (item.days > 30) {
        complexityScore = 6 + Math.floor(Math.random() * 3); // 6-8分
      } else if (item.days > 15) {
        complexityScore = 4 + Math.floor(Math.random() * 3); // 4-6分
      } else if (item.days > 5) {
        complexityScore = 2 + Math.floor(Math.random() * 3); // 2-4分
      } else {
        complexityScore = 1 + Math.floor(Math.random() * 2); // 1-2分
      }
    } else {
      // 未评估工作量的需求：根据重要性预估复杂度
      if (item.importance >= 8) {
        complexityScore = 6 + Math.floor(Math.random() * 3); // 6-8分（高重要性通常较复杂）
      } else if (item.importance >= 5) {
        complexityScore = 4 + Math.floor(Math.random() * 3); // 4-6分
      } else {
        complexityScore = 2 + Math.floor(Math.random() * 3); // 2-4分
      }
    }

    // 技术进度：如果工作量为0，表示未评估
    const techProgress = item.days > 0 ? '已评估工作量' : '未评估';

    return {
      id: `ZM-${String(i + 1).padStart(3, '0')}`,
      name: item.name,
      submitterName: item.pm,
      productManager: item.pm,
      developer: developer,
      productProgress: item.status === 'doing' ? '已出PRD' : '已评估',
      effortDays: item.days,
      businessImpactScore: item.importance as any, // 业务影响度评分（1-10）
      complexityScore: complexityScore as any, // 添加复杂度评分
      bv: bvMapping[item.importance] || '明显',
      tc: isUrgent ? '一月硬窗口' : (hasDeadline ? '三月窗口' : '随时'),
      hardDeadline: isUrgent,
      deadlineDate: item.deadline,
      techProgress: techProgress, // 根据工作量决定技术进度
      type: '功能开发',
      submitDate: submitDate.toISOString().split('T')[0],
      submitter,
      isRMS,
      businessDomain: item.category === '中国区导入' ? '渠道零售' : '国际零售通用'
    };
  });
};

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
  const setDragOverPool = useStore((state) => state.setDragOverPool);

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
  const showExportMenu = useStore((state) => state.showExportMenu);
  const showImportModal = useStore((state) => state.showImportModal);
  const importData = useStore((state) => state.importData);
  const importMapping = useStore((state) => state.importMapping);
  const isAIMappingLoading = useStore((state) => state.isAIMappingLoading);
  const clearBeforeImport = useStore((state) => state.clearBeforeImport);
  const selectedAIModel = useStore((state) => state.selectedAIModel);
  const toggleCompact = useStore((state) => state.toggleCompact);
  const setShowHandbook = useStore((state) => state.setShowHandbook);
  const setShowExportMenu = useStore((state) => state.setShowExportMenu);
  const setShowImportModal = useStore((state) => state.setShowImportModal);
  const setImportData = useStore((state) => state.setImportData);
  const setImportMapping = useStore((state) => state.setImportMapping);
  const setIsAIMappingLoading = useStore((state) => state.setIsAIMappingLoading);
  const setClearBeforeImport = useStore((state) => state.setClearBeforeImport);
  const setSelectedAIModel = useStore((state) => state.setSelectedAIModel);

  // 筛选和搜索状态
  const searchTerm = useStore((state) => state.searchTerm);
  const filterType = useStore((state) => state.filterType);
  const scoreFilter = useStore((state) => state.scoreFilter);
  const effortFilter = useStore((state) => state.effortFilter);
  const bvFilter = useStore((state) => state.bvFilter);
  const businessDomainFilter = useStore((state) => state.businessDomainFilter);
  const rmsFilter = useStore((state) => state.rmsFilter);
  const setSearchTerm = useStore((state) => state.setSearchTerm);
  const setFilterType = useStore((state) => state.setFilterType);
  const setScoreFilter = useStore((state) => state.setScoreFilter);
  const setEffortFilter = useStore((state) => state.setEffortFilter);
  const setBVFilter = useStore((state) => state.setBVFilter);
  const setBusinessDomainFilter = useStore((state) => state.setBusinessDomainFilter);
  const setRMSFilter = useStore((state) => state.setRMSFilter);

  // 布局相关状态
  const leftPanelWidth = useStore((state) => state.leftPanelWidth);
  const poolWidths = useStore((state) => state.poolWidths);
  const setLeftPanelWidth = useStore((state) => state.setLeftPanelWidth);
  const setPoolWidth = useStore((state) => state.setPoolWidth);

  // Store Actions
  const addRequirement = useStore((state) => state.addRequirement);
  const updateRequirement = useStore((state) => state.updateRequirement);
  const moveRequirement = useStore((state) => state.moveRequirement);
  const addSprintPool = useStore((state) => state.addSprintPool);
  const updateSprintPool = useStore((state) => state.updateSprintPool);
  const deleteSprintPool = useStore((state) => state.deleteSprintPool);
  const clearAllRequirements = useStore((state) => state.clearAllRequirements);

  // ========== 批量评估状态 ==========
  const [showBatchEvalModal, setShowBatchEvalModal] = useState(false);

  // ========== 数据初始化和持久化 ==========

  /**
   * 加载示例数据
   * 包含预置的需求和迭代池，帮助新用户快速了解系统
   */

  const loadSampleData = () => {
    const sampleReqs = generateSampleData();
    const samplePools: SprintPool[] = [
      { id: 'SPRINT-01', name: '迭代1', startDate: '2025-11', endDate: '2025-11-30', totalDays: 200, bugReserve: 10, refactorReserve: 15, otherReserve: 5, requirements: [] },
      { id: 'SPRINT-02', name: '迭代2', startDate: '2025-12', endDate: '2025-12-31', totalDays: 200, bugReserve: 10, refactorReserve: 15, otherReserve: 5, requirements: [] },
      { id: 'SPRINT-03', name: '迭代3', startDate: '2026-01', endDate: '2026-01-31', totalDays: 200, bugReserve: 10, refactorReserve: 15, otherReserve: 5, requirements: [] },
    ];

    const withScores = calculateScores(sampleReqs);
    setRequirements(withScores);
    setSprintPools(samplePools);
    
    const sorted = [...withScores].sort((a, b) => (b.displayScore || 0) - (a.displayScore || 0));
    setUnscheduled(sorted);
  };

  // 初始化：检查用户登录状态
  useEffect(() => {
    const user = storage.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      const savedData = storage.loadUserData(user);
      if (savedData) {
        setRequirements(savedData.requirements);
        setSprintPools(savedData.sprintPools);
        setUnscheduled(savedData.unscheduled);
      } else {
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

  const handleSaveSprint = (sprint: SprintPool) => {
    updateSprintPool(sprint);
  };

  const handleDeleteSprint = (poolId: string) => {
    const pool = sprintPools.find(p => p.id === poolId);
    if (!pool) return;

    if (pool.requirements.length > 0) {
      if (!confirm(`迭代池"${pool.name}"中还有 ${pool.requirements.length} 个需求，删除后这些需求将被移回待排期区。确定删除吗？`)) {
        return;
      }
    } else {
      if (!confirm(`确定要删除迭代池"${pool.name}"吗？`)) {
        return;
      }
    }

    deleteSprintPool(poolId);
  };

  const handleAddSprint = () => {
    const newId = `SPRINT-${Date.now()}`;
    const newSprint: SprintPool = {
      id: newId,
      name: `迭代${sprintPools.length + 1}`,
      startDate: '2026-01',
      endDate: '2026-01-31',
      totalDays: 200,
      bugReserve: 10,
      refactorReserve: 15,
      otherReserve: 5,
      requirements: []
    };
    addSprintPool(newSprint);
    // 打开编辑弹窗让用户配置
    setEditingSprint(newSprint);
  };

  const handleLogin = (user: storage.User) => {
    setCurrentUser(user);
    setShowLogin(false);
    const savedData = storage.loadUserData(user);
    if (savedData) {
      setRequirements(savedData.requirements);
      setSprintPools(savedData.sprintPools);
      setUnscheduled(savedData.unscheduled);
    } else {
      loadSampleData();
    }
  };

  const handleLogout = () => {
    if (confirm('确定要退出登录吗？数据已自动保存。')) {
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

    alert(`成功应用 ${updates.size} 个需求的AI评分！`);
  };

  /**
   * 处理文件导入
   * 支持CSV和Excel格式
   */
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseFile(file);
      if (data && data.length > 0) {
        setImportData(data);
        // 自动进行模糊匹配
        const mapping = autoMapFields(data[0]);
        setImportMapping(mapping);
        setShowImportModal(true);
      } else {
        alert('文件中没有数据');
      }
    } catch (error) {
      console.error('文件解析失败:', error);
      alert('文件解析失败，请检查文件格式');
    }

    // 重置input以允许重复上传同一文件
    e.target.value = '';
  };

  /**
   * 解析文件（CSV或Excel）
   */
  const parseFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsBinaryString(file);
    });
  };

  /**
   * 自动映射字段（模糊匹配）
   * 匹配系统字段和导入文件的字段
   */
  const autoMapFields = (sampleRow: any): Record<string, string> => {
    const mapping: Record<string, string> = {};
    const fileFields = Object.keys(sampleRow);

    // 系统字段定义
    // 注意：techProgress和productProgress不做自动映射，使用智能默认值
    const systemFields: Record<string, string[]> = {
      name: ['需求名称', '名称', 'name', 'title', '标题', '需求', 'requirement', '功能'],
      submitterName: ['提交人', '提交人姓名', 'submitter', 'author', '作者'],
      productManager: ['产品经理', '产品', 'pm', 'product manager', '负责人', '产品主r'],
      developer: ['开发人员', '开发', 'developer', 'dev', '开发者', '研发主r', '研发负责人'],
      effortDays: ['工作量', '人天', '工作日', 'effort', 'days', '人日', '天数', '工时', '预估工时', 'workday'],
      bv: ['业务价值', 'bv', 'business value', '价值', '重要性', '业务重要性', '优先级'],
      tc: ['时间临界', 'tc', 'time critical', '临界性', '紧急', '迫切'],
      hardDeadline: ['强制截止', 'ddl', 'deadline', '截止', '上线时间', '交付时间'],
      // techProgress: 不自动映射，使用智能默认值（有工作量=已评估工作量，无工作量=未评估）
      // productProgress: 不自动映射，使用默认值"未评估"
      type: ['类型', 'type', '需求类型'],
      submitDate: ['提交日期', '日期', 'date', '提交时间', '开始时间'],
      submitter: ['提交者', '提交方', '来源'],
      isRMS: ['是否RMS', 'rms', 'is rms'],
    };

    // 对每个文件字段进行匹配
    fileFields.forEach(fileField => {
      const normalizedFileField = fileField.toLowerCase().trim();

      for (const [systemField, keywords] of Object.entries(systemFields)) {
        const matched = keywords.some(keyword =>
          normalizedFileField.includes(keyword.toLowerCase()) ||
          keyword.toLowerCase().includes(normalizedFileField)
        );

        if (matched && !Object.values(mapping).includes(fileField)) {
          mapping[systemField] = fileField;
          break;
        }
      }
    });

    return mapping;
  };

  /**
   * 使用AI映射字段（支持OpenAI和DeepSeek）
   */
  const handleAIMapping = async () => {
    // 根据选择的模型获取对应的API Key
    const apiKey = selectedAIModel === 'openai' ? OPENAI_API_KEY : DEEPSEEK_API_KEY;
    const modelName = selectedAIModel === 'openai' ? 'OpenAI' : 'DeepSeek';

    if (!apiKey) {
      alert(`AI映射功能未配置。请联系管理员在代码中配置 ${modelName} API Key。`);
      return;
    }

    setIsAIMappingLoading(true);

    try {
      const sampleRow = importData[0];
      const fileFields = Object.keys(sampleRow);
      const systemFields = {
        name: '需求名称（必填）',
        submitterName: '提交人姓名',
        productManager: '产品经理',
        developer: '开发人员',
        effortDays: '工作量（天数）',
        bv: '业务价值（局部/明显/撬动核心/战略平台）',
        tc: '时间临界（随时/三月窗口/一月硬窗口）',
        hardDeadline: '是否有强制截止日期（true/false）',
        techProgress: '技术进展（未评估/已评估工作量/已完成技术方案）',
        productProgress: '产品进展（未评估/设计中/开发中/已完成）',
        type: '需求类型（功能开发/技术债/Bug修复）',
        submitDate: '提交日期',
        submitter: '提交方（产品/技术/运营/业务）',
        isRMS: '是否RMS需求（true/false）'
      };

      const prompt = `你是一个数据映射专家。请将Excel文件的列名映射到系统字段。

系统字段（目标）：
${Object.entries(systemFields).map(([key, desc]) => `- ${key}: ${desc}`).join('\n')}

Excel文件列名（来源）：
${fileFields.map((field, index) => `${index + 1}. ${field}`).join('\n')}

示例数据（第一行）：
${JSON.stringify(sampleRow, null, 2)}

请分析列名和示例数据，返回最合理的映射关系。只返回JSON格式，不要其他解释：
{"systemField1": "excelColumn1", "systemField2": "excelColumn2", ...}

注意：
1. 如果某个Excel列无法映射到任何系统字段，不要包含在结果中
2. 确保name字段必须被映射（这是必填字段）
3. 对于布尔值字段（hardDeadline、isRMS），尝试识别"是/否"、"有/无"、"true/false"等表示`;

      // 根据选择的模型构建不同的API请求
      let apiUrl: string;
      let requestBody: any;

      if (selectedAIModel === 'openai') {
        // OpenAI API配置
        apiUrl = 'https://api.openai.com/v1/chat/completions';
        requestBody = {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: '你是一个专业的数据映射专家，擅长分析Excel列名和系统字段的对应关系。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        };
      } else {
        // DeepSeek API配置
        apiUrl = 'https://api.deepseek.com/v1/chat/completions';
        requestBody = {
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: '你是一个专业的数据映射专家，擅长分析Excel列名和系统字段的对应关系。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        };
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error?.message || response.statusText;
        throw new Error(`${modelName} API请求失败 (${response.status}): ${errorMsg}\n\n可能原因：\n1. API Key无效或已过期\n2. API Key权限不足\n3. 超出API配额限制\n4. 网络连接问题\n\n请检查API Key配置`);
      }

      const result = await response.json();

      // 检查API返回的结果
      if (!result.choices || result.choices.length === 0) {
        throw new Error('API返回数据格式异常：没有返回结果');
      }

      const aiText = result.choices[0]?.message?.content || '';

      if (!aiText) {
        throw new Error('API返回数据为空');
      }

      // 从AI返回的文本中提取JSON
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const aiMapping = JSON.parse(jsonMatch[0]);
        setImportMapping(aiMapping);
        alert(`${modelName} AI映射完成！请检查映射结果`);
      } else {
        throw new Error(`无法解析AI返回的映射结果。AI返回内容：\n${aiText.substring(0, 200)}...`);
      }
    } catch (error) {
      console.error('AI映射失败:', error);
      let errorMessage = 'AI映射失败：';

      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage += '网络连接失败，请检查网络连接或防火墙设置';
      } else if (error instanceof Error) {
        errorMessage += error.message;
      } else {
        errorMessage += '未知错误';
      }

      alert(errorMessage);
    } finally {
      setIsAIMappingLoading(false);
    }
  };

  /**
   * 确认导入数据
   */
  const handleConfirmImport = () => {
    try {
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
        const validTechProgress = ['未评估', '已评估工作量', '已完成技术方案'];
        let finalTechProgress = validTechProgress.includes(mapped.techProgress)
          ? mapped.techProgress
          : (effortDays > 0 ? '已评估工作量' : '未评估');

        // 如果映射的是有效的"未评估"但有工作量数据，自动升级
        if (effortDays > 0 && finalTechProgress === '未评估') {
          finalTechProgress = '已评估工作量';
        }

        // 验证业务价值
        const validBV = ['局部', '明显', '撬动核心', '战略平台'];
        let finalBV = validBV.includes(mapped.bv) ? mapped.bv : '明显';

        // 智能转换：如果是数字，尝试映射到业务价值等级
        if (typeof mapped.bv === 'number' || !isNaN(Number(mapped.bv))) {
          const bvNum = Number(mapped.bv);
          if (bvNum >= 9) finalBV = '战略平台';
          else if (bvNum >= 7) finalBV = '撬动核心';
          else if (bvNum >= 5) finalBV = '明显';
          else finalBV = '局部';
        }

        // 验证时间临界
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

      setShowImportModal(false);
      setImportData([]);
      setImportMapping({});
      setClearBeforeImport(false); // 重置清空选项

      const message = clearBeforeImport
        ? `已清空原有需求，成功导入 ${newRequirements.length} 条新需求！`
        : `成功导入 ${newRequirements.length} 条需求！`;
      alert(message);
    } catch (error) {
      console.error('导入失败:', error);
      alert('导入失败：' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  const handleExportExcel = () => {
    const exportData: any[] = [];

    sprintPools.forEach(pool => {
      pool.requirements.forEach(req => {
        exportData.push({
          '迭代池': pool.name,
          '需求名称': req.name,
          '需求提交人': req.submitterName,
          '产品经理': req.productManager,
          '研发同学': req.developer,
          '类型': req.type,
          '工作量(天)': req.effortDays,
          '业务价值': req.bv,
          '迫切程度': req.tc,
          '强制DDL': req.hardDeadline ? '是' : '否',
          '权重分': req.displayScore || 0,
          '星级': '★'.repeat(req.stars || 0),
          '技术评估': req.techProgress
        });
      });
    });

    unscheduled.forEach(req => {
      exportData.push({
        '迭代池': '未排期',
        '需求名称': req.name,
        '需求提交人': req.submitterName,
        '产品经理': req.productManager,
        '研发同学': req.developer,
        '类型': req.type,
        '工作量(天)': req.effortDays,
        '业务价值': req.bv,
        '迫切程度': req.tc,
        '强制DDL': req.hardDeadline ? '是' : '否',
        '热度分': req.displayScore || 0,
        '星级': '★'.repeat(req.stars || 0),
        '技术评估': req.techProgress
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'WSJF排期');
    XLSX.writeFile(workbook, `WSJF排期_${new Date().toISOString().split('T')[0]}.xlsx`);
    setShowExportMenu(false);
  };

  const handleExportPNG = async () => {
    const element = document.body;
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false
    });

    const link = document.createElement('a');
    link.download = `WSJF排期_${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvas.toDataURL();
    link.click();
    setShowExportMenu(false);
  };

  const handleExportPDF = async () => {
    const element = document.body;
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const imgWidth = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(`WSJF排期_${new Date().toISOString().split('T')[0]}.pdf`);
    setShowExportMenu(false);
  };

  const handleDragEnter = (poolId: string) => {
    setDragOverPool(poolId);
  };

  const handleDragLeave = () => {
    setDragOverPool(null);
  };

  const handleDrop = (targetPoolId: string) => {
    const event = window.event as DragEvent;
    if (!event || !event.dataTransfer) return;

    const reqId = event.dataTransfer.getData('requirementId');
    const sourcePoolId = event.dataTransfer.getData('sourcePoolId');

    if (!reqId) return;

    // 使用 store action 处理移动逻辑
    moveRequirement(reqId, sourcePoolId, targetPoolId);
  };

  const totalScheduled = sprintPools.reduce((sum, pool) => sum + pool.requirements.length, 0);
  const hardDeadlineReqs = unscheduled.filter(r => r.hardDeadline);
  const totalResourceUsed = sprintPools.reduce((sum, p) => sum + p.requirements.reduce((s, r) => s + r.effortDays, 0), 0);
  const totalResourceAvailable = sprintPools.reduce((sum, p) => sum + p.totalDays * (1 - (p.bugReserve + p.refactorReserve + p.otherReserve) / 100), 0);
  const notEvaluatedCount = unscheduled.filter(r => r.techProgress === '未评估').length;

  /**
   * 导入预览Modal组件
   * 显示导入数据预览和字段映射配置
   * 支持手动调整映射和AI辅助映射
   */
  const ImportPreviewModal = () => {
    if (!showImportModal || importData.length === 0) return null;

    const sampleRow = importData[0];
    const fileFields = Object.keys(sampleRow);

    // 系统字段选项
    const systemFieldOptions = [
      { value: '', label: '-- 不映射 --' },
      { value: 'name', label: '需求名称 *' },
      { value: 'submitterName', label: '提交人姓名' },
      { value: 'productManager', label: '产品经理' },
      { value: 'developer', label: '开发人员' },
      { value: 'effortDays', label: '工作量(天数)' },
      { value: 'bv', label: '业务价值' },
      { value: 'tc', label: '时间临界' },
      { value: 'hardDeadline', label: '强制截止' },
      { value: 'techProgress', label: '技术进展' },
      { value: 'productProgress', label: '产品进展' },
      { value: 'type', label: '需求类型' },
      { value: 'submitDate', label: '提交日期' },
      { value: 'submitter', label: '提交方' },
      { value: 'isRMS', label: '是否RMS' },
    ];

    // 检查是否所有必填字段都已映射
    const hasRequiredFields = Object.values(importMapping).length > 0 && importMapping.name;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* 标题栏 */}
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="text-white" size={24} />
              <h2 className="text-xl font-bold text-white">导入预览与字段映射</h2>
            </div>
            <button
              onClick={() => setShowImportModal(false)}
              className="text-white/80 hover:text-white transition"
            >
              <X size={24} />
            </button>
          </div>

          {/* 内容区域 */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* 统计信息 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">检测到 {importData.length} 条记录</span>，
                共 {fileFields.length} 个字段。请配置字段映射关系后确认导入。
              </p>
            </div>

            {/* AI模型选择和映射按钮 */}
            <div className="mb-6 space-y-3">
              {/* 模型选择器 */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">选择AI模型：</label>
                <select
                  value={selectedAIModel}
                  onChange={(e) => setSelectedAIModel(e.target.value as AIModelType)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={isAIMappingLoading}
                >
                  <option value="deepseek">DeepSeek（推荐中国大陆）</option>
                  <option value="openai">OpenAI（推荐海外）</option>
                </select>
                <span className="text-xs text-gray-500">
                  {selectedAIModel === 'deepseek'
                    ? '适用于腾讯云、阿里云等国内部署，访问速度更快'
                    : '适用于海外服务器部署或可访问OpenAI的环境'}
                </span>
              </div>

              {/* AI映射按钮 */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleAIMapping}
                  disabled={isAIMappingLoading}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition flex items-center gap-2"
                >
                  <Star size={16} />
                  {isAIMappingLoading ? `${selectedAIModel === 'deepseek' ? 'DeepSeek' : 'OpenAI'} 映射中...` : '使用AI智能映射'}
                </button>
                <span className="text-xs text-gray-500">AI会分析字段名称和示例数据，自动匹配最合适的系统字段</span>
              </div>
            </div>

            {/* 字段映射配置 */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <ArrowUpDown size={18} />
                字段映射配置
              </h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 w-1/3">Excel列名</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 w-1/4">示例数据</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 w-1/3">映射到系统字段</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fileFields.map((field, index) => {
                      // 找到当前文件字段映射到的系统字段
                      const mappedSystemField = Object.keys(importMapping).find(
                        key => importMapping[key] === field
                      ) || '';

                      return (
                        <tr key={index} className="border-t border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-800">{field}</td>
                          <td className="px-4 py-3 text-gray-600 truncate max-w-xs">
                            {String(sampleRow[field])}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={mappedSystemField}
                              onChange={(e) => {
                                const newMapping = { ...importMapping };
                                // 移除旧映射
                                Object.keys(newMapping).forEach(key => {
                                  if (newMapping[key] === field) {
                                    delete newMapping[key];
                                  }
                                });
                                // 添加新映射
                                if (e.target.value) {
                                  newMapping[e.target.value] = field;
                                }
                                setImportMapping(newMapping);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                            >
                              {systemFieldOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 数据预览 */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">数据预览（前5条）</h3>
              <div className="border border-gray-200 rounded-lg overflow-auto max-h-60">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      {fileFields.map(field => (
                        <th key={field} className="px-3 py-2 text-left font-semibold text-gray-700 whitespace-nowrap">
                          {field}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {importData.slice(0, 5).map((row: any, index: number) => (
                      <tr key={index} className="border-t border-gray-200">
                        {fileFields.map(field => (
                          <td key={field} className="px-3 py-2 text-gray-600 whitespace-nowrap">
                            {String(row[field])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 警告提示 */}
            {!hasRequiredFields && (
              <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800 flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span className="font-semibold">注意：</span>
                  必须映射"需求名称"字段才能导入
                </p>
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="border-t border-gray-200 px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="clear-before-import"
                checked={clearBeforeImport}
                onChange={(e) => setClearBeforeImport(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-500"
              />
              <label htmlFor="clear-before-import" className="text-sm text-gray-700 cursor-pointer">
                清空已有需求并导入全新数据
                {clearBeforeImport && (
                  <span className="ml-2 text-red-600 font-semibold">（警告：将删除所有现有需求！）</span>
                )}
              </label>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition font-medium"
              >
                取消
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={!hasRequiredFields}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 disabled:text-gray-500 text-white rounded-lg transition font-medium flex items-center gap-2"
              >
                <Save size={18} />
                确认导入 ({importData.length} 条)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-3 shadow-sm flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* 标题区域 - 两行显示 */}
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">小米国际 WSJF-Lite Tools</h1>
              <p className="text-xs text-gray-400 mt-0.5">by Evan (tianyuan8@xiaomi.com)</p>
            </div>

            {/* 图例 - 左对齐 */}
            <div className="flex items-center gap-3 text-xs text-gray-300">
              {/* BV颜色图例 */}
              <div className="flex items-center gap-1.5">
                <div className="flex gap-0.5">
                  <div className="w-3 h-3 rounded-sm bg-gradient-to-br from-blue-100 to-blue-200" title="局部"></div>
                  <div className="w-3 h-3 rounded-sm bg-gradient-to-br from-blue-400 to-blue-500" title="明显"></div>
                  <div className="w-3 h-3 rounded-sm bg-gradient-to-br from-blue-600 to-blue-700" title="撬动核心"></div>
                  <div className="w-3 h-3 rounded-sm bg-gradient-to-br from-blue-800 to-blue-900" title="战略平台"></div>
                </div>
                <span>业务价值</span>
              </div>

              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gradient-to-br from-red-600 to-red-900 rounded-sm"></div>
                <span>强DDL</span>
              </div>

              <div className="flex items-center gap-1">
                <Star size={12} className="fill-yellow-400 text-yellow-400" />
                <span>权重</span>
              </div>
            </div>

            <button
              onClick={() => setShowHandbook(true)}
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition"
            >
              <HelpCircle size={14} />
              <span>说明书</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {currentUser && (
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                <UserIcon size={16} className="text-blue-400" />
                <span className="text-sm text-white">{currentUser.name}</span>
                <span className="text-xs text-gray-400">({currentUser.email})</span>
              </div>
            )}

            <button
              onClick={toggleCompact}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition text-sm font-medium"
            >
              {compact ? '宽松视图' : '紧凑视图'}
            </button>

            {/* 导入按钮 */}
            <button
              onClick={() => document.getElementById('file-import-input')?.click()}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition text-sm font-medium flex items-center gap-2"
            >
              <Upload size={16} />
              导入
            </button>
            <input
              id="file-import-input"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileImport}
              className="hidden"
            />

            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition text-sm font-medium flex items-center gap-2"
              >
                <Download size={16} />
                导出
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
                  <button
                    onClick={handleExportExcel}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700 transition"
                  >
                    <FileSpreadsheet size={18} className="text-green-600" />
                    导出为 Excel
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700 transition"
                  >
                    <FileText size={18} className="text-red-600" />
                    导出为 PDF
                  </button>
                  <button
                    onClick={handleExportPNG}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700 transition"
                  >
                    <ImageIcon size={18} className="text-blue-600" />
                    导出为图片
                  </button>
                </div>
              )}
            </div>

            {currentUser && (
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm font-medium flex items-center gap-2"
              >
                <LogOut size={16} />
                退出
              </button>
            )}
          </div>
        </div>
      </div>

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
                  style={{ width: `${poolWidths[pool.id] || 384}px` }}
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
                    const startWidth = poolWidths[pool.id] || 384;

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

      {/* 导入预览Modal */}
      <ImportPreviewModal />

      {/* 批量AI评估Modal */}
      {showBatchEvalModal && (
        <BatchEvaluationModal
          requirements={requirements}
          onClose={() => setShowBatchEvalModal(false)}
          onApplyScores={handleApplyBatchScores}
        />
      )}
    </div>
  );
}