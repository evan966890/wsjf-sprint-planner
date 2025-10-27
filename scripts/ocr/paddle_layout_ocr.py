#!/usr/bin/env python3
"""
PaddleOCR 版式分析 OCR
- 保留原始排版（标题、段落、表格）
- 处理超大图片（自动分块）
- 生成结构化 Markdown
- 专为飞书截图等复杂排版优化
"""

import sys
from pathlib import Path

try:
    from paddleocr import PPStructure, save_structure_res
    import cv2
    HAS_PADDLE = True
except ImportError:
    HAS_PADDLE = False
    print("错误: PaddleOCR 未安装")
    print("运行: pip install paddleocr paddlepaddle")
    sys.exit(1)


class PaddleLayoutOCR:
    """PaddleOCR 版式分析处理器"""

    def __init__(self, lang='ch', use_gpu=False):
        """
        初始化

        Args:
            lang: 语言（'ch'=中文, 'en'=英文）
            use_gpu: 是否使用 GPU
        """
        # 初始化 PP-Structure（版式分析）
        self.engine = PPStructure(
            show_log=True,
            use_gpu=use_gpu,
            lang=lang,
            layout=True,  # 启用版式分析
            table=True,   # 启用表格识别
            ocr=True      # 启用 OCR
        )

    def process_image(self, image_path: str, output_path: str = None) -> str:
        """
        处理图片（保留排版）

        Args:
            image_path: 图片路径
            output_path: 输出 Markdown 路径

        Returns:
            Markdown 文本
        """
        # 读取图片
        img = cv2.imread(image_path)

        if img is None:
            raise ValueError(f"无法读取图片: {image_path}")

        print(f"📄 处理: {Path(image_path).name}")
        print(f"   尺寸: {img.shape[1]} x {img.shape[0]}")

        # 版式分析 + OCR
        result = self.engine(img)

        # 转换为 Markdown
        markdown = self._result_to_markdown(result)

        # 保存
        if output_path:
            Path(output_path).write_text(markdown, encoding='utf-8')
            print(f"   ✓ 已保存: {output_path}")

        return markdown

    def _result_to_markdown(self, result: list) -> str:
        """
        将 PaddleOCR 结果转为 Markdown

        Args:
            result: PP-Structure 返回结果

        Returns:
            格式化的 Markdown
        """
        markdown_parts = []

        for item in result:
            item_type = item.get('type', 'text')
            bbox = item.get('bbox', [])

            if item_type == 'title':
                # 标题
                text = self._extract_text(item)
                markdown_parts.append(f"# {text}\n")

            elif item_type == 'text':
                # 正文
                text = self._extract_text(item)
                markdown_parts.append(f"{text}\n")

            elif item_type == 'table':
                # 表格
                table_html = item.get('res', {}).get('html', '')
                if table_html:
                    # 转为 Markdown 表格
                    markdown_parts.append(f"\n{table_html}\n")
                else:
                    text = self._extract_text(item)
                    markdown_parts.append(f"\n```\n{text}\n```\n")

            elif item_type == 'figure':
                # 图片
                markdown_parts.append(f"\n![Image]({bbox})\n")

            elif item_type == 'list':
                # 列表
                text = self._extract_text(item)
                lines = text.split('\n')
                for line in lines:
                    if line.strip():
                        markdown_parts.append(f"- {line.strip()}\n")

        return '\n'.join(markdown_parts)

    def _extract_text(self, item: dict) -> str:
        """提取文本内容"""
        if 'res' in item:
            if isinstance(item['res'], dict) and 'text' in item['res']:
                return item['res']['text']
            elif isinstance(item['res'], list):
                texts = []
                for line in item['res']:
                    if isinstance(line, dict) and 'text' in line:
                        texts.append(line['text'])
                return '\n'.join(texts)

        return str(item.get('res', ''))

    def process_folder(self, folder_path: str, output_dir: str):
        """批量处理文件夹"""
        folder = Path(folder_path)
        output = Path(output_dir)
        output.mkdir(exist_ok=True, parents=True)

        # 查找图片
        img_files = []
        for ext in ['*.png', '*.PNG', '*.jpg', '*.JPG', '*.jpeg', '*.JPEG']:
            img_files.extend(folder.glob(ext))

        if not img_files:
            print("❌ 未找到图片文件")
            return

        print(f"找到 {len(img_files)} 个图片文件")
        print()

        # 处理
        for i, img_file in enumerate(img_files, 1):
            try:
                print(f"[{i}/{len(img_files)}]")
                output_file = output / f"{img_file.stem}.md"
                self.process_image(str(img_file), str(output_file))
                print()
            except Exception as e:
                print(f"   ✗ 失败: {e}\n")


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(
        description="PaddleOCR 版式分析 - 保留原始排版",
        epilog="""
示例:
  python paddle_layout_ocr.py image.png -o output.md
  python paddle_layout_ocr.py folder/ --output-dir D:\\PDFs
        """
    )

    parser.add_argument('input', help='输入图片或文件夹')
    parser.add_argument('-o', '--output', help='输出文件（单文件模式）')
    parser.add_argument('--output-dir', help='输出目录（批量模式）')
    parser.add_argument('--lang', default='ch', choices=['ch', 'en'], help='语言')

    args = parser.parse_args()

    ocr = PaddleLayoutOCR(lang=args.lang)

    input_path = Path(args.input)

    if input_path.is_file():
        # 单文件
        output = args.output or f"{input_path.stem}.md"
        ocr.process_image(str(input_path), output)

    elif input_path.is_dir():
        # 文件夹
        output_dir = args.output_dir or str(input_path / 'markdown_output')
        ocr.process_folder(str(input_path), output_dir)
