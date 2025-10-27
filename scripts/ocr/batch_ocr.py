#!/usr/bin/env python3
"""
批量 OCR 处理工具
支持批量处理文件夹中的所有图片和 PDF
用于批量识别本地文件
"""

import os
import sys
import argparse
from pathlib import Path
from typing import List
import time

# 添加当前目录到路径
sys.path.insert(0, str(Path(__file__).parent))

from smart_ocr import SmartOCR


class BatchOCR:
    """批量 OCR 处理器"""

    # 支持的图片格式
    IMAGE_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif', '.tiff', '.tif'}
    # 支持的文档格式
    DOC_EXTENSIONS = {'.pdf'}

    def __init__(self, backend='auto', output_dir='ocr_output'):
        """
        初始化批量处理器

        Args:
            backend: OCR 后端 ('auto', 'ocrspace', 'baidu')
            output_dir: 输出目录名称
        """
        self.ocr = SmartOCR()
        self.backend = backend
        self.output_dir_name = output_dir
        self.stats = {
            'total': 0,
            'success': 0,
            'failed': 0,
            'skipped': 0
        }

    def find_files(self, input_path: str) -> List[Path]:
        """
        查找所有支持的文件

        Args:
            input_path: 输入路径（文件或目录）

        Returns:
            文件路径列表
        """
        path = Path(input_path)

        if path.is_file():
            return [path] if self._is_supported(path) else []

        elif path.is_dir():
            files = []
            for ext in self.IMAGE_EXTENSIONS | self.DOC_EXTENSIONS:
                files.extend(path.glob(f'*{ext}'))
                files.extend(path.glob(f'*{ext.upper()}'))
            return sorted(files)

        else:
            raise ValueError(f"路径不存在: {input_path}")

    def _is_supported(self, file_path: Path) -> bool:
        """检查文件是否支持"""
        ext = file_path.suffix.lower()
        return ext in self.IMAGE_EXTENSIONS or ext in self.DOC_EXTENSIONS

    def process_batch(
        self,
        input_path: str,
        skip_existing: bool = True,
        verbose: bool = True
    ):
        """
        批量处理文件

        Args:
            input_path: 输入路径（文件或目录）
            skip_existing: 是否跳过已存在的文件
            verbose: 是否显示详细信息
        """
        # 查找文件
        files = self.find_files(input_path)

        if not files:
            print(f"❌ 未找到支持的文件")
            print(f"   支持的格式: {', '.join(self.IMAGE_EXTENSIONS | self.DOC_EXTENSIONS)}")
            return

        # 确定输出目录
        if Path(input_path).is_dir():
            output_base = Path(input_path) / self.output_dir_name
        else:
            output_base = Path(input_path).parent / self.output_dir_name

        output_base.mkdir(exist_ok=True)

        # 开始处理
        print("=" * 60)
        print(f"批量 OCR 处理")
        print("=" * 60)
        print(f"输入路径: {input_path}")
        print(f"输出目录: {output_base}")
        print(f"找到文件: {len(files)} 个")
        print(f"OCR 后端: {self.backend.upper()}")
        print("=" * 60)
        print()

        self.stats['total'] = len(files)

        # 逐个处理
        for i, file_path in enumerate(files, 1):
            print(f"[{i}/{len(files)}] {file_path.name}")

            # 检查是否已存在
            output_file = output_base / f"{file_path.stem}.txt"
            if skip_existing and output_file.exists():
                print(f"  ⏭ 已存在，跳过")
                self.stats['skipped'] += 1
                print()
                continue

            # 处理文件
            try:
                start_time = time.time()

                # OCR 识别
                text = self.ocr.convert_file(
                    str(file_path),
                    output_path=str(output_file),
                    backend=self.backend
                )

                elapsed = time.time() - start_time

                # 统计
                char_count = len(text)
                line_count = text.count('\n') + 1

                print(f"  ✓ 完成 ({char_count} 字符, {line_count} 行, {elapsed:.1f}秒)")
                self.stats['success'] += 1

            except Exception as e:
                print(f"  ✗ 失败: {e}")
                self.stats['failed'] += 1

            print()

        # 显示总结
        self._print_summary(output_base)

    def _print_summary(self, output_dir: Path):
        """打印处理总结"""
        print("\n" + "=" * 60)
        print("处理完成")
        print("=" * 60)
        print(f"总文件数: {self.stats['total']}")
        print(f"成功:     {self.stats['success']} ✓")
        print(f"失败:     {self.stats['failed']} ✗")
        print(f"跳过:     {self.stats['skipped']} ⏭")
        print("=" * 60)
        print(f"\n输出目录: {output_dir}")
        print("\n💡 提示:")
        print(f"  - 识别结果保存在: {output_dir}")
        print(f"  - 文件命名: 原文件名.txt")
        print(f"  - 使用后端: {self.backend.upper()}")

        if self.stats['failed'] > 0:
            print(f"\n⚠️ 有 {self.stats['failed']} 个文件处理失败")
            print("  可能原因: 网络问题、文件格式、API 限额")
            print("  建议: 检查失败文件，或切换到另一个后端重试")


def main():
    """命令行入口"""
    parser = argparse.ArgumentParser(
        description="批量 OCR 处理工具 - 批量识别文件夹中的图片和 PDF",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用示例:

  # 处理单个文件
  python batch_ocr.py document.pdf

  # 处理整个文件夹
  python batch_ocr.py ./我的PDF文件夹

  # 指定输出目录
  python batch_ocr.py ./文件夹 --output-dir 识别结果

  # 使用百度 OCR（中文准确率高）
  python batch_ocr.py ./中文文档 --backend baidu

  # 使用 OCR.space（免费额度大）
  python batch_ocr.py ./大量文件 --backend ocrspace

  # 强制重新处理（不跳过已存在的文件）
  python batch_ocr.py ./文件夹 --no-skip

支持的格式:
  - 图片: .png, .jpg, .jpeg, .webp, .bmp, .gif, .tiff
  - 文档: .pdf

注意事项:
  - OCR.space: 免费 25,000次/月，PDF 最多 3 页
  - 百度 OCR: 免费 1,000-2,000次/月
  - 默认跳过已处理的文件（避免重复消耗额度）
  - 建议先处理少量文件测试效果

输出:
  - 默认输出到: 输入目录/ocr_output/
  - 文件命名: 原文件名.txt
  - 编码: UTF-8
        """
    )

    parser.add_argument(
        'input',
        help='输入路径（文件或目录）'
    )

    parser.add_argument(
        '--backend',
        choices=['auto', 'ocrspace', 'baidu'],
        default='auto',
        help='OCR 后端选择（默认: auto 自动选择）'
    )

    parser.add_argument(
        '--output-dir',
        default='ocr_output',
        help='输出目录名称（默认: ocr_output）'
    )

    parser.add_argument(
        '--no-skip',
        action='store_true',
        help='不跳过已存在的文件，强制重新处理'
    )

    args = parser.parse_args()

    try:
        # 创建批处理器
        batch = BatchOCR(
            backend=args.backend,
            output_dir=args.output_dir
        )

        # 处理文件
        batch.process_batch(
            args.input,
            skip_existing=not args.no_skip,
            verbose=True
        )

    except KeyboardInterrupt:
        print("\n\n⚠️ 用户中断")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 错误: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
