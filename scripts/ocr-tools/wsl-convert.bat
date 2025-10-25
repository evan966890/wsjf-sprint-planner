@echo off
REM Windows to WSL2 Bridge - Batch Converter
REM Uses DeepSeek-OCR in WSL2 to convert PDFs and images

setlocal enabledelayedexpansion

echo.
echo ========================================
echo  WSL2 DeepSeek-OCR Converter
echo ========================================
echo.

REM Get input directory
if "%~1"=="" (
    set "INPUT_DIR=%CD%"
    echo Using current directory
) else (
    set "INPUT_DIR=%~1"
)

echo Input folder: !INPUT_DIR!
echo.

REM Copy the bash script to WSL2 if needed
echo Preparing WSL2 environment...
wsl bash -c "mkdir -p ~/ocr-tools"

REM Copy the script
copy /Y wsl2-batch-convert.sh \\wsl$\Ubuntu\home\%USERNAME%\ocr-tools\ >nul 2>&1

REM Make it executable
wsl bash -c "chmod +x ~/ocr-tools/wsl2-batch-convert.sh"

echo.
echo Starting conversion in WSL2...
echo This will use DeepSeek-OCR model
echo.

REM Run the WSL2 script
wsl bash ~/ocr-tools/wsl2-batch-convert.sh "!INPUT_DIR!"

echo.
echo ========================================
echo  Done!
echo ========================================
echo.
pause
