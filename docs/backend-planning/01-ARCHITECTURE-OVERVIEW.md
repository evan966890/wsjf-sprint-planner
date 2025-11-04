# WSJF 后端架构总体规划

## 项目背景

WSJF Sprint Planner 是一个基于加权最短作业优先（Weighted Shortest Job First）方法的需求排期可视化工具。当前系统仅有前端实现，数据存储依赖浏览器本地存储，无法支持多用户协作和数据持久化。

## 现状分析

### 已有功能
- **前端技术栈**：React 18 + TypeScript + Vite + Zustand
- **UI框架**：TailwindCSS + Lucide Icons
- **现有服务**：OCR服务器（Node.js + Express，端口3001）
- **主要功能模块**：
  - 需求管理（创建、编辑、评分）
  - Sprint规划（拖拽分配、容量管理）
  - WSJF评分系统（业务影响度、技术复杂度）
  - 飞书集成（OAuth登录、工作项同步）
  - 文件导入（Excel、Word、PDF、图片OCR）
  - AI辅助评估（支持OpenAI和DeepSeek）

### 需要解决的问题
1. **数据持久化**：数据仅存储在客户端localStorage，易丢失
2. **多用户协作**：无法支持团队协作和权限管理
3. **数据同步**：无法在多设备间同步数据
4. **安全性**：缺乏用户认证和数据访问控制
5. **可扩展性**：无法支持大规模数据和并发访问

## 架构设计原则

1. **渐进式迁移**：保持前端兼容性，支持离线模式
2. **API优先**：设计RESTful API，支持多端接入
3. **模块化设计**：功能模块独立，便于扩展和维护
4. **安全性**：实施认证授权，数据加密传输
5. **高可用**：支持水平扩展，故障自动恢复
6. **实时性**：支持WebSocket实时数据同步

## 技术栈选型

### 核心框架
- **运行时**：Node.js 18+ LTS
- **Web框架**：Express.js（与现有OCR服务保持一致）
- **语言**：TypeScript 5.x
- **包管理**：npm/pnpm

### 数据层
- **主数据库**：PostgreSQL 15+（关系型数据，事务支持）
- **缓存层**：Redis 7+（会话存储、缓存、实时数据）
- **ORM**：TypeORM（类型安全，迁移管理）
- **文件存储**：本地存储 / 云存储（OSS/S3）

### 认证与安全
- **认证方式**：JWT Token
- **OAuth**：飞书OAuth 2.0
- **加密**：bcrypt（密码），crypto（敏感数据）
- **安全中间件**：Helmet, CORS, Rate Limiting

### 实时通信
- **WebSocket**：Socket.io（兼容性好）
- **消息队列**：Redis Pub/Sub（可选：RabbitMQ）

### 开发工具
- **构建工具**：tsx（开发），tsc（生产）
- **测试框架**：Vitest + Supertest
- **代码规范**：ESLint + Prettier
- **API文档**：OpenAPI 3.0 + Swagger UI
- **日志**：Winston
- **监控**：Morgan（HTTP）, 自定义metrics

## 系统架构

### 分层架构

```
┌─────────────────────────────────────────────┐
│            前端应用 (React SPA)              │
├─────────────────────────────────────────────┤
│            API Gateway (可选)                │
├─────────────────────────────────────────────┤
│              API Layer                      │
│  ┌─────────────────────────────────────┐   │
│  │  REST API  │  WebSocket  │  GraphQL │   │
│  └─────────────────────────────────────┘   │
├─────────────────────────────────────────────┤
│           Business Logic Layer              │
│  ┌─────────────────────────────────────┐   │
│  │ Services │ Validators │ Middlewares │   │
│  └─────────────────────────────────────┘   │
├─────────────────────────────────────────────┤
│             Data Access Layer               │
│  ┌─────────────────────────────────────┐   │
│  │ Repositories │ Models │ Migrations  │   │
│  └─────────────────────────────────────┘   │
├─────────────────────────────────────────────┤
│           Infrastructure Layer              │
│  ┌──────────┬──────────┬──────────────┐   │
│  │PostgreSQL│  Redis   │  File Storage │   │
│  └──────────┴──────────┴──────────────┘   │
└─────────────────────────────────────────────┘
```

### 目录结构

```
backend/
├── src/
│   ├── config/           # 配置文件
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   └── app.ts
│   ├── controllers/      # 控制器层
│   │   ├── auth.controller.ts
│   │   ├── requirement.controller.ts
│   │   └── sprint.controller.ts
│   ├── services/         # 业务逻辑层
│   │   ├── auth.service.ts
│   │   ├── requirement.service.ts
│   │   └── wsjf.service.ts
│   ├── models/          # 数据模型
│   │   ├── entities/
│   │   └── repositories/
│   ├── middlewares/     # 中间件
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   └── error.middleware.ts
│   ├── routes/          # 路由定义
│   │   ├── v1/
│   │   └── index.ts
│   ├── utils/           # 工具函数
│   ├── types/           # TypeScript类型定义
│   ├── validators/      # 数据验证
│   ├── websocket/       # WebSocket处理
│   └── server.ts        # 应用入口
├── migrations/          # 数据库迁移
├── tests/              # 测试文件
├── scripts/            # 脚本工具
├── docs/               # API文档
├── .env.example        # 环境变量示例
├── docker-compose.yml  # Docker配置
├── package.json
└── tsconfig.json
```

## 核心模块设计

### 1. 认证授权模块
- JWT Token生成与验证
- 用户注册、登录、登出
- 飞书OAuth集成
- 角色权限管理（RBAC）
- Token刷新机制

### 2. 需求管理模块
- 需求CRUD操作
- 批量导入导出
- WSJF评分计算
- 需求变更历史
- 文件附件管理

### 3. Sprint管理模块
- Sprint生命周期管理
- 需求分配与调整
- 容量规划
- 燃尽图数据生成
- Sprint报告

### 4. 实时协作模块
- WebSocket连接管理
- 数据变更广播
- 在线用户状态
- 协作锁机制
- 冲突解决

### 5. AI集成模块
- AI模型代理
- 批量评估任务队列
- Token使用统计
- 响应缓存

### 6. 数据同步模块
- 飞书数据同步
- 增量同步策略
- 冲突检测与合并
- 同步日志

## 部署架构

### 开发环境
```yaml
# docker-compose.dev.yml
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: wsjf_dev

  redis:
    image: redis:7-alpine

  backend:
    build: .
    volumes:
      - ./src:/app/src
    environment:
      NODE_ENV: development
```

### 生产环境架构

```
        ┌──────────────┐
        │   Nginx LB   │
        └──────┬───────┘
               │
     ┌─────────┴──────────┐
     │                    │
┌────▼────┐         ┌────▼────┐
│ Node.js │         │ Node.js │
│Instance1│         │Instance2│
└────┬────┘         └────┬────┘
     │                    │
     └──────┬─────────────┘
            │
     ┌──────▼───────┐
     │              │
┌────▼────┐   ┌────▼────┐
│PostgreSQL│   │  Redis  │
│ Primary  │   │ Cluster │
└─────────┘   └─────────┘
```

## 安全策略

1. **API安全**
   - HTTPS强制
   - API Rate Limiting
   - 请求签名验证
   - SQL注入防护

2. **数据安全**
   - 敏感数据加密存储
   - 数据传输加密
   - 定期数据备份
   - 审计日志

3. **访问控制**
   - 基于角色的权限（RBAC）
   - 资源级权限控制
   - IP白名单（可选）
   - 会话管理

## 性能优化策略

1. **缓存策略**
   - Redis缓存热点数据
   - HTTP缓存头
   - 查询结果缓存

2. **数据库优化**
   - 索引优化
   - 查询优化
   - 连接池管理

3. **API优化**
   - 响应压缩
   - 分页加载
   - 懒加载策略

## 监控与运维

1. **日志管理**
   - 应用日志（Winston）
   - 访问日志（Morgan）
   - 错误日志
   - 审计日志

2. **性能监控**
   - API响应时间
   - 数据库查询性能
   - 内存使用率
   - CPU使用率

3. **告警机制**
   - 错误率告警
   - 性能阈值告警
   - 安全事件告警

## 下一步计划

1. **第一阶段**（第1-2周）
   - 搭建基础项目结构
   - 实现用户认证系统
   - 设置数据库连接

2. **第二阶段**（第3-4周）
   - 实现需求管理API
   - 实现Sprint管理API
   - 数据迁移工具

3. **第三阶段**（第5-6周）
   - 实现WebSocket实时同步
   - 飞书集成
   - 权限系统

4. **第四阶段**（第7-8周）
   - 性能优化
   - 部署配置
   - 文档完善

## 风险与对策

| 风险 | 影响 | 对策 |
|-----|------|------|
| 数据迁移失败 | 高 | 提供回滚机制，保留原始数据 |
| 性能瓶颈 | 中 | 实施缓存策略，数据库优化 |
| 安全漏洞 | 高 | 定期安全审计，及时更新依赖 |
| 兼容性问题 | 中 | 版本化API，渐进式迁移 |