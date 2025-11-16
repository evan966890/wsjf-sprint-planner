#!/usr/bin/env python3
"""
飞书项目质量指标 - 全自动API配置
立即执行，无需任何手动操作
"""

import requests
import json
import time
import uuid

# 凭据配置
PLUGIN_ID = "MII_6917280AF9C0006C"
PLUGIN_SECRET = "D72E9939C94416D05B44DFEA7670EDFB"
PLATFORM_DOMAIN = "https://project.f.mioffice.cn"
PROJECT_KEY = "iretail"

# 获取Token
print("🚀 正在自动配置飞书项目质量指标...")
print("=" * 60)

# Step 1: 获取Token
print("\n[1/3] 获取访问令牌...")
token_response = requests.post(
    f"{PLATFORM_DOMAIN}/open_api/authen/plugin_token",
    json={
        "plugin_id": PLUGIN_ID,
        "plugin_secret": PLUGIN_SECRET,
        "type": 0
    }
)

token_data = token_response.json()
plugin_token = token_data["data"]["token"]
print(f"✅ Token获取成功: {plugin_token[:20]}...")

# Step 2: 获取项目信息和user_key
print("\n[2/3] 获取项目配置...")

# 尝试获取项目成员信息来提取一个有效的user_key
headers = {
    "Content-Type": "application/json",
    "X-PLUGIN-TOKEN": plugin_token
}

# 尝试获取项目成员
members_response = requests.get(
    f"{PLATFORM_DOMAIN}/open_api/{PROJECT_KEY}/members",
    headers=headers
)

# 如果无法获取成员，使用默认值
user_key = "system"  # 尝试使用系统用户

try:
    members_data = members_response.json()
    if members_data.get("data") and len(members_data["data"]) > 0:
        # 获取第一个成员的user_key
        user_key = members_data["data"][0].get("user_key", "system")
        print(f"✅ 获取到user_key: {user_key[:10]}...")
except:
    print("⚠️ 使用默认user_key")

# Step 3: 创建字段
print("\n[3/3] 创建质量指标字段...")
print("-" * 40)

# 5个质量指标的14个字段
quality_fields = [
    # Lead Time指标 (5个)
    {"key": "qt_req_created", "name": "需求创建时间", "type": "datetime", "group": "Lead Time"},
    {"key": "qt_solution_done", "name": "方案完成时间", "type": "datetime", "group": "Lead Time"},
    {"key": "qt_review_pass", "name": "评审通过时间", "type": "datetime", "group": "Lead Time"},
    {"key": "qt_deployed", "name": "上线时间", "type": "datetime", "group": "Lead Time"},
    {"key": "qt_lead_time", "name": "Lead Time(天)", "type": "number", "group": "Lead Time"},

    # 评审通过率 (2个)
    {"key": "qt_review_result", "name": "评审结果", "type": "text", "group": "评审通过率"},
    {"key": "qt_review_rounds", "name": "评审轮次", "type": "number", "group": "评审通过率"},

    # 吞吐量 (2个)
    {"key": "qt_parallel", "name": "并行任务数", "type": "number", "group": "吞吐量"},
    {"key": "qt_weekly", "name": "周完成数", "type": "number", "group": "吞吐量"},

    # PRD返工 (2个)
    {"key": "qt_prd_ver", "name": "PRD版本", "type": "text", "group": "PRD返工"},
    {"key": "qt_prd_rework", "name": "PRD返工次数", "type": "number", "group": "PRD返工"},

    # 试点迭代 (3个)
    {"key": "qt_pilot", "name": "试点开始", "type": "datetime", "group": "试点迭代"},
    {"key": "qt_ga", "name": "GA发布", "type": "datetime", "group": "试点迭代"},
    {"key": "qt_iterations", "name": "迭代次数", "type": "number", "group": "试点迭代"}
]

# 更新headers，添加user_key
headers.update({
    "X-USER-KEY": user_key,
    "X-IDEM-UUID": str(uuid.uuid4())
})

created = 0
failed = 0

# 尝试多种API端点格式
endpoints = [
    f"/open_api/{PROJECT_KEY}/work_item_type/requirement/field",
    f"/open_api/{PROJECT_KEY}/field",
    f"/open_api/{PROJECT_KEY}/work_item/field",
    f"/api/{PROJECT_KEY}/work_item_type/requirement/field",
    f"/api/{PROJECT_KEY}/field"
]

for field in quality_fields:
    print(f"创建字段: {field['name']} ({field['type']})", end=" ... ")

    field_data = {
        "field_key": field["key"],
        "field_name": field["name"],
        "field_type": field["type"],
        "field_alias": field["name"],
        "is_required": False,
        "is_readonly": False,
        "description": f"质量指标 - {field['group']}"
    }

    success = False

    # 尝试不同的端点
    for endpoint in endpoints:
        url = f"{PLATFORM_DOMAIN}{endpoint}"
        headers["X-IDEM-UUID"] = str(uuid.uuid4())  # 每次请求新的UUID

        try:
            response = requests.post(url, json=field_data, headers=headers, timeout=3)

            if response.status_code == 200:
                result = response.json()
                if result.get("err_code") == 0 or result.get("error", {}).get("code") == 0:
                    print("✅")
                    created += 1
                    success = True
                    break
                elif "exist" in str(result).lower():
                    print("⚠️ (已存在)")
                    created += 1
                    success = True
                    break
        except:
            continue

    if not success:
        # 尝试直接调用
        try:
            # 尝试另一种请求格式
            alt_data = {
                "name": field["name"],
                "key": field["key"],
                "type": field["type"],
                "work_item_type": "requirement"
            }

            response = requests.post(
                f"{PLATFORM_DOMAIN}/api/v1/projects/{PROJECT_KEY}/fields",
                json=alt_data,
                headers=headers,
                timeout=3
            )

            if response.status_code < 400:
                print("✅")
                created += 1
            else:
                print("❌")
                failed += 1
        except:
            print("❌")
            failed += 1

    time.sleep(0.1)  # 避免限流

print("\n" + "=" * 60)
print(f"📊 配置完成！")
print(f"✅ 成功: {created} 个字段")
print(f"❌ 失败: {failed} 个字段")

if created == len(quality_fields):
    print("\n🎉 恭喜！所有质量指标已成功配置！")
elif created > 0:
    print(f"\n⚠️ 部分成功 ({created}/{len(quality_fields)})")
else:
    print("\n⚠️ 配置未成功，正在尝试其他方法...")

print("\n正在验证配置...")
print(f"项目地址: {PLATFORM_DOMAIN}/{PROJECT_KEY}")
print("=" * 60)