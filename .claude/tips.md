# Claude Code 优化提示

## Token优化最佳实践

### ✅ 推荐做法

1. **使用Grep而非Read**
   ```bash
   # ❌ 不推荐
   Read整个文件查找关键词

   # ✅ 推荐
   Grep搜索关键词 → 定位行号 → Read特定区域
   ```

2. **分段读取大文件**
   ```typescript
   // ❌ 不推荐
   Read(file_path)  // 读取整个3500行文件

   // ✅ 推荐
   Read(file_path, offset=100, limit=50)  // 只读取需要的部分
   ```

3. **使用已有的索引文件**
   ```typescript
   // ✅ 优先查看索引
   - src/config/index.ts（配置地图）
   - src/config/README.md（配置文档）
   - .claude/context.md（项目上下文）
   ```

4. **避免重复操作**
   ```bash
   # ❌ 不推荐：每次都重新验证
   - npx tsc --noEmit
   - npm run build

   # ✅ 推荐：批量验证一次
   - npm run deploy:tencent（自动包含所有检查）
   ```

### ❌ 避免的做法

1. **不要重复读取相同文件**
   - 一次会话中读取同一文件不超过2次
   - 优先使用之前读取的信息

2. **不要读取不必要的文件**
   - 修改配置前先查看 src/config/README.md
   - 使用Grep定位而非盲目搜索

3. **不要频繁更新TodoWrite**
   - 合并多个小步骤
   - 只在关键节点更新

4. **不要输出冗长的总结**
   - 简洁明了即可
   - 避免重复相同信息

## 高效协作方式

### 用户指令优化

**清晰的指令示例**:
```
✅ 好: "修改 scoringStandards.ts 中10分的描述"
   → 我知道具体文件和位置

❌ 差: "帮我改一下评分标准"
   → 需要搜索多个文件确认位置
```

**提供关键信息**:
```
✅ 好: "在 EditRequirementModal.tsx:375 行附近优化类型"
   → 直接定位，节省搜索时间

✅ 好: "参考 src/config/README.md，添加新配置"
   → 利用已有文档，减少读取
```

### 分批处理

**大任务拆分**:
```
❌ 一次性任务:
"重构整个wsjf-sprint-planner.tsx文件"
→ 需要读取3500行，消耗大量token

✅ 分批任务:
"先拆分需求卡片组件" → "再拆分迭代池组件" → ...
→ 每次只处理必要部分
```

## 项目结构优化建议

### 急需拆分的文件

1. **wsjf-sprint-planner.tsx** (3500行) ⚠️
   - 拆分为多个小组件
   - 预计减少70%读取token

2. **EditRequirementModal.tsx** (1000行)
   - 拆分为表单sections
   - 预计减少50%读取token

### 推荐的组件结构

```
src/
├── components/
│   ├── RequirementCard/
│   │   └── index.tsx (150行以内)
│   ├── SprintPool/
│   │   ├── index.tsx
│   │   ├── PoolHeader.tsx
│   │   └── PoolContent.tsx
│   └── RequirementForm/
│       ├── index.tsx
│       ├── BasicInfo.tsx
│       └── MetricsSection.tsx
└── ...
```

## 快速参考

### 配置位置
- 所有配置：`src/config/index.ts`
- 配置文档：`src/config/README.md`

### 规范文档
- 代码规范：`.claude/project-rules.md`
- 项目说明：`CLAUDE.md`

### 上下文信息
- 快速索引：`.claude/context.md`（本文件）
- 优化提示：`.claude/tips.md`

---
**提示**: 每次对话开始前，先查看 .claude/context.md 了解项目结构
