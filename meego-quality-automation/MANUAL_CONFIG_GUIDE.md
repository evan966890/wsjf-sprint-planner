
# 飞书项目质量指标 - 手动配置指南

由于API认证问题，请按以下步骤手动配置：

## 1. 登录飞书项目
访问: https://project.f.mioffice.cn/iretail/setting/workObjectSetting

## 2. 进入字段配置
点击 "工作项管理" -> "需求" -> "字段配置"

## 3. 创建以下字段

### 指标1: 需求Lead Time
- 需求创建时间 (datetime)
- 上线时间 (datetime)
- Lead Time(天) (number)

### 指标2: 评审一次通过率
- 评审结果 (单选: 一次通过/修改后通过/未通过)
- 评审轮次 (number)

### 指标3: 并行事项吞吐量
- 并行任务数 (number)
- 周完成数 (number)

### 指标4: PRD返工率
- PRD版本 (text)
- PRD返工次数 (number)

### 指标5: 试点到GA迭代次数
- 试点开始 (datetime)
- GA发布 (datetime)
- 迭代次数 (number)

## 4. 配置流程节点
在 "流程管理" 中创建: 需求 -> 方案 -> 评审 -> 开发 -> 试点 -> GA上线

## 5. 设置自动化规则
配置自动计算Lead Time等规则
