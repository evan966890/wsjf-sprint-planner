@echo off
chcp 65001 >nul
echo ========================================
echo WSJF Sprint Planner - Vercel 部署脚本
echo ========================================
echo.

echo [步骤 1/4] 检查 Vercel 登录状态...
vercel whoami >nul 2>nul
if errorlevel 1 (
    echo.
    echo ⚠️  您还没有登录 Vercel
    echo.
    echo 请按照以下步骤登录：
    echo 1. 浏览器会自动打开 Vercel 登录页面
    echo 2. 选择登录方式（推荐使用 GitHub）
    echo 3. 授权后返回此窗口继续
    echo.
    echo 按任意键开始登录...
    pause >nul

    echo 正在打开登录页面...
    vercel login

    if errorlevel 1 (
        echo.
        echo ❌ 登录失败，请重试
        pause
        exit /b 1
    )

    echo.
    echo ✅ 登录成功！
    echo.
)

echo [步骤 2/4] 构建生产版本...
call npm run build
if errorlevel 1 (
    echo.
    echo ❌ 构建失败！请检查错误信息
    pause
    exit /b 1
)
echo ✅ 构建成功！
echo.

echo [步骤 3/4] 准备部署配置...
if not exist vercel.json (
    echo ⚠️  未找到 vercel.json 配置文件
    pause
    exit /b 1
)
echo ✅ 配置文件已就绪
echo.

echo [步骤 4/4] 部署到 Vercel 生产环境...
echo.
echo ========================================
echo 部署说明：
echo - 首次部署会询问项目配置
echo - 建议项目名称：wsjf-sprint-planner
echo - 部署完成后会显示访问 URL
echo ========================================
echo.
echo 按任意键开始部署...
pause >nul

echo.
echo 正在部署...
vercel --prod --yes

if errorlevel 1 (
    echo.
    echo ========================================
    echo ❌ 部署失败
    echo ========================================
    echo.
    echo 可能的原因：
    echo 1. 网络连接问题
    echo 2. Vercel 账号权限不足
    echo 3. 构建配置错误
    echo.
    echo 请查看上方错误信息，或参考 DEPLOY_GUIDE.md
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ 部署成功！
echo ========================================
echo.
echo 🎉 您的应用已成功部署到 Vercel！
echo.
echo 📝 重要提示：
echo - 复制上方显示的 Production URL
echo - 首次访问可能需要等待 1-2 分钟（DNS 传播）
echo - 确认浏览器地址栏显示 🔒 锁图标（HTTPS）
echo - 如遇证书错误，等待 5 分钟后刷新
echo.
echo 📚 更多帮助：
echo - 查看 DEPLOY_GUIDE.md 了解详细说明
echo - 访问 https://vercel.com/dashboard 管理项目
echo.
echo ========================================
pause
