#!/usr/bin/env python3
"""
飞书项目官方API - 质量指标字段创建
使用官方OpenAPI创建质量指标字段
"""

import requests
import json
import hashlib
import time

class FeishuProjectAPI:
    """飞书项目官方API客户端"""

    def __init__(self, plugin_id: str, plugin_secret: str):
        """初始化客户端

        Args:
            plugin_id: 插件ID (从飞书项目后台获取)
            plugin_secret: 插件密钥 (从飞书项目后台获取)
        """
        self.plugin_id = plugin_id
        self.plugin_secret = plugin_secret
        self.base_url = "https://project.f.mioffice.cn"
        self.project_key = "iretail"
        self.token = None

    def get_plugin_token(self) -> str:
        """获取插件Token

        基于官方文档的认证方式
        """
        # 根据飞书项目API文档，需要使用plugin_id和plugin_secret获取token
        url = f"{self.base_url}/open_api/authen/plugin_token"

        data = {
            "plugin_id": self.plugin_id,
            "plugin_secret": self.plugin_secret
        }

        try:
            response = requests.post(url, json=data)
            if response.status_code == 200:
                result = response.json()
                if result.get("code") == 0:
                    self.token = result.get("data", {}).get("token")
                    return self.token
        except Exception as e:
            print(f"获取token失败: {e}")

        return None

    def create_field(self, work_item_type: str, field_config: dict) -> bool:
        """创建自定义字段

        Args:
            work_item_type: 工作项类型 (如 story, task, bug)
            field_config: 字段配置

        Returns:
            是否创建成功
        """
        if not self.token:
            print("❌ 需要先获取token")
            return False

        # 根据飞书项目API文档的字段创建端点
        url = f"{self.base_url}/open_api/{self.project_key}/work_item_type/{work_item_type}/field"

        headers = {
            "Content-Type": "application/json",
            "X-PLUGIN-TOKEN": self.token,
            "X-USER-KEY": "7541721806923694188"  # 用户标识
        }

        # 构造字段数据
        payload = {
            "field_name": field_config["name"],
            "field_alias": field_config["alias"],
            "field_type": "number",  # 数字类型
            "description": field_config["description"],
            "required": False,
            "default_value": None,
            "options": [],
            "permissions": {
                "read": ["*"],  # 所有人可读
                "write": ["*"]  # 所有人可写
            }
        }

        try:
            response = requests.post(
                url,
                json=payload,
                headers=headers,
                timeout=10
            )

            if response.status_code == 200:
                result = response.json()
                if result.get("code") == 0:
                    print(f"✅ 字段 '{field_config['name']}' 创建成功!")
                    return True
                else:
                    print(f"❌ API错误: {result.get('msg', '未知错误')}")
            else:
                print(f"❌ HTTP {response.status_code}: {response.text[:200]}")

        except Exception as e:
            print(f"❌ 异常: {e}")

        return False

    def create_quality_metrics(self):
        """创建所有质量指标字段"""

        print("\n🚀 使用飞书项目官方API创建质量指标字段")
        print("=" * 60)

        # 1. 获取认证token
        print("\n1️⃣ 获取插件Token...")
        if not self.get_plugin_token():
            print("❌ 无法获取token，请检查plugin_id和plugin_secret")
            return False

        print(f"✅ Token获取成功: {self.token[:20]}...")

        # 2. 定义质量指标字段
        quality_fields = [
            {
                "name": "Lead Time（交付周期）",
                "alias": "quality_lead_time",
                "description": "从需求创建到上线的平均时间（天）"
            },
            {
                "name": "评审一次通过率",
                "alias": "quality_review_pass_rate",
                "description": "评审一次通过的比例（%）"
            },
            {
                "name": "并行事项吞吐量",
                "alias": "quality_throughput",
                "description": "团队并行处理的工作项数量"
            },
            {
                "name": "PRD返工率",
                "alias": "quality_prd_rework_rate",
                "description": "需求文档返工的比例（%）"
            },
            {
                "name": "试点到GA迭代周期",
                "alias": "quality_pilot_to_ga",
                "description": "从试点到全面推广的迭代次数"
            }
        ]

        # 3. 创建字段
        print(f"\n2️⃣ 创建 {len(quality_fields)} 个质量指标字段...")

        success_count = 0
        for i, field in enumerate(quality_fields, 1):
            print(f"\n[{i}/{len(quality_fields)}] 创建: {field['name']}")

            if self.create_field("story", field):
                success_count += 1

            # 避免请求过快
            if i < len(quality_fields):
                time.sleep(1)

        # 4. 输出结果
        print("\n" + "=" * 60)
        print(f"✅ 成功创建 {success_count}/{len(quality_fields)} 个字段")
        print("=" * 60)

        return success_count == len(quality_fields)


def main():
    """主函数"""

    print("""
╔══════════════════════════════════════════════════════════════╗
║     🎯 飞书项目质量指标自动配置工具 (官方API版)            ║
║                                                              ║
║     使用飞书项目官方OpenAPI创建质量指标字段                ║
╚══════════════════════════════════════════════════════════════╝
    """)

    print("\n📋 准备工作:")
    print("1. 登录飞书项目: https://project.f.mioffice.cn")
    print("2. 点击左下角进入开发者后台")
    print("3. 创建插件并获取 plugin_id 和 plugin_secret")
    print("4. 确保插件有字段管理权限")

    # 从之前的配置中获取
    plugin_id = "MII_6917280AF9C0006C"
    plugin_secret = "D72E9939C94416D05B44DFEA7670EDFB"

    print(f"\n📌 使用配置:")
    print(f"   Plugin ID: {plugin_id}")
    print(f"   Plugin Secret: {plugin_secret[:10]}...")

    input("\n按Enter键开始配置...")

    # 创建API客户端
    api = FeishuProjectAPI(plugin_id, plugin_secret)

    # 执行配置
    if api.create_quality_metrics():
        print("\n🎉 所有质量指标字段配置成功!")
        print("请访问以下地址验证:")
        print("https://project.f.mioffice.cn/iretail/setting/workObject/story?menuTab=fieldManagement")
    else:
        print("\n⚠️ 配置未完全成功，请检查错误信息")


if __name__ == "__main__":
    main()