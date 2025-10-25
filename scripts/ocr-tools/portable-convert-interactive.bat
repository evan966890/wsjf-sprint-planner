@echo off
REM Portable PDF to Markdown Converter (Interactive)
REM This file can be copied anywhere

setlocal enabledelayedexpansion

REM === Configuration ===
set "SCRIPT_DIR=D:\code\WSJF\scripts\ocr-tools"
set "PYTHON_SCRIPT=%SCRIPT_DIR%\batch-convert.py"

REM Check if Python script exists
if not exist "%PYTHON_SCRIPT%" (
    echo.
    echo ERROR: Cannot find batch-convert.py
    echo Expected: %PYTHON_SCRIPT%
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Batch PDF/Image to Markdown Converter
echo ========================================
echo.
echo Current folder: %CD%
echo.
echo Select mode:
echo   1 = Quick (recommended)
echo   2 = High Quality (slow)
echo   3 = Fast (lower quality)
echo.

set /p CHOICE="Your choice (1-3): "

if "%CHOICE%"=="2" (
    set "RES=large"
    set "DPI=300"
) else if "%CHOICE%"=="3" (
    set "RES=small"
    set "DPI=150"
) else (
    set "RES=base"
    set "DPI=200"
)

echo.
echo Starting conversion...
echo Resolution: !RES!, DPI: !DPI!
echo.

python "%PYTHON_SCRIPT%" "%CD%" --resolution !RES! --dpi !DPI!

echo.
echo ========================================
echo  Done!
echo ========================================
echo.
echo Output folder: %CD%\markdown_output
echo.
pause
