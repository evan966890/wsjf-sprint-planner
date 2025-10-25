#!/usr/bin/env python3
"""
OCR API服务器（可选）

提供HTTP API接口，让前端可以直接调用DeepSeek-OCR服务
适用于需要在Web界面直接进行OCR转换的场景

启动方法:
    python api-server.py

API端点:
    POST /api/convert-document - 转换文档
    GET /health - 健康检查

使用方法:
    curl -X POST -F "file=@document.pdf" http://localhost:8000/api/convert-document
"""

import sys
import tempfile
from pathlib import Path
from typing import Optional

# 添加技能路径
skills_path = Path.home() / ".claude/skills/deepseek-ocr-to-md"
if str(skills_path) not in sys.path:
    sys.path.insert(0, str(skills_path))

try:
    from integration_example import DocumentProcessor
except ImportError:
    print("❌ 错误: 无法导入DocumentProcessor")
    print("\n请确保DeepSeek-OCR技能已安装:")
    print(f"  检查路径: {skills_path}")
    sys.exit(1)

try:
    from fastapi import FastAPI, File, UploadFile, HTTPException
    from fastapi.responses import JSONResponse
    from fastapi.middleware.cors import CORSMiddleware
    import uvicorn
except ImportError:
    print("❌ 错误: 缺少依赖包")
    print("\n请安装:")
    print("  pip install fastapi uvicorn[standard] python-multipart")
    sys.exit(1)


# 创建FastAPI应用
app = FastAPI(
    title="DeepSeek-OCR API",
    description="文档OCR转换服务",
    version="1.0.0"
)

# 配置CORS（允许前端跨域请求）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应限制具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 初始化DocumentProcessor
processor = DocumentProcessor()


@app.get("/")
async def root():
    """根路径"""
    return {
        "message": "DeepSeek-OCR API Server",
        "version": "1.0.0",
        "endpoints": {
            "convert": "/api/convert-document",
            "health": "/health"
        }
    }


@app.get("/health")
async def health_check():
    """健康检查"""
    return {
        "status": "healthy",
        "service": "deepseek-ocr-api"
    }


@app.post("/api/convert-document")
async def convert_document(
    file: UploadFile = File(...),
    resolution: Optional[str] = 'base',
    dpi: Optional[int] = 200,
    force_ocr: Optional[bool] = False
):
    """
    转换文档为Markdown

    参数:
        file: 上传的文件（PDF或图片）
        resolution: 分辨率 (tiny/small/base/large)
        dpi: PDF渲染DPI
        force_ocr: 是否强制使用OCR

    返回:
        {
            "success": true,
            "markdown": "...",
            "filename": "...",
            "charCount": 1234
        }
    """
    # 验证文件类型
    if not file.filename:
        raise HTTPException(status_code=400, detail="文件名缺失")

    filename_lower = file.filename.lower()
    supported_extensions = {'.pdf', '.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tiff'}

    if not any(filename_lower.endswith(ext) for ext in supported_extensions):
        raise HTTPException(
            status_code=400,
            detail=f"不支持的文件类型。支持: {', '.join(supported_extensions)}"
        )

    # 保存上传的文件到临时位置
    with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        temp_path = tmp.name

    try:
        # 转换文档
        print(f"处理文件: {file.filename}")

        if force_ocr:
            # 强制OCR
            markdown = processor.convert_to_markdown(
                input_file=temp_path,
                resolution=resolution,
                dpi=dpi
            )
        else:
            # 自动检测
            markdown = processor.process_uploaded_document(
                file_path=temp_path,
                force_ocr=False
            )

        char_count = len(markdown)

        print(f"✓ 转换成功: {file.filename}, {char_count:,} 字符")

        return JSONResponse({
            "success": True,
            "markdown": markdown,
            "filename": file.filename,
            "charCount": char_count
        })

    except Exception as e:
        print(f"✗ 转换失败: {file.filename}, 错误: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"转换失败: {str(e)}"
        )

    finally:
        # 清理临时文件
        try:
            Path(temp_path).unlink()
        except:
            pass


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="DeepSeek-OCR API服务器")
    parser.add_argument(
        '--host',
        type=str,
        default='0.0.0.0',
        help='服务器地址（默认：0.0.0.0）'
    )
    parser.add_argument(
        '--port',
        type=int,
        default=8000,
        help='服务器端口（默认：8000）'
    )
    args = parser.parse_args()

    print("=" * 60)
    print("DeepSeek-OCR API服务器")
    print("=" * 60)
    print(f"地址: http://{args.host}:{args.port}")
    print(f"API文档: http://localhost:{args.port}/docs")
    print("=" * 60)
    print("\nAPI端点:")
    print(f"  POST /api/convert-document - 转换文档")
    print(f"  GET  /health - 健康检查")
    print("\n使用示例:")
    print(f'  curl -X POST -F "file=@doc.pdf" http://localhost:{args.port}/api/convert-document')
    print("\n按 Ctrl+C 停止服务器")
    print("=" * 60)

    uvicorn.run(
        app,
        host=args.host,
        port=args.port,
        log_level="info"
    )
