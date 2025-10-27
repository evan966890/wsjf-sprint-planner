#!/usr/bin/env python3
"""
智能 OCR 转换器 - 支持多个后端
支持 OCR.space 和百度 OCR，用户可自由选择
用于 WSJF 项目的需求文档识别
"""

import os
import sys
import argparse
import json
from pathlib import Path
from typing import Optional, Literal

# 添加当前目录到路径
sys.path.insert(0, str(Path(__file__).parent))

from simple_ocr import SimpleOCR

try:
    from baidu_ocr import BaiduOCR
    BAIDU_AVAILABLE = True
except ImportError:
    BAIDU_AVAILABLE = False
    print("提示: 百度 OCR 未安装，请运行: pip install baidu-aip")


OCRBackend = Literal['ocrspace', 'baidu', 'auto']


class SmartOCR:
    """智能 OCR 转换器 - 支持多后端切换"""

    def __init__(
        self,
        backend: OCRBackend = 'auto',
        ocrspace_api_key: Optional[str] = None,
        baidu_app_id: Optional[str] = None,
        baidu_api_key: Optional[str] = None,
        baidu_secret_key: Optional[str] = None,
        auto_load_config: bool = True
    ):
        """
        初始化智能 OCR

        Args:
            backend: 后端选择 ('ocrspace', 'baidu', 'auto')
            ocrspace_api_key: OCR.space API Key（可选）
            baidu_app_id: 百度 App ID（可选）
            baidu_api_key: 百度 API Key（可选）
            baidu_secret_key: 百度 Secret Key（可选）
            auto_load_config: 是否自动加载配置文件（默认: True）
        """
        self.backend = backend

        # 初始化 OCR.space
        self.ocrspace = SimpleOCR(api_key=ocrspace_api_key)

        # 自动加载百度配置文件（如果存在且未提供参数）
        if auto_load_config and not all([baidu_app_id, baidu_api_key, baidu_secret_key]):
            config_file = Path(__file__).parent / 'baidu_ocr_config.json'
            if config_file.exists():
                try:
                    with open(config_file, 'r', encoding='utf-8') as f:
                        config = json.load(f)
                    baidu_app_id = baidu_app_id or config.get('app_id')
                    baidu_api_key = baidu_api_key or config.get('api_key')
                    baidu_secret_key = baidu_secret_key or config.get('secret_key')
                except Exception as e:
                    print(f"⚠ 配置文件读取失败: {e}")

        # 初始化百度 OCR（如果可用）
        self.baidu = None
        if BAIDU_AVAILABLE:
            try:
                self.baidu = BaiduOCR(
                    app_id=baidu_app_id,
                    api_key=baidu_api_key,
                    secret_key=baidu_secret_key
                )
            except ValueError as e:
                if backend == 'baidu':
                    raise
                # 如果是 auto 模式，不强制要求百度配置
                print(f"⚠ 百度 OCR 未配置: {e}")
                print("  将只使用 OCR.space")

    def convert_file(
        self,
        input_path: str,
        output_path: Optional[str] = None,
        backend: Optional[OCRBackend] = None,
        high_precision: bool = False
    ) -> str:
        """
        智能转换文件为文本

        Args:
            input_path: 输入文件路径
            output_path: 输出文件路径（可选）
            backend: 后端选择（覆盖初始化时的设置）
            high_precision: 百度 OCR 是否使用高精度版本

        Returns:
            识别的文本内容
        """
        # 确定使用的后端
        use_backend = backend or self.backend

        # Auto 模式：智能选择
        if use_backend == 'auto':
            use_backend = self._auto_select_backend(input_path)
            print(f"🤖 自动选择: {use_backend.upper()}")

        # 根据后端调用对应的 OCR
        if use_backend == 'baidu':
            return self._use_baidu(input_path, output_path, high_precision)
        else:
            return self._use_ocrspace(input_path, output_path)

    def _auto_select_backend(self, input_path: str) -> str:
        """
        自动选择后端

        规则：
        - 如果百度未配置，使用 OCR.space
        - 如果文件名包含中文，优先百度
        - 否则使用 OCR.space（免费额度大）
        """
        if not self.baidu:
            return 'ocrspace'

        # 检查文件名是否包含中文
        filename = Path(input_path).name
        has_chinese = any('\u4e00' <= char <= '\u9fff' for char in filename)

        if has_chinese:
            print("  检测到中文文件名 → 百度 OCR（中文识别更准确）")
            return 'baidu'
        else:
            print("  英文/混合场景 → OCR.space（免费额度更大）")
            return 'ocrspace'

    def _use_ocrspace(self, input_path: str, output_path: Optional[str]) -> str:
        """使用 OCR.space"""
        print(f"🌐 使用 OCR.space")
        return self.ocrspace.convert_file(input_path, output_path)

    def _use_baidu(
        self,
        input_path: str,
        output_path: Optional[str],
        high_precision: bool
    ) -> str:
        """使用百度 OCR"""
        if not self.baidu:
            raise ValueError(
                "百度 OCR 未配置！\n"
                "请设置环境变量或使用 --baidu-* 参数\n"
                "或改用 OCR.space: --backend ocrspace"
            )

        print(f"🇨🇳 使用百度 OCR")
        return self.baidu.convert_file(
            input_path,
            output_path,
            high_precision=high_precision
        )

    def get_available_backends(self) -> list:
        """获取可用的后端列表"""
        backends = ['ocrspace']
        if self.baidu:
            backends.append('baidu')
        return backends

    def print_backend_info(self):
        """打印后端信息"""
        print("\n" + "=" * 60)
        print("可用的 OCR 后端:")
        print("=" * 60)

        # OCR.space
        print("\n1. OCR.space")
        print("   状态: ✅ 可用")
        print("   免费额度: 25,000 次/月")
        print("   优势: 免费额度大，无需认证")
        print("   适合: 中英文混合、快速识别")

        # 百度 OCR
        print("\n2. 百度 OCR")
        if self.baidu:
            print("   状态: ✅ 可用")
            print("   免费额度: 1,000-2,000 次/月")
            print("   优势: 中文识别准确率最高")
            print("   适合: 纯中文、手写、复杂场景")
        else:
            print("   状态: ❌ 未配置")
            print("   配置方法: 设置环境变量 BAIDU_OCR_*")
            print("   或运行: pip install baidu-aip")

        print("\n" + "=" * 60)


def main():
    """命令行入口"""
    parser = argparse.ArgumentParser(
        description="智能 OCR 转换器 - 支持 OCR.space 和百度 OCR",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例用法:
  # 自动选择后端（推荐）
  python smart_ocr.py image.png -o output.txt

  # 指定使用 OCR.space
  python smart_ocr.py image.png -o output.txt --backend ocrspace

  # 指定使用百度 OCR
  python smart_ocr.py image.png -o output.txt --backend baidu

  # 百度 OCR 高精度版本
  python smart_ocr.py image.png -o output.txt --backend baidu --high-precision

  # 查看可用后端
  python smart_ocr.py --list-backends

后端对比:
  OCR.space:
    ✓ 免费额度大（25,000 次/月）
    ✓ 无需认证
    ✓ 国际化支持好
    - 中文准确率良好

  百度 OCR:
    ✓ 中文识别最准确
    ✓ 支持手写、复杂场景
    ✓ 响应速度快
    - 需要实名认证
    - 免费额度少（1,000-2,000 次/月）

配置百度 OCR:
  设置环境变量:
    set BAIDU_OCR_APP_ID=your_app_id
    set BAIDU_OCR_API_KEY=your_api_key
    set BAIDU_OCR_SECRET_KEY=your_secret_key

  或使用命令行参数:
    --baidu-app-id, --baidu-api-key, --baidu-secret-key
        """
    )

    parser.add_argument('input', nargs='?', help='输入文件路径（图片或 PDF）')
    parser.add_argument('-o', '--output', help='输出文件路径（默认打印到终端）')
    parser.add_argument(
        '--backend',
        choices=['ocrspace', 'baidu', 'auto'],
        default='auto',
        help='选择 OCR 后端（默认: auto 自动选择）'
    )
    parser.add_argument('--high-precision', action='store_true', help='百度 OCR 使用高精度版本')
    parser.add_argument('--list-backends', action='store_true', help='列出可用的后端')

    # OCR.space 配置
    parser.add_argument('--ocrspace-api-key', help='OCR.space API Key（可选）')

    # 百度 OCR 配置
    parser.add_argument('--baidu-app-id', help='百度应用 ID')
    parser.add_argument('--baidu-api-key', help='百度 API Key')
    parser.add_argument('--baidu-secret-key', help='百度 Secret Key')

    args = parser.parse_args()

    try:
        # 创建智能 OCR
        smart_ocr = SmartOCR(
            backend=args.backend,
            ocrspace_api_key=args.ocrspace_api_key,
            baidu_app_id=args.baidu_app_id,
            baidu_api_key=args.baidu_api_key,
            baidu_secret_key=args.baidu_secret_key
        )

        # 列出后端
        if args.list_backends:
            smart_ocr.print_backend_info()
            return

        # 检查输入文件
        if not args.input:
            parser.print_help()
            return

        # 转换文件
        text = smart_ocr.convert_file(
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

    except Exception as e:
        print(f"\n❌ 错误: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
