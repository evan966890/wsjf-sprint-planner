# 通用AI协作模板

> 本目录包含可复用到其他项目的通用AI协作规范和模板
>
> **特点**: 不包含项目特定信息，可直接复制到新项目使用

## 📚 模板列表

### 核心规范文档

#### 1. [AI_COLLABORATION_BEST_PRACTICES.md](./AI_COLLABORATION_BEST_PRACTICES.md)
**AI协作最佳实践 - Token优化核心指南**

- **目的**: 防止项目后期Token消耗指数级增长
- **核心内容**:
  - 黄金法则：避免重复读取文件
  - 分阶段优化策略（0-1K、1K-5K、5K+代码行）
  - 文件组织标准（组件<300行，工具<200行）
  - 折衷协作方案：用户描述功能，AI定位文件
  - 不同项目阶段的检查清单
  - 实战案例分析

- **适用场景**:
  - 新项目启动时，作为AI协作规范
  - 现有项目Token消耗过高，需要优化
  - 团队建立AI协作标准流程

- **预期效果**:
  - Token消耗降低 50-85%
  - AI响应速度提升 2-3倍
  - 项目可维护性显著提高

#### 2. [DOCUMENT_ORGANIZATION.md](./DOCUMENT_ORGANIZATION.md)
**文档组织规范 - 避免根目录混乱**

- **目的**: 建立清晰的文档组织结构，避免根目录文档混乱
- **核心内容**:
  - 标准目录结构（ai-templates/, docs/, .claude/）
  - 文档分类规则（需求/架构/API/指南）
  - AI创建文档时的规范和检查清单
  - 目录索引维护方法
  - 迁移指南（整理现有混乱项目）

- **适用场景**:
  - 新项目启动，建立文档组织规范
  - 现有项目根目录混乱，需要整理
  - AI频繁在错误位置创建文档

- **预期效果**:
  - 根目录保持简洁（≤10个文件）
  - 文档分类清晰，易于查找
  - AI自动将文档放到正确位置

#### 3. [FILE_NAMING_CONVENTIONS.md](./FILE_NAMING_CONVENTIONS.md)
**文件命名规范 - 统一命名风格**

- **目的**: 建立统一的文件命名规范，提高可读性和可维护性
- **核心内容**:
  - 不同类型文件的命名风格（文档/代码/配置）
  - 命名风格速查表
  - 常见错误示例和正确做法
  - AI创建文件时的检查清单
  - 批量重命名指南

- **适用场景**:
  - 新项目启动，建立命名规范
  - 团队协作，统一命名风格
  - AI创建的文件命名不一致

- **预期效果**:
  - 命名风格统一一致
  - 文件易于搜索和定位
  - 提升代码可读性

#### 4. [SENSITIVE_DATA_SECURITY.md](./SENSITIVE_DATA_SECURITY.md) 🔒
**敏感信息安全管理规范 - 防止密钥泄露**

- **目的**: 防止API密钥、密码等敏感信息泄露到代码仓库
- **核心内容**:
  - 黄金法则：永远不要在代码中提交明文密钥
  - 敏感信息分类（API密钥/数据库密码/加密密钥）
  - 正确的密钥管理方式（环境变量/配置文件/.gitignore）
  - 密钥泄露检测和应急处理
  - AI协作时的安全规范
  - Git提交前检查清单

- **适用场景**:
  - 新项目启动，建立密钥管理规范
  - AI建议在代码中添加明文密钥（必须拒绝）
  - 需要配置第三方服务API Key
  - 密钥不慎泄露，需要应急处理

- **预期效果**:
  - 零密钥泄露到Git仓库
  - 团队统一使用环境变量管理密钥
  - AI自动引导正确的配置方式
  - 建立密钥泄露应急响应机制

- **⚠️ 重要性**: ⭐⭐⭐⭐⭐
  - 密钥泄露可能导致高额费用（API滥用）
  - 数据库密码泄露可能导致数据被窃取/删除
  - 一旦泄露到公开仓库很难彻底删除

#### 5. [UI_UX_BEST_PRACTICES.md](./UI_UX_BEST_PRACTICES.md) 🎨
**UI/UX 最佳实践规范 - 现代化用户体验**

- **目的**: 建立现代化、用户友好的UI/UX设计标准
- **核心内容**:
  - 黄金法则：永远不要使用 alert/confirm/prompt
  - Toast提示（轻量级通知）⭐⭐⭐
  - Modal对话框（需要确认）
  - 内联提示（表单验证）
  - 提示方式选择指南
  - UI组件库推荐（react-hot-toast、sonner等）
  - AI协作时的UI/UX规范

- **适用场景**:
  - 新项目启动，建立UI/UX标准
  - AI建议使用 alert 弹窗（必须拒绝）
  - 需要实现用户提示和反馈
  - 优化现有项目的用户体验

- **预期效果**:
  - 零 alert/confirm/prompt 在代码中
  - 统一使用 Toast 等现代化提示方式
  - AI自动引导正确的UI/UX实现
  - 提升用户体验和产品专业度

- **替代方案**:
  - alert → Toast（成功/错误提示）
  - confirm → Modal对话框
  - prompt → Input Modal
  - 表单错误 → 内联提示

#### 6. [DEBUGGING_LESSONS_LEARNED.md](./DEBUGGING_LESSONS_LEARNED.md) 🐛
**调试经验教训 - 系统化排查问题**

- **目的**: 记录重要调试案例和经验教训，建立系统化调试流程
- **核心内容**:
  - 真实案例分析（UI渲染遗漏问题 2025-01-20）
  - 调试过程复盘（从20轮到3轮的效率提升）
  - 根本原因分析（枚举值遗漏）
  - 经验教训总结（黄金法则：数据存在但不显示=90%渲染问题）
  - 预防措施清单（类型安全、运行时验证、调试工具）
  - 最佳实践（分组逻辑穷举、防御性编程）

- **适用场景**:
  - 遇到难以定位的Bug
  - 调试耗时过长，需要系统化方法
  - 团队成员学习调试经验
  - 避免重复踩坑

- **预期效果**:
  - 调试效率提升 3-5倍
  - 类似问题预防（类型安全规范）
  - 团队调试能力提升
  - 经验沉淀和传承

- **关联文档**:
  - 📖 [调试决策树](../docs/debugging-decision-tree.md) - 系统化排查流程
  - ✅ [代码审查检查清单](../docs/code-review-checklist.md) - PR审查标准

#### 7. [REFACTORING_LESSONS_LEARNED.md](./REFACTORING_LESSONS_LEARNED.md) 🔧
**重构经验教训总结 - 大规模重构复盘**

- **目的**: 总结5000+行代码重构的经验教训，避免重复犯错
- **核心内容**:
  - 重构背景（5个文件超过500行）
  - 五大教训总结（规范自动化、200行警觉等）
  - 失败原因分析（破窗效应、临时代码永久化）
  - 成功重构案例（-80%代码量）
  - 预防措施（分级预警、Git hooks、开发前检查）

- **适用场景**:
  - 大规模代码重构（>1000行）
  - 建立重构标准流程
  - 避免重构失控（500行→3000行）

- **预期效果**:
  - 避免文件膨胀（重构8小时 vs 预防30分钟）
  - 重构质量可控
  - 团队形成重构共识

#### 8. [FILE_SIZE_ENFORCEMENT.md](./FILE_SIZE_ENFORCEMENT.md) 📏
**文件大小强制执行规范 - 新项目模板**

- **目的**: 为新项目提供文件大小强制执行的完整模板
- **核心内容**:
  - 分级预警机制（200/300/400/500行）
  - Git hooks配置模板
  - ESLint max-lines规则
  - CI/CD集成方案
  - 新项目初始化检查清单

- **适用场景**:
  - 新项目启动
  - 建立代码质量保障体系
  - 复制到其他项目

- **预期效果**:
  - 零文件超过500行
  - 自动拦截超大文件
  - 30分钟投入，预防8小时重构

#### 9. [REFACTORING_QUALITY_STANDARDS.md](./REFACTORING_QUALITY_STANDARDS.md) ⭐ **新增 2025-10-25**
**重构质量保证标准 - UI完整性和样式保持规范**

- **目的**: 防止重构引入功能性bug和UI降级（颜色丢失、样式简化）
- **核心内容**:
  - 重构失败案例分析（按钮下载HTML、所有颜色丢失）
  - UI完整性优先级规范（颜色是功能的一部分）
  - 样式保持完整性检查清单
  - HTML属性完整性规范（type="button"等）
  - 颜色系统映射规范（禁止批量替换颜色）
  - AI助手常见错误模式和最佳实践
  - 自动化工具（样式对比脚本、pre-commit增强）
  - 标准重构流程（3阶段验证）

- **适用场景**:
  - ⭐ **AI助手进行代码重构前必读**
  - 重构引入UI降级或功能bug时参考
  - 建立重构质量保证流程
  - 培训团队成员重构最佳实践

- **预期效果**:
  - 重构bug率降低 95%
  - UI完整性保持 100%
  - 用户满意度提升
  - 重构质量稳定可控

- **关联文档**:
  - 📖 [重构规范](../docs/standards/refactoring-standards.md) - 项目具体规范
  - ✅ [重构检查清单](../docs/checklists/refactoring-checklist.md) - 操作清单
  - 📊 [重构Bug分析](../docs/refactoring-lessons/refactoring-bug-analysis.md) - 案例分析

---

## 🎯 使用方法

### 方法1: 新项目启动（推荐）⭐

**步骤1: 复制模板目录**
```bash
# 在新项目根目录执行
cp -r /path/to/wsjf/ai-templates ./
```

**步骤2: 创建项目上下文目录**
```bash
mkdir .claude
```

**步骤3: 在项目规范中引用**

在 `.claude/project-rules.md` 中添加：
```markdown
## 文档组织规范

本项目遵循 ai-templates/DOCUMENT_ORGANIZATION.md 的规范。

核心要点：
- 永远不要在根目录创建临时文档
- 需求文档放 docs/requirements/，使用编号命名
- 通用模板放 ai-templates/
- 项目上下文放 .claude/

详见：[ai-templates/DOCUMENT_ORGANIZATION.md](../ai-templates/DOCUMENT_ORGANIZATION.md)

## 文件命名规范

本项目遵循 ai-templates/FILE_NAMING_CONVENTIONS.md 的规范。

快速参考：
- 文档：UPPER_CASE（根目录）或 kebab-case（子目录）
- 组件：PascalCase.tsx
- 工具：camelCase.ts
- 需求：编号-kebab-case.md

详见：[ai-templates/FILE_NAMING_CONVENTIONS.md](../ai-templates/FILE_NAMING_CONVENTIONS.md)
```

**步骤4: 创建标准目录结构**
```bash
mkdir -p docs/{requirements,architecture,api,guides}
```

**步骤5: 在首次AI对话中声明**
```
用户: "本项目遵循 ai-templates/ 中的通用规范，包括文档组织和文件命名。
请在创建任何文件前先查看相关规范。"
```

### 方法2: 现有项目整合

**步骤1: 添加模板目录**
```bash
# 复制模板到现有项目
cp -r /path/to/wsjf/ai-templates ./
```

**步骤2: 整理现有文档**

参考 `DOCUMENT_ORGANIZATION.md` 的迁移指南：
```bash
# 创建标准目录
mkdir -p docs/{requirements,architecture,api,guides}

# 移动文档到正确位置
git mv *REQUIREMENTS*.md docs/requirements/
git mv *ARCHITECTURE*.md docs/architecture/

# 重命名为规范格式
cd docs/requirements/
git mv FEATURE_A.md 01-feature-a.md
```

**步骤3: 更新项目规范**

在现有的项目规范文件中添加引用（参考方法1步骤3）

**步骤4: 创建文档索引**
```bash
# 为每个文档目录创建索引
touch docs/requirements/README.md
touch docs/architecture/README.md
```

### 方法3: 团队标准模板

**场景**: 建立公司/团队级别的AI协作标准

**步骤1: 创建团队模板仓库**
```bash
# 创建新仓库
git init ai-collaboration-templates
cd ai-collaboration-templates

# 复制所有模板
cp -r /path/to/wsjf/ai-templates/* ./

# 添加团队特定规范
# 编辑文件，添加团队约定...

# 提交到团队仓库
git add .
git commit -m "init: 建立团队AI协作模板"
git push origin main
```

**步骤2: 新项目使用**
```bash
# 克隆模板到新项目
cd new-project/
git clone https://github.com/your-team/ai-collaboration-templates ai-templates

# 或使用 git submodule
git submodule add https://github.com/your-team/ai-collaboration-templates ai-templates
```

**步骤3: 持续改进**
- 每个项目的经验反哺到模板仓库
- 定期更新和优化规范
- 团队成员共同维护

---

## 📖 快速参考

### 何时使用哪个模板？

| 场景 | 使用模板 | 关键内容 |
|------|---------|---------|
| **Token消耗过高** | AI_COLLABORATION_BEST_PRACTICES.md | 折衷协作方案、分段读取策略 |
| **AI在根目录创建文档** | DOCUMENT_ORGANIZATION.md | 标准目录结构、文档分类规则 |
| **文件命名不一致** | FILE_NAMING_CONVENTIONS.md | 命名风格速查表、检查清单 |
| **新项目启动** | 全部三个模板 | 建立完整规范体系 |
| **团队协作混乱** | 全部三个模板 | 统一团队标准 |

### 与 .claude/ 目录的区别

| 目录 | 用途 | 内容特点 | 可复用性 |
|------|------|---------|---------|
| **ai-templates/** | 通用模板 | 不包含项目特定信息 | ✅ 可直接复用到其他项目 |
| **.claude/** | 项目上下文 | 包含项目特定信息 | ❌ 仅适用于当前项目 |

**示例**:
- `ai-templates/DOCUMENT_ORGANIZATION.md` - 通用文档组织规范（任何项目都适用）
- `.claude/context.md` - WSJF项目的文件地图（仅WSJF项目适用）

---

## 🔄 维护和更新

### 如何改进模板？

**发现新的最佳实践时**:

1. **在当前项目验证**
   - 先在当前项目实践新方法
   - 验证效果（Token优化、效率提升）

2. **更新对应模板**
   ```bash
   # 编辑模板文件
   vi ai-templates/AI_COLLABORATION_BEST_PRACTICES.md

   # 添加新的实践案例
   # 更新版本号和最后更新时间

   # 提交
   git add ai-templates/
   git commit -m "docs: 更新AI协作最佳实践 - 添加XX优化方法"
   ```

3. **同步到其他项目**
   ```bash
   # 如果使用 git submodule
   cd other-project/ai-templates
   git pull origin main

   # 如果是直接复制，手动同步
   cp /path/to/wsjf/ai-templates/* ./ai-templates/
   ```

### 版本管理

每个模板文件底部都有版本信息：
```markdown
---
**版本**: 1.0.0
**最后更新**: 2025-01-19
**适用项目**: 所有AI辅助开发项目
```

**更新版本号规则**:
- 重大变更（结构调整）：1.0.0 → 2.0.0
- 新增章节/内容：1.0.0 → 1.1.0
- 小修小补：1.0.0 → 1.0.1

---

## ⚠️ 注意事项

### 1. 不要在模板中添加项目特定信息

❌ 错误示例：
```markdown
# 在 DOCUMENT_ORGANIZATION.md 中写：
本项目的主组件是 wsjf-sprint-planner.tsx...
```

✅ 正确示例：
```markdown
# 在 DOCUMENT_ORGANIZATION.md 中写：
项目主组件应该放在 src/ 目录...
```

**项目特定信息应该放在 `.claude/` 目录**

### 2. 保持模板通用性

模板应该：
- ✅ 适用于任何编程语言和框架
- ✅ 提供通用原则和方法
- ✅ 给出示例但不限定具体技术栈
- ❌ 避免绑定特定工具或平台

### 3. 定期审查和清理

- 每季度审查一次模板内容
- 删除过时的实践
- 更新示例代码和最佳实践
- 保持文档简洁，避免冗余

---

## 📊 效果追踪

### 使用模板前 vs 使用模板后

| 指标 | 使用前 | 使用后 | 改进 |
|------|-------|-------|------|
| **Token消耗** | 80K-150K/对话 | 15K-40K/对话 | ⬇️ 60-75% |
| **AI响应时间** | 15-30秒 | 5-10秒 | ⬆️ 2-3倍 |
| **根目录文件数** | 20-30个 | ≤10个 | ⬇️ 60% |
| **文档查找时间** | 3-5分钟 | 30秒 | ⬆️ 6-10倍 |
| **命名一致性** | 60% | 95% | ⬆️ 35% |

**实际案例: WSJF项目**
- 创建配置索引后：搜索配置从7次读取 → 1次读取
- 使用折衷协作：Token从15K → 3K（修改评分标准）
- 文档分类后：根目录从23个文件 → 8个核心文件

---

## 🤝 贡献和反馈

### 如何贡献改进？

1. **发现问题或改进点**
   - 在实际使用中记录问题
   - 思考改进方案

2. **提交改进**
   - 编辑对应模板文件
   - 添加清晰的说明和示例
   - 更新版本号

3. **分享经验**
   - 在团队内分享使用心得
   - 将成功案例添加到模板中

### 反馈渠道

- 项目Issues: 提交模板改进建议
- 团队会议: 分享使用经验
- 文档PR: 直接提交改进

---

## 📚 相关资源

### 项目特定文档（在 .claude/ 目录）

- `.claude/context.md` - 项目快速索引
- `.claude/tips.md` - 项目优化技巧
- `.claude/project-rules.md` - 项目代码规范

### 项目文档（在 docs/ 目录）

- `docs/TOKEN_OPTIMIZATION_GUIDE.md` - 本项目的Token优化实践记录
- `docs/requirements/` - 需求文档
- `docs/architecture/` - 架构设计文档

---

## 🎓 学习路径

### 新项目启动时

1. **第一步**: 阅读 `AI_COLLABORATION_BEST_PRACTICES.md`
   - 理解Token优化核心原则
   - 了解折衷协作方案

2. **第二步**: 阅读 `DOCUMENT_ORGANIZATION.md`
   - 建立标准目录结构
   - 设定文档分类规则

3. **第三步**: 阅读 `FILE_NAMING_CONVENTIONS.md`
   - 确定文件命名风格
   - 创建命名检查清单

4. **第四步**: 在项目规范中引用
   - 更新 `.claude/project-rules.md`
   - 声明遵循的规范

### 现有项目优化时

1. **问题诊断**: Token消耗过高？文档混乱？命名不一致？
2. **查找方案**: 在对应模板中找到解决方案
3. **逐步实施**: 不要一次性大改，分阶段优化
4. **效果验证**: 追踪改进效果，记录到项目文档

---

## 💡 最佳实践

### ✅ 推荐做法

1. **新项目第一天就复制模板**
   - 不要等到项目混乱再整理
   - 从一开始就建立规范

2. **在项目规范中引用模板**
   - 不要重复写规范
   - 引用模板，保持一致性

3. **定期更新模板**
   - 每个项目的经验都反哺到模板
   - 持续改进和完善

4. **团队共同维护**
   - 不是个人的规范，是团队的标准
   - 共同遵守，共同改进

### ❌ 避免的做法

1. **不要复制后就忘记**
   - 模板不是装饰品
   - 要实际使用和遵守

2. **不要在模板中添加项目特定内容**
   - 保持模板通用性
   - 项目特定内容放 .claude/

3. **不要死板遵守**
   - 规范是指导，不是教条
   - 根据实际情况灵活调整

---

**最后更新**: 2025-01-19
**维护者**: WSJF项目团队
**反馈**: 欢迎提出改进建议
