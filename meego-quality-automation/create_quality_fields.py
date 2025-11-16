#!/usr/bin/env python3
"""
飞书项目质量指标字段自动创建脚本
基于捕获的真实API创建5个质量指标字段
"""

import requests
import json
import time
import uuid

class QualityFieldsCreator:
    """质量指标字段创建器"""

    def __init__(self):
        """初始化配置"""
        self.base_url = "https://project.f.mioffice.cn"
        self.project_key = "6917068acb0eb4333d5d6b1e"
        self.work_item_type = "story"

        # 从浏览器中获取的认证信息
        self.csrf_token = "EB0Lt4gu-nmqg-Cq8M-2pgo-Qy0DvtsKkqGC"

        # 需要从浏览器Cookie中获取
        self.cookies = {
            # 需要添加实际的cookie值
            # 'session_id': 'xxx',
        }

        self.session = requests.Session()

    def create_field(self, field_data: dict) -> bool:
        """创建单个字段"""
        print(f"\n📝 创建字段: {field_data['name']}...")

        # API端点
        url = f"{self.base_url}/goapi/v3/settings/{self.project_key}/{self.work_item_type}/field"

        # 请求头
        headers = {
            "Content-Type": "application/json",
            "x-meego-csrf-token": self.csrf_token,
            "x-meego-source": "web/-1.0.0.1490",
            "x-meego-from": "web",
            "x-meego-scope": "workObjectSettingfieldManagement",
            "x-lark-gw": "1",
            "locale": "zh",
            "x-content-language": "zh",
            "Accept": "application/json, text/plain, */*",
            "Referer": f"{self.base_url}/iretail/setting/workObject/story?menuTab=fieldManagement",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36"
        }

        # 生成字段key
        field_key = f"field_{uuid.uuid4().hex[:6]}"

        # 请求体
        payload = {
            "sync_uuid": "",
            "field": {
                "scope": ["story"],
                "authorized_roles": ["_anybody"],  # 任何人可访问
                "plg_key": "",
                "validity": {
                    "condition_group": {"conjunction": ""},
                    "usage_mode": "",
                    "value": None
                },
                "default_value": {
                    "condition_group": {"conjunction": ""},
                    "usage_mode": "",
                    "value": None,
                    "bqls": []
                },
                "alias": field_data['alias'],  # 对接标识
                "name": field_data['name'],     # 字段名称
                "tooltip": field_data['description'],  # 字段描述
                "type": "number",  # 数字类型
                "project": self.project_key,
                "key": field_key
            }
        }

        try:
            response = self.session.post(
                url,
                json=payload,
                headers=headers,
                cookies=self.cookies,
                timeout=10
            )

            if response.status_code == 200:
                result = response.json()
                if result.get("code") == 0:
                    print(f"  ✅ 字段创建成功!")
                    return True
                else:
                    print(f"  ❌ API返回错误: {result.get('msg', '未知错误')}")
            else:
                print(f"  ❌ HTTP错误: {response.status_code}")
                print(f"  响应: {response.text[:500]}")

        except Exception as e:
            print(f"  ❌ 异常: {e}")

        return False

    def create_all_quality_fields(self):
        """创建所有质量指标字段"""
        print("\n📊 开始创建5个质量指标字段...")
        print("=" * 60)

        # 定义5个质量指标字段
        fields = [
            {
                "name": "Lead Time（交付周期）",
                "alias": "quality_lead_time",
                "description": "从需求创建到上线的时间（天）"
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

        # 创建字段
        results = {}
        success_count = 0

        # 跳过第一个已创建的字段
        print("\n✅ Lead Time（交付周期）字段已通过UI创建")
        results["Lead Time（交付周期）"] = True
        success_count += 1

        # 创建剩余字段
        for field in fields[1:]:  # 从第二个开始
            success = self.create_field(field)
            results[field['name']] = success

            if success:
                success_count += 1

            # 避免请求过快
            time.sleep(1)

        print("\n" + "=" * 60)
        print(f"📈 配置结果: {success_count}/5 个字段创建成功")
        print("=" * 60)

        # 显示详细结果
        print("\n详细结果:")
        for name, success in results.items():
            status = "✅" if success else "❌"
            print(f"  {status} {name}")

        return results

def main():
    """主函数"""
    print("""
╔══════════════════════════════════════════════════════════════╗
║     🚀 飞书项目质量指标字段自动创建工具                     ║
║                                                              ║
║     项目: iretail (国际零售业务+产品)                       ║
║     目标: 创建5个质量指标字段                               ║
╚══════════════════════════════════════════════════════════════╝
    """)

    print("\n⚠️ 注意事项:")
    print("1. 需要从浏览器获取有效的CSRF Token")
    print("2. 需要从浏览器获取Cookie信息")
    print("3. 第一个字段(Lead Time)已通过UI创建")

    input("\n按Enter键继续...")

    creator = QualityFieldsCreator()
    results = creator.create_all_quality_fields()

    if all(results.values()):
        print("\n🎉 所有质量指标字段创建成功!")
    else:
        print("\n⚠️ 部分字段创建失败，请检查日志")

if __name__ == "__main__":
    main()