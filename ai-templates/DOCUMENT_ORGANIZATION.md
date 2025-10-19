# 文档组织规范

> 通用AI协作规范 - 适用于所有AI辅助开发项目
>
> **目的**: 建立清晰的文档组织结构，避免根目录混乱，提升项目可维护性

## 核心原则

### 🎯 黄金法则

**永远不要在项目根目录创建临时文档或需求文档**

- ❌ 错误：在根目录创建 `IMPORT_AI_SMART_FILL_REQUIREMENTS.md`
- ✅ 正确：在 `docs/requirements/` 创建 `08-import-ai-smart-fill.md`

**原因**：
1. 根目录是项目的门面，应该保持简洁
2. 临时文档容易被忽略，造成项目混乱
3. 文档分类存放便于查找和维护
4. 符合业界最佳实践

---

## 标准目录结构

```
项目根目录/
├── .claude/                    # Claude Code 上下文（项目特定）
│   ├── context.md              # 项目快速索引
│   ├── tips.md                 # 项目优化技巧
│   └── project-rules.md        # 项目代码规范
│
├── ai-templates/               # 通用AI协作模板（可复用到其他项目）⭐
│   ├── README.md               # 模板目录说明
│   ├── AI_COLLABORATION_BEST_PRACTICES.md
│   ├── DOCUMENT_ORGANIZATION.md    # 本文件
│   └── FILE_NAMING_CONVENTIONS.md
│
├── docs/                       # 项目文档（项目特定）
│   ├── requirements/           # 需求文档
│   │   ├── README.md           # 需求索引
│   │   ├── 01-feature-name.md  # 按编号命名
│   │   └── 02-another-feature.md
│   ├── architecture/           # 架构设计文档
│   │   ├── overview.md         # 架构概览
│   │   └── component-design.md # 组件设计
│   ├── api/                    # API文档
│   ├── guides/                 # 使用指南
│   └── TOKEN_OPTIMIZATION_GUIDE.md  # 项目优化实践
│
├── README.md                   # 项目主文档（必须）
├── CHANGELOG.md                # 变更日志（可选）
├── CLAUDE.md                   # Claude Code 项目说明（可选）
└── ...其他根目录文件
```

---

## 文档分类规则

### 1. 根目录文件（严格限制）

**仅允许以下类型文档**：

- ✅ **README.md** - 项目主文档（必须）
- ✅ **CHANGELOG.md** - 版本变更日志
- ✅ **CLAUDE.md** - Claude Code 项目说明
- ✅ **LICENSE** - 开源许可证
- ✅ **CONTRIBUTING.md** - 贡献指南（开源项目）
- ✅ **DEVELOPMENT.md** - 开发指南（可选，也可放 docs/）
- ✅ **DEPLOYMENT.md** - 部署指南（可选，也可放 docs/）

**命名规范**：
- 全大写 + 下划线（如 `README.md`, `CHANGELOG.md`）
- 表示这是重要的项目级文档

### 2. ai-templates/ 目录（通用模板）⭐

**存放内容**：可复用到其他项目的通用AI协作规范

**典型文件**：
- `AI_COLLABORATION_BEST_PRACTICES.md` - AI协作最佳实践
- `DOCUMENT_ORGANIZATION.md` - 文档组织规范（本文件）
- `FILE_NAMING_CONVENTIONS.md` - 文件命名规范
- `TOKEN_OPTIMIZATION_STRATEGIES.md` - Token优化策略

**使用场景**：
- 新项目启动时，直接复制 `ai-templates/` 到新项目
- 作为团队AI协作的标准模板
- 持续迭代和改进通用规范

**命名规范**：
- 全大写 + 下划线（如 `AI_COLLABORATION_BEST_PRACTICES.md`）
- 表示这是通用模板文档

### 3. docs/ 目录（项目文档）

#### 3.1 docs/requirements/ - 需求文档

**存放内容**：所有功能需求、用户故事、需求变更

**文件命名**：
- 格式：`{编号}-{功能名}.md`
- 示例：
  - `01-user-authentication.md`
  - `02-data-export.md`
  - `08-import-ai-smart-fill.md`

**README.md 必须**：
```markdown
# 需求文档索引

## 已实现
- [01] 用户认证 - 2025-01-15
- [02] 数据导出 - 2025-01-18

## 开发中
- [08] AI智能填充导入 - 进行中

## 计划中
- [09] 批量操作 - 待排期
```

#### 3.2 docs/architecture/ - 架构设计

**存放内容**：系统架构、组件设计、技术选型

**典型文件**：
- `overview.md` - 架构概览
- `component-design.md` - 组件设计
- `data-flow.md` - 数据流设计
- `tech-stack.md` - 技术栈说明

#### 3.3 docs/api/ - API文档

**存放内容**：API接口文档、数据模型

**典型文件**：
- `endpoints.md` - 接口列表
- `authentication.md` - 认证机制
- `data-models.md` - 数据模型

#### 3.4 docs/guides/ - 使用指南

**存放内容**：用户手册、开发指南、操作手册

**典型文件**：
- `user-manual.md` - 用户手册
- `developer-guide.md` - 开发者指南
- `deployment.md` - 部署指南

### 4. .claude/ 目录（项目上下文）

**存放内容**：Claude Code 特定的项目配置和提示

**典型文件**：
- `context.md` - 项目快速索引（核心文件位置、快速定位指南）
- `tips.md` - 项目优化技巧（Token优化、协作提示）
- `project-rules.md` - 项目代码规范（术语、类型、日志规范）

**特点**：
- 针对本项目的具体信息
- 帮助AI快速理解项目结构
- 不可直接复用到其他项目

---

## AI创建文档时的规范

### ✅ 正确做法

1. **创建需求文档时**：
   ```
   用户: "帮我创建导入AI智能填充的需求文档"

   AI应该:
   1. 检查 docs/requirements/README.md 获取下一个编号
   2. 创建 docs/requirements/08-import-ai-smart-fill.md
   3. 更新 docs/requirements/README.md 添加索引
   ```

2. **创建架构文档时**：
   ```
   用户: "写一个组件设计文档"

   AI应该:
   1. 创建 docs/architecture/component-design.md
   2. 或者如果是新组件：docs/architecture/新组件名-design.md
   ```

3. **创建通用规范时**：
   ```
   用户: "写一个AI协作规范"

   AI应该:
   1. 创建 ai-templates/规范名.md
   2. 更新 ai-templates/README.md 添加索引
   ```

### ❌ 错误做法

1. **在根目录创建临时文档**：
   ```
   ❌ 创建 IMPORT_AI_SMART_FILL_REQUIREMENTS.md
   ❌ 创建 TEMP_NOTES.md
   ❌ 创建 TODO.md
   ```

   **正确做法**：
   - 需求 → `docs/requirements/`
   - 临时笔记 → `docs/notes/` 或项目管理工具
   - TODO → 使用 TodoWrite 工具或项目管理工具

2. **文档分类错误**：
   ```
   ❌ 把项目特定文档放到 ai-templates/
   ❌ 把通用模板放到 docs/
   ```

   **判断标准**：
   - 能否复用到其他项目？
     - 能 → `ai-templates/`
     - 不能 → `docs/`

3. **缺少索引文件**：
   ```
   ❌ 创建多个文档但不更新 README.md
   ```

   **正确做法**：
   - 每个子目录都应该有 README.md 索引
   - 创建新文档后立即更新索引

---

## 文档索引示例

### ai-templates/README.md

```markdown
# 通用AI协作模板

本目录包含可复用到其他项目的通用AI协作规范和模板。

## 📚 模板列表

### 核心规范
- [AI_COLLABORATION_BEST_PRACTICES.md](./AI_COLLABORATION_BEST_PRACTICES.md) - AI协作最佳实践
- [DOCUMENT_ORGANIZATION.md](./DOCUMENT_ORGANIZATION.md) - 文档组织规范
- [FILE_NAMING_CONVENTIONS.md](./FILE_NAMING_CONVENTIONS.md) - 文件命名规范

### 使用方法
1. 新项目启动时，复制整个 `ai-templates/` 目录到新项目根目录
2. 根据项目需求调整规范细节
3. 在项目的 `.claude/project-rules.md` 中引用这些规范

### 贡献改进
- 发现新的最佳实践时，更新对应文档
- 每个项目的经验都可以反哺到这些模板中
```

### docs/requirements/README.md

```markdown
# 需求文档索引

本目录包含所有功能需求文档。

## 📋 需求列表

### 已实现 ✅
- [01-wsjf-core.md](./01-wsjf-core.md) - WSJF核心算法 - 2025-01-10
- [02-drag-drop.md](./02-drag-drop.md) - 拖拽排期功能 - 2025-01-12

### 开发中 🚧
- [08-import-ai-smart-fill.md](./08-import-ai-smart-fill.md) - AI智能填充导入 - 进行中

### 计划中 📅
- [09-batch-operations.md](./09-batch-operations.md) - 批量操作 - 待排期
- [10-custom-metrics.md](./10-custom-metrics.md) - 自定义指标 - 待排期

## 命名规范
- 格式：`{编号}-{功能名}.md`
- 编号：两位数字，递增
- 功能名：小写字母，连字符分隔

## 模板
使用 `_template.md` 作为新需求文档的模板。
```

---

## 迁移指南

### 如果根目录已经有很多文档

**步骤1：分类整理**
```bash
# 1. 创建目录结构
mkdir -p docs/{requirements,architecture,api,guides}
mkdir -p ai-templates

# 2. 移动需求文档
git mv *REQUIREMENTS*.md docs/requirements/
git mv *FEATURE*.md docs/requirements/

# 3. 移动架构文档
git mv *ARCHITECTURE*.md docs/architecture/
git mv *DESIGN*.md docs/architecture/

# 4. 移动通用模板
git mv AI_*.md ai-templates/
```

**步骤2：重命名文件**
```bash
# 需求文档重命名为编号格式
cd docs/requirements/
git mv IMPORT_AI_SMART_FILL_REQUIREMENTS.md 08-import-ai-smart-fill.md
```

**步骤3：创建索引**
```bash
# 为每个目录创建 README.md
touch docs/requirements/README.md
touch docs/architecture/README.md
touch ai-templates/README.md
```

**步骤4：更新引用**
- 检查其他文档中的链接
- 更新到新路径

---

## 检查清单

### AI创建文档前必须检查 ✅

- [ ] 这是什么类型的文档？
  - [ ] 项目需求 → `docs/requirements/`
  - [ ] 架构设计 → `docs/architecture/`
  - [ ] API文档 → `docs/api/`
  - [ ] 使用指南 → `docs/guides/`
  - [ ] 通用模板 → `ai-templates/`
  - [ ] 项目级文档 → 根目录（仅限 README/CHANGELOG 等）

- [ ] 目录是否存在？
  - [ ] 不存在 → 先创建目录
  - [ ] 存在 → 检查是否有索引文件

- [ ] 文件命名是否规范？
  - [ ] 需求文档：`{编号}-{功能名}.md`
  - [ ] 通用模板：`大写_下划线.md`
  - [ ] 其他文档：`小写-连字符.md`

- [ ] 是否需要更新索引？
  - [ ] 创建新文档后更新对应目录的 README.md
  - [ ] 完成需求后更新状态（已实现/开发中/计划中）

### 项目维护检查 ✅

- [ ] 根目录是否简洁？（≤10个文件）
- [ ] 所有子目录是否有 README.md？
- [ ] 文档索引是否最新？
- [ ] 是否有过期或重复的文档？

---

## 常见问题

### Q1: 为什么不把所有文档都放根目录？

**A**:
1. **可维护性差**：文档多了根目录会很混乱
2. **查找困难**：没有分类，不知道从哪找
3. **不符合规范**：业界最佳实践都是分目录组织
4. **影响第一印象**：新成员看到混乱的根目录会怀疑项目质量

### Q2: ai-templates/ 和 .claude/ 的区别？

**A**:
- **ai-templates/**：通用模板，可复用到其他项目
  - 例如：文档组织规范、Token优化策略
  - 特点：不包含项目特定信息

- **.claude/**：项目上下文，针对当前项目
  - 例如：项目文件地图、特定优化技巧
  - 特点：包含项目特定信息，不能直接复用

### Q3: 已经创建的文档如何移动？

**A**: 使用 git mv 保留历史记录
```bash
git mv OLD_PATH.md docs/requirements/01-feature.md
git commit -m "docs: 移动文档到标准目录"
```

### Q4: 创建临时笔记放哪里？

**A**:
- **项目相关**：`docs/notes/`
- **个人笔记**：本地不提交，或放 `.gitignore` 的 `notes/` 目录
- **待办事项**：使用 TodoWrite 工具或项目管理工具，不要创建 TODO.md

---

## 最佳实践总结

### 对于AI

1. **创建文档前先定位**
   - 读取对应目录的 README.md 了解现有文档
   - 确定下一个编号或文件名

2. **创建文档后更新索引**
   - 立即更新对应目录的 README.md
   - 保持索引最新

3. **遵循命名规范**
   - 需求：编号+功能名
   - 模板：全大写+下划线
   - 其他：小写+连字符

### 对于用户

1. **描述需求时指定类型**
   - "创建一个需求文档..." → AI知道放 docs/requirements/
   - "写一个通用的AI协作规范..." → AI知道放 ai-templates/

2. **定期检查根目录**
   - 发现临时文档及时分类移动
   - 保持根目录简洁

3. **维护索引文件**
   - 定期检查 README.md 是否最新
   - 标记已完成/废弃的文档

---

**版本**: 1.0.0
**最后更新**: 2025-01-19
**适用项目**: 所有AI辅助开发项目
