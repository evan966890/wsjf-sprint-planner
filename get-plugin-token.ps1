# Get Feishu PROJECT Plugin Token (not standard Feishu API)
# This uses the project-specific API endpoint

$pluginId = "MII_68F1064FA240006C"
$pluginSecret = "050E0E049ACB87339CB9D11E5641564F"

Write-Host "Trying different API endpoints..." -ForegroundColor Yellow
Write-Host ""

# Try endpoint 1: Standard Feishu API
Write-Host "1. Trying standard Feishu API..." -ForegroundColor Cyan
try {
    $body1 = @{
        app_id = $pluginId
        app_secret = $pluginSecret
    } | ConvertTo-Json

    $response1 = Invoke-RestMethod -Method Post -Uri "https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal" -Body $body1 -ContentType "application/json"

    if ($response1.code -eq 0) {
        Write-Host "   SUCCESS!" -ForegroundColor Green
        Write-Host "   Token: $($response1.tenant_access_token)" -ForegroundColor Green
        Set-Clipboard -Value $response1.tenant_access_token
        Write-Host "   Copied to clipboard!" -ForegroundColor Green
        Read-Host "Press Enter to exit"
        exit
    } else {
        Write-Host "   Failed: code=$($response1.code), msg=$($response1.msg)" -ForegroundColor Red
    }
} catch {
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Try endpoint 2: Using plugin_id/plugin_secret naming
Write-Host "2. Trying with plugin_id/plugin_secret..." -ForegroundColor Cyan
try {
    $body2 = @{
        plugin_id = $pluginId
        plugin_secret = $pluginSecret
    } | ConvertTo-Json

    $response2 = Invoke-RestMethod -Method Post -Uri "https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal" -Body $body2 -ContentType "application/json"

    if ($response2.code -eq 0) {
        Write-Host "   SUCCESS!" -ForegroundColor Green
        Write-Host "   Token: $($response2.tenant_access_token)" -ForegroundColor Green
        Set-Clipboard -Value $response2.tenant_access_token
        Write-Host "   Copied to clipboard!" -ForegroundColor Green
        Read-Host "Press Enter to exit"
        exit
    } else {
        Write-Host "   Failed: code=$($response2.code), msg=$($response2.msg)" -ForegroundColor Red
    }
} catch {
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Try endpoint 3: Project-specific domain
Write-Host "3. Trying project.feishu.cn domain..." -ForegroundColor Cyan
try {
    $body3 = @{
        plugin_id = $pluginId
        plugin_secret = $pluginSecret
    } | ConvertTo-Json

    $response3 = Invoke-RestMethod -Method Post -Uri "https://project.feishu.cn/open_api/authen" -Body $body3 -ContentType "application/json"

    Write-Host "   Response: $($response3 | ConvertTo-Json)" -ForegroundColor Cyan
} catch {
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "None of the endpoints worked." -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Please do the following:" -ForegroundColor Cyan
Write-Host "1. Go to Feishu Open Platform"
Write-Host "2. Go to your plugin -> Development -> Permission Management"
Write-Host "3. Look for 'Virtual Token' or 'Test Token' section"
Write-Host "4. Copy the token manually"
Write-Host "5. If you cannot find it, screenshot the ENTIRE permission page"
Write-Host ""

Read-Host "Press Enter to exit"
