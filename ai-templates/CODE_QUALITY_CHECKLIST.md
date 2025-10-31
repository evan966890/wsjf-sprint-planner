# AI代码质量检查清单

> **目标**: 确保AI生成的代码符合项目规范，避免常见Bug和安全问题。

**版本**: v1.0
**最后更新**: 2025-01-31
**适用对象**: Claude Code / GitHub Copilot / 其他AI编程助手

---

## 使用说明

本检查清单总结了2025-01-31项目Bug修复过程中发现的所有问题模式。

**AI开发者必须**:
1. ✅ 在编写任何代码前，先阅读本检查清单
2. ✅ 在提交代码前，逐项检查本清单
3. ✅ 发现违反规范的代码，必须立即修复

---

## 🔒 安全检查（P0 - 严重）

### ✅ 1. OAuth/CSRF防护

**规则**: OAuth流程必须验证state参数

**反例**:
```typescript
// ❌ 错误：获取state但不验证
export async function handleOAuthCallback() {
  const code = urlParams.get('code');
  const state = urlParams.get('state');  // 拿到了但没用

  // TODO: 验证state参数防止CSRF攻击  ← 这永远不会被执行
  return await exchangeToken(code);
}
```

**正例**:
```typescript
// ✅ 正确：完整的CSRF防护
class OAuthManager {
  private STATE_KEY = 'oauth_state';

  getAuthUrl(): string {
    const state = generateRandomState();
    sessionStorage.setItem(this.STATE_KEY, state);  // 保存
    return `https://auth?state=${state}`;
  }

  verifyState(receivedState: string | null): void {
    const saved = sessionStorage.getItem(this.STATE_KEY);
    sessionStorage.removeItem(this.STATE_KEY);  // 一次性使用

    if (!saved || !receivedState || saved !== receivedState) {
      throw new Error('CSRF verification failed');
    }
  }
}

// 回调中强制验证
export async function handleCallback() {
  const state = urlParams.get('state');
  oauthManager.verifyState(state);  // ✅ 强制验证
  // ...
}
```

**检查项**:
- [ ] OAuth流程是否生成并保存了state参数？
- [ ] OAuth回调是否验证了state参数？
- [ ] state是否在验证后立即删除（一次性使用）？

---

## 💧 资源管理（P0 - 严重）

### ✅ 2. setTimeout/setInterval 必须清理

**规则**: 所有setTimeout/setInterval必须在组件卸载时清理

**反例**:
```typescript
// ❌ 错误1：useEffect中未清理
useEffect(() => {
  setTimeout(() => {
    doSomething();
  }, 5000);
  // 缺少 return () => clearTimeout(...)
}, []);

// ❌ 错误2：try块中的timeout未在finally清理
async function fetchData() {
  try {
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    await fetch(url);
    clearTimeout(timeoutId);  // ← 如果fetch抛异常，这行不执行
  } catch (err) {
    console.error(err);
  }
}

// ❌ 错误3：多个timeout未统一管理
function useToast() {
  const showToast = (msg: string) => {
    setTimeout(() => {
      removeToast(id);
    }, 3000);  // ← 组件卸载时未清理
  };
}
```

**正例**:
```typescript
// ✅ 正确1：useEffect清理
useEffect(() => {
  const timeoutId = setTimeout(() => {
    doSomething();
  }, 5000);

  return () => {
    clearTimeout(timeoutId);  // ✅ 清理
  };
}, []);

// ✅ 正确2：try-finally清理
async function fetchData() {
  let timeoutId: NodeJS.Timeout | null = null;  // ← 外部声明

  try {
    timeoutId = setTimeout(() => controller.abort(), 30000);
    await fetch(url);
    clearTimeout(timeoutId);
  } catch (err) {
    console.error(err);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);  // ✅ 确保清理
    }
  }
}

// ✅ 正确3：Map管理多个timeout
function useToast() {
  const timeoutRefs = useRef<Map<number, NodeJS.Timeout>>(new Map());

  const showToast = (msg: string) => {
    const id = Date.now();
    const timeoutId = setTimeout(() => {
      removeToast(id);
      timeoutRefs.current.delete(id);
    }, 3000);

    timeoutRefs.current.set(id, timeoutId);  // ✅ 保存引用
  };

  const dismissToast = (id: number) => {
    const timeoutId = timeoutRefs.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);  // ✅ 手动清理
      timeoutRefs.current.delete(id);
    }
  };

  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(tid => clearTimeout(tid));  // ✅ 卸载时清理
      timeoutRefs.current.clear();
    };
  }, []);
}
```

**检查项**:
- [ ] 所有setTimeout是否都有clearTimeout？
- [ ] setTimeout是否在useEffect的return函数中清理？
- [ ] 异步函数中的timeout是否在finally块清理？
- [ ] 多个timeout是否使用Map/Array统一管理？

---

### ✅ 3. requestAnimationFrame 必须取消

**规则**: requestAnimationFrame必须在组件卸载时取消

**反例**:
```typescript
// ❌ 错误：RAF未取消
useEffect(() => {
  requestAnimationFrame(() => {
    element.scrollTop = targetScroll;
  });
  // 缺少 return () => cancelAnimationFrame(...)
}, [targetScroll]);
```

**正例**:
```typescript
// ✅ 正确：RAF清理
useEffect(() => {
  let rafId: number | null = null;
  let timeoutId: NodeJS.Timeout | null = null;

  rafId = requestAnimationFrame(() => {
    element.scrollTop = targetScroll;

    timeoutId = setTimeout(() => {
      setRestoring(false);
    }, 100);
  });

  return () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);  // ✅ 取消RAF
    }
    if (timeoutId) {
      clearTimeout(timeoutId);  // ✅ 清理timeout
    }
  };
}, [targetScroll]);
```

**检查项**:
- [ ] requestAnimationFrame是否保存了返回的ID？
- [ ] 是否在清理函数中调用cancelAnimationFrame？

---

## 🔤 类型安全（P1 - 重要）

### ✅ 4. 禁止硬编码枚举字符串

**规则**: 枚举值必须使用常量，禁止硬编码字符串

**反例**:
```typescript
// ❌ 错误：硬编码字符串
const canEdit = form.techProgress === '已评估工作量' ||
                form.techProgress === '已完成技术方案';

// ❌ 错误：容易拼写错误
if (req.techProgress === '待评估') {  // 如果拼成"代评估"呢？
  // ...
}
```

**正例**:
```typescript
// ✅ 正确：使用常量
import { TECH_PROGRESS, isReadyForSchedule } from '@/constants/techProgress';

const canEdit = isReadyForSchedule(form.techProgress);

// ✅ 正确：使用守卫函数
if (needsEvaluation(req.techProgress)) {
  // ...
}
```

**检查项**:
- [ ] 是否存在硬编码的枚举字符串（如'待评估'）？
- [ ] 是否使用了常量或守卫函数？
- [ ] 新增枚举值时，是否同时更新了类型定义？

---

### ✅ 5. 避免类型断言滥用

**规则**: 使用类型守卫函数代替类型断言

**反例**:
```typescript
// ❌ 错误：类型断言
const ready = items.filter(r =>
  r.techProgress && !(NOT_READY_STATUSES as readonly string[]).includes(r.techProgress)
);
```

**正例**:
```typescript
// ✅ 正确：类型守卫函数
const ready = items.filter(r => isReadyForSchedule(r.techProgress));

// ✅ 正确：定义守卫函数
export function isReadyForSchedule(
  status: TechProgressStatus | undefined | null
): boolean {
  if (!status) return false;
  return (READY_STATUSES as readonly string[]).includes(status);
}
```

**检查项**:
- [ ] 是否存在`as readonly string[]`这样的类型断言？
- [ ] 是否可以创建守卫函数替代类型断言？

---

## 🛡️ 边界检查（P1 - 重要）

### ✅ 6. 数组访问前检查长度

**规则**: 访问数组元素前必须检查边界

**反例**:
```typescript
// ❌ 错误：直接访问可能不存在的元素
const firstFile = uploadedFiles[0];  // 如果数组为空呢？
const firstReason = parsedData.reasoning[0];

const match = text.match(/pattern/);
const result = match[1];  // match可能为null
```

**正例**:
```typescript
// ✅ 正确：检查长度
if (uploadedFiles.length > 0) {
  const firstFile = uploadedFiles[0];  // 安全
}

// ✅ 正确：使用可选链
const firstFile = uploadedFiles?.[0];

// ✅ 正确：检查match结果
const match = text.match(/pattern/);
if (match && match[0]) {
  const result = match[0];  // 安全
}
```

**检查项**:
- [ ] 数组访问`arr[0]`前是否检查了`arr.length > 0`？
- [ ] 正则match结果是否检查了null？
- [ ] 是否使用了可选链`arr?.[0]`？

---

## 🔍 代码质量检查模板

### 提交代码前自检

```markdown
## 安全检查
- [ ] OAuth/认证流程是否实现了CSRF防护？
- [ ] state参数是否验证并一次性使用？

## 资源管理检查
- [ ] 所有setTimeout/setInterval是否都有清理？
- [ ] useEffect是否有必要的清理函数？
- [ ] requestAnimationFrame是否取消？
- [ ] 异步操作的timeout是否在finally块清理？

## 类型安全检查
- [ ] 是否存在硬编码的枚举字符串？
- [ ] 是否使用了常量代替魔术字符串？
- [ ] 类型断言是否可以改为守卫函数？

## 边界检查
- [ ] 数组访问前是否检查长度？
- [ ] 正则match结果是否检查null？
- [ ] 对象属性访问是否使用可选链？

## 构建检查
- [ ] TypeScript编译是否通过？(`npx tsc --noEmit`)
- [ ] 生产构建是否成功？(`npm run build`)
- [ ] 是否存在编译警告？
```

---

## 🚨 常见错误模式速查表

| 错误模式 | 严重性 | 检测方法 | 修复模板 |
|---------|--------|---------|----------|
| OAuth未验证state | P0 | 搜索`TODO.*state`或`urlParams.get('state')` | 实现`verifyState()`方法 |
| setTimeout未清理 | P0 | 搜索`setTimeout`，检查是否有`clearTimeout` | 添加`return () => clearTimeout(id)` |
| RAF未取消 | P0 | 搜索`requestAnimationFrame` | 添加`cancelAnimationFrame(id)` |
| 硬编码枚举字符串 | P1 | 搜索`=== '待评估'`等 | 使用`needsEvaluation()` |
| 类型断言 | P1 | 搜索`as readonly string[]` | 创建守卫函数 |
| 数组越界 | P1 | 搜索`[0]` 或 `[i]` | 添加`if (arr.length > 0)` |

---

## 📚 相关文档

- [安全规范](../docs/standards/security-standards.md) - CSRF、XSS防护
- [资源管理规范](../docs/standards/resource-management.md) - 内存泄漏防护
- [重构规范](../docs/standards/refactoring-standards.md) - 代码重构规范
- [调试决策树](../docs/debugging-decision-tree.md) - 问题排查指南

---

## ⚡ 快速自检命令

```bash
# 1. 检查未清理的setTimeout
grep -rn "setTimeout" src/ | grep -v "clearTimeout"

# 2. 检查未验证的OAuth state
grep -rn "TODO.*state\|FIXME.*state" src/

# 3. 检查硬编码字符串
grep -rn "=== '待评估'\|=== '已评估工作量'" src/

# 4. 检查类型断言
grep -rn "as readonly string\[\]" src/

# 5. 运行TypeScript检查
npx tsc --noEmit

# 6. 运行生产构建
npm run build
```

---

## 💡 AI开发者提示

**当你（AI）编写代码时，请务必**:

1. **安全第一**: OAuth必须验证state，不要留下TODO
2. **清理资源**: 任何setTimeout必须有对应的clearTimeout
3. **类型安全**: 不要硬编码字符串，使用常量
4. **边界检查**: 访问数组前检查长度
5. **自我验证**: 写完代码后，逐项检查本清单

**如果不确定**:
- ❓ 不确定是否需要清理 → 加上清理函数（宁可多清理，不要少清理）
- ❓ 不确定类型 → 使用守卫函数（不要用类型断言）
- ❓ 不确定边界 → 加上检查（不要假设数组非空）

**提交前最后检查**:
```bash
npm run check-file-size  # 文件大小检查
npx tsc --noEmit         # 类型检查
npm run build            # 生产构建
```

全部通过后，才能提交代码！
