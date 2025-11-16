#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
飞书项目流程管理配置API客户端 (Python版本)
"""

import json
import time
import uuid
from typing import Dict, List, Optional, Any
import requests
from datetime import datetime


class FeishuProjectAPI:
    """飞书项目API客户端"""

    def __init__(self, config: Dict[str, str]):
        """初始化API客户端

        Args:
            config: 包含 pluginToken, userKey, projectKey 的配置字典
        """
        self.base_url = 'https://project.feishu.cn/open_api'
        self.plugin_token = config['pluginToken']
        self.user_key = config['userKey']
        self.project_key = config['projectKey']

        # 创建会话
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'X-PLUGIN-TOKEN': self.plugin_token,
            'X-USER-KEY': self.user_key
        })

    def _generate_uuid(self) -> str:
        """生成幂等性UUID"""
        return str(uuid.uuid4())

    def _request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Optional[Dict]:
        """发送API请求

        Args:
            method: HTTP方法
            endpoint: API端点
            data: 请求数据

        Returns:
            响应数据或None（如果请求失败）
        """
        url = f"{self.base_url}/{self.project_key}/{endpoint}"

        # 为写操作添加幂等性UUID
        headers = {}
        if method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            headers['X-IDEM-UUID'] = self._generate_uuid()

        try:
            print(f"[API请求] {method} {endpoint}")
            response = self.session.request(
                method=method,
                url=url,
                json=data,
                headers=headers,
                timeout=30
            )

            if response.status_code == 200:
                result = response.json()
                if result.get('err_code') == 0:
                    print(f"[API响应] 成功")
                    return result.get('data')
                else:
                    print(f"[API错误] {result.get('err_msg')}")
                    return None
            else:
                print(f"[HTTP错误] {response.status_code}: {response.text}")
                return None

        except requests.exceptions.RequestException as e:
            print(f"[请求异常] {str(e)}")
            return None

    def get_work_item_types(self) -> Optional[List]:
        """获取工作项类型列表"""
        return self._request('GET', 'work_item_types')

    def get_template_list(self, work_item_type_key: str) -> Optional[List]:
        """获取流程模板列表"""
        return self._request('GET', f'template_list/{work_item_type_key}')

    def get_fields(self, work_item_type_key: str) -> Optional[List]:
        """获取字段列表"""
        return self._request('GET', f'field/{work_item_type_key}')

    def create_custom_field(self, work_item_type_key: str, field_config: Dict) -> Optional[Dict]:
        """创建自定义字段"""
        return self._request('POST', f'field/{work_item_type_key}/create', field_config)

    def update_process_config(self, work_item_type_key: str, process_config: Dict) -> Optional[Dict]:
        """更新流程配置"""
        return self._request('PUT', f'process/{work_item_type_key}/config', process_config)

    def create_process_node(self, work_item_type_key: str, node_config: Dict) -> Optional[Dict]:
        """创建流程节点"""
        return self._request('POST', f'process/{work_item_type_key}/node', node_config)

    def create_transition(self, work_item_type_key: str, transition_config: Dict) -> Optional[Dict]:
        """创建流程转换规则"""
        return self._request('POST', f'process/{work_item_type_key}/transition', transition_config)

    def configure_metrics(self, metrics_config: Dict) -> Optional[Dict]:
        """配置质量指标"""
        return self._request('POST', 'metrics/configure', metrics_config)

    def create_fields_batch(self, work_item_type_key: str, fields: List[Dict]) -> List[Dict]:
        """批量创建字段"""
        results = []
        for field in fields:
            print(f"创建字段: {field['name']}")
            result = self.create_custom_field(work_item_type_key, field)
            results.append({
                'field': field['name'],
                'success': result is not None
            })
            # 避免触发限流
            time.sleep(0.1)
        return results


def configure_workflow():
    """主配置函数"""
    print("===== 飞书项目流程管理配置 =====\n")

    # 读取配置文件
    try:
        with open('workflow-config.json', 'r', encoding='utf-8') as f:
            workflow_config = json.load(f)
    except FileNotFoundError:
        print("错误: 找不到 workflow-config.json 文件")
        return

    # 读取认证配置
    try:
        with open('auth-config.json', 'r', encoding='utf-8') as f:
            auth_config = json.load(f)
    except FileNotFoundError:
        print("错误: 请先创建 auth-config.json 文件配置认证信息")
        print("可以复制 auth-config-template.json 并填入您的认证信息")
        return

    # 初始化API客户端
    api = FeishuProjectAPI(auth_config)

    print("1. 获取现有工作项类型...")
    work_item_types = api.get_work_item_types()
    if work_item_types:
        print(f"工作项类型: {json.dumps(work_item_types, ensure_ascii=False, indent=2)}")

    print("\n2. 获取需求工作项的流程模板...")
    templates = api.get_template_list('requirement')
    if templates:
        print(f"流程模板: {json.dumps(templates, ensure_ascii=False, indent=2)}")

    print("\n3. 创建流程管理字段...")
    all_fields = []

    # 收集所有节点的字段
    for node in workflow_config['processManagement']['nodes']:
        for field in node['fields']:
            # 避免重复
            if not any(f['key'] == field['key'] for f in all_fields):
                all_fields.append({
                    'key': field['key'],
                    'name': field['name'],
                    'type': field['type'],
                    'required': field.get('required', False),
                    'description': field.get('description', ''),
                    'options': field.get('options'),
                    'default': field.get('default')
                })

    print(f"准备创建 {len(all_fields)} 个字段")
    field_results = api.create_fields_batch('requirement', all_fields)

    print("\n字段创建结果:")
    for result in field_results:
        status = "✅ 成功" if result['success'] else "❌ 失败"
        print(f"  - {result['field']}: {status}")

    print("\n4. 创建流程节点...")
    for node in workflow_config['processManagement']['nodes']:
        print(f"创建节点: {node['name']}")
        node_result = api.create_process_node('requirement', {
            'id': node['id'],
            'name': node['name'],
            'type': node['type'],
            'fields': [f['key'] for f in node['fields']]
        })

        if node_result:
            print(f"  ✅ {node['name']} 创建成功")
        else:
            print(f"  ❌ {node['name']} 创建失败")

        time.sleep(0.1)

    print("\n5. 创建流程转换规则...")
    for transition in workflow_config['processManagement']['transitions']:
        print(f"创建转换: {transition['name']}")
        transition_result = api.create_transition('requirement', transition)

        if transition_result:
            print(f"  ✅ {transition['name']} 创建成功")
        else:
            print(f"  ❌ {transition['name']} 创建失败")

        time.sleep(0.1)

    print("\n6. 配置质量指标...")
    metrics_result = api.configure_metrics(workflow_config['qualityMetrics'])
    if metrics_result:
        print("✅ 质量指标配置成功")
    else:
        print("❌ 质量指标配置失败")

    print("\n===== 配置完成 =====")

    # 生成配置报告
    report = {
        'timestamp': datetime.now().isoformat(),
        'project': auth_config['projectKey'],
        'fields': {
            'total': len(all_fields),
            'created': sum(1 for r in field_results if r['success']),
            'failed': sum(1 for r in field_results if not r['success'])
        },
        'nodes': len(workflow_config['processManagement']['nodes']),
        'transitions': len(workflow_config['processManagement']['transitions']),
        'metrics': len(workflow_config['qualityMetrics'])
    }

    with open('configuration-report.json', 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print("\n配置报告已保存到 configuration-report.json")


if __name__ == '__main__':
    configure_workflow()