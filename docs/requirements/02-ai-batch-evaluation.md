# AI 批量评估需求文档

---

## 需求概述

### 功能名称
AI 智能批量评估功能

### 业务价值
- 大幅提升需求评估效率（预计提升80%）
- 利用AI理解需求文档，自动推荐评分
- 减少主观判断偏差，提供客观分析理由
- 支持批量处理，节省时间

### 目标用户
- 产品经理：快速评估多个需求的业务影响度
- 研发负责人：参考AI建议进行技术复杂度评估
- 团队Leader：快速了解需求价值和影响范围

### 优先级
🟡 **P1 - 重要功能**

---

## 功能描述

### 核心功能

AI 批量评估功能通过调用大语言模型（OpenAI GPT-4 或 DeepSeek），自动分析需求文档并提供：

1. **业务影响度评分建议** (1-10分)
2. **评分理由** (3-5条具体依据)
3. **影响的核心OKR指标** (最多3个)
4. **影响的过程指标** (最多3个)
5. **需求基本信息提取** (门店类型、影响地区、时间窗口等)

### 用户故事

**作为** 产品经理
**我想要** 上传需求文档让AI自动评估
**以便** 快速了解需求的业务价值和影响范围

**作为** 团队Leader
**我想要** 批量评估多个需求
**以便** 一次性完成多个需求的初步评估

**作为** 产品经理
**我想要** 看到AI的评分理由
**以便** 理解评分依据，决定是否采纳

### 使用场景

**场景1：单个需求AI评估**
1. 编辑需求，填写需求描述或上传文档链接
2. 点击"AI智能分析"按钮
3. 选择AI模型（OpenAI / DeepSeek）
4. AI分析文档/描述，返回评分建议和理由
5. 用户查看建议，选择采纳或自行调整
6. 保存需求

**场景2：批量需求评估**
1. 点击顶部"AI批量评估"按钮
2. 选择多个需求（支持全选/反选）
3. 选择AI模型
4. 点击"开始评估"
5. AI逐个分析，实时显示进度
6. 查看评估结果，每个需求展示：
   - AI建议的评分
   - 评分理由（可展开/收起）
   - 建议的影响指标
7. 一键采纳所有建议，或逐个确认
8. 批量保存

**场景3：AI建议对比**
1. 查看AI评估结果
2. 对比AI建议分数与用户当前评分
3. 如果差异较大，查看AI理由
4. 决定是否调整评分

---

## 详细需求

### 功能点列表

#### 1. AI模型选择

**支持的模型：**
- **OpenAI GPT-4**
  - 优点：理解能力强，分析准确
  - 适用场景：复杂需求、重要项目
  - API: `https://api.openai.com/v1/chat/completions`

- **DeepSeek**
  - 优点：性价比高，速度快
  - 适用场景：批量评估、常规需求
  - API: `https://api.deepseek.com/v1/chat/completions`

**UI交互：**
- 单选按钮组
- 默认值：OpenAI
- 显示模型特点说明

#### 2. 需求选择

**选择方式：**
- 复选框多选
- 全选/反选按钮
- 显示已选择数量："已选择 5 个需求"

**选择限制：**
- 最少1个
- 最多建议不超过20个（避免超时）
- 超过20个显示警告提示

#### 3. AI分析过程

**分析状态：**
```
准备中 → 分析中 (1/5) → 分析中 (2/5) → ... → 完成
```

**UI显示：**
- 进度条：显示整体进度
- 当前分析：显示正在分析的需求名称
- 预计时间：根据需求数量估算
- 实时结果：已完成的需求立即显示结果

**异常处理：**
- 某个需求分析失败：显示错误信息，继续分析下一个
- 网络超时：显示超时提示，允许重试
- API额度用完：友好提示，停止分析

#### 4. 评估结果展示

**需求卡片布局：**

```
┌────────────────────────────────────────────┐
│ 【需求名称】权重 85 ★★★★★ [新零售]     │
│ 提交人: 张三 • 部门: 产品 • 产品经理: 李四│
│ ┌──────────────────────────────────────────┐│
│ │ 业务影响度: 8/10  技术复杂度: 6/10     ││
│ │ 工作量: 15天  时间窗口: 三月窗口        ││
│ └──────────────────────────────────────────┘│
│                                              │
│ 🤖 AI评估建议                                │
│ ┌──────────────────────────────────────────┐│
│ │ 建议评分: 8分 (战略必需)                ││
│ │ 当前评分: 6分 (战略加速) ⚠️ 差异较大    ││
│ │                                          ││
│ │ 💡 评分理由：                            ││
│ │ • 影响2个核心OKR指标：GMV和门店数       ││
│ │ • 覆盖南亚地区所有直营店（约150家）     ││
│ │ • 预计提升GMV约5%                        ││
│ │ • 对比评分标准，符合8分档位特征         ││
│ │                                          ││
│ │ 📊 建议的影响指标：                      ││
│ │ 核心OKR: GMV(+5%), 门店新增数(+10家/月) ││
│ │ 过程指标: 转化率(+2%)                    ││
│ │                                          ││
│ │     [采纳建议]  [忽略]                   ││
│ └──────────────────────────────────────────┘│
│ [▼ 展开详情]                                │
└────────────────────────────────────────────┘
```

**详情展开内容：**
- 🎯 需求相关性
  - 业务团队
  - 门店类型（标签）
  - 门店数量
  - 影响地区（标签）
- 📊 影响的指标
  - 核心OKR指标（紫色卡片）
  - 过程指标（蓝色卡片）

#### 5. 采纳建议

**单个采纳：**
- 点击"采纳建议"按钮
- 自动填充：
  - 业务影响度 = AI建议分数
  - 影响指标 = AI建议的指标列表
  - 需求相关性 = AI提取的信息（门店类型、地区等）
- 立即保存到需求

**批量采纳：**
- 顶部"全部采纳"按钮
- 一次性应用所有AI建议
- 显示成功提示："已采纳 5 个需求的AI建议"

---

### 业务规则

#### AI提示词设计

**提示词模板：** `src/config/aiPrompts.ts`

**包含内容：**
1. 角色定义："你是一个专业的产品需求分析专家"
2. 评分标准：完整的1-10分制标准说明
3. 指标分类：核心OKR指标和过程指标定义
4. 分析流程：5步分析法
5. 输出格式：严格的JSON格式定义

**关键原则：**
- 严格对照评分标准，不主观臆断
- 理由必须具体，不能含糊其辞
- 指标推荐必须与需求强相关
- 信息不足时，建议保守评分（5-6分）

#### 评分理由验证

**有效理由的特征：**
- ✅ 具体：提到明确的数字、指标、范围
- ✅ 可验证：基于文档内容或常识
- ✅ 多维度：从多个角度分析
- ❌ 避免：模糊表述、主观猜测

**示例：**
```
✅ 好的理由：
- "影响南亚地区150家直营店，覆盖50%+用户"
- "预计提升GMV约5%，符合7分'显著影响'标准"
- "解决关键业务痛点：订单同步延迟从2天→实时"

❌ 不好的理由：
- "这个需求很重要"
- "应该会有一些影响"
- "可能会提升指标"
```

#### 差异提醒规则

**触发条件：**
- |AI建议分数 - 用户当前评分| >= 2

**显示方式：**
- ⚠️ 黄色警告标识
- 文案："AI建议与当前评分差异较大"
- 建议用户查看AI理由

---

### 数据模型

**AI分析请求：**

```typescript
interface AIEvaluationRequest {
  requirements: Requirement[];  // 待评估的需求列表
  modelType: 'openai' | 'deepseek';  // AI模型
  apiKey: string;  // API密钥
}
```

**AI分析响应：**

```typescript
interface AIAnalysisResult {
  // 建议的业务影响度评分
  suggestedScore: BusinessImpactScore;  // 1-10

  // AI分析理由
  reasoning: string[];  // 3-5条

  // 建议的核心OKR指标
  suggestedOKRMetrics: AffectedMetric[];  // 最多3个

  // 建议的过程指标
  suggestedProcessMetrics: AffectedMetric[];  // 最多3个

  // 提取的基本信息（可选）
  basicInfo?: {
    name?: string;  // 需求名称
    description?: string;  // 需求描述
    storeTypes?: string[];  // 门店类型
    regions?: string[];  // 影响地区
    timeCriticality?: string;  // 时间窗口
  };

  // 用户当前的评分（用于对比）
  currentScore?: BusinessImpactScore;

  // 分析的置信度（0-1）
  confidence?: number;
}
```

**影响的指标：**

```typescript
interface AffectedMetric {
  metricKey: string;  // 指标键（如 'gmv'）
  metricName: string;  // 指标名称（如 'GMV（交易额）'）
  estimatedImpact: string;  // 预估影响（如 '+5%'）
  category: 'okr' | 'process';  // 分类
}
```

---

## 交互设计

### 界面布局

**批量评估Modal：**

```
┌────────────────────── AI批量评估 ──────────────────────┐
│                                                          │
│ 选择AI模型:                                             │
│ ◉ OpenAI GPT-4 (推荐-复杂需求)  ◯ DeepSeek (高性价比)  │
│                                                          │
│ ────────────────────────────────────────────────────── │
│                                                          │
│ 选择需求: (已选择 3 个)  [全选] [反选]                 │
│                                                          │
│ ☑ 需求1: 新零售门店管理系统优化                        │
│ ☑ 需求2: 供应链库存同步功能                            │
│ ☑ 需求3: 经销商订单管理升级                            │
│ ☐ 需求4: ...                                            │
│                                                          │
│ ────────────────────────────────────────────────────── │
│                                                          │
│              [取消]  [开始评估 (3个需求)]               │
└──────────────────────────────────────────────────────────┘
```

**评估进度界面：**

```
┌────────────────────── AI分析中 ──────────────────────┐
│                                                        │
│ 正在分析: 需求2 - 供应链库存同步功能                 │
│ [████████░░░░░░░░░░] 40% (2/5)                        │
│ 预计剩余时间: 约30秒                                  │
│                                                        │
│ ────────────────────────────────────────────────────│
│                                                        │
│ 已完成:                                               │
│ ✅ 需求1 - 评分: 8分 (战略必需)                       │
│ ✅ 需求2 - 评分: 7分 (显著影响)                       │
│                                                        │
│ ────────────────────────────────────────────────────│
│                                                        │
│              [停止分析]                                │
└────────────────────────────────────────────────────────┘
```

**评估结果界面：**

```
┌────────────────────── 评估完成 ──────────────────────┐
│                                                        │
│ 已完成 5 个需求的AI评估 ✅                            │
│                                                        │
│ ────────────────────────────────────────────────────│
│                                                        │
│ [需求卡片1 - 包含AI建议和采纳按钮]                   │
│ [需求卡片2 - 包含AI建议和采纳按钮]                   │
│ [需求卡片3 - 包含AI建议和采纳按钮]                   │
│ ...                                                    │
│                                                        │
│ ────────────────────────────────────────────────────│
│                                                        │
│     [全部采纳]  [关闭]                                │
└────────────────────────────────────────────────────────┘
```

### 交互流程

**流程1：批量评估完整流程**

```
点击顶部"AI批量评估"
  ↓
显示批量评估Modal
  ↓
选择AI模型（OpenAI / DeepSeek）
  ↓
勾选需求（支持全选/反选）
  ↓
点击"开始评估"
  ↓
显示评估进度界面
  ├─ 进度条显示整体进度
  ├─ 实时显示当前分析的需求
  └─ 已完成的需求立即显示在列表中
  ↓
所有需求分析完成
  ↓
显示评估结果界面
  ├─ 每个需求显示AI建议和理由
  ├─ 差异较大的需求显示警告
  └─ 提供采纳/忽略选项
  ↓
【选择1】全部采纳 → 批量保存 → 关闭Modal → 需求列表更新
【选择2】逐个采纳 → 单个保存 → 继续查看其他
【选择3】关闭 → 不保存任何建议
```

---

## 技术实现

### 关键代码位置

**文件：** `src/components/BatchEvaluationModal.tsx`

**核心组件：**

```typescript
export const BatchEvaluationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  requirements,
  onSaveRequirements
}) => {
  // 状态管理
  const [selectedModel, setSelectedModel] = useState<'openai' | 'deepseek'>('openai');
  const [selectedRequirements, setSelectedRequirements] = useState<string[]>([]);
  const [evaluationResults, setEvaluationResults] = useState<Map<string, AIAnalysisResult>>(new Map());
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // AI评估函数
  const handleEvaluate = async () => {
    setIsEvaluating(true);
    setProgress({ current: 0, total: selectedRequirements.length });

    for (let i = 0; i < selectedRequirements.length; i++) {
      const reqId = selectedRequirements[i];
      const req = requirements.find(r => r.id === reqId);

      try {
        const result = await callAI(req, selectedModel);
        setEvaluationResults(prev => new Map(prev).set(reqId, result));
      } catch (error) {
        // 错误处理
      }

      setProgress({ current: i + 1, total: selectedRequirements.length });
    }

    setIsEvaluating(false);
  };

  // 采纳建议
  const handleAdopt = (reqId: string) => {
    const result = evaluationResults.get(reqId);
    const req = requirements.find(r => r.id === reqId);

    const updated: Requirement = {
      ...req!,
      businessImpactScore: result.suggestedScore,
      affectedMetrics: [
        ...result.suggestedOKRMetrics,
        ...result.suggestedProcessMetrics
      ],
      impactScope: {
        ...req!.impactScope,
        storeTypes: result.basicInfo?.storeTypes || [],
        regions: result.basicInfo?.regions || []
      }
    };

    onSaveRequirements([updated]);
  };

  // ...
};
```

**AI调用函数：**

```typescript
const callAI = async (
  requirement: Requirement,
  model: 'openai' | 'deepseek'
): Promise<AIAnalysisResult> => {
  const apiKey = model === 'openai' ? OPENAI_API_KEY : DEEPSEEK_API_KEY;
  const apiUrl = model === 'openai'
    ? 'https://api.openai.com/v1/chat/completions'
    : 'https://api.deepseek.com/v1/chat/completions';

  const prompt = formatAIPrompt(
    requirement.documents?.[0]?.url || '',
    requirement.description || '',
    requirement.name
  );

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model === 'openai' ? 'gpt-4-turbo-preview' : 'deepseek-chat',
      messages: [
        { role: 'system', content: AI_SYSTEM_MESSAGE },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 2000
    })
  });

  const data = await response.json();
  const content = data.choices[0].message.content;

  // 解析JSON
  const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
  const jsonStr = jsonMatch ? jsonMatch[1] : content;
  const result: AIAnalysisResult = JSON.parse(jsonStr);

  return result;
};
```

**配置文件：**

文件：`src/config/aiPrompts.ts`

---

## 验收标准

### 功能验收

- [ ] AI模型选择：可选择 OpenAI 或 DeepSeek
- [ ] 需求选择：可多选，支持全选/反选
- [ ] 评估进度：显示进度条、当前分析需求、预计时间
- [ ] 评估结果：显示建议评分、理由、影响指标
- [ ] 差异提醒：评分差异>=2时显示警告
- [ ] 采纳建议：单个采纳和全部采纳都正常工作
- [ ] 异常处理：API失败时显示友好提示

### AI分析质量

**测试用例1：典型需求**
```
输入：
需求名称: 新零售门店管理系统优化
需求描述: 优化门店库存管理流程，实现实时库存同步，
          覆盖南亚地区150家直营店

预期输出：
- 建议评分: 7-8分（显著影响/战略必需）
- 理由包含: 具体门店数量、覆盖范围、业务价值
- 建议指标: 库存周转率、缺货率等
```

**测试用例2：信息不足**
```
输入：
需求名称: 页面UI优化
需求描述: 优化首页样式

预期输出：
- 建议评分: 2-3分（小幅改进/常规功能）
- 理由说明: 信息不足，建议保守评分
```

### 性能要求

- 单个需求AI分析: < 10秒
- 10个需求批量评估: < 2分钟
- API超时时间: 30秒

### 用户体验

- 评估过程中可停止
- 已完成的需求立即显示结果
- 错误提示友好、可理解
- 进度显示准确、实时更新

---

## 变更历史

### v1.3.0 (2025-01-19)
- ✅ 支持界面选择AI模型（OpenAI / DeepSeek）
- ✅ AI提示词和复杂度标准配置文件化
- ✅ 优化评估结果展示（三行结构）

### v1.2.1 (2025-01-XX)
- ✅ AI批量评估功能上线
- ✅ 支持OpenAI GPT-4
- ✅ 实时显示评估进度

---

**维护者**: 产品团队 & AI团队
**最后更新**: 2025-01-19
**版本**: v1.3
