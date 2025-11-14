/**
 * useToast Hook单元测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast } from '../useToast';

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with empty toasts array', () => {
    const { result } = renderHook(() => useToast());

    expect(result.current.toasts).toEqual([]);
  });

  it('should add success toast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('操作成功', 'success');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      message: '操作成功',
      type: 'success'
    });
    expect(result.current.toasts[0].id).toBeDefined();
  });

  it('should add error toast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('操作失败', 'error');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].type).toBe('error');
  });

  it('should add info toast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('提示信息', 'info');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].type).toBe('info');
  });

  it('should add multiple toasts', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('消息1', 'success');
      result.current.showToast('消息2', 'error');
      result.current.showToast('消息3', 'info');
    });

    expect(result.current.toasts).toHaveLength(3);
  });

  it('should dismiss toast by id', () => {
    const { result } = renderHook(() => useToast());

    let toastId: number;

    act(() => {
      toastId = result.current.showToast('测试消息', 'success', { persistent: true });
    });

    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      result.current.dismissToast(toastId);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it('should auto-dismiss toast after default duration', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('自动消失', 'success');
    });

    expect(result.current.toasts).toHaveLength(1);

    // 快进3秒（默认duration）
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it('should not auto-dismiss persistent toast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('不会自动消失', 'success', { persistent: true });
    });

    expect(result.current.toasts).toHaveLength(1);

    // 快进10秒，仍然不消失
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(result.current.toasts).toHaveLength(1);
  });

  it('should support custom duration', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('5秒后消失', 'info', { duration: 5000 });
    });

    expect(result.current.toasts).toHaveLength(1);

    // 快进3秒，还在
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.toasts).toHaveLength(1);

    // 再快进2秒，消失
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.toasts).toHaveLength(0);
  });
});
