# 飞书集成使用指南

**版本**: v1.0
**最后更新**: 2025-10-26

---

## 1. 快速开始

### 1.1 集成到主应用

在主应用组件中添加飞书导入功能：

```typescript
// src/wsjf-sprint-planner.tsx

// 1. 导入飞书组件
import { FeishuImportModal } from './components/FeishuImportModal';

// 2. 从Store获取状态
const showFeishuImportModal = useStore((state) => state.showFeishuImportModal);
const setShowFeishuImportModal = useStore((state) => state.setShowFeishuImportModal);

// 3. 处理飞书导入
const handleFeishuImport = (requirements: Requirement[]) => {
  // 计算WSJF分数
  const scored = calculateScores([...requirements, ...requirements]);

  // 更新状态
  setRequirements(scored);
  setUnscheduled([
    ...unscheduled,
    ...scored.filter(r => requirements.some(req => req.id === r.id))
  ]);

  showToast(`成功从飞书导入 ${requirements.length} 个需求`, 'success');
};

// 4. 渲染Modal
return (
  <>
    {/* 其他组件 */}

    <FeishuImportModal
      isOpen={showFeishuImportModal}
      onClose={() => setShowFeishuImportModal(false)}
      onImport={handleFeishuImport}
    />
  </>
);
```

### 1.2 添加触发按钮

在Header组件中添加"从飞书导入"按钮：

```typescript
// src/components/Header.tsx

<button
  type="button"
  onClick={() => setShowFeishuImportModal(true)}
  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
>
  从飞书导入
</button>
```

---

## 2. 用户操作流程

### 2.1 配置飞书认证

1. 点击"从飞书导入"按钮
2. 在配置页面输入：
   - **Plugin ID**: 从飞书开放平台获取
   - **Plugin Secret**: 从飞书开放平台获取
3. 点击"保存并连接"
4. 系统自动测试连接并进入下一步

**获取飞书凭证**：
1. 访问 [飞书开放平台](https://open.feishu.cn)
2. 创建企业自建应用
3. 在应用详情页获取App ID和App Secret
4. 配置应用权限：
   - `project:read` - 读取项目信息
   - `work_item:read` - 读取工作项信息

### 2.2 选择飞书项目

1. 系统自动加载项目列表
2. 浏览并选择目标项目
3. 点击项目卡片进入任务选择

### 2.3 选择任务

1. 查看项目下的所有任务列表
2. 使用复选框选择需要导入的任务
3. 支持全选/取消全选
4. 点击"下一步"进行数据转换

### 2.4 确认导入

1. 预览转换后的需求数据
2. 检查字段映射是否正确
3. 点击"确认导入"
4. 导入的需求将自动添加到待排期区

---

## 3. 字段映射规则

### 3.1 默认映射

| 飞书字段 | WSJF字段 | 转换规则 |
|---------|---------|---------|
| name | name | 直接映射 |
| description | description | 直接映射 |
| creator.name | submitterName | 直接映射 |
| created_at | submitDate | 时间戳→YYYY-MM-DD |
| due_date | deadlineDate | 时间戳→YYYY-MM-DD |
| estimated_hours | effortDays | 小时→天（8h=1天） |
| assignee.name | productManager | 直接映射 |
| status | techProgress | 状态映射（见下表） |
| work_item_type.name | type | 类型映射（见下表） |

### 3.2 状态映射

| 飞书状态 | WSJF技术进度 |
|---------|-------------|
| to_do | 待评估 |
| in_progress | 已评估工作量 |
| testing | 已完成技术方案 |
| done | 已完成技术方案 |
| blocked | 待评估 |
| cancelled | 待评估 |

### 3.3 工作项类型映射

| 飞书类型 | WSJF需求类型 |
|---------|-------------|
| Bug/缺陷 | Bug修复 |
| 优化/改进 | 优化 |
| 重构 | 重构 |
| 其他 | 功能需求 |

---

## 4. 高级配置

### 4.1 自定义字段映射

如需自定义字段映射，可修改 `src/utils/feishu/feishuFieldMapper.ts`：

```typescript
export const DEFAULT_FIELD_MAPPINGS: FieldMapping[] = [
  {
    feishuField: 'custom_field_name',  // 飞书自定义字段
    wsjfField: 'customBusinessDomain', // WSJF字段
    transform: (value) => {
      // 自定义转换逻辑
      return transformedValue;
    },
    defaultValue: '默认值',
  },
  // ... 更多映射
];
```

### 4.2 批量导入配置

```typescript
// 修改导入默认配置
const result = transformWorkItems(selected, DEFAULT_FIELD_MAPPINGS, {
  defaultSubmitter: '产品',        // 默认提交方
  defaultBusinessDomain: '新零售', // 默认业务域
});
```

---

## 5. 故障排查

### 5.1 认证失败

**问题**: "飞书认证失败，请检查Plugin ID和Secret是否正确"

**解决方案**:
1. 检查Plugin ID和Secret是否正确
2. 确认应用状态是否为"已启用"
3. 检查应用权限配置
4. 尝试重新获取凭证

### 5.2 无法获取项目列表

**问题**: "权限不足，请检查飞书应用权限配置"

**解决方案**:
1. 在飞书开放平台为应用添加权限：
   - `project:read`
   - `work_item:read`
2. 重新安装应用到企业
3. 确认当前用户有项目访问权限

### 5.3 数据转换失败

**问题**: "X个任务转换失败"

**解决方案**:
1. 检查飞书任务数据是否完整
2. 查看浏览器控制台的错误日志
3. 必填字段：任务名称、创建人、创建时间
4. 手动补充缺失数据后重新导入

### 5.4 导入后无法排期

**问题**: 导入的需求无法拖拽到迭代池

**解决方案**:
- 检查需求的技术进度状态
- 只有"已评估工作量"及以上状态的需求才能排期
- 在WSJF中手动更新技术进度

---

## 6. API参考

### 6.1 FeishuAPI类

```typescript
import { FeishuAPI } from './services/feishu';

const api = new FeishuAPI({
  pluginId: 'your_plugin_id',
  pluginSecret: 'your_plugin_secret',
});

// 获取所有项目
const projects = await api.getAllProjects();

// 获取工作项列表
const workItems = await api.getAllWorkItems('project_id');
```

### 6.2 数据转换工具

```typescript
import { transformWorkItems } from './utils/feishu/feishuDataTransform';
import { DEFAULT_FIELD_MAPPINGS } from './utils/feishu/feishuFieldMapper';

const result = transformWorkItems(workItems, DEFAULT_FIELD_MAPPINGS);

console.log('成功:', result.success.length);
console.log('失败:', result.failed.length);
```

### 6.3 Hooks

```typescript
// 认证管理
const {
  config,
  isConnected,
  saveConfig,
  testConnection,
} = useFeishuAuth({ showToast });

// 数据同步
const {
  projects,
  workItems,
  fetchProjects,
  fetchWorkItems,
} = useFeishuSync({ config, showToast });
```

---

## 7. 性能优化

### 7.1 大批量导入

对于超过100个任务的导入：
- 系统自动分页处理（100个/页）
- 显示实时进度条
- 自动添加延迟避免API限流

### 7.2 缓存策略

- 飞书access_token自动缓存（2小时有效期）
- 项目列表缓存（5分钟）
- 本地配置持久化（localStorage）

---

## 8. 安全建议

### 8.1 凭证管理

- ✅ Plugin Secret加密存储在localStorage
- ✅ 界面显示时自动脱敏（050E******564F）
- ⚠️ 不要在代码中硬编码凭证
- ⚠️ 定期轮换Secret

### 8.2 权限控制

- 仅申请必要的最小权限
- 定期审查应用权限范围
- 监控API调用日志

---

## 9. 更新日志

### v1.0.0 (2025-10-26)
- ✨ 初始版本发布
- ✅ 支持从飞书项目导入工作项
- ✅ 智能字段映射
- ✅ 批量数据转换
- ✅ 完整的错误处理
- ✅ 用户友好的步骤式界面

---

## 10. 反馈与支持

如遇到问题或有功能建议，请：
1. 查看 [技术方案文档](./technical-design.md)
2. 查看 [需求文档](./requirements.md)
3. 提交Issue到项目仓库

---

**维护者**: WSJF Team
**联系方式**: [项目仓库](https://github.com/your-repo)
