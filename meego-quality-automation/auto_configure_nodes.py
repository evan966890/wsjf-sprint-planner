#!/usr/bin/env python3
"""
飞书项目质量指标 - 自动配置流程节点
"""

import requests
import json
import time

# 配置
PLUGIN_TOKEN = "p-842f5987-6421-4d28-8a74-b6300f4a3fe8"
USER_KEY = "7541721806923694188"
PROJECT_KEY = "iretail"
BASE_URL = "https://project.f.mioffice.cn"

def configure_quality_nodes():
    """自动配置5个质量指标的流程节点"""

    print("🚀 开始自动配置质量指标流程节点...")
    print("=" * 60)

    # 5个质量指标的流程节点定义
    quality_metrics = {
        "1. 需求Lead Time": {
            "description": "从需求创建到上线的时间",
            "nodes": [
                {"name": "需求创建", "type": "start", "record": "创建时间"},
                {"name": "方案设计", "type": "process", "record": "方案完成时间"},
                {"name": "评审", "type": "approval", "record": "评审通过时间"},
                {"name": "开发", "type": "process", "record": "开发完成时间"},
                {"name": "测试", "type": "process", "record": "测试通过时间"},
                {"name": "上线部署", "type": "end", "record": "上线时间"}
            ],
            "calculation": "上线时间 - 创建时间 = Lead Time(天)"
        },

        "2. 评审一次通过率": {
            "description": "评审一次通过的比例",
            "nodes": [
                {"name": "评审准备", "type": "process"},
                {"name": "评审中", "type": "approval", "record": "评审结果(一次通过/需修改/未通过)"},
                {"name": "评审完成", "type": "process", "record": "评审轮次"}
            ],
            "calculation": "一次通过数 / 总评审数 × 100%"
        },

        "3. 并行事项吞吐量": {
            "description": "团队并行处理能力",
            "nodes": [
                {"name": "并行进行中", "type": "process", "record": "并行任务数"},
                {"name": "本周完成", "type": "process", "record": "周完成数"}
            ],
            "calculation": "周完成数 / 并行任务数"
        },

        "4. PRD返工率": {
            "description": "需求文档的返工频率",
            "nodes": [
                {"name": "PRD初稿", "type": "start", "record": "版本号"},
                {"name": "PRD评审", "type": "approval"},
                {"name": "PRD修改", "type": "process", "record": "返工次数"},
                {"name": "PRD定稿", "type": "end"}
            ],
            "calculation": "返工次数 / PRD总数 × 100%"
        },

        "5. 试点到GA迭代": {
            "description": "从试点到全面推广的迭代次数",
            "nodes": [
                {"name": "试点启动", "type": "start", "record": "试点开始日期"},
                {"name": "试点验证", "type": "process"},
                {"name": "迭代优化", "type": "process", "record": "迭代次数"},
                {"name": "GA发布", "type": "end", "record": "GA发布日期"}
            ],
            "calculation": "迭代次数"
        }
    }

    # 输出配置方案
    for metric_name, metric_config in quality_metrics.items():
        print(f"\n📊 {metric_name}")
        print(f"   描述: {metric_config['description']}")
        print(f"   节点数: {len(metric_config['nodes'])}")
        print(f"   计算方式: {metric_config['calculation']}")

        print("\n   流程节点:")
        for i, node in enumerate(metric_config['nodes'], 1):
            node_info = f"   {i}. {node['name']} ({node['type']})"
            if 'record' in node:
                node_info += f" - 记录: {node['record']}"
            print(node_info)

    print("\n" + "=" * 60)
    print("📝 配置方式:")
    print("\n由于飞书项目的流程节点配置API不公开，需要通过以下方式配置：")
    print("\n1. 【推荐】使用飞书项目的流程模板功能")
    print("   - 导入预设的质量指标流程模板")
    print("   - 一键应用到项目中")

    print("\n2. 【备选】通过UI批量创建")
    print("   - 使用浏览器自动化脚本")
    print("   - 自动点击和填写表单")

    print("\n3. 【手动】在流程管理界面配置")
    print("   - 路径：空间配置 > 工作项管理 > 需求 > 流程管理")
    print("   - 按照上述节点列表创建")

    print("\n" + "=" * 60)
    print("✅ 质量指标流程节点方案已生成")
    print("\n总计需要创建:")
    total_nodes = sum(len(m['nodes']) for m in quality_metrics.values())
    print(f"  • {len(quality_metrics)} 个质量指标")
    print(f"  • {total_nodes} 个流程节点")

    # 生成流程配置JSON
    config_json = {
        "project_key": PROJECT_KEY,
        "quality_metrics": quality_metrics,
        "total_nodes": total_nodes,
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
    }

    with open("quality_nodes_config.json", "w", encoding="utf-8") as f:
        json.dump(config_json, f, ensure_ascii=False, indent=2)

    print(f"\n💾 配置已保存到: quality_nodes_config.json")

    return config_json

if __name__ == "__main__":
    configure_quality_nodes()