# WSJF API 接口规范文档

## API 设计原则

### 核心原则
1. **RESTful架构**：遵循REST架构风格
2. **版本控制**：URL路径包含版本号
3. **一致性**：统一的响应格式和错误处理
4. **安全性**：所有API需要认证（除了公开接口）
5. **幂等性**：GET、PUT、DELETE操作幂等
6. **文档化**：OpenAPI 3.0规范

### URL规范
- 基础路径：`https://api.wsjf.com/v1`
- 资源名称使用复数：`/requirements`
- 使用连字符分隔多词：`/work-items`
- 避免深层嵌套，最多2层

## 通用规范

### 请求头
```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer <jwt_token>
X-Request-ID: <uuid>
X-Client-Version: 1.0.0
```

### 响应格式

#### 成功响应
```json
{
  "success": true,
  "data": {} | [],
  "message": "操作成功",
  "timestamp": "2024-11-04T15:30:00.000Z",
  "requestId": "uuid"
}
```

#### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "ERR_001",
    "message": "用户友好的错误信息",
    "details": "详细的技术错误信息",
    "field": "具体的错误字段"
  },
  "timestamp": "2024-11-04T15:30:00.000Z",
  "requestId": "uuid"
}
```

#### 分页响应
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 错误码规范

| 错误码 | HTTP状态码 | 说明 |
|--------|-----------|------|
| AUTH_001 | 401 | 未认证 |
| AUTH_002 | 401 | Token过期 |
| AUTH_003 | 403 | 权限不足 |
| VALID_001 | 400 | 参数验证失败 |
| VALID_002 | 400 | 必填字段缺失 |
| RES_001 | 404 | 资源不存在 |
| RES_002 | 409 | 资源冲突 |
| RATE_001 | 429 | 请求频率过高 |
| SERVER_001 | 500 | 服务器内部错误 |
| SERVER_002 | 503 | 服务不可用 |

### 通用查询参数

| 参数 | 类型 | 说明 | 示例 |
|-----|------|------|------|
| page | integer | 页码（从1开始） | ?page=1 |
| pageSize | integer | 每页数量（最大100） | ?pageSize=20 |
| sort | string | 排序字段 | ?sort=createdAt |
| order | string | 排序方向(asc/desc) | ?order=desc |
| search | string | 全文搜索 | ?search=关键词 |
| fields | string | 指定返回字段 | ?fields=id,name |
| expand | string | 展开关联资源 | ?expand=user,team |

## 详细API接口

### 1. 认证管理 (Authentication)

#### 1.1 用户注册
```yaml
POST /v1/auth/register
```

**请求体**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "张三",
  "organizationCode": "ORG001",  // 可选，加入已有组织
  "inviteCode": "INVITE123"      // 可选，团队邀请码
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "张三",
      "role": "member"
    },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token",
      "expiresIn": 3600
    }
  }
}
```

#### 1.2 用户登录
```yaml
POST /v1/auth/login
```

**请求体**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

#### 1.3 刷新Token
```yaml
POST /v1/auth/refresh
```

**请求体**
```json
{
  "refreshToken": "refresh_token"
}
```

#### 1.4 飞书OAuth登录
```yaml
GET /v1/auth/feishu/login?redirect_uri=https://app.wsjf.com/callback
GET /v1/auth/feishu/callback?code=xxx&state=xxx
```

### 2. 需求管理 (Requirements)

#### 2.1 获取需求列表
```yaml
GET /v1/requirements
```

**查询参数**
```
?page=1
&pageSize=20
&status=submitted,scheduled
&type=feature
&sprintId=uuid
&teamId=uuid
&businessDomain=新零售
&priority=P0,P1
&assignedTo=userId
&tags=urgent,important
&search=关键词
&sort=wsjfScore
&order=desc
&dateFrom=2024-01-01
&dateTo=2024-12-31
```

**响应**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "REQ-2024-001",
      "name": "优化订单处理流程",
      "description": "详细描述...",
      "type": "feature",
      "status": "scheduled",
      "priority": "P1",
      "businessTeam": "供应链团队",
      "businessDomain": "新零售",
      "businessImpactScore": 8,
      "complexityScore": 5,
      "effortDays": 10,
      "wsjfScore": 0.8,
      "deadlineDate": "2024-12-31",
      "sprint": {
        "id": "uuid",
        "name": "Sprint 2024-Q4-01"
      },
      "assignedTo": {
        "id": "uuid",
        "name": "李四"
      },
      "tags": ["urgent", "supply-chain"],
      "createdAt": "2024-11-01T10:00:00.000Z",
      "updatedAt": "2024-11-04T15:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

#### 2.2 获取单个需求详情
```yaml
GET /v1/requirements/{id}
```

**查询参数**
```
?expand=comments,attachments,history
```

#### 2.3 创建需求
```yaml
POST /v1/requirements
```

**请求体**
```json
{
  "name": "新功能开发",
  "description": "功能描述",
  "type": "feature",
  "businessTeam": "产品团队",
  "businessDomain": "新零售",
  "businessSubDomain": "门店运营",
  "submitterType": "product",
  "businessImpactScore": 8,
  "complexityScore": 5,
  "effortDays": 10,
  "deadlineDate": "2024-12-31",
  "tags": ["important"],
  "customFields": {
    "department": "技术部",
    "projectCode": "PROJ-001"
  }
}
```

#### 2.4 更新需求
```yaml
PUT /v1/requirements/{id}
```

**请求体**（部分更新）
```json
{
  "status": "in_progress",
  "assignedTo": "userId",
  "actualStartDate": "2024-11-04"
}
```

#### 2.5 删除需求
```yaml
DELETE /v1/requirements/{id}
```

#### 2.6 批量操作

**批量创建**
```yaml
POST /v1/requirements/batch
```

**请求体**
```json
{
  "requirements": [
    {...},
    {...}
  ],
  "options": {
    "skipValidation": false,
    "returnCreated": true
  }
}
```

**批量更新**
```yaml
PUT /v1/requirements/batch
```

**请求体**
```json
{
  "updates": [
    {
      "id": "uuid1",
      "status": "scheduled",
      "sprintId": "sprint-uuid"
    }
  ]
}
```

**批量删除**
```yaml
DELETE /v1/requirements/batch
```

**请求体**
```json
{
  "ids": ["uuid1", "uuid2", "uuid3"]
}
```

#### 2.7 需求评分
```yaml
POST /v1/requirements/{id}/score
```

**请求体**
```json
{
  "businessImpactScore": 8,
  "complexityScore": 5,
  "reason": "基于新的业务优先级调整"
}
```

#### 2.8 AI分析
```yaml
POST /v1/requirements/{id}/analyze
```

**请求体**
```json
{
  "modelType": "deepseek",
  "analysisType": "scoring",
  "prompt": "请分析这个需求的业务价值",
  "apiKey": "sk-xxx"  // 可选，使用用户自己的API Key
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "analysis": {
      "suggestedBusinessScore": 8,
      "suggestedComplexityScore": 5,
      "reasoning": "AI分析理由...",
      "confidence": 0.85,
      "affectedMetrics": [
        {"key": "revenue", "impact": "+5%"}
      ]
    },
    "usage": {
      "tokensUsed": 1500,
      "cost": 0.003
    }
  }
}
```

#### 2.9 批量AI评估
```yaml
POST /v1/requirements/batch-evaluate
```

**请求体**
```json
{
  "requirementIds": ["uuid1", "uuid2"],
  "modelType": "openai",
  "options": {
    "autoApply": false,
    "includeReasoning": true
  }
}
```

#### 2.10 需求状态变更
```yaml
PUT /v1/requirements/{id}/status
```

**请求体**
```json
{
  "status": "in_progress",
  "reason": "开始开发"
}
```

#### 2.11 分配到Sprint
```yaml
POST /v1/requirements/{id}/assign-sprint
```

**请求体**
```json
{
  "sprintId": "sprint-uuid",
  "position": 5  // 可选，在Sprint中的顺序
}
```

#### 2.12 分配给用户
```yaml
POST /v1/requirements/{id}/assign-user
```

**请求体**
```json
{
  "userId": "user-uuid",
  "notifyUser": true
}
```

#### 2.13 需求历史记录
```yaml
GET /v1/requirements/{id}/history
```

**响应**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "changeType": "status_changed",
      "oldValues": {"status": "submitted"},
      "newValues": {"status": "scheduled"},
      "changedBy": {
        "id": "uuid",
        "name": "张三"
      },
      "changedAt": "2024-11-04T10:00:00.000Z"
    }
  ]
}
```

#### 2.14 需求附件管理

**上传附件**
```yaml
POST /v1/requirements/{id}/attachments
Content-Type: multipart/form-data
```

**获取附件列表**
```yaml
GET /v1/requirements/{id}/attachments
```

**删除附件**
```yaml
DELETE /v1/requirements/{id}/attachments/{attachmentId}
```

#### 2.15 需求评论

**获取评论**
```yaml
GET /v1/requirements/{id}/comments
```

**添加评论**
```yaml
POST /v1/requirements/{id}/comments
```

**请求体**
```json
{
  "content": "评论内容",
  "parentCommentId": null,
  "mentions": ["userId1", "userId2"]
}
```

#### 2.16 导入导出

**导出需求**
```yaml
GET /v1/requirements/export?format=excel&ids=uuid1,uuid2
```

**导入需求**
```yaml
POST /v1/requirements/import
Content-Type: multipart/form-data
```

### 3. Sprint管理 (Sprints)

#### 3.1 获取Sprint列表
```yaml
GET /v1/sprints?teamId=uuid&status=active
```

#### 3.2 创建Sprint
```yaml
POST /v1/sprints
```

**请求体**
```json
{
  "name": "Sprint 2024-Q4-02",
  "teamId": "team-uuid",
  "startDate": "2024-11-18",
  "endDate": "2024-12-01",
  "goals": "完成订单系统优化",
  "capacity": {
    "developers": 5,
    "totalDays": 50
  }
}
```

#### 3.3 更新Sprint
```yaml
PUT /v1/sprints/{id}
```

#### 3.4 启动Sprint
```yaml
POST /v1/sprints/{id}/start
```

#### 3.5 完成Sprint
```yaml
POST /v1/sprints/{id}/complete
```

**请求体**
```json
{
  "retrospective": "Sprint回顾内容",
  "moveUnfinished": true,  // 未完成需求移到下个Sprint
  "targetSprintId": "next-sprint-uuid"
}
```

#### 3.6 获取Sprint需求
```yaml
GET /v1/sprints/{id}/requirements
```

#### 3.7 Sprint容量规划
```yaml
PUT /v1/sprints/{id}/capacity
```

**请求体**
```json
{
  "developers": 5,
  "totalDays": 45,
  "holidays": 2,
  "bufferPercentage": 20
}
```

#### 3.8 Sprint报告

**燃尽图数据**
```yaml
GET /v1/sprints/{id}/reports/burndown
```

**速度图表**
```yaml
GET /v1/sprints/{id}/reports/velocity
```

**完成率报告**
```yaml
GET /v1/sprints/{id}/reports/completion
```

### 4. 团队管理 (Teams)

#### 4.1 获取团队列表
```yaml
GET /v1/teams
```

#### 4.2 创建团队
```yaml
POST /v1/teams
```

**请求体**
```json
{
  "name": "产品团队",
  "description": "负责产品规划和设计",
  "type": "product",
  "settings": {
    "workingDays": 5,
    "sprintDuration": 14
  }
}
```

#### 4.3 团队成员管理

**获取成员**
```yaml
GET /v1/teams/{id}/members
```

**添加成员**
```yaml
POST /v1/teams/{id}/members
```

**请求体**
```json
{
  "userId": "user-uuid",
  "role": "member"
}
```

**更新成员角色**
```yaml
PUT /v1/teams/{id}/members/{userId}
```

**移除成员**
```yaml
DELETE /v1/teams/{id}/members/{userId}
```

#### 4.4 邀请成员
```yaml
POST /v1/teams/{id}/invite
```

**请求体**
```json
{
  "email": "newuser@example.com",
  "role": "member",
  "message": "邀请你加入团队"
}
```

### 5. 用户管理 (Users)

#### 5.1 获取当前用户信息
```yaml
GET /v1/users/me
```

#### 5.2 更新个人信息
```yaml
PUT /v1/users/me
```

**请求体**
```json
{
  "name": "新名称",
  "avatarUrl": "https://...",
  "preferences": {
    "language": "zh-CN",
    "timezone": "Asia/Shanghai",
    "notifications": {
      "email": true,
      "inApp": true
    }
  }
}
```

#### 5.3 用户通知

**获取通知**
```yaml
GET /v1/users/me/notifications?unreadOnly=true
```

**标记已读**
```yaml
PUT /v1/users/me/notifications/{id}/read
```

**批量标记已读**
```yaml
PUT /v1/users/me/notifications/read-all
```

### 6. 文件管理 (Files)

#### 6.1 上传文件
```yaml
POST /v1/files/upload
Content-Type: multipart/form-data
```

**表单字段**
- file: 文件
- type: document|image|spreadsheet
- description: 文件描述

#### 6.2 OCR识别
```yaml
POST /v1/files/ocr
Content-Type: multipart/form-data
```

**表单字段**
- file: 图片或PDF文件
- backend: ocrspace|baidu|auto
- extractRequirement: true|false

**响应**
```json
{
  "success": true,
  "data": {
    "text": "识别的文本内容",
    "confidence": 0.95,
    "extractedRequirement": {
      "name": "提取的需求名称",
      "description": "提取的描述",
      "businessTeam": "提取的团队"
    }
  }
}
```

### 7. 飞书集成 (Feishu)

#### 7.1 获取工作项类型
```yaml
GET /v1/feishu/work-item-types
```

#### 7.2 获取项目列表
```yaml
GET /v1/feishu/projects
```

#### 7.3 导入工作项
```yaml
POST /v1/feishu/import
```

**请求体**
```json
{
  "projectKey": "PROJ001",
  "workItemTypeKey": "requirement",
  "workItemIds": ["WI001", "WI002"],
  "mapping": {
    "name": "summary",
    "description": "description",
    "assignee": "assigned_to"
  }
}
```

#### 7.4 同步到飞书
```yaml
POST /v1/feishu/sync
```

**请求体**
```json
{
  "requirementIds": ["uuid1", "uuid2"],
  "createNew": true,
  "updateExisting": true
}
```

### 8. 报表分析 (Analytics)

#### 8.1 项目概览
```yaml
GET /v1/analytics/overview?teamId=uuid&dateRange=30d
```

**响应**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRequirements": 150,
      "completedRequirements": 120,
      "inProgressRequirements": 20,
      "averageCompletionTime": 5.5,
      "velocityTrend": "increasing"
    },
    "byStatus": {
      "draft": 10,
      "submitted": 15,
      "scheduled": 20,
      "in_progress": 20,
      "completed": 85
    },
    "byPriority": {
      "P0": 5,
      "P1": 30,
      "P2": 65,
      "P3": 50
    }
  }
}
```

#### 8.2 团队效率指标
```yaml
GET /v1/analytics/team-efficiency?teamId=uuid&period=quarter
```

#### 8.3 WSJF分析
```yaml
GET /v1/analytics/wsjf?sprintId=uuid
```

#### 8.4 趋势分析
```yaml
GET /v1/analytics/trends?metric=velocity&period=month&months=6
```

### 9. WebSocket实时通信

#### 9.1 连接建立
```javascript
const socket = io('wss://api.wsjf.com', {
  auth: {
    token: 'jwt_token'
  }
});
```

#### 9.2 订阅房间
```javascript
// 订阅需求变更
socket.emit('subscribe', {
  room: 'requirement:uuid'
});

// 订阅Sprint变更
socket.emit('subscribe', {
  room: 'sprint:uuid'
});

// 订阅团队通知
socket.emit('subscribe', {
  room: 'team:uuid'
});
```

#### 9.3 事件监听
```javascript
// 需求更新
socket.on('requirement:updated', (data) => {
  console.log('需求已更新', data);
});

// 新评论
socket.on('comment:added', (data) => {
  console.log('新评论', data);
});

// 用户在线状态
socket.on('user:online', (data) => {
  console.log('用户上线', data.userId);
});

// 协作锁
socket.on('requirement:locked', (data) => {
  console.log('需求被锁定编辑', data.lockedBy);
});
```

#### 9.4 发送事件
```javascript
// 通知正在编辑
socket.emit('requirement:editing', {
  requirementId: 'uuid',
  field: 'description'
});

// 释放编辑锁
socket.emit('requirement:unlock', {
  requirementId: 'uuid'
});
```

## API限流策略

### 限流规则
| 端点类型 | 限制 | 时间窗口 |
|---------|------|----------|
| 认证相关 | 5次 | 每分钟 |
| 读取操作 | 100次 | 每分钟 |
| 写入操作 | 30次 | 每分钟 |
| AI分析 | 10次 | 每分钟 |
| 批量操作 | 5次 | 每分钟 |
| 文件上传 | 10次 | 每分钟 |

### 限流响应头
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699106400
```

## API版本管理

### 版本策略
1. 主版本号表示不兼容的API变更
2. 次版本号表示向后兼容的功能新增
3. 修订号表示向后兼容的问题修正

### 版本废弃流程
1. 新版本发布时标记废弃API
2. 废弃API继续维护6个月
3. 返回`Deprecation`响应头
4. 6个月后停止支持

### 版本协商
```http
Accept-Version: v1
Accept-Version: ~1.2  # 1.2.x
Accept-Version: ^1.0  # 1.x.x
```

## SDK支持

### 官方SDK
- JavaScript/TypeScript
- Python
- Go
- Java

### SDK示例（TypeScript）
```typescript
import { WSJFClient } from '@wsjf/sdk';

const client = new WSJFClient({
  apiKey: 'your-api-key',
  baseURL: 'https://api.wsjf.com/v1'
});

// 获取需求列表
const requirements = await client.requirements.list({
  status: ['submitted', 'scheduled'],
  page: 1,
  pageSize: 20
});

// 创建需求
const newRequirement = await client.requirements.create({
  name: '新功能开发',
  description: '...',
  businessImpactScore: 8
});

// WebSocket订阅
client.on('requirement:updated', (data) => {
  console.log('需求更新', data);
});
```

## 测试环境

### 测试服务器
- URL: `https://api-test.wsjf.com/v1`
- 测试账号：test@wsjf.com / TestPass123
- 重置数据：每日凌晨2点

### Postman Collection
提供完整的Postman测试集合，包含：
- 环境变量配置
- 认证流程
- 所有API端点示例
- 自动化测试脚本

## 监控与调试

### 健康检查
```yaml
GET /health
```

### API状态
```yaml
GET /status
```

### 调试模式
添加请求头启用调试信息：
```http
X-Debug-Mode: true
```

响应将包含额外调试信息：
```json
{
  "debug": {
    "sql": "SELECT * FROM requirements...",
    "executionTime": 45,
    "cacheHit": false
  }
}
```

## 合规性

### GDPR合规
- 数据导出：`GET /v1/users/me/data`
- 数据删除：`DELETE /v1/users/me`
- 隐私设置：`PUT /v1/users/me/privacy`

### 审计日志
所有API调用都记录审计日志：
- 用户身份
- 操作类型
- 资源标识
- 时间戳
- IP地址