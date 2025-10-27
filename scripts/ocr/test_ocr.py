#!/usr/bin/env python3
"""
OCR 功能测试脚本
用于验证 OCR 工具是否正常工作
支持 OCR.space 和百度 OCR
"""

import sys
from pathlib import Path

# 添加当前目录到 Python 路径
sys.path.insert(0, str(Path(__file__).parent))

from smart_ocr import SmartOCR


def test_ocr():
    """测试 OCR 功能"""
    print("=" * 60)
    print("OCR 功能测试")
    print("=" * 60)
    print()

    # 创建智能 OCR 实例
    ocr = SmartOCR()

    # 显示可用后端
    ocr.print_backend_info()

    # 提示用户
    print("\n请提供一个测试文件（图片或 PDF）:")
    print("  示例: test.png, document.pdf, screenshot.jpg")
    print()

    # 获取文件路径
    file_path = input("文件路径: ").strip().strip('"').strip("'")

    if not file_path:
        print("\n❌ 未提供文件路径")
        return

    # 选择后端
    print("\n选择 OCR 后端:")
    print("  1. 自动选择（推荐）")
    print("  2. OCR.space（免费额度大）")
    print("  3. 百度 OCR（中文准确率高）")
    print()

    choice = input("请选择 (1-3) [默认: 1]: ").strip() or "1"

    backend_map = {
        "1": "auto",
        "2": "ocrspace",
        "3": "baidu"
    }

    backend = backend_map.get(choice, "auto")
    print(f"\n已选择: {backend.upper()}")
    print()

    file_path = Path(file_path)

    if not file_path.exists():
        print(f"\n❌ 文件不存在: {file_path}")
        print(f"   当前工作目录: {Path.cwd()}")
        return

    print()
    print(f"📄 正在测试文件: {file_path.name}")
    print()

    try:
        # 转换文件
        text = ocr.convert_file(str(file_path), backend=backend)

        # 显示结果
        print("\n" + "=" * 60)
        print("识别结果:")
        print("=" * 60)
        print(text)
        print("=" * 60)

        # 统计
        char_count = len(text)
        line_count = text.count('\n') + 1
        word_count = len(text.split())

        print(f"\n📊 统计信息:")
        print(f"   字符数: {char_count}")
        print(f"   行数: {line_count}")
        print(f"   单词数: {word_count}")

        print("\n✅ 测试成功!")
        print("\n💡 提示:")
        print("   - 如果识别结果不理想，可以尝试提高图片质量")
        print("   - 支持的格式: PNG, JPG, PDF, WebP 等")
        print("   - 免费 API 限额: 25,000 次/月")

    except Exception as e:
        print(f"\n❌ 测试失败: {e}")
        print("\n💡 可能的原因:")
        print("   1. 网络连接问题")
        print("   2. 文件格式不支持")
        print("   3. API 限额用尽")
        print("   4. 文件大小超过 1MB")


def test_with_sample():
    """使用示例文本测试（创建测试图片）"""
    print("=" * 60)
    print("创建示例测试")
    print("=" * 60)
    print()

    print("提示: 请截图一段文本（如浏览器中的一段文字），")
    print("      然后使用该图片进行测试。")
    print()

    test_ocr()


if __name__ == '__main__':
    if len(sys.argv) > 1:
        # 如果提供了文件路径参数
        file_path = sys.argv[1]
        backend = sys.argv[2] if len(sys.argv) > 2 else 'auto'

        ocr = SmartOCR()
        try:
            text = ocr.convert_file(file_path, backend=backend)
            print("\n" + "=" * 60)
            print("识别结果:")
            print("=" * 60)
            print(text)
            print("=" * 60)
            print("\n✅ 测试成功!")
        except Exception as e:
            print(f"\n❌ 错误: {e}")
            sys.exit(1)
    else:
        # 交互式测试
        test_ocr()
