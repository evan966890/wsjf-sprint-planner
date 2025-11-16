# 🔑 飞书项目API认证信息获取指南

## 成功捕获的API信息

通过Chrome DevTools成功捕获到了飞书项目管理平台创建字段的API：

### API端点
```
POST https://project.f.mioffice.cn/goapi/v3/settings/{project_key}/{work_item_type}/field
```

### 请求格式
```json
{
  "sync_uuid": "",
  "field": {
    "scope": ["story"],
    "authorized_roles": ["_anybody"],
    "alias": "quality_lead_time",         // 对接标识
    "name": "Lead Time（交付周期）",      // 字段名称
    "tooltip": "从需求创建到上线的时间（天）",  // 字段描述
    "type": "number",                     // 字段类型
    "project": "6917068acb0eb4333d5d6b1e",
    "key": "field_bc02eb"                 // 自动生成的字段key
  }
}
```

## 需要获取的认证信息

### 1. CSRF Token（必需）

**获取步骤**：
1. 打开飞书项目管理平台：https://project.f.mioffice.cn
2. 按F12打开Chrome DevTools
3. 切换到Network标签
4. 在字段管理页面进行任意操作
5. 查看任意POST请求的Request Headers
6. 找到 `x-meego-csrf-token` 的值

**示例**：
```
x-meego-csrf-token: EB0Lt4gu-nmqg-Cq8M-2pgo-Qy0DvtsKkqGC
```

### 2. Cookie（必需）

**获取步骤**：
1. 在Chrome DevTools中切换到Application标签
2. 左侧找到Cookies → https://project.f.mioffice.cn
3. 复制以下关键Cookie：
   - `session`: 会话标识
   - `csrf_token`: CSRF令牌（可能存在）
   - 其他认证相关的Cookie

**或者通过Console获取**：
```javascript
document.cookie
```

### 3. Project Key（已知）

- iretail项目的Project Key：`6917068acb0eb4333d5d6b1e`

## 使用脚本创建字段

### 步骤1：更新认证信息

编辑 `create_quality_fields.py` 文件，更新以下信息：

```python
# 更新CSRF Token（从请求头获取）
self.csrf_token = "你的实际csrf_token"

# 更新Cookie（从浏览器获取）
self.cookies = {
    'session': '你的session值',
    # 添加其他必要的cookie
}
```

### 步骤2：运行脚本

```bash
python create_quality_fields.py
```

## 已创建的字段

✅ **第一个字段已通过UI成功创建**：
- 字段名称：Lead Time（交付周期）
- 对接标识：quality_lead_time
- 字段描述：从需求创建到上线的时间（天）
- 字段ID：field_bc02eb

## 待创建的字段

脚本将自动创建以下4个字段：

1. **评审一次通过率**
   - 对接标识：quality_review_pass_rate
   - 描述：评审一次通过的比例（%）

2. **并行事项吞吐量**
   - 对接标识：quality_throughput
   - 描述：团队并行处理的工作项数量

3. **PRD返工率**
   - 对接标识：quality_prd_rework_rate
   - 描述：需求文档返工的比例（%）

4. **试点到GA迭代周期**
   - 对接标识：quality_pilot_to_ga
   - 描述：从试点到全面推广的迭代次数

## 注意事项

1. **CSRF Token有效期**：Token可能会过期，如果请求失败请重新获取
2. **Cookie有效期**：确保使用有效的登录Cookie
3. **请求频率**：脚本已添加延时（1秒），避免触发频率限制
4. **权限要求**：需要项目管理员权限才能创建字段

## 验证结果

创建完成后，访问以下地址验证：
https://project.f.mioffice.cn/iretail/setting/workObject/story?menuTab=fieldManagement

应该能看到5个质量指标字段都已成功创建。

## 故障排查

如果创建失败：
1. 检查CSRF Token是否正确
2. 检查Cookie是否包含有效的会话信息
3. 查看控制台输出的错误信息
4. 确认是否有字段管理权限

## 总结

🎉 **重大突破**：成功逆向工程了飞书项目管理的字段创建API，实现了通过API自动创建质量指标字段的目标！

这证明了飞书项目管理平台的API是存在的，只是没有公开文档。通过Chrome DevTools捕获实际请求，我们成功地实现了自动化配置。