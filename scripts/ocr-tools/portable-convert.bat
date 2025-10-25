@echo off
REM Portable PDF to Markdown Converter
REM This file can be copied anywhere and will still work

setlocal enabledelayedexpansion

REM === Configuration ===
REM Set the absolute path to the Python script
set "SCRIPT_DIR=D:\code\WSJF\scripts\ocr-tools"
set "PYTHON_SCRIPT=%SCRIPT_DIR%\batch-convert.py"

REM Check if Python script exists
if not exist "%PYTHON_SCRIPT%" (
    echo.
    echo ERROR: Cannot find batch-convert.py
    echo Expected location: %PYTHON_SCRIPT%
    echo.
    echo Please check the SCRIPT_DIR path in this file.
    echo.
    pause
    exit /b 1
)

echo.
echo ==============================
echo  Quick PDF to Markdown
echo ==============================
echo.
echo Converting files in: %CD%
echo.
echo Please wait...
echo.

REM Run the Python script with current directory
python "%PYTHON_SCRIPT%" "%CD%" --resolution base --dpi 200

echo.
echo ==============================
echo  Complete!
echo ==============================
echo.
echo Check folder: %CD%\markdown_output
echo.
pause
