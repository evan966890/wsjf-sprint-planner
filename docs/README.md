# WSJF 项目文档

本目录包含项目开发的重要规范和指导文档。

## 📚 文档索引

### 必读文档（开发前）

1. **[架构指导原则](architecture-guide.md)** ⭐⭐⭐
   - 文件大小限制规则
   - 代码组织原则
   - 何时拆分的判断标准
   - 自动化检查工具

   **适用场景：**
   - 开始开发新功能前
   - Code Review 时
   - 重构现有代码时

2. **[新功能开发流程](new-feature-workflow.md)** ⭐⭐⭐
   - 开发前检查清单
   - 开发中检查清单
   - 开发后检查清单
   - 拆分决策树
   - 快速开始模板

   **适用场景：**
   - 接到新需求时
   - 不确定如何组织代码时
   - 文件变得很大需要拆分时

---

## 🚀 快速开始

### 新开发者入职
```bash
# 1. 阅读项目概述
cat ../CLAUDE.md

# 2. 阅读架构规范
cat docs/architecture-guide.md

# 3. 了解开发流程
cat docs/new-feature-workflow.md

# 4. 检查当前代码状态
npm run check-file-size
```

### 开发新功能前
```bash
# 1. 确保代码库健康
npm run check-file-size

# 2. 如果有严重问题（超过 500 行的文件），先重构

# 3. 规划新功能的文件结构（参考 new-feature-workflow.md）

# 4. 开始开发
```

### 提交代码前
```bash
# 1. 检查文件大小
npm run check-file-size

# 2. 检查 TypeScript 类型
npm run build

# 3. 如果有问题，按照架构指导原则重构

# 4. 提交
git commit -m "feat: 添加xxx功能"
```

---

## 🎯 核心原则

### 文件大小三原则
1. **500 行是红线** - 绝对不能超过
2. **300 行是警戒线** - 超过就要评估拆分
3. **200 行是舒适区** - 推荐保持在此范围

### 代码组织四原则
1. **UI 和逻辑分离** - 组件 vs Hook
2. **常量配置独立** - constants/ 和 config/
3. **工具函数复用** - utils/
4. **组件合理拆分** - 子组件和 Section

### 开发五步法
1. **Planning** - 规划文件结构
2. **Implementation** - 边开发边检查
3. **Review** - 自检代码质量
4. **Refactor** - 发现问题立即重构
5. **Document** - 更新相关文档

---

## 🛠️ 自动化工具

### 文件大小检查
```bash
npm run check-file-size
```

**输出示例：**
```
🚫 错误（必须立即处理）:
   ❌ src/components/EditRequirementModal.tsx - 1738 行 (超过 500 行)

⚠️  警告（建议本周内处理）:
   ⚠️  src/store/useStore.ts - 479 行 (超过 300 行)

ℹ️  信息（开始关注，避免继续增长）:
   ℹ️  src/config/index.ts - 293 行
```

### 构建检查
```bash
npm run build  # TypeScript 编译 + Vite 构建
```

---

## 📖 扩展阅读

### 推荐资源
- [Clean Code 原则](https://github.com/ryanmcdermott/clean-code-javascript)
- [React 组件设计模式](https://www.patterns.dev/posts/react-component-patterns)
- [单一职责原则](https://en.wikipedia.org/wiki/Single-responsibility_principle)

### 团队约定
- 每个迭代结束运行 `npm run check-file-size`
- Code Review 时检查文件大小
- 发现技术债务及时记录并计划重构

---

## 🔄 文档更新

本目录的文档会随着项目演进而更新。如果发现文档过时或有改进建议：

1. 在团队会议上提出
2. 更新相应文档
3. 通知所有开发者
4. 更新 CLAUDE.md 中的引用

---

## ❓ 常见问题

### Q: 我的组件已经 400 行了，怎么办？
A: 立即查看 [架构指导原则](architecture-guide.md) 的"代码拆分判断标准"章节，按照步骤进行拆分。

### Q: 不确定该不该拆分？
A: 运行 `npm run check-file-size`，如果有警告就拆分。如果还不确定，查看 [新功能开发流程](new-feature-workflow.md) 的"拆分决策树"。

### Q: 拆分后导入语句太多了？
A: 使用 barrel export（index.ts），详见新功能开发流程文档的 Q&A 部分。

### Q: 历史遗留代码太大，影响新功能开发？
A: 优先重构会直接影响新功能的部分。按优先级：P0（立即） > P1（本周） > P2（下迭代）。

---

**记住：**
> 保持代码简洁不是为了炫技，而是为了 6 个月后的自己和团队成员。

**Happy Coding! 🎉**
