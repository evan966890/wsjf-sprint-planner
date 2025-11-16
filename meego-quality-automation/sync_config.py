#!/usr/bin/env python3
"""
飞书项目(Meego)质量指标自动化配置脚本
配置即代码 - 一键同步YAML配置到飞书项目空间
"""

import os
import sys
import yaml
import json
import requests
import time
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from pathlib import Path

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# 添加颜色输出支持
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def colored(text, color):
    """彩色输出"""
    return f"{color}{text}{Colors.ENDC}"

class FeishuProjectClient:
    """飞书项目API客户端"""

    def __init__(self, plugin_id, plugin_secret, user_key, project_key):
        self.plugin_id = plugin_id
        self.plugin_secret = plugin_secret
        self.user_key = user_key
        self.project_key = project_key
        self.base_url = "https://project.feishu.cn/open_api"
        self.token = None
        self.token_expires = None

    def get_token(self) -> str:
        """获取或刷新访问令牌"""
        # 检查token是否仍然有效
        if self.token and self.token_expires and datetime.now() < self.token_expires:
            return self.token

        logger.info("获取新的访问令牌...")
        url = f"{self.base_url}/auth/refresh_token"

        response = requests.post(url, json={
            "plugin_id": self.plugin_id,
            "plugin_secret": self.plugin_secret
        })

        if response.status_code == 200:
            data = response.json()
            if data.get("err_code") == 0:
                self.token = data["data"]["access_token"]
                # Token有效期2小时，提前5分钟刷新
                self.token_expires = datetime.now() + timedelta(hours=2, minutes=-5)
                logger.info(colored("✓ Token获取成功", Colors.GREEN))
                return self.token

        raise Exception(f"获取Token失败: {response.text}")

    def _request(self, method, endpoint, **kwargs) -> Dict:
        """统一的请求方法"""
        token = self.get_token()

        headers = {
            'Content-Type': 'application/json',
            'X-PLUGIN-TOKEN': token,
            'X-USER-KEY': self.user_key
        }

        # 添加幂等性UUID
        if method in ['POST', 'PUT', 'PATCH']:
            import uuid
            headers['X-IDEM-UUID'] = str(uuid.uuid4())

        url = f"{self.base_url}/{self.project_key}/{endpoint}"

        logger.debug(f"{method} {url}")
        response = requests.request(method, url, headers=headers, **kwargs)

        if response.status_code == 200:
            data = response.json()
            if data.get("err_code") == 0:
                return data.get("data", {})
            else:
                raise Exception(f"API错误: {data.get('err_msg')}")
        else:
            raise Exception(f"HTTP {response.status_code}: {response.text}")

    def get_fields(self, work_item_type: str) -> List[Dict]:
        """获取工作项字段列表"""
        return self._request('GET', f'field/{work_item_type}')

    def create_field(self, work_item_type: str, field_config: Dict) -> Dict:
        """创建自定义字段"""
        return self._request('POST', f'field/{work_item_type}/create', json=field_config)

    def update_field(self, work_item_type: str, field_key: str, updates: Dict) -> Dict:
        """更新字段配置"""
        return self._request('PUT', f'field/{work_item_type}/{field_key}', json=updates)

    def get_workflow_templates(self, work_item_type: str) -> List[Dict]:
        """获取流程模板列表"""
        return self._request('GET', f'template_list/{work_item_type}')

    def create_workflow_node(self, work_item_type: str, node_config: Dict) -> Dict:
        """创建流程节点"""
        return self._request('POST', f'process/{work_item_type}/node', json=node_config)

class QualityMetricsConfigurator:
    """质量指标配置器"""

    def __init__(self, config_file: str):
        self.config_file = config_file
        self.config = self._load_config()
        self.client = None

    def _load_config(self) -> Dict:
        """加载YAML配置文件"""
        with open(self.config_file, 'r', encoding='utf-8') as f:
            config = yaml.safe_load(f)
            logger.info(f"加载配置文件: {self.config_file}")
            return config

    def init_client(self, credentials: Dict):
        """初始化API客户端"""
        self.client = FeishuProjectClient(
            plugin_id=credentials['plugin_id'],
            plugin_secret=credentials['plugin_secret'],
            user_key=credentials['user_key'],
            project_key=self.config['project']['key']
        )

    def sync_all(self):
        """同步所有配置到飞书项目"""
        print(f"\n{colored('═' * 60, Colors.BLUE)}")
        print(colored("开始同步质量指标配置到飞书项目", Colors.BOLD))
        print(f"{colored('═' * 60, Colors.BLUE)}\n")

        work_item_type = self.config['work_item_type']

        # 1. 同步字段
        self._sync_fields(work_item_type)

        # 2. 同步流程节点
        self._sync_workflow_nodes(work_item_type)

        # 3. 配置自动化规则
        self._setup_automation_rules()

        print(f"\n{colored('═' * 60, Colors.GREEN)}")
        print(colored("✅ 配置同步完成！", Colors.GREEN + Colors.BOLD))
        print(f"{colored('═' * 60, Colors.GREEN)}")

    def _sync_fields(self, work_item_type: str):
        """同步字段配置（幂等操作）"""
        print(colored("\n📋 同步字段配置...", Colors.BLUE))

        # 获取现有字段
        try:
            existing_fields = self.client.get_fields(work_item_type)
            existing_keys = {f['key'] for f in existing_fields}
        except Exception as e:
            logger.warning(f"无法获取现有字段: {e}")
            existing_keys = set()

        # 遍历配置的质量指标
        for metric in self.config['quality_metrics']:
            print(f"\n处理指标: {colored(metric['name'], Colors.BOLD)}")

            # 处理每个指标的字段
            for field in metric.get('fields', []):
                field_key = field['key']
                field_name = field['name']

                if field_key in existing_keys:
                    print(f"  ↻ 更新字段: {field_name}")
                    self._update_field(work_item_type, field_key, field)
                else:
                    print(f"  + 创建字段: {field_name}")
                    self._create_field(work_item_type, field)

                # 避免触发限流
                time.sleep(0.1)

    def _create_field(self, work_item_type: str, field: Dict):
        """创建字段"""
        field_config = {
            'key': field['key'],
            'name': field['name'],
            'type': field['type'],
            'required': field.get('required', False),
            'default': field.get('default'),
            'options': field.get('options', [])
        }

        try:
            result = self.client.create_field(work_item_type, field_config)
            print(colored(f"    ✓ 成功", Colors.GREEN))
        except Exception as e:
            print(colored(f"    ✗ 失败: {e}", Colors.RED))

    def _update_field(self, work_item_type: str, field_key: str, field: Dict):
        """更新字段（如果需要）"""
        # 这里可以实现字段的更新逻辑
        # 由于飞书API可能不支持所有字段的更新，这里仅作示例
        print(colored(f"    ↻ 已存在，跳过", Colors.YELLOW))

    def _sync_workflow_nodes(self, work_item_type: str):
        """同步流程节点"""
        print(colored("\n🔄 同步流程节点...", Colors.BLUE))

        for node in self.config.get('workflow_nodes', []):
            print(f"  配置节点: {node['name']}")
            try:
                self.client.create_workflow_node(work_item_type, {
                    'key': node['key'],
                    'name': node['name'],
                    'type': node['type'],
                    'required_fields': node.get('required_fields', [])
                })
                print(colored(f"    ✓ 成功", Colors.GREEN))
            except Exception as e:
                if "already exists" in str(e).lower():
                    print(colored(f"    ↻ 已存在", Colors.YELLOW))
                else:
                    print(colored(f"    ✗ 失败: {e}", Colors.RED))

            time.sleep(0.1)

    def _setup_automation_rules(self):
        """设置自动化规则"""
        print(colored("\n⚙️  配置自动化规则...", Colors.BLUE))

        for rule in self.config.get('automation_rules', []):
            print(f"  配置规则: {rule['name']}")
            # 飞书API可能暂不支持通过API配置自动化规则
            # 这里仅作为占位符，实际可能需要UI操作
            print(colored(f"    ℹ 需要在UI中手动配置", Colors.YELLOW))

class ChromeDevToolsDebugger:
    """Chrome DevTools MCP集成 - 用于API调试"""

    def __init__(self):
        self.captured_requests = []

    def start_capture(self):
        """开始捕获网络请求"""
        logger.info("启动Chrome DevTools网络捕获...")
        # 这里可以调用mcp__chrome-devtools工具
        # 由于在Claude Code环境中运行，可以直接使用MCP工具

    def analyze_api_calls(self, url: str) -> List[Dict]:
        """分析捕获的API调用"""
        logger.info(f"分析API调用: {url}")

        # 在实际使用中，这里会调用：
        # mcp__chrome-devtools__navigate_page(url)
        # mcp__chrome-devtools__list_network_requests()

        return self.captured_requests

    def generate_api_code(self, request: Dict) -> str:
        """从捕获的请求生成代码"""
        code = f"""
# 自动生成的API调用代码
url = "{request.get('url')}"
headers = {json.dumps(request.get('headers', {}), indent=4)}
payload = {json.dumps(request.get('payload', {}), indent=4)}
response = requests.post(url, headers=headers, json=payload)
        """
        return code

def main():
    """主函数"""
    print(colored("""
╔══════════════════════════════════════════════════════╗
║     飞书项目(Meego)质量指标自动化配置工具            ║
║         配置即代码 - 告别手动配置的痛苦              ║
╚══════════════════════════════════════════════════════╝
    """, Colors.BLUE + Colors.BOLD))

    # 检查配置文件
    config_file = "quality-metrics.yaml"
    if not Path(config_file).exists():
        print(colored(f"❌ 找不到配置文件: {config_file}", Colors.RED))
        sys.exit(1)

    # 检查认证信息
    credentials_file = "credentials.yaml"
    if Path(credentials_file).exists():
        with open(credentials_file, 'r') as f:
            credentials = yaml.safe_load(f)
    else:
        # 从环境变量读取
        credentials = {
            'plugin_id': os.getenv('FEISHU_PLUGIN_ID'),
            'plugin_secret': os.getenv('FEISHU_PLUGIN_SECRET'),
            'user_key': os.getenv('FEISHU_USER_KEY')
        }

        if not all(credentials.values()):
            print(colored("❌ 缺少认证信息", Colors.RED))
            print("请创建 credentials.yaml 或设置环境变量:")
            print("  - FEISHU_PLUGIN_ID")
            print("  - FEISHU_PLUGIN_SECRET")
            print("  - FEISHU_USER_KEY")
            sys.exit(1)

    try:
        # 初始化配置器
        configurator = QualityMetricsConfigurator(config_file)
        configurator.init_client(credentials)

        # 执行同步
        configurator.sync_all()

        # 可选：使用Chrome DevTools调试
        if '--debug' in sys.argv:
            print(colored("\n🔍 启动Chrome DevTools调试模式...", Colors.BLUE))
            debugger = ChromeDevToolsDebugger()
            debugger.start_capture()

    except Exception as e:
        print(colored(f"\n❌ 配置失败: {e}", Colors.RED))
        logger.exception("详细错误信息:")
        sys.exit(1)

if __name__ == "__main__":
    main()