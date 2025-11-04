# WSJF 后端规划文档

## 文档概述

本目录包含WSJF Sprint Planner后端系统的完整规划文档。这些文档详细描述了从架构设计到实施部署的各个方面。

## 文档结构

### 📁 核心规划文档

1. **[01-ARCHITECTURE-OVERVIEW.md](./01-ARCHITECTURE-OVERVIEW.md)**
   - 系统架构总体设计
   - 技术栈选型
   - 模块划分
   - 部署架构

2. **[02-DATABASE-DESIGN.md](./02-DATABASE-DESIGN.md)**
   - 完整的数据库表结构
   - 实体关系图
   - 索引策略
   - 数据迁移方案

3. **[03-API-SPECIFICATION.md](./03-API-SPECIFICATION.md)**
   - RESTful API规范
   - 详细的接口定义
   - WebSocket实时通信
   - SDK设计

4. **[04-IMPLEMENTATION-PLAN.md](./04-IMPLEMENTATION-PLAN.md)**
   - 分阶段实施计划
   - 时间线和里程碑
   - 资源需求
   - 风险管理

## 当前状态

### ✅ 已完成的规划

- [x] 整体架构设计
- [x] 数据库模型设计
- [x] API接口规范
- [x] 实施计划制定
- [x] 技术栈选型

### 📋 待完成事项

- [ ] 安全策略详细设计
- [ ] 性能优化具体方案
- [ ] 监控告警体系设计
- [ ] 灾备恢复方案
- [ ] 国际化支持方案

## 快速开始指南

### 对于新加入的开发者

1. **第一步**：阅读[架构总览](./01-ARCHITECTURE-OVERVIEW.md)了解系统设计
2. **第二步**：查看[数据库设计](./02-DATABASE-DESIGN.md)理解数据模型
3. **第三步**：熟悉[API规范](./03-API-SPECIFICATION.md)了解接口设计
4. **第四步**：参考[实施计划](./04-IMPLEMENTATION-PLAN.md)了解开发进度

### 对于项目管理者

1. 关注[实施计划](./04-IMPLEMENTATION-PLAN.md)中的里程碑和时间线
2. 查看资源需求和风险管理部分
3. 了解各阶段的交付物

## 技术决策记录

### 为什么选择PostgreSQL？
- ACID事务支持，确保数据一致性
- JSONB支持，灵活存储非结构化数据
- 强大的查询优化器
- 丰富的扩展生态

### 为什么选择Express而不是Fastify？
- 与现有OCR服务保持技术栈一致
- 社区生态更成熟
- 团队更熟悉Express
- 中间件选择更丰富

### 为什么采用JWT认证？
- 无状态，易于扩展
- 支持分布式部署
- 前端集成简单
- 支持token刷新机制

## 核心功能模块

### 1. 用户与认证
- 用户注册/登录
- JWT Token管理
- 飞书OAuth集成
- 角色权限控制

### 2. 需求管理
- 需求CRUD操作
- WSJF评分计算
- 批量导入导出
- AI辅助分析

### 3. Sprint管理
- Sprint生命周期
- 容量规划
- 燃尽图生成
- 速度追踪

### 4. 实时协作
- WebSocket通信
- 数据实时同步
- 协作锁机制
- 冲突解决

### 5. 集成能力
- 飞书工作项同步
- Webhook支持
- 第三方API集成
- 数据导入导出

## 开发环境搭建

```bash
# 1. 克隆项目
git clone https://github.com/your-org/wsjf-backend.git

# 2. 安装依赖
cd wsjf-backend
npm install

# 3. 配置环境变量
cp .env.example .env.development

# 4. 启动数据库
docker-compose up -d postgres redis

# 5. 运行迁移
npm run db:migrate

# 6. 启动开发服务器
npm run dev
```

## API测试

### 使用Postman
1. 导入 `postman_collection.json`
2. 配置环境变量
3. 运行测试集合

### 使用curl
```bash
# 登录获取token
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

# 获取需求列表
curl -X GET http://localhost:3000/v1/requirements \
  -H "Authorization: Bearer <token>"
```

## 部署指南

### 开发环境
```bash
npm run dev
```

### 测试环境
```bash
npm run build
npm run test
npm run start:test
```

### 生产环境
```bash
# 构建Docker镜像
docker build -t wsjf-backend:latest .

# 运行容器
docker run -d \
  -p 3000:3000 \
  -e NODE_ENV=production \
  --name wsjf-backend \
  wsjf-backend:latest
```

## 项目联系人

- **技术负责人**：[待定]
- **产品负责人**：[待定]
- **项目经理**：[待定]

## 相关资源

### 内部文档
- [前端项目文档](../frontend-planning/)
- [API设计规范](./03-API-SPECIFICATION.md)
- [数据库设计](./02-DATABASE-DESIGN.md)

### 外部资源
- [PostgreSQL文档](https://www.postgresql.org/docs/)
- [TypeORM文档](https://typeorm.io/)
- [Express.js指南](https://expressjs.com/)
- [JWT.io](https://jwt.io/)

## 更新日志

### 2024-11-04
- 初始规划文档创建
- 完成架构设计
- 完成数据库设计
- 完成API规范
- 制定实施计划

## 下一步行动

1. **立即开始**
   - 搭建开发环境
   - 创建项目框架
   - 实现认证系统

2. **本周目标**
   - 完成基础架构
   - 实现用户管理API
   - 创建第一个可运行的版本

3. **本月目标**
   - 完成核心功能API
   - 实现WebSocket通信
   - 开始前后端联调

## 注意事项

⚠️ **重要提醒**
- 所有敏感配置必须使用环境变量
- 不要提交 `.env` 文件到版本控制
- 定期更新依赖包以修复安全漏洞
- 遵循代码规范和提交规范

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交代码（遵循提交规范）
4. 创建Pull Request
5. 等待代码审查

## 许可证

本项目采用 [MIT License](../../LICENSE)

---

*本文档会随着项目进展持续更新，请定期查看最新版本。*