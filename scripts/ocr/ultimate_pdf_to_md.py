#!/usr/bin/env python3
"""
终极 PDF/图片转 Markdown 工具
- 自动压缩大文件（突破 API 限制）
- 保留原始排版（使用智能分析）
- 处理任意大小的文件
- 零配置，全自动
"""

import os
import sys
import subprocess
from pathlib import Path
from typing import Optional
import time

# 添加当前目录到路径
sys.path.insert(0, str(Path(__file__).parent))

try:
    import PyPDF2
    HAS_PYPDF = True
except ImportError:
    HAS_PYPDF = False

from smart_ocr import SmartOCR


class UltimatePDFToMD:
    """终极 PDF 转 MD 处理器"""

    def __init__(self, backend='baidu', verbose=True):
        """
        初始化

        Args:
            backend: OCR 后端（默认百度，支持更大文件）
            verbose: 是否显示详细信息
        """
        self.backend = backend
        self.verbose = verbose
        self.ocr = SmartOCR()
        self.stats = {
            'total': 0,
            'success': 0,
            'failed': 0,
            'compressed': 0,
            'has_text': 0,
            'ocr': 0
        }

    def process_folder(self, folder_path: str, output_dir: str):
        """批量处理文件夹"""
        folder = Path(folder_path)
        output = Path(output_dir)
        output.mkdir(exist_ok=True, parents=True)

        # 查找所有文件
        pdf_files = list(folder.glob('*.pdf')) + list(folder.glob('*.PDF'))
        img_files = []
        for ext in ['*.png', '*.PNG', '*.jpg', '*.JPG', '*.jpeg', '*.JPEG']:
            img_files.extend(folder.glob(ext))

        all_files = pdf_files + img_files

        if not all_files:
            print("❌ 未找到文件")
            return

        self.stats['total'] = len(all_files)

        if self.verbose:
            print("=" * 70)
            print("🚀 终极 PDF/图片转 Markdown - 处理任意大小文件")
            print("=" * 70)
            print(f"输入目录: {folder}")
            print(f"输出目录: {output}")
            print(f"找到文件: {len(all_files)} 个")
            print(f"策略: 自动压缩 + 智能 OCR")
            print("=" * 70)
            print()

        # 处理文件
        for i, file_path in enumerate(all_files, 1):
            if self.verbose:
                print(f"[{i}/{len(all_files)}] {file_path.name}")

            try:
                self._process_file(file_path, output)
                self.stats['success'] += 1
            except Exception as e:
                if self.verbose:
                    print(f"  ✗ 失败: {e}")
                self.stats['failed'] += 1

            if self.verbose:
                print()

        # 总结
        if self.verbose:
            self._print_summary(output)

    def _process_file(self, file_path: Path, output_dir: Path):
        """处理单个文件"""

        # 1. PDF 先尝试提取文字层
        if file_path.suffix.lower() == '.pdf':
            has_text, text = self._try_extract_text(file_path)
            if has_text:
                if self.verbose:
                    print(f"  ✓ 有文字层，直接提取 ({len(text)} 字符)")
                self.stats['has_text'] += 1
                self._save_with_smart_name(text, file_path, output_dir)
                return

        # 2. 检查文件大小并压缩
        size_mb = file_path.stat().st_size / (1024 * 1024)

        # 百度 OCR 限制 4 MB，OCR.space 限制 1 MB
        max_size_mb = 3.5 if self.backend == 'baidu' else 0.9

        if size_mb > max_size_mb:
            if self.verbose:
                print(f"  ⚠ 文件太大 ({size_mb:.1f} MB)，自动压缩...")

            compressed = self._compress_file(file_path, max_size_mb)
            if compressed:
                file_to_ocr = compressed
                self.stats['compressed'] += 1
            else:
                raise Exception(f"压缩失败，文件仍太大")
        else:
            file_to_ocr = file_path

        # 3. OCR 识别
        if self.verbose:
            print(f"  ℹ OCR 识别中... (后端: {self.backend.upper()})")

        text = self.ocr.convert_file(str(file_to_ocr), backend=self.backend)
        self.stats['ocr'] += 1

        # 4. 保存
        self._save_with_smart_name(text, file_path, output_dir)

        # 5. 清理临时文件
        if file_to_ocr != file_path and Path(file_to_ocr).exists():
            Path(file_to_ocr).unlink()

    def _compress_file(self, file_path: Path, target_size_mb: float) -> Optional[Path]:
        """压缩文件"""
        target_size_kb = int(target_size_mb * 1024)
        compressed_path = file_path.parent / f"temp_{file_path.stem}_compressed.jpg"

        # 使用 PowerShell 压缩
        ps_script = f'''
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("{file_path}")
$ratio = [Math]::Sqrt({target_size_kb} / ((Get-Item "{file_path}").Length / 1KB))
$newWidth = [Math]::Max(800, [int]($img.Width * $ratio))
$newHeight = [int]($img.Height * $newWidth / $img.Width)
$newImg = New-Object System.Drawing.Bitmap($newWidth, $newHeight)
$graphics = [System.Drawing.Graphics]::FromImage($newImg)
$graphics.InterpolationMode = 'HighQualityBicubic'
$graphics.DrawImage($img, 0, 0, $newWidth, $newHeight)
$encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where {{$_.MimeType -eq 'image/jpeg'}}
$params = New-Object System.Drawing.Imaging.EncoderParameters(1)
$params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 85)
$newImg.Save("{compressed_path}", $encoder, $params)
$graphics.Dispose(); $newImg.Dispose(); $img.Dispose()
'''

        try:
            result = subprocess.run(
                ['powershell', '-Command', ps_script],
                capture_output=True,
                text=True,
                timeout=30
            )

            if result.returncode == 0 and compressed_path.exists():
                new_size_mb = compressed_path.stat().st_size / (1024 * 1024)
                if self.verbose:
                    print(f"     ✓ 压缩完成: {file_path.stat().st_size/(1024*1024):.1f} MB → {new_size_mb:.1f} MB")
                return compressed_path

        except Exception as e:
            if self.verbose:
                print(f"     ✗ 压缩失败: {e}")

        return None

    def _try_extract_text(self, pdf_path: Path) -> tuple:
        """尝试提取 PDF 文字层"""
        if not HAS_PYPDF:
            return False, ""

        try:
            with open(pdf_path, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                pages = []
                for page_num, page in enumerate(reader.pages, 1):
                    text = page.extract_text()
                    if text.strip():
                        pages.append(f"## Page {page_num}\n\n{text}")

                full_text = "\n\n---\n\n".join(pages)
                avg_chars = len(full_text) / len(reader.pages) if reader.pages else 0

                return avg_chars >= 50, full_text
        except:
            return False, ""

    def _save_with_smart_name(self, text: str, original_file: Path, output_dir: Path):
        """智能命名并保存"""
        # 提取前 300 字符用于命名
        preview = text[:300].strip()
        lines = [line.strip() for line in preview.split('\n') if line.strip()]

        # 生成文件名
        if lines:
            # 使用第一行非空行
            first_line = lines[0].replace('#', '').strip()
            # 清理非法字符
            import re
            name = re.sub(r'[<>:"/\\|?*]', '_', first_line)
            name = re.sub(r'\s+', '_', name)[:50]
        else:
            name = original_file.stem

        # 保存
        output_file = output_dir / f"{name}.md"
        counter = 1
        while output_file.exists():
            output_file = output_dir / f"{name}_{counter}.md"
            counter += 1

        output_file.write_text(text, encoding='utf-8')

        if self.verbose:
            print(f"  ✓ 已保存: {output_file.name}")

    def _print_summary(self, output_dir: Path):
        """打印总结"""
        print("=" * 70)
        print("✅ 处理完成")
        print("=" * 70)
        print(f"总文件数:     {self.stats['total']}")
        print(f"  有文字层:   {self.stats['has_text']} (直接提取)")
        print(f"  需要 OCR:   {self.stats['ocr']} (OCR 识别)")
        print(f"  已压缩:     {self.stats['compressed']} (自动压缩)")
        print(f"成功:         {self.stats['success']} ✓")
        print(f"失败:         {self.stats['failed']} ✗")
        print("=" * 70)
        print(f"\n📂 输出目录: {output_dir}")
        print(f"\n💰 OCR 额度消耗: {self.stats['ocr']} 次")


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description="终极 PDF/图片转 MD - 处理任意大小文件")
    parser.add_argument('folder', help='输入文件夹')
    parser.add_argument('--output-dir', required=True, help='输出目录')
    parser.add_argument('--backend', default='baidu', choices=['baidu', 'ocrspace'], help='OCR 后端')
    parser.add_argument('--quiet', action='store_true', help='静默模式')

    args = parser.parse_args()

    processor = UltimatePDFToMD(backend=args.backend, verbose=not args.quiet)
    processor.process_folder(args.folder, args.output_dir)
