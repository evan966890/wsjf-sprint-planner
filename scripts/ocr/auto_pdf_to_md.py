#!/usr/bin/env python3
"""
全自动 PDF 转 Markdown 工具
- 自动检测文字层
- 自动 OCR 识别（如需要）
- 自动智能命名
- 批量处理
- 零配置，一键完成
"""

import os
import sys
import json
from pathlib import Path
from typing import List, Optional
import re

# 添加当前目录到路径
sys.path.insert(0, str(Path(__file__).parent))

try:
    import PyPDF2
    HAS_PYPDF = True
except ImportError:
    HAS_PYPDF = False

try:
    from smart_ocr import SmartOCR
    HAS_OCR = True
except ImportError:
    HAS_OCR = False


class AutoPDFToMD:
    """全自动 PDF 转 Markdown 处理器"""

    def __init__(self, backend='auto', output_dir='markdown_output', verbose=True):
        """
        初始化处理器

        Args:
            backend: OCR 后端（'auto', 'ocrspace', 'baidu'）
            output_dir: 输出目录名
            verbose: 是否显示详细信息
        """
        self.backend = backend
        self.output_dir_name = output_dir
        self.verbose = verbose
        self.ocr = SmartOCR() if HAS_OCR else None
        self.stats = {
            'total': 0,
            'has_text_layer': 0,
            'needs_ocr': 0,
            'success': 0,
            'failed': 0,
            'skipped': 0
        }

    def process_folder(self, folder_path: str, custom_output_dir: Optional[str] = None) -> dict:
        """
        处理文件夹中的所有 PDF

        Args:
            folder_path: 文件夹路径

        Returns:
            处理结果统计
        """
        folder = Path(folder_path)
        if not folder.exists():
            raise FileNotFoundError(f"文件夹不存在: {folder_path}")

        # 查找所有 PDF 和图片
        pdf_files = list(folder.glob('*.pdf')) + list(folder.glob('*.PDF'))
        img_files = []
        for ext in ['*.png', '*.PNG', '*.jpg', '*.JPG', '*.jpeg', '*.JPEG']:
            img_files.extend(folder.glob(ext))

        all_files = pdf_files + img_files

        if not all_files:
            print(f"❌ 未找到 PDF 或图片文件")
            return self.stats

        # 创建输出目录
        if custom_output_dir:
            output_dir = Path(custom_output_dir)
        else:
            output_dir = folder / self.output_dir_name
        output_dir.mkdir(exist_ok=True, parents=True)

        if self.verbose:
            print("=" * 70)
            print("🤖 全自动 PDF 转 Markdown")
            print("=" * 70)
            print(f"输入目录: {folder}")
            print(f"输出目录: {output_dir}")
            print(f"找到文件: {len(all_files)} 个 (PDF: {len(pdf_files)}, 图片: {len(img_files)})")
            print(f"OCR 后端: {self.backend.upper()}")
            print("=" * 70)
            print()

        self.stats['total'] = len(all_files)

        # 逐个处理
        for i, pdf_file in enumerate(all_files, 1):
            if self.verbose:
                print(f"[{i}/{len(pdf_files)}] {pdf_file.name}")

            try:
                # 处理单个 PDF
                self._process_single_pdf(pdf_file, output_dir)
                self.stats['success'] += 1

            except Exception as e:
                if self.verbose:
                    print(f"  ✗ 失败: {e}")
                self.stats['failed'] += 1

            if self.verbose:
                print()

        # 显示总结
        if self.verbose:
            self._print_summary(output_dir)

        return self.stats

    def _process_single_pdf(self, pdf_path: Path, output_dir: Path):
        """处理单个 PDF 或图片"""

        # 判断文件类型
        is_image = pdf_path.suffix.lower() in ['.png', '.jpg', '.jpeg', '.webp', '.bmp']

        if is_image:
            # 图片直接 OCR
            if self.verbose:
                print(f"  ℹ 图片文件，使用 OCR 识别... (后端: {self.backend.upper()})")

            if not self.ocr:
                raise ImportError("OCR 模块未安装")

            final_text = self.ocr.convert_file(str(pdf_path), backend=self.backend)
            self.stats['needs_ocr'] += 1

        else:
            # PDF：先检测文字层
            has_text, text, page_count = self._extract_text_layer(pdf_path)

            if has_text:
                # 有文字层，直接使用
                if self.verbose:
                    print(f"  ✓ 检测到文字层 ({len(text)} 字符, {page_count} 页)")
                self.stats['has_text_layer'] += 1
                final_text = text

            else:
                # 需要 OCR
                if self.verbose:
                    print(f"  ℹ 无文字层，使用 OCR 识别... (后端: {self.backend.upper()})")
                self.stats['needs_ocr'] += 1

                if not self.ocr:
                    raise ImportError("OCR 模块未安装，无法处理扫描 PDF")

                # OCR 识别
                final_text = self.ocr.convert_file(str(pdf_path), backend=self.backend)

        # 2. 智能命名
        filename = self._generate_smart_filename(final_text, pdf_path.stem)

        # 3. 保存为 Markdown
        output_file = output_dir / f"{filename}.md"

        # 避免覆盖（如果文件名冲突）
        counter = 1
        while output_file.exists():
            output_file = output_dir / f"{filename}_{counter}.md"
            counter += 1

        # 保存
        output_file.write_text(final_text, encoding='utf-8')

        if self.verbose:
            print(f"  ✓ 已保存: {output_file.name}")
            print(f"     字符数: {len(final_text)}, 行数: {final_text.count(chr(10)) + 1}")

    def _extract_text_layer(self, pdf_path: Path) -> tuple:
        """
        提取 PDF 文字层

        Returns:
            (是否有文字层, 文本内容, 页数)
        """
        if not HAS_PYPDF:
            return False, "", 0

        try:
            with open(pdf_path, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                page_count = len(reader.pages)

                # 提取所有页面的文本
                text_parts = []
                for page_num, page in enumerate(reader.pages, 1):
                    page_text = page.extract_text()
                    if page_text:
                        text_parts.append(f"## 第 {page_num} 页\n\n{page_text}")

                full_text = "\n\n---\n\n".join(text_parts)

                # 判断是否有有效文字层
                # 规则：平均每页至少 50 字符
                avg_chars_per_page = len(full_text.strip()) / page_count if page_count > 0 else 0
                has_valid_text = avg_chars_per_page >= 50

                return has_valid_text, full_text, page_count

        except Exception as e:
            if self.verbose:
                print(f"  ⚠ 文字层提取失败: {e}")
            return False, "", 0

    def _generate_smart_filename(self, text: str, fallback_name: str) -> str:
        """
        根据内容智能生成文件名

        策略：
        1. 提取前 200 字符
        2. 查找标题特征（如：# 标题、第一行、关键词）
        3. 清理非法字符
        4. 限制长度

        Args:
            text: 文档内容
            fallback_name: 备用文件名

        Returns:
            智能文件名
        """
        if not text or len(text.strip()) < 10:
            return self._clean_filename(fallback_name)

        # 提取前 200 字符用于分析
        preview = text[:200].strip()

        # 策略 1: 查找 Markdown 标题
        title_match = re.search(r'^#\s+(.+)$', preview, re.MULTILINE)
        if title_match:
            title = title_match.group(1).strip()
            return self._clean_filename(title[:50])

        # 策略 2: 提取第一行非空行
        lines = [line.strip() for line in preview.split('\n') if line.strip()]
        if lines:
            first_line = lines[0]
            # 如果第一行看起来像标题（<100字符，不包含太多标点）
            if len(first_line) < 100 and first_line.count('，') + first_line.count('。') < 3:
                return self._clean_filename(first_line[:50])

        # 策略 3: 提取关键词
        # 查找可能的标题关键词
        keywords = ['需求', '方案', '报告', '文档', '合同', '协议', '说明', '指南']
        for keyword in keywords:
            if keyword in preview:
                # 提取包含关键词的句子
                sentences = re.split(r'[。\n]', preview)
                for sentence in sentences:
                    if keyword in sentence and len(sentence) < 50:
                        return self._clean_filename(sentence.strip()[:50])

        # 策略 4: 使用前 30 个字符
        clean_preview = re.sub(r'[^\w\s\u4e00-\u9fff]', '', preview)
        words = clean_preview.split()[:5]  # 前 5 个词
        if words:
            name = '_'.join(words)[:50]
            return self._clean_filename(name)

        # 最后回退到原文件名
        return self._clean_filename(fallback_name)

    def _clean_filename(self, name: str) -> str:
        """
        清理文件名（移除非法字符）

        Args:
            name: 原始文件名

        Returns:
            清理后的文件名
        """
        # 移除 Windows 文件名非法字符
        illegal_chars = r'[<>:"/\\|?*]'
        clean = re.sub(illegal_chars, '_', name)

        # 移除多余空格
        clean = re.sub(r'\s+', '_', clean)

        # 移除首尾特殊字符
        clean = clean.strip('_-. ')

        # 限制长度
        if len(clean) > 50:
            clean = clean[:50]

        # 如果清理后为空，使用默认名
        if not clean:
            clean = "untitled"

        return clean

    def _print_summary(self, output_dir: Path):
        """打印处理总结"""
        print("=" * 70)
        print("✅ 处理完成")
        print("=" * 70)
        print(f"总文件数:       {self.stats['total']}")
        print(f"  有文字层:     {self.stats['has_text_layer']} (直接提取)")
        print(f"  需要 OCR:     {self.stats['needs_ocr']} (OCR 识别)")
        print(f"成功:           {self.stats['success']} ✓")
        print(f"失败:           {self.stats['failed']} ✗")
        print(f"跳过:           {self.stats['skipped']} ⏭")
        print("=" * 70)
        print(f"\n📂 输出目录: {output_dir}")
        print(f"\n💡 所有 Markdown 文件已根据内容自动命名")

        if self.stats['needs_ocr'] > 0:
            print(f"\n📊 OCR 额度消耗: {self.stats['needs_ocr']} 次 ({self.backend.upper()})")


def main():
    """命令行入口"""
    import argparse

    parser = argparse.ArgumentParser(
        description="🤖 全自动 PDF 转 Markdown - 零配置，一键完成",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用示例:

  # 处理文件夹（最简单）
  python auto_pdf_to_md.py D:\\pdfs

  # 使用百度 OCR（中文准确率高）
  python auto_pdf_to_md.py D:\\中文文档 --backend baidu

  # 使用 OCR.space（免费额度大）
  python auto_pdf_to_md.py D:\\大量PDF --backend ocrspace

  # 静默模式（只显示结果）
  python auto_pdf_to_md.py D:\\pdfs --quiet

功能特点:

  ✅ 全自动检测文字层（有则直接提取，无需 OCR）
  ✅ 全自动 OCR 识别（扫描 PDF）
  ✅ 全自动智能命名（根据内容）
  ✅ 全自动批量处理（整个文件夹）
  ✅ 零配置（开箱即用）

输出:

  输入目录/markdown_output/
    ├── 需求文档_V1.md          # 自动命名
    ├── 产品方案_2025Q1.md      # 自动命名
    └── ...

智能命名规则:

  1. 优先提取文档标题（# 标题）
  2. 提取第一行非空行
  3. 提取包含关键词的句子
  4. 使用前几个词组合
  5. 回退到原文件名
        """
    )

    parser.add_argument('folder', help='PDF 文件夹路径')
    parser.add_argument(
        '--backend',
        choices=['auto', 'ocrspace', 'baidu'],
        default='auto',
        help='OCR 后端（默认: auto 自动选择）'
    )
    parser.add_argument(
        '--output-dir',
        default=None,
        help='输出目录完整路径（默认: 输入目录/markdown_output）'
    )
    parser.add_argument(
        '--quiet',
        action='store_true',
        help='静默模式（只显示结果）'
    )

    args = parser.parse_args()

    try:
        # 创建处理器
        processor = AutoPDFToMD(
            backend=args.backend,
            output_dir=args.output_dir or 'markdown_output',
            verbose=not args.quiet
        )

        # 处理文件夹
        stats = processor.process_folder(args.folder, custom_output_dir=args.output_dir)

        # 返回统计信息（供 AI 使用）
        sys.exit(0 if stats['failed'] == 0 else 1)

    except KeyboardInterrupt:
        print("\n\n⚠️ 用户中断")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 错误: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
