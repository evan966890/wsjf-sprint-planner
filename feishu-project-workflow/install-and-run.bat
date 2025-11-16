@echo off
echo ========================================
echo   飞书项目质量指标配置工具
echo ========================================
echo.

REM 检查是否有凭证文件
if exist "auth-credentials.json" (
    echo [✓] 找到凭证文件
    goto :RUN_CONFIG
) else (
    echo [!] 未找到凭证文件
    echo.
    echo 请按照以下步骤获取凭证：
    echo.
    echo 1. 登录飞书项目: https://project.f.mioffice.cn/iretail
    echo 2. 按F12打开开发者工具，切换到Network标签
    echo 3. 访问字段管理页面
    echo 4. 创建一个测试字段
    echo 5. 在Network中找到"field"请求
    echo 6. 复制x-meego-csrf-token和Cookie值
    echo.
    echo 详细说明请查看 GET_CREDENTIALS.md
    echo.
    echo 获取凭证后，创建auth-credentials.json文件：
    echo {
    echo   "csrf_token": "您的CSRF令牌",
    echo   "cookie": "您的Cookie字符串"
    echo }
    echo.
    pause
    exit /b
)

:RUN_CONFIG
echo.
echo 正在安装依赖...
if not exist "node_modules\" call npm install > nul 2>&1
echo.
echo 正在创建质量指标字段...
echo.
node create-fields-with-auth.js
echo.
echo ========================================
echo 操作完成！
echo 请访问以下地址验证结果：
echo https://project.f.mioffice.cn/iretail/setting/workObject/story?menuTab=fieldManagement
echo ========================================
pause