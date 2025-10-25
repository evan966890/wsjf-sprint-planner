#!/bin/bash

# =============================================================================
# Git Pre-Commit Hook - 重构质量检查
# =============================================================================
#
# 用途：在提交前自动检查常见的重构错误
# 使用：将此文件链接到 .git/hooks/pre-commit
#
# 安装：
#   ln -s ../../scripts/pre-commit-check.sh .git/hooks/pre-commit
#   chmod +x .git/hooks/pre-commit
#
# Windows 安装（Git Bash）：
#   cp scripts/pre-commit-check.sh .git/hooks/pre-commit
#   chmod +x .git/hooks/pre-commit
#
# =============================================================================

set -e

echo "🔍 运行 Pre-Commit 检查..."
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 错误计数
ERROR_COUNT=0

# =============================================================================
# 检查1: 检测丢失的 type="button" 属性
# =============================================================================
echo "📌 检查1: 检测丢失的 type=\"button\" 属性..."

LOST_BUTTONS=$(git diff --cached | grep -E "^\-.*type=\"button\"" | wc -l)
ADDED_BUTTONS_WITHOUT_TYPE=$(git diff --cached | grep -E "^\+.*<button" | grep -v "type=" | wc -l)

if [ $LOST_BUTTONS -gt 0 ]; then
  echo -e "${RED}❌ 错误: 检测到 $LOST_BUTTONS 个按钮丢失了 type=\"button\" 属性${NC}"
  echo ""
  echo "丢失的按钮："
  git diff --cached | grep -E "^\-.*type=\"button\"" | head -5
  echo ""
  ERROR_COUNT=$((ERROR_COUNT + 1))
elif [ $ADDED_BUTTONS_WITHOUT_TYPE -gt 0 ]; then
  echo -e "${YELLOW}⚠️  警告: 发现 $ADDED_BUTTONS_WITHOUT_TYPE 个新增按钮没有 type 属性${NC}"
  echo ""
  echo "建议添加 type=\"button\" 属性到以下按钮："
  git diff --cached | grep -E "^\+.*<button" | grep -v "type=" | head -5
  echo ""
  # 这里只警告，不阻止提交
else
  echo -e "${GREEN}✓ 通过${NC}"
fi

echo ""

# =============================================================================
# 检查2: 检测调试代码
# =============================================================================
echo "📌 检查2: 检测调试代码..."

DEBUG_CODE=$(git diff --cached --name-only | grep -E "\\.tsx?$" | xargs grep -l "console\\.log\|debugger" 2>/dev/null | wc -l)

if [ $DEBUG_CODE -gt 0 ]; then
  echo -e "${YELLOW}⚠️  警告: 发现调试代码（console.log 或 debugger）${NC}"
  echo ""
  git diff --cached --name-only | grep -E "\\.tsx?$" | xargs grep -n "console\\.log\|debugger" 2>/dev/null | head -10
  echo ""
  # 这里只警告，不阻止提交
else
  echo -e "${GREEN}✓ 通过${NC}"
fi

echo ""

# =============================================================================
# 检查3: TypeScript 编译检查
# =============================================================================
echo "📌 检查3: TypeScript 编译检查..."

if npx tsc --noEmit 2>&1 | grep -q "error TS"; then
  echo -e "${RED}❌ 错误: TypeScript 编译失败${NC}"
  echo ""
  npx tsc --noEmit 2>&1 | grep "error TS" | head -10
  echo ""
  ERROR_COUNT=$((ERROR_COUNT + 1))
else
  echo -e "${GREEN}✓ 通过${NC}"
fi

echo ""

# =============================================================================
# 检查4: 文件大小检查
# =============================================================================
echo "📌 检查4: 文件大小检查（500行限制）..."

LARGE_FILES=$(git diff --cached --name-only | grep -E "\\.tsx?$" | while read file; do
  if [ -f "$file" ]; then
    LINES=$(wc -l < "$file" 2>/dev/null || echo 0)
    if [ $LINES -gt 500 ]; then
      echo "$file: $LINES 行"
    fi
  fi
done)

if [ -n "$LARGE_FILES" ]; then
  echo -e "${RED}❌ 错误: 发现超过 500 行的文件${NC}"
  echo ""
  echo "$LARGE_FILES"
  echo ""
  ERROR_COUNT=$((ERROR_COUNT + 1))
else
  echo -e "${GREEN}✓ 通过${NC}"
fi

echo ""

# =============================================================================
# 检查5: 检查是否有未完成的 TODO
# =============================================================================
echo "📌 检查5: 检查未完成的 TODO/FIXME..."

TODO_COUNT=$(git diff --cached --name-only | grep -E "\\.tsx?$" | xargs grep -n "TODO\|FIXME\|XXX" 2>/dev/null | wc -l)

if [ $TODO_COUNT -gt 0 ]; then
  echo -e "${YELLOW}⚠️  警告: 发现 $TODO_COUNT 个 TODO/FIXME${NC}"
  echo ""
  git diff --cached --name-only | grep -E "\\.tsx?$" | xargs grep -n "TODO\|FIXME\|XXX" 2>/dev/null | head -5
  echo ""
  # 这里只警告，不阻止提交
else
  echo -e "${GREEN}✓ 通过${NC}"
fi

echo ""

# =============================================================================
# 总结
# =============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ERROR_COUNT -gt 0 ]; then
  echo -e "${RED}❌ 检查失败: 发现 $ERROR_COUNT 个错误${NC}"
  echo ""
  echo "请修复以上错误后再提交。"
  echo ""
  echo "如果确实需要提交，可以使用："
  echo "  git commit --no-verify"
  echo ""
  exit 1
else
  echo -e "${GREEN}✅ 所有检查通过！${NC}"
  echo ""
fi

exit 0
