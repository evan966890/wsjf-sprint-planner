# 资源管理规范 (Resource Management Standards)

> 本规范总结了React应用中必须遵守的资源管理最佳实践，防止内存泄漏和性能问题。

**版本**: v1.0
**最后更新**: 2025-01-31
**强制执行**: ✅ 必须遵守

---

## 目录

- [1. setTimeout/setInterval 管理](#1-settimeoutsetinterval-管理)
- [2. useEffect 清理函数](#2-useeffect-清理函数)
- [3. 异步操作取消](#3-异步操作取消)
- [4. 事件监听器清理](#4-事件监听器清理)
- [5. requestAnimationFrame 清理](#5-requestanimationframe-清理)
- [6. 资源泄漏检测](#6-资源泄漏检测)

---

## 1. setTimeout/setInterval 管理

### 1.1 基本规则

**问题**: setTimeout/setInterval如果不清理，会导致：
- 内存泄漏
- 组件卸载后仍执行回调（导致"Cannot update component"警告）
- 性能下降

### 1.2 错误示例

```typescript
// ❌ 错误1：在函数组件中直接使用setTimeout
function MyComponent() {
  const [count, setCount] = useState(0);

  setTimeout(() => {
    setCount(count + 1); // 组件卸载后仍会执行
  }, 5000);

  return <div>{count}</div>;
}

// ❌ 错误2：useEffect中未清理timeout
function MyComponent() {
  useEffect(() => {
    setTimeout(() => {
      console.log('5秒后执行');
    }, 5000);
    // 缺少清理函数
  }, []);
}

// ❌ 错误3：try-catch中timeout未在finally清理
async function handleAIAnalysis() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    await fetch(url, { signal: controller.signal });

    clearTimeout(timeoutId); // ← 如果fetch抛出异常，这行不会执行
  } catch (err) {
    console.error(err);
  }
}
```

### 1.3 正确示例

#### 模式1: useEffect中的timeout

```typescript
// ✅ 正确：基本清理模式
function MyComponent() {
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      console.log('5秒后执行');
    }, 5000);

    // 清理函数
    return () => {
      clearTimeout(timeoutId);
    };
  }, []);
}
```

#### 模式2: 多个timeout管理

```typescript
// ✅ 正确：管理多个timeout
function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutIdsRef = useRef<Map<number, NodeJS.Timeout>>(new Map());

  const showToast = (message: string, duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);

    // 保存timeout引用
    const timeoutId = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      timeoutIdsRef.current.delete(id);
    }, duration);

    timeoutIdsRef.current.set(id, timeoutId);

    return id;
  };

  const dismissToast = (id: number) => {
    // 手动清除timeout
    const timeoutId = timeoutIdsRef.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutIdsRef.current.delete(id);
    }

    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // 组件卸载时清理所有pending的timeouts
  useEffect(() => {
    return () => {
      timeoutIdsRef.current.forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      timeoutIdsRef.current.clear();
    };
  }, []);

  return { toasts, showToast, dismissToast };
}
```

#### 模式3: try-finally中的timeout

```typescript
// ✅ 正确：确保timeout在所有情况下都被清理
async function handleAIAnalysis() {
  // 在外部声明timeout引用
  let timeoutId: NodeJS.Timeout | null = null;

  try {
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(url, {
      signal: controller.signal
    });

    clearTimeout(timeoutId); // 成功时清理

    return await response.json();
  } catch (err) {
    console.error('请求失败:', err);
    throw err;
  } finally {
    // 确保在所有情况下都清理
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
```

#### 模式4: setInterval清理

```typescript
// ✅ 正确：setInterval清理
function HealthCheckMonitor() {
  useEffect(() => {
    console.log('健康检查监控已启动');

    const intervalId = setInterval(() => {
      runHealthChecks();
    }, 10000);

    // 清理函数
    return () => {
      clearInterval(intervalId);
      console.log('健康检查监控已停止');
    };
  }, []);
}
```

---

## 2. useEffect 清理函数

### 2.1 何时需要清理函数

**需要清理的情况**:
- ✅ 使用setTimeout/setInterval
- ✅ 添加事件监听器
- ✅ 订阅外部数据源
- ✅ 创建WebSocket连接
- ✅ 使用requestAnimationFrame
- ✅ 创建AbortController

**不需要清理的情况**:
- ⚪ 纯粹的状态更新
- ⚪ 同步的DOM操作
- ⚪ 简单的计算

### 2.2 正确模式

```typescript
// ✅ 正确：完整的清理模式
function MyComponent() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let isMounted = true; // 防止组件卸载后更新状态
    const controller = new AbortController();

    async function fetchData() {
      try {
        const response = await fetch(url, {
          signal: controller.signal
        });

        const result = await response.json();

        if (isMounted) {
          setData(result);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error(err);
        }
      }
    }

    fetchData();

    // 清理函数
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [url]);

  return <div>{data}</div>;
}
```

---

## 3. 异步操作取消

### 3.1 AbortController模式

```typescript
// ✅ 正确：使用AbortController取消fetch
async function analyzeWithAI(content: string) {
  const controller = new AbortController();
  let timeoutId: NodeJS.Timeout | null = null;

  try {
    // 30秒超时
    timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(apiUrl, {
      method: 'POST',
      signal: controller.signal, // 传递signal
      body: JSON.stringify({ content })
    });

    clearTimeout(timeoutId);

    return await response.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('请求已取消');
    } else {
      throw err;
    }
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
```

### 3.2 Promise取消模式

```typescript
// ✅ 正确：使用取消标志
function useCancellablePromise() {
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    return () => {
      cancelledRef.current = true;
    };
  }, []);

  const wrapPromise = async <T>(promise: Promise<T>): Promise<T | null> => {
    const result = await promise;

    if (cancelledRef.current) {
      return null; // 已取消，不返回结果
    }

    return result;
  };

  return wrapPromise;
}
```

---

## 4. 事件监听器清理

### 4.1 基本模式

```typescript
// ✅ 正确：事件监听器清理
function ScrollTracker() {
  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    const element = document.getElementById('container');
    if (!element) return;

    const handleScroll = () => {
      setScrollTop(element.scrollTop);
    };

    // 添加监听器
    element.addEventListener('scroll', handleScroll);

    // 清理函数
    return () => {
      element.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return <div>Scroll Top: {scrollTop}</div>;
}
```

### 4.2 多个监听器

```typescript
// ✅ 正确：管理多个监听器
function KeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // ...
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // 清理所有监听器
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
}
```

---

## 5. requestAnimationFrame 清理

### 5.1 基本模式

```typescript
// ✅ 正确：RAF清理
function AnimatedComponent() {
  useEffect(() => {
    let rafId: number | null = null;

    const animate = () => {
      // 动画逻辑
      updateAnimation();

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    // 清理函数
    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);
}
```

### 5.2 与setTimeout结合

```typescript
// ✅ 正确：RAF + setTimeout清理
function ScrollRestorer() {
  useEffect(() => {
    if (targetScroll === null) return;

    let rafId: number | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    rafId = requestAnimationFrame(() => {
      element.scrollTop = targetScroll;

      timeoutId = setTimeout(() => {
        setRestoring(false);
      }, 100);
    });

    // 清理函数
    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [targetScroll]);
}
```

---

## 6. 资源泄漏检测

### 6.1 开发工具

**React DevTools Profiler**:
- 检查组件是否正确卸载
- 监控内存使用

**Chrome DevTools**:
```javascript
// 在控制台运行，检查pending的timers
console.log('Active timers:', window.activeTimers); // 需要自定义监控

// 检查内存泄漏
// 1. 打开Chrome DevTools > Memory
// 2. 拍摄堆快照
// 3. 执行操作（打开/关闭组件）
// 4. 再次拍摄堆快照
// 5. 对比两次快照，查找未释放的对象
```

### 6.2 自动检测

**ESLint规则**:
```json
{
  "rules": {
    "react-hooks/exhaustive-deps": "warn",
    "react-hooks/rules-of-hooks": "error"
  }
}
```

**自定义Hook监控**:
```typescript
// 开发环境监控资源清理
export function useResourceMonitor(componentName: string) {
  useEffect(() => {
    console.log(`[${componentName}] Mounted`);

    return () => {
      console.log(`[${componentName}] Unmounting - cleaning up resources`);
    };
  }, [componentName]);
}
```

### 6.3 测试检查

```typescript
// Jest测试：验证清理函数被调用
describe('ResourceComponent', () => {
  it('should cleanup resources on unmount', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    const { unmount } = render(<ResourceComponent />);

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
```

---

## 7. 检查清单

### 开发阶段

**每次使用setTimeout/setInterval时**:
- [ ] 是否保存了timeout/interval的引用？
- [ ] 是否在useEffect的清理函数中清除？
- [ ] 是否在try-finally中清理（异步操作）？
- [ ] 是否在组件卸载时清理（useRef保存的引用）？

**每次编写useEffect时**:
- [ ] 是否需要清理函数？
- [ ] 清理函数是否清理了所有副作用？
- [ ] 是否正确处理了异步操作的取消？
- [ ] 依赖数组是否正确？

**每次添加事件监听器时**:
- [ ] 是否在清理函数中移除监听器？
- [ ] 是否检查了DOM元素存在性？
- [ ] 是否使用了相同的函数引用（不要用内联函数）？

### Code Review阶段

**审查者检查清单**:
- [ ] 所有setTimeout/setInterval是否都有清理？
- [ ] 所有事件监听器是否都有移除？
- [ ] 异步操作是否可以取消？
- [ ] useEffect是否有必要的清理函数？
- [ ] 是否存在可能的竞态条件？

---

## 常见错误案例

### 案例1: useToast资源泄漏

**问题代码**:
```typescript
// ❌ 错误：组件卸载时timeout未清理
function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = (message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000); // ← 如果组件在3秒内卸载，这个timeout仍会执行
  };

  return { toasts, showToast };
}
```

**修复**: 见[1.3节 模式2](#模式2-多个timeout管理)

---

### 案例2: AI分析timeout泄漏

**问题代码**:
```typescript
// ❌ 错误：timeout在try块内声明，finally无法访问
async function analyzeWithAI() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    await fetch(url, { signal: controller.signal });

    clearTimeout(timeoutId);
  } catch (err) {
    console.error(err);
  } finally {
    // timeoutId is not defined here ← 无法清理
  }
}
```

**修复**: 见[1.3节 模式3](#模式3-try-finally中的timeout)

---

### 案例3: 滚动恢复RAF泄漏

**问题代码**:
```typescript
// ❌ 错误：requestAnimationFrame未取消
useEffect(() => {
  requestAnimationFrame(() => {
    element.scrollTop = targetScroll;

    setTimeout(() => {
      setRestoring(false);
    }, 100);
  });
  // 缺少清理函数
}, [targetScroll]);
```

**修复**: 见[5.2节](#52-与settimeout结合)

---

## 参考资源

- [React Hooks API Reference - useEffect](https://react.dev/reference/react/useEffect)
- [MDN - AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [React Memory Leaks - Common Causes](https://react.dev/learn/you-might-not-need-an-effect#managing-non-react-widgets)
