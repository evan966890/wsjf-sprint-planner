# 项目规范标准 (Standards)

本文件夹包含所有项目开发和重构的强制性规范。

---

## 📁 文件夹结构

```
docs/
├── standards/              # 项目规范标准（强制执行）
│   ├── README.md                            # 本文件
│   ├── coding-standards.md                  # 编码规范
│   ├── refactoring-standards.md             # 重构规范
│   ├── ui-design-standards.md               # UI设计规范
│   └── chrome-devtools-testing-standards.md # 测试规范（v1.7）
│
├── checklists/            # 检查清单（流程工具）
│   ├── refactoring-checklist.md
│   ├── pr-review-checklist.md
│   └── deployment-checklist.md
│
├── refactoring-lessons/   # 重构经验教训（案例学习）
│   ├── refactoring-bug-analysis.md
│   └── best-practices.md
│
└── prevention-measures.md # 预防措施实施指南
```

---

## 📚 规范文档索引

### 1. [编码规范](./coding-standards.md)
- 文件大小限制（500行硬性规定）
- 命名规范
- 注释规范
- TypeScript类型安全规范

### 2. [重构规范](./refactoring-standards.md) ⭐ **强制执行**
- 重构前准备工作
- 重构中质量控制
- 重构后验证流程
- 样式和颜色保持规范

### 3. [UI设计规范](./ui-design-standards.md)
- 颜色系统
- 组件样式规范
- 交互状态规范
- 响应式设计规范

### 4. [Chrome DevTools 测试规范](./chrome-devtools-testing-standards.md) ⭐ **推荐（v1.7新增）**
- Chrome DevTools MCP 使用指南
- AI 自动化验证流程
- 控制台错误检查规范
- 重构后 UI 验证流程
- 测试场景模板和最佳实践
- **优势**: 零依赖、即时验证、AI 完全自主

---

## 🚨 强制执行机制

所有规范通过以下机制强制执行：

### 1. Git Hooks
- **Pre-commit**: 自动检查代码质量
- **Pre-push**: 运行测试和构建

### 2. ESLint 规则
- 实时代码检查
- 编辑器集成提示

### 3. CI/CD
- 自动化测试
- 代码质量检查
- 部署前验证

### 4. Code Review
- PR 审查清单
- 至少一人 approve

---

## 📖 使用方法

### 开发新功能
1. 阅读 [编码规范](./coding-standards.md)
2. 参考 [UI设计规范](./ui-design-standards.md)
3. 使用 [新功能开发流程](../new-feature-workflow.md)

### 进行重构
1. 阅读 [重构规范](./refactoring-standards.md) ⭐ **必读**
2. 使用 [重构检查清单](../checklists/refactoring-checklist.md)
3. 参考 [重构经验教训](../refactoring-lessons/refactoring-bug-analysis.md)

### 提交代码
1. 运行 `npm run pre-commit`
2. 完成 [PR审查清单](../checklists/pr-review-checklist.md)
3. 等待 Code Review

---

## 🔄 规范更新流程

1. **发现问题** → 记录到 `refactoring-lessons/`
2. **分析原因** → 提炼为规范条款
3. **更新规范** → 添加到对应 `standards/` 文件
4. **实施工具** → 更新 hooks、ESLint等
5. **团队宣讲** → 确保全员知晓

---

## 📊 规范遵守率追踪

### 月度指标

| 指标 | 目标 | 当前 |
|------|------|------|
| 文件大小合规率 | 100% | [ ] |
| 代码审查通过率 | > 95% | [ ] |
| 重构bug率 | < 5% | [ ] |
| Chrome DevTools 验证率 | 100% | [ ] |

---

## 🎯 核心原则

### 1. 质量第一
- 功能完整性 > 代码简洁性
- 可维护性 > 开发速度

### 2. 自动化执行
- 规范必须工具化
- 不依赖人工遵守

### 3. 持续改进
- 定期回顾
- 及时更新

### 4. 团队共识
- 全员参与制定
- 共同遵守执行

---

**记住**: 规范不是限制创造力，而是保证代码质量的底线！
