#!/usr/bin/env python3
"""
PDF 拆分工具
将超大 PDF 拆分为多个小 PDF
便于 OCR 识别或手动处理
"""

import sys
import argparse
from pathlib import Path

try:
    import PyPDF2
except ImportError:
    print("错误: 请先安装 PyPDF2")
    print("运行: pip install PyPDF2")
    sys.exit(1)


def split_pdf(
    input_path: str,
    output_dir: str = None,
    pages_per_file: int = 10,
    max_size_mb: float = None
):
    """
    拆分 PDF 文件

    Args:
        input_path: 输入 PDF 路径
        output_dir: 输出目录（默认: 原文件名_split）
        pages_per_file: 每个文件包含多少页
        max_size_mb: 最大文件大小（MB）
    """
    pdf_file = Path(input_path)

    if not pdf_file.exists():
        raise FileNotFoundError(f"PDF 不存在: {input_path}")

    # 确定输出目录
    if not output_dir:
        output_dir = pdf_file.parent / f"{pdf_file.stem}_split"
    else:
        output_dir = Path(output_dir)

    output_dir.mkdir(exist_ok=True)

    print("=" * 60)
    print("PDF 拆分工具")
    print("=" * 60)
    print(f"输入文件: {pdf_file.name}")
    print(f"输出目录: {output_dir}")
    print("=" * 60)
    print()

    # 打开 PDF
    with open(input_path, 'rb') as f:
        pdf_reader = PyPDF2.PdfReader(f)
        total_pages = len(pdf_reader.pages)

        print(f"总页数: {total_pages}")
        print(f"每个文件: {pages_per_file} 页")
        print()

        # 计算需要拆分成几个文件
        num_files = (total_pages + pages_per_file - 1) // pages_per_file
        print(f"将拆分为: {num_files} 个文件")
        print()

        # 逐个创建拆分后的 PDF
        for file_idx in range(num_files):
            start_page = file_idx * pages_per_file
            end_page = min((file_idx + 1) * pages_per_file, total_pages)

            print(f"[{file_idx + 1}/{num_files}] 创建: 第 {start_page + 1}-{end_page} 页")

            # 创建新 PDF
            pdf_writer = PyPDF2.PdfWriter()

            for page_num in range(start_page, end_page):
                pdf_writer.add_page(pdf_reader.pages[page_num])

            # 保存
            output_file = output_dir / f"{pdf_file.stem}_part{file_idx + 1:03d}.pdf"
            with open(output_file, 'wb') as output_f:
                pdf_writer.write(output_f)

            # 显示文件大小
            size_mb = output_file.stat().st_size / (1024 * 1024)
            print(f"     ✓ {output_file.name} ({size_mb:.2f} MB)")

    print()
    print("=" * 60)
    print("✅ 拆分完成！")
    print("=" * 60)
    print(f"\n输出目录: {output_dir}")
    print(f"生成文件: {num_files} 个")
    print()
    print("💡 下一步:")
    print(f"   使用批量 OCR 工具处理拆分后的文件:")
    print(f"   python batch_ocr.py {output_dir}")


def main():
    """命令行入口"""
    parser = argparse.ArgumentParser(
        description="PDF 拆分工具 - 将大 PDF 拆分为多个小 PDF",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用示例:

  # 基本用法（每 10 页拆分）
  python split_pdf.py large_document.pdf

  # 每 5 页拆分（适合 OCR.space，建议 ≤3 页）
  python split_pdf.py large_document.pdf --pages-per-file 3

  # 每 20 页拆分
  python split_pdf.py large_document.pdf --pages-per-file 20

  # 指定输出目录
  python split_pdf.py large_document.pdf --output-dir ./拆分结果

应用场景:

  1. OCR 识别前准备:
     - 将大 PDF 拆分为小 PDF
     - OCR.space 建议 ≤3 页/文件
     - 百度 OCR 建议 ≤10 页/文件

  2. 手动处理:
     - 方便分配给不同的人处理
     - 减小文件传输大小

  3. 避免超出限制:
     - OCR.space: 最大 1 MB, 3 页
     - 百度 OCR: 最大 4 MB

拆分后批量处理:
  python split_pdf.py large.pdf --pages-per-file 3
  python batch_ocr.py large_split/ --backend ocrspace
        """
    )

    parser.add_argument('input', help='输入 PDF 文件路径')
    parser.add_argument(
        '--output-dir',
        help='输出目录（默认: 原文件名_split）'
    )
    parser.add_argument(
        '--pages-per-file',
        type=int,
        default=10,
        help='每个文件包含多少页（默认: 10）'
    )

    args = parser.parse_args()

    try:
        split_pdf(
            args.input,
            args.output_dir,
            args.pages_per_file
        )
    except Exception as e:
        print(f"\n❌ 错误: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
