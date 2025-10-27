# Get Work Item Types for MIT Project
# Simple version without encoding issues

$pluginId = "MII_68F1064FA240006C"
$pluginSecret = "050E0E049ACB87339CB9D11E5641564F"
$userKey = "7541721806923694188"
$projectKey = "632d4f29aa4481312c2ab170"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Get Work Item Types for MIT Project" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Get plugin_access_token
Write-Host "Step 1: Getting plugin_access_token..." -ForegroundColor Yellow
$tokenBody = @{
    plugin_id = $pluginId
    plugin_secret = $pluginSecret
    type = 0
} | ConvertTo-Json

try {
    $tokenResponse = Invoke-RestMethod -Method Post -Uri "https://project.f.mioffice.cn/open_api/authen/plugin_token" -Body $tokenBody -ContentType "application/json" -TimeoutSec 10

    if ($tokenResponse.error.code -eq 0) {
        $token = $tokenResponse.data.token
        Write-Host "Success! Token: $token" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host "Failed to get token" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit
}

# Step 2: Get work item types
Write-Host "Step 2: Getting work item types..." -ForegroundColor Yellow
Write-Host ""

$headers = @{
    "X-Plugin-Token" = $token
    "X-User-Key" = $userKey
    "Content-Type" = "application/json"
}

$endpoints = @(
    "/open_api/$projectKey/work_item/types",
    "/open_api/$projectKey/work_item_types"
)

$found = $false

foreach ($endpoint in $endpoints) {
    $url = "https://project.f.mioffice.cn$endpoint"
    Write-Host "Trying: $url" -ForegroundColor Cyan

    try {
        $response = Invoke-RestMethod -Method Get -Uri $url -Headers $headers -TimeoutSec 10

        if ($response.error.code -eq 0 -or $response.err_code -eq 0) {
            Write-Host "Success!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Work Item Types:" -ForegroundColor Yellow
            Write-Host ""

            $types = $response.data.work_item_types
            if (-not $types) { $types = $response.data.types }
            if (-not $types) { $types = $response.data }
            if (-not $types) { $types = @() }

            foreach ($type in $types) {
                Write-Host "-----------------------------------" -ForegroundColor Gray
                Write-Host "Name: $($type.name)" -ForegroundColor White

                $typeKey = $type.work_item_type_key
                if (-not $typeKey) { $typeKey = $type._id }
                if (-not $typeKey) { $typeKey = $type.id }

                Write-Host "Type Key: $typeKey" -ForegroundColor Green
                Write-Host ""
            }

            Write-Host ""
            Write-Host "========================================" -ForegroundColor Green
            Write-Host "SUCCESS! Copy the Type Key to WSJF" -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Green
            Write-Host ""

            $found = $true
            break
        }
    } catch {
        Write-Host "  Failed: $($_.Exception.Message)" -ForegroundColor Red
    }

    Write-Host ""
}

if (-not $found) {
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "All endpoints failed" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please use Method 2:" -ForegroundColor Cyan
    Write-Host "1. Open https://project.f.mioffice.cn" -ForegroundColor White
    Write-Host "2. Enter MIT project" -ForegroundColor White
    Write-Host "3. Press F12 -> Network -> XHR" -ForegroundColor White
    Write-Host "4. Click 'Requirements' menu" -ForegroundColor White
    Write-Host "5. Find 'work_item/filter' request" -ForegroundColor White
    Write-Host "6. Check Payload for 'work_item_type_key'" -ForegroundColor White
    Write-Host "7. Copy that key value to WSJF" -ForegroundColor White
    Write-Host ""
}

Read-Host "Press Enter to exit"
