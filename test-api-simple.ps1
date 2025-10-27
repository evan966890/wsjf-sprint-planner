# 简单测试 /api/projects/list 端点
$token = "v-77056959-cfd2-4d97-911c-4ba47e2fa3b6"
$userKey = "7541721806923694188"

$headers = @{
    "X-Plugin-Token" = $token
    "X-User-Key" = $userKey
    "Content-Type" = "application/json"
}

Write-Host "Testing: /api/projects/list" -ForegroundColor Yellow
Write-Host ""

try {
    $url = "https://project.f.mioffice.cn/api/projects/list"

    $response = Invoke-RestMethod -Method Get -Uri $url -Headers $headers -TimeoutSec 10

    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host "Full Response:" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 10) -ForegroundColor Gray

} catch {
    Write-Host "Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "StatusCode: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
}

Write-Host ""
Read-Host "Press Enter to exit"
