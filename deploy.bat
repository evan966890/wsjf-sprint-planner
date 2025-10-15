@echo off
echo ========================================
echo WSJF Sprint Planner - 快速部署脚本
echo ========================================
echo.

echo [1/3] 构建生产版本...
call npm run build
if errorlevel 1 (
    echo 构建失败！
    pause
    exit /b 1
)
echo 构建成功！
echo.

echo [2/3] 检查 Vercel CLI...
where vercel >nul 2>nul
if errorlevel 1 (
    echo 未检测到 Vercel CLI，正在安装...
    call npm install -g vercel
)
echo.

echo [3/3] 开始部署...
echo.
echo ========================================
echo 请按照以下步骤操作：
echo.
echo 1. 如果是首次使用，会打开浏览器要求登录
echo 2. 使用 GitHub/GitLab/Email 登录 Vercel
echo 3. 授权后会自动继续部署
echo 4. 部署完成后会显示访问 URL
echo ========================================
echo.
pause

call vercel --prod

echo.
echo ========================================
echo 部署完成！
echo 您的应用已成功部署到 Vercel
echo ========================================
pause
