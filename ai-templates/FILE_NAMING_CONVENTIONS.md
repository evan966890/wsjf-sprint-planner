# 文件命名规范

> 通用AI协作规范 - 适用于所有AI辅助开发项目
>
> **目的**: 建立统一的文件命名规范，提高代码可读性和可维护性

## 核心原则

### 🎯 一致性原则

**同类文件使用相同的命名风格**

- 文档文件有特定的命名风格
- 代码文件有特定的命名风格
- 配置文件有特定的命名风格

### 📝 可读性原则

**文件名应该清晰表达其内容和用途**

- ✅ `user-authentication.md` - 清晰明了
- ❌ `ua.md` - 过度缩写
- ❌ `file1.md` - 无意义命名

### 🔍 可搜索原则

**文件名应该便于搜索和定位**

- 使用有意义的关键词
- 避免特殊字符（除了 `-` 和 `_`）
- 使用英文命名（便于国际化）

---

## 文档文件命名规范

### 1. 根目录文档（项目级）

**风格**: 全大写 + 下划线

**目的**: 突出重要性，表示这是项目级的核心文档

**格式**: `大写单词_大写单词.md`

**示例**:
```
✅ README.md
✅ CHANGELOG.md
✅ CLAUDE.md
✅ CONTRIBUTING.md
✅ DEPLOY_GUIDE.md
✅ DEVELOPMENT.md
```

**命名规则**:
- 全部字母大写
- 多个单词用下划线 `_` 连接
- 必须以 `.md` 结尾

### 2. ai-templates/ 目录（通用模板）

**风格**: 全大写 + 下划线

**目的**: 表示这是可复用的通用模板，与项目级文档同等重要

**格式**: `大写前缀_描述性名称.md`

**示例**:
```
✅ AI_COLLABORATION_BEST_PRACTICES.md
✅ DOCUMENT_ORGANIZATION.md
✅ FILE_NAMING_CONVENTIONS.md
✅ TOKEN_OPTIMIZATION_STRATEGIES.md
```

**命名规则**:
- 全部字母大写
- 多个单词用下划线 `_` 连接
- 通用规范建议以 `AI_` 或描述性前缀开头
- 必须以 `.md` 结尾

### 3. docs/ 目录（项目文档）

#### 3.1 需求文档（docs/requirements/）

**风格**: 编号 + 小写 + 连字符

**格式**: `{编号}-{功能名}.md`

**示例**:
```
✅ 01-user-authentication.md
✅ 02-data-export.md
✅ 08-import-ai-smart-fill.md
✅ 15-batch-operations.md
```

**命名规则**:
- 编号：两位数字（01-99）
- 功能名：小写字母，多个单词用连字符 `-` 连接
- 功能名应该简洁清晰，2-4个单词
- 必须以 `.md` 结尾

**编号分配建议**:
- 01-09：核心基础功能
- 10-19：主要业务功能
- 20-29：辅助功能
- 30-39：优化改进
- 40+：实验性功能

#### 3.2 架构文档（docs/architecture/）

**风格**: 小写 + 连字符

**格式**: `{组件/主题名}.md` 或 `{组件名}-{文档类型}.md`

**示例**:
```
✅ overview.md              # 架构概览
✅ component-design.md      # 组件设计
✅ data-flow.md             # 数据流
✅ state-management.md      # 状态管理
✅ authentication-design.md # 认证架构设计
```

**命名规则**:
- 全部小写
- 多个单词用连字符 `-` 连接
- 优先使用通用名称（overview, design, flow）
- 特定组件加前缀（如 authentication-design）

#### 3.3 API文档（docs/api/）

**风格**: 小写 + 连字符

**示例**:
```
✅ endpoints.md             # API端点列表
✅ authentication.md        # 认证API
✅ user-api.md              # 用户API
✅ data-models.md           # 数据模型
✅ error-codes.md           # 错误码
```

#### 3.4 使用指南（docs/guides/）

**风格**: 小写 + 连字符

**示例**:
```
✅ user-manual.md           # 用户手册
✅ developer-guide.md       # 开发指南
✅ deployment.md            # 部署指南
✅ quick-start.md           # 快速开始
✅ troubleshooting.md       # 故障排除
```

### 4. .claude/ 目录（项目上下文）

**风格**: 小写 + 连字符

**示例**:
```
✅ context.md               # 项目上下文
✅ tips.md                  # 优化技巧
✅ project-rules.md         # 项目规范
```

**命名规则**:
- 全部小写
- 多个单词用连字符 `-` 连接
- 保持简洁（通常是单个单词）

---

## 代码文件命名规范

### 1. React/TypeScript 组件

**风格**: PascalCase（大驼峰）

**格式**: `ComponentName.tsx`

**示例**:
```
✅ UserCard.tsx
✅ RequirementModal.tsx
✅ EditRequirementModal.tsx
✅ SprintPool.tsx
✅ WSJFPlanner.tsx
```

**命名规则**:
- 每个单词首字母大写
- 不使用分隔符
- 组件名应该是名词或名词短语
- 文件名与组件名一致

**组件命名建议**:
- 具体描述组件功能：`UserAuthenticationForm` 优于 `Form`
- 使用业务术语：`RequirementCard` 而非 `Card`
- 避免通用名称：`DataTable` 优于 `Table`

### 2. TypeScript 工具/服务

**风格**: camelCase（小驼峰）或 PascalCase

**格式**: `utilityName.ts` 或 `ServiceName.ts`

**示例**:
```
✅ logger.ts                # 工具函数（小驼峰）
✅ storage.ts               # 工具函数
✅ fileParser.ts            # 工具函数
✅ scoring.ts               # 工具函数
✅ ApiService.ts            # 服务类（大驼峰）
✅ UserService.ts           # 服务类
```

**命名规则**:
- 工具函数：小驼峰 `camelCase`
- 服务类：大驼峰 `PascalCase`
- 建议加后缀：`Service`, `Helper`, `Util`

### 3. 类型定义

**风格**: camelCase 或专用名称

**格式**: `types.ts` 或 `index.ts`

**示例**:
```
✅ types/index.ts           # 集中类型定义
✅ types/user.ts            # 用户相关类型
✅ types/requirement.ts     # 需求相关类型
✅ models.ts                # 数据模型
```

**命名规则**:
- 优先使用 `index.ts` 集中导出
- 分类使用领域名：`user.ts`, `requirement.ts`
- 通用名称：`types.ts`, `models.ts`, `interfaces.ts`

### 4. 配置文件

**风格**: camelCase 或专用名称

**格式**: `configName.ts`

**示例**:
```
✅ config/index.ts          # 配置索引
✅ config/api.ts            # API配置
✅ config/defaults.ts       # 默认值配置
✅ config/scoringStandards.ts  # 评分标准
✅ config/metrics.ts        # 指标定义
```

**命名规则**:
- 配置集中放 `config/` 目录
- 使用小驼峰命名
- 名称应该表达配置内容
- 必须有 `index.ts` 统一导出

### 5. Hook 函数

**风格**: camelCase with `use` prefix

**格式**: `use{功能名}.ts`

**示例**:
```
✅ useStore.ts              # Zustand store
✅ useAuth.ts               # 认证hook
✅ useRequirements.ts       # 需求管理hook
✅ useLocalStorage.ts       # 本地存储hook
```

**命名规则**:
- 必须以 `use` 开头
- 后接功能名（大驼峰）
- 放在 `hooks/` 或 `store/` 目录

### 6. 测试文件

**风格**: 与源文件同名 + 后缀

**格式**: `{源文件名}.test.{ext}` 或 `{源文件名}.spec.{ext}`

**示例**:
```
✅ UserCard.test.tsx        # 组件测试
✅ logger.test.ts           # 工具测试
✅ scoring.spec.ts          # 算法测试
✅ ApiService.test.ts       # 服务测试
```

**命名规则**:
- 与被测试文件同名
- 添加 `.test` 或 `.spec` 后缀
- 扩展名与源文件一致

---

## 配置文件命名规范

### 1. 项目配置文件

**风格**: 小写 + 点分隔

**示例**:
```
✅ package.json
✅ tsconfig.json
✅ vite.config.ts
✅ tailwind.config.js
✅ .gitignore
✅ .eslintrc.json
✅ .prettierrc
```

**命名规则**:
- 全部小写
- 使用点 `.` 分隔
- 遵循工具的官方命名约定

### 2. 环境配置文件

**风格**: .env + 环境名

**示例**:
```
✅ .env
✅ .env.local
✅ .env.development
✅ .env.production
```

---

## 目录命名规范

### 1. 源代码目录

**风格**: 小写 + 连字符（kebab-case）或 小驼峰（camelCase）

**示例**:
```
✅ src/                     # 源代码根目录
✅ src/components/          # 组件目录
✅ src/utils/               # 工具函数
✅ src/hooks/               # React hooks
✅ src/store/               # 状态管理
✅ src/types/               # 类型定义
✅ src/config/              # 配置文件
✅ src/services/            # 服务层
✅ src/api/                 # API层
```

**命名规则**:
- 全部小写
- 优先使用复数形式（components, utils, hooks）
- 简洁清晰，见名知意

### 2. 文档目录

**风格**: 小写 + 连字符

**示例**:
```
✅ docs/
✅ docs/requirements/
✅ docs/architecture/
✅ docs/api/
✅ docs/guides/
✅ ai-templates/
```

### 3. 特殊目录

**示例**:
```
✅ .claude/                 # Claude上下文
✅ .github/                 # GitHub配置
✅ .vscode/                 # VSCode配置
✅ public/                  # 静态资源
✅ dist/                    # 构建输出
✅ node_modules/            # 依赖包
```

---

## 命名风格速查表

| 文件类型 | 命名风格 | 示例 | 说明 |
|---------|---------|------|------|
| **文档文件** |
| 根目录文档 | `UPPER_CASE` | `README.md` | 项目级重要文档 |
| 通用模板 | `UPPER_CASE` | `AI_COLLABORATION.md` | 可复用模板 |
| 需求文档 | `编号-kebab-case` | `01-feature.md` | 需求文档 |
| 其他文档 | `kebab-case` | `user-guide.md` | 普通文档 |
| **代码文件** |
| React组件 | `PascalCase` | `UserCard.tsx` | 组件文件 |
| Hook | `camelCase` | `useStore.ts` | use开头 |
| 工具函数 | `camelCase` | `logger.ts` | 工具函数 |
| 服务类 | `PascalCase` | `ApiService.ts` | 服务类 |
| 类型定义 | `camelCase` | `types.ts` | 类型文件 |
| 配置文件 | `camelCase` | `metrics.ts` | 配置文件 |
| 测试文件 | `同源文件.test` | `logger.test.ts` | 测试文件 |
| **目录** |
| 源代码目录 | `lowercase` | `components/` | 小写复数 |
| 文档目录 | `kebab-case` | `ai-templates/` | 连字符 |

---

## 常见错误示例

### ❌ 错误命名

```
❌ UserCard.md              # 文档用了代码命名风格
❌ user_card.tsx            # 组件用了下划线
❌ LOGGER.ts                # 代码文件全大写
❌ import-ai-smart-fill.tsx # 组件名用了连字符
❌ 01_feature.md            # 需求文档用了下划线
❌ ai_collaboration.md      # 模板用了小写
❌ UseStore.ts              # Hook首字母大写了
❌ API-Service.ts           # 服务用了连字符
❌ requirements-doc.md      # 需求文档缺少编号
```

### ✅ 正确命名

```
✅ UserCard.tsx             # 组件用PascalCase
✅ user-card.md             # 文档用kebab-case
✅ logger.ts                # 工具用camelCase
✅ ImportAiSmartFill.tsx    # 组件名用PascalCase
✅ 01-feature.md            # 需求文档带编号
✅ AI_COLLABORATION.md      # 模板用UPPER_CASE
✅ useStore.ts              # Hook用use前缀+camelCase
✅ ApiService.ts            # 服务用PascalCase
✅ 01-requirements.md       # 需求文档正确格式
```

---

## AI创建文件时的检查清单

### ✅ 创建文件前必须检查

1. **确定文件类型**：
   - [ ] 文档文件（.md）？
   - [ ] 代码文件（.tsx/.ts）？
   - [ ] 配置文件（.json/.js）？

2. **确定文件位置**：
   - [ ] 根目录？（仅限重要项目级文档）
   - [ ] ai-templates/？（通用模板）
   - [ ] docs/？（项目文档）
   - [ ] src/？（源代码）

3. **选择命名风格**：
   - [ ] 文档：根据位置选择 UPPER_CASE 或 kebab-case
   - [ ] 组件：PascalCase
   - [ ] Hook：use + camelCase
   - [ ] 工具：camelCase
   - [ ] 需求：编号 + kebab-case

4. **检查命名质量**：
   - [ ] 名称是否清晰表达内容？
   - [ ] 是否符合项目现有命名模式？
   - [ ] 是否避免了特殊字符（除了 - 和 _）？
   - [ ] 是否使用了有意义的英文单词？

### ✅ 特殊情况处理

**需求文档编号**：
```
AI应该:
1. 读取 docs/requirements/README.md
2. 查看最大编号（如 08）
3. 使用下一个编号（09）
4. 创建 docs/requirements/09-new-feature.md
```

**组件名称冲突**：
```
如果已有 UserCard.tsx:
❌ 不要创建 UserCard2.tsx
✅ 应该创建 UserProfileCard.tsx 或 UserListCard.tsx
（更具体的命名）
```

**临时文件**：
```
❌ 不要创建 temp.ts, test.ts, tmp.md
✅ 创建有意义的名称，即使是临时的
```

---

## 重命名指南

### 批量重命名脚本

```bash
# 重命名需求文档（添加编号）
cd docs/requirements/
for file in *.md; do
  if [[ ! $file =~ ^[0-9]{2}- ]]; then
    # 添加编号前缀
    mv "$file" "01-$file"
  fi
done

# 统一组件命名风格（从kebab-case到PascalCase）
cd src/components/
for file in *.tsx; do
  # user-card.tsx -> UserCard.tsx
  new_name=$(echo "$file" | sed -r 's/(^|-)(\w)/\U\2/g')
  if [ "$file" != "$new_name" ]; then
    git mv "$file" "$new_name"
  fi
done
```

### 重命名检查清单

- [ ] 使用 `git mv` 保留历史记录
- [ ] 更新所有导入路径
- [ ] 更新文档中的引用
- [ ] 更新索引文件（README.md）
- [ ] 搜索项目查找硬编码的文件名
- [ ] 运行测试确保无遗漏

---

## 最佳实践总结

### 对于AI

1. **创建文件前检查现有模式**
   - 查看同目录的其他文件命名
   - 遵循项目既有风格

2. **使用标准命名工具**
   ```typescript
   // PascalCase
   "UserCard" → UserCard.tsx

   // camelCase
   "userCard" → userCard.ts

   // kebab-case
   "user-card" → user-card.md

   // UPPER_CASE
   "USER_CARD" → USER_CARD.md
   ```

3. **避免创建不规范的文件名**
   - 发现不规范时主动建议修正
   - 提醒用户统一命名风格

### 对于用户

1. **新项目启动时建立规范**
   - 复制本文件到项目 ai-templates/
   - 在项目规范中引用

2. **定期检查命名一致性**
   - 使用工具检测命名风格
   - 及时重命名不规范文件

3. **提供清晰的文件命名指示**
   - "创建一个用户卡片组件" → AI创建 `UserCard.tsx`
   - "创建认证需求文档" → AI创建 `0X-authentication.md`

---

## 相关资源

- [DOCUMENT_ORGANIZATION.md](./DOCUMENT_ORGANIZATION.md) - 文档组织规范
- [AI_COLLABORATION_BEST_PRACTICES.md](./AI_COLLABORATION_BEST_PRACTICES.md) - AI协作最佳实践

---

**版本**: 1.0.0
**最后更新**: 2025-01-19
**适用项目**: 所有AI辅助开发项目
