#!/usr/bin/env python3
"""
图片压缩工具
自动压缩大图片以满足 OCR API 限制
保持可读性的同时减小文件大小
"""

import sys
from pathlib import Path

try:
    from PIL import Image
    HAS_PIL = False  # Python 3.15 不兼容，使用其他方法
except ImportError:
    HAS_PIL = False


def compress_image_windows(input_path: str, output_path: str, max_size_kb: int = 900):
    """
    使用 Windows 自带工具压缩图片

    Args:
        input_path: 输入图片
        output_path: 输出图片
        max_size_kb: 目标大小（KB）
    """
    import subprocess

    # 使用 PowerShell + .NET 压缩
    ps_script = f'''
Add-Type -AssemblyName System.Drawing

$img = [System.Drawing.Image]::FromFile("{input_path}")
$originalWidth = $img.Width
$originalHeight = $img.Height

# 计算压缩比例
$fileSizeKB = (Get-Item "{input_path}").Length / 1KB
$ratio = [Math]::Sqrt({max_size_kb} / $fileSizeKB)

if ($ratio -lt 1) {{
    $newWidth = [int]($originalWidth * $ratio)
    $newHeight = [int]($originalHeight * $ratio)
}} else {{
    $newWidth = $originalWidth
    $newHeight = $originalHeight
}}

# 创建新图片
$newImg = New-Object System.Drawing.Bitmap($newWidth, $newHeight)
$graphics = [System.Drawing.Graphics]::FromImage($newImg)
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.DrawImage($img, 0, 0, $newWidth, $newHeight)

# 保存（JPEG 质量 85）
$encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object {{$_.MimeType -eq 'image/jpeg'}}
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 85)
$newImg.Save("{output_path}", $encoder, $encoderParams)

$graphics.Dispose()
$newImg.Dispose()
$img.Dispose()

$newSizeKB = (Get-Item "{output_path}").Length / 1KB
Write-Output "压缩完成: ${{originalWidth}}x${{originalHeight}} -> ${{newWidth}}x${{newHeight}}, ${{fileSizeKB}}KB -> ${{newSizeKB}}KB"
'''

    result = subprocess.run(
        ['powershell', '-Command', ps_script],
        capture_output=True,
        text=True
    )

    if result.returncode != 0:
        raise Exception(f"压缩失败: {result.stderr}")

    return output_path


def compress_for_ocr(file_path: str, target_size_kb: int = 900) -> str:
    """
    压缩文件以适应 OCR API 限制

    Args:
        file_path: 原文件路径
        target_size_kb: 目标大小（默认 900 KB，留余地）

    Returns:
        压缩后的文件路径
    """
    file = Path(file_path)
    size_kb = file.stat().st_size / 1024

    if size_kb <= target_size_kb:
        return file_path  # 无需压缩

    # 创建临时压缩文件
    compressed_path = file.parent / f"{file.stem}_compressed{file.suffix}"

    try:
        compress_image_windows(str(file), str(compressed_path), target_size_kb)
        return str(compressed_path)
    except Exception as e:
        print(f"警告: 压缩失败 - {e}")
        return file_path  # 返回原文件


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description="图片压缩工具")
    parser.add_argument('input', help='输入图片')
    parser.add_argument('-o', '--output', help='输出图片')
    parser.add_argument('--max-size', type=int, default=900, help='目标大小（KB）')

    args = parser.parse_args()

    output = args.output or f"{Path(args.input).stem}_compressed.jpg"
    compress_image_windows(args.input, output, args.max_size)
