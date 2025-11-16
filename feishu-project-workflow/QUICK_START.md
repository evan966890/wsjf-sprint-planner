# 🚀 快速开始指南

## 一键配置质量指标字段

### 1️⃣ 安装依赖

```bash
cd D:\code\WSJF\feishu-project-workflow
npm install
```

### 2️⃣ 配置认证信息

创建 `.env` 文件（已提供示例值）：

```bash
# Windows
copy .env.example .env

# 或手动创建 .env 文件，添加以下内容：
FEISHU_PROJECT_URL=https://project.f.mioffice.cn
PROJECT_KEY=iretail
PLUGIN_ID=MII_6917280AF9C0006C
PLUGIN_SECRET=D72E9939C94416D05B44DFEA7670EDFB
USER_KEY=7541721806923694188
```

### 3️⃣ 运行配置脚本

```bash
# 编译TypeScript
npm run build

# 运行配置
npm start
```

或直接运行TypeScript版本：

```bash
npm run config
```

## ✅ 验证结果

配置完成后，访问：
https://project.f.mioffice.cn/iretail/setting/workObject/story?menuTab=fieldManagement

应该能看到以下5个字段：
- Lead Time（交付周期）
- 评审一次通过率
- 并行事项吞吐量
- PRD返工率
- 试点到GA迭代周期

## ⚠️ 注意事项

1. 第一个字段(Lead Time)可能已通过UI创建，脚本会跳过重复字段
2. 确保有项目管理员权限
3. 如果遇到认证失败，请检查插件凭证是否有效

## 🐛 常见问题

**Q: 提示认证失败怎么办？**
A: 检查 `.env` 文件中的 PLUGIN_ID 和 PLUGIN_SECRET 是否正确

**Q: 字段创建失败？**
A: 可能是字段已存在，检查字段管理页面是否有同名字段

**Q: 如何获取新的插件凭证？**
A: 登录飞书项目 → 左下角开发者后台 → 创建插件 → 复制凭证

---

📧 如有问题，请查看详细 README.md 或提交 Issue