@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ╔══════════════════════════════════════════════════════╗
echo ║     飞书项目(Meego)质量指标自动化配置工具            ║
echo ║            配置即代码 - 快速启动向导                  ║
echo ╚══════════════════════════════════════════════════════╝
echo.

:: 检查Python环境
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 未检测到Python，请先安装Python 3.7+
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('python --version') do set PYTHON_VERSION=%%i
echo ✅ %PYTHON_VERSION%
echo.

:: 创建虚拟环境（如果不存在）
if not exist "venv" (
    echo 📦 创建虚拟环境...
    python -m venv venv
)

:: 激活虚拟环境
call venv\Scripts\activate.bat

:: 安装依赖
echo 📦 安装依赖包...
pip install -r requirements.txt -q
echo ✅ 依赖安装完成
echo.

:: 检查认证配置
if not exist "credentials.yaml" (
    echo ⚠️  未找到认证配置文件

    if exist "credentials.yaml.example" (
        echo 正在创建认证配置...
        copy credentials.yaml.example credentials.yaml >nul
        echo ✅ 已创建 credentials.yaml
        echo.
        echo 📝 请编辑 credentials.yaml 文件，填入您的认证信息：
        echo    1. plugin_id    - 插件ID
        echo    2. plugin_secret - 插件密钥
        echo    3. user_key     - 用户Key
        echo.
        echo 获取方式：
        echo   • 插件ID/密钥: 飞书项目后台 -^> 开发者 -^> 创建插件
        echo   • 用户Key: 飞书客户端 -^> 双击头像
        echo.
        pause
    )
)

:: 检查项目配置
echo 📋 检查项目配置...
findstr "your_project_key" quality-metrics.yaml >nul
if %errorlevel% equ 0 (
    echo ⚠️  请修改 quality-metrics.yaml 中的 project.key
    echo    获取方式: 进入项目空间 -^> 双击空间名称
    echo.
    pause
)

:: 选择运行模式
echo.
echo 请选择运行模式：
echo 1) 🚀 执行同步 - 将配置应用到飞书项目
echo 2) 🔍 调试模式 - 使用Chrome DevTools调试API
echo 3) 📊 生成报告 - 仅生成配置报告，不执行
echo 4) ❌ 退出
echo.
set /p choice="请输入选项 (1-4): "

if "%choice%"=="1" (
    echo.
    echo 🚀 开始同步配置...
    python sync_config.py
) else if "%choice%"=="2" (
    echo.
    echo 🔍 启动调试模式...
    python mcp_debugger.py
) else if "%choice%"=="3" (
    echo.
    echo 📊 生成配置报告...
    python sync_config.py --dry-run
) else if "%choice%"=="4" (
    echo 👋 再见！
    exit /b 0
) else (
    echo 无效选项
    pause
    exit /b 1
)

echo.
echo ═══════════════════════════════════════════════════════
echo ✅ 操作完成！
echo.
echo 下一步：
echo 1. 登录飞书项目查看配置结果
echo 2. 在项目空间中验证字段和流程节点
echo 3. 创建测试需求验证指标计算
echo ═══════════════════════════════════════════════════════
pause