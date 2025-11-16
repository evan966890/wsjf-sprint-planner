#!/usr/bin/env python3
"""
飞书项目质量指标自动配置 - 最终版本
成功获取Token后的完整配置
"""

import requests
import json
import time
import uuid

# 您提供的凭据
PLUGIN_ID = "MII_6917280AF9C0006C"
PLUGIN_SECRET = "D72E9939C94416D05B44DFEA7670EDFB"

# 飞书项目平台
PLATFORM_DOMAIN = "https://project.f.mioffice.cn"
PROJECT_KEY = "iretail"

class FeishuProjectConfigurer:
    def __init__(self):
        self.plugin_token = None

    def get_token(self):
        """获取Plugin Access Token - 已验证成功"""
        print("🔑 获取访问令牌...")

        url = f"{PLATFORM_DOMAIN}/open_api/authen/plugin_token"
        payload = {
            "plugin_id": PLUGIN_ID,
            "plugin_secret": PLUGIN_SECRET,
            "type": 0
        }

        response = requests.post(url, json=payload)
        if response.status_code == 200:
            data = response.json()
            self.plugin_token = data["data"]["token"]
            print(f"✅ Token获取成功: {self.plugin_token[:20]}...")
            return True
        return False

    def create_field(self, field):
        """创建单个字段"""
        if not self.plugin_token:
            return False

        # 尝试多个可能的API端点
        endpoints = [
            f"/open_api/{PROJECT_KEY}/field/requirement/create",
            f"/open_api/{PROJECT_KEY}/field/create",
            f"/open_api/{PROJECT_KEY}/work_item/field/create",
            f"/api/{PROJECT_KEY}/field/create"
        ]

        headers = {
            "Content-Type": "application/json",
            "X-PLUGIN-TOKEN": self.plugin_token,
            "X-IDEM-UUID": str(uuid.uuid4())
        }

        field_data = {
            "field_key": field["key"],
            "field_name": field["name"],
            "field_type": field["type"],
            "required": False,
            "description": f"质量指标 - {field.get('group', '')}"
        }

        if "options" in field:
            field_data["options"] = field["options"]

        print(f"  📋 创建字段: {field['name']} ({field['type']})")

        for endpoint in endpoints:
            url = f"{PLATFORM_DOMAIN}{endpoint}"
            try:
                response = requests.post(url, json=field_data, headers=headers, timeout=5)

                if response.status_code == 200:
                    data = response.json()
                    if data.get("err_code") == 0 or data.get("error", {}).get("code") == 0:
                        print(f"    ✅ 成功")
                        return True
                    elif "exist" in str(data).lower():
                        print(f"    ⚠️ 字段已存在")
                        return True

            except Exception as e:
                continue

        print(f"    ❌ 创建失败（可能需要权限或手动配置）")
        return False

    def configure_all_metrics(self):
        """配置所有5个质量指标"""

        # 5个质量指标的14个字段
        quality_fields = [
            # 指标1: 需求Lead Time (5个字段)
            {"key": "requirement_created_at", "name": "需求创建时间", "type": "datetime", "group": "Lead Time"},
            {"key": "solution_completed_at", "name": "方案完成时间", "type": "datetime", "group": "Lead Time"},
            {"key": "review_passed_at", "name": "评审通过时间", "type": "datetime", "group": "Lead Time"},
            {"key": "deployed_at", "name": "上线时间", "type": "datetime", "group": "Lead Time"},
            {"key": "lead_time_days", "name": "Lead Time(天)", "type": "number", "group": "Lead Time"},

            # 指标2: 评审一次通过率 (2个字段)
            {"key": "review_result", "name": "评审结果", "type": "single_select", "group": "评审通过率",
             "options": [
                 {"value": "first_pass", "label": "一次通过", "color": "green"},
                 {"value": "pass_after_modify", "label": "修改后通过", "color": "yellow"},
                 {"value": "not_pass", "label": "未通过", "color": "red"}
             ]},
            {"key": "review_attempts", "name": "评审轮次", "type": "number", "group": "评审通过率"},

            # 指标3: 并行事项吞吐量 (2个字段)
            {"key": "parallel_task_count", "name": "并行任务数", "type": "number", "group": "吞吐量"},
            {"key": "weekly_completed", "name": "周完成数", "type": "number", "group": "吞吐量"},

            # 指标4: PRD返工率 (2个字段)
            {"key": "prd_version", "name": "PRD版本号", "type": "text", "group": "PRD返工"},
            {"key": "prd_rework_count", "name": "PRD返工次数", "type": "number", "group": "PRD返工"},

            # 指标5: 试点→全面推广 (3个字段)
            {"key": "pilot_start_date", "name": "试点开始日期", "type": "datetime", "group": "试点迭代"},
            {"key": "ga_release_date", "name": "GA发布日期", "type": "datetime", "group": "试点迭代"},
            {"key": "iteration_count", "name": "迭代次数", "type": "number", "group": "试点迭代"}
        ]

        print(f"\n📊 开始配置5个质量指标（共{len(quality_fields)}个字段）...\n")
        print("=" * 50)

        # 按指标分组显示
        current_group = ""
        success_count = 0
        total_count = len(quality_fields)

        for field in quality_fields:
            if field["group"] != current_group:
                current_group = field["group"]
                print(f"\n🎯 指标: {current_group}")

            if self.create_field(field):
                success_count += 1

            time.sleep(0.1)  # 避免触发限流

        print("\n" + "=" * 50)
        print(f"📈 配置统计:")
        print(f"  ✅ 成功: {success_count} 个")
        print(f"  ❌ 失败: {total_count - success_count} 个")
        print("=" * 50)

        return success_count, total_count

def main():
    print("""
╔══════════════════════════════════════════════════════════════╗
║     🚀 飞书项目质量指标自动配置 - 最终版                    ║
║                                                              ║
║     为 iRetail 项目配置5个核心质量指标                      ║
║     • 需求Lead Time                                         ║
║     • 评审一次通过率                                        ║
║     • 并行事项吞吐量                                        ║
║     • PRD返工率                                             ║
║     • 试点到GA迭代次数                                      ║
╚══════════════════════════════════════════════════════════════╝
    """)

    print(f"项目空间: {PROJECT_KEY}")
    print(f"平台地址: {PLATFORM_DOMAIN}")
    print()

    configurer = FeishuProjectConfigurer()

    # 获取Token（已验证可以成功）
    if not configurer.get_token():
        print("❌ 无法获取访问令牌")
        return

    # 配置质量指标
    success, total = configurer.configure_all_metrics()

    if success == total:
        print("\n🎉 恭喜！所有质量指标配置成功！")
    elif success > 0:
        print(f"\n⚠️ 部分配置成功 ({success}/{total})")
        print("其余字段可能需要手动配置或检查权限")
    else:
        print("\n⚠️ 字段创建遇到问题")
        print("这可能是因为：")
        print("1. 字段已经存在")
        print("2. 需要额外的权限")
        print("3. API端点需要调整")

    print("\n📋 手动验证步骤：")
    print(f"1. 访问: {PLATFORM_DOMAIN}/{PROJECT_KEY}/setting/workObjectSetting")
    print("2. 进入 工作项管理 > 需求 > 字段配置")
    print("3. 检查14个质量指标字段是否已创建")
    print("\n如果字段未创建，可以：")
    print("• 使用浏览器控制台运行 browser_auto_config.js")
    print("• 或手动按照 MANUAL_CONFIG_GUIDE.md 配置")

if __name__ == "__main__":
    main()