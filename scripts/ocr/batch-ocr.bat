@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ================================================================
echo 批量 OCR 处理工具
echo ================================================================
echo.

REM 获取脚本所在目录
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

echo 请选择 OCR 后端:
echo.
echo   1. 自动选择（推荐）
echo   2. OCR.space（免费 25,000次/月，适合批量）
echo   3. 百度 OCR（中文准确率高，适合中文文档）
echo.
set /p backend_choice="请选择 (1-3) [默认: 1]: "

if "%backend_choice%"=="" set backend_choice=1
if "%backend_choice%"=="1" set backend=auto
if "%backend_choice%"=="2" set backend=ocrspace
if "%backend_choice%"=="3" set backend=baidu

echo.
echo 已选择: %backend%
echo.

echo 请输入要处理的文件夹路径（或拖拽文件夹到这里）:
echo 提示: 也可以输入单个文件路径
echo.
set /p input_path="路径: "

REM 去除引号
set input_path=%input_path:"=%

if "%input_path%"=="" (
    echo.
    echo ❌ 未提供路径
    pause
    exit /b 1
)

if not exist "%input_path%" (
    echo.
    echo ❌ 路径不存在: %input_path%
    pause
    exit /b 1
)

echo.
echo ================================================================
echo 开始处理...
echo ================================================================
echo.

REM 运行批量处理
python batch_ocr.py "%input_path%" --backend %backend%

echo.
echo ================================================================
echo 完成！
echo ================================================================
echo.
pause
