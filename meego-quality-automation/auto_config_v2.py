#!/usr/bin/env python3
"""
自动配置飞书项目质量指标 - 修正版
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

# 使用正确的飞书项目API地址
BASE_URL = "https://project.feishu.cn"  # 注意：不是 mioffice.cn

# User Key - 这个通常需要从飞书客户端获取
# 这里使用一个示例值，实际使用时需要替换
USER_KEY = "user_key_placeholder"

# 5个质量指标的简化字段配置
METRICS_CONFIG = {
    "requirement_lead_time": {
        "name": "需求Lead Time",
        "fields": [
            {"key": "req_created", "name": "需求创建时间", "type": "datetime"},
            {"key": "req_deployed", "name": "上线时间", "type": "datetime"},
            {"key": "lead_time_days", "name": "Lead Time(天)", "type": "number"}
        ]
    },
    "review_pass_rate": {
        "name": "评审一次通过率",
        "fields": [
            {"key": "review_result", "name": "评审结果", "type": "single_select",
             "options": ["一次通过", "修改后通过", "未通过"]},
            {"key": "review_attempts", "name": "评审轮次", "type": "number"}
        ]
    },
    "parallel_throughput": {
        "name": "并行事项吞吐量",
        "fields": [
            {"key": "parallel_count", "name": "并行任务数", "type": "number"},
            {"key": "weekly_done", "name": "周完成数", "type": "number"}
        ]
    },
    "prd_rework_rate": {
        "name": "PRD返工率",
        "fields": [
            {"key": "prd_version", "name": "PRD版本", "type": "text"},
            {"key": "prd_reworks", "name": "PRD返工次数", "type": "number"}
        ]
    },
    "pilot_to_ga": {
        "name": "试点到GA迭代次数",
        "fields": [
            {"key": "pilot_start", "name": "试点开始", "type": "datetime"},
            {"key": "ga_release", "name": "GA发布", "type": "datetime"},
            {"key": "iterations", "name": "迭代次数", "type": "number"}
        ]
    }
}

class MeegoConfigurator:
    def __init__(self):
        self.session = requests.Session()
        self.token = None

    def get_plugin_token(self):
        """获取插件令牌"""
        print("🔑 正在获取访问令牌...")

        # 尝试飞书项目的标准认证端点
        endpoints = [
            f"{BASE_URL}/open_api/authen/plugin_token",
            f"{BASE_URL}/open_api/auth/plugin_token",
            f"{BASE_URL}/api/auth/plugin_token",
        ]

        for endpoint in endpoints:
            try:
                response = self.session.post(endpoint, json={
                    "plugin_id": PLUGIN_ID,
                    "plugin_secret": PLUGIN_SECRET,
                    "type": 0  # plugin_access_token
                }, timeout=5)

                if response.status_code == 200:
                    data = response.json()
                    if "data" in data and "token" in data["data"]:
                        self.token = data["data"]["token"]
                        print(f"✅ Token获取成功 (from {endpoint})")
                        return True
                    elif "access_token" in data:
                        self.token = data["access_token"]
                        print(f"✅ Token获取成功 (from {endpoint})")
                        return True

            except Exception as e:
                continue

        print("❌ 无法获取Token，尝试使用插件凭据直接访问...")
        return False

    def test_connection(self):
        """测试连接"""
        print("\n🔍 测试API连接...")

        # 构建请求头
        headers = {
            "Content-Type": "application/json"
        }

        if self.token:
            headers["X-PLUGIN-TOKEN"] = self.token
            headers["X-USER-KEY"] = USER_KEY
        else:
            # 尝试直接使用插件ID作为认证
            headers["X-PLUGIN-ID"] = PLUGIN_ID
            headers["X-PLUGIN-SECRET"] = PLUGIN_SECRET

        # 测试端点
        test_endpoints = [
            f"{BASE_URL}/open_api/{PROJECT_KEY}/work_item_types",
            f"{BASE_URL}/api/{PROJECT_KEY}/work_item_types",
            f"https://project.f.mioffice.cn/open_api/{PROJECT_KEY}/work_item_types"
        ]

        for endpoint in test_endpoints:
            try:
                response = self.session.get(endpoint, headers=headers, timeout=5)
                if response.status_code < 400:
                    print(f"✅ API连接成功: {endpoint}")
                    return True
            except:
                continue

        print("⚠️ 无法连接到API，但继续尝试配置...")
        return False

    def create_fields_via_api(self):
        """通过API创建字段"""
        print("\n📊 开始配置质量指标字段...")
        print("=" * 50)

        headers = {
            "Content-Type": "application/json",
            "X-PLUGIN-TOKEN": self.token if self.token else "",
            "X-USER-KEY": USER_KEY,
            "X-PLUGIN-ID": PLUGIN_ID
        }

        success_count = 0
        total_fields = 0

        for metric_key, metric_config in METRICS_CONFIG.items():
            print(f"\n🎯 配置指标: {metric_config['name']}")

            for field in metric_config['fields']:
                total_fields += 1
                print(f"  • 创建字段: {field['name']} ({field['type']})")

                # 构建字段配置
                field_data = {
                    "field_key": field['key'],
                    "field_name": field['name'],
                    "field_type": field['type'],
                    "required": False
                }

                if 'options' in field:
                    field_data['options'] = field['options']

                # 尝试创建字段
                endpoints = [
                    f"{BASE_URL}/open_api/{PROJECT_KEY}/field/create",
                    f"{BASE_URL}/api/{PROJECT_KEY}/field/create",
                    f"https://project.f.mioffice.cn/api/{PROJECT_KEY}/field/create"
                ]

                created = False
                for endpoint in endpoints:
                    try:
                        response = self.session.post(
                            endpoint,
                            headers=headers,
                            json=field_data,
                            timeout=5
                        )

                        if response.status_code == 200:
                            result = response.json()
                            if result.get("err_code") == 0:
                                print(f"    ✅ 成功")
                                success_count += 1
                                created = True
                                break
                    except:
                        continue

                if not created:
                    print(f"    ⚠️ 需要手动配置")

                time.sleep(0.1)  # 避免触发限流

        print("\n" + "=" * 50)
        print(f"📈 配置统计:")
        print(f"  总字段数: {total_fields}")
        print(f"  成功创建: {success_count}")
        print(f"  需手动配置: {total_fields - success_count}")
        print("=" * 50)

        return success_count, total_fields

    def generate_manual_guide(self):
        """生成手动配置指南"""
        print("\n📝 生成手动配置指南...")

        guide = """
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
"""

        with open("MANUAL_CONFIG_GUIDE.md", "w", encoding="utf-8") as f:
            f.write(guide)

        print("✅ 手动配置指南已生成: MANUAL_CONFIG_GUIDE.md")
        return guide

def main():
    print("""
╔══════════════════════════════════════════════════════════════╗
║     🚀 飞书项目质量指标自动配置 v2                          ║
║        为 iRetail 项目配置5个核心质量指标                    ║
╚══════════════════════════════════════════════════════════════╝
    """)

    configurator = MeegoConfigurator()

    # 尝试获取Token
    has_token = configurator.get_plugin_token()

    # 测试连接
    configurator.test_connection()

    if has_token:
        # 尝试通过API配置
        success, total = configurator.create_fields_via_api()

        if success == total:
            print("\n🎉 恭喜！所有质量指标配置成功！")
        elif success > 0:
            print(f"\n⚠️ 部分配置成功 ({success}/{total})，其余需要手动配置")
            configurator.generate_manual_guide()
        else:
            print("\n⚠️ API配置失败，请使用手动配置")
            configurator.generate_manual_guide()
    else:
        print("\n⚠️ 无法获取API访问权限")
        print("📋 为您生成手动配置指南...")
        guide = configurator.generate_manual_guide()
        print("\n" + guide)

    print("\n✅ 配置流程完成！")
    print("\n下一步操作:")
    print("1. 访问 https://project.f.mioffice.cn/iretail/setting/workObjectSetting")
    print("2. 检查字段是否已创建")
    print("3. 如需手动配置，查看 MANUAL_CONFIG_GUIDE.md")

if __name__ == "__main__":
    main()