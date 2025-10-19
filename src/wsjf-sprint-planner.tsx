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
import { AlertCircle, X, Save, Plus, Star, HelpCircle, Download, Upload, FileSpreadsheet, FileText, Image as ImageIcon, LogOut, User as UserIcon, ArrowUpDown, Sparkles } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as storage from './storage';

// 导入类型定义
import type { Requirement, SprintPool, AIModelType } from './types';

// 导入配置
import { OPENAI_API_KEY, DEEPSEEK_API_KEY } from './config/api';
import { SCORING_STANDARDS } from './config/scoringStandards';
import { COMPLEXITY_STANDARDS } from './config/complexityStandards';
import { OKR_METRICS, PROCESS_METRICS } from './config/metrics';
import {
  BUSINESS_DOMAINS,
  REQUIREMENT_TYPES,
  REGIONS,
  STORE_TYPES,
  TIME_CRITICALITY
} from './config/businessFields';

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
// 字段名中英文映射表
// ============================================================================

/**
 * AI填充字段的中英文对照表
 * 用于在UI中显示友好的中文字段名
 */
const FIELD_NAME_MAP: Record<string, string> = {
  // 基本信息
  'name': '需求名称',
  'description': '需求描述',
  'submitterName': '提交人姓名',
  'submitDate': '提交日期',
  'submitter': '提交方',
  'businessTeam': '业务团队',

  // 业务影响度相关
  'businessImpactScore': '业务影响度',
  'affectedMetrics': '影响的指标',
  'impactScope': '影响范围',

  // 时间维度
  'timeCriticality': '时间窗口',
  'hardDeadline': '强制截止日期',
  'deadlineDate': '截止日期',

  // 业务域
  'businessDomain': '业务域',
  'customBusinessDomain': '自定义业务域',

  // 技术信息
  'effortDays': '工作量',
  'complexityScore': '技术复杂度',
  'type': '需求类型',
  'productManager': '产品经理',
  'developer': '研发负责人',
  'productProgress': '产品进度',
  'techProgress': '技术进度',
  'dependencies': '依赖需求',
  'isRMS': 'RMS重构项目',

  // 产研扩展字段
  'project': '项目名称',
  'productArea': '产品领域',
  'backendDeveloper': '后端研发',
  'frontendDeveloper': '前端研发',
  'tester': '测试',
  'rdNotes': '产研备注',

  // 影响范围子字段
  'storeTypes': '门店类型',
  'regions': '区域',
  'storeCountRange': '门店数量',
  'keyRoles': '涉及角色'
};

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

  // ========== Toast 通知系统 ==========
  interface ToastMessage {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
  }
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const terminationToastIdRef = React.useRef<number | null>(null); // 终止分析时的持久toast ID

  /**
   * 显示Toast通知
   * @param message 通知消息
   * @param type 通知类型
   * @param options 可选配置：duration(显示时长ms，默认3000)，persistent(是否持久显示，默认false)
   * @returns toast ID，用于手动移除持久toast
   */
  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' = 'info',
    options?: { duration?: number; persistent?: boolean }
  ): number => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);

    // 如果不是持久toast，则在指定时间后自动移除
    if (!options?.persistent) {
      const duration = options?.duration || 3000;
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
      }, duration);
    }

    return id; // 返回ID，用于手动移除
  };

  /**
   * 手动移除指定ID的toast
   */
  const dismissToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // 全局滚动监听（诊断用）- 检查是否是整个页面在跳动
  React.useEffect(() => {
    const handleWindowScroll = () => {
      if (window.pageYOffset > 0 || window.scrollY > 0) {
        console.log('⚠️ [Window滚动] pageYOffset:', window.pageYOffset, 'scrollY:', window.scrollY);
      }
    };

    window.addEventListener('scroll', handleWindowScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleWindowScroll);
    };
  }, []);

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

    showToast(`成功应用 ${updates.size} 个需求的AI评分！`, 'success');
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
        showToast('文件中没有数据', 'error');
      }
    } catch (error) {
      console.error('文件解析失败:', error);
      showToast('文件解析失败，请检查文件格式', 'error');
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
      effortDays: ['工作量', '人天', 'effort', 'days', '天数', '工时', '预估工时', 'workday'],
      bv: ['业务影响度', 'bv', 'business value', '价值', '重要性', '业务重要性'],
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
      setTimeout(() => {
        showToast(`AI映射功能未配置。请联系管理员在代码中配置 ${modelName} API Key。`, 'error');
      }, 0);
      return;
    }

    // 延迟设置 loading 状态，避免立即触发重渲染导致跳转
    await new Promise(resolve => setTimeout(resolve, 0));

    setIsAIMappingLoading(true);
    showToast(`正在调用 ${modelName} API 分析字段映射，请稍候...`, 'info');

    try {
      const sampleRow = importData[0];
      const fileFields = Object.keys(sampleRow);
      const systemFields = {
        name: '需求名称（必填）',
        submitterName: '提交人姓名',
        productManager: '产品经理',
        developer: '开发人员',
        effortDays: '工作量（天数）',
        bv: '业务影响度（局部/明显/撬动核心/战略平台）',
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
        showToast(`${modelName} AI映射完成！请检查映射结果`, 'success');
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

      showToast(errorMessage, 'error');
    } finally {
      setIsAIMappingLoading(false);
    }
  };

  /**
   * 构建导入AI智能填充的Prompt
   *
   * @param rawRow - Excel原始行数据
   * @param config - 所有配置数据（枚举选项、评分标准等）
   * @returns 完整的AI prompt字符串
   */
  const buildImportAIPrompt = (
    rawRow: Record<string, any>,
    config: {
      okrMetrics: typeof OKR_METRICS;
      processMetrics: typeof PROCESS_METRICS;
      scoringStandards: typeof SCORING_STANDARDS;
      complexityStandards: typeof COMPLEXITY_STANDARDS;
      businessDomains: string[];
      requirementTypes: string[];
      regions: string[];
      storeTypes: string[];
      productAreas: string[];
      timeCriticalityOptions: string[];
    }
  ): string => {
    // 格式化原始数据
    const rawDataStr = JSON.stringify(rawRow, null, 2);

    return `你是WSJF需求管理系统的数据分析助手。请分析以下Excel导入的原始数据，智能推导并填充30+个字段。

# 原始Excel数据
\`\`\`json
${rawDataStr}
\`\`\`

# 字段填充规则

## 一、基本信息字段（9个）

### 1. name（需求名称）- 自由文本
- **规则**：保留Excel中的原始需求名称
- **示例**：如果Excel有"需求名称"列为"门店库存预警功能"，则填充："门店库存预警功能"

### 2. description（需求描述）- 自由文本
- **规则**：提取Excel中的描述信息，可能来自"需求描述"、"详细说明"、"备注"等列
- **处理**：如果有多列包含描述信息，合并为一个完整描述

### 3. submitterName（提交人姓名）- 自由文本
- **规则**：提取人名，去除@符号和额外信息
- **示例**："@张三 产品经理" → "张三"

### 4. submitDate（提交日期）- 日期格式 YYYY-MM-DD
- **规则**：将Excel日期转换为标准格式
- **默认**：如果缺失，使用当前日期

### 5. submitter（提交方）- 枚举
- **可选值**：${['产品', '研发', '业务'].join(', ')}
- **推导规则**：
  - 如果描述中提到"业务需求"、"门店反馈"、"区域要求" → "业务"
  - 如果提到"技术债"、"重构"、"架构" → "研发"
  - 默认 → "产品"

### 6. businessTeam（业务团队）- 自由文本
- **规则**：识别团队名称关键词
- **示例**："开店团队"、"供应链团队"、"运营团队"、"经销商团队"

### 7. businessDomain（业务域）- 枚举
- **可选值**：${config.businessDomains.join(', ')}
- **推导规则**：
  - 提到"直营店"、"授权店"、"专卖店" → "新零售"
  - 提到"经销商"、"渠道"、"toB" → "渠道零售"
  - 提到"通用"、"全局" → "国际零售通用"

### 8. customBusinessDomain（自定义业务域）- 自由文本
- **规则**：仅当businessDomain为"自定义"时填写

### 9. type（需求类型）- 枚举
- **可选值**：${config.requirementTypes.join(', ')}

---

## 二、业务影响度评分（1个核心+2个辅助）

### 10. businessImpactScore（业务影响度评分）- 枚举 1-10
- **评分标准**：
  - **10分（致命缺陷）**：系统崩溃、业务停摆、合规风险
  - **9分（严重阻塞）**：关键流程严重受阻，需大量人工兜底
  - **8分（战略必需）**：影响关键KPI，CEO/CTO级关注
  - **7分（显著影响）**：明确影响OKR指标，跨部门协作
  - **6分（重要改进）**：显著提升效率或体验
  - **5分（有价值功能）**：解决明确痛点
  - **4分（优化改进）**：改善现有功能
  - **3分（小改进）**：小幅优化
  - **2分（边缘改进）**：少数人受益
  - **1分（微小改进）**：锦上添花

- **推导策略**：
  1. 看业务后果：提到"无法"、"崩溃"、"停摆" → 9-10分
  2. 看影响范围：提到"全球"、"所有门店" → 7-10分
  3. 看OKR关联：提到"GMV"、"营收"、"NPS" → 6-8分
  4. 看紧急度：提到"紧急"、"立即" → 6-8分
  5. 默认：5分

### 11. affectedMetrics（影响的指标）- 复杂数组
- **结构**：
\`\`\`json
[
  {
    "metricKey": "gmv",
    "metricName": "GMV/营收",
    "displayName": "GMV/营收",
    "estimatedImpact": "+5%",
    "category": "okr",
    "isAISuggested": true
  }
]
\`\`\`

- **核心OKR指标**：${config.okrMetrics.map(m => `${m.key}:${m.defaultName}`).slice(0, 5).join(', ')}...
- **过程指标**：${config.processMetrics.map(m => `${m.key}:${m.defaultName}`).slice(0, 5).join(', ')}...

- **推导规则**：
  1. 分析需求描述，识别关键词
  2. "收入"、"GMV"、"销售" → gmv指标
  3. "满意度"、"NPS"、"体验" → dealer_satisfaction_nps
  4. "效率"、"时间"、"自动化" → 对应过程指标
  5. 预估影响度："+X%"、"明显提升"、"从X小时→X分钟"

### 12. impactScope（影响范围）- 复杂对象
- **结构**：
\`\`\`json
{
  "storeTypes": ["新零售-直营店", "新零售-授权店"],
  "regions": ["南亚", "东南亚"],
  "storeCountRange": "50-200家",
  "keyRoles": [
    {
      "category": "regional",
      "roleName": "店员",
      "isCustom": false
    }
  ]
}
\`\`\`

- **门店类型可选值**：${config.storeTypes.join(', ')}
- **区域可选值**：${config.regions.join(', ')}
- **门店数量范围**：<10家, 10-50家, 50-200家, 200-500家, 500-1000家, >1000家, 全球所有门店

---

## 三、时间维度（3个）

### 13. timeCriticality（时间临界度）- 枚举
- **可选值**：${config.timeCriticalityOptions.join(', ')}
- **推导规则**：
  - 提到"紧急"、"立即"、"本月必须" → "一月硬窗口"
  - 提到"尽快"、"季度内"、"Q1完成" → "三月窗口"
  - 默认 → "随时"

### 14. hardDeadline（是否有强制截止日期）- 布尔值
- **规则**：如果提到具体日期或"必须在X之前"、"deadline" → true

### 15. deadlineDate（截止日期）- 日期 YYYY-MM-DD
- **规则**：提取Excel中的日期字段

---

## 四、技术信息（9个）

### 16. effortDays（预估工作量）- 数字
- **规则**：
  - 提取"X人天"、"X天"、"X工时"
  - 如果是"X人周"，换算：1人周=5人天
  - 默认：5（如果完全没有信息）

### 17. complexityScore（技术复杂度）- 枚举 1-10
- **评分标准**：
  - **10分**：全新技术平台，技术栈重建
  - **9分**：核心架构重构，系统级改造
  - **8分**：系统级改造，多模块联动
  - **5分**：中等功能开发，单模块改造
  - **3分**：简单功能，少量代码
  - **1分**：配置调整，文案修改

- **推导规则**：
  - 工作量 >100天 → 9-10分
  - 工作量 50-100天 → 7-8分
  - 工作量 20-50天 → 5-6分
  - 工作量 5-20天 → 3-4分
  - 工作量 <5天 → 1-2分

### 18. productArea（产品领域）- 枚举 ⭐ 特殊规则
- **可选值**：${config.productAreas.join(' | ')}

- **识别规则**：
  - 看到"@张普" → "管店/固资/物 @张普"
  - 看到"@杜玥" → "toC卖货/导购/AI/培训/营销 @杜玥"
  - 看到"@胡馨然" → "管人/SO上报/考勤 @胡馨然"
  - 看到"@李建国" → "toB进货/交易/返利 @李建国"
  - 看内容关键词：
    - "固资"、"资产"、"门店管理" → 张普
    - "导购"、"卖货"、"AI"、"培训" → 杜玥
    - "考勤"、"上报"、"SO" → 胡馨然
    - "进货"、"经销商"、"返利"、"toB" → 李建国

### 19. productManager（产品经理）- 自由文本
- **规则**：提取人名，可能与productArea中的@人名一致

### 20. developer（研发负责人）- 自由文本（保留字段）
- **规则**：提取"研发"、"开发"相关的人名

### 21. backendDeveloper（后端研发）- 自由文本
- **规则**：提取后端开发人员姓名

### 22. frontendDeveloper（前端研发）- 自由文本
- **规则**：提取前端开发人员姓名

### 23. tester（测试）- 自由文本
- **规则**：提取测试人员姓名

### 24. project（项目名称）- 自由文本
- **规则**：识别项目名称，如"RMS重构"、"开店系统V2"

### 25. productProgress（产品进度）- 自由文本
- **默认**："待评估"

### 26. techProgress（技术进度）- 自由文本
- **默认**："已评估工作量"（因为AI会推导effortDays，表示工作量已评估）

### 27. rdNotes（产研备注）- 自由文本
- **规则**：提取备注、说明、进展信息

---

## 五、其他字段

### 28. dependencies（依赖需求）- 字符串数组
- **规则**：提取"依赖XX需求"、"前置需求"等信息
- **格式**：["需求ID1", "需求ID2"]

### 29. isRMS（是否RMS重构项目）- 布尔值
- **规则**：提到"RMS"、"重构"、"refactor" → true

### 30. documents（需求文档）- 数组
- **规则**：如果有附件链接或文档路径，提取
- **默认**：[]

---

# Few-Shot 示例

## 示例1：紧急需求
**输入Excel**：
\`\`\`json
{
  "需求名称": "门店收银系统崩溃修复 @杜玥 紧急",
  "描述": "印度地区所有直营店收银系统无法使用，影响GMV，CEO要求立即修复",
  "工作量": "3人天"
}
\`\`\`

**输出JSON**：
\`\`\`json
{
  "name": "门店收银系统崩溃修复",
  "description": "印度地区所有直营店收银系统无法使用，影响GMV，CEO要求立即修复",
  "submitterName": "杜玥",
  "submitDate": "2025-01-19",
  "submitter": "业务",
  "businessTeam": "",
  "businessDomain": "新零售",
  "customBusinessDomain": "",
  "type": "Bug修复",
  "businessImpactScore": 10,
  "affectedMetrics": [
    {
      "metricKey": "gmv",
      "metricName": "GMV/营收",
      "displayName": "GMV/营收",
      "estimatedImpact": "直接受损",
      "category": "okr",
      "isAISuggested": true
    }
  ],
  "impactScope": {
    "storeTypes": ["新零售-直营店"],
    "regions": ["南亚"],
    "storeCountRange": "全球所有门店",
    "keyRoles": [
      {"category": "regional", "roleName": "店员", "isCustom": false}
    ]
  },
  "timeCriticality": "一月硬窗口",
  "hardDeadline": true,
  "deadlineDate": "2025-01-20",
  "effortDays": 3,
  "complexityScore": 6,
  "productArea": "toC卖货/导购/AI/培训/营销 @杜玥",
  "productManager": "杜玥",
  "developer": "",
  "backendDeveloper": "",
  "frontendDeveloper": "",
  "tester": "",
  "project": "",
  "productProgress": "待评估",
  "techProgress": "已评估工作量",
  "rdNotes": "",
  "dependencies": [],
  "isRMS": false,
  "documents": [],
  "_aiFilledFields": ["businessImpactScore", "affectedMetrics", "impactScope", "timeCriticality", "hardDeadline", "complexityScore", "productArea", "submitter"],
  "_aiConfidenceScores": {
    "businessImpactScore": 0.95,
    "productArea": 0.99
  }
}
\`\`\`

## 示例2：战略级需求
**输入Excel**：
\`\`\`json
{
  "领域": "toB进货 @李建国",
  "需求": "经销商返利自动化系统",
  "详情": "覆盖全球经销商，每月自动计算返利，提升经销商满意度NPS +10分，预计50人天",
  "业务团队": "经销商团队"
}
\`\`\`

**输出JSON**：
\`\`\`json
{
  "name": "经销商返利自动化系统",
  "description": "覆盖全球经销商，每月自动计算返利，提升经销商满意度NPS +10分，预计50人天",
  "submitterName": "李建国",
  "submitDate": "2025-01-19",
  "submitter": "业务",
  "businessTeam": "经销商团队",
  "businessDomain": "渠道零售",
  "customBusinessDomain": "",
  "type": "新功能",
  "businessImpactScore": 7,
  "affectedMetrics": [
    {
      "metricKey": "dealer_satisfaction_nps",
      "metricName": "经销商满意度/NPS",
      "displayName": "经销商满意度/NPS",
      "estimatedImpact": "+10分",
      "category": "okr",
      "isAISuggested": true
    }
  ],
  "impactScope": {
    "storeTypes": ["与门店无关"],
    "regions": ["全球所有市场"],
    "storeCountRange": "全球所有门店",
    "keyRoles": [
      {"category": "hq-channel-retail", "roleName": "经销商/代理商", "isCustom": false}
    ]
  },
  "timeCriticality": "三月窗口",
  "hardDeadline": false,
  "deadlineDate": "",
  "effortDays": 50,
  "complexityScore": 7,
  "productArea": "toB进货/交易/返利 @李建国",
  "productManager": "李建国",
  "developer": "",
  "backendDeveloper": "",
  "frontendDeveloper": "",
  "tester": "",
  "project": "",
  "productProgress": "待评估",
  "techProgress": "已评估工作量",
  "rdNotes": "",
  "dependencies": [],
  "isRMS": false,
  "documents": [],
  "_aiFilledFields": ["businessImpactScore", "affectedMetrics", "impactScope", "timeCriticality", "complexityScore", "productArea", "businessDomain", "submitter"],
  "_aiConfidenceScores": {
    "businessImpactScore": 0.90,
    "productArea": 0.95
  }
}
\`\`\`

---

# 输出要求

1. **必须返回完整的JSON对象**，包含所有30个字段
2. **枚举字段**：必须从可选值中精确选择，不能自创
3. **自由文本字段**：尽量保留Excel原始值
4. **元数据字段**：
   - \`_aiFilledFields\`: 列出所有由AI推导的字段名
   - \`_aiConfidenceScores\`: 关键字段的置信度（0-1）
5. **缺失字段处理**：
   - 字符串：填 ""
   - 数字：填合理默认值
   - 数组：填 []
   - 对象：填空对象或合理默认结构
6. **只返回JSON**，不要有其他解释文字

请开始分析并输出JSON：`;
  };

  /**
   * 调用AI分析单条需求
   *
   * @param rawRow - Excel原始行数据
   * @param config - 配置数据
   * @param selectedModel - 选择的AI模型
   * @returns AI填充后的需求对象
   */
  const analyzeRequirementWithAI = async (
    rawRow: Record<string, any>,
    config: Parameters<typeof buildImportAIPrompt>[1],
    selectedModel: AIModelType
  ): Promise<any> => {
    const { addAIAnalysisLog } = useStore.getState();

    const apiKey = selectedModel === 'openai' ? OPENAI_API_KEY : DEEPSEEK_API_KEY;
    const modelName = selectedModel === 'openai' ? 'OpenAI' : 'DeepSeek';

    if (!apiKey) {
      throw new Error(`${modelName} API Key未配置`);
    }

    addAIAnalysisLog(`📡 正在调用 ${modelName} API...`);

    // 构建prompt
    const prompt = buildImportAIPrompt(rawRow, config);
    addAIAnalysisLog(`📝 Prompt已生成，长度: ${prompt.length} 字符`);

    // 根据选择的模型构建API请求
    let apiUrl: string;
    let requestBody: any;

    if (selectedModel === 'openai') {
      apiUrl = 'https://api.openai.com/v1/chat/completions';
      requestBody = {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: '你是WSJF需求管理系统的数据分析助手，擅长从Excel数据中智能推导需求字段。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2, // 降低temperature提高准确性
        max_tokens: 3000  // 增加token限制以支持30+字段
      };
    } else {
      // DeepSeek
      apiUrl = 'https://api.deepseek.com/v1/chat/completions';
      requestBody = {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是WSJF需求管理系统的数据分析助手，擅长从Excel数据中智能推导需求字段。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 3000
      };
    }

    // 调用AI API
    addAIAnalysisLog(`⏳ 等待 ${modelName} 响应...`);
    const startTime = Date.now();

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    const responseTime = ((Date.now() - startTime) / 1000).toFixed(2);
    addAIAnalysisLog(`✅ ${modelName} 响应成功 (耗时 ${responseTime}秒)`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.error?.message || response.statusText;
      addAIAnalysisLog(`❌ API请求失败: ${errorMsg}`);
      throw new Error(`${modelName} API请求失败 (${response.status}): ${errorMsg}`);
    }

    const result = await response.json();

    if (!result.choices || result.choices.length === 0) {
      addAIAnalysisLog(`❌ API返回数据格式异常`);
      throw new Error('API返回数据格式异常');
    }

    const aiText = result.choices[0]?.message?.content || '';

    if (!aiText) {
      addAIAnalysisLog(`❌ API返回数据为空`);
      throw new Error('API返回数据为空');
    }

    addAIAnalysisLog(`📥 收到AI响应，长度: ${aiText.length} 字符`);

    // 从AI返回的文本中提取JSON
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      addAIAnalysisLog(`❌ 无法解析JSON，原始内容: ${aiText.substring(0, 100)}...`);
      throw new Error(`无法解析AI返回的JSON。返回内容：${aiText.substring(0, 200)}...`);
    }

    const aiFilledData = JSON.parse(jsonMatch[0]);

    // 记录推导的字段
    const filledFields = aiFilledData._aiFilledFields || [];
    addAIAnalysisLog(`🎯 成功推导 ${filledFields.length} 个字段`);

    // 记录关键字段的推导结果
    if (aiFilledData.businessImpactScore) {
      addAIAnalysisLog(`  └─ 业务影响度: ${aiFilledData.businessImpactScore}分`);
    }
    if (aiFilledData.complexityScore) {
      addAIAnalysisLog(`  └─ 技术复杂度: ${aiFilledData.complexityScore}分`);
    }
    if (aiFilledData.productArea) {
      addAIAnalysisLog(`  └─ 产品领域: ${aiFilledData.productArea}`);
    }
    if (aiFilledData.affectedMetrics && aiFilledData.affectedMetrics.length > 0) {
      addAIAnalysisLog(`  └─ 影响指标: ${aiFilledData.affectedMetrics.map((m: any) => m.displayName).join(', ')}`);
    }

    // 生成唯一ID
    const uniqueId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    aiFilledData.id = uniqueId;

    // 设置默认选中状态
    aiFilledData._isSelected = true;
    aiFilledData._aiAnalysisStatus = 'success';

    return aiFilledData;
  };

  /**
   * 批量AI智能填充
   * 遍历所有导入数据，逐条调用AI分析
   */
  const handleAISmartFill = async () => {
    const {
      setIsAIFillingLoading,
      setAIFillingProgress,
      setAIFillingCurrentIndex,
      setAIFillingCurrentName,
      setAIFilledData,
      setAIFillingCancelled,
      clearAIAnalysisLogs,
      addAIAnalysisLog
    } = useStore.getState();

    // 检查是否有导入数据
    if (!importData || importData.length === 0) {
      setTimeout(() => showToast('请先导入Excel文件', 'error'), 0);
      return;
    }

    // 检查API Key
    const apiKey = selectedAIModel === 'openai' ? OPENAI_API_KEY : DEEPSEEK_API_KEY;
    const modelName = selectedAIModel === 'openai' ? 'OpenAI' : 'DeepSeek';

    if (!apiKey) {
      setTimeout(() => showToast(`AI智能填充功能未配置。请联系管理员在代码中配置 ${modelName} API Key。`, 'error'), 0);
      return;
    }

    // 延迟所有 state 更新，避免立即触发重渲染导致跳转
    await new Promise(resolve => setTimeout(resolve, 0));

    // 重置取消标志和日志
    setAIFillingCancelled(false);
    clearAIAnalysisLogs();
    addAIAnalysisLog(`🚀 开始AI智能填充，共 ${importData.length} 条需求`);
    addAIAnalysisLog(`✨ 使用模型: ${selectedAIModel === 'deepseek' ? 'DeepSeek' : 'OpenAI GPT'}`);
    addAIAnalysisLog(`⏱️ 预计耗时: ${Math.ceil(importData.length * 3 / 60)}分${importData.length * 3 % 60}秒`);
    showToast(`开始AI智能填充，使用 ${modelName} 分析 ${importData.length} 条需求...`, 'info');

    // 准备配置数据
    const productAreas = [
      '管店/固资/物 @张普',
      'toC卖货/导购/AI/培训/营销 @杜玥',
      '管人/SO上报/考勤 @胡馨然',
      'toB进货/交易/返利 @李建国'
    ];

    // 扁平化regions数组
    const flatRegions: string[] = [];
    REGIONS.forEach(region => {
      flatRegions.push(region.name);
      if (region.subRegions) {
        flatRegions.push(...region.subRegions);
      }
      if (region.countries) {
        flatRegions.push(...region.countries);
      }
    });

    const config = {
      okrMetrics: OKR_METRICS,
      processMetrics: PROCESS_METRICS,
      scoringStandards: SCORING_STANDARDS,
      complexityStandards: COMPLEXITY_STANDARDS,
      businessDomains: Array.from(BUSINESS_DOMAINS),
      requirementTypes: Array.from(REQUIREMENT_TYPES),
      regions: flatRegions,
      storeTypes: Array.from(STORE_TYPES),
      productAreas,
      timeCriticalityOptions: Array.from(TIME_CRITICALITY)
    };

    // 开始分析
    setIsAIFillingLoading(true);
    setAIFillingProgress(0);
    const totalCount = importData.length;
    const filledResults: any[] = [];

    try {
      for (let i = 0; i < totalCount; i++) {
        // 检查是否被取消
        const { aiFillingCancelled, addAIAnalysisLog: log } = useStore.getState();
        if (aiFillingCancelled) {
          log(`⏹️ 用户手动终止分析`);

          // 移除持久的"正在终止"提示
          if (terminationToastIdRef.current !== null) {
            dismissToast(terminationToastIdRef.current);
            terminationToastIdRef.current = null;
          }

          // 显示终止详情，使用更长的显示时间（6秒）
          showToast(`⚠️ AI分析已终止！已完成：${i}条，未完成：${totalCount - i}条。已分析的数据已保存，您可以查看结果。`, 'info', { duration: 6000 });
          break;
        }

        const rawRow = importData[i];

        // 提取需求名称用于显示进度
        let requirementName = rawRow['需求名称'] || rawRow['name'] || rawRow['需求'] || `需求${i + 1}`;
        if (typeof requirementName !== 'string') {
          requirementName = String(requirementName);
        }

        // 更新进度
        setAIFillingCurrentIndex(i);
        setAIFillingCurrentName(requirementName);
        setAIFillingProgress(Math.round(((i) / totalCount) * 100));

        log(`\n━━━━━ 第 ${i + 1}/${totalCount} 条 ━━━━━`);
        log(`📋 需求名称: ${requirementName}`);

        try {
          // 调用AI分析
          const filledData = await analyzeRequirementWithAI(rawRow, config, selectedAIModel);
          filledResults.push(filledData);
          log(`✅ 分析完成`);
        } catch (error) {
          console.error(`分析需求 "${requirementName}" 失败:`, error);
          log(`❌ 分析失败: ${error instanceof Error ? error.message : '未知错误'}`);

          // 创建失败记录，保留原始数据
          const failedData: any = {
            id: `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: requirementName,
            description: JSON.stringify(rawRow),
            submitterName: '',
            submitDate: new Date().toISOString().split('T')[0],
            submitter: '产品',
            businessTeam: '',
            businessDomain: '新零售',
            type: '功能开发',
            effortDays: 5,
            productManager: '',
            developer: '',
            productProgress: '待评估',
            techProgress: '未评估',
            hardDeadline: false,
            isRMS: false,
            _aiAnalysisStatus: 'failed',
            _aiErrorMessage: error instanceof Error ? error.message : '未知错误',
            _isSelected: false
          };

          filledResults.push(failedData);
        }

        // 每条之间延迟100ms，避免API限流
        if (i < totalCount - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // 分析完成
      setAIFilledData(filledResults);
      setAIFillingProgress(100);

      const successCount = filledResults.filter(r => r._aiAnalysisStatus === 'success').length;
      const failedCount = filledResults.filter(r => r._aiAnalysisStatus === 'failed').length;

      // 移除持久的"正在终止"提示（如果还存在）
      if (terminationToastIdRef.current !== null) {
        dismissToast(terminationToastIdRef.current);
        terminationToastIdRef.current = null;
      }

      // 显示完成总结，使用更长的显示时间（6秒）
      showToast(`AI智能填充完成！✅ 成功: ${successCount} 条，❌ 失败: ${failedCount} 条。请在预览表格中检查结果。`, 'success', { duration: 6000 });
    } catch (error) {
      console.error('AI智能填充过程中发生错误:', error);
      showToast(`AI智能填充失败：${error instanceof Error ? error.message : '未知错误'}`, 'error');
    } finally {
      setIsAIFillingLoading(false);
    }
  };

  /**
   * 确认导入数据
   */
  const handleConfirmImport = () => {
    const { aiFilledData: currentAIFilledData, setAIFilledData } = useStore.getState();

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
          const cleaned: any = { ...req };
          // 删除所有_开头的元数据字段
          Object.keys(cleaned).forEach(key => {
            if (key.startsWith('_')) {
              delete cleaned[key];
            }
          });
          return cleaned as Requirement;
        });

        // 计算WSJF分数（传入整个数组）
        const scoredRequirements = calculateScores(cleanedRequirements);

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
          setUnscheduled([...unscheduled, ...scoredRequirements]);
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
        const validTechProgress = ['未评估', '已评估工作量', '已完成技术方案'];
        let finalTechProgress = validTechProgress.includes(mapped.techProgress)
          ? mapped.techProgress
          : (effortDays > 0 ? '已评估工作量' : '未评估');

        // 如果映射的是有效的"未评估"但有工作量数据，自动升级
        if (effortDays > 0 && finalTechProgress === '未评估') {
          finalTechProgress = '已评估工作量';
        }

        // 验证业务影响度
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
          '业务影响度': req.bv,
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
        '业务影响度': req.bv,
        '迫切程度': req.tc,
        '强制DDL': req.hardDeadline ? '是' : '否',
        '权重分': req.displayScore || 0,
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
    // console.log('[ImportPreviewModal] 组件渲染, showImportModal:', showImportModal, 'importData.length:', importData.length);
    if (!showImportModal || importData.length === 0) return null;

    // 从Store获取AI填充相关状态和滚动位置
    const {
      isAIFillingLoading,
      aiFillingProgress,
      aiFillingCurrentIndex,
      aiFillingCurrentName,
      aiFilledData,
      selectedRequirementIndex,
      setSelectedRequirementIndex,
      aiAnalysisLogs,
      importModalScrollTop,
      setImportModalScrollTop,
      isRestoringImportModalScroll,
      setIsRestoringImportModalScroll
    } = useStore();

    const sampleRow = importData[0];
    const fileFields = Object.keys(sampleRow);

    // 滚动位置管理
    const modalContentRef = React.useRef<HTMLDivElement>(null);
    const aiProgressBoxRef = React.useRef<HTMLDivElement>(null); // AI进度框ref
    const logContainerRef = React.useRef<HTMLDivElement>(null); // 日志容器ref
    const fieldMappingRef = React.useRef<HTMLDivElement>(null); // 字段映射配置ref
    const hasAutoScrolled = React.useRef<boolean>(false); // 是否已经自动滚动过（防止重复滚动）
    // isRestoringScroll 已移到全局state，防止组件remount时丢失

    // 终止分析确认对话框状态
    const [showTerminateConfirm, setShowTerminateConfirm] = React.useState(false);

    // 滚动到AI进度框
    const scrollToAIProgress = () => {
      if (aiProgressBoxRef.current && modalContentRef.current) {
        const boxTop = aiProgressBoxRef.current.offsetTop;
        const scrollTop = boxTop - 100; // 考虑标题栏高度
        setImportModalScrollTop(scrollTop); // 更新保存的位置到全局状态
        modalContentRef.current.scrollTo({
          top: scrollTop,
          behavior: 'smooth'
        });
      }
    };

    // 监听滚动事件，实时保存滚动位置到全局状态
    React.useEffect(() => {
      const elem = modalContentRef.current;
      if (!elem) return;

      const saveScroll = () => {
        const { isRestoringImportModalScroll: restoring, importModalScrollTop: currentPos, setImportModalScrollTop } = useStore.getState();

        // 🚫 防止在恢复滚动过程中保存滚动位置
        if (restoring) {
          // console.log('[Scroll Event] ⏸️ 跳过保存（正在恢复滚动）');
          return;
        }

        const newScroll = elem.scrollTop;
        // 只在变化超过5px时保存，减少不必要的state更新
        if (Math.abs(newScroll - currentPos) > 5) {
          // console.log('[Scroll Event] 保存新位置:', newScroll);
          setImportModalScrollTop(newScroll);
        }
      };

      elem.addEventListener('scroll', saveScroll, { passive: true });

      return () => {
        elem.removeEventListener('scroll', saveScroll);
      };
    }, []); // ✅ 空依赖数组，避免重复添加监听器

    // 关键修复：使用 useLayoutEffect 在浏览器绘制之前同步恢复滚动位置
    // 使用全局状态确保滚动位置不会因为组件重新渲染而丢失
    React.useLayoutEffect(() => {
      const elem = modalContentRef.current;
      if (!elem) return;

      const currentScroll = elem.scrollTop;
      const targetScroll = importModalScrollTop;

      // 只在真正需要恢复且不在恢复过程中时才执行
      if (targetScroll > 0 && currentScroll !== targetScroll && !isRestoringImportModalScroll) {
        // console.log('[useLayoutEffect] 🔄 恢复滚动位置从', currentScroll, '到', targetScroll);

        // 🔒 设置全局标志，防止滚动事件监听器保存中间状态
        setIsRestoringImportModalScroll(true);

        // 强制恢复滚动位置
        elem.scrollTop = targetScroll;

        // 双重保护：在下一帧再次检查并恢复，然后解锁
        requestAnimationFrame(() => {
          if (elem && elem.scrollTop !== targetScroll) {
            // console.log('[useLayoutEffect RAF] 再次恢复从', elem.scrollTop, '到', targetScroll);
            elem.scrollTop = targetScroll;
          }

          // 🔓 恢复完成，允许滚动事件监听器保存新的滚动位置
          setTimeout(() => {
            setIsRestoringImportModalScroll(false);
            // console.log('[useLayoutEffect] ✅ 滚动恢复完成，解除锁定');
          }, 100);
        });
      }
    }, [importModalScrollTop]); // ✅ 只依赖importModalScrollTop，避免循环触发

    // 日志更新时，仅在日志容器内部滚动到底部，不影响页面
    React.useEffect(() => {
      if (logContainerRef.current && aiAnalysisLogs.length > 0) {
        logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
      }
    }, [aiAnalysisLogs]);

    // 方式二：AI智能填充开始时，自动滚动到进度框（只滚动一次）
    React.useEffect(() => {
      if (isAIFillingLoading && aiProgressBoxRef.current && !hasAutoScrolled.current) {
        hasAutoScrolled.current = true;
        // 延迟滚动，确保进度框已渲染
        setTimeout(() => scrollToAIProgress(), 100);
      }
      // 当加载结束时重置标志
      if (!isAIFillingLoading) {
        hasAutoScrolled.current = false;
      }
    }, [isAIFillingLoading]);

    // 系统字段选项
    const systemFieldOptions = [
      { value: '', label: '-- 不映射 --' },
      { value: 'name', label: '需求名称 *' },
      { value: 'submitterName', label: '提交人姓名' },
      { value: 'productManager', label: '产品经理' },
      { value: 'developer', label: '开发人员' },
      { value: 'effortDays', label: '工作量(天数)' },
      { value: 'bv', label: '业务影响度' },
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
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onScroll={(e) => {
          console.log('[Modal外层] 滚动事件触发！scrollTop:', e.currentTarget.scrollTop);
        }}
      >
        <div
          className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => {
            console.log('[Modal窗口] 点击事件, target:', e.target);
          }}
        >
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
          <div
            key="import-modal-content-stable"
            ref={modalContentRef}
            className="flex-1 overflow-y-auto p-6"
            style={{ overscrollBehavior: 'contain' }}
            onScroll={(e) => {
              e.stopPropagation();
            }}
          >
            {/* 统计信息 + AI模型选择（紧凑布局） */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <FileSpreadsheet className="text-white" size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      检测到 {importData.length} 条记录，共 {fileFields.length} 个字段
                    </p>
                    <p className="text-xs text-gray-600">请选择AI模型和导入方式</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="text-purple-600" size={16} />
                  <select
                    value={selectedAIModel}
                    onChange={(e) => setSelectedAIModel(e.target.value as AIModelType)}
                    className="px-3 py-2 border-2 border-purple-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    disabled={isAIMappingLoading || isAIFillingLoading}
                  >
                    <option value="deepseek">🇨🇳 DeepSeek</option>
                    <option value="openai">🌍 OpenAI</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 两种AI功能对比卡片 */}
            <div className="mb-6 grid grid-cols-2 gap-4">
              {/* 方式一：AI智能映射（快速） */}
              <div className="border-2 border-purple-200 rounded-xl p-5 bg-gradient-to-br from-purple-50 to-white hover:shadow-lg transition-shadow relative overflow-hidden">
                {/* 推荐标签 - 当有字段映射时推荐方式一 */}
                {Object.values(importMapping).some(v => v !== '') && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-orange-400 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg shadow-md">
                    🔥 推荐
                  </div>
                )}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ArrowUpDown className="text-white" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 mb-1">方式一：AI智能映射</h3>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                      ⚡ 快速 | 💰 省钱
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">📌 功能说明：</p>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      只分析Excel<span className="font-semibold text-purple-600">列名</span>，自动匹配到系统字段
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">✅ 适用场景：</p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li className="flex items-start gap-1">
                        <span className="text-purple-500 mt-0.5">•</span>
                        <span>Excel列名<span className="font-semibold">规范清晰</span></span>
                      </li>
                      <li className="flex items-start gap-1">
                        <span className="text-purple-500 mt-0.5">•</span>
                        <span>只需要映射<span className="font-semibold">基础字段</span>（名称、人员、日期等）</span>
                      </li>
                      <li className="flex items-start gap-1">
                        <span className="text-purple-500 mt-0.5">•</span>
                        <span>数据量大，希望<span className="font-semibold">快速导入</span></span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-purple-100 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-800 mb-1">📊 举例：</p>
                    <div className="text-xs text-purple-700 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono bg-white px-2 py-0.5 rounded">Excel列："需求名称"</span>
                        <span>→</span>
                        <span className="font-mono bg-purple-200 px-2 py-0.5 rounded">系统字段：name</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono bg-white px-2 py-0.5 rounded">Excel列："工作量"</span>
                        <span>→</span>
                        <span className="font-mono bg-purple-200 px-2 py-0.5 rounded">系统字段：effortDays</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                    <p className="text-xs text-yellow-800">
                      ⚠️ <span className="font-semibold">不支持</span>智能推导复杂字段（如业务影响度评分、影响的指标等）
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // 立即保存当前滚动位置到全局状态（同步）
                    if (modalContentRef.current) {
                      const scroll = modalContentRef.current.scrollTop;
                      console.log('[方式一点击] 保存滚动位置:', scroll);
                      setImportModalScrollTop(scroll);
                    }
                    handleAIMapping();
                  }}
                  disabled={isAIMappingLoading || isAIFillingLoading}
                  className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition flex items-center justify-center gap-2 font-medium shadow-md"
                >
                  {isAIMappingLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>映射中...</span>
                    </>
                  ) : (
                    <>
                      <ArrowUpDown size={18} />
                      <span>开始智能映射（1秒完成）</span>
                    </>
                  )}
                </button>
              </div>

              {/* 方式二：AI智能填充（深度） */}
              <div className="border-2 border-blue-300 rounded-xl p-5 bg-gradient-to-br from-blue-50 to-white hover:shadow-xl transition-shadow relative overflow-hidden">
                {/* 推荐标签 - 当没有字段映射时推荐方式二 */}
                {!Object.values(importMapping).some(v => v !== '') && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-orange-400 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg shadow-md">
                    🔥 推荐
                  </div>
                )}

                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                    <Sparkles className="text-white animate-pulse" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 mb-1">方式二：AI智能填充</h3>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      🧠 智能 | 🎯 精准
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">📌 功能说明：</p>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      深度分析<span className="font-semibold text-blue-600">每条需求内容</span>，智能推导<span className="font-semibold text-blue-600">30+复杂字段</span>
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">✅ 适用场景：</p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li className="flex items-start gap-1">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>Excel数据<span className="font-semibold">混乱不规范</span>（如单列包含多信息）</span>
                      </li>
                      <li className="flex items-start gap-1">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>需要AI<span className="font-semibold">智能评分</span>（业务影响度、技术复杂度）</span>
                      </li>
                      <li className="flex items-start gap-1">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>需要推导<span className="font-semibold">影响的指标、区域、门店类型</span>等</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-blue-100 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 mb-1">📊 举例：</p>
                    <div className="text-xs text-blue-700 space-y-1.5">
                      <div className="bg-white rounded p-2">
                        <p className="font-mono mb-1">Excel内容："门店收银系统崩溃 @杜玥 紧急 印度直营店"</p>
                        <p className="text-blue-600">↓ AI智能推导 ↓</p>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <div className="bg-blue-200 px-2 py-1 rounded">产品领域：toC卖货 @杜玥</div>
                        <div className="bg-blue-200 px-2 py-1 rounded">业务影响度：10分（致命）</div>
                        <div className="bg-blue-200 px-2 py-1 rounded">区域：南亚</div>
                        <div className="bg-blue-200 px-2 py-1 rounded">门店类型：新零售-直营店</div>
                        <div className="bg-blue-200 px-2 py-1 rounded">时间窗口：一月硬窗口</div>
                        <div className="bg-blue-200 px-2 py-1 rounded">影响指标：GMV/营收</div>
                      </div>
                      <p className="text-blue-600 font-semibold">...等30+字段</p>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                    <p className="text-xs text-green-800">
                      💡 <span className="font-semibold">推荐</span>：数据复杂时使用，让AI帮您完成繁琐的字段填写
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // 立即保存当前滚动位置到全局状态（同步）
                    if (modalContentRef.current) {
                      const scroll = modalContentRef.current.scrollTop;
                      console.log('[方式二点击] 保存滚动位置:', scroll);
                      setImportModalScrollTop(scroll);
                    }
                    // 开始AI智能填充，自动滚动会由useEffect触发
                    handleAISmartFill();
                  }}
                  disabled={isAIMappingLoading || isAIFillingLoading}
                  title="☕ 用一次这个功能，记得请 Evan 喝一杯咖啡哦~ (tianyuan8@xiaomi.com)"
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-lg transition flex items-center justify-center gap-2 font-medium shadow-lg"
                >
                  {isAIFillingLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>深度分析中...{aiFillingProgress}%</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} className="animate-pulse" />
                      <span>开始智能填充（预计{Math.ceil(importData.length * 3 / 60)}分{importData.length * 3 % 60}秒）</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* AI填充进度显示 */}
            {isAIFillingLoading && (
              <div ref={aiProgressBoxRef} className="mb-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-2 border-blue-400 rounded-xl p-6 shadow-2xl">
                {/* 标题栏 + 统计信息（整合） */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center animate-pulse shadow-lg">
                        <Sparkles className="text-white" size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                          <Sparkles className="text-purple-600" size={20} />
                          AI深度分析中
                        </h3>
                        <p className="text-xs text-gray-600">正在智能推导30+字段，请稍候...</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* 紧凑统计 */}
                      <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm border border-gray-200">
                        <span className="text-xs text-gray-600">总数</span>
                        <span className="text-sm font-bold text-gray-900">{importData.length}</span>
                        <span className="text-gray-300">|</span>
                        <span className="text-xs text-green-700">已完成</span>
                        <span className="text-sm font-bold text-green-600">{aiFillingCurrentIndex}</span>
                        <span className="text-gray-300">|</span>
                        <span className="text-xs text-orange-700">剩余</span>
                        <span className="text-sm font-bold text-orange-600">{importData.length - aiFillingCurrentIndex}</span>
                        <span className="text-gray-300">|</span>
                        <span className="text-xs text-purple-700">预计</span>
                        <span className="text-sm font-bold text-purple-600">
                          {Math.ceil((importData.length - aiFillingCurrentIndex) * 3 / 60)}分钟
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // 立即保存当前滚动位置到全局状态（同步）
                          if (modalContentRef.current) {
                            setImportModalScrollTop(modalContentRef.current.scrollTop);
                          }
                          setShowTerminateConfirm(true);
                        }}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition flex items-center gap-2 font-medium shadow-md"
                      >
                        <X size={16} />
                        <span>终止分析</span>
                      </button>
                    </div>
                  </div>

                  {/* 进度条 */}
                  <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden shadow-inner relative">
                    <div
                      className="bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 h-full transition-all duration-500 flex items-center justify-end pr-2 relative"
                      style={{ width: `${aiFillingProgress}%` }}
                    >
                      {aiFillingProgress > 10 && (
                        <span className="text-white text-xs font-bold drop-shadow">{aiFillingProgress}%</span>
                      )}
                      {/* 流动动画 */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                    </div>
                  </div>
                </div>

                {/* 当前分析的需求名称 */}
                <div className="bg-blue-100 rounded-lg p-3 border-l-4 border-blue-600 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center animate-bounce">
                      <span className="text-white font-bold text-xs">#{aiFillingCurrentIndex + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-blue-700 mb-0.5">🔍 正在深度分析</p>
                      <p className="text-sm font-bold text-blue-900 truncate">{aiFillingCurrentName}</p>
                    </div>
                  </div>
                </div>

                {/* AI分析详细日志 */}
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <h4 className="text-sm font-bold text-green-400">🔍 AI推导过程实时日志</h4>
                    </div>
                    <span className="text-xs text-gray-500">
                      显示最近 {Math.min(aiAnalysisLogs.length, 20)} 条
                    </span>
                  </div>
                  <div ref={logContainerRef} className="bg-black rounded p-3 h-64 overflow-y-auto font-mono text-xs space-y-1 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
                    {aiAnalysisLogs.length === 0 ? (
                      <p className="text-gray-600 text-center py-8">暂无日志...</p>
                    ) : (
                      aiAnalysisLogs.slice(-20).map((log, index) => (
                        <div key={index} className={`
                          ${log.includes('❌') ? 'text-red-400' : ''}
                          ${log.includes('✅') || log.includes('成功') ? 'text-green-400' : ''}
                          ${log.includes('⏳') || log.includes('等待') ? 'text-yellow-400' : ''}
                          ${log.includes('📋') || log.includes('━━━') ? 'text-blue-400 font-bold' : ''}
                          ${log.includes('  └─') ? 'text-purple-300 pl-4' : ''}
                          ${!log.includes('❌') && !log.includes('✅') && !log.includes('⏳') && !log.includes('📋') && !log.includes('━━━') && !log.includes('└─') ? 'text-gray-300' : ''}
                        `}>
                          <span className="text-gray-600">[{new Date().toLocaleTimeString()}]</span> {log}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 提示信息 */}
                <div className="mt-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-300 rounded-lg p-3">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">💡</span>
                    <div className="flex-1 text-xs text-yellow-900 space-y-1">
                      <p className="font-semibold">温馨提示：</p>
                      <ul className="list-disc list-inside space-y-0.5 text-yellow-800">
                        <li>AI分析需要一定时间，请耐心等待，不要关闭页面</li>
                        <li>上方日志实时展示AI的推导过程，让您了解每个字段是如何被推导出来的</li>
                        <li>如需终止分析，点击右上角红色"终止分析"按钮</li>
                        <li>已分析的数据会被保留，失败的需求会标记为红色</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 根据是否有AI填充数据切换显示内容 */}
            {aiFilledData.length > 0 ? (
              /* === AI填充后的数据预览表格 === */
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Sparkles className="text-purple-600" size={18} />
                    AI智能填充结果预览
                  </h3>
                  <span className="text-sm text-gray-600">
                    ✅ {aiFilledData.filter(r => r._aiAnalysisStatus === 'success').length} 成功 |
                    ❌ {aiFilledData.filter(r => r._aiAnalysisStatus === 'failed').length} 失败
                  </span>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    💡 提示：请检查AI填充的数据，勾选需要导入的需求。失败的需求已标记为红色，您可以取消勾选或手动修正后再导入。
                  </p>
                </div>

                <div className="border border-gray-200 rounded-lg overflow-auto max-h-96">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left w-12">
                          <input
                            type="checkbox"
                            checked={aiFilledData.every(r => r._isSelected)}
                            onChange={(e) => {
                              const { setAIFilledData } = useStore.getState();
                              const updated = aiFilledData.map(r => ({
                                ...r,
                                _isSelected: e.target.checked
                              }));
                              setAIFilledData(updated);
                            }}
                            className="w-4 h-4 rounded"
                          />
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">状态</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">需求名称</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">业务影响度</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">技术复杂度</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">产品领域</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">工作量</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">AI字段数</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aiFilledData.map((req, index) => {
                        const isSuccess = req._aiAnalysisStatus === 'success';
                        const aiFieldCount = req._aiFilledFields?.length || 0;

                        return (
                          <tr
                            key={index}
                            className={`border-t border-gray-200 cursor-pointer hover:bg-gray-50 ${
                              !isSuccess ? 'bg-red-50' : ''
                            } ${selectedRequirementIndex === index ? 'bg-blue-100' : ''}`}
                            onClick={() => setSelectedRequirementIndex(index)}
                          >
                            <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={req._isSelected || false}
                                onChange={(e) => {
                                  const { setAIFilledData } = useStore.getState();
                                  const updated = [...aiFilledData];
                                  updated[index] = { ...updated[index], _isSelected: e.target.checked };
                                  setAIFilledData(updated);
                                }}
                                className="w-4 h-4 rounded"
                              />
                            </td>
                            <td className="px-3 py-2">
                              {isSuccess ? (
                                <span className="text-green-600 font-semibold">✅ 成功</span>
                              ) : (
                                <span className="text-red-600 font-semibold" title={req._aiErrorMessage}>
                                  ❌ 失败
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 font-medium text-gray-800 max-w-xs truncate">
                              {req.name}
                            </td>
                            <td className="px-3 py-2">
                              {req.businessImpactScore ? (
                                <span className="inline-flex items-center gap-1">
                                  <span className="font-semibold text-blue-600">{req.businessImpactScore}分</span>
                                  {req._aiFilledFields?.includes('businessImpactScore') && (
                                    <Sparkles size={12} className="text-purple-500" />
                                  )}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="px-3 py-2">
                              {req.complexityScore ? (
                                <span className="inline-flex items-center gap-1">
                                  <span className="font-semibold text-orange-600">{req.complexityScore}分</span>
                                  {req._aiFilledFields?.includes('complexityScore') && (
                                    <Sparkles size={12} className="text-purple-500" />
                                  )}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="px-3 py-2 text-gray-600 max-w-xs truncate">
                              {req.productArea || '-'}
                            </td>
                            <td className="px-3 py-2 text-gray-600">
                              {req.effortDays || 0}天
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className="text-purple-600 font-semibold cursor-help flex items-center gap-1"
                                title={req._aiFilledFields?.map(f => FIELD_NAME_MAP[f] || f).join('、') || '无AI填充字段'}
                              >
                                <Sparkles size={14} className="text-purple-600" />
                                {aiFieldCount}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 选中需求的详细信息 - 完整展示所有字段和值 */}
                {selectedRequirementIndex !== null && aiFilledData[selectedRequirementIndex] && (
                  <div className="mt-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                        <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">
                          {selectedRequirementIndex + 1}
                        </span>
                        需求详情预览 - 完整信息
                      </h4>
                      <button
                        onClick={() => setSelectedRequirementIndex(null)}
                        className="text-blue-600 hover:text-blue-800 transition"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    {(() => {
                      const req = aiFilledData[selectedRequirementIndex];
                      const aiFilledFields = req._aiFilledFields || [];
                      const basicFields = ['name', 'description', 'submitterName', 'submitDate', 'submitter', 'businessTeam'];
                      const businessFields = ['businessImpactScore', 'affectedMetrics', 'impactScope', 'businessDomain', 'customBusinessDomain'];
                      const timeFields = ['timeCriticality', 'hardDeadline', 'deadlineDate'];
                      const techFields = ['effortDays', 'complexityScore', 'type', 'productManager', 'developer', 'productProgress', 'techProgress', 'dependencies', 'isRMS'];
                      const extendedFields = ['project', 'productArea', 'backendDeveloper', 'frontendDeveloper', 'tester', 'rdNotes'];

                      // 计算字段统计
                      const allFieldKeys = [...basicFields, ...businessFields, ...timeFields, ...techFields, ...extendedFields];
                      const totalFieldsCount = allFieldKeys.filter(key => {
                        const value = (req as any)[key];
                        return value !== undefined && value !== null && value !== '' && (!Array.isArray(value) || value.length > 0);
                      }).length;
                      const aiFilledCount = aiFilledFields.length;
                      const directMatchedCount = totalFieldsCount - aiFilledCount;

                      // 定义字段分组和显示逻辑
                      const renderField = (fieldKey: string, fieldValue: any) => {
                        // 跳过元数据字段和空值
                        if (fieldKey.startsWith('_') || fieldKey === 'id') return null;
                        if (fieldValue === undefined || fieldValue === null || fieldValue === '' ||
                            (Array.isArray(fieldValue) && fieldValue.length === 0)) return null;

                        const isAIFilled = aiFilledFields.includes(fieldKey);
                        const fieldLabel = FIELD_NAME_MAP[fieldKey] || fieldKey;

                        // 格式化字段值
                        let displayValue: string;
                        if (Array.isArray(fieldValue)) {
                          if (fieldKey === 'affectedMetrics') {
                            displayValue = fieldValue.map((m: any) => m.displayName || m.metricName).join('、');
                          } else if (fieldKey === 'dependencies') {
                            displayValue = fieldValue.join('、');
                          } else {
                            displayValue = fieldValue.join('、');
                          }
                        } else if (typeof fieldValue === 'object') {
                          if (fieldKey === 'impactScope') {
                            const parts = [];
                            if (fieldValue.storeTypes?.length) parts.push(`门店类型: ${fieldValue.storeTypes.join('、')}`);
                            if (fieldValue.regions?.length) parts.push(`区域: ${fieldValue.regions.join('、')}`);
                            if (fieldValue.storeCountRange) parts.push(`门店数: ${fieldValue.storeCountRange}`);
                            displayValue = parts.join(' | ');
                          } else {
                            displayValue = JSON.stringify(fieldValue);
                          }
                        } else if (typeof fieldValue === 'boolean') {
                          displayValue = fieldValue ? '是' : '否';
                        } else {
                          displayValue = String(fieldValue);
                        }

                        return (
                          <div key={fieldKey} className="flex items-start gap-2 py-1.5 border-b border-gray-200 last:border-0">
                            <div className="flex items-center gap-1 min-w-[100px]">
                              {isAIFilled && <Sparkles size={12} className="text-purple-600 flex-shrink-0" />}
                              <span className={`text-xs font-semibold ${isAIFilled ? 'text-purple-700' : 'text-gray-700'}`}>
                                {fieldLabel}:
                              </span>
                            </div>
                            <div className="flex-1 text-xs text-gray-900 break-words">
                              {displayValue}
                            </div>
                          </div>
                        );
                      };

                      return (
                        <>
                          {/* 字段统计信息 */}
                          <div className="mb-2 px-2 py-1.5 bg-white/60 rounded text-xs text-gray-700 flex items-center gap-3">
                            <span className="font-semibold">共 {totalFieldsCount} 个字段</span>
                            <span className="text-gray-400">|</span>
                            <span className="text-green-700">{directMatchedCount} 个直接匹配</span>
                            <span className="text-gray-400">|</span>
                            <span className="text-purple-700 flex items-center gap-1">
                              <Sparkles size={10} className="text-purple-600" />
                              {aiFilledCount} 个AI推导
                            </span>
                            <span className="text-gray-400">|</span>
                            <span className="text-orange-600 font-medium">请仔细核对</span>
                          </div>

                          <div className="space-y-3 text-xs max-h-[500px] overflow-y-auto">
                          {/* 基本信息 */}
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <h5 className="font-bold text-blue-800 mb-2 flex items-center gap-1">
                              <span className="w-1 h-4 bg-blue-600 rounded"></span>
                              基本信息
                            </h5>
                            {basicFields.map(field => renderField(field, (req as any)[field]))}
                          </div>

                          {/* 业务影响度 */}
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <h5 className="font-bold text-blue-800 mb-2 flex items-center gap-1">
                              <span className="w-1 h-4 bg-blue-600 rounded"></span>
                              业务影响度
                            </h5>
                            {businessFields.map(field => renderField(field, (req as any)[field]))}
                          </div>

                          {/* 时间维度 */}
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <h5 className="font-bold text-blue-800 mb-2 flex items-center gap-1">
                              <span className="w-1 h-4 bg-orange-600 rounded"></span>
                              时间维度
                            </h5>
                            {timeFields.map(field => renderField(field, (req as any)[field]))}
                          </div>

                          {/* 技术信息 */}
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <h5 className="font-bold text-blue-800 mb-2 flex items-center gap-1">
                              <span className="w-1 h-4 bg-green-600 rounded"></span>
                              技术信息
                            </h5>
                            {techFields.map(field => renderField(field, (req as any)[field]))}
                          </div>

                          {/* 产研扩展 */}
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <h5 className="font-bold text-blue-800 mb-2 flex items-center gap-1">
                              <span className="w-1 h-4 bg-purple-600 rounded"></span>
                              产研扩展
                            </h5>
                            {extendedFields.map(field => renderField(field, (req as any)[field]))}
                          </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            ) : (
              /* === 原有的字段映射配置 === */
              <>
                <div ref={fieldMappingRef} className="mb-6">
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
              </>
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
                disabled={aiFilledData.length > 0 ? aiFilledData.filter(r => r._isSelected).length === 0 : !hasRequiredFields}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 disabled:text-gray-500 text-white rounded-lg transition font-medium flex items-center gap-2"
              >
                <Save size={18} />
                {aiFilledData.length > 0
                  ? `确认导入 (已选${aiFilledData.filter(r => r._isSelected).length}/${aiFilledData.length} 条)`
                  : `确认导入 (${importData.length} 条)`}
              </button>
            </div>
          </div>
        </div>

        {/* 终止分析确认对话框 */}
        {showTerminateConfirm && (
          <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-[slideIn_0.3s_ease-out]">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="text-red-600" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">确定要终止AI分析吗？</h3>
                  <p className="text-sm text-gray-600">此操作无法撤销</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span className="text-gray-700">已分析 <strong className="text-green-700">{aiFillingCurrentIndex}</strong> 条需求的数据将会保留</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-orange-600">⚠</span>
                  <span className="text-gray-700">剩余 <strong className="text-orange-700">{importData.length - aiFillingCurrentIndex}</strong> 条需求将不会分析</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-600">✗</span>
                  <span className="text-gray-700">终止后 <strong className="text-red-700">无法恢复</strong>，需要重新开始</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // 立即保存当前滚动位置到全局状态（同步）
                    if (modalContentRef.current) {
                      setImportModalScrollTop(modalContentRef.current.scrollTop);
                    }
                    setShowTerminateConfirm(false);
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition font-medium"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // 立即保存当前滚动位置到全局状态（同步）
                    if (modalContentRef.current) {
                      setImportModalScrollTop(modalContentRef.current.scrollTop);
                    }
                    useStore.getState().setAIFillingCancelled(true);
                    setShowTerminateConfirm(false);

                    // 显示持久化的"正在终止"提示，存储toast ID以便后续手动移除
                    const toastId = showToast('⏹️ 正在终止AI分析，请稍候...', 'info', { persistent: true });
                    terminationToastIdRef.current = toastId;
                  }}
                  className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition font-medium shadow-md"
                >
                  确定终止
                </button>
              </div>
            </div>
          </div>
        )}
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
                <span>业务影响度</span>
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

      {/* Toast通知容器 - 屏幕中央顶部 */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              px-6 py-4 rounded-lg shadow-2xl border-2 min-w-[400px] max-w-2xl
              animate-[slideIn_0.3s_ease-out]
              flex items-start gap-3
              ${
                toast.type === 'success'
                  ? 'bg-green-50 border-green-500 text-green-900'
                  : toast.type === 'error'
                  ? 'bg-red-50 border-red-500 text-red-900'
                  : 'bg-blue-50 border-blue-500 text-blue-900'
              }
            `}
          >
            <div className="flex-shrink-0 text-2xl">
              {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}
            </div>
            <div className="flex-1 text-sm font-medium leading-relaxed">
              {toast.message}
            </div>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="flex-shrink-0 text-gray-500 hover:text-gray-700 transition"
            >
              <X size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}