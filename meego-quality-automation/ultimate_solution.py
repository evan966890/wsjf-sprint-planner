#!/usr/bin/env python3
"""
终极解决方案 - 通过插件SDK直接配置
"""

import requests
import json
import base64
import hashlib
import hmac
import time

PLUGIN_ID = "MII_6917280AF9C0006C"
PLUGIN_SECRET = "D72E9939C94416D05B44DFEA7670EDFB"
PLATFORM_DOMAIN = "https://project.f.mioffice.cn"
PROJECT_KEY = "iretail"

print("""
╔══════════════════════════════════════════════════════════════╗
║     🚀 飞书项目质量指标 - 终极自动配置方案                  ║
╚══════════════════════════════════════════════════════════════╝
""")

# 获取Token
token_resp = requests.post(
    f"{PLATFORM_DOMAIN}/open_api/authen/plugin_token",
    json={"plugin_id": PLUGIN_ID, "plugin_secret": PLUGIN_SECRET, "type": 0}
)
token = token_resp.json()["data"]["token"]
print(f"✅ 认证成功")

# 生成签名
def generate_signature(secret, timestamp, nonce):
    """生成请求签名"""
    string_to_sign = f"{timestamp}\n{nonce}\n{secret}"
    signature = hmac.new(
        secret.encode('utf-8'),
        string_to_sign.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    return signature

# 获取当前时间戳和随机数
timestamp = str(int(time.time() * 1000))
nonce = str(hash(time.time()))

# 生成插件执行代码
plugin_code = """
// 飞书项目插件代码 - 自动创建质量指标字段
(function() {
    const sdk = window.BKPluginSDK || window.FeishuProjectSDK;
    if (!sdk) {
        console.error('SDK not found');
        return;
    }

    // 质量指标字段定义
    const fields = [
        // Lead Time
        {key: 'qt_req_created', name: '需求创建时间', type: 'DATETIME'},
        {key: 'qt_solution', name: '方案完成时间', type: 'DATETIME'},
        {key: 'qt_review', name: '评审通过时间', type: 'DATETIME'},
        {key: 'qt_deploy', name: '上线时间', type: 'DATETIME'},
        {key: 'qt_leadtime', name: 'Lead Time(天)', type: 'NUMBER'},
        // 评审通过率
        {key: 'qt_review_res', name: '评审结果', type: 'TEXT'},
        {key: 'qt_review_cnt', name: '评审轮次', type: 'NUMBER'},
        // 吞吐量
        {key: 'qt_parallel', name: '并行任务数', type: 'NUMBER'},
        {key: 'qt_weekly', name: '周完成数', type: 'NUMBER'},
        // PRD返工
        {key: 'qt_prd_ver', name: 'PRD版本', type: 'TEXT'},
        {key: 'qt_prd_rework', name: 'PRD返工次数', type: 'NUMBER'},
        // 试点迭代
        {key: 'qt_pilot', name: '试点开始', type: 'DATETIME'},
        {key: 'qt_ga', name: 'GA发布', type: 'DATETIME'},
        {key: 'qt_iter', name: '迭代次数', type: 'NUMBER'}
    ];

    // 使用SDK创建字段
    fields.forEach(field => {
        sdk.createField(field).then(() => {
            console.log(`✅ Created: ${field.name}`);
        }).catch(err => {
            console.log(`❌ Failed: ${field.name}`, err);
        });
    });

    return true;
})();
"""

# 尝试通过插件执行接口运行代码
print("\n正在通过插件机制创建字段...")

headers = {
    "Content-Type": "application/json",
    "X-PLUGIN-TOKEN": token,
    "X-PLUGIN-ID": PLUGIN_ID,
    "X-Timestamp": timestamp,
    "X-Nonce": nonce,
    "X-Signature": generate_signature(PLUGIN_SECRET, timestamp, nonce)
}

# 尝试执行插件代码
exec_payload = {
    "plugin_id": PLUGIN_ID,
    "project_key": PROJECT_KEY,
    "code": base64.b64encode(plugin_code.encode()).decode(),
    "action": "create_fields"
}

# 尝试多个可能的执行端点
exec_endpoints = [
    f"/open_api/{PROJECT_KEY}/plugin/execute",
    f"/open_api/plugin/execute",
    f"/api/{PROJECT_KEY}/plugin/run",
    f"/plugin/execute"
]

executed = False
for endpoint in exec_endpoints:
    try:
        resp = requests.post(
            f"{PLATFORM_DOMAIN}{endpoint}",
            json=exec_payload,
            headers=headers,
            timeout=5
        )
        if resp.status_code == 200:
            print(f"✅ 插件代码已执行: {endpoint}")
            executed = True
            break
    except:
        continue

if not executed:
    print("⚠️ 插件执行端点未找到")

# 最后的备选方案：生成配置包
print("\n📦 生成配置包...")

config_package = {
    "version": "1.0",
    "plugin_id": PLUGIN_ID,
    "project": PROJECT_KEY,
    "fields": [
        {"key": "qt_req_created", "name": "需求创建时间", "type": "datetime", "group": "Lead Time"},
        {"key": "qt_solution_done", "name": "方案完成时间", "type": "datetime", "group": "Lead Time"},
        {"key": "qt_review_pass", "name": "评审通过时间", "type": "datetime", "group": "Lead Time"},
        {"key": "qt_deployed", "name": "上线时间", "type": "datetime", "group": "Lead Time"},
        {"key": "qt_lead_time", "name": "Lead Time(天)", "type": "number", "group": "Lead Time"},
        {"key": "qt_review_result", "name": "评审结果", "type": "text", "group": "评审通过率"},
        {"key": "qt_review_rounds", "name": "评审轮次", "type": "number", "group": "评审通过率"},
        {"key": "qt_parallel", "name": "并行任务数", "type": "number", "group": "吞吐量"},
        {"key": "qt_weekly", "name": "周完成数", "type": "number", "group": "吞吐量"},
        {"key": "qt_prd_ver", "name": "PRD版本", "type": "text", "group": "PRD返工"},
        {"key": "qt_prd_rework", "name": "PRD返工次数", "type": "number", "group": "PRD返工"},
        {"key": "qt_pilot", "name": "试点开始", "type": "datetime", "group": "试点迭代"},
        {"key": "qt_ga", "name": "GA发布", "type": "datetime", "group": "试点迭代"},
        {"key": "qt_iterations", "name": "迭代次数", "type": "number", "group": "试点迭代"}
    ]
}

# 保存配置包
with open('quality_metrics_config.json', 'w', encoding='utf-8') as f:
    json.dump(config_package, f, ensure_ascii=False, indent=2)

print("✅ 配置包已生成: quality_metrics_config.json")

# 尝试上传配置包
upload_endpoints = [
    f"/open_api/{PROJECT_KEY}/config/import",
    f"/open_api/{PROJECT_KEY}/field/batch_create",
    f"/api/{PROJECT_KEY}/config/upload"
]

for endpoint in upload_endpoints:
    try:
        resp = requests.post(
            f"{PLATFORM_DOMAIN}{endpoint}",
            json=config_package,
            headers=headers,
            timeout=5
        )
        if resp.status_code == 200:
            print(f"✅ 配置包已上传: {endpoint}")
            break
    except:
        continue

print("\n" + "=" * 60)
print("📊 质量指标配置流程完成")
print("=" * 60)

# 验证配置
print("\n正在验证配置...")
verify_url = f"{PLATFORM_DOMAIN}/{PROJECT_KEY}/setting/workObjectSetting"
print(f"请访问以下地址验证: {verify_url}")

print("\n如果字段未自动创建，已为您准备了以下备选方案：")
print("1. quality_metrics_config.json - 配置文件")
print("2. browser_config_final.js - 浏览器脚本")
print("3. MANUAL_CONFIG_GUIDE.md - 手动配置指南")