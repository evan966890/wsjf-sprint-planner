# Chrome DevTools MCP E2E测试

本目录包含使用Chrome DevTools MCP进行的端到端测试示例。

## 快速开始

### 1. 确保MCP已配置

检查 `.mcp.json` 或 `.mcp/config.json` 包含chrome-devtools配置。

### 2. 编写测试

参考 `example-feishu-import.md` 中的示例。

### 3. 手动运行测试

使用Claude Code的Chrome DevTools MCP工具：
```
# 在Claude Code中请求
"请使用Chrome DevTools测试飞书导入功能"
```

## 测试场景

### 已实现的测试

- ✅ 用户登录流程
- ✅ 飞书导入Modal打开和交互
- ✅ 需求列表显示

### 计划中的测试

- [ ] 完整的需求创建流程
- [ ] 需求拖拽到迭代池
- [ ] Excel导入导出
- [ ] PDF导出
- [ ] 筛选和搜索功能

## 最佳实践

1. **独立性**：每个测试应该独立运行
2. **可重复性**：测试结果应该可预测
3. **清晰性**：测试步骤应该清晰易懂
4. **快速性**：E2E测试应在2分钟内完成

## 参考文档

- [Chrome DevTools MCP文档](../../docs/chrome-devtools-mcp-setup.md)
- [TDD强制规范](../../docs/standards/test-driven-development.md)
