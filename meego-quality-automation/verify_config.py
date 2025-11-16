#!/usr/bin/env python3
"""
配置验证脚本 - 检查质量指标是否正确配置到飞书项目
"""

import yaml
import sys
from sync_config import FeishuProjectClient, Colors, colored

def verify_configuration():
    """验证配置是否成功应用"""
    print(colored("""
╔══════════════════════════════════════════════════════╗
║           配置验证工具                                ║
║     检查质量指标是否正确配置到飞书项目               ║
╚══════════════════════════════════════════════════════╝
    """, Colors.BLUE))

    # 加载配置
    with open('quality-metrics.yaml', 'r', encoding='utf-8') as f:
        config = yaml.safe_load(f)

    with open('credentials.yaml', 'r', encoding='utf-8') as f:
        credentials = yaml.safe_load(f)

    # 初始化客户端
    client = FeishuProjectClient(
        plugin_id=credentials['plugin_id'],
        plugin_secret=credentials['plugin_secret'],
        user_key=credentials['user_key'],
        project_key=config['project']['key']
    )

    print("\n📋 开始验证配置...\n")

    # 1. 验证字段
    print(colored("1. 验证字段配置", Colors.BOLD))
    work_item_type = config['work_item_type']

    try:
        existing_fields = client.get_fields(work_item_type)
        existing_keys = {f['key'] for f in existing_fields}

        # 收集所有配置的字段
        expected_fields = []
        for metric in config['quality_metrics']:
            for field in metric.get('fields', []):
                expected_fields.append(field)

        success_count = 0
        missing_count = 0

        for field in expected_fields:
            if field['key'] in existing_keys:
                print(f"  ✅ {field['name']}")
                success_count += 1
            else:
                print(colored(f"  ❌ {field['name']} - 未找到", Colors.RED))
                missing_count += 1

        print(f"\n  统计: {success_count} 个已配置, {missing_count} 个缺失")

    except Exception as e:
        print(colored(f"  ❌ 验证失败: {e}", Colors.RED))

    # 2. 验证流程节点
    print(colored("\n2. 验证流程节点", Colors.BOLD))

    try:
        templates = client.get_workflow_templates(work_item_type)
        print(f"  找到 {len(templates)} 个流程模板")

        for node in config.get('workflow_nodes', []):
            print(f"  • {node['name']} ({node['type']})")

    except Exception as e:
        print(colored(f"  ❌ 验证失败: {e}", Colors.RED))

    # 3. 生成验证报告
    print(colored("\n3. 生成验证报告", Colors.BOLD))

    report = {
        'project': config['project']['name'],
        'metrics_configured': len(config['quality_metrics']),
        'fields_total': len(expected_fields),
        'fields_success': success_count,
        'fields_missing': missing_count,
        'workflow_nodes': len(config.get('workflow_nodes', []))
    }

    print("\n" + "=" * 50)
    print(colored("验证报告", Colors.BOLD))
    print("=" * 50)
    print(f"项目名称: {report['project']}")
    print(f"配置指标数: {report['metrics_configured']}")
    print(f"字段总数: {report['fields_total']}")
    print(f"成功配置: {report['fields_success']}")
    print(f"缺失字段: {report['fields_missing']}")
    print(f"流程节点: {report['workflow_nodes']}")
    print("=" * 50)

    if report['fields_missing'] == 0:
        print(colored("\n✅ 所有配置验证通过！", Colors.GREEN + Colors.BOLD))
    else:
        print(colored(f"\n⚠️  有 {report['fields_missing']} 个字段未配置成功", Colors.YELLOW))
        print("建议重新运行 sync_config.py")

if __name__ == "__main__":
    try:
        verify_configuration()
    except Exception as e:
        print(colored(f"\n❌ 验证过程出错: {e}", Colors.RED))
        sys.exit(1)