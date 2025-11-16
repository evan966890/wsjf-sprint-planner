@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo =====================================
echo   飞书项目流程管理配置工具 - 快速开始
echo =====================================
echo.

:: 检查是否安装了Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 未检测到Node.js，请先安装Node.js
    echo    访问 https://nodejs.org 下载安装
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✅ 检测到Node.js版本: %NODE_VERSION%
echo.

:: 安装依赖
echo 📦 安装依赖包...
call npm install
echo.

:: 检查认证配置文件
if not exist "auth-config.json" (
    echo ⚠️  未找到认证配置文件
    echo.

    if exist "auth-config-template.json" (
        echo 正在复制配置模板...
        copy auth-config-template.json auth-config.json >nul
        echo ✅ 已创建 auth-config.json
        echo.
        echo 📝 请编辑 auth-config.json 文件，填入您的认证信息：
        echo    - pluginToken: 插件访问凭证
        echo    - userKey: 用户标识
        echo    - projectKey: 项目空间ID或域名
        echo.
        echo 配置完成后，请重新运行此脚本。
        pause
        exit /b 0
    ) else (
        echo ❌ 找不到配置模板文件
        pause
        exit /b 1
    )
)

echo ✅ 找到认证配置文件
echo.

:: 选择运行模式
echo 请选择运行模式：
echo 1) 完整配置 - 创建所有流程节点和字段
echo 2) 仅创建字段 - 快速创建质量指标字段
echo 3) 查看手动配置指南
echo.
set /p choice="请输入选项 (1-3): "

if "%choice%"=="1" (
    echo.
    echo 🚀 开始完整配置...
    echo.
    node api-client.js
) else if "%choice%"=="2" (
    echo.
    echo 🚀 开始创建质量指标字段...
    echo.
    node create-metrics-fields.js
) else if "%choice%"=="3" (
    echo.
    echo 📖 打开手动配置指南...
    start MANUAL_CONFIGURATION_GUIDE.md
) else (
    echo 无效选项
    pause
    exit /b 1
)

echo.
echo =====================================
echo   配置流程已完成
echo =====================================
echo.
echo 📊 后续步骤：
echo 1. 查看生成的报告文件
echo 2. 在飞书项目管理中验证配置
echo 3. 创建测试需求走完整流程
echo.
echo 如需帮助，请查看 README.md 或 MANUAL_CONFIGURATION_GUIDE.md

pause