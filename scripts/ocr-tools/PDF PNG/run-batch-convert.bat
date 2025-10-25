@echo off
REM Simple batch converter launcher
REM Double-click to run or drag a folder onto this file

setlocal enabledelayedexpansion

echo.
echo ========================================
echo  Batch PDF/Image to Markdown Converter
echo ========================================
echo.

REM Get input directory
if "%~1"=="" (
    set "INPUT_DIR=%CD%"
    echo No folder specified. Using current directory.
) else (
    set "INPUT_DIR=%~1"
    echo Input folder: !INPUT_DIR!
)

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

python "%~dp0batch-convert.py" "!INPUT_DIR!" --resolution !RES! --dpi !DPI!

echo.
echo ========================================
echo  Done!
echo ========================================
echo.
echo Output folder: !INPUT_DIR!\markdown_output
echo.
pause
