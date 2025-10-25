#!/usr/bin/env python3
"""
PaddleOCR批量转换工具
Windows原生支持，无需WSL2，无需GPU

PaddleOCR特点:
- 完全免费开源
- Windows原生支持
- CPU/GPU都可用
- 中文识别优秀
- 安装简单

使用方法:
    python paddleocr-convert.py <输入目录> [选项]
"""

import argparse
import sys
from pathlib import Path
import logging
from datetime import datetime

# 检查并安装依赖
try:
    from paddleocr import PaddleOCR
    from PIL import Image
    from pdf2image import convert_from_path
except ImportError as e:
    print("=" * 60)
    print("缺少依赖包，正在安装...")
    print("=" * 60)
    print()

    import subprocess

    packages = {
        'paddleocr': 'paddleocr>=2.7.0',
        'pdf2image': 'pdf2image',
        'PIL': 'pillow'
    }

    missing = []
    for module, package in packages.items():
        try:
            __import__(module.split('.')[0])
        except ImportError:
            missing.append(package)

    if missing:
        print(f"需要安装: {', '.join(missing)}")
        print()
        response = input("是否现在安装? (Y/n): ").strip().lower()

        if response in ['', 'y', 'yes']:
            print("\n安装中...")
            for pkg in missing:
                print(f"  安装 {pkg}...")
                subprocess.check_call([sys.executable, '-m', 'pip', 'install', pkg, '-q'])

            print("\n✓ 安装完成!")
            print("请重新运行此脚本")
            sys.exit(0)
        else:
            print("\n请手动安装:")
            print(f"  pip install {' '.join(missing)}")
            sys.exit(1)

    # 重新导入
    from paddleocr import PaddleOCR
    from PIL import Image
    from pdf2image import convert_from_path

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)


class PaddleOCRConverter:
    """PaddleOCR转换器"""

    SUPPORTED_EXTENSIONS = {'.pdf', '.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tiff'}

    def __init__(self, use_gpu: bool = False, lang: str = 'ch'):
        """
        初始化PaddleOCR

        Args:
            use_gpu: 是否使用GPU（默认CPU）
            lang: 语言 ('ch'=中英文, 'en'=英文)
        """
        logger.info("初始化PaddleOCR...")
        logger.info(f"  语言: {lang}")
        logger.info(f"  设备: {'GPU' if use_gpu else 'CPU'}")

        try:
            self.ocr = PaddleOCR(
                use_angle_cls=True,  # 启用文字方向分类
                lang=lang,
                use_gpu=use_gpu,
                show_log=False
            )
            logger.info("✓ PaddleOCR初始化成功")

        except Exception as e:
            logger.error(f"✗ 初始化失败: {e}")
            raise

    def ocr_image(self, image_path: Path) -> str:
        """
        对单张图片进行OCR

        Args:
            image_path: 图片路径

        Returns:
            提取的文本
        """
        try:
            result = self.ocr.ocr(str(image_path), cls=True)

            if not result or not result[0]:
                return ""

            # 提取文本
            lines = []
            for line in result[0]:
                if len(line) >= 2:
                    text = line[1][0]  # line[1]是(文本, 置信度)元组
                    lines.append(text)

            return '\n'.join(lines)

        except Exception as e:
            logger.error(f"OCR失败 {image_path.name}: {e}")
            return ""

    def convert_pdf(self, pdf_path: Path, output_path: Path, dpi: int = 200) -> bool:
        """转换PDF文件"""
        try:
            logger.info(f"  转换PDF为图片 (DPI: {dpi})...")

            # PDF转图片
            images = convert_from_path(pdf_path, dpi=dpi)
            logger.info(f"  共{len(images)}页")

            all_text = []

            for i, image in enumerate(images, 1):
                logger.info(f"  处理第{i}/{len(images)}页...")

                # 保存临时图片
                temp_img = Path(f"/tmp/ocr_temp_{i}.png")
                image.save(temp_img, 'PNG')

                # OCR
                page_text = self.ocr_image(temp_img)

                # 清理临时文件
                temp_img.unlink(missing_ok=True)

                if len(images) > 1:
                    all_text.append(f"<!-- 第{i}页 -->\n\n{page_text}")
                else:
                    all_text.append(page_text)

            full_text = '\n\n---\n\n'.join(all_text)

            # 保存
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(full_text)

            logger.info(f"  ✓ 成功: {len(full_text)} 字符")
            return True

        except Exception as e:
            logger.error(f"  ✗ 失败: {e}")
            return False

    def convert_image(self, image_path: Path, output_path: Path) -> bool:
        """转换图片文件"""
        try:
            text = self.ocr_image(image_path)

            if not text:
                logger.warning(f"  ⚠ 未提取到文本")
                text = "# 未检测到文本\n\n可能原因:\n- 图片不包含文字\n- 图片质量太差\n- 文字太小或模糊"

            # 保存
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(text)

            logger.info(f"  ✓ 成功: {len(text)} 字符")
            return True

        except Exception as e:
            logger.error(f"  ✗ 失败: {e}")
            return False

    def convert_file(self, input_file: Path, output_file: Path, dpi: int = 200) -> bool:
        """转换文件（自动判断类型）"""
        suffix = input_file.suffix.lower()

        if suffix == '.pdf':
            return self.convert_pdf(input_file, output_file, dpi)
        elif suffix in {'.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tiff'}:
            return self.convert_image(input_file, output_file)
        else:
            logger.error(f"  ✗ 不支持的格式: {suffix}")
            return False


def main():
    parser = argparse.ArgumentParser(
        description="PaddleOCR批量转换工具 - Windows原生支持",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  # 批量转换
  python paddleocr-convert.py ./PDF文件夹

  # 使用GPU加速
  python paddleocr-convert.py ./PDF文件夹 --gpu

  # 仅英文识别（更快）
  python paddleocr-convert.py ./docs --lang en

  # 高DPI
  python paddleocr-convert.py ./scans --dpi 300
        """
    )

    parser.add_argument('input_dir', type=str, help='输入目录')
    parser.add_argument('--output', '-o', type=str, default=None, help='输出目录（默认: 输入目录/paddleocr_output）')
    parser.add_argument('--dpi', type=int, default=200, help='PDF DPI (默认: 200)')
    parser.add_argument('--gpu', action='store_true', help='使用GPU加速')
    parser.add_argument('--lang', type=str, default='ch', choices=['ch', 'en'], help='语言 (ch=中英文, en=英文)')
    parser.add_argument('--skip-existing', action='store_true', default=True, help='跳过已存在文件')

    args = parser.parse_args()

    # 处理路径
    input_dir = Path(args.input_dir).resolve()
    if not input_dir.exists():
        print(f"错误: 目录不存在: {input_dir}")
        sys.exit(1)

    output_dir = Path(args.output) if args.output else input_dir / 'paddleocr_output'
    output_dir.mkdir(parents=True, exist_ok=True)

    # 初始化OCR
    try:
        converter = PaddleOCRConverter(use_gpu=args.gpu, lang=args.lang)
    except Exception as e:
        print(f"\n初始化失败: {e}")
        sys.exit(1)

    # 查找文件
    logger.info("=" * 60)
    logger.info("查找文件...")

    files = []
    for ext in converter.SUPPORTED_EXTENSIONS:
        files.extend(input_dir.rglob(f'*{ext}'))

    files = sorted(set(files))
    logger.info(f"找到 {len(files)} 个文件")

    if not files:
        logger.warning("没有找到支持的文件")
        return

    logger.info("=" * 60)
    logger.info(f"输入目录: {input_dir}")
    logger.info(f"输出目录: {output_dir}")
    logger.info("=" * 60)

    # 转换文件
    success = 0
    failed = 0
    skipped = 0
    start_time = datetime.now()

    for i, file_path in enumerate(files, 1):
        # 计算输出路径
        try:
            rel_path = file_path.relative_to(input_dir)
        except ValueError:
            rel_path = Path(file_path.name)

        output_file = output_dir / rel_path.with_suffix('.md')

        logger.info(f"\n[{i}/{len(files)}] {file_path.name}")

        # 跳过已存在
        if args.skip_existing and output_file.exists():
            logger.info(f"  ⊘ 跳过（已存在）")
            skipped += 1
            continue

        # 转换
        if converter.convert_file(file_path, output_file, args.dpi):
            success += 1
        else:
            failed += 1

    # 统计
    duration = (datetime.now() - start_time).total_seconds()

    logger.info("\n" + "=" * 60)
    logger.info("转换完成！")
    logger.info("=" * 60)
    logger.info(f"总文件数: {len(files)}")
    logger.info(f"✓ 成功: {success}")
    logger.info(f"✗ 失败: {failed}")
    logger.info(f"⊘ 跳过: {skipped}")
    logger.info(f"⏱ 耗时: {duration:.1f} 秒")

    if success > 0:
        logger.info(f"⌀ 平均: {duration/success:.1f} 秒/文件")

    logger.info("=" * 60)


if __name__ == '__main__':
    main()
