#!/usr/bin/env python3
"""
批量PDF/图片转Markdown工具
用于将目录中的所有PDF和图片文件转换为Markdown格式

使用方法:
    python batch-convert.py <输入目录> [选项]

示例:
    # 转换当前目录所有文件
    python batch-convert.py .

    # 转换指定目录，输出到特定目录
    python batch-convert.py ./pdfs --output ./markdown

    # 使用高质量设置
    python batch-convert.py ./scans --resolution large --dpi 300
"""

import argparse
import sys
from pathlib import Path
from typing import List
import logging
from datetime import datetime

# 添加技能路径
skills_path = Path.home() / ".claude/skills/deepseek-ocr-to-md"
if str(skills_path) not in sys.path:
    sys.path.insert(0, str(skills_path))

try:
    from integration_example import DocumentProcessor
except ImportError:
    print("❌ 错误: 无法导入DocumentProcessor")
    print("\n请确保DeepSeek-OCR技能已安装:")
    print(f"  检查路径: {skills_path}")
    print("\n安装方法:")
    print("  cd ~/.claude/skills/deepseek-ocr-to-md")
    print("  python scripts/install.py")
    sys.exit(1)


# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)


class BatchConverter:
    """批量转换器"""

    # 支持的文件扩展名
    SUPPORTED_EXTENSIONS = {
        '.pdf', '.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tiff'
    }

    def __init__(
        self,
        input_dir: Path,
        output_dir: Path,
        resolution: str = 'base',
        dpi: int = 200,
        force_ocr: bool = False,
        skip_existing: bool = True
    ):
        """
        初始化批量转换器

        Args:
            input_dir: 输入目录
            output_dir: 输出目录
            resolution: 分辨率设置
            dpi: PDF渲染DPI
            force_ocr: 强制使用OCR（即使PDF有文字层）
            skip_existing: 跳过已存在的输出文件
        """
        self.input_dir = input_dir
        self.output_dir = output_dir
        self.resolution = resolution
        self.dpi = dpi
        self.force_ocr = force_ocr
        self.skip_existing = skip_existing

        # 创建输出目录
        self.output_dir.mkdir(parents=True, exist_ok=True)

        # 初始化DocumentProcessor
        try:
            self.processor = DocumentProcessor()
            logger.info("✓ DocumentProcessor初始化成功")
        except Exception as e:
            logger.error(f"✗ 初始化失败: {e}")
            raise

    def find_files(self) -> List[Path]:
        """
        查找所有支持的文件

        Returns:
            文件路径列表
        """
        files = []

        for ext in self.SUPPORTED_EXTENSIONS:
            # 递归查找
            found = list(self.input_dir.rglob(f'*{ext}'))
            files.extend(found)

            # 区分大小写
            if ext.isupper():
                found_upper = list(self.input_dir.rglob(f'*{ext.upper()}'))
                files.extend(found_upper)

        # 去重并排序
        files = sorted(set(files))

        logger.info(f"找到 {len(files)} 个文件")
        return files

    def get_output_path(self, input_file: Path) -> Path:
        """
        获取输出文件路径（保持目录结构）

        Args:
            input_file: 输入文件路径

        Returns:
            输出文件路径
        """
        # 计算相对路径
        try:
            relative_path = input_file.relative_to(self.input_dir)
        except ValueError:
            # 如果文件不在input_dir下，使用文件名
            relative_path = Path(input_file.name)

        # 替换扩展名为.md
        output_path = self.output_dir / relative_path.with_suffix('.md')

        # 创建父目录
        output_path.parent.mkdir(parents=True, exist_ok=True)

        return output_path

    def convert_file(self, input_file: Path) -> bool:
        """
        转换单个文件

        Args:
            input_file: 输入文件路径

        Returns:
            是否成功
        """
        output_file = self.get_output_path(input_file)

        # 检查是否跳过已存在文件
        if self.skip_existing and output_file.exists():
            logger.info(f"⊘ 跳过（已存在）: {input_file.name}")
            return True

        logger.info(f"→ 正在转换: {input_file.name}")

        try:
            # 使用DocumentProcessor转换
            if self.force_ocr:
                # 强制OCR
                markdown = self.processor.convert_to_markdown(
                    input_file=input_file,
                    output_file=output_file,
                    resolution=self.resolution,
                    dpi=self.dpi
                )
            else:
                # 自动检测
                markdown = self.processor.process_uploaded_document(
                    file_path=input_file,
                    force_ocr=False
                )

                # 手动保存（因为process_uploaded_document不保存）
                with open(output_file, 'w', encoding='utf-8') as f:
                    f.write(markdown)

            # 统计信息
            char_count = len(markdown)
            file_size = output_file.stat().st_size / 1024

            logger.info(f"  ✓ 转换成功: {char_count:,} 字符, {file_size:.1f} KB")
            logger.info(f"  输出: {output_file}")

            return True

        except Exception as e:
            logger.error(f"  ✗ 转换失败: {e}")
            return False

    def run(self):
        """执行批量转换"""
        logger.info("=" * 60)
        logger.info("批量PDF/图片转Markdown工具")
        logger.info("=" * 60)
        logger.info(f"输入目录: {self.input_dir}")
        logger.info(f"输出目录: {self.output_dir}")
        logger.info(f"分辨率: {self.resolution}")
        logger.info(f"DPI: {self.dpi}")
        logger.info(f"强制OCR: {'是' if self.force_ocr else '否'}")
        logger.info("=" * 60)

        # 查找文件
        files = self.find_files()

        if not files:
            logger.warning("没有找到任何支持的文件")
            return

        # 转换文件
        success_count = 0
        failed_count = 0
        skipped_count = 0

        start_time = datetime.now()

        for i, file_path in enumerate(files, 1):
            logger.info(f"\n[{i}/{len(files)}] {file_path.name}")

            if self.skip_existing and self.get_output_path(file_path).exists():
                logger.info(f"  ⊘ 跳过（已存在）")
                skipped_count += 1
                continue

            if self.convert_file(file_path):
                success_count += 1
            else:
                failed_count += 1

        # 统计结果
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()

        logger.info("\n" + "=" * 60)
        logger.info("转换完成！")
        logger.info("=" * 60)
        logger.info(f"总文件数: {len(files)}")
        logger.info(f"✓ 成功: {success_count}")
        logger.info(f"✗ 失败: {failed_count}")
        logger.info(f"⊘ 跳过: {skipped_count}")
        logger.info(f"⏱ 耗时: {duration:.1f} 秒")

        if success_count > 0:
            avg_time = duration / success_count
            logger.info(f"⌀ 平均: {avg_time:.1f} 秒/文件")

        logger.info("=" * 60)


def main():
    parser = argparse.ArgumentParser(
        description="批量PDF/图片转Markdown工具",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  # 转换当前目录所有文件
  python batch-convert.py .

  # 转换指定目录，输出到特定目录
  python batch-convert.py ./pdfs --output ./markdown

  # 使用高质量设置
  python batch-convert.py ./scans --resolution large --dpi 300

  # 强制使用OCR（即使PDF有文字层）
  python batch-convert.py ./pdfs --force-ocr

  # 覆盖已存在的文件
  python batch-convert.py ./pdfs --no-skip

支持的文件类型:
  PDF: .pdf
  图片: .png, .jpg, .jpeg, .webp, .bmp, .tiff
        """
    )

    parser.add_argument(
        'input_dir',
        type=str,
        help='输入目录（包含PDF/图片文件）'
    )

    parser.add_argument(
        '--output', '-o',
        type=str,
        default=None,
        help='输出目录（默认：输入目录/markdown_output）'
    )

    parser.add_argument(
        '--resolution', '-r',
        type=str,
        default='base',
        choices=['tiny', 'small', 'base', 'large'],
        help='分辨率设置（默认：base）'
    )

    parser.add_argument(
        '--dpi',
        type=int,
        default=200,
        help='PDF渲染DPI（默认：200）'
    )

    parser.add_argument(
        '--force-ocr',
        action='store_true',
        help='强制使用OCR（即使PDF有文字层）'
    )

    parser.add_argument(
        '--no-skip',
        action='store_true',
        help='不跳过已存在的文件（覆盖）'
    )

    args = parser.parse_args()

    # 处理路径
    input_dir = Path(args.input_dir).resolve()
    if not input_dir.exists():
        print(f"错误: 输入目录不存在: {input_dir}")
        sys.exit(1)

    if not input_dir.is_dir():
        print(f"错误: 输入路径不是目录: {input_dir}")
        sys.exit(1)

    # 输出目录
    if args.output:
        output_dir = Path(args.output).resolve()
    else:
        output_dir = input_dir / 'markdown_output'

    # 创建转换器并运行
    try:
        converter = BatchConverter(
            input_dir=input_dir,
            output_dir=output_dir,
            resolution=args.resolution,
            dpi=args.dpi,
            force_ocr=args.force_ocr,
            skip_existing=not args.no_skip
        )

        converter.run()

    except KeyboardInterrupt:
        print("\n\n⚠️ 用户中断")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ 发生错误: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
