# Claude Code 上下文信息

## 项目快速索引

### 核心文件位置
```
关键配置:
- 配置中心: src/config/index.ts + README.md
- 类型定义: src/types/index.ts
- 状态管理: src/store/useStore.ts
- 日志工具: src/utils/logger.ts

主要组件:
- 主应用: src/wsjf-sprint-planner.tsx (3500行 - 需拆分)
- 编辑需求: src/components/EditRequirementModal.tsx (1000行)
- 评分标准: src/config/scoringStandards.ts
- 指标定义: src/config/metrics.ts
```

### 常用命令
```bash
# 开发
npm run dev              # 启动开发服务器

# 构建和验证
npm run build            # 生产构建
npx tsc --noEmit        # 类型检查

# 部署
npm run deploy:tencent  # 部署到腾讯云
npm run deploy:vercel   # 部署到Vercel

# 检查
bash scripts/pre-deploy-check.sh  # 发布前检查
```

### 项目规范
- **规范文件**: `.claude/project-rules.md`
- **术语标准**: 使用"权重分"、"业务影响度"（禁用"热度分"、"业务价值"）
- **类型规范**: 禁用any，使用明确类型
- **日志规范**: 使用logger工具，生产环境静默

### 架构说明
- **单文件架构**: 主组件在 wsjf-sprint-planner.tsx
- **状态管理**: Zustand (src/store/useStore.ts)
- **配置管理**: 集中在 src/config/
- **评分算法**: src/utils/scoring.ts

### 避免重复读取
```
已知大文件（避免重复读取）:
- src/wsjf-sprint-planner.tsx (3500行)
- src/config/scoringStandards.ts (300行)
- src/config/complexityStandards.ts (400行)
- src/components/EditRequirementModal.tsx (1000行)

优先使用: Grep/Glob 定位，只读取必要部分
```

### 快速定位指南
```
Q: 修改评分标准？
A: src/config/scoringStandards.ts

Q: 修改指标定义？
A: src/config/metrics.ts

Q: 修改AI提示词？
A: src/config/aiPrompts.ts

Q: 修改默认值？
A: src/config/defaults.ts

Q: 查看所有配置？
A: src/config/README.md
```

### Token优化提示
- ✅ 使用 Grep 搜索而非完整读取
- ✅ 使用 offset/limit 读取大文件片段
- ✅ 优先使用配置索引 (src/config/index.ts)
- ❌ 避免重复读取相同文件
- ❌ 避免读取整个大文件

### 最近更新 (v1.2.1)
- ✅ 代码质量优化（移除console.log，优化any类型）
- ✅ 配置索引中心（src/config/index.ts + README.md）
- ✅ 日志工具（src/utils/logger.ts）
- ✅ AI类型定义（AIRequestBody, AIMessage）

### 已知问题/TODO
- ⚠️ wsjf-sprint-planner.tsx 文件过大（需拆分）
- 💡 主包体积较大（1.37MB）可考虑代码分割
- 💡 部分any类型仍需优化（wsjf-sprint-planner.tsx中）

---
**更新时间**: 2025-01-19
**版本**: v1.2.1
