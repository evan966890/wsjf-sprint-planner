# Debug version - shows full API response

$body = @{
    app_id = "MII_68F1064FA240006C"
    app_secret = "050E0E049ACB87339CB9D11E5641564F"
} | ConvertTo-Json

Write-Host "Sending request..." -ForegroundColor Yellow
Write-Host "Request body: $body" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Method Post -Uri "https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal" -Body $body -ContentType "application/json"

    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Full API Response:" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ($response | ConvertTo-Json -Depth 10)
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Response fields:" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Cyan

    $response.PSObject.Properties | ForEach-Object {
        Write-Host "$($_.Name): $($_.Value)" -ForegroundColor Cyan
    }

    Write-Host ""
    Write-Host "Checking different token fields..." -ForegroundColor Yellow
    Write-Host "tenant_access_token: $($response.tenant_access_token)" -ForegroundColor Green
    Write-Host "app_access_token: $($response.app_access_token)" -ForegroundColor Green
    Write-Host "access_token: $($response.access_token)" -ForegroundColor Green

} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Full error:" -ForegroundColor Red
    Write-Host $_.Exception
}

Write-Host ""
Read-Host "Press Enter to exit"
