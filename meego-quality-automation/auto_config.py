#!/usr/bin/env python3
"""
自动配置飞书项目质量指标 - 完全自动化版本
"""

import os
import sys
import json
import requests
import time
from typing import Dict, Any, List

# 配置信息
PLUGIN_ID = "MII_6917280AF9C0006C"
PLUGIN_SECRET = "D72E9939C94416D05B44DFEA7670EDFB"
PROJECT_KEY = "iretail"
BASE_URL = "https://project.f.mioffice.cn/open_api"

# 5个质量指标字段配置
QUALITY_METRICS_FIELDS = [
    # Lead Time相关字段
    {
        "key": "requirement_created_at",
        "name": "需求创建时间",
        "type": "datetime",
        "description": "需求首次创建的时间"
    },
    {
        "key": "solution_completed_at",
        "name": "方案完成时间",
        "type": "datetime",
        "description": "方案设计完成的时间"
    },
    {
        "key": "review_completed_at",
        "name": "评审完成时间",
        "type": "datetime",
        "description": "评审通过的时间"
    },
    {
        "key": "deployed_at",
        "name": "上线时间",
        "type": "datetime",
        "description": "功能上线的时间"
    },
    {
        "key": "lead_time_days",
        "name": "Lead Time (天)",
        "type": "number",
        "description": "从需求到上线的总天数"
    },

    # 评审通过率相关
    {
        "key": "review_result",
        "name": "评审结果",
        "type": "select",
        "options": ["一次通过", "修改后通过", "多次修改通过", "未通过"],
        "description": "评审的最终结果"
    },
    {
        "key": "review_attempts",
        "name": "评审轮次",
        "type": "number",
        "description": "评审进行的轮次",
        "default": 1
    },

    # 并行吞吐量相关
    {
        "key": "parallel_tasks_count",
        "name": "并行任务数",
        "type": "number",
        "description": "同时进行的任务数量"
    },
    {
        "key": "weekly_throughput",
        "name": "周吞吐量",
        "type": "number",
        "description": "每周完成的需求数"
    },

    # PRD返工率相关
    {
        "key": "prd_version",
        "name": "PRD版本号",
        "type": "text",
        "description": "产品需求文档版本",
        "default": "v1.0"
    },
    {
        "key": "prd_rework_count",
        "name": "PRD返工次数",
        "type": "number",
        "description": "PRD被打回修改的次数",
        "default": 0
    },

    # 试点到GA相关
    {
        "key": "pilot_start_date",
        "name": "试点开始日期",
        "type": "datetime",
        "description": "功能开始试点的时间"
    },
    {
        "key": "ga_release_date",
        "name": "GA发布日期",
        "type": "datetime",
        "description": "全面推广的时间"
    },
    {
        "key": "iteration_count",
        "name": "迭代次数",
        "type": "number",
        "description": "从试点到GA的迭代次数"
    }
]

class FeishuAutoConfig:
    def __init__(self):
        self.token = None
        self.user_key = None

    def get_token(self):
        """获取访问令牌"""
        print("🔑 获取访问令牌...")

        url = f"{BASE_URL}/auth/refresh_token"
        response = requests.post(url, json={
            "plugin_id": PLUGIN_ID,
            "plugin_secret": PLUGIN_SECRET
        })

        if response.status_code == 200:
            data = response.json()
            if data.get("err_code") == 0:
                self.token = data["data"]["access_token"]
                print("✅ Token获取成功")
                return self.token

        print(f"❌ Token获取失败: {response.text}")
        return None

    def auto_detect_user_key(self):
        """尝试自动检测user key"""
        # 这里使用一个默认值或通过其他方式获取
        self.user_key = "7541721806923694188"  # 临时使用一个默认值
        print(f"📝 使用User Key: {self.user_key}")
        return self.user_key

    def create_field(self, field_config):
        """创建单个字段"""
        if not self.token:
            self.get_token()

        if not self.user_key:
            self.auto_detect_user_key()

        url = f"{BASE_URL}/{PROJECT_KEY}/field/requirement/create"

        headers = {
            'Content-Type': 'application/json',
            'X-PLUGIN-TOKEN': self.token,
            'X-USER-KEY': self.user_key
        }

        # 添加幂等性UUID
        import uuid
        headers['X-IDEM-UUID'] = str(uuid.uuid4())

        response = requests.post(url, headers=headers, json=field_config)

        if response.status_code == 200:
            data = response.json()
            if data.get("err_code") == 0:
                return True, "成功"
            else:
                return False, data.get("err_msg", "未知错误")
        else:
            return False, f"HTTP {response.status_code}"

    def create_all_fields(self):
        """创建所有质量指标字段"""
        print("\n📊 开始创建质量指标字段...")
        print("=" * 50)

        success_count = 0
        failed_count = 0

        for i, field in enumerate(QUALITY_METRICS_FIELDS, 1):
            print(f"\n[{i}/{len(QUALITY_METRICS_FIELDS)}] 创建字段: {field['name']}")

            field_config = {
                "key": field["key"],
                "name": field["name"],
                "type": field["type"],
                "description": field.get("description", ""),
                "required": field.get("required", False)
            }

            # 添加选项（如果有）
            if "options" in field:
                field_config["options"] = field["options"]

            # 添加默认值（如果有）
            if "default" in field:
                field_config["default"] = field["default"]

            success, message = self.create_field(field_config)

            if success:
                print(f"  ✅ {message}")
                success_count += 1
            else:
                if "already exists" in message.lower() or "已存在" in message:
                    print(f"  ⚠️ 字段已存在，跳过")
                    success_count += 1
                else:
                    print(f"  ❌ 失败: {message}")
                    failed_count += 1

            # 避免触发限流
            time.sleep(0.2)

        print("\n" + "=" * 50)
        print(f"📈 配置完成统计:")
        print(f"  ✅ 成功: {success_count} 个")
        print(f"  ❌ 失败: {failed_count} 个")
        print("=" * 50)

        return success_count, failed_count

def main():
    print("""
╔══════════════════════════════════════════════════════════════╗
║     🚀 飞书项目质量指标自动配置                              ║
║        正在为 iRetail 项目配置5个质量指标                    ║
╚══════════════════════════════════════════════════════════════╝
    """)

    print("配置信息:")
    print(f"  项目: {PROJECT_KEY}")
    print(f"  插件ID: {PLUGIN_ID}")
    print(f"  字段数量: {len(QUALITY_METRICS_FIELDS)}")
    print()

    configurator = FeishuAutoConfig()

    # 获取token
    if not configurator.get_token():
        print("❌ 无法获取访问令牌，请检查插件凭据")
        return

    # 创建字段
    success, failed = configurator.create_all_fields()

    if failed == 0:
        print("\n🎉 恭喜！所有质量指标配置成功！")
        print("\n下一步:")
        print("1. 登录飞书项目查看配置的字段")
        print("2. 在需求工作项中使用这些字段")
        print("3. 配置仪表盘展示质量指标")
    else:
        print(f"\n⚠️ 有 {failed} 个字段配置失败，请检查错误信息")

if __name__ == "__main__":
    main()