# 获取 plugin_access_token (type=0)
# 不需要管理员权限

$body = @{
    plugin_id = "MII_68F1064FA240006C"
    plugin_secret = "050E0E049ACB87339CB9D11E5641564F"
    type = 0
} | ConvertTo-Json

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Getting plugin_access_token (type=0)" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

try {
    $response = Invoke-RestMethod -Method Post -Uri "https://project.f.mioffice.cn/open_api/authen/plugin_token" -Body $body -ContentType "application/json"

    Write-Host "Full Response:" -ForegroundColor Gray
    Write-Host ($response | ConvertTo-Json -Depth 5) -ForegroundColor Gray
    Write-Host ""

    if ($response.err_code -eq 0) {
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "SUCCESS!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Your Plugin Token (type=0):" -ForegroundColor Yellow
        Write-Host ""
        Write-Host $response.data.token -ForegroundColor Green
        Write-Host ""
        Write-Host "Valid for: $($response.data.expire_time) seconds (2 hours)" -ForegroundColor Cyan
        Write-Host ""

        # 复制到剪贴板
        try {
            Set-Clipboard -Value $response.data.token
            Write-Host "Token copied to clipboard!" -ForegroundColor Green
        } catch {
            Write-Host "Please copy the token manually" -ForegroundColor Yellow
        }

        Write-Host ""
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "Next: Use this token in WSJF" -ForegroundColor Cyan
        Write-Host "========================================" -ForegroundColor Cyan
    } else {
        Write-Host "========================================" -ForegroundColor Red
        Write-Host "FAILED!" -ForegroundColor Red
        Write-Host "========================================" -ForegroundColor Red
        Write-Host ""
        Write-Host "Error Code: $($response.err_code)" -ForegroundColor Red
        Write-Host "Error Message: $($response.err_msg)" -ForegroundColor Red
    }
} catch {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "Request failed!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Read-Host "Press Enter to exit"
