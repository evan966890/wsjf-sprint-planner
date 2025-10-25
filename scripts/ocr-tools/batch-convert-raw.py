#!/usr/bin/env python3
"""
批量PDF/图片转文本工具 - 原文提取模式
专门用于提取原始文本，不进行任何总结或整理

使用方法:
    python batch-convert-raw.py <输入目录>
"""

import sys
from pathlib import Path

# 添加技能路径
skills_path = Path.home() / ".claude/skills/deepseek-ocr-to-md"
if str(skills_path) not in sys.path:
    sys.path.insert(0, str(skills_path))

# 复用batch-convert.py的代码，但修改prompt
from pathlib import Path
import argparse
import logging
from datetime import datetime

try:
    from integration_example import DocumentProcessor
except ImportError:
    print("❌ 错误: 无法导入DocumentProcessor")
    print("\n请确保DeepSeek-OCR技能已安装")
    sys.exit(1)

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def convert_with_raw_text_prompt(input_file: Path, output_file: Path, resolution: str = 'base', dpi: int = 200):
    """
    使用原文提取prompt转换文件

    Args:
        input_file: 输入文件
        output_file: 输出文件
        resolution: 分辨率
        dpi: DPI设置
    """
    from vllm import LLM, SamplingParams
    from PIL import Image
    from pdf2image import convert_from_path

    # 初始化模型
    logger.info("加载DeepSeek-OCR模型...")

    RESOLUTIONS = {
        'tiny': 512,
        'small': 640,
        'base': 1024,
        'large': 1280
    }

    res_size = RESOLUTIONS.get(resolution, 1024)

    llm = LLM(
        model="deepseek-ai/DeepSeek-OCR",
        gpu_memory_utilization=0.8,
        max_model_len=4096,
        trust_remote_code=True
    )

    sampling_params = SamplingParams(
        temperature=0.0,
        max_tokens=4096,
        stop=["<|end|>"]
    )

    # 原文提取prompt - 强调逐字提取
    RAW_TEXT_PROMPT = """<image>
<|grounding|>Extract ALL text from this document EXACTLY as it appears.

IMPORTANT:
- Do NOT summarize or rephrase
- Do NOT skip any content
- Extract EVERY word, number, and symbol
- Preserve the original layout and formatting
- Include ALL text, even if repetitive
- Maintain paragraph breaks
- Keep original punctuation

Output the complete, word-for-word transcription."""

    suffix = input_file.suffix.lower()

    if suffix == '.pdf':
        # 转换PDF为图片
        logger.info(f"转换PDF: {input_file.name}")
        images = convert_from_path(input_file, dpi=dpi)

        all_text = []
        for i, image in enumerate(images, 1):
            logger.info(f"  处理页面 {i}/{len(images)}")

            # 调整大小
            if max(image.size) > res_size:
                ratio = res_size / max(image.size)
                new_size = tuple(int(dim * ratio) for dim in image.size)
                image = image.resize(new_size, Image.Resampling.LANCZOS)

            # 提取文本
            outputs = llm.generate(
                [{
                    "prompt": RAW_TEXT_PROMPT,
                    "multi_modal_data": {"image": image}
                }],
                sampling_params
            )

            page_text = outputs[0].outputs[0].text.strip()

            if len(images) > 1:
                all_text.append(f"<!-- 第{i}页 -->\n\n{page_text}")
            else:
                all_text.append(page_text)

        full_text = "\n\n---\n\n".join(all_text)

    else:
        # 处理图片
        logger.info(f"处理图片: {input_file.name}")
        image = Image.open(input_file)

        if max(image.size) > res_size:
            ratio = res_size / max(image.size)
            new_size = tuple(int(dim * ratio) for dim in image.size)
            image = image.resize(new_size, Image.Resampling.LANCZOS)

        outputs = llm.generate(
            [{
                "prompt": RAW_TEXT_PROMPT,
                "multi_modal_data": {"image": image}
            }],
            sampling_params
        )

        full_text = outputs[0].outputs[0].text.strip()

    # 保存结果
    output_file.parent.mkdir(parents=True, exist_ok=True)
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(full_text)

    logger.info(f"✓ 完成: {output_file}")
    return full_text


def main():
    parser = argparse.ArgumentParser(
        description="批量PDF/图片原文提取工具 - 不进行总结，提取完整原文",
        epilog="""
示例:
  # 提取原文
  python batch-convert-raw.py ./PDF文件夹

  # 使用高质量设置
  python batch-convert-raw.py ./扫描文档 --resolution large --dpi 300
        """
    )

    parser.add_argument('input_dir', type=str, help='输入目录')
    parser.add_argument('--resolution', '-r', default='base',
                       choices=['tiny', 'small', 'base', 'large'],
                       help='分辨率 (默认: base)')
    parser.add_argument('--dpi', type=int, default=200,
                       help='PDF DPI (默认: 200)')

    args = parser.parse_args()

    input_dir = Path(args.input_dir)
    if not input_dir.exists():
        print(f"错误: 目录不存在: {input_dir}")
        sys.exit(1)

    output_dir = input_dir / 'raw_text_output'
    output_dir.mkdir(exist_ok=True)

    # 查找文件
    supported = {'.pdf', '.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tiff'}
    files = []
    for ext in supported:
        files.extend(input_dir.glob(f'*{ext}'))

    if not files:
        print("没有找到支持的文件")
        return

    logger.info(f"找到 {len(files)} 个文件")
    logger.info(f"输出目录: {output_dir}")
    logger.info("=" * 60)

    start_time = datetime.now()
    success = 0

    for i, file_path in enumerate(files, 1):
        logger.info(f"\n[{i}/{len(files)}] {file_path.name}")

        output_file = output_dir / file_path.with_suffix('.txt').name

        try:
            convert_with_raw_text_prompt(
                file_path,
                output_file,
                args.resolution,
                args.dpi
            )
            success += 1
        except Exception as e:
            logger.error(f"✗ 失败: {e}")

    duration = (datetime.now() - start_time).total_seconds()

    logger.info("\n" + "=" * 60)
    logger.info(f"完成! 成功: {success}/{len(files)}, 耗时: {duration:.1f}秒")
    logger.info("=" * 60)


if __name__ == '__main__':
    main()
