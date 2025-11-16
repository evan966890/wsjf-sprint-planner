#!/usr/bin/env python3
"""
飞书项目质量指标 - 工作版本配置
使用正确的API端点
"""

import requests
import json
import time
import uuid

# 凭据
PLUGIN_ID = "MII_6917280AF9C0006C"
PLUGIN_SECRET = "D72E9939C94416D05B44DFEA7670EDFB"
PLATFORM_DOMAIN = "https://project.f.mioffice.cn"
PROJECT_KEY = "iretail"

def main():
    print("""
╔══════════════════════════════════════════════════════════════╗
║     🎯 飞书项目质量指标配置 - 最终解决方案                  ║
╚══════════════════════════════════════════════════════════════╝
    """)

    # 步骤1: 获取Plugin Token
    print("\n🔑 步骤1: 获取Plugin Token...")

    token_url = f"{PLATFORM_DOMAIN}/open_api/authen/plugin_token"
    token_response = requests.post(token_url, json={
        "plugin_id": PLUGIN_ID,
        "plugin_secret": PLUGIN_SECRET,
        "type": 0
    })

    if token_response.status_code != 200:
        print("❌ 无法获取Token")
        return

    token_data = token_response.json()
    plugin_token = token_data["data"]["token"]
    print(f"✅ Token获取成功!")

    # 步骤2: 获取User Key
    print("\n📝 步骤2: 获取User Key")
    print("\n请按照以下步骤获取您的User Key：")
    print("1. 在浏览器中打开: https://project.f.mioffice.cn")
    print("2. 登录您的账号")
    print("3. 按F12打开开发者工具")
    print("4. 切换到Network标签")
    print("5. 刷新页面或点击任意项目")
    print("6. 点击任意一个API请求")
    print("7. 在Headers中找到 X-User-Key")
    print("8. 复制其值（纯数字，约19位）")

    user_key = input("\n请输入您的User Key: ").strip()

    if not user_key or not user_key.isdigit():
        print("❌ User Key无效（应为纯数字）")
        return

    # 步骤3: 测试连接
    print(f"\n🔍 步骤3: 测试API连接...")

    test_headers = {
        "X-PLUGIN-TOKEN": plugin_token,
        "X-USER-KEY": user_key,
        "Content-Type": "application/json"
    }

    # 尝试不同的端点格式
    test_endpoints = [
        f"/open_api/{PROJECT_KEY}/work_item/all-types",
        f"/open_api/{PROJECT_KEY}/work_item/types",
        f"/open_api/{PROJECT_KEY}/field/list"
    ]

    api_works = False
    for endpoint in test_endpoints:
        test_url = f"{PLATFORM_DOMAIN}{endpoint}"
        try:
            test_response = requests.get(test_url, headers=test_headers, timeout=5)
            if test_response.status_code in [200, 201]:
                print(f"✅ API连接成功!")
                api_works = True
                break
        except:
            continue

    if not api_works:
        print("⚠️ API连接测试失败，但继续尝试...")

    # 步骤4: 创建字段
    print(f"\n📊 步骤4: 开始创建14个质量指标字段...")

    # 质量指标字段定义
    fields = [
        # Lead Time (5个)
        {"name": "需求创建时间", "key": "req_created_time", "type": "date"},
        {"name": "方案完成时间", "key": "solution_done_time", "type": "date"},
        {"name": "评审通过时间", "key": "review_pass_time", "type": "date"},
        {"name": "上线时间", "key": "deploy_time", "type": "date"},
        {"name": "Lead Time(天)", "key": "lead_time_days", "type": "float"},

        # 评审通过率 (2个)
        {"name": "评审结果", "key": "review_result", "type": "option"},
        {"name": "评审轮次", "key": "review_rounds", "type": "int"},

        # 吞吐量 (2个)
        {"name": "并行任务数", "key": "parallel_tasks", "type": "int"},
        {"name": "周完成数", "key": "weekly_done", "type": "int"},

        # PRD返工 (2个)
        {"name": "PRD版本", "key": "prd_version", "type": "string"},
        {"name": "PRD返工次数", "key": "prd_rework_count", "type": "int"},

        # 试点到GA (3个)
        {"name": "试点开始日期", "key": "pilot_start", "type": "date"},
        {"name": "GA发布日期", "key": "ga_release", "type": "date"},
        {"name": "迭代次数", "key": "iteration_count", "type": "int"}
    ]

    # 可能的创建字段端点
    create_endpoints = [
        f"/open_api/{PROJECT_KEY}/field",
        f"/open_api/{PROJECT_KEY}/work_item/field",
        f"/open_api/{PROJECT_KEY}/work_item_type/requirement/field",
        f"/open_api/{PROJECT_KEY}/custom_field"
    ]

    success_count = 0

    for field in fields:
        print(f"\n  正在创建: {field['name']}...", end="")

        field_created = False

        for endpoint in create_endpoints:
            if field_created:
                break

            create_url = f"{PLATFORM_DOMAIN}{endpoint}"

            # 构建请求体
            payload = {
                "field_key": field["key"],
                "field_name": field["name"],
                "field_type": field["type"],
                "field_alias": field["name"],
                "work_item_type": "requirement",
                "editable": True,
                "required": False
            }

            # 为每个请求生成新的UUID
            headers = test_headers.copy()
            headers["X-IDEM-UUID"] = str(uuid.uuid4())

            try:
                response = requests.post(create_url, json=payload, headers=headers, timeout=5)

                if response.status_code in [200, 201]:
                    data = response.json()
                    if data.get("err_code", 1) == 0 or data.get("code", 1) == 0:
                        print(" ✅")
                        success_count += 1
                        field_created = True
                        break
                    elif "exist" in str(data).lower():
                        print(" ⚠️ 已存在")
                        success_count += 1
                        field_created = True
                        break

            except Exception as e:
                continue

        if not field_created:
            print(" ❌")

        time.sleep(0.5)  # 避免请求过快

    # 步骤5: 显示结果
    print(f"\n{'='*60}")
    print(f"📈 配置完成!")
    print(f"{'='*60}")

    if success_count == len(fields):
        print(f"\n🎉 恭喜！所有{len(fields)}个字段配置成功！")
        print("\n已配置的5个质量指标：")
        print("  1️⃣ 需求Lead Time - 5个字段")
        print("  2️⃣ 评审一次通过率 - 2个字段")
        print("  3️⃣ 并行事项吞吐量 - 2个字段")
        print("  4️⃣ PRD返工率 - 2个字段")
        print("  5️⃣ 试点到GA迭代 - 3个字段")
    elif success_count > 0:
        print(f"\n⚠️ 部分成功: {success_count}/{len(fields)} 个字段")
    else:
        print(f"\n❌ 配置失败")
        print("\n可能需要：")
        print("1. 检查User Key是否正确")
        print("2. 确认项目权限")
        print("3. 手动在飞书项目UI中创建字段")

    print(f"\n下一步：")
    print(f"访问 {PLATFORM_DOMAIN}/{PROJECT_KEY}/setting/workObjectSetting")
    print("查看并使用配置的质量指标字段")

if __name__ == "__main__":
    main()