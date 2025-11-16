#!/usr/bin/env python3
"""
深度API测试 - 找到正确的字段创建方式
"""

import requests
import json
import time
import uuid

PLUGIN_ID = "MII_6917280AF9C0006C"
PLUGIN_SECRET = "D72E9939C94416D05B44DFEA7670EDFB"
PLATFORM_DOMAIN = "https://project.f.mioffice.cn"
PROJECT_KEY = "iretail"

print("🔍 深度API测试 - 寻找正确的配置方法...")
print("=" * 60)

# 获取Token
token_resp = requests.post(
    f"{PLATFORM_DOMAIN}/open_api/authen/plugin_token",
    json={"plugin_id": PLUGIN_ID, "plugin_secret": PLUGIN_SECRET, "type": 0}
)
token = token_resp.json()["data"]["token"]
print(f"✅ Token: {token[:20]}...")

headers = {
    "Content-Type": "application/json",
    "X-PLUGIN-TOKEN": token
}

# 1. 尝试获取工作项类型定义
print("\n[测试1] 获取工作项类型...")
endpoints = [
    f"/open_api/{PROJECT_KEY}/work_item_types",
    f"/open_api/{PROJECT_KEY}/work_item_type",
    f"/open_api/work_item_types",
    f"/api/{PROJECT_KEY}/work_item_types"
]

for endpoint in endpoints:
    try:
        resp = requests.get(f"{PLATFORM_DOMAIN}{endpoint}", headers=headers, timeout=3)
        if resp.status_code == 200:
            data = resp.json()
            print(f"✅ 成功: {endpoint}")
            print(f"   响应: {json.dumps(data, ensure_ascii=False)[:200]}...")
            break
    except:
        continue

# 2. 尝试获取现有字段
print("\n[测试2] 获取现有字段配置...")
field_endpoints = [
    f"/open_api/{PROJECT_KEY}/field",
    f"/open_api/{PROJECT_KEY}/fields",
    f"/open_api/{PROJECT_KEY}/work_item/fields",
    f"/open_api/{PROJECT_KEY}/work_item_type/requirement/fields"
]

for endpoint in field_endpoints:
    try:
        resp = requests.get(f"{PLATFORM_DOMAIN}{endpoint}", headers=headers, timeout=3)
        if resp.status_code == 200:
            data = resp.json()
            print(f"✅ 成功: {endpoint}")
            print(f"   响应: {json.dumps(data, ensure_ascii=False)[:200]}...")
            break
    except:
        continue

# 3. 尝试获取项目信息
print("\n[测试3] 获取项目详情...")
project_endpoints = [
    f"/open_api/{PROJECT_KEY}/project",
    f"/open_api/project/{PROJECT_KEY}",
    f"/api/{PROJECT_KEY}/info"
]

for endpoint in project_endpoints:
    try:
        resp = requests.get(f"{PLATFORM_DOMAIN}{endpoint}", headers=headers, timeout=3)
        if resp.status_code == 200:
            print(f"✅ 成功: {endpoint}")
            break
    except:
        continue

# 4. 尝试不同的创建字段方法
print("\n[测试4] 尝试创建测试字段...")

# 测试字段
test_field = {
    "field_key": "test_quality_metric",
    "field_name": "测试质量指标",
    "field_type": "text",
    "description": "自动化测试字段"
}

create_endpoints = [
    (f"/open_api/{PROJECT_KEY}/field", "POST"),
    (f"/open_api/{PROJECT_KEY}/custom_field", "POST"),
    (f"/open_api/{PROJECT_KEY}/work_item_type/requirement/field", "POST"),
    (f"/api/{PROJECT_KEY}/fields", "POST"),
    (f"/open_api/field/create", "POST")
]

for endpoint, method in create_endpoints:
    headers["X-IDEM-UUID"] = str(uuid.uuid4())

    # 尝试不同的请求体格式
    formats = [
        test_field,  # 原始格式
        {"field": test_field},  # 嵌套格式
        {"data": test_field},  # data包装
        {**test_field, "project_key": PROJECT_KEY},  # 添加project_key
        {**test_field, "work_item_type": "requirement"}  # 添加work_item_type
    ]

    for fmt in formats:
        try:
            if method == "POST":
                resp = requests.post(f"{PLATFORM_DOMAIN}{endpoint}", json=fmt, headers=headers, timeout=3)
            else:
                resp = requests.put(f"{PLATFORM_DOMAIN}{endpoint}", json=fmt, headers=headers, timeout=3)

            if resp.status_code == 200:
                result = resp.json()
                if result.get("err_code") == 0 or result.get("error", {}).get("code") == 0:
                    print(f"✅ 成功创建字段!")
                    print(f"   端点: {endpoint}")
                    print(f"   格式: {json.dumps(fmt, ensure_ascii=False)[:100]}")

                    # 如果成功，使用这个格式创建所有字段
                    print("\n🚀 找到正确的API格式！开始批量创建...")

                    # 创建所有14个字段
                    fields = [
                        ("qt_req_created", "需求创建时间", "datetime"),
                        ("qt_solution_done", "方案完成时间", "datetime"),
                        ("qt_review_pass", "评审通过时间", "datetime"),
                        ("qt_deployed", "上线时间", "datetime"),
                        ("qt_lead_time", "Lead Time(天)", "number"),
                        ("qt_review_result", "评审结果", "text"),
                        ("qt_review_rounds", "评审轮次", "number"),
                        ("qt_parallel", "并行任务数", "number"),
                        ("qt_weekly", "周完成数", "number"),
                        ("qt_prd_ver", "PRD版本", "text"),
                        ("qt_prd_rework", "PRD返工次数", "number"),
                        ("qt_pilot", "试点开始", "datetime"),
                        ("qt_ga", "GA发布", "datetime"),
                        ("qt_iterations", "迭代次数", "number")
                    ]

                    success_count = 0
                    for key, name, ftype in fields:
                        field_data = fmt.copy()
                        field_data.update({
                            "field_key": key,
                            "field_name": name,
                            "field_type": ftype
                        })

                        headers["X-IDEM-UUID"] = str(uuid.uuid4())

                        try:
                            r = requests.post(f"{PLATFORM_DOMAIN}{endpoint}", json=field_data, headers=headers, timeout=3)
                            if r.status_code == 200:
                                print(f"✅ {name}")
                                success_count += 1
                            else:
                                print(f"❌ {name}")
                        except:
                            print(f"❌ {name}")

                        time.sleep(0.1)

                    print(f"\n✅ 成功创建 {success_count}/14 个字段")
                    exit(0)

        except Exception as e:
            continue

print("\n❌ 未找到正确的API格式")
print("\n可能需要：")
print("1. 在项目空间授予插件更多权限")
print("2. 使用user_key（从飞书客户端获取）")
print("3. 使用其他认证方式")
print("=" * 60)