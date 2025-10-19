#!/bin/bash
# WSJF Sprint Planner - 预发布检查脚本
#
# 功能：
# 1. 检查硬编码术语违规
# 2. 验证构建成功
# 3. 检查类型安全
# 4. 输出详细报告
#
# 使用方法：
#   bash scripts/pre-deploy-check.sh
#
# 退出码：
#   0 - 所有检查通过
#   1 - 发现问题

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查结果统计
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS=0

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}WSJF Sprint Planner - 预发布检查${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# ============================================================================
# 1. 术语规范检查
# ============================================================================
echo -e "${BLUE}[1/4] 检查术语规范...${NC}"
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

# 定义禁止使用的术语（术语 | 应使用的正确术语）
declare -A FORBIDDEN_TERMS=(
  ["热度分"]="权重分"
  ["优先级分"]="权重分"
  ["业务价值\b"]="业务影响度"
  ["复杂度分"]="技术复杂度"
  ["工作日\b"]="工作量"
  ["人日\b"]="工作量"
  ["时间临界性"]="时间窗口"
  ["死线"]="强制 DDL"
  ["截止时间\b"]="强制 DDL"
)

# 需要检查的文件类型
FILE_PATTERNS="src/**/*.{ts,tsx} src/*.{ts,tsx}"

TERM_VIOLATIONS=0

for term in "${!FORBIDDEN_TERMS[@]}"; do
  correct_term="${FORBIDDEN_TERMS[$term]}"

  # 使用 grep 搜索禁止术语（忽略常量文件和注释）
  # -r: 递归搜索
  # -n: 显示行号
  # --include: 只搜索特定文件
  # --exclude-dir: 排除目录

  results=$(grep -rn -E "$term" \
    --include="*.ts" \
    --include="*.tsx" \
    --exclude-dir=node_modules \
    --exclude-dir=dist \
    --exclude-dir=.git \
    src/ 2>/dev/null || true)

  if [ -n "$results" ]; then
    if [ $TERM_VIOLATIONS -eq 0 ]; then
      echo -e "${RED}✗ 发现禁止术语使用：${NC}"
    fi
    echo -e "${YELLOW}  ❌ 禁止术语: \"${term}\" → 应使用: \"${correct_term}\"${NC}"
    echo "$results" | while IFS= read -r line; do
      echo -e "${YELLOW}     $line${NC}"
    done
    TERM_VIOLATIONS=$((TERM_VIOLATIONS + 1))
  fi
done

if [ $TERM_VIOLATIONS -eq 0 ]; then
  echo -e "${GREEN}✓ 术语规范检查通过${NC}"
  PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
  echo -e "${RED}✗ 发现 $TERM_VIOLATIONS 个术语违规${NC}"
  FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

echo ""

# ============================================================================
# 2. 硬编码检查（检查是否应该使用常量）
# ============================================================================
echo -e "${BLUE}[2/4] 检查硬编码常量...${NC}"
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

HARDCODE_VIOLATIONS=0

# 检查组件中是否有硬编码的常用文案（应该使用 UI_TEXT 常量）
COMMON_TEXTS=(
  "保存"
  "取消"
  "确认"
  "删除"
  "编辑"
  "添加"
  "导出"
  "导入"
  "关闭"
)

for text in "${COMMON_TEXTS[@]}"; do
  # 检查是否在字符串中直接使用这些文案（排除常量定义文件）
  results=$(grep -rn "\"${text}\"\\|'${text}'" \
    --include="*.tsx" \
    --exclude-dir=node_modules \
    --exclude-dir=dist \
    --exclude-dir=.git \
    src/components/ 2>/dev/null | \
    grep -v "UI_TEXT" | \
    grep -v "^src/constants/" || true)

  if [ -n "$results" ]; then
    if [ $HARDCODE_VIOLATIONS -eq 0 ]; then
      echo -e "${YELLOW}⚠ 发现可能的硬编码文案（建议使用 UI_TEXT 常量）：${NC}"
    fi
    echo -e "${YELLOW}  文案: \"${text}\"${NC}"
    echo "$results" | head -5 | while IFS= read -r line; do
      echo -e "${YELLOW}     $line${NC}"
    done
    HARDCODE_VIOLATIONS=$((HARDCODE_VIOLATIONS + 1))
  fi
done

if [ $HARDCODE_VIOLATIONS -eq 0 ]; then
  echo -e "${GREEN}✓ 硬编码检查通过${NC}"
  PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
  echo -e "${YELLOW}⚠ 发现 $HARDCODE_VIOLATIONS 个可能的硬编码问题（警告）${NC}"
  WARNINGS=$((WARNINGS + 1))
  PASSED_CHECKS=$((PASSED_CHECKS + 1))  # 硬编码检查是警告，不算失败
fi

echo ""

# ============================================================================
# 3. TypeScript 类型检查
# ============================================================================
echo -e "${BLUE}[3/4] TypeScript 类型检查...${NC}"
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

if npx tsc --noEmit 2>&1; then
  echo -e "${GREEN}✓ TypeScript 类型检查通过${NC}"
  PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
  echo -e "${RED}✗ TypeScript 类型检查失败${NC}"
  FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

echo ""

# ============================================================================
# 4. 构建检查
# ============================================================================
echo -e "${BLUE}[4/4] 验证生产构建...${NC}"
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

if npm run build > /tmp/build-log.txt 2>&1; then
  echo -e "${GREEN}✓ 生产构建成功${NC}"
  PASSED_CHECKS=$((PASSED_CHECKS + 1))

  # 显示构建统计
  echo -e "${BLUE}  构建统计：${NC}"
  grep -E "dist/.*\.js.*│.*gzip:" /tmp/build-log.txt | tail -3 || true
else
  echo -e "${RED}✗ 生产构建失败${NC}"
  echo -e "${YELLOW}查看详细日志: /tmp/build-log.txt${NC}"
  FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

echo ""

# ============================================================================
# 检查结果汇总
# ============================================================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}检查结果汇总${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "总检查项: ${TOTAL_CHECKS}"
echo -e "${GREEN}通过: ${PASSED_CHECKS}${NC}"

if [ $FAILED_CHECKS -gt 0 ]; then
  echo -e "${RED}失败: ${FAILED_CHECKS}${NC}"
fi

if [ $WARNINGS -gt 0 ]; then
  echo -e "${YELLOW}警告: ${WARNINGS}${NC}"
fi

echo ""

# 退出
if [ $FAILED_CHECKS -gt 0 ]; then
  echo -e "${RED}❌ 预发布检查失败！请修复上述问题后重试。${NC}"
  exit 1
else
  if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  预发布检查通过，但有 ${WARNINGS} 个警告建议处理。${NC}"
  else
    echo -e "${GREEN}✅ 所有检查通过！可以安全发布。${NC}"
  fi
  exit 0
fi
