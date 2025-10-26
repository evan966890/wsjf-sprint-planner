# Get Feishu PROJECT Plugin Token (Correct API)
# Based on official documentation

$pluginId = "MII_68F1064FA240006C"
$pluginSecret = "050E0E049ACB87339CB9D11E5641564F"

# Try different platform domains
$domains = @(
    "project.f.mioffice.cn",
    "project.feishu.cn",
    "internal-api-lark-project.feishu.cn"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Getting Feishu PROJECT Plugin Token" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

foreach ($domain in $domains) {
    Write-Host "Trying domain: $domain" -ForegroundColor Cyan

    # Type 0: plugin_access_token
    try {
        $body = @{
            plugin_id = $pluginId
            plugin_secret = $pluginSecret
            type = 0
        } | ConvertTo-Json

        $url = "https://$domain/open_api/authen/plugin_token"
        Write-Host "  URL: $url" -ForegroundColor Gray

        $response = Invoke-RestMethod -Method Post -Uri $url -Body $body -ContentType "application/json" -TimeoutSec 10

        Write-Host "  Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray

        if ($response.error.code -eq 0 -and $response.data.token) {
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Green
            Write-Host "SUCCESS! Token obtained!" -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Green
            Write-Host ""
            Write-Host "Domain: $domain" -ForegroundColor Yellow
            Write-Host "Token Type: plugin_access_token" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "Your Token:" -ForegroundColor Yellow
            Write-Host $response.data.token -ForegroundColor Green
            Write-Host ""
            Write-Host "Valid for: $($response.data.expire_time) seconds (2 hours)" -ForegroundColor Cyan
            Write-Host ""

            # Copy to clipboard
            Set-Clipboard -Value $response.data.token
            Write-Host "Token copied to clipboard!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Next: Paste this token in WSJF" -ForegroundColor Cyan
            Write-Host ""
            Read-Host "Press Enter to exit"
            exit
        }
    } catch {
        Write-Host "  Failed: $($_.Exception.Message)" -ForegroundColor Red
    }

    Write-Host ""
}

# Try virtual token (type=1)
Write-Host "Trying virtual_plugin_access_token (type=1)..." -ForegroundColor Cyan
foreach ($domain in $domains) {
    try {
        $body = @{
            plugin_id = $pluginId
            plugin_secret = $pluginSecret
            type = 1
        } | ConvertTo-Json

        $url = "https://$domain/open_api/authen/plugin_token"
        $response = Invoke-RestMethod -Method Post -Uri $url -Body $body -ContentType "application/json" -TimeoutSec 10

        if ($response.error.code -eq 0 -and $response.data.token) {
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Green
            Write-Host "SUCCESS! Virtual Token obtained!" -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Green
            Write-Host ""
            Write-Host "Domain: $domain" -ForegroundColor Yellow
            Write-Host "Token Type: virtual_plugin_access_token" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "Your Token:" -ForegroundColor Yellow
            Write-Host $response.data.token -ForegroundColor Green
            Write-Host ""

            # Copy to clipboard
            Set-Clipboard -Value $response.data.token
            Write-Host "Token copied to clipboard!" -ForegroundColor Green
            Write-Host ""
            Read-Host "Press Enter to exit"
            exit
        }
    } catch {
        # Silent fail, continue trying
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Red
Write-Host "All attempts failed" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""
Write-Host "Possible reasons:" -ForegroundColor Yellow
Write-Host "1. Plugin not published yet"
Write-Host "2. Credentials incorrect"
Write-Host "3. Need to configure data scope in developer backend"
Write-Host ""
Write-Host "Please check:" -ForegroundColor Cyan
Write-Host "1. Go to developer backend -> Basic Info"
Write-Host "2. Verify Plugin ID and Secret"
Write-Host "3. Publish a version if not done yet"
Write-Host "4. Or find the virtual token directly in the developer backend"
Write-Host ""

Read-Host "Press Enter to exit"
