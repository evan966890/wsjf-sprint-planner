# 重启开发服务器
# 自动停止现有进程并启动新的

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Restarting Development Server" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 停止现有的npm dev进程
Write-Host "Stopping existing dev server..." -ForegroundColor Yellow

# 查找并停止node进程（端口3000）
$processes = Get-Process node -ErrorAction SilentlyContinue | Where-Object {
    $_.MainWindowTitle -like "*vite*" -or
    $_.CommandLine -like "*npm run dev*" -or
    $_.CommandLine -like "*vite*"
}

if ($processes) {
    Write-Host "Found $($processes.Count) node process(es)" -ForegroundColor Yellow
    $processes | ForEach-Object {
        Write-Host "  Stopping PID $($_.Id)..." -ForegroundColor Gray
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
    Write-Host "Stopped!" -ForegroundColor Green
} else {
    Write-Host "No existing dev server found" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Starting new dev server..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 启动新的开发服务器
Set-Location "D:\code\WSJF"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd D:\code\WSJF; npm run dev"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Dev server starting in new window!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Wait a few seconds, then open:" -ForegroundColor Cyan
Write-Host "http://localhost:3000" -ForegroundColor Green
Write-Host ""
