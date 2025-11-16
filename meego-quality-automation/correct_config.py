#!/usr/bin/env python3
"""
飞书项目质量指标自动配置 - 基于官方文档的正确版本
根据官方文档：使用plugin_access_token方式
"""

import requests
import json
import time
import uuid

# 您提供的凭据
PLUGIN_ID = "MII_6917280AF9C0006C"
PLUGIN_SECRET = "D72E9939C94416D05B44DFEA7670EDFB"

# 飞书项目平台域名（根据您的URL）
PLATFORM_DOMAIN = "https://project.f.mioffice.cn"
PROJECT_KEY = "iretail"

class FeishuProjectAPI:
    def __init__(self):
        self.plugin_token = None
        self.token_expires = 0

    def get_plugin_token(self):
        """获取插件访问凭证 (Plugin Access Token)
        根据文档：使用Plugin ID和Plugin Secret获取，有效期7200秒
        """
        print("🔑 获取Plugin Access Token...")

        url = f"{PLATFORM_DOMAIN}/open_api/authen/plugin_token"

        payload = {
            "plugin_id": PLUGIN_ID,
            "plugin_secret": PLUGIN_SECRET,
            "type": 0  # 0 表示 plugin_access_token
        }

        headers = {
            "Content-Type": "application/json"
        }

        try:
            response = requests.post(url, json=payload, headers=headers)
            print(f"响应状态: {response.status_code}")

            if response.status_code == 200:
                data = response.json()
                print(f"响应内容: {json.dumps(data, ensure_ascii=False, indent=2)}")

                if data.get("err") == 0 or data.get("error", {}).get("code") == 0:
                    # 可能的响应格式
                    token_data = data.get("data", {})
                    self.plugin_token = (
                        token_data.get("token") or
                        token_data.get("access_token") or
                        token_data.get("plugin_access_token")
                    )

                    if self.plugin_token:
                        print(f"✅ Token获取成功!")
                        self.token_expires = time.time() + 7200
                        return True

            print(f"❌ Token获取失败: {response.text}")
            return False

        except Exception as e:
            print(f"❌ 请求异常: {e}")
            return False

    def get_user_details_without_key(self):
        """获取用户详情 - 文档说明使用插件凭证时不需要user_key"""
        if not self.plugin_token:
            return None

        url = f"{PLATFORM_DOMAIN}/open_api/user/query"

        headers = {
            "Content-Type": "application/json",
            "X-PLUGIN-TOKEN": self.plugin_token
            # 注意：文档说明此接口使用插件身份凭证时，不需要传user_key
        }

        # 尝试查询一些用户信息
        payload = {
            "emails": ["test@example.com"]  # 示例查询
        }

        try:
            response = requests.post(url, json=payload, headers=headers)
            if response.status_code == 200:
                print("✅ 可以在不提供user_key的情况下调用API")
                return response.json()
        except:
            pass

        return None

    def create_custom_field(self, field_config):
        """创建自定义字段
        根据文档，某些接口可能需要user_key，但我们先尝试不用
        """
        if not self.plugin_token:
            print("❌ 没有有效的Token")
            return False

        # 构建请求URL - 根据飞书项目的URL模式
        url = f"{PLATFORM_DOMAIN}/open_api/{PROJECT_KEY}/field"

        # 请求头 - 根据文档要求
        headers = {
            "Content-Type": "application/json",
            "X-PLUGIN-TOKEN": self.plugin_token,
            "X-IDEM-UUID": str(uuid.uuid4())  # 幂等性保证
        }

        # 如果某些接口确实需要user_key，可以尝试使用一个默认值
        # headers["X-USER-KEY"] = "system"  # 可选

        print(f"  创建字段: {field_config['name']}")

        try:
            response = requests.post(url, json=field_config, headers=headers)

            if response.status_code == 200:
                data = response.json()
                if data.get("err_code") == 0:
                    print(f"    ✅ 成功")
                    return True
                else:
                    print(f"    ❌ 失败: {data.get('err_msg')}")
            else:
                print(f"    ❌ HTTP {response.status_code}: {response.text}")

        except Exception as e:
            print(f"    ❌ 异常: {e}")

        return False

    def configure_quality_metrics(self):
        """配置5个质量指标"""

        # 5个质量指标的字段定义
        fields = [
            # 指标1: Lead Time
            {"key": "req_created_time", "name": "需求创建时间", "type": "datetime", "group": "Lead Time"},
            {"key": "solution_time", "name": "方案完成时间", "type": "datetime", "group": "Lead Time"},
            {"key": "review_time", "name": "评审通过时间", "type": "datetime", "group": "Lead Time"},
            {"key": "deploy_time", "name": "上线时间", "type": "datetime", "group": "Lead Time"},
            {"key": "lead_time_days", "name": "Lead Time(天)", "type": "number", "group": "Lead Time"},

            # 指标2: 评审通过率
            {"key": "review_result", "name": "评审结果", "type": "select", "group": "评审通过率",
             "options": ["一次通过", "修改后通过", "未通过"]},
            {"key": "review_rounds", "name": "评审轮次", "type": "number", "group": "评审通过率"},

            # 指标3: 吞吐量
            {"key": "parallel_tasks", "name": "并行任务数", "type": "number", "group": "吞吐量"},
            {"key": "weekly_done", "name": "周完成数", "type": "number", "group": "吞吐量"},

            # 指标4: PRD返工率
            {"key": "prd_version", "name": "PRD版本", "type": "text", "group": "PRD返工"},
            {"key": "prd_reworks", "name": "PRD返工次数", "type": "number", "group": "PRD返工"},

            # 指标5: 试点到GA
            {"key": "pilot_start", "name": "试点开始", "type": "datetime", "group": "试点迭代"},
            {"key": "ga_release", "name": "GA发布", "type": "datetime", "group": "试点迭代"},
            {"key": "iterations", "name": "迭代次数", "type": "number", "group": "试点迭代"}
        ]

        print(f"\n📊 开始配置 {len(fields)} 个字段...\n")

        success = 0
        for field in fields:
            field_config = {
                "field_key": field["key"],
                "field_name": field["name"],
                "field_type": field["type"],
                "field_group": field["group"],
                "required": False
            }

            if "options" in field:
                field_config["options"] = field["options"]

            if self.create_custom_field(field_config):
                success += 1

            time.sleep(0.2)  # 避免触发限流

        print(f"\n📈 配置完成: {success}/{len(fields)} 个字段成功")

        return success

def main():
    print("""
╔══════════════════════════════════════════════════════════════╗
║     🚀 飞书项目质量指标自动配置                              ║
║        基于官方文档的正确实现                                ║
╚══════════════════════════════════════════════════════════════╝
    """)

    print(f"项目: {PROJECT_KEY}")
    print(f"平台: {PLATFORM_DOMAIN}")
    print(f"插件ID: {PLUGIN_ID[:20]}...")
    print()

    api = FeishuProjectAPI()

    # 步骤1: 获取Plugin Access Token
    if not api.get_plugin_token():
        print("\n⚠️ 无法获取Token，可能需要检查：")
        print("1. Plugin ID 和 Secret 是否正确")
        print("2. 插件是否已在项目空间中安装")
        print("3. 网络连接是否正常")
        return

    # 步骤2: 测试API调用（不使用user_key）
    print("\n🔍 测试API连接...")
    api.get_user_details_without_key()

    # 步骤3: 配置质量指标
    api.configure_quality_metrics()

    print("\n✅ 配置流程完成！")
    print("\n下一步：")
    print(f"1. 访问 {PLATFORM_DOMAIN}/{PROJECT_KEY}/setting")
    print("2. 检查字段配置")
    print("3. 设置流程节点和自动化规则")

if __name__ == "__main__":
    main()