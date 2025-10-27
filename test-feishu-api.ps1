# 测试飞书项目API端点
# 帮助找到正确的API路径

$token = "p-b0998e9d-a248-4bd2-bc90-302268b25136"
$domain = "project.f.mioffice.cn"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing Feishu Project API Endpoints" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 尝试不同的可能的项目列表API端点
$endpoints = @(
    "/open_api/projects/list",
    "/open_api/projects",
    "/open_api/project/list",
    "/open_api/project",
    "/api/projects/list",
    "/api/projects",
    "/project/v1/project",
    "/open-apis/project/v1/project"
)

foreach ($endpoint in $endpoints) {
    $url = "https://$domain$endpoint"

    Write-Host "Testing: $url" -ForegroundColor Yellow

    try {
        $headers = @{
            "X-Plugin-Token" = $token
            "Content-Type" = "application/json"
        }

        $response = Invoke-RestMethod -Method Get -Uri $url -Headers $headers -TimeoutSec 5

        Write-Host "  SUCCESS!" -ForegroundColor Green
        Write-Host "  Response:" -ForegroundColor Green
        Write-Host ($response | ConvertTo-Json -Depth 3) -ForegroundColor Gray
        Write-Host ""

        # 如果成功，记录这个端点
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "FOUND WORKING ENDPOINT!" -ForegroundColor Green
        Write-Host "URL: $url" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        break

    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $errorMsg = $_.Exception.Message

        if ($statusCode) {
            Write-Host "  HTTP $statusCode" -ForegroundColor Red
        } else {
            Write-Host "  Error: $errorMsg" -ForegroundColor Red
        }
    }

    Write-Host ""
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Alternative: Check API Documentation" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "If none of the endpoints work, you may need to:" -ForegroundColor Yellow
Write-Host "1. Check the official API documentation"
Write-Host "2. Look at network requests in browser dev tools"
Write-Host "3. Contact Feishu support for correct API endpoints"
Write-Host ""

Read-Host "Press Enter to exit"
