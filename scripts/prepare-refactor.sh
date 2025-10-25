#!/bin/bash

# =============================================================================
# 重构准备脚本 - 引导用户完成重构前的所有准备工作
# =============================================================================
#
# 用途：在AI重构组件前，引导用户截图和创建参考材料
# 使用：bash scripts/prepare-refactor.sh <ComponentName>
#
# 示例：bash scripts/prepare-refactor.sh EditRequirementModal
#
# =============================================================================

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

COMPONENT=$1

if [ -z "$COMPONENT" ]; then
  echo -e "${RED}错误: 请指定组件名称${NC}"
  echo ""
  echo "用法: bash scripts/prepare-refactor.sh <ComponentName>"
  echo "示例: bash scripts/prepare-refactor.sh EditRequirementModal"
  exit 1
fi

echo ""
echo "========================================"
echo "  重构准备检查清单"
echo "  组件: $COMPONENT"
echo "========================================"
echo ""

# =============================================================================
# 检查1: 开发服务器
# =============================================================================
echo -e "${BLUE}□ 1. 检查开发服务器...${NC}"

# 检查3000端口是否被占用（跨平台）
if netstat -an 2>/dev/null | grep -q ":3000.*LISTEN" || \
   lsof -i:3000 > /dev/null 2>&1 || \
   netstat -ano 2>/dev/null | findstr ":3000.*LISTENING" > /dev/null 2>&1; then
  echo -e "   ${GREEN}✓ 开发服务器正在运行 (http://localhost:3000)${NC}"
else
  echo -e "   ${YELLOW}✗ 开发服务器未运行${NC}"
  echo "   请运行: npm run dev"
  echo ""
  read -p "现在启动开发服务器吗? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "   启动中..."
    npm run dev > /dev/null 2>&1 &
    sleep 3
    echo -e "   ${GREEN}✓ 开发服务器已启动${NC}"
  else
    echo -e "   ${YELLOW}⚠️  请手动启动开发服务器后再继续${NC}"
  fi
fi

echo ""

# =============================================================================
# 检查2: 创建截图目录
# =============================================================================
echo -e "${BLUE}□ 2. 创建截图目录...${NC}"
mkdir -p docs/screenshots/before-refactor
mkdir -p docs/screenshots/after-refactor
echo -e "   ${GREEN}✓ 目录已创建:${NC}"
echo "     - docs/screenshots/before-refactor/"
echo "     - docs/screenshots/after-refactor/"

echo ""

# =============================================================================
# 检查3: 创建样式快照
# =============================================================================
echo -e "${BLUE}□ 3. 创建样式快照...${NC}"

COMPONENT_FILE="src/components/$COMPONENT.tsx"

if [ -f "$COMPONENT_FILE" ]; then
  # 提取所有className
  git show HEAD:"$COMPONENT_FILE" 2>/dev/null | \
    grep -o 'className="[^"]*"' | \
    sort | uniq > docs/screenshots/styles-before-$COMPONENT.txt

  # 提取颜色相关的className
  git show HEAD:"$COMPONENT_FILE" 2>/dev/null | \
    grep -o 'className="[^"]*"' | \
    grep -E "bg-|text-|border-" | \
    grep -E "blue|purple|green|red|orange|yellow|indigo|gradient" | \
    sort | uniq > docs/screenshots/colors-before-$COMPONENT.txt

  echo -e "   ${GREEN}✓ 样式快照已创建:${NC}"
  echo "     - docs/screenshots/styles-before-$COMPONENT.txt"
  echo "     - docs/screenshots/colors-before-$COMPONENT.txt"

  # 显示颜色统计
  COLOR_COUNT=$(wc -l < docs/screenshots/colors-before-$COMPONENT.txt)
  echo ""
  echo -e "   ${BLUE}📊 检测到 $COLOR_COUNT 个颜色样式${NC}"
  echo "   重构后必须保留这些颜色！"
else
  echo -e "   ${RED}✗ 文件不存在: $COMPONENT_FILE${NC}"
  exit 1
fi

echo ""

# =============================================================================
# 检查4: 引导用户截图
# =============================================================================
echo -e "${BLUE}□ 4. 请手动截图UI状态...${NC}"
echo ""
echo "   📸 请完成以下操作："
echo ""
echo "   1️⃣  打开浏览器: ${BLUE}http://localhost:3000${NC}"
echo ""
echo "   2️⃣  触发组件显示（如点击"新建需求"）"
echo ""
echo "   3️⃣  截图以下状态："
echo "      □ 默认状态 → ${COMPONENT}-default.png"
echo "      □ Hover状态（鼠标悬停按钮）→ ${COMPONENT}-hover.png"
echo "      □ 展开所有section → ${COMPONENT}-expanded.png"
echo "      □ 填写表单后 → ${COMPONENT}-filled.png"
echo "      □ 错误状态（如果有）→ ${COMPONENT}-error.png"
echo ""
echo "   4️⃣  保存截图到: ${GREEN}docs/screenshots/before-refactor/${NC}"
echo ""
echo "   💡 提示："
echo "      - Windows: Win+Shift+S 截图"
echo "      - Mac: Cmd+Shift+4 截图"
echo "      - 至少需要1张默认状态截图"
echo ""
read -p "完成截图了吗？(y/n) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo ""
  echo -e "${YELLOW}⚠️  请先完成截图再开始重构！${NC}"
  echo ""
  echo "重构前截图的重要性："
  echo "  1. 作为UI对比的参考标准"
  echo "  2. 如果重构出错，可以准确恢复"
  echo "  3. 验证重构是否保持了UI一致性"
  echo ""
  exit 1
fi

echo ""

# =============================================================================
# 检查5: 验证截图文件
# =============================================================================
echo -e "${BLUE}□ 5. 验证截图文件...${NC}"

SCREENSHOT_COUNT=$(find docs/screenshots/before-refactor -name "*.png" -o -name "*.jpg" 2>/dev/null | wc -l)

if [ $SCREENSHOT_COUNT -gt 0 ]; then
  echo -e "   ${GREEN}✓ 找到 $SCREENSHOT_COUNT 个截图文件${NC}"
  echo ""
  echo "   截图文件列表："
  ls -1 docs/screenshots/before-refactor/*.{png,jpg} 2>/dev/null | while read file; do
    SIZE=$(du -h "$file" | cut -f1)
    FILENAME=$(basename "$file")
    echo "     - $FILENAME ($SIZE)"
  done
else
  echo -e "   ${YELLOW}⚠️  未找到截图文件${NC}"
  echo ""
  echo "   请确保截图保存在:"
  echo "     docs/screenshots/before-refactor/"
  echo ""
  echo "   文件名建议:"
  echo "     - ${COMPONENT}-default.png"
  echo "     - ${COMPONENT}-hover.png"
  echo "     - ${COMPONENT}-expanded.png"
  echo ""
fi

echo ""

# =============================================================================
# 检查6: 记录当前文件信息
# =============================================================================
echo -e "${BLUE}□ 6. 记录当前文件信息...${NC}"

if [ -f "$COMPONENT_FILE" ]; then
  LINE_COUNT=$(wc -l < "$COMPONENT_FILE")
  echo "   当前行数: $LINE_COUNT" > docs/screenshots/size-before-$COMPONENT.txt
  echo -e "   ${GREEN}✓ 当前行数: $LINE_COUNT${NC}"

  # 记录所有按钮数量
  BUTTON_COUNT=$(grep -c "<button" "$COMPONENT_FILE" || echo 0)
  echo -e "   ${GREEN}✓ 按钮数量: $BUTTON_COUNT${NC}"

  # 检查有多少按钮有 type 属性
  TYPED_BUTTON_COUNT=$(grep "type=\"button\"" "$COMPONENT_FILE" | wc -l)
  echo -e "   ${GREEN}✓ 有type属性的按钮: $TYPED_BUTTON_COUNT${NC}"

  if [ $TYPED_BUTTON_COUNT -lt $BUTTON_COUNT ]; then
    echo -e "   ${YELLOW}⚠️  有 $((BUTTON_COUNT - TYPED_BUTTON_COUNT)) 个按钮缺少 type 属性${NC}"
  fi
fi

echo ""

# =============================================================================
# 完成提示
# =============================================================================
echo "==================================="
echo -e "${GREEN}✅ 重构准备完成！${NC}"
echo "==================================="
echo ""
echo -e "${BLUE}下一步操作：${NC}"
echo ""
echo "告诉AI："
echo -e "  ${GREEN}我已完成重构前的准备工作：${NC}"
echo "  - 已截图保存到 docs/screenshots/before-refactor/"
echo "  - 已创建样式快照"
echo ""
echo "  ${GREEN}现在请开始重构 $COMPONENT.tsx，要求：${NC}"
echo "  1. 保持所有颜色和样式（特别是渐变效果）"
echo "  2. 保持所有按钮的 type=\"button\" 属性"
echo "  3. 保持所有UI元素的位置和布局"
echo "  4. 重构完成后提醒我对比截图验证"
echo ""
echo -e "${BLUE}参考快照文件：${NC}"
echo "  - docs/screenshots/styles-before-$COMPONENT.txt"
echo "  - docs/screenshots/colors-before-$COMPONENT.txt"
echo ""

exit 0
