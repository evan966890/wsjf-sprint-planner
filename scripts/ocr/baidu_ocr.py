#!/usr/bin/env python3
"""
百度 OCR 转换器
支持通用文字识别、高精度识别
用于 WSJF 项目的需求文档识别
"""

import os
import sys
import argparse
import json
from pathlib import Path
from typing import Optional

try:
    from aip import AipOcr
except ImportError:
    print("错误: 请先安装百度 AI SDK")
    print("运行: pip install baidu-aip")
    sys.exit(1)


class BaiduOCR:
    """百度 OCR 转换器类"""

    def __init__(self, app_id: str = None, api_key: str = None, secret_key: str = None):
        """
        初始化百度 OCR

        Args:
            app_id: 百度应用 ID
            api_key: API Key
            secret_key: Secret Key
        """
        # 从环境变量或参数获取配置
        self.app_id = app_id or os.getenv('BAIDU_OCR_APP_ID')
        self.api_key = api_key or os.getenv('BAIDU_OCR_API_KEY')
        self.secret_key = secret_key or os.getenv('BAIDU_OCR_SECRET_KEY')

        if not all([self.app_id, self.api_key, self.secret_key]):
            raise ValueError(
                "缺少百度 OCR 配置！请设置以下环境变量：\n"
                "  BAIDU_OCR_APP_ID\n"
                "  BAIDU_OCR_API_KEY\n"
                "  BAIDU_OCR_SECRET_KEY\n"
                "或在命令行中指定参数。\n\n"
                "获取方法：\n"
                "1. 访问 https://ai.baidu.com\n"
                "2. 注册并创建应用\n"
                "3. 获取 API Key 和 Secret Key"
            )

        # 初始化客户端
        self.client = AipOcr(self.app_id, self.api_key, self.secret_key)

    def convert_file(
        self,
        input_path: str,
        output_path: Optional[str] = None,
        high_precision: bool = False,
        detect_language: bool = True
    ) -> str:
        """
        转换文件（图片或 PDF）为文本

        Args:
            input_path: 输入文件路径
            output_path: 输出文件路径（可选）
            high_precision: 是否使用高精度版本
            detect_language: 是否检测语言

        Returns:
            识别的文本内容
        """
        input_file = Path(input_path)

        if not input_file.exists():
            raise FileNotFoundError(f"文件不存在: {input_path}")

        print(f"📄 正在识别: {input_file.name}")

        # 读取图片
        with open(input_path, 'rb') as f:
            image = f.read()

        # 设置识别选项
        options = {}
        if detect_language:
            options['language_type'] = 'CHN_ENG'  # 中英文混合
        options['detect_direction'] = 'true'  # 检测图片方向
        options['probability'] = 'true'  # 返回识别结果的置信度

        try:
            # 调用 OCR
            if high_precision:
                print("🔍 使用高精度版本识别...")
                result = self.client.basicAccurate(image, options)
            else:
                print("🔍 使用通用版本识别...")
                result = self.client.basicGeneral(image, options)

            # 检查错误
            if 'error_code' in result:
                error_msg = result.get('error_msg', '未知错误')
                error_code = result.get('error_code')
                raise Exception(f"百度 OCR 错误 [{error_code}]: {error_msg}")

            # 提取文本
            words_result = result.get('words_result', [])
            if not words_result:
                print("⚠ 未识别到文本内容")
                return ""

            # 拼接文本
            text_lines = [item['words'] for item in words_result]
            text = '\n'.join(text_lines)

            # 统计信息
            char_count = len(text)
            line_count = len(text_lines)
            print(f"  ✓ 识别完成: {char_count} 字符, {line_count} 行")

            # 显示置信度（如果有）
            if words_result and 'probability' in words_result[0]:
                avg_confidence = sum(
                    item.get('probability', {}).get('average', 0)
                    for item in words_result
                ) / len(words_result)
                print(f"  ℹ 平均置信度: {avg_confidence:.2%}")

            # 保存到文件
            if output_path:
                output_file = Path(output_path)
                output_file.parent.mkdir(parents=True, exist_ok=True)
                output_file.write_text(text, encoding='utf-8')
                print(f"  ✓ 已保存到: {output_path}")

            return text

        except Exception as e:
            print(f"\n❌ 识别失败: {e}")
            raise

    def get_quota_info(self) -> dict:
        """
        获取配额信息（通过尝试调用判断）

        Returns:
            配额信息字典
        """
        # 注意：百度 OCR 没有直接查询配额的 API
        # 只能通过错误信息判断
        return {
            "note": "百度 OCR 没有直接查询配额的 API",
            "free_tier": "个人认证: 1,000次/月, 企业认证: 2,000次/月",
            "check_method": "通过调用结果判断是否超出配额"
        }


def load_config_from_file(config_path: str = None) -> dict:
    """
    从配置文件加载百度 OCR 配置

    Args:
        config_path: 配置文件路径

    Returns:
        配置字典
    """
    if not config_path:
        # 默认配置文件路径
        config_path = Path(__file__).parent / 'baidu_ocr_config.json'

    if not Path(config_path).exists():
        return {}

    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"⚠ 配置文件读取失败: {e}")
        return {}


def main():
    """命令行入口"""
    parser = argparse.ArgumentParser(
        description="百度 OCR 转换器 - 将图片转换为文本（中文识别准确率最高）",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例用法:
  # 基础用法（需要先配置环境变量）
  python baidu_ocr.py image.png -o output.txt

  # 使用高精度版本
  python baidu_ocr.py image.png -o output.txt --high-precision

  # 指定 API 配置
  python baidu_ocr.py image.png \\
    --app-id YOUR_APP_ID \\
    --api-key YOUR_API_KEY \\
    --secret-key YOUR_SECRET_KEY

配置方法:
  方法1: 环境变量（推荐）
    set BAIDU_OCR_APP_ID=your_app_id
    set BAIDU_OCR_API_KEY=your_api_key
    set BAIDU_OCR_SECRET_KEY=your_secret_key

  方法2: 配置文件
    创建 baidu_ocr_config.json:
    {
      "app_id": "your_app_id",
      "api_key": "your_api_key",
      "secret_key": "your_secret_key"
    }

  方法3: 命令行参数
    使用 --app-id, --api-key, --secret-key

获取 API Key:
  1. 访问 https://ai.baidu.com
  2. 注册账号并实名认证
  3. 创建应用
  4. 获取 App ID, API Key, Secret Key

免费额度:
  - 个人认证: 1,000 次/月
  - 企业认证: 2,000 次/月
  - 超出后付费: ¥0.004-0.008/次
        """
    )

    parser.add_argument('input', help='输入文件路径（图片或 PDF）')
    parser.add_argument('-o', '--output', help='输出文件路径（默认打印到终端）')
    parser.add_argument('--high-precision', action='store_true', help='使用高精度版本（更准确但额度消耗更快）')
    parser.add_argument('--app-id', help='百度应用 ID')
    parser.add_argument('--api-key', help='百度 API Key')
    parser.add_argument('--secret-key', help='百度 Secret Key')
    parser.add_argument('--config', help='配置文件路径')

    args = parser.parse_args()

    try:
        # 加载配置
        config = load_config_from_file(args.config)

        # 命令行参数优先
        app_id = args.app_id or config.get('app_id')
        api_key = args.api_key or config.get('api_key')
        secret_key = args.secret_key or config.get('secret_key')

        # 创建转换器
        ocr = BaiduOCR(
            app_id=app_id,
            api_key=api_key,
            secret_key=secret_key
        )

        # 转换文件
        text = ocr.convert_file(
            args.input,
            args.output,
            high_precision=args.high_precision
        )

        # 如果没有指定输出文件，打印到终端
        if not args.output:
            print("\n" + "=" * 60)
            print("识别结果:")
            print("=" * 60)
            print(text)
            print("=" * 60)

        print("\n✅ 完成!")

    except ValueError as e:
        print(f"\n❌ 配置错误: {e}", file=sys.stderr)
        print("\n提示: 运行 'python baidu_ocr.py --help' 查看配置方法")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 错误: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
