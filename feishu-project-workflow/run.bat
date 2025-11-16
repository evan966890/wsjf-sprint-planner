@echo off
echo ========================================
echo   飞书项目质量指标自动配置工具 v2.0
echo ========================================
echo.

REM 检查是否存在node_modules
if not exist "node_modules\" (
    echo [1/3] 安装依赖...
    call npm install
    if errorlevel 1 (
        echo 错误：依赖安装失败
        pause
        exit /b 1
    )
    echo 依赖安装成功！
    echo.
)

REM 检查是否存在.env文件
if not exist ".env" (
    echo [2/3] 创建环境配置文件...
    copy .env.example .env > nul
    echo 已创建 .env 文件，使用默认配置
    echo.
)

REM 编译TypeScript
echo [2/3] 编译TypeScript...
call npm run build > nul 2>&1
if errorlevel 1 (
    echo 警告：编译失败，尝试直接运行TypeScript...
    echo.
    echo [3/3] 运行配置脚本...
    call npm run config
) else (
    echo 编译成功！
    echo.
    echo [3/3] 运行配置脚本...
    call npm start
)

echo.
echo ========================================
echo 配置完成！请访问以下地址验证：
echo https://project.f.mioffice.cn/iretail/setting/workObject/story?menuTab=fieldManagement
echo ========================================
echo.
pause