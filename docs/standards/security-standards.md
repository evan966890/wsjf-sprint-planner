# 安全规范 (Security Standards)

> 本规范总结了项目中必须遵守的安全最佳实践，避免常见的安全漏洞。

**版本**: v1.0
**最后更新**: 2025-01-31
**强制执行**: ✅ 必须遵守

---

## 目录

- [1. OAuth/认证安全](#1-oauth认证安全)
- [2. CSRF防护](#2-csrf防护)
- [3. XSS防护](#3-xss防护)
- [4. 数据验证](#4-数据验证)
- [5. 安全检查清单](#5-安全检查清单)

---

## 1. OAuth/认证安全

### 1.1 CSRF防护（必须）

**问题**: OAuth回调流程容易受到CSRF攻击

**案例**:
```typescript
// ❌ 错误：未验证state参数
export async function handleOAuthCallback(config: FeishuConfig) {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');  // 获取了但未验证

  if (!code) {
    throw new Error('缺少授权码');
  }

  // TODO: 验证state参数防止CSRF攻击  ← 永远不会执行
  return await exchangeCodeForToken(code);
}
```

**正确做法**:
```typescript
// ✅ 正确：完整的CSRF防护
export class OAuthManager {
  private readonly STATE_STORAGE_KEY = 'oauth_state';

  // 生成并保存state
  getAuthorizationUrl(): string {
    const state = this.generateState();

    // 保存到sessionStorage用于验证
    sessionStorage.setItem(this.STATE_STORAGE_KEY, state);

    return `https://auth.example.com?state=${state}&...`;
  }

  // 验证state参数
  verifyState(receivedState: string | null): void {
    const savedState = sessionStorage.getItem(this.STATE_STORAGE_KEY);

    // 清除已保存的state（一次性使用）
    sessionStorage.removeItem(this.STATE_STORAGE_KEY);

    if (!savedState) {
      throw new Error('CSRF验证失败：未找到已保存的state参数');
    }

    if (!receivedState) {
      throw new Error('CSRF验证失败：回调中缺少state参数');
    }

    if (savedState !== receivedState) {
      throw new Error('CSRF验证失败：state参数不匹配');
    }
  }

  private generateState(): string {
    // 生成随机state（建议使用加密安全的随机数）
    return `state_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }
}

// 在回调中强制验证
export async function handleOAuthCallback(config: FeishuConfig) {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');

  const oauthManager = new OAuthManager(config);

  // ✅ 强制验证state
  oauthManager.verifyState(state);

  return await oauthManager.exchangeCodeForToken(code);
}
```

**规范要求**:
- ✅ OAuth流程必须实现state参数验证
- ✅ state必须是随机生成的，不可预测
- ✅ state必须一次性使用（验证后立即删除）
- ✅ state可以存储在sessionStorage（单页面应用）或服务器session（传统应用）
- ⚠️ 不要跳过state验证，即使是内部系统

---

## 2. CSRF防护

### 2.1 API请求

**规范**:
- ✅ 所有状态改变的API请求（POST/PUT/DELETE）必须携带CSRF token
- ✅ 使用SameSite cookie策略
- ✅ 验证Referer/Origin头（辅助手段）

**示例**:
```typescript
// ✅ 正确：带CSRF保护的API请求
async function updateRequirement(id: string, data: Partial<Requirement>) {
  const csrfToken = getCsrfToken(); // 从cookie或meta标签获取

  const response = await fetch(`/api/requirements/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    credentials: 'same-origin', // 携带cookie
    body: JSON.stringify(data),
  });

  return response.json();
}
```

---

## 3. XSS防护

### 3.1 禁止dangerouslySetInnerHTML

**规范**:
- ❌ 禁止使用`dangerouslySetInnerHTML`
- ❌ 禁止使用`eval()`和`new Function()`
- ✅ 所有用户输入必须经过转义

**检查方法**:
```bash
# 检查是否存在危险API
grep -r "dangerouslySetInnerHTML" src/
grep -r "eval(" src/
grep -r "new Function" src/
```

### 3.2 URL安全

**规范**:
```typescript
// ❌ 错误：直接使用用户输入的URL
<a href={userInput}>链接</a>

// ✅ 正确：验证URL协议
function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

<a href={isSafeUrl(userInput) ? userInput : '#'}>链接</a>
```

---

## 4. 数据验证

### 4.1 输入验证

**规范**:
- ✅ 永远不要信任客户端输入
- ✅ 前端验证 + 后端验证（双重保险）
- ✅ 使用白名单而非黑名单

**示例**:
```typescript
// ✅ 正确：完整的输入验证
function validateRequirementInput(input: unknown): Requirement {
  // 1. 类型检查
  if (typeof input !== 'object' || input === null) {
    throw new Error('Invalid input type');
  }

  const data = input as Record<string, unknown>;

  // 2. 必填字段检查
  if (typeof data.name !== 'string' || data.name.trim().length === 0) {
    throw new Error('Name is required');
  }

  // 3. 枚举值验证（白名单）
  const validStatuses: TechProgressStatus[] = [
    '待评估', '已评估工作量', '已完成技术方案'
  ];

  if (typeof data.techProgress === 'string' &&
      !validStatuses.includes(data.techProgress as TechProgressStatus)) {
    throw new Error(`Invalid techProgress: ${data.techProgress}`);
  }

  // 4. 数值范围检查
  if (typeof data.effortDays === 'number' &&
      (data.effortDays < 0 || data.effortDays > 365)) {
    throw new Error('Effort days must be between 0 and 365');
  }

  return data as Requirement;
}
```

### 4.2 边界条件检查

**规范**:
```typescript
// ✅ 数组访问前检查边界
const items = getItems();
if (items.length > 0) {
  const firstItem = items[0]; // 安全
}

// ✅ 对象属性访问使用可选链
const value = obj?.property?.nested?.value;

// ✅ 正则匹配结果检查
const match = text.match(/pattern/);
if (match && match[0]) {
  const result = match[0]; // 安全
}
```

---

## 5. 安全检查清单

### 开发阶段

**每次编写认证/授权代码时**:
- [ ] OAuth流程是否实现了state参数验证？
- [ ] state是否随机生成且一次性使用？
- [ ] 敏感操作是否需要CSRF token？
- [ ] 是否验证了用户输入的所有字段？

**每次处理用户输入时**:
- [ ] 是否对用户输入进行了类型检查？
- [ ] 是否对枚举值使用了白名单验证？
- [ ] 是否对数值进行了范围检查？
- [ ] 是否对字符串进行了长度限制？

**每次访问数组/对象时**:
- [ ] 是否检查了数组长度？
- [ ] 是否使用了可选链（?.）访问对象属性？
- [ ] 正则匹配结果是否检查了null？

### Code Review阶段

**审查者检查清单**:
- [ ] 是否存在未验证的用户输入？
- [ ] 是否存在硬编码的密钥/token？
- [ ] OAuth流程是否完整实现CSRF防护？
- [ ] 是否存在`dangerouslySetInnerHTML`？
- [ ] 是否存在`eval()`或`new Function()`？
- [ ] 敏感操作是否有权限检查？

### 提交前检查

```bash
# 1. 检查敏感API
npm run check:security

# 2. 运行安全扫描（如果配置了）
npm audit

# 3. 检查代码中的TODO/FIXME
grep -r "TODO.*安全\|FIXME.*安全\|XXX.*安全" src/
```

---

## 案例学习

### 案例1: OAuth CSRF漏洞修复

**背景**: 2025-01-31发现飞书OAuth回调未验证state参数

**影响**: 攻击者可以劫持用户的OAuth授权流程

**修复**:
1. 在`getAuthorizationUrl()`中生成并保存state
2. 实现`verifyState()`方法
3. 在`handleOAuthCallback()`中强制调用验证

**教训**:
- ❌ 不要留下"TODO: 验证state"这样的注释，立即实现
- ✅ OAuth安全是基础设施，必须在第一次实现时就做对
- ✅ 安全功能不能等"以后有时间再加"

**相关文件**: `src/services/feishu/feishuOAuth.ts`

---

## 参考资源

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [React Security Best Practices](https://react.dev/learn/react-security-best-practices)
