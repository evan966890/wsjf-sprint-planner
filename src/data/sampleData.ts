// ============================================================================
// 辅助函数 - 生成示例数据
// ============================================================================

import type { Requirement } from '../types';

/**
 * 生成示例数据用于演示
 * 包含真实的需求数据供新用户参考
 */
export const generateSampleData = (): Requirement[] => {
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
