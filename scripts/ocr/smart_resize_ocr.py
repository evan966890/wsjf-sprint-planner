#!/usr/bin/env python3
"""
智能图片缩放 + OCR
- 自动调整图片到 API 限制内（保持清晰度）
- 使用百度 OCR 高精度版（支持 10 MB）
- 保留尽可能多的细节供 OCR 识别
"""

import os
import sys
import subprocess
from pathlib import Path
import json

sys.path.insert(0, str(Path(__file__).parent))

try:
    import PyPDF2
    HAS_PYPDF = True
except ImportError:
    HAS_PYPDF = False


class SmartResizeOCR:
    """智能缩放 OCR 处理器"""

    def __init__(self, baidu_config_path='baidu_ocr_config.json'):
        """初始化"""
        # 加载百度配置
        config_file = Path(__file__).parent / baidu_config_path
        if config_file.exists():
            with open(config_file, 'r') as f:
                self.config = json.load(f)
        else:
            raise ValueError(f"配置文件不存在: {baidu_config_path}")

        self.stats = {'total': 0, 'success': 0, 'failed': 0, 'resized': 0, 'has_text': 0}

    def process_folder(self, folder_path: str, output_dir: str):
        """批量处理"""
        folder = Path(folder_path)
        output = Path(output_dir)
        output.mkdir(exist_ok=True, parents=True)

        # 查找所有文件
        pdf_files = list(folder.glob('*.pdf')) + list(folder.glob('*.PDF'))
        img_files = []
        for ext in ['*.png', '*.PNG', '*.jpg', '*.JPG', '*.jpeg', '*.JPEG']:
            img_files.extend(folder.glob(ext))

        all_files = pdf_files + img_files
        self.stats['total'] = len(all_files)

        print("=" * 70)
        print("🚀 智能缩放 + 百度 OCR 高精度识别")
        print("=" * 70)
        print(f"找到: {len(all_files)} 个文件")
        print(f"策略: 自动调整到 10 MB 以内 + 高精度 OCR")
        print("=" * 70)
        print()

        for i, file_path in enumerate(all_files, 1):
            print(f"[{i}/{len(all_files)}] {file_path.name}")

            try:
                # PDF 先尝试提取文字层
                if file_path.suffix.lower() == '.pdf':
                    text = self._try_extract_pdf_text(file_path)
                    if text:
                        print(f"  ✓ PDF 有文字层，直接提取")
                        self._save_file(text, file_path, output)
                        self.stats['has_text'] += 1
                        self.stats['success'] += 1
                        print()
                        continue

                # 图片或扫描 PDF：缩放 + OCR
                resized_file = self._smart_resize(file_path)
                text = self._baidu_ocr_accurate(resized_file)

                # 保存
                self._save_file(text, file_path, output)
                self.stats['success'] += 1

                # 清理临时文件
                if resized_file != str(file_path) and Path(resized_file).exists():
                    Path(resized_file).unlink()

            except Exception as e:
                print(f"  ✗ 失败: {e}")
                self.stats['failed'] += 1

            print()

        # 总结
        print("=" * 70)
        print("✅ 处理完成")
        print("=" * 70)
        print(f"总数: {self.stats['total']}, 成功: {self.stats['success']}, 失败: {self.stats['failed']}")
        print(f"📂 输出: {output}")

    def _smart_resize(self, file_path: Path) -> str:
        """智能缩放图片到 10 MB 以内"""
        size_mb = file_path.stat().st_size / (1024 * 1024)

        if size_mb <= 9:  # 留 1 MB 余地
            return str(file_path)

        print(f"  ⚠ 文件 {size_mb:.1f} MB，缩放到 9 MB...")

        # 计算缩放比例（基于文件大小）
        ratio = (9 / size_mb) ** 0.5  # 平方根，因为是二维

        temp_file = file_path.parent / f"temp_{file_path.stem}.jpg"

        # PowerShell 缩放（保持高质量）
        ps_script = f'''
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("{file_path}")
$newWidth = [int]($img.Width * {ratio})
$newHeight = [int]($img.Height * {ratio})
$newImg = New-Object System.Drawing.Bitmap($newWidth, $newHeight)
$g = [System.Drawing.Graphics]::FromImage($newImg)
$g.InterpolationMode = 'HighQualityBicubic'
$g.SmoothingMode = 'HighQuality'
$g.PixelOffsetMode = 'HighQuality'
$g.DrawImage($img, 0, 0, $newWidth, $newHeight)
$encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where {{$_.MimeType -eq 'image/jpeg'}}
$params = New-Object System.Drawing.Imaging.EncoderParameters(1)
$params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 95)
$newImg.Save("{temp_file}", $encoder, $params)
$g.Dispose(); $newImg.Dispose(); $img.Dispose()
$newSize = (Get-Item "{temp_file}").Length / 1MB
Write-Output "缩放完成: $newSize MB"
'''

        result = subprocess.run(['powershell', '-Command', ps_script], capture_output=True, text=True)

        if result.returncode == 0 and temp_file.exists():
            new_size = temp_file.stat().st_size / (1024 * 1024)
            print(f"     ✓ 缩放: {size_mb:.1f} MB → {new_size:.1f} MB")
            self.stats['resized'] += 1
            return str(temp_file)

        return str(file_path)

    def _baidu_ocr_accurate(self, image_path: str) -> str:
        """调用百度 OCR 高精度版"""
        import requests
        import base64

        # 获取 access token
        token_url = "https://aip.baidubce.com/oauth/2.0/token"
        token_params = {
            'grant_type': 'client_credentials',
            'client_id': self.config['api_key'],
            'client_secret': self.config['secret_key']
        }

        token_resp = requests.post(token_url, params=token_params)
        access_token = token_resp.json()['access_token']

        # 读取图片
        with open(image_path, 'rb') as f:
            image_data = base64.b64encode(f.read()).decode()

        # 调用高精度 OCR
        ocr_url = "https://aip.baidubce.com/rest/2.0/ocr/v1/accurate_basic"
        headers = {'Content-Type': 'application/x-www-form-urlencoded'}
        data = {
            'image': image_data,
            'language_type': 'CHN_ENG',
            'detect_direction': 'true',
            'paragraph': 'true',  # 识别段落
            'probability': 'true'
        }

        print(f"  🇨🇳 百度 OCR 高精度识别...")

        resp = requests.post(f"{ocr_url}?access_token={access_token}", headers=headers, data=data, timeout=60)
        result = resp.json()

        if 'error_code' in result:
            raise Exception(f"百度 OCR 错误 [{result['error_code']}]: {result.get('error_msg')}")

        # 提取文本（按段落）
        words_result = result.get('words_result', [])
        paragraphs = result.get('paragraphs_result', [])

        if paragraphs:
            # 使用段落信息
            text_lines = [para['words'] for para in paragraphs]
        else:
            # 使用行信息
            text_lines = [item['words'] for item in words_result]

        text = '\n\n'.join(text_lines)  # 段落间空行
        print(f"     ✓ 完成 ({len(text)} 字符)")

        return text

    def _try_extract_pdf_text(self, pdf_path: Path) -> str:
        """提取 PDF 文字层"""
        if not HAS_PYPDF:
            return ""

        try:
            with open(pdf_path, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                pages = []
                for page in reader.pages:
                    text = page.extract_text()
                    if text.strip():
                        pages.append(text)

                full_text = '\n\n---\n\n'.join(pages)
                avg_chars = len(full_text) / len(reader.pages) if reader.pages else 0

                return full_text if avg_chars >= 50 else ""
        except:
            return ""

    def _save_file(self, text: str, original_file: Path, output_dir: Path):
        """保存并智能命名"""
        import re

        # 提取前 200 字符
        preview = text[:200].strip()
        lines = [l.strip() for l in preview.split('\n') if l.strip()]

        # 生成文件名
        if lines:
            name = lines[0][:50]
            name = re.sub(r'[<>:"/\\|?*]', '_', name)
            name = re.sub(r'\s+', '_', name)
        else:
            name = original_file.stem

        output_file = output_dir / f"{name}.md"
        counter = 1
        while output_file.exists():
            output_file = output_dir / f"{name}_{counter}.md"
            counter += 1

        output_file.write_text(text, encoding='utf-8')
        print(f"  ✓ 保存: {output_file.name}")


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description="智能缩放 + 百度 OCR 高精度")
    parser.add_argument('folder', help='输入文件夹')
    parser.add_argument('--output-dir', required=True, help='输出目录')

    args = parser.parse_args()

    processor = SmartResizeOCR()
    processor.process_folder(args.folder, args.output_dir)
