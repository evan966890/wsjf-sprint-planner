#!/usr/bin/env python3
"""
飞书项目质量指标 - 完全自动配置（需要user_key）
基于WSJF项目的飞书集成经验
"""

import requests
import json
import time
import uuid

# 您提供的凭据
PLUGIN_ID = "MII_6917280AF9C0006C"
PLUGIN_SECRET = "D72E9939C94416D05B44DFEA7670EDFB"
PLATFORM_DOMAIN = "https://project.f.mioffice.cn"
PROJECT_KEY = "iretail"

class QualityMetricsConfigurator:
    def __init__(self, user_key=None):
        self.plugin_token = None
        self.user_key = user_key
        self.session = requests.Session()

    def get_plugin_token(self):
        """获取Plugin Token"""
        print("🔑 获取Plugin Token...")

        url = f"{PLATFORM_DOMAIN}/open_api/authen/plugin_token"
        payload = {
            "plugin_id": PLUGIN_ID,
            "plugin_secret": PLUGIN_SECRET,
            "type": 0
        }

        response = self.session.post(url, json=payload)
        if response.status_code == 200:
            data = response.json()
            if data.get("data") and data["data"].get("token"):
                self.plugin_token = data["data"]["token"]
                print(f"✅ Token获取成功: {self.plugin_token[:30]}...")
                return True

        print("❌ Token获取失败")
        return False

    def create_quality_metrics_fields(self):
        """创建14个质量指标字段"""
        if not self.plugin_token or not self.user_key:
            print("❌ 缺少必要的认证信息")
            return False

        print(f"\n📊 开始创建质量指标字段...")
        print(f"   使用User Key: {self.user_key}")

        # 14个质量指标字段
        fields = [
            # Lead Time (5个)
            {"key": "quality_lead_time_created", "name": "需求创建时间", "type": "datetime", "group": "Lead Time"},
            {"key": "quality_lead_time_solution", "name": "方案完成时间", "type": "datetime", "group": "Lead Time"},
            {"key": "quality_lead_time_review", "name": "评审通过时间", "type": "datetime", "group": "Lead Time"},
            {"key": "quality_lead_time_deployed", "name": "上线时间", "type": "datetime", "group": "Lead Time"},
            {"key": "quality_lead_time_days", "name": "Lead Time(天)", "type": "number", "group": "Lead Time"},

            # 评审通过率 (2个)
            {"key": "quality_review_result", "name": "评审结果", "type": "single_select", "group": "评审通过率",
             "options": [
                 {"value": "first_pass", "label": "一次通过"},
                 {"value": "pass_after_modify", "label": "修改后通过"},
                 {"value": "not_pass", "label": "未通过"}
             ]},
            {"key": "quality_review_rounds", "name": "评审轮次", "type": "number", "group": "评审通过率"},

            # 吞吐量 (2个)
            {"key": "quality_parallel_tasks", "name": "并行任务数", "type": "number", "group": "吞吐量"},
            {"key": "quality_weekly_done", "name": "周完成数", "type": "number", "group": "吞吐量"},

            # PRD返工 (2个)
            {"key": "quality_prd_version", "name": "PRD版本", "type": "text", "group": "PRD返工"},
            {"key": "quality_prd_rework", "name": "PRD返工次数", "type": "number", "group": "PRD返工"},

            # 试点到GA (3个)
            {"key": "quality_pilot_start", "name": "试点开始日期", "type": "datetime", "group": "试点迭代"},
            {"key": "quality_ga_release", "name": "GA发布日期", "type": "datetime", "group": "试点迭代"},
            {"key": "quality_iterations", "name": "迭代次数", "type": "number", "group": "试点迭代"}
        ]

        headers = {
            "Content-Type": "application/json",
            "X-PLUGIN-TOKEN": self.plugin_token,
            "X-USER-KEY": self.user_key,
            "X-IDEM-UUID": str(uuid.uuid4())
        }

        success_count = 0
        current_group = ""

        for field in fields:
            if field["group"] != current_group:
                current_group = field["group"]
                print(f"\n🎯 配置指标: {current_group}")

            # 根据飞书项目API文档，创建字段的端点
            url = f"{PLATFORM_DOMAIN}/open_api/{PROJECT_KEY}/field/create"

            payload = {
                "field_key": field["key"],
                "field_name": field["name"],
                "field_type": field["type"],
                "field_alias": field["name"],
                "work_item_type_key": "requirement",
                "required": False,
                "editable": True,
                "visible": True
            }

            if field.get("options"):
                payload["options"] = field["options"]

            print(f"  📋 {field['name']}...", end="")

            try:
                response = self.session.post(url, json=payload, headers=headers, timeout=10)

                if response.status_code == 200:
                    data = response.json()
                    if data.get("err_code") == 0 or data.get("code") == 0:
                        print(" ✅")
                        success_count += 1
                    elif "exist" in str(data).lower():
                        print(" ⚠️ 已存在")
                        success_count += 1
                    else:
                        print(f" ❌ {data.get('err_msg', '未知错误')}")
                else:
                    print(f" ❌ HTTP {response.status_code}")

            except Exception as e:
                print(f" ❌ 异常: {e}")

            time.sleep(0.3)  # 避免请求过快

        print(f"\n{'='*60}")
        print(f"📈 配置结果: 成功 {success_count}/{len(fields)} 个字段")
        print(f"{'='*60}")

        return success_count > 0

    def run(self):
        """执行配置流程"""
        print("""
╔══════════════════════════════════════════════════════════════╗
║     🎯 飞书项目质量指标 - 自动配置工具                      ║
║                                                              ║
║     为iRetail项目配置5个核心质量指标（14个字段）           ║
╚══════════════════════════════════════════════════════════════╝
        """)

        # 检查user_key
        if not self.user_key:
            print("\n⚠️ 需要User Key才能继续")
            print("\n获取User Key的方法：")
            print("1. 打开飞书项目：https://project.f.mioffice.cn")
            print("2. 按F12打开开发者工具")
            print("3. 切换到Network标签")
            print("4. 点击任意项目或刷新页面")
            print("5. 在任意请求的Headers中找到 X-User-Key")
            print("6. 复制User Key的值（纯数字，约19位）")

            user_key_input = input("\n请输入您的User Key: ").strip()
            if not user_key_input:
                print("❌ 未提供User Key，退出")
                return False

            self.user_key = user_key_input

        # 获取Token
        if not self.get_plugin_token():
            print("❌ 无法获取Plugin Token")
            return False

        # 创建字段
        success = self.create_quality_metrics_fields()

        if success:
            print("\n🎉 质量指标配置成功！")
            print("\n已配置的5个质量指标：")
            print("  1️⃣ 需求Lead Time - 追踪需求全生命周期（5个字段）")
            print("  2️⃣ 评审一次通过率 - 提升评审效率（2个字段）")
            print("  3️⃣ 并行事项吞吐量 - 监控团队产能（2个字段）")
            print("  4️⃣ PRD返工率 - 评估需求质量（2个字段）")
            print("  5️⃣ 试点到GA迭代 - 跟踪产品成熟度（3个字段）")
            print("\n下一步：")
            print(f"1. 访问 {PLATFORM_DOMAIN}/{PROJECT_KEY}/setting/workObjectSetting")
            print("2. 查看字段配置，确认字段已创建")
            print("3. 开始使用质量指标追踪项目质量")
        else:
            print("\n❌ 配置失败")
            print("可能的原因：")
            print("1. User Key无效")
            print("2. 权限不足")
            print("3. 字段已存在")

        return success

if __name__ == "__main__":
    # 如果您已经有user_key，可以直接传入
    # configurator = QualityMetricsConfigurator(user_key="7541721806923694188")

    configurator = QualityMetricsConfigurator()
    configurator.run()