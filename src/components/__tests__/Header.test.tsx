/**
 * Header 组件单元测试
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Header } from '../Header';

const mockUser = {
  name: 'Test User',
  email: 'test@example.com',
  userId: 'user-123'
};

const defaultProps = {
  currentUser: mockUser,
  compact: false,
  onToggleCompact: vi.fn(),
  onShowHandbook: vi.fn(),
  onFeishuImport: vi.fn(),
  onImport: vi.fn(),
  onExport: vi.fn(),
  onLogout: vi.fn(),
};

describe('Header', () => {
  it('should render app title', () => {
    render(<Header {...defaultProps} />);

    expect(screen.getByText('小米国际 WSJF-Lite Tools')).toBeInTheDocument();
    expect(screen.getByText(/by Evan/i)).toBeInTheDocument();
  });

  it('should display current user info', () => {
    render(<Header {...defaultProps} />);

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('(test@example.com)')).toBeInTheDocument();
  });

  it('should not display user info when not logged in', () => {
    render(<Header {...defaultProps} currentUser={null} />);

    expect(screen.queryByText('Test User')).not.toBeInTheDocument();
  });

  it('should call onShowHandbook when handbook button clicked', () => {
    const onShowHandbook = vi.fn();
    render(<Header {...defaultProps} onShowHandbook={onShowHandbook} />);

    fireEvent.click(screen.getByRole('button', { name: /说明书/i }));

    expect(onShowHandbook).toHaveBeenCalledTimes(1);
  });

  it('should call onToggleCompact when view button clicked', () => {
    const onToggleCompact = vi.fn();
    render(<Header {...defaultProps} onToggleCompact={onToggleCompact} />);

    fireEvent.click(screen.getByRole('button', { name: /紧凑视图/i }));

    expect(onToggleCompact).toHaveBeenCalledTimes(1);
  });

  it('should display "宽松视图" in compact mode', () => {
    render(<Header {...defaultProps} compact={true} />);

    expect(screen.getByText('宽松视图')).toBeInTheDocument();
  });

  it('should display "紧凑视图" in normal mode', () => {
    render(<Header {...defaultProps} compact={false} />);

    expect(screen.getByText('紧凑视图')).toBeInTheDocument();
  });

  it('should call onFeishuImport when feishu import button clicked', () => {
    const onFeishuImport = vi.fn();
    render(<Header {...defaultProps} onFeishuImport={onFeishuImport} />);

    fireEvent.click(screen.getByRole('button', { name: /从飞书导入/i }));

    expect(onFeishuImport).toHaveBeenCalledTimes(1);
  });

  it('should call onImport when import button clicked', () => {
    const onImport = vi.fn();
    render(<Header {...defaultProps} onImport={onImport} />);

    fireEvent.click(screen.getByRole('button', { name: /^导入$/i }));

    expect(onImport).toHaveBeenCalledTimes(1);
  });

  it('should call onExport when export button clicked', () => {
    const onExport = vi.fn();
    render(<Header {...defaultProps} onExport={onExport} />);

    fireEvent.click(screen.getByRole('button', { name: /导出/i }));

    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it('should call onLogout when logout button clicked', () => {
    const onLogout = vi.fn();
    render(<Header {...defaultProps} onLogout={onLogout} />);

    fireEvent.click(screen.getByRole('button', { name: /退出/i }));

    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('should not show logout button when user is null', () => {
    render(<Header {...defaultProps} currentUser={null} />);

    expect(screen.queryByRole('button', { name: /退出/i })).not.toBeInTheDocument();
  });

  it('should display legend items', () => {
    render(<Header {...defaultProps} />);

    expect(screen.getByText('业务影响度')).toBeInTheDocument();
    expect(screen.getByText('强DDL')).toBeInTheDocument();
    expect(screen.getByText('权重')).toBeInTheDocument();
  });
});
