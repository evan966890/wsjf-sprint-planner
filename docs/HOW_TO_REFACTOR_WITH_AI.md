# 如何与AI协作进行代码重构

> 📘 **用户指南**: 如何使用本项目的重构质量保证体系
> 🎯 **目标**: 确保重构不引入bug，不降低UI质量

---

## 🚀 快速开始（5分钟上手）

### 场景：您想重构一个UI组件

#### Step 1: 运行准备脚本（自动化）
```bash
bash scripts/prepare-refactor.sh EditRequirementModal
```

脚本会自动：
- ✅ 检查开发服务器
- ✅ 创建截图目录
- ✅ 生成样式快照
- ✅ 引导您完成截图
- ✅ 验证准备完成

#### Step 2: 告诉AI开始重构
```
我已完成重构前的准备工作，截图保存在 docs/screenshots/before-refactor/

现在请重构 EditRequirementModal.tsx，要求：
1. 保持所有颜色和样式（特别是蓝色渐变标题栏）
2. 保持所有按钮的 type="button" 属性
3. 保持所有字段位置和布局
4. 重构完成后提醒我对比截图验证
```

#### Step 3: 等待AI完成，验证UI
```
AI会完成重构，然后提醒您验证。

您需要：
1. 打开 http://localhost:3000
2. 对比截图
3. 反馈结果给AI
```

#### Step 4: 确认无误后提交
```bash
git add .
git commit -m "refactor: EditRequirementModal (2229 → 618行, -72%)"
```

---

## 📋 详细步骤说明

### Phase 1: 重构前准备

#### 方法A: 使用自动化脚本（推荐）⭐

```bash
# 运行准备脚本
bash scripts/prepare-refactor.sh EditRequirementModal
```

**脚本会做什么**:
1. 检查开发服务器是否运行（如果没有，询问是否启动）
2. 创建截图目录 `docs/screenshots/before-refactor/`
3. 自动生成样式快照到 `docs/screenshots/styles-before-*.txt`
4. 提示您打开浏览器截图
5. 等待您确认"已完成截图"
6. 验证截图文件存在
7. 显示样式统计信息

**完成后，脚本会告诉您说什么给AI**。

#### 方法B: 手动准备

如果脚本不工作，可以手动准备：

```bash
# 1. 启动开发服务器
npm run dev

# 2. 创建目录
mkdir -p docs/screenshots/before-refactor

# 3. 打开浏览器截图
# http://localhost:3000
# 触发要重构的组件（如点击"新建需求"）

# 4. 截图所有状态
# - 默认状态
# - Hover状态
# - 展开的状态
# - 填写表单后的状态

# 5. 保存截图
# 保存到 docs/screenshots/before-refactor/
# 文件名如: EditRequirementModal-default.png

# 6. （可选）创建样式快照
git show HEAD:src/components/EditRequirementModal.tsx | \
  grep -o 'className="[^"]*"' > docs/screenshots/styles-before.txt
```

---

### Phase 2: 告诉AI开始重构

#### 推荐的提示词

```
我已完成重构前的准备工作：
- ✅ 截图保存在 docs/screenshots/before-refactor/
- ✅ 样式快照已创建
- ✅ 开发服务器正在运行

现在请重构 EditRequirementModal.tsx（当前2229行）

重构要求：
1. 保持所有颜色和样式
   - 标题栏的蓝色渐变（bg-gradient-to-r from-blue-600 to-blue-700）
   - 业务影响度的蓝色主题（bg-blue-50）
   - AI分析的紫色渐变（bg-gradient-to-br from-purple-50 to-indigo-50）
   - 影响范围的绿色主题（bg-green-50）
2. 保持所有按钮的 type="button" 属性
3. 保持所有字段的位置和布局
4. 渐进式重构，每完成一个section告诉我
5. 重构完成后，提醒我对比截图验证

如果发现任何样式或功能差异，请立即告诉我，我会要求您修复或回滚。

现在开始吧。
```

**AI会如何响应**:
- AI会确认重构要求
- AI会开始渐进式重构
- AI会在过程中通知您进度
- AI完成后会提醒您验证

---

### Phase 3: 验证重构结果

#### AI完成后会说
```
✅ 重构完成！

变更摘要：
- EditRequirementModal.tsx: 2229 → 618行 (-72%)
- 新增: useRequirementForm.ts, useDocumentManager.ts...

现在请您验证UI...（详细检查清单）
```

#### 您需要做什么

**Step 1: 打开浏览器**
```bash
# 确保开发服务器运行
http://localhost:3000
```

**Step 2: 打开截图对比**
```bash
# 打开之前的截图
docs/screenshots/before-refactor/EditRequirementModal-default.png
```

**Step 3: 逐项检查**

使用此清单：

```
视觉检查：
□ 标题栏
  □ 背景是蓝色渐变吗？（不是白色或灰色）
  □ 文字是白色吗？（不是黑色或灰色）
  □ 权重分徽章显示了吗？（半透明白色圆角）

□ 业务影响度评分
  □ 背景是浅蓝色吗？（bg-blue-50）
  □ 边框是深蓝色吗？（border-blue-200）
  □ 图标是蓝色的吗？

□ AI智能打分
  □ 背景是紫色渐变吗？（不是灰色）
  □ 边框是紫色的吗？
  □ 有"可选"徽章吗？（紫色）

□ 影响范围
  □ 背景是浅绿色吗？（bg-green-50）
  □ 边框是绿色的吗？

功能检查：
□ 点击"新建需求"按钮
  □ 正常打开弹窗？
  □ 不会下载HTML文件？

□ 点击所有按钮
  □ 都能正常响应？
  □ 不会有意外行为？

□ 填写表单
  □ 所有字段都能编辑？
  □ 下拉框都能选择？
  □ 保存功能正常？
```

**Step 4: 反馈结果**

**如果一切正常**:
```
验证完成，UI和功能都一致，重构成功！
```

**如果发现问题**:
```
发现问题：
1. 标题栏变成灰色了，应该是蓝色渐变
2. AI分析section变成灰色了，应该是紫色渐变
3. 点击保存按钮会下载HTML文件

请修复或回滚。
```

---

## 🤖 AI会如何响应您的反馈

### 场景1: 您说"一致"

```
AI: 太好了！重构成功。

建议您：
1. 清理截图文件（可选）
   rm -rf docs/screenshots/before-refactor/*

2. 提交代码
   git add .
   git commit -m "refactor: EditRequirementModal (2229 → 618行, -72%)"

3. 推送到远程（如果需要）
   git push origin main

需要我帮您创建commit吗？
```

### 场景2: 您说"有问题"

```
AI: 抱歉，重构引入了问题。我有两个方案：

方案1: 回滚（推荐，安全）
  立即恢复到重构前的版本

方案2: 修复
  如果问题简单，我尝试修复

您希望执行哪个方案？

（AI会等待您选择，不会自作主张）
```

---

## 🛠️ 可用的工具和脚本

### 1. 准备脚本
```bash
bash scripts/prepare-refactor.sh <ComponentName>
```
**作用**: 自动化引导重构前准备

### 2. 样式对比脚本
```bash
bash scripts/compare-styles.sh <ComponentName>
```
**作用**: 对比重构前后的样式差异

### 3. Pre-commit检查
```bash
npm run pre-commit
```
**作用**: 提交前自动检查（type属性、文件大小等）

### 4. Git hooks
```bash
# 自动执行，无需手动运行
# 会在 git commit 时自动检查：
# - type="button" 属性
# - 文件大小（500行限制）
# - 截图文件存在（重构提交）
# - TypeScript编译
```

---

## ❓ 常见问题

### Q1: 如果我不想截图怎么办？

**A**: 对于UI组件，强烈建议截图，原因：
1. 重构可能改变UI，截图是唯一的验证方式
2. 如果出问题，截图可以帮助快速恢复
3. 只需要5分钟，但能避免几小时的修复工作

如果确实不想截图，请在告诉AI时明确说明：
```
这不是UI组件重构，不需要截图。
请重构 <非UI组件>.ts
```

### Q2: 准备脚本在Windows上能用吗？

**A**: 可以，需要Git Bash环境：
```bash
# 在Git Bash中运行
bash scripts/prepare-refactor.sh EditRequirementModal
```

如果Git Bash不工作，请手动准备（参考"方法B"）。

### Q3: 重构完成后，我怎么知道要检查什么？

**A**: AI会提供详细的检查清单。您只需要：
1. 打开浏览器和截图
2. 按照AI给的清单逐项对比
3. 告诉AI"一致"或"有问题：xxx"

### Q4: 如果AI没有按照流程执行怎么办？

**A**: 提醒AI：
```
请按照 CLAUDE.md 中的"AI助手重构工作流程"执行：
1. 先询问我是否已截图
2. 等我确认后再重构
3. 完成后提醒我验证
```

### Q5: 重构后发现问题，但AI已经修改了很多文件怎么办？

**A**: 立即回滚：
```bash
# 回滚单个文件
git checkout HEAD -- src/components/EditRequirementModal.tsx

# 或回滚所有更改
git reset --hard HEAD

# 然后重新开始
```

---

## 📊 成功案例 vs 失败案例

### 失败案例：EditRequirementModal 第一次重构

**问题**:
- ❌ 没有截图
- ❌ 没有样式快照
- ❌ AI直接重构
- ❌ 没有提醒用户验证

**结果**:
- 21个按钮丢失 type 属性 → 点击下载HTML文件
- 所有颜色丢失 → UI全变灰色
- 字段位置错误 → 违背原设计

**耗时**: 发现+修复 = 2小时

### 成功案例（使用新流程）

**准备**:
- ✅ 运行准备脚本（5分钟）
- ✅ 完成截图
- ✅ 样式快照自动创建

**重构**:
- ✅ AI渐进式重构
- ✅ AI说明保留了哪些样式
- ✅ 用户可以监控进度

**验证**:
- ✅ AI提供详细检查清单
- ✅ 用户对比截图
- ✅ 发现问题立即回滚

**结果**:
- ✅ 功能完整
- ✅ UI一致
- ✅ 无bug引入

**耗时**: 准备5分钟 + 重构1小时 + 验证10分钟 = 1小时15分钟

**对比**: 使用新流程虽然多了15分钟准备，但避免了2小时修复，总体效率提升！

---

## 🎯 核心理念

### "强制AI截图"是错误的理解

```
❌ 错误理解：
"AI必须截图" → AI做不到

✅ 正确理解：
"AI引导用户截图，并在流程中验证" → 可执行
```

### 实际执行方式

```mermaid
用户请求重构
    ↓
AI询问"是否已截图？"
    ↓
用户运行 prepare-refactor.sh
    ↓
用户截图并确认
    ↓
AI开始重构
    ↓
AI完成并提醒验证
    ↓
用户对比截图
    ↓
用户反馈结果
    ↓
AI处理反馈（提交或回滚）
```

### 责任分工

| 角色 | 职责 |
|------|------|
| **用户** | 截图、验证UI、反馈结果 |
| **AI** | 引导流程、保持样式、执行重构、提醒验证 |
| **脚本** | 自动化准备、生成快照、检查完整性 |
| **Git Hook** | 自动验证、拦截错误 |

---

## 🎓 最佳实践

### 1. 永远使用准备脚本
```bash
# 不要手动准备，容易遗漏步骤
bash scripts/prepare-refactor.sh <ComponentName>
```

### 2. 重构前明确告诉AI要求
```
不要只说："重构这个文件"

应该说：
"重构 XXX.tsx，要求：
1. 保持所有颜色（蓝色渐变、紫色主题等）
2. 保持所有按钮 type 属性
3. 保持所有UI布局
4. 完成后提醒我验证"
```

### 3. 重构后认真验证
```
不要偷懒跳过验证！

5分钟验证，可以避免几小时的修复工作。
```

### 4. 发现问题立即反馈
```
不要想"可能没关系，先提交吧"

立即告诉AI：
"有问题：标题栏变成灰色了"

AI会修复或回滚。
```

---

## 📚 相关文档

### 用户文档
- [准备脚本使用说明](#step-1-运行准备脚本自动化)
- [手动准备方法](#方法b-手动准备)
- [验证检查清单](#step-3-逐项检查)

### AI助手文档
- [AI工作流程规范](./standards/ai-refactoring-workflow.md)
- [重构质量标准](../ai-templates/REFACTORING_QUALITY_STANDARDS.md)
- CLAUDE.md中的"AI助手重构工作流程"

### 技术文档
- [重构规范](./standards/refactoring-standards.md)
- [重构检查清单](./checklists/refactoring-checklist.md)
- [Git Hooks配置](../scripts/pre-commit-check.sh)

---

## 🚀 下一步

1. **试用准备脚本**
   ```bash
   bash scripts/prepare-refactor.sh EditRequirementModal
   ```

2. **阅读AI工作流程**
   了解AI会如何引导您

3. **配置Git Hooks**（如果还没有）
   ```bash
   npm run prepare
   npx husky add .husky/pre-commit "npm run pre-commit"
   ```

4. **开始下一次重构**
   这次使用新流程，体验质量保证！

---

**记住**: 重构质量保证不是限制，而是**保护您的工作成果**！
