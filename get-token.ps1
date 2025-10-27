# Get Feishu Plugin Token
# Run this script to get your plugin token

$body = @{
    app_id = "MII_68F1064FA240006C"
    app_secret = "050E0E049ACB87339CB9D11E5641564F"
} | ConvertTo-Json

try {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Fetching token from Feishu..." -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""

    $response = Invoke-RestMethod -Method Post -Uri "https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal" -Body $body -ContentType "application/json"

    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "SUCCESS! Token obtained!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Your Plugin Token:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host $response.tenant_access_token -ForegroundColor Green
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Token valid for: 2 hours" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Copy the green token above"
    Write-Host "2. Open WSJF app (http://localhost:3000)"
    Write-Host "3. Click 'Import from Feishu' button"
    Write-Host "4. Select 'Manual Token' mode"
    Write-Host "5. Paste the token"
    Write-Host "6. Check 'Use Plugin Header'"
    Write-Host "7. Click 'Save and Test'"
    Write-Host ""

    # Try to copy to clipboard
    try {
        Set-Clipboard -Value $response.tenant_access_token
        Write-Host "Token copied to clipboard automatically!" -ForegroundColor Green
        Write-Host "You can paste it directly in WSJF!" -ForegroundColor Green
    } catch {
        Write-Host "Please copy the token manually" -ForegroundColor Yellow
    }

} catch {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "ERROR: Failed to get token" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "1. Network connection"
    Write-Host "2. Plugin ID and Secret are correct"
    Write-Host "3. App is published on Feishu platform"
    Write-Host ""
}

Write-Host ""
Read-Host "Press Enter to exit"
