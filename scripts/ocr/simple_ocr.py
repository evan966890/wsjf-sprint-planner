#!/usr/bin/env python3
"""
简化版 OCR 转换器 - 仅使用在线 API
无需安装额外依赖（PIL、pdf2image 等）
用于 WSJF 项目的需求文档识别
"""

import os
import sys
import argparse
import requests
from pathlib import Path
from typing import Optional


class SimpleOCR:
    """简化版 OCR 转换器 - 仅支持在线 API"""

    def __init__(self, api_key=None):
        """
        初始化 OCR 转换器

        Args:
            api_key: OCR.space API 密钥 (可选，默认使用免费 API)
        """
        self.api_key = api_key or "helloworld"  # 免费 API 密钥
        self.ocr_space_url = "https://api.ocr.space/parse/image"

    def convert_file(self, input_path: str, output_path: Optional[str] = None) -> str:
        """
        转换文件（图片或 PDF）为文本

        Args:
            input_path: 输入文件路径
            output_path: 输出文件路径（可选）

        Returns:
            识别的文本内容
        """
        input_file = Path(input_path)

        if not input_file.exists():
            raise FileNotFoundError(f"文件不存在: {input_path}")

        print(f"📄 正在识别: {input_file.name}")

        # 使用 OCR.space API
        text = self._ocr_space(str(input_file))

        # 保存到文件
        if output_path:
            output_file = Path(output_path)
            output_file.parent.mkdir(parents=True, exist_ok=True)
            output_file.write_text(text, encoding='utf-8')
            print(f"✓ 已保存到: {output_path}")

        return text

    def _ocr_space(self, file_path: str) -> str:
        """
        使用 OCR.space API 识别文件

        特点:
        - 免费额度：25,000 requests/月
        - 支持中英文混合
        - 支持图片和 PDF
        - 无需本地安装任何软件
        """
        print(f"🌐 使用 OCR.space API...")

        with open(file_path, 'rb') as f:
            file_data = f.read()

        # 准备请求
        payload = {
            'apikey': self.api_key,
            'language': 'chs',  # 中文简体（自动支持英文）
            'isOverlayRequired': False,
            'OCREngine': 2,  # Engine 2 支持中文
            'scale': True,  # 提高准确率
            'isTable': True,  # 检测表格
        }

        files = {'file': (Path(file_path).name, file_data)}

        try:
            # 发送请求
            response = requests.post(
                self.ocr_space_url,
                files=files,
                data=payload,
                timeout=60
            )

            if response.status_code != 200:
                raise Exception(f"API 请求失败 (HTTP {response.status_code})")

            result = response.json()

            # 检查错误
            if result.get('IsErroredOnProcessing'):
                error_messages = result.get('ErrorMessage', ['未知错误'])
                error_details = result.get('ErrorDetails', '')
                raise Exception(f"OCR 处理失败: {error_messages[0]} - {error_details}")

            # 提取文本
            parsed_results = result.get('ParsedResults', [])
            if not parsed_results:
                print("⚠ 未识别到文本内容")
                return ""

            text = parsed_results[0].get('ParsedText', '')

            # 统计信息
            char_count = len(text)
            line_count = text.count('\n') + 1
            print(f"  ✓ 识别完成: {char_count} 字符, {line_count} 行")

            return text

        except requests.exceptions.Timeout:
            raise Exception("API 请求超时，请检查网络连接或稍后重试")
        except requests.exceptions.RequestException as e:
            raise Exception(f"网络请求失败: {e}")


def main():
    """命令行入口"""
    parser = argparse.ArgumentParser(
        description="简化版 OCR 转换器 - 将图片和 PDF 转换为文本（使用在线 API）",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例用法:
  # 转换图片
  python simple_ocr.py screenshot.png -o output.txt

  # 转换 PDF（直接支持，无需额外依赖）
  python simple_ocr.py document.pdf -o document.txt

  # 使用自己的 API key（可选）
  python simple_ocr.py image.jpg --api-key YOUR_KEY

支持的格式:
  - 图片: .png, .jpg, .jpeg, .webp, .bmp, .gif, .tiff
  - 文档: .pdf

免费额度:
  - 25,000 requests/月（使用默认 API key）
  - 如需更多，请访问 https://ocr.space/ocrapi 注册免费账号

优点:
  ✓ 无需安装 Tesseract 或其他 OCR 软件
  ✓ 支持中英文混合识别
  ✓ 直接支持 PDF 文件
  ✓ 跨平台（Windows/Mac/Linux）
        """
    )

    parser.add_argument('input', help='输入文件路径（图片或 PDF）')
    parser.add_argument('-o', '--output', help='输出文件路径（默认打印到终端）')
    parser.add_argument('--api-key', help='OCR.space API 密钥（可选，默认使用免费 API）')

    args = parser.parse_args()

    try:
        # 创建转换器
        ocr = SimpleOCR(api_key=args.api_key)

        # 转换文件
        text = ocr.convert_file(args.input, args.output)

        # 如果没有指定输出文件，打印到终端
        if not args.output:
            print("\n" + "=" * 60)
            print("识别结果:")
            print("=" * 60)
            print(text)
            print("=" * 60)

        print("\n✅ 完成!")

    except FileNotFoundError as e:
        print(f"\n❌ 错误: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 错误: {e}", file=sys.stderr)
        print("\n提示: 如果频繁出错，可能是网络问题或 API 限额", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
