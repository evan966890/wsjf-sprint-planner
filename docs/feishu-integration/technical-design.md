# 飞书项目管理对接技术方案

**版本**: v1.0
**日期**: 2025-10-26
**状态**: 设计中

---

## 1. 技术架构

### 1.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                      WSJF Sprint Planner                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────┐      ┌──────────────────┐              │
│  │  UI Components  │─────▶│  Feishu Hooks    │              │
│  │  - ProjectList  │      │  - useFeishu     │              │
│  │  - TaskPreview  │      │  - useFeishuAuth │              │
│  │  - FieldMapper  │      │  - useFeishuSync │              │
│  └─────────────────┘      └──────────────────┘              │
│         │                         │                          │
│         │                         ▼                          │
│         │                ┌──────────────────┐               │
│         │                │  Feishu Service  │               │
│         │                │  - API Wrapper   │               │
│         │                │  - Auth Manager  │               │
│         │                └──────────────────┘               │
│         │                         │                          │
│         │                         ▼                          │
│         │                ┌──────────────────┐               │
│         └───────────────▶│  Data Transform  │               │
│                          │  - Field Mapper  │               │
│                          │  - Data Validator│               │
│                          └──────────────────┘               │
│                                   │                          │
│                                   ▼                          │
│                          ┌──────────────────┐               │
│                          │  Zustand Store   │               │
│                          │  - requirements  │               │
│                          │  - feishuConfig  │               │
│                          └──────────────────┘               │
└─────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │  Feishu Open API     │
                        │  - Project API       │
                        │  - Work Item API     │
                        │  - Auth API          │
                        └──────────────────────┘
```

### 1.2 技术栈

- **前端框架**: React 18 + TypeScript
- **状态管理**: Zustand
- **HTTP客户端**: fetch API
- **UI组件**: 现有组件库 + Lucide React图标
- **样式**: Tailwind CSS
- **飞书SDK**: 使用官方HTTP API（无需额外SDK）

---

## 2. 模块设计

### 2.1 目录结构

```
src/
├── services/
│   └── feishu/
│       ├── feishuApi.ts           # 飞书API封装
│       ├── feishuAuth.ts          # 飞书认证管理
│       ├── feishuTypes.ts         # 飞书数据类型定义
│       └── index.ts               # 导出模块
├── hooks/
│   ├── useFeishu.ts               # 飞书集成主Hook (<300行)
│   ├── useFeishuAuth.ts           # 认证管理Hook (<200行)
│   └── useFeishuSync.ts           # 数据同步Hook (<300行)
├── components/
│   └── feishu/
│       ├── FeishuImportModal.tsx  # 飞书导入主Modal (<400行)
│       ├── ProjectSelector.tsx    # 项目选择器 (<200行)
│       ├── TaskPreviewTable.tsx   # 任务预览表 (<300行)
│       ├── FieldMappingPanel.tsx  # 字段映射面板 (<250行)
│       └── FeishuAuthConfig.tsx   # 认证配置组件 (<200行)
├── utils/
│   └── feishu/
│       ├── feishuDataTransform.ts # 数据转换工具 (<300行)
│       ├── feishuFieldMapper.ts   # 字段映射工具 (<200行)
│       └── feishuValidator.ts     # 数据验证工具 (<200行)
└── config/
    └── feishuConfig.ts            # 飞书配置常量 (<100行)
```

**文件大小控制**:
- ✅ 每个文件严格控制在500行以内
- ✅ 推荐单文件200-300行
- ✅ 组件超过400行必须拆分

---

## 3. 核心模块详细设计

### 3.1 飞书API服务层 (feishuApi.ts)

**职责**:
- 封装飞书开放平台API调用
- 处理认证和授权
- 错误处理和重试

**接口设计**:

```typescript
/**
 * 飞书API配置
 */
export interface FeishuConfig {
  pluginId: string;
  pluginSecret: string;
  baseUrl?: string; // 默认: https://open.feishu.cn/open-apis
}

/**
 * 飞书项目空间
 */
export interface FeishuProjectSpace {
  id: string;
  name: string;
  description?: string;
}

/**
 * 飞书项目
 */
export interface FeishuProject {
  id: string;
  name: string;
  description?: string;
  status: string;
  spaceId: string;
  createdAt: number;
  updatedAt: number;
  memberCount: number;
  taskCount: number;
}

/**
 * 飞书工作项（任务）
 */
export interface FeishuWorkItem {
  id: string;
  name: string;
  description?: string;
  status: string;
  priority?: string;
  creatorId: string;
  creatorName?: string;
  assigneeId?: string;
  assigneeName?: string;
  createdAt: number;
  updatedAt: number;
  deadline?: number;
  estimatedHours?: number;
  tags?: string[];
  customFields?: Record<string, any>;
}

/**
 * 飞书API类
 */
export class FeishuAPI {
  private config: FeishuConfig;
  private accessToken: string | null = null;
  private tokenExpireTime: number = 0;

  constructor(config: FeishuConfig);

  /**
   * 获取访问令牌（tenant_access_token）
   */
  async getAccessToken(): Promise<string>;

  /**
   * 刷新访问令牌
   */
  async refreshAccessToken(): Promise<string>;

  /**
   * 获取项目空间列表
   */
  async getProjectSpaces(): Promise<FeishuProjectSpace[]>;

  /**
   * 获取项目列表
   */
  async getProjects(spaceId: string): Promise<FeishuProject[]>;

  /**
   * 获取工作项列表
   */
  async getWorkItems(projectId: string, pageSize?: number, pageToken?: string): Promise<{
    items: FeishuWorkItem[];
    hasMore: boolean;
    pageToken?: string;
  }>;

  /**
   * 获取工作项详情
   */
  async getWorkItemDetail(workItemId: string): Promise<FeishuWorkItem>;

  /**
   * 通用API调用方法
   */
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T>;
}
```

**实现要点**:

1. **Token管理**:
   ```typescript
   async getAccessToken(): Promise<string> {
     // 检查token是否过期
     if (this.accessToken && Date.now() < this.tokenExpireTime) {
       return this.accessToken;
     }

     // 获取新token
     return await this.refreshAccessToken();
   }
   ```

2. **错误处理**:
   ```typescript
   private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
     try {
       const token = await this.getAccessToken();
       const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
         ...options,
         headers: {
           'Authorization': `Bearer ${token}`,
           'Content-Type': 'application/json',
           ...options?.headers,
         },
       });

       if (!response.ok) {
         throw new FeishuAPIError(response.status, await response.text());
       }

       const data = await response.json();

       if (data.code !== 0) {
         throw new FeishuAPIError(data.code, data.msg);
       }

       return data.data;
     } catch (error) {
       console.error('[FeishuAPI] Request failed:', error);
       throw error;
     }
   }
   ```

3. **分页处理**:
   ```typescript
   async getAllWorkItems(projectId: string): Promise<FeishuWorkItem[]> {
     const allItems: FeishuWorkItem[] = [];
     let hasMore = true;
     let pageToken: string | undefined;

     while (hasMore) {
       const result = await this.getWorkItems(projectId, 100, pageToken);
       allItems.push(...result.items);
       hasMore = result.hasMore;
       pageToken = result.pageToken;
     }

     return allItems;
   }
   ```

---

### 3.2 数据转换层 (feishuDataTransform.ts)

**职责**:
- 将飞书工作项转换为WSJF Requirement
- 字段映射和数据验证
- 单位转换和格式化

**接口设计**:

```typescript
/**
 * 字段映射配置
 */
export interface FieldMapping {
  feishuField: string;  // 飞书字段名
  wsjfField: keyof Requirement;  // WSJF字段名
  transform?: (value: any) => any;  // 转换函数
  required?: boolean;  // 是否必填
  defaultValue?: any;  // 默认值
}

/**
 * 映射模板
 */
export interface MappingTemplate {
  id: string;
  name: string;
  description: string;
  mappings: FieldMapping[];
  createdAt: string;
  updatedAt: string;
}

/**
 * 预定义的字段映射规则
 */
export const DEFAULT_FIELD_MAPPINGS: FieldMapping[] = [
  {
    feishuField: 'name',
    wsjfField: 'name',
    required: true,
  },
  {
    feishuField: 'description',
    wsjfField: 'description',
  },
  {
    feishuField: 'creatorName',
    wsjfField: 'submitterName',
    required: true,
  },
  {
    feishuField: 'createdAt',
    wsjfField: 'submitDate',
    transform: (timestamp: number) => new Date(timestamp).toISOString().split('T')[0],
    required: true,
  },
  {
    feishuField: 'deadline',
    wsjfField: 'deadlineDate',
    transform: (timestamp: number) => timestamp ? new Date(timestamp).toISOString().split('T')[0] : undefined,
  },
  {
    feishuField: 'estimatedHours',
    wsjfField: 'effortDays',
    transform: (hours: number) => hours ? Math.ceil(hours / 8) : 1,  // 8小时=1天
    defaultValue: 1,
  },
  {
    feishuField: 'assigneeName',
    wsjfField: 'productManager',
  },
  // 状态映射需要自定义逻辑
  {
    feishuField: 'status',
    wsjfField: 'techProgress',
    transform: (status: string) => mapFeishuStatusToTechProgress(status),
  },
];

/**
 * 飞书状态 → WSJF技术进度映射
 */
function mapFeishuStatusToTechProgress(feishuStatus: string): TechProgressStatus {
  const statusMap: Record<string, TechProgressStatus> = {
    '未开始': '待评估',
    '进行中': '已评估工作量',
    '已完成': '已完成技术方案',
    // ... 更多映射规则
  };

  return statusMap[feishuStatus] || '待评估';
}

/**
 * 转换单个工作项为WSJF需求
 */
export function transformWorkItemToRequirement(
  workItem: FeishuWorkItem,
  mappings: FieldMapping[]
): Requirement {
  const requirement: Partial<Requirement> = {
    id: `feishu_${workItem.id}_${Date.now()}`,
    submitter: '业务',  // 默认值，可配置
    hardDeadline: !!workItem.deadline,
    type: '功能需求',  // 默认值，可配置
    productProgress: '待评估',
    techProgress: '待评估',
    isRMS: false,
  };

  // 应用字段映射
  for (const mapping of mappings) {
    const feishuValue = getNestedValue(workItem, mapping.feishuField);

    if (feishuValue !== undefined && feishuValue !== null) {
      const transformedValue = mapping.transform
        ? mapping.transform(feishuValue)
        : feishuValue;

      requirement[mapping.wsjfField] = transformedValue;
    } else if (mapping.defaultValue !== undefined) {
      requirement[mapping.wsjfField] = mapping.defaultValue;
    }
  }

  // 验证必填字段
  validateRequirement(requirement as Requirement);

  return requirement as Requirement;
}

/**
 * 批量转换工作项
 */
export function transformWorkItems(
  workItems: FeishuWorkItem[],
  mappings: FieldMapping[]
): {
  success: Requirement[];
  failed: Array<{ workItem: FeishuWorkItem; error: string }>;
} {
  const success: Requirement[] = [];
  const failed: Array<{ workItem: FeishuWorkItem; error: string }> = [];

  for (const workItem of workItems) {
    try {
      const requirement = transformWorkItemToRequirement(workItem, mappings);
      success.push(requirement);
    } catch (error) {
      failed.push({
        workItem,
        error: error instanceof Error ? error.message : '未知错误',
      });
    }
  }

  return { success, failed };
}

/**
 * 获取嵌套对象的值
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * 验证需求必填字段
 */
function validateRequirement(requirement: Requirement): void {
  const requiredFields: Array<keyof Requirement> = [
    'name',
    'submitterName',
    'submitDate',
  ];

  for (const field of requiredFields) {
    if (!requirement[field]) {
      throw new Error(`必填字段缺失: ${field}`);
    }
  }
}
```

---

### 3.3 自定义Hooks

#### 3.3.1 useFeishuAuth.ts

**职责**:
- 管理飞书认证配置
- 测试连接
- Token管理

```typescript
export interface UseFeishuAuthOptions {
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export function useFeishuAuth({ showToast }: UseFeishuAuthOptions) {
  const [config, setConfig] = useState<FeishuConfig | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * 保存飞书配置
   */
  const saveConfig = useCallback((pluginId: string, pluginSecret: string) => {
    const newConfig: FeishuConfig = {
      pluginId,
      pluginSecret,
    };

    setConfig(newConfig);
    localStorage.setItem('feishu_config', JSON.stringify(newConfig));
    showToast('飞书配置已保存', 'success');
  }, [showToast]);

  /**
   * 加载飞书配置
   */
  const loadConfig = useCallback(() => {
    const saved = localStorage.getItem('feishu_config');
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load feishu config:', error);
      }
    }
  }, []);

  /**
   * 测试连接
   */
  const testConnection = useCallback(async () => {
    if (!config) {
      showToast('请先配置飞书认证信息', 'error');
      return false;
    }

    setIsLoading(true);
    try {
      const api = new FeishuAPI(config);
      await api.getAccessToken();
      setIsConnected(true);
      showToast('连接成功', 'success');
      return true;
    } catch (error) {
      setIsConnected(false);
      showToast(`连接失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [config, showToast]);

  /**
   * 清除配置
   */
  const clearConfig = useCallback(() => {
    setConfig(null);
    setIsConnected(false);
    localStorage.removeItem('feishu_config');
    showToast('飞书配置已清除', 'info');
  }, [showToast]);

  // 组件加载时恢复配置
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  return {
    config,
    isConnected,
    isLoading,
    saveConfig,
    testConnection,
    clearConfig,
  };
}
```

#### 3.3.2 useFeishuSync.ts

**职责**:
- 同步飞书项目和任务数据
- 管理同步状态
- 错误处理

```typescript
export interface UseFeishuSyncOptions {
  config: FeishuConfig | null;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export function useFeishuSync({ config, showToast }: UseFeishuSyncOptions) {
  const [projects, setProjects] = useState<FeishuProject[]>([]);
  const [workItems, setWorkItems] = useState<FeishuWorkItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const api = useMemo(() => {
    return config ? new FeishuAPI(config) : null;
  }, [config]);

  /**
   * 获取项目列表
   */
  const fetchProjects = useCallback(async (spaceId: string) => {
    if (!api) {
      showToast('请先配置飞书认证', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const projectList = await api.getProjects(spaceId);
      setProjects(projectList);
      showToast(`成功获取 ${projectList.length} 个项目`, 'success');
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      showToast('获取项目列表失败', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [api, showToast]);

  /**
   * 获取工作项列表
   */
  const fetchWorkItems = useCallback(async (projectId: string) => {
    if (!api) {
      showToast('请先配置飞书认证', 'error');
      return;
    }

    setIsLoading(true);
    setProgress(0);

    try {
      const items: FeishuWorkItem[] = [];
      let hasMore = true;
      let pageToken: string | undefined;
      let fetchedCount = 0;

      while (hasMore) {
        const result = await api.getWorkItems(projectId, 100, pageToken);
        items.push(...result.items);
        fetchedCount += result.items.length;
        hasMore = result.hasMore;
        pageToken = result.pageToken;

        // 更新进度
        setProgress(fetchedCount);
      }

      setWorkItems(items);
      showToast(`成功获取 ${items.length} 个任务`, 'success');
    } catch (error) {
      console.error('Failed to fetch work items:', error);
      showToast('获取任务列表失败', 'error');
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  }, [api, showToast]);

  /**
   * 清除数据
   */
  const clearData = useCallback(() => {
    setProjects([]);
    setWorkItems([]);
  }, []);

  return {
    projects,
    workItems,
    isLoading,
    progress,
    fetchProjects,
    fetchWorkItems,
    clearData,
  };
}
```

---

### 3.4 UI组件

#### 3.4.1 FeishuImportModal.tsx

**职责**:
- 飞书导入流程主界面
- 步骤管理（项目选择 → 任务预览 → 字段映射 → 确认导入）

**界面设计**:

```typescript
export interface FeishuImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeishuImportModal({ isOpen, onClose }: FeishuImportModalProps) {
  const [step, setStep] = useState<'project' | 'preview' | 'mapping' | 'confirm'>('project');
  const [selectedProject, setSelectedProject] = useState<FeishuProject | null>(null);
  const [selectedWorkItems, setSelectedWorkItems] = useState<string[]>([]);
  const [mappingTemplate, setMappingTemplate] = useState<FieldMapping[]>(DEFAULT_FIELD_MAPPINGS);

  return (
    <div className="modal">
      {/* 步骤指示器 */}
      <StepIndicator currentStep={step} />

      {/* 步骤内容 */}
      {step === 'project' && (
        <ProjectSelector
          onSelect={(project) => {
            setSelectedProject(project);
            setStep('preview');
          }}
        />
      )}

      {step === 'preview' && selectedProject && (
        <TaskPreviewTable
          projectId={selectedProject.id}
          onConfirm={(selectedIds) => {
            setSelectedWorkItems(selectedIds);
            setStep('mapping');
          }}
          onBack={() => setStep('project')}
        />
      )}

      {step === 'mapping' && (
        <FieldMappingPanel
          mappings={mappingTemplate}
          onChange={setMappingTemplate}
          onConfirm={() => setStep('confirm')}
          onBack={() => setStep('preview')}
        />
      )}

      {step === 'confirm' && (
        <ImportConfirmPanel
          workItemIds={selectedWorkItems}
          mappings={mappingTemplate}
          onConfirm={handleImport}
          onBack={() => setStep('mapping')}
        />
      )}
    </div>
  );
}
```

---

## 4. 数据流设计

### 4.1 导入流程

```
┌──────────────┐
│ 用户点击      │
│"从飞书导入"   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 检查飞书配置  │
│ 是否存在      │
└──────┬───────┘
       │
       ├─ No ──▶ 提示配置飞书认证
       │
       ▼ Yes
┌──────────────┐
│ 获取项目列表  │
│ FeishuAPI    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 展示项目列表  │
│ 用户选择项目  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 获取任务列表  │
│ FeishuAPI    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 展示任务预览  │
│ 用户勾选任务  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 字段映射配置  │
│ 用户调整映射  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 数据转换      │
│ Transform    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 数据验证      │
│ Validate     │
└──────┬───────┘
       │
       ├─ Failed ──▶ 显示错误，允许修正
       │
       ▼ Success
┌──────────────┐
│ 导入确认      │
│ 用户最终确认  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 写入Store     │
│ requirements │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 计算WSJF分数 │
│ calculateScores│
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 导入完成      │
│ 显示成功提示  │
└──────────────┘
```

---

## 5. 错误处理

### 5.1 错误分类

| 错误类型 | 错误码 | 处理方式 |
|---------|-------|---------|
| 认证失败 | 401 | 提示用户重新配置认证信息 |
| 权限不足 | 403 | 提示用户检查飞书权限 |
| 资源不存在 | 404 | 提示资源不存在，刷新列表 |
| 请求限流 | 429 | 自动重试，显示等待提示 |
| 服务器错误 | 500 | 提示稍后重试 |
| 网络错误 | - | 提示检查网络连接 |
| 数据验证失败 | - | 显示具体字段错误 |

### 5.2 错误处理实现

```typescript
export class FeishuAPIError extends Error {
  constructor(
    public code: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'FeishuAPIError';
  }
}

export function handleFeishuError(error: unknown, showToast: (msg: string, type: string) => void) {
  if (error instanceof FeishuAPIError) {
    switch (error.code) {
      case 401:
        showToast('飞书认证失败，请重新配置认证信息', 'error');
        break;
      case 403:
        showToast('权限不足，请检查飞书应用权限配置', 'error');
        break;
      case 404:
        showToast('资源不存在，请刷新后重试', 'error');
        break;
      case 429:
        showToast('请求过于频繁，请稍后重试', 'error');
        break;
      case 500:
        showToast('飞书服务异常，请稍后重试', 'error');
        break;
      default:
        showToast(`飞书API错误: ${error.message}`, 'error');
    }
  } else if (error instanceof TypeError) {
    showToast('网络连接失败，请检查网络', 'error');
  } else {
    showToast('未知错误，请查看控制台', 'error');
    console.error(error);
  }
}
```

---

## 6. 性能优化

### 6.1 分页加载

```typescript
// 使用虚拟滚动优化大列表渲染
import { useVirtualizer } from '@tanstack/react-virtual';

function TaskPreviewTable({ tasks }: { tasks: FeishuWorkItem[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const task = tasks[virtualRow.index];
          return (
            <div key={task.id} style={{ height: virtualRow.size }}>
              {/* Task Row */}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### 6.2 请求缓存

```typescript
// 使用LRU缓存减少重复API调用
const projectCache = new Map<string, { data: FeishuProject[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5分钟

async function getCachedProjects(spaceId: string, api: FeishuAPI): Promise<FeishuProject[]> {
  const cached = projectCache.get(spaceId);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const data = await api.getProjects(spaceId);
  projectCache.set(spaceId, { data, timestamp: Date.now() });

  return data;
}
```

### 6.3 批量操作优化

```typescript
// 使用批处理减少状态更新次数
function useBatchUpdate<T>(delay: number = 100) {
  const [items, setItems] = useState<T[]>([]);
  const batchRef = useRef<T[]>([]);
  const timerRef = useRef<NodeJS.Timeout>();

  const addItem = useCallback((item: T) => {
    batchRef.current.push(item);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setItems(prev => [...prev, ...batchRef.current]);
      batchRef.current = [];
    }, delay);
  }, [delay]);

  return { items, addItem };
}
```

---

## 7. 安全设计

### 7.1 认证信息加密

```typescript
// 使用Web Crypto API加密存储
async function encryptSecret(secret: string, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(secret);
  const passwordKey = encoder.encode(password);

  const key = await crypto.subtle.importKey(
    'raw',
    passwordKey,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('wsjf-feishu-salt'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    key,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    derivedKey,
    data
  );

  // 返回 base64编码的 iv + encrypted
  return btoa(
    String.fromCharCode(...iv) +
    String.fromCharCode(...new Uint8Array(encrypted))
  );
}
```

### 7.2 敏感信息脱敏

```typescript
function maskSecret(secret: string): string {
  if (secret.length <= 8) {
    return '****';
  }

  const start = secret.slice(0, 4);
  const end = secret.slice(-4);

  return `${start}${'*'.repeat(secret.length - 8)}${end}`;
}

// 示例: 050E0E049ACB87339CB9D11E5641564F
// 显示: 050E******564F
```

---

## 8. 测试方案

### 8.1 单元测试

```typescript
// feishuApi.test.ts
describe('FeishuAPI', () => {
  it('should get access token', async () => {
    const api = new FeishuAPI({
      pluginId: 'test_id',
      pluginSecret: 'test_secret',
    });

    const token = await api.getAccessToken();
    expect(token).toBeDefined();
  });

  it('should handle auth error', async () => {
    const api = new FeishuAPI({
      pluginId: 'invalid',
      pluginSecret: 'invalid',
    });

    await expect(api.getAccessToken()).rejects.toThrow(FeishuAPIError);
  });
});
```

### 8.2 集成测试

```typescript
// feishuIntegration.test.tsx
describe('Feishu Integration', () => {
  it('should import tasks from Feishu', async () => {
    const { result } = renderHook(() => useFeishuSync({ config, showToast }));

    await act(async () => {
      await result.current.fetchWorkItems('project_123');
    });

    expect(result.current.workItems.length).toBeGreaterThan(0);
  });
});
```

### 8.3 E2E测试

使用Playwright进行端到端测试：

```typescript
test('complete feishu import flow', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // 1. 打开飞书导入
  await page.click('button:has-text("从飞书导入")');

  // 2. 选择项目
  await page.click('[data-testid="project-item-0"]');

  // 3. 选择任务
  await page.check('[data-testid="task-checkbox-0"]');
  await page.click('button:has-text("下一步")');

  // 4. 确认映射
  await page.click('button:has-text("确认导入")');

  // 5. 验证导入成功
  await expect(page.locator('.toast')).toContainText('导入成功');
});
```

---

## 9. 部署方案

### 9.1 环境变量配置

```bash
# .env.local
VITE_FEISHU_BASE_URL=https://open.feishu.cn/open-apis
```

### 9.2 构建配置

```typescript
// vite.config.ts
export default defineConfig({
  define: {
    'import.meta.env.VITE_FEISHU_BASE_URL': JSON.stringify(
      process.env.VITE_FEISHU_BASE_URL || 'https://open.feishu.cn/open-apis'
    ),
  },
});
```

---

## 10. 监控与日志

### 10.1 操作日志

```typescript
interface FeishuSyncLog {
  id: string;
  timestamp: string;
  operation: 'import' | 'sync' | 'config';
  projectId?: string;
  projectName?: string;
  taskCount: number;
  successCount: number;
  failedCount: number;
  errors?: string[];
  operator: string;
}

// 记录同步日志
function logFeishuSync(log: Omit<FeishuSyncLog, 'id' | 'timestamp'>): void {
  const fullLog: FeishuSyncLog = {
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...log,
  };

  // 保存到localStorage或发送到后端
  const logs = JSON.parse(localStorage.getItem('feishu_sync_logs') || '[]');
  logs.unshift(fullLog);

  // 只保留最近100条
  if (logs.length > 100) {
    logs.splice(100);
  }

  localStorage.setItem('feishu_sync_logs', JSON.stringify(logs));
}
```

---

## 11. 开发计划

### 11.1 迭代计划

**Sprint 1 (2天)**: 基础架构
- ✅ 飞书API封装
- ✅ 认证管理
- ✅ 基础数据类型定义

**Sprint 2 (2天)**: 数据转换
- ✅ 字段映射逻辑
- ✅ 数据验证
- ✅ 单元测试

**Sprint 3 (3天)**: UI组件
- ✅ 项目选择器
- ✅ 任务预览表
- ✅ 字段映射面板
- ✅ 导入确认界面

**Sprint 4 (2天)**: 集成测试
- ✅ 端到端测试
- ✅ Bug修复
- ✅ 性能优化

**Sprint 5 (1天)**: 文档和发布
- ✅ 用户文档
- ✅ API文档
- ✅ 发布上线

---

## 12. 附录

### 12.1 飞书API文档参考

- [飞书开放平台](https://open.feishu.cn)
- [应用认证](https://open.feishu.cn/document/ukTMukTMukTM/ukDNz4SO0MjL5QzM)
- [项目API](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/project-v1/project)
- [工作项API](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/project-v1/work_item)

### 12.2 相关技术文档

- [WSJF架构文档](../architecture-guide.md)
- [React TypeScript最佳实践](https://react-typescript-cheatsheet.netlify.app/)
- [Zustand文档](https://zustand-demo.pmnd.rs/)

---

**文档维护**:
- 创建人: Claude
- 创建日期: 2025-10-26
- 最后更新: 2025-10-26
- 审核状态: 待审核
