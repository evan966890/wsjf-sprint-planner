@echo off
echo ================================================
echo 飞书 MCP 导入服务启动脚本
echo ================================================
echo.

echo [1/3] 清理旧的 Node 进程...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/3] 启动后端 MCP 代理服务器...
cd /d "%~dp0server"
start "飞书 MCP 代理" cmd /k "npm start"
cd /d "%~dp0"
timeout /t 3 /nobreak >nul

echo [3/3] 启动前端应用...
start "WSJF 前端" cmd /k "npm run dev"

echo.
echo ================================================
echo ✅ 服务启动完成！
echo ================================================
echo.
echo 前端地址: http://localhost:3000 (如果 3000 被占用会自动切换)
echo 后端地址: http://localhost:9999
echo.
echo 按任意键关闭此窗口...
pause >nul
