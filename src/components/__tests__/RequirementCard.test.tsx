/**
 * WSJF Sprint Planner - RequirementCard 组件单元测试
 *
 * 测试需求卡片组件的渲染和交互功能
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import RequirementCard from '../RequirementCard';
import type { Requirement } from '../../types';

// 创建测试用的需求数据
const createMockRequirement = (overrides: Partial<Requirement> = {}): Requirement => ({
  id: 'REQ-001',
  name: '测试需求',
  submitterName: '张三',
  productManager: '李四',
  developer: '王五',
  productProgress: '设计中',
  effortDays: 5,
  bv: '明显',
  tc: '随时',
  hardDeadline: false,
  techProgress: '已评估工作量',
  type: '功能开发',
  submitDate: '2025-10-01',
  submitter: '产品',
  isRMS: false,
  businessDomain: '国际零售通用',
  rawScore: 13,
  displayScore: 60,
  stars: 3,
  ...overrides
});

describe('RequirementCard', () => {
  /**
   * 测试：组件正确渲染
   * 验证基本信息是否正确显示
   */
  it('should render requirement information correctly', () => {
    const requirement = createMockRequirement({
      name: '实现用户登录功能',
      effortDays: 10,
      displayScore: 75,
      stars: 4
    });

    render(<RequirementCard requirement={requirement} />);

    // 验证需求名称显示
    expect(screen.getByText('实现用户登录功能')).toBeInTheDocument();

    // 验证工作量显示
    expect(screen.getByText('10天')).toBeInTheDocument();

    // 验证业务域显示
    expect(screen.getByText('国际零售通用')).toBeInTheDocument();

    // 验证热度分显示
    expect(screen.getByText('75')).toBeInTheDocument();
  });

  /**
   * 测试：显示正确的星级
   * 验证星级数量正确
   */
  it('should display correct number of stars', () => {
    const requirement = createMockRequirement({ stars: 5 });

    const { container } = render(<RequirementCard requirement={requirement} />);

    // 查找所有星星图标（lucide-react 的 Star 组件会渲染为 svg）
    const stars = container.querySelectorAll('svg[class*="lucide-star"]');
    expect(stars).toHaveLength(5);
  });

  /**
   * 测试：不同业务价值的卡片颜色
   * 验证不同 BV 值对应不同的视觉样式
   */
  it('should apply different colors based on business value', () => {
    const testCases = [
      { bv: '局部', expectedGradient: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)' },
      { bv: '明显', expectedGradient: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)' },
      { bv: '撬动核心', expectedGradient: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' },
      { bv: '战略平台', expectedGradient: 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 100%)' }
    ];

    testCases.forEach(({ bv, expectedGradient }) => {
      const requirement = createMockRequirement({ bv });
      const { container } = render(<RequirementCard requirement={requirement} />);

      const card = container.querySelector('div[draggable]');
      expect(card).toHaveStyle({ background: expectedGradient });
    });
  });

  /**
   * 测试：强制截止日期的视觉标识
   * 验证 hardDeadline 的红色渐变和感叹号标记
   */
  it('should display red gradient and warning icon for hard deadline', () => {
    const requirement = createMockRequirement({
      hardDeadline: true,
      deadlineDate: '2025-12-31'
    });

    const { container } = render(<RequirementCard requirement={requirement} />);

    // 验证红色渐变背景
    const card = container.querySelector('div[draggable]');
    expect(card).toHaveStyle({
      background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)'
    });

    // 验证感叹号标记显示
    expect(screen.getByText('!')).toBeInTheDocument();
  });

  /**
   * 测试：RMS 标签显示
   * 验证 RMS 需求的紫色标签
   */
  it('should display RMS badge for RMS requirements', () => {
    const requirement = createMockRequirement({ isRMS: true });

    render(<RequirementCard requirement={requirement} />);

    expect(screen.getByText('RMS')).toBeInTheDocument();
  });

  /**
   * 测试：不显示 RMS 标签
   * 验证非 RMS 需求不显示标签
   */
  it('should not display RMS badge for non-RMS requirements', () => {
    const requirement = createMockRequirement({ isRMS: false });

    render(<RequirementCard requirement={requirement} />);

    expect(screen.queryByText('RMS')).not.toBeInTheDocument();
  });

  /**
   * 测试：拖拽功能
   * 验证拖拽事件正确触发
   */
  it('should handle drag events correctly', () => {
    const onDragStart = vi.fn();
    const requirement = createMockRequirement();

    const { container } = render(
      <RequirementCard requirement={requirement} onDragStart={onDragStart} />
    );

    const card = container.querySelector('div[draggable="true"]');
    expect(card).toBeInTheDocument();

    if (card) {
      fireEvent.dragStart(card);
      expect(onDragStart).toHaveBeenCalled();
    }
  });

  /**
   * 测试：点击事件
   * 验证点击事件正确触发
   */
  it('should handle click events correctly', () => {
    const onClick = vi.fn();
    const requirement = createMockRequirement();

    const { container } = render(
      <RequirementCard requirement={requirement} onClick={onClick} />
    );

    const card = container.querySelector('div[draggable]') || container.querySelector('.cursor-pointer');

    if (card) {
      fireEvent.click(card);
      expect(onClick).toHaveBeenCalled();
    }
  });

  /**
   * 测试：紧凑模式
   * 验证紧凑模式下卡片尺寸较小
   */
  it('should apply compact mode correctly', () => {
    const requirement = createMockRequirement({ effortDays: 10 });

    const { container: normalContainer } = render(
      <RequirementCard requirement={requirement} compact={false} />
    );

    const { container: compactContainer } = render(
      <RequirementCard requirement={requirement} compact={true} />
    );

    const normalCard = normalContainer.querySelector('div[draggable]');
    const compactCard = compactContainer.querySelector('div[draggable]');

    // 紧凑模式的卡片应该更小
    const normalWidth = (normalCard as HTMLElement)?.style.width;
    const compactWidth = (compactCard as HTMLElement)?.style.width;

    expect(normalWidth).toBeDefined();
    expect(compactWidth).toBeDefined();

    if (normalWidth && compactWidth) {
      const normalWidthValue = parseFloat(normalWidth);
      const compactWidthValue = parseFloat(compactWidth);
      expect(compactWidthValue).toBeLessThan(normalWidthValue);
    }
  });

  /**
   * 测试：卡片尺寸随工作量变化
   * 验证不同工作量的卡片尺寸不同
   */
  it('should scale card size based on effort days', () => {
    const smallReq = createMockRequirement({ effortDays: 2 });
    const mediumReq = createMockRequirement({ effortDays: 15 });
    const largeReq = createMockRequirement({ effortDays: 50 });

    const { container: smallContainer } = render(
      <RequirementCard requirement={smallReq} />
    );
    const { container: mediumContainer } = render(
      <RequirementCard requirement={mediumReq} />
    );
    const { container: largeContainer } = render(
      <RequirementCard requirement={largeReq} />
    );

    const smallCard = smallContainer.querySelector('div[draggable]');
    const mediumCard = mediumContainer.querySelector('div[draggable]');
    const largeCard = largeContainer.querySelector('div[draggable]');

    const smallWidth = parseFloat((smallCard as HTMLElement)?.style.width || '0');
    const mediumWidth = parseFloat((mediumCard as HTMLElement)?.style.width || '0');
    const largeWidth = parseFloat((largeCard as HTMLElement)?.style.width || '0');

    // 验证卡片尺寸递增
    expect(mediumWidth).toBeGreaterThan(smallWidth);
    expect(largeWidth).toBeGreaterThan(mediumWidth);
  });

  /**
   * 测试：自定义业务域显示
   * 验证自定义业务域正确显示
   */
  it('should display custom business domain correctly', () => {
    const requirement = createMockRequirement({
      businessDomain: '自定义',
      customBusinessDomain: '电商平台'
    });

    render(<RequirementCard requirement={requirement} />);

    expect(screen.getByText('电商平台')).toBeInTheDocument();
  });

  /**
   * 测试：默认值处理
   * 验证缺少分数时使用默认值
   */
  it('should use default values when scores are missing', () => {
    const requirement = createMockRequirement({
      displayScore: undefined,
      stars: undefined
    });

    render(<RequirementCard requirement={requirement} />);

    // 默认 displayScore 应为 60
    expect(screen.getByText('60')).toBeInTheDocument();

    // 默认 stars 应为 2
    const { container } = render(<RequirementCard requirement={requirement} />);
    const stars = container.querySelectorAll('svg[class*="lucide-star"]');
    expect(stars).toHaveLength(2);
  });

  /**
   * 测试：鼠标悬停显示 Tooltip
   * 验证悬停时显示详细信息
   */
  it('should show tooltip on hover when showTooltip is true', () => {
    const requirement = createMockRequirement({
      name: '实现支付功能',
      hardDeadline: true,
      deadlineDate: '2025-11-30',
      isRMS: true
    });

    const { container } = render(
      <RequirementCard requirement={requirement} showTooltip={true} />
    );

    const card = container.querySelector('div[draggable]') || container.querySelector('.cursor-pointer');

    if (card) {
      // 触发鼠标悬停
      fireEvent.mouseEnter(card);

      // 由于 tooltip 使用 fixed 定位，需要在 document 中查找
      // Tooltip 应该包含需求名称
      const tooltip = document.querySelector('.fixed.z-\\[9999\\]');
      expect(tooltip).toBeInTheDocument();
    }
  });

  /**
   * 测试：不显示 Tooltip
   * 验证 showTooltip=false 时不显示提示
   */
  it('should not show tooltip when showTooltip is false', () => {
    const requirement = createMockRequirement();

    const { container } = render(
      <RequirementCard requirement={requirement} showTooltip={false} />
    );

    const card = container.querySelector('div[draggable]') || container.querySelector('.cursor-pointer');

    if (card) {
      fireEvent.mouseEnter(card);

      // Tooltip 不应该出现
      const tooltip = document.querySelector('.fixed.z-\\[9999\\]');
      expect(tooltip).not.toBeInTheDocument();
    }
  });

  /**
   * 测试：卡片可拖拽属性
   * 验证有 onDragStart 时卡片可拖拽
   */
  it('should be draggable when onDragStart is provided', () => {
    const onDragStart = vi.fn();
    const requirement = createMockRequirement();

    const { container } = render(
      <RequirementCard requirement={requirement} onDragStart={onDragStart} />
    );

    const card = container.querySelector('div[draggable="true"]');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('cursor-grab');
  });

  /**
   * 测试：卡片不可拖拽
   * 验证没有 onDragStart 时卡片不可拖拽
   */
  it('should not be draggable when onDragStart is not provided', () => {
    const requirement = createMockRequirement();

    const { container } = render(
      <RequirementCard requirement={requirement} />
    );

    const draggableCard = container.querySelector('div[draggable="true"]');
    expect(draggableCard).not.toBeInTheDocument();
  });

  /**
   * 测试：卡片悬停效果
   * 验证悬停时有放大效果
   */
  it('should have hover scale effect', () => {
    const requirement = createMockRequirement();

    const { container } = render(<RequirementCard requirement={requirement} />);

    const card = container.querySelector('div[draggable]') || container.querySelector('.cursor-pointer');
    expect(card).toHaveClass('hover:scale-105');
  });
});
