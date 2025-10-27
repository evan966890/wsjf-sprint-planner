#!/usr/bin/env python3
"""
大 PDF 处理工具
支持处理超大 PDF（分页识别、自动拆分）
突破 OCR API 的文件大小和页数限制
"""

import os
import sys
import argparse
from pathlib import Path
from typing import Optional, List
import time

# 添加当前目录到路径
sys.path.insert(0, str(Path(__file__).parent))

try:
    import PyPDF2
    HAS_PYPDF = True
except ImportError:
    HAS_PYPDF = False
    print("提示: PyPDF2 未安装，请运行: pip install PyPDF2")

from smart_ocr import SmartOCR


class LargePDFProcessor:
    """大 PDF 处理器 - 分页识别"""

    def __init__(self, backend='auto'):
        """
        初始化大 PDF 处理器

        Args:
            backend: OCR 后端 ('auto', 'ocrspace', 'baidu')
        """
        self.ocr = SmartOCR()
        self.backend = backend

    def process_large_pdf(
        self,
        pdf_path: str,
        output_path: Optional[str] = None,
        max_pages_per_request: int = None
    ) -> str:
        """
        处理大 PDF 文件

        策略：
        1. 如果使用 OCR.space → 每 3 页拆分一次（API 限制）
        2. 如果使用百度 OCR → 转为图片逐页识别（更准确）

        Args:
            pdf_path: PDF 文件路径
            output_path: 输出文件路径
            max_pages_per_request: 每次请求最多处理多少页（OCR.space: 3）

        Returns:
            识别的完整文本
        """
        if not HAS_PYPDF:
            raise ImportError("请安装 PyPDF2: pip install PyPDF2")

        pdf_file = Path(pdf_path)
        if not pdf_file.exists():
            raise FileNotFoundError(f"PDF 不存在: {pdf_path}")

        print(f"📄 处理大 PDF: {pdf_file.name}")

        # 1. 获取 PDF 信息
        with open(pdf_path, 'rb') as f:
            pdf_reader = PyPDF2.PdfReader(f)
            total_pages = len(pdf_reader.pages)
            file_size_mb = pdf_file.stat().st_size / (1024 * 1024)

        print(f"   总页数: {total_pages}")
        print(f"   文件大小: {file_size_mb:.2f} MB")

        # 2. 确定处理策略
        if self.backend == 'ocrspace' or (self.backend == 'auto' and file_size_mb <= 1):
            # OCR.space 限制
            max_pages = max_pages_per_request or 3
            print(f"   策略: 分批处理（每批最多 {max_pages} 页）")
            return self._process_with_split(pdf_path, output_path, max_pages, total_pages)
        else:
            # 百度 OCR 或文件太大
            print(f"   策略: 转图片逐页识别")
            return self._process_page_by_page(pdf_path, output_path, total_pages)

    def _process_with_split(
        self,
        pdf_path: str,
        output_path: Optional[str],
        pages_per_batch: int,
        total_pages: int
    ) -> str:
        """
        分批处理 PDF（拆分成小 PDF）

        适合: OCR.space（有页数限制）
        """
        pdf_file = Path(pdf_path)
        temp_dir = pdf_file.parent / f"temp_{pdf_file.stem}"
        temp_dir.mkdir(exist_ok=True)

        all_text = []

        try:
            # 打开 PDF
            with open(pdf_path, 'rb') as f:
                pdf_reader = PyPDF2.PdfReader(f)

                # 分批处理
                num_batches = (total_pages + pages_per_batch - 1) // pages_per_batch

                for batch_idx in range(num_batches):
                    start_page = batch_idx * pages_per_batch
                    end_page = min((batch_idx + 1) * pages_per_batch, total_pages)

                    print(f"\n   批次 {batch_idx + 1}/{num_batches}: 第 {start_page + 1}-{end_page} 页")

                    # 创建临时 PDF（包含当前批次的页）
                    temp_pdf = temp_dir / f"batch_{batch_idx + 1}.pdf"
                    pdf_writer = PyPDF2.PdfWriter()

                    for page_num in range(start_page, end_page):
                        pdf_writer.add_page(pdf_reader.pages[page_num])

                    # 保存临时 PDF
                    with open(temp_pdf, 'wb') as temp_f:
                        pdf_writer.write(temp_f)

                    # OCR 识别
                    try:
                        text = self.ocr.convert_file(str(temp_pdf), backend=self.backend)
                        all_text.append(f"## 第 {start_page + 1}-{end_page} 页\n\n{text}")
                        print(f"     ✓ 完成 ({len(text)} 字符)")

                        # 删除临时文件
                        temp_pdf.unlink()

                    except Exception as e:
                        print(f"     ✗ 失败: {e}")
                        all_text.append(f"## 第 {start_page + 1}-{end_page} 页\n\n[识别失败: {e}]")

                    # 避免 API 限流
                    if batch_idx < num_batches - 1:
                        time.sleep(1)

        finally:
            # 清理临时目录
            try:
                temp_dir.rmdir()
            except:
                pass

        # 合并所有文本
        full_text = "\n\n---\n\n".join(all_text)

        # 保存结果
        if output_path:
            Path(output_path).write_text(full_text, encoding='utf-8')
            print(f"\n   ✓ 已保存到: {output_path}")

        return full_text

    def _process_page_by_page(
        self,
        pdf_path: str,
        output_path: Optional[str],
        total_pages: int
    ) -> str:
        """
        逐页处理 PDF（转为图片）

        适合: 百度 OCR 或大文件
        需要: pdf2image
        """
        try:
            from pdf2image import convert_from_path
        except ImportError:
            raise ImportError(
                "请安装 pdf2image: pip install pdf2image\n"
                "Windows 还需要安装 Poppler: https://github.com/oschwartz10612/poppler-windows/releases/"
            )

        pdf_file = Path(pdf_path)
        temp_dir = pdf_file.parent / f"temp_{pdf_file.stem}_images"
        temp_dir.mkdir(exist_ok=True)

        all_text = []

        try:
            print(f"\n   转换 PDF 为图片...")

            # 转换 PDF 为图片（每页一张）
            images = convert_from_path(pdf_path, dpi=200)

            print(f"   ✓ 已转换 {len(images)} 页")

            # 逐页识别
            for page_num, image in enumerate(images, 1):
                print(f"\n   处理第 {page_num}/{total_pages} 页...")

                # 保存临时图片
                temp_image = temp_dir / f"page_{page_num}.png"
                image.save(temp_image)

                # OCR 识别
                try:
                    text = self.ocr.convert_file(str(temp_image), backend=self.backend)
                    all_text.append(f"## 第 {page_num} 页\n\n{text}")
                    print(f"     ✓ 完成 ({len(text)} 字符)")

                    # 删除临时图片
                    temp_image.unlink()

                except Exception as e:
                    print(f"     ✗ 失败: {e}")
                    all_text.append(f"## 第 {page_num} 页\n\n[识别失败: {e}]")

                # 避免 API 限流
                if page_num < total_pages:
                    time.sleep(0.5)

        finally:
            # 清理临时目录
            try:
                temp_dir.rmdir()
            except:
                pass

        # 合并所有文本
        full_text = "\n\n---\n\n".join(all_text)

        # 保存结果
        if output_path:
            Path(output_path).write_text(full_text, encoding='utf-8')
            print(f"\n   ✓ 已保存到: {output_path}")

        return full_text


def main():
    """命令行入口"""
    parser = argparse.ArgumentParser(
        description="大 PDF 处理工具 - 处理超大 PDF 文件（自动分页识别）",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用示例:

  # 处理大 PDF（自动选择策略）
  python large_pdf_ocr.py large_document.pdf -o output.txt

  # 使用百度 OCR（推荐，无页数限制）
  python large_pdf_ocr.py large_document.pdf --backend baidu

  # 使用 OCR.space（会自动分批，每 3 页一批）
  python large_pdf_ocr.py large_document.pdf --backend ocrspace

处理策略:

  OCR.space:
    - 自动分批（每 3 页一批）
    - 适合文件大小 < 1 MB
    - 免费额度: 25,000次/月

  百度 OCR:
    - 转为图片逐页识别
    - 无页数限制，最大 4 MB
    - 中文准确率最高
    - 免费额度: 1,000-2,000次/月

PDF 限制:
  - OCR.space: 最大 1 MB, 3 页/次
  - 百度 OCR: 最大 4 MB, 无页数限制

建议:
  - 超大 PDF (>100 页) → 使用百度 OCR
  - 中文 PDF → 使用百度 OCR（准确率高）
  - 英文 PDF → 使用 OCR.space（额度大）
        """
    )

    parser.add_argument('input', help='PDF 文件路径')
    parser.add_argument('-o', '--output', help='输出文件路径（默认: 原文件名.txt）')
    parser.add_argument(
        '--backend',
        choices=['auto', 'ocrspace', 'baidu'],
        default='auto',
        help='OCR 后端（默认: auto）'
    )

    args = parser.parse_args()

    try:
        # 确定输出路径
        output_path = args.output
        if not output_path:
            output_path = Path(args.input).with_suffix('.txt')

        # 创建处理器
        processor = LargePDFProcessor(backend=args.backend)

        # 处理 PDF
        print("\n" + "=" * 60)
        print("大 PDF 处理工具")
        print("=" * 60)

        text = processor.process_large_pdf(args.input, str(output_path))

        print("\n" + "=" * 60)
        print("✅ 处理完成！")
        print("=" * 60)
        print(f"输出文件: {output_path}")
        print(f"总字符数: {len(text)}")
        print(f"总行数: {text.count(chr(10)) + 1}")

    except KeyboardInterrupt:
        print("\n\n⚠️ 用户中断")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 错误: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
