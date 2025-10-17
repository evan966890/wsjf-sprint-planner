@echo off
chcp 65001 >nul
echo ========================================
echo   WSJF Sprint Planner - 腾讯云部署脚本
echo ========================================
echo.

echo [步骤 1/4] 检查 Node.js 环境...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js 未安装，请先安装 Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js 已安装

echo.
echo [步骤 2/4] 构建生产版本...
call npm run build
if errorlevel 1 (
    echo ❌ 构建失败，请检查错误信息
    pause
    exit /b 1
)
echo ✅ 构建完成

echo.
echo [步骤 3/4] 检查 CloudBase CLI...
call cloudbase --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  CloudBase CLI 未安装
    echo.
    echo 是否立即安装？(Y/N)
    set /p install="请选择: "
    if /i "%install%"=="Y" (
        echo 正在安装 CloudBase CLI...
        call npm install -g @cloudbase/cli
        if errorlevel 1 (
            echo ❌ 安装失败
            pause
            exit /b 1
        )
        echo ✅ CloudBase CLI 安装成功
    ) else (
        echo 取消部署
        pause
        exit /b 1
    )
) else (
    echo ✅ CloudBase CLI 已安装
)

echo.
echo [步骤 4/4] 部署到腾讯云 CloudBase...
echo.
echo ⚠️  请确保已完成以下准备工作：
echo   1. 已登录腾讯云账号 (cloudbase login)
echo   2. 已创建环境并获取 ENV_ID
echo   3. 已在 cloudbaserc.json 中配置 ENV_ID
echo.
echo 是否继续部署？(Y/N)
set /p confirm="请选择: "
if /i not "%confirm%"=="Y" (
    echo 取消部署
    pause
    exit /b 0
)

echo.
echo 开始部署...
call cloudbase framework deploy
if errorlevel 1 (
    echo.
    echo ❌ 部署失败
    echo.
    echo 常见问题：
    echo   1. 未登录：运行 cloudbase login
    echo   2. ENV_ID 未配置：编辑 cloudbaserc.json
    echo   3. 权限不足：检查账号权限设置
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ 部署成功！
echo ========================================
echo.
echo 访问腾讯云控制台查看：
echo https://console.cloud.tencent.com/tcb
echo.
pause
