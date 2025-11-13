#!/bin/bash

# 批量修复所有弹出框和按钮问题的脚本
# 1. 为所有按钮添加 type="button"
# 2. 将所有 window.confirm 替换为自定义弹窗
# 3. 将所有 alert 替换为 Toast

echo "=== 开始修复所有弹出框问题 ==="
echo ""

# 备份重要文件
echo "📁 备份文件..."
mkdir -p .backup
cp src/components/EditRequirementModal.tsx .backup/
cp src/components/RequirementCard.tsx .backup/
echo "✓ 备份完成"
echo ""

# 步骤1: 修复 EditRequirementModal 中缺少 type 的按钮
echo "🔧 步骤1: 修复 EditRequirementModal 按钮..."
# 使用 perl 替换所有 <button 为 <button type="button" (如果没有 type 属性)
perl -i -pe 's/<button(?!\s+type=)/<button type="button"/g' src/components/EditRequirementModal.tsx
echo "✓ 已添加 type 属性到所有按钮"
echo ""

# 步骤2: 创建完整的修复脚本（由于涉及复杂的组件修改，我们分步进行）
echo "📝 步骤2: 生成详细修复清单..."
echo "需要手动修复的文件列表："
echo ""

echo "1. RequirementCard.tsx"
echo "   - 添加 import { useConfirmDialog, ConfirmDialog }"
echo "   - 在组件中使用 const { confirm, dialogState, handleCancel } = useConfirmDialog()"
echo "   - 替换 confirm() 调用为 await confirm()"
echo "   - 在组件末尾添加 <ConfirmDialog .../>"
echo ""

echo "2. wsjf-sprint-planner.tsx"
echo "   - 添加 import { useConfirmDialog, ConfirmDialog }"
echo "   - 退出登录确认"
echo ""

echo "3. AdminConfigModal.tsx"
echo "   - 删除指标确认"
echo ""

echo "4. BatchEvaluationModal.tsx"
echo "   - 替换 alert 为 Toast"
echo ""

echo "5. FeishuImportModal.tsx"
echo "   - 替换 alert 为 Toast"
echo ""

echo "6. useStore.ts"
echo "   - 替换 alert 为 Toast"
echo ""

echo ""
echo "✅ type属性修复完成！"
echo "⚠️  confirm/alert 替换需要逐文件处理（涉及状态管理）"
echo ""
echo "建议：先测试 type 属性修复是否解决了自动下载问题"
