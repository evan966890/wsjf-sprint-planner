#!/bin/bash

# 快速测试脚本 - 提交前运行
# 只运行核心测试，1分钟内完成

echo "🚀 运行快速测试..."
echo ""

# 运行超稳定版测试（最重要的核心功能）
npx playwright test tests/comprehensive-fixed-v2/ --reporter=list

# 检查退出码
if [ $? -eq 0 ]; then
  echo ""
  echo "✅ 快速测试通过！可以安全提交。"
  echo ""
  exit 0
else
  echo ""
  echo "❌ 测试失败！请修复后再提交。"
  echo ""
  echo "💡 提示："
  echo "  - 运行 'npm run test:visual:ui' 查看详细信息"
  echo "  - 运行 'npm run test:visual:report' 查看HTML报告"
  echo ""
  exit 1
fi
