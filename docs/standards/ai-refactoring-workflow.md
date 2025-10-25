# AI助手重构工作流程（可执行方案）

> 🎯 **目标**: 提供AI和用户协作进行重构的实际可执行流程
> 📅 **创建日期**: 2025-10-25

---

## ⚠️ 现实问题："AI不能截图"

### 错误的表述 ❌
```
"重构前强制AI截图" ← AI做不到
"AI必须对比UI" ← AI看不到浏览器界面
```

### 正确的方案 ✅
```
"AI引导用户截图，并在重构前确认" ← 可执行
"AI在重构后提醒用户对比UI" ← 可执行
"Git hook检查截图文件存在" ← 可自动化
```

---

## ✅ 可执行的工作流程

### 方案1: AI主动询问流程 ⭐⭐⭐ **推荐**

#### 当用户请求重构时，AI必须执行：

**Step 1: 评估重构范围**
```
AI: 我看到您要重构 EditRequirementModal.tsx (2229行)。
    这是一个包含UI的大型组件，重构前我需要确认几件事。
```

**Step 2: 引导用户准备**
```
AI: 在开始重构前，请先完成以下准备工作：

1. 运行开发服务器：
   npm run dev

2. 打开浏览器访问 http://localhost:3000

3. 截图以下UI状态并保存：
   - 点击"新建需求"按钮，截图完整弹窗
   - hover按钮时的状态
   - 展开所有折叠section的状态
   - 填写表单后的状态

4. 保存截图到：docs/screenshots/before-refactor/
   建议命名：
   - edit-modal-default.png
   - edit-modal-hover.png
   - edit-modal-expanded.png
   - edit-modal-filled.png

完成后请回复"已完成截图"，我再开始重构。
```

**Step 3: 等待用户确认**
```
用户: 已完成截图

AI: 好的，我现在开始重构。重构过程中我会：
    1. 保持所有颜色和样式
    2. 保持所有按钮的 type="button" 属性
    3. 渐进式重构，每个section单独验证

    重构完成后，我会提醒您对比截图验证。
```

---

### 方案2: 用户主动准备流程 ⭐⭐

#### 用户在请求重构前自己准备

**用户操作**:
```bash
# 1. 截图UI
npm run dev
# 打开浏览器截图所有状态

# 2. 创建样式快照
git show HEAD:src/components/XXX.tsx | \
  grep -o 'className="[^"]*"' > docs/screenshots/styles-before.txt

# 3. 告诉AI
```

**用户消息**:
```
我已经截图保存到 docs/screenshots/before-refactor/
现在请重构 EditRequirementModal.tsx，要求：
1. 保持所有颜色和样式
2. 保持所有UI元素
3. 重构完成后提醒我对比截图
```

---

### 方案3: Git Hook自动检查 ⭐⭐⭐ **推荐**

#### 通过Git hook强制验证截图存在

**创建检查脚本**: `scripts/check-refactor-screenshots.sh`

```bash
#!/bin/bash

# 检测是否是重构类型的commit
COMMIT_MSG=$(cat .git/COMMIT_EDITMSG 2>/dev/null || echo "")

if echo "$COMMIT_MSG" | grep -qi "refactor.*modal\|refactor.*component"; then
  echo "🔍 检测到重构提交，检查是否有截图..."

  # 检查是否有截图文件
  SCREENSHOT_COUNT=$(find docs/screenshots/before-refactor -name "*.png" -o -name "*.jpg" 2>/dev/null | wc -l)

  if [ $SCREENSHOT_COUNT -eq 0 ]; then
    echo ""
    echo "❌ 错误：重构UI组件前必须先截图！"
    echo ""
    echo "请执行："
    echo "1. npm run dev"
    echo "2. 打开浏览器截图所有UI状态"
    echo "3. 保存到 docs/screenshots/before-refactor/"
    echo ""
    echo "或者，如果这不是UI组件，请在commit message中说明。"
    echo ""
    exit 1
  else
    echo "✓ 找到 $SCREENSHOT_COUNT 个截图文件"
  fi
fi
```

**配置Git hook**:
```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# 运行截图检查
bash scripts/check-refactor-screenshots.sh
```

---

### 方案4: AI工作流程规范 ⭐⭐⭐

#### AI在重构时的标准流程

**阶段1: 重构前询问**
```markdown
AI检测到重构请求 →

AI回复：
"我注意到您要重构一个UI组件。在开始前，我需要确认：

□ 您是否已经运行 npm run dev 并打开浏览器？
□ 您是否已经截图了当前UI的所有状态？
□ 您是否已经保存截图到 docs/screenshots/before-refactor/ ？

如果都完成了，请回复"确认"，我会开始重构。

如果还没有，我建议先完成截图，因为：
1. 重构后需要对比UI是否一致
2. 如果出现问题，截图可以作为参考
3. 这是重构质量保证的重要步骤

是否现在开始截图？我可以指导您操作。"
```

**阶段2: 重构中通知**
```markdown
AI执行重构中 →

每完成一个section，AI通知：
"已完成<section名>的重构，保持了以下样式：
- bg-gradient-to-r from-blue-600 to-blue-700
- 所有按钮的 type="button" 属性
- ...

继续下一个section..."
```

**阶段3: 重构后提醒**
```markdown
AI完成重构 →

AI回复：
"✅ 重构已完成！

现在请您：
1. 运行 npm run dev（如果还没运行）
2. 打开浏览器 http://localhost:3000
3. 打开之前的截图
4. 逐一对比以下内容：
   - 标题栏颜色是否是蓝色渐变？
   - 各section背景颜色是否正确？
   - 按钮点击是否正常（不会下载文件）？
   - 所有字段是否都在正确位置？

如果发现任何差异，请告诉我，我会立即修复或回滚。

对比结果如何？"
```

---

## 🛠️ 实际可用的工具

### 工具1: AI提示词模板

**保存为**: `ai-templates/prompts/refactor-request-template.md`

```markdown
# AI重构请求模板

当我说"重构<组件名>"时，请按照以下流程执行：

## Phase 1: 准备确认
请先询问我：
- [ ] 是否已截图当前UI
- [ ] 是否已运行开发服务器
- [ ] 是否理解重构范围和目标

等待我确认后再继续。

## Phase 2: 执行重构
要求：
- 渐进式重构，每个section单独处理
- 保持所有颜色和样式
- 保持所有HTML属性
- 每完成一部分就通知我

## Phase 3: 验证提醒
重构完成后，提醒我：
- 对比截图
- 测试所有功能
- 检查颜色是否一致

只有我确认"UI一致"后，才算重构完成。
```

**使用方法**:
```
用户在 .claude/settings.local.json 中配置：
{
  "customInstructions": "重构UI组件时，请遵循 ai-templates/prompts/refactor-request-template.md 的流程"
}
```

---

### 工具2: 重构前检查命令

**创建脚本**: `scripts/prepare-refactor.sh`

```bash
#!/bin/bash

COMPONENT=$1

echo "=== 重构准备检查清单 ==="
echo ""

# 1. 检查开发服务器是否运行
echo "□ 1. 检查开发服务器..."
if lsof -i:3000 > /dev/null 2>&1; then
  echo "   ✓ 开发服务器正在运行 (http://localhost:3000)"
else
  echo "   ✗ 开发服务器未运行"
  echo "   请运行: npm run dev"
  echo ""
  read -p "现在启动开发服务器吗? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run dev &
    sleep 3
    echo "   ✓ 开发服务器已启动"
  fi
fi

echo ""

# 2. 检查截图目录
echo "□ 2. 检查截图目录..."
mkdir -p docs/screenshots/before-refactor
echo "   ✓ 目录已创建: docs/screenshots/before-refactor/"

echo ""

# 3. 创建样式快照
echo "□ 3. 创建样式快照..."
if [ -f "src/components/$COMPONENT.tsx" ]; then
  git show HEAD:src/components/$COMPONENT.tsx | \
    grep -o 'className="[^"]*"' | \
    grep -E "bg-|text-|border-" | \
    sort | uniq > docs/screenshots/styles-before-$COMPONENT.txt
  echo "   ✓ 样式快照已创建: docs/screenshots/styles-before-$COMPONENT.txt"
else
  echo "   ✗ 文件不存在: src/components/$COMPONENT.tsx"
fi

echo ""

# 4. 提示用户截图
echo "□ 4. 请手动截图UI状态..."
echo ""
echo "   请完成以下操作："
echo "   1. 打开浏览器 http://localhost:3000"
echo "   2. 触发要重构的组件显示（如点击"新建需求"）"
echo "   3. 截图所有UI状态："
echo "      - 默认状态"
echo "      - hover状态"
echo "      - 展开所有section"
echo "      - 填写表单后的状态"
echo "   4. 保存截图到 docs/screenshots/before-refactor/"
echo ""
read -p "完成截图了吗？(y/n) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo ""
  echo "请先完成截图再开始重构！"
  exit 1
fi

echo ""

# 5. 验证截图存在
echo "□ 5. 验证截图文件..."
SCREENSHOT_COUNT=$(ls docs/screenshots/before-refactor/*.{png,jpg} 2>/dev/null | wc -l)
if [ $SCREENSHOT_COUNT -gt 0 ]; then
  echo "   ✓ 找到 $SCREENSHOT_COUNT 个截图文件"
else
  echo "   ⚠️  未找到截图文件，但您说已完成"
  echo "   请确保截图保存在正确位置"
fi

echo ""
echo "==================================="
echo "✅ 重构准备完成！"
echo ""
echo "现在可以告诉AI："
echo "\"我已完成截图，保存在 docs/screenshots/before-refactor/"
echo " 现在请开始重构 $COMPONENT.tsx，要求保持所有颜色和样式。\""
echo ""
```

**使用方法**:
```bash
# 用户在重构前运行
bash scripts/prepare-refactor.sh EditRequirementModal

# 脚本会：
# 1. 检查开发服务器
# 2. 创建截图目录
# 3. 创建样式快照
# 4. 引导用户截图
# 5. 验证截图存在
```

---

### 工具3: Git Hook强制检查

**修改**: `scripts/pre-commit-check.sh`

添加截图检查：

```bash
# =============================================================================
# 检查6: 重构提交必须有截图
# =============================================================================
echo "📌 检查6: 重构提交是否有截图..."

# 获取提交信息
COMMIT_MSG_FILE=".git/COMMIT_EDITMSG"
if [ -f "$COMMIT_MSG_FILE" ]; then
  COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")

  # 检测是否是UI组件重构
  if echo "$COMMIT_MSG" | grep -Eqi "refactor.*(modal|component|ui|界面)"; then
    # 检查是否有截图文件
    SCREENSHOT_COUNT=$(find docs/screenshots/before-refactor -name "*.png" -o -name "*.jpg" 2>/dev/null | wc -l)

    if [ $SCREENSHOT_COUNT -eq 0 ]; then
      echo -e "${RED}❌ 错误: UI组件重构必须先截图${NC}"
      echo ""
      echo "请执行："
      echo "  bash scripts/prepare-refactor.sh <ComponentName>"
      echo ""
      echo "或者，如果您已经截图，请确保文件在："
      echo "  docs/screenshots/before-refactor/"
      echo ""
      echo "如果这不是UI组件重构，请在commit message中说明。"
      echo ""
      ERROR_COUNT=$((ERROR_COUNT + 1))
    else
      echo -e "${GREEN}✓ 找到 $SCREENSHOT_COUNT 个截图文件${NC}"
    fi
  else
    echo -e "${GREEN}✓ 非UI组件重构，跳过${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  无法读取commit message，跳过检查${NC}"
fi

echo ""
```

---

### 工具4: AI标准响应模板

#### 当用户说"重构XXX组件"时，AI应该这样回复：

```markdown
我来帮您重构 <组件名>。这是一个UI组件，重构前我需要确认：

## 准备工作检查

**方法1（推荐）- 使用自动化脚本**:
```bash
bash scripts/prepare-refactor.sh <ComponentName>
```
脚本会自动引导您完成所有准备工作。

**方法2 - 手动准备**:
1. □ 运行开发服务器: `npm run dev`
2. □ 截图所有UI状态
3. □ 保存到 `docs/screenshots/before-refactor/`
4. □ 创建样式快照（可选，脚本会自动创建）

---

**您已经完成准备了吗？**
- 如果是，请回复"确认"，我开始重构
- 如果否，请回复"需要帮助"，我详细说明每一步

**重构承诺**:
- ✅ 保持所有颜色和渐变效果
- ✅ 保持所有HTML属性（type、className等）
- ✅ 保持所有UI元素和交互
- ✅ 重构后提醒您对比截图验证
```

---

### 工具5: 重构后验证提醒

#### AI重构完成后的标准回复：

```markdown
✅ 重构已完成！

## 文件变更
- EditRequirementModal.tsx: 2229 → 618行 (-72%)
- 新增Hook: useRequirementForm.ts
- 新增组件: AIAnalysisPanel.tsx

## ⚠️ 现在请您验证UI（非常重要！）

### Step 1: 运行并打开
```bash
npm run dev
# 打开 http://localhost:3000
```

### Step 2: 对比截图检查清单

请打开之前的截图 `docs/screenshots/before-refactor/`，逐一对比：

**标题栏**:
- [ ] 是否是蓝色渐变背景？ (应该是 from-blue-600 to-blue-700)
- [ ] 文字是否是白色？
- [ ] 关闭按钮hover时是否变色？

**业务影响度评分section**:
- [ ] 背景是否是浅蓝色？ (应该是 bg-blue-50)
- [ ] 边框是否是深蓝色？ (应该是 border-blue-200)
- [ ] 图标是否是蓝色？

**AI智能打分section**:
- [ ] 背景是否是紫色渐变？ (应该是 from-purple-50 to-indigo-50)
- [ ] 边框是否是紫色？
- [ ] "可选"徽章是否显示？

**影响范围section**:
- [ ] 背景是否是浅绿色？ (应该是 bg-green-50)
- [ ] 边框是否是绿色？

**所有按钮**:
- [ ] 点击"新建需求"按钮，是否正常打开弹窗？
- [ ] 是否会触发下载HTML文件？ (不应该)
- [ ] 所有按钮点击是否正常？

### Step 3: 反馈结果

请告诉我对比结果：
- 如果完全一致 → 重构成功！
- 如果有差异 → 告诉我哪里不同，我立即修复或回滚

---

我在等待您的验证结果...
```

---

## 📋 用户操作清单（打印版）

### 重构前准备（5分钟）

```
□ 1. 运行开发服务器
     npm run dev

□ 2. 打开浏览器
     http://localhost:3000

□ 3. 触发UI显示
     例如：点击"新建需求"按钮

□ 4. 截图以下状态
     □ 默认状态 → edit-modal-default.png
     □ Hover状态 → edit-modal-hover.png
     □ 展开所有section → edit-modal-expanded.png
     □ 填写表单后 → edit-modal-filled.png

□ 5. 保存截图
     保存到: docs/screenshots/before-refactor/

□ 6. 告诉AI
     "已完成截图，开始重构吧"
```

### 重构后验证（10分钟）

```
□ 1. 确认开发服务器运行
     http://localhost:3000

□ 2. 打开之前的截图
     docs/screenshots/before-refactor/

□ 3. 逐一对比
     □ 标题栏颜色
     □ Section背景颜色
     □ 按钮样式
     □ 文字颜色
     □ 边框样式

□ 4. 功能测试
     □ 点击所有按钮
     □ 不会下载文件
     □ 表单提交正常
     □ 所有字段可编辑

□ 5. 反馈给AI
     "UI一致，重构成功"
     或
     "发现问题：xxx"
```

---

## 🤖 AI端实现方案

### 在 CLAUDE.md 中添加指令

```markdown
## AI重构工作流程（强制执行）

当用户请求重构UI组件时，必须按照以下流程：

### 1. 重构前询问（必须）
- 询问用户是否已截图
- 如果没有，引导用户使用 `bash scripts/prepare-refactor.sh`
- 等待用户确认"已完成截图"

### 2. 重构中通知（推荐）
- 每完成一个section，说明保留了哪些样式
- 提醒用户可以实时查看进度

### 3. 重构后验证（必须）
- 提供详细的对比检查清单
- 等待用户反馈验证结果
- 如果有问题，立即修复或回滚

### 禁止的行为
- ❌ 直接开始重构，不询问截图
- ❌ 重构完成后不提醒用户验证
- ❌ 用户说"有问题"时，辩解而不是修复
```

---

## 🎯 实施方案总结

### 可以自动化的部分 ✅
1. **Git hook检查截图文件存在** - `scripts/check-refactor-screenshots.sh`
2. **准备脚本引导用户** - `scripts/prepare-refactor.sh`
3. **样式快照自动创建** - 在准备脚本中
4. **Pre-commit自动检查** - 样式、属性、类型等

### 需要AI配合的部分 🤖
1. **重构前询问用户** - AI在CLAUDE.md中的指令
2. **重构后提醒验证** - AI在CLAUDE.md中的指令
3. **提供详细检查清单** - AI自动生成

### 需要用户配合的部分 👤
1. **手动截图** - 只有用户能看到浏览器界面
2. **对比验证** - 只有用户能判断UI是否一致
3. **反馈结果** - 告诉AI"一致"或"有问题"

---

## 💡 最佳实践流程（完整示例）

### 用户发起
```
用户: 请重构 EditRequirementModal.tsx
```

### AI响应（Phase 1 - 准备）
```
AI: 我来帮您重构这个UI组件。在开始前，请先运行：

    bash scripts/prepare-refactor.sh EditRequirementModal

    脚本会引导您完成所有准备工作（截图、样式快照等）。

    完成后请回复"已完成"。
```

### 用户操作
```
用户: [运行脚本，按提示截图]
用户: 已完成
```

### AI执行（Phase 2 - 重构）
```
AI: 好的，我现在开始重构。我会：
    - 保持所有颜色（蓝色渐变、紫色主题等）
    - 保持所有按钮的 type="button"
    - 渐进式重构，逐个section处理

    [执行重构...]
```

### AI完成（Phase 3 - 验证）
```
AI: ✅ 重构完成！

    现在请您验证UI：
    1. 打开 http://localhost:3000
    2. 点击"新建需求"
    3. 对比截图，检查以下内容：
       □ 标题栏是蓝色渐变吗？
       □ 各section颜色正确吗？
       □ 点击按钮会下载文件吗？（不应该）

    结果如何？
```

### 用户反馈
```
用户: UI一致，重构成功 ✅
或
用户: 标题栏变成灰色了 ❌
```

### AI处理反馈
```
如果成功: AI祝贺并建议提交
如果失败: AI立即分析问题并修复或回滚
```

---

## 📊 总结

### 关键理解
```
"强制AI截图" ❌ 不可行
↓
"AI引导用户截图，并在流程中验证" ✅ 可行
```

### 实际执行方案
1. **准备脚本** - 自动化引导用户
2. **AI工作流程** - 标准询问和提醒
3. **Git hook** - 自动验证截图存在
4. **用户确认** - 最终的质量把关

### 责任分工
- **用户**: 截图、验证UI、反馈结果
- **AI**: 引导流程、保持样式、提醒验证
- **工具**: 自动化检查、创建快照、拦截错误

---

**关键**: AI不能替代用户的视觉验证，但可以通过**流程设计**和**自动化工具**来确保重构质量！
