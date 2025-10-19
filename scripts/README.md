# WSJF Sprint Planner - 自动化检查脚本

## 📋 概述

本目录包含项目的自动化检查脚本，用于确保代码质量和规范遵守。

## 🔍 pre-deploy-check.sh

预发布检查脚本，在部署前自动验证项目质量。

### 检查内容

1. **术语规范检查**
   - 检查是否使用了禁止的术语
   - 确保术语一致性符合 `.claude/project-rules.md` 规范
   - 示例禁止术语：
     - "热度分" → 应使用 "权重分"
     - "业务价值" → 应使用 "业务影响度"
     - "人日" → 应使用 "工作量"

2. **硬编码检查**
   - 检查组件中是否有硬编码的常用文案
   - 建议使用 `UI_TEXT` 常量而非硬编码字符串
   - 常见文案：保存、取消、确认、删除等

3. **TypeScript 类型检查**
   - 运行 `tsc --noEmit` 验证类型安全
   - 确保无类型错误

4. **生产构建验证**
   - 执行完整的生产构建
   - 确保构建成功且无错误

### 使用方法

#### 方式一：通过 npm 运行（推荐）

```bash
npm run pre-deploy-check
```

#### 方式二：直接运行脚本

```bash
# Linux / macOS / Git Bash (Windows)
bash scripts/pre-deploy-check.sh

# 或者添加执行权限后直接运行
chmod +x scripts/pre-deploy-check.sh
./scripts/pre-deploy-check.sh
```

### Windows 用户注意事项

Windows 用户需要使用 **Git Bash** 或 **WSL** 来运行此脚本：

1. **使用 Git Bash**（推荐）
   - 右键点击项目目录 → "Git Bash Here"
   - 运行 `npm run pre-deploy-check`

2. **使用 WSL**
   - 在 WSL 终端中导航到项目目录
   - 运行 `bash scripts/pre-deploy-check.sh`

3. **使用 npm**（最简单）
   - 在任何终端（CMD、PowerShell、Git Bash）运行
   - `npm run pre-deploy-check`

### 集成到发布流程

脚本已自动集成到部署命令中：

```bash
# 腾讯云部署（自动运行检查）
npm run deploy:tencent

# Vercel 部署（自动运行检查）
npm run deploy:vercel
```

部署前会自动执行所有检查，只有检查通过才会继续部署。

### 退出码

- `0` - 所有检查通过，可以安全部署
- `1` - 发现问题，需要修复后重试

### 检查结果示例

#### ✅ 成功示例

```
========================================
WSJF Sprint Planner - 预发布检查
========================================

[1/4] 检查术语规范...
✓ 术语规范检查通过

[2/4] 检查硬编码常量...
✓ 硬编码检查通过

[3/4] TypeScript 类型检查...
✓ TypeScript 类型检查通过

[4/4] 验证生产构建...
✓ 生产构建成功

========================================
检查结果汇总
========================================
总检查项: 4
通过: 4

✅ 所有检查通过！可以安全发布。
```

#### ❌ 失败示例

```
========================================
WSJF Sprint Planner - 预发布检查
========================================

[1/4] 检查术语规范...
✗ 发现禁止术语使用：
  ❌ 禁止术语: "热度分" → 应使用: "权重分"
     src/components/RequirementCard.tsx:42:显示热度分

✗ 发现 1 个术语违规

[2/4] 检查硬编码常量...
⚠ 发现可能的硬编码文案（建议使用 UI_TEXT 常量）：
  文案: "保存"
     src/components/EditModal.tsx:123:<button>保存</button>

⚠ 发现 1 个可能的硬编码问题（警告）

...

========================================
检查结果汇总
========================================
总检查项: 4
通过: 2
失败: 2

❌ 预发布检查失败！请修复上述问题后重试。
```

### 自定义检查规则

如需添加或修改检查规则，请编辑 `scripts/pre-deploy-check.sh`：

1. **添加禁止术语**：修改 `FORBIDDEN_TERMS` 数组
2. **添加硬编码检查**：修改 `COMMON_TEXTS` 数组
3. **添加新检查项**：参考现有检查项格式添加新的检查逻辑

### 故障排除

#### 问题：脚本执行权限错误

```bash
# 添加执行权限
chmod +x scripts/pre-deploy-check.sh
```

#### 问题：Windows 上显示 "bash: command not found"

- 确保已安装 Git for Windows
- 使用 Git Bash 运行脚本
- 或通过 `npm run pre-deploy-check` 运行

#### 问题：构建日志位置

构建日志保存在 `/tmp/build-log.txt`（Linux/macOS）或临时目录（Windows）

### 最佳实践

1. **提交前检查**：在提交代码前运行 `npm run pre-deploy-check`
2. **PR 前检查**：创建 Pull Request 前确保所有检查通过
3. **部署前检查**：自动集成，无需手动运行
4. **定期更新**：根据项目需求更新检查规则

### 相关文档

- [项目规则](./.claude/project-rules.md) - 完整的代码规范和术语定义
- [开发指南](../DEVELOPMENT.md) - 详细的开发流程指南
- [常量定义](../src/constants/) - UI 文案和评分规则常量

---

**维护者**: WSJF Team
**最后更新**: 2025-01-19
