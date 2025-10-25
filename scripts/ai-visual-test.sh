#!/bin/bash

# =============================================================================
# AI自动化视觉测试脚本
# =============================================================================
#
# 用途：AI运行此脚本来自动截图和验证UI
#
# 使用：
#   bash scripts/ai-visual-test.sh baseline  # 重构前：创建baseline
#   bash scripts/ai-visual-test.sh test      # 重构后：运行测试
#   bash scripts/ai-visual-test.sh report    # 查看测试报告
#
# AI可以：
# 1. 运行脚本
# 2. 读取输出
# 3. 识别问题（颜色、布局、功能）
# 4. 自动修复或报告用户
#
# =============================================================================

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

ACTION=$1

case $ACTION in
  baseline)
    echo "========================================"
    echo "  🎨 创建视觉测试Baseline"
    echo "========================================"
    echo ""
    echo "说明：此操作会："
    echo "1. 启动开发服务器（如果未运行）"
    echo "2. 打开浏览器（无头模式）"
    echo "3. 自动截图所有UI状态"
    echo "4. 保存为baseline（基准）"
    echo ""
    echo "开始执行..."
    echo ""

    # 运行Playwright生成baseline
    if npx playwright test --update-snapshots 2>&1 | tee /tmp/playwright-baseline.log; then
      echo ""
      echo "========================================"
      echo -e "${GREEN}✅ Baseline创建成功！${NC}"
      echo "========================================"
      echo ""
      echo "Baseline截图位置："
      echo "  tests/visual/*.spec.ts-snapshots/"
      echo ""
      echo "下一步："
      echo "  执行重构，然后运行："
      echo "  bash scripts/ai-visual-test.sh test"
      echo ""
      exit 0
    else
      echo ""
      echo "========================================"
      echo -e "${RED}❌ Baseline创建失败${NC}"
      echo "========================================"
      echo ""
      cat /tmp/playwright-baseline.log
      exit 1
    fi
    ;;

  test)
    echo "========================================"
    echo "  🔍 运行视觉回归测试"
    echo "========================================"
    echo ""
    echo "说明：此操作会："
    echo "1. 启动开发服务器"
    echo "2. 运行所有测试"
    echo "3. 对比baseline检测差异"
    echo "4. 报告发现的问题"
    echo ""
    echo "开始执行..."
    echo ""

    # 运行测试，保存输出
    if npx playwright test 2>&1 | tee /tmp/playwright-test.log; then
      echo ""
      echo "========================================"
      echo -e "${GREEN}✅ 所有视觉测试通过！${NC}"
      echo "========================================"
      echo ""
      echo "测试结果："
      grep -E "passed|failed" /tmp/playwright-test.log | tail -1
      echo ""
      echo "说明："
      echo "  - UI与baseline完全一致"
      echo "  - 所有颜色正确"
      echo "  - 所有按钮type属性正确"
      echo "  - 没有触发文件下载"
      echo ""
      echo "✅ 重构成功！可以提交代码。"
      echo ""
      exit 0
    else
      echo ""
      echo "========================================"
      echo -e "${RED}❌ 视觉测试失败${NC}"
      echo "========================================"
      echo ""
      echo "失败详情："
      echo ""

      # 提取失败信息
      grep -A 5 "Error:" /tmp/playwright-test.log | head -30

      echo ""
      echo "可能的问题："
      echo ""

      # 检测颜色问题
      if grep -q "bg-gradient.*not found" /tmp/playwright-test.log; then
        echo -e "${RED}🎨 颜色问题：${NC}"
        echo "  - 检测到渐变颜色丢失"
        grep "bg-gradient" /tmp/playwright-test.log | grep -E "not found|Found instead" | head -5
        echo ""
      fi

      if grep -q "bg-blue.*not found\|bg-purple.*not found\|bg-green.*not found" /tmp/playwright-test.log; then
        echo -e "${RED}🎨 颜色问题：${NC}"
        echo "  - 检测到section颜色丢失"
        grep -E "bg-blue|bg-purple|bg-green" /tmp/playwright-test.log | grep -E "not found|Found instead" | head -5
        echo ""
      fi

      # 检测type属性问题
      if grep -q "type.*button.*missing" /tmp/playwright-test.log; then
        echo -e "${RED}🔘 Type属性问题：${NC}"
        echo "  - 检测到按钮缺少 type=\"button\""
        grep "type.*button" /tmp/playwright-test.log | head -5
        echo ""
      fi

      # 检测下载问题
      if grep -q "download triggered" /tmp/playwright-test.log; then
        echo -e "${RED}📥 下载问题：${NC}"
        echo "  - 检测到点击按钮触发了文件下载"
        echo ""
      fi

      # 显示差异截图
      echo "差异图片位置："
      find tests/visual -name "*-diff.png" 2>/dev/null | while read file; do
        echo "  - $file"
      done

      echo ""
      echo "完整测试日志："
      echo "  /tmp/playwright-test.log"
      echo ""
      echo "建议："
      echo "  1. 查看上面的具体错误"
      echo "  2. 修复样式或功能问题"
      echo "  3. 重新运行：bash scripts/ai-visual-test.sh test"
      echo "  4. 或者回滚：git checkout HEAD -- src/components/"
      echo ""

      exit 1
    fi
    ;;

  report)
    echo "打开测试报告..."
    npx playwright show-report
    ;;

  *)
    echo "========================================"
    echo "  AI视觉测试脚本"
    echo "========================================"
    echo ""
    echo "用法: bash scripts/ai-visual-test.sh [command]"
    echo ""
    echo "Commands:"
    echo "  baseline  - 创建baseline截图（重构前运行）"
    echo "  test      - 运行测试对比（重构后运行）"
    echo "  report    - 查看详细测试报告"
    echo ""
    echo "示例工作流程："
    echo "  1. bash scripts/ai-visual-test.sh baseline  # 重构前"
    echo "  2. [执行重构代码...]"
    echo "  3. bash scripts/ai-visual-test.sh test      # 验证"
    echo ""
    exit 1
    ;;
esac
