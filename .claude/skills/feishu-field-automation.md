# Feishu Project Field Automation Skill

## 概述
本skill提供通过Chrome DevTools MCP（Model Context Protocol）工具自动化创建飞书项目管理系统字段的能力。无需手动获取Token或编写复杂脚本，完全通过浏览器自动化实现。

## 触发条件
当用户提到以下关键词时自动加载此skill：
- "飞书项目字段"
- "飞书自动配置"
- "Feishu field"
- "项目管理字段创建"
- "质量指标配置"

## 前置要求

### 1. Chrome DevTools MCP工具
确保Chrome DevTools MCP工具已启用。可以通过以下命令验证：
```
mcp__chrome-devtools__list_pages
```

### 2. 登录飞书项目
用户需要先在浏览器中登录飞书项目管理系统：
```
https://project.f.mioffice.cn/{project_key}/setting/workObject/story?menuTab=fieldManagement
```
其中 `{project_key}` 通常为 `iretail` 或其他项目标识。

## 核心流程

### Step 1: 打开字段管理页面
```javascript
// 使用Chrome DevTools导航到字段管理页面
await mcp__chrome-devtools__navigate_page({
  type: "url",
  url: "https://project.f.mioffice.cn/iretail/setting/workObject/story?menuTab=fieldManagement"
});
```

### Step 2: 获取页面快照
```javascript
// 获取当前页面的快照，识别UI元素
await mcp__chrome-devtools__take_snapshot();
```

### Step 3: 点击新建字段按钮
```javascript
// 查找并点击"新建字段"按钮
// 通常按钮的uid类似: uid=XX_13 button "新建字段"
await mcp__chrome-devtools__click({
  uid: "找到的新建字段按钮uid"
});
```

### Step 4: 填写字段信息

#### 4.1 填写字段名称
```javascript
// 找到字段名称输入框并填写
// 通常uid类似: textbox "字段名称*" required
await mcp__chrome-devtools__fill({
  uid: "字段名称输入框uid",
  value: "字段名称"
});
```

#### 4.2 选择字段类型
```javascript
// 点击字段类型下拉框
await mcp__chrome-devtools__click({
  uid: "字段类型下拉框uid"
});

// 选择"数字"类型
await mcp__chrome-devtools__click({
  uid: "数字选项uid"
});
```

#### 4.3 填写对接标识（alias）
```javascript
// 找到对接标识输入框并填写
// 通常uid类似: textbox "对接标识 info_circle"
await mcp__chrome-devtools__fill({
  uid: "对接标识输入框uid",
  value: "field_alias"
});
```

#### 4.4 填写字段描述
```javascript
// 找到字段描述输入框并填写
// 通常uid类似: textbox "字段描述 info_circle"
await mcp__chrome-devtools__fill({
  uid: "字段描述输入框uid",
  value: "字段的详细描述"
});
```

### Step 5: 确认创建
```javascript
// 点击确认按钮创建字段
// 通常uid类似: button "confirm"
await mcp__chrome-devtools__click({
  uid: "确认按钮uid"
});

// 等待字段创建完成
await mcp__chrome-devtools__wait_for({
  text: "新建的字段名称",
  timeout: 5000
});
```

## 实际案例：创建5个质量指标字段

### 字段定义
```javascript
const qualityFields = [
  {
    name: 'Lead Time（交付周期）',
    alias: 'quality_lead_time',
    description: '从需求创建到上线的平均时间（天）',
    type: 'number'
  },
  {
    name: '评审一次通过率',
    alias: 'quality_review_pass_rate',
    description: '评审一次通过的比例（%）',
    type: 'number'
  },
  {
    name: '并行事项吞吐量',
    alias: 'quality_throughput',
    description: '团队并行处理的工作项数量',
    type: 'number'
  },
  {
    name: 'PRD返工率',
    alias: 'quality_prd_rework_rate',
    description: '需求文档返工的比例（%）',
    type: 'number'
  },
  {
    name: '试点到GA迭代周期',
    alias: 'quality_pilot_to_ga',
    description: '从试点到全面推广的迭代次数',
    type: 'number'
  }
];
```

### 批量创建流程
```javascript
// 为每个字段执行创建流程
for (const field of qualityFields) {
  // 1. 点击新建字段
  await clickNewFieldButton();

  // 2. 填写字段信息
  await fillFieldName(field.name);
  await selectFieldType(field.type);
  await fillFieldAlias(field.alias);
  await fillFieldDescription(field.description);

  // 3. 确认创建
  await confirmFieldCreation();

  // 4. 等待创建完成
  await waitForFieldCreated(field.name);
}
```

## 常见UI元素定位

### 页面结构特征
```
RootWebArea "飞书项目"
  └── main
      ├── button "新建字段"
      └── 字段列表
          ├── 字段名称列
          ├── 字段类型列
          ├── 授权角色列
          └── 对接标识列
```

### 新建字段弹窗结构
```
heading "新建字段"
├── heading "基础信息配置"
│   ├── textbox "字段名称*" (必填)
│   └── combobox "字段类型*" (必填)
├── heading "数据规则配置"
│   ├── combobox "字段有效性"
│   └── combobox "默认值"
├── heading "高级信息配置"
│   ├── combobox "授权角色*" (必填)
│   ├── textbox "对接标识"
│   └── textbox "字段描述"
└── 按钮区
    ├── button "cancel"
    └── button "confirm"
```

## 错误处理

### 1. 页面未加载完成
```javascript
// 等待页面关键元素出现
await mcp__chrome-devtools__wait_for({
  text: "字段管理",
  timeout: 10000
});
```

### 2. 弹窗未关闭
```javascript
// 如果有未关闭的弹窗，先关闭
const snapshot = await mcp__chrome-devtools__take_snapshot();
if (snapshot.includes('heading "新建字段"')) {
  // 查找并点击关闭按钮
  await mcp__chrome-devtools__click({
    uid: "关闭按钮uid"
  });
}
```

### 3. 字段已存在
如果字段已存在，系统会提示错误。可以通过检查页面内容判断：
```javascript
const snapshot = await mcp__chrome-devtools__take_snapshot();
if (snapshot.includes('字段已存在')) {
  console.log('字段已存在，跳过创建');
  // 关闭弹窗，继续下一个字段
}
```

## 完整执行示例

当用户说"帮我在飞书项目中创建5个质量指标字段"时：

1. **使用TodoWrite工具创建任务列表**
```javascript
await TodoWrite({
  todos: [
    {content: "创建Lead Time字段", status: "pending"},
    {content: "创建评审一次通过率字段", status: "pending"},
    {content: "创建并行事项吞吐量字段", status: "pending"},
    {content: "创建PRD返工率字段", status: "pending"},
    {content: "创建试点到GA迭代周期字段", status: "pending"}
  ]
});
```

2. **执行自动化创建流程**
- 打开字段管理页面
- 逐个创建每个字段
- 实时更新todo状态
- 完成后标记所有任务为completed

## 成功标志

创建成功后，页面会显示：
- 新创建的字段出现在字段列表中
- 字段名称、类型、对接标识等信息正确显示
- 可以点击字段查看详情

## 注意事项

1. **权限要求**：用户必须有字段管理权限
2. **网络延迟**：操作之间需要适当延迟（1-2秒）
3. **页面刷新**：创建完成后可能需要刷新页面
4. **批量创建**：建议每次创建不超过10个字段

## 相关文件

- `D:\code\WSJF\feishu-project-workflow\browser-console-script.js` - 浏览器控制台脚本（备用）
- `D:\code\WSJF\feishu-project-workflow\direct-browser-create.js` - 直接浏览器创建脚本（备用）
- `D:\code\WSJF\feishu-project-workflow\README.md` - 项目说明文档

## 更新历史

- 2024-11-16: 成功通过Chrome DevTools自动创建5个质量指标字段
- 技术突破：完全自动化，无需手动获取Token或CSRF验证

---

**提示**：当用户需要在飞书项目中创建自定义字段时，直接使用Chrome DevTools MCP工具进行自动化操作，这是最可靠和高效的方法。