@echo off
REM Quick converter - Just double-click!
REM Converts all PDFs and images in current folder

echo.
echo ==============================
echo  Quick PDF to Markdown
echo ==============================
echo.
echo Converting files in: %CD%
echo.
echo Please wait...
echo.

python "%~dp0batch-convert.py" "%CD%" --resolution base --dpi 200

echo.
echo ==============================
echo  Complete!
echo ==============================
echo.
echo Check folder: markdown_output
echo.
pause
