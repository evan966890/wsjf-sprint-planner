#!/usr/bin/env python3
"""
飞书项目质量指标字段自动配置
基于飞书项目OpenAPI创建5个质量指标字段
"""

import requests
import json
import time
import uuid
from typing import Dict, List, Any

class QualityMetricsConfigurator:
    """质量指标配置器"""

    def __init__(self):
        """初始化配置"""
        self.base_url = "https://project.f.mioffice.cn"
        self.project_key = "iretail"
        self.plugin_id = "MII_6917280AF9C0006C"
        self.plugin_secret = "D72E9939C94416D05B44DFEA7670EDFB"
        self.user_key = "7541721806923694188"
        self.plugin_token = None
        self.session = requests.Session()

    def get_plugin_token(self) -> bool:
        """获取Plugin Token"""
        print("🔑 步骤1: 获取Plugin Token...")

        url = f"{self.base_url}/open_api/authen/plugin_token"
        payload = {
            "plugin_id": self.plugin_id,
            "plugin_secret": self.plugin_secret,
            "type": 0
        }

        try:
            response = self.session.post(url, json=payload)
            if response.status_code == 200:
                data = response.json()
                # 兼容不同的响应格式
                if "data" in data and "token" in data["data"]:
                    self.plugin_token = data["data"]["token"]
                elif "token" in data:
                    self.plugin_token = data["token"]

                if self.plugin_token:
                    print(f"✅ Token获取成功: {self.plugin_token[:30]}...")
                    return True

            print(f"❌ Token获取失败: {response.text}")
            return False
        except Exception as e:
            print(f"❌ Token获取异常: {e}")
            return False

    def create_field(self, field_config: Dict[str, Any]) -> bool:
        """创建单个字段"""
        print(f"\n📝 创建字段: {field_config['field_name']}...")

        # 设置请求头
        headers = {
            "Content-Type": "application/json",
            "X-PLUGIN-TOKEN": self.plugin_token,
            "X-USER-KEY": self.user_key,
            "X-IDEM-UUID": str(uuid.uuid4())
        }

        # 尝试多个可能的API端点
        endpoints = [
            f"/open_api/{self.project_key}/work_item_type/requirement/field",
            f"/open_api/{self.project_key}/work_item/requirement/field",
            f"/open_api/{self.project_key}/field",
            f"/api/project/{self.project_key}/field/create"
        ]

        for endpoint in endpoints:
            url = f"{self.base_url}{endpoint}"
            print(f"  尝试端点: {endpoint}")

            try:
                response = self.session.post(
                    url,
                    json=field_config,
                    headers=headers,
                    timeout=10
                )

                if response.status_code in [200, 201]:
                    result = response.json()
                    if result.get("code") == 0 or result.get("err_code") == 0:
                        print(f"  ✅ 字段创建成功!")
                        return True
                    else:
                        print(f"  API返回: {result}")
                elif response.status_code == 404:
                    print(f"  端点不存在，尝试下一个...")
                else:
                    print(f"  响应: {response.status_code} - {response.text[:200]}")

            except Exception as e:
                print(f"  异常: {e}")

        return False

    def configure_quality_metrics(self) -> Dict[str, bool]:
        """配置5个质量指标字段"""
        print("\n📊 开始配置5个质量指标字段...")
        print("=" * 60)

        # 定义5个质量指标字段
        fields = [
            {
                "field_name": "Lead Time（交付周期）",
                "field_key": "quality_lead_time",
                "field_type": "number",  # 先尝试number类型
                "field_alias": "Lead Time",
                "description": "从需求创建到上线的时间（天）",
                "config": {
                    "decimal": 1,
                    "unit": "天"
                }
            },
            {
                "field_name": "评审一次通过率",
                "field_key": "quality_review_pass_rate",
                "field_type": "number",
                "field_alias": "Review Pass Rate",
                "description": "评审一次通过的比例（%）",
                "config": {
                    "decimal": 2,
                    "min": 0,
                    "max": 100,
                    "unit": "%"
                }
            },
            {
                "field_name": "并行事项吞吐量",
                "field_key": "quality_throughput",
                "field_type": "number",
                "field_alias": "Throughput",
                "description": "团队并行处理的工作项数量",
                "config": {
                    "decimal": 0,
                    "min": 0
                }
            },
            {
                "field_name": "PRD返工率",
                "field_key": "quality_prd_rework_rate",
                "field_type": "number",
                "field_alias": "PRD Rework Rate",
                "description": "需求文档返工的比例（%）",
                "config": {
                    "decimal": 2,
                    "min": 0,
                    "max": 100,
                    "unit": "%"
                }
            },
            {
                "field_name": "试点到GA迭代周期",
                "field_key": "quality_pilot_to_ga",
                "field_type": "number",
                "field_alias": "Pilot to GA",
                "description": "从试点到全面推广的迭代次数",
                "config": {
                    "decimal": 0,
                    "min": 0,
                    "unit": "次"
                }
            }
        ]

        # 创建字段并记录结果
        results = {}
        success_count = 0

        for field in fields:
            # 构建完整的字段配置
            field_config = {
                "field_name": field["field_name"],
                "field_key": field["field_key"],
                "field_type": field["field_type"],
                "field_alias": field.get("field_alias", field["field_name"]),
                "description": field.get("description", ""),
                "work_item_type": "requirement",
                "required": False,
                "editable": True,
                "visible": True
            }

            # 添加额外配置
            if "config" in field:
                field_config.update(field["config"])

            # 创建字段
            success = self.create_field(field_config)
            results[field["field_name"]] = success

            if success:
                success_count += 1

            # 避免请求过快
            time.sleep(0.5)

        print("\n" + "=" * 60)
        print(f"📈 配置结果: {success_count}/5 个字段创建成功")
        print("=" * 60)

        return results

    def verify_configuration(self) -> bool:
        """验证配置是否成功"""
        print("\n🔍 验证配置结果...")

        headers = {
            "X-PLUGIN-TOKEN": self.plugin_token,
            "X-USER-KEY": self.user_key
        }

        # 尝试获取字段列表
        endpoints = [
            f"/open_api/{self.project_key}/work_item_type/requirement/fields",
            f"/open_api/{self.project_key}/fields",
            f"/open_api/{self.project_key}/field/list"
        ]

        for endpoint in endpoints:
            url = f"{self.base_url}{endpoint}"

            try:
                response = self.session.get(url, headers=headers, timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    print(f"✅ 成功获取字段列表")

                    # 检查是否包含我们创建的字段
                    if "data" in data:
                        fields = data.get("data", {}).get("fields", [])
                        quality_fields = [f for f in fields if "quality_" in f.get("field_key", "")]

                        if quality_fields:
                            print(f"✅ 找到 {len(quality_fields)} 个质量指标字段:")
                            for field in quality_fields:
                                print(f"   - {field.get('field_name')} ({field.get('field_key')})")
                            return True

                    return False

            except Exception as e:
                print(f"验证异常: {e}")

        return False

    def run(self) -> bool:
        """执行完整的配置流程"""
        print("""
╔══════════════════════════════════════════════════════════════╗
║     🚀 飞书项目质量指标自动配置工具                         ║
║                                                              ║
║     项目: iretail (国际零售业务+产品)                       ║
║     目标: 创建5个质量指标字段                               ║
╚══════════════════════════════════════════════════════════════╝
        """)

        # 步骤1: 获取Token
        if not self.get_plugin_token():
            print("\n❌ 无法获取访问令牌，配置终止")
            return False

        # 步骤2: 创建字段
        results = self.configure_quality_metrics()

        # 步骤3: 验证结果
        if self.verify_configuration():
            print("\n🎉 质量指标配置成功!")
            print("\n已配置的指标:")
            for name, success in results.items():
                status = "✅" if success else "❌"
                print(f"  {status} {name}")
            return True
        else:
            print("\n⚠️ 配置完成，但验证失败")
            print("可能原因:")
            print("1. API端点不完全匹配")
            print("2. 权限限制")
            print("3. 字段已存在")

            print("\n建议:")
            print("1. 检查飞书项目管理界面确认字段是否创建")
            print("2. 尝试使用飞书官方MCP工具")
            print("3. 参考项目文档进行手动配置")

            return False

def main():
    """主函数"""
    configurator = QualityMetricsConfigurator()
    success = configurator.run()

    if success:
        print("\n✨ 配置完成! 您现在可以在飞书项目中使用这5个质量指标了。")
    else:
        print("\n💡 提示: 虽然自动配置可能未完全成功，但您可以参考生成的配置手动完成。")

    return success

if __name__ == "__main__":
    main()