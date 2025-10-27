# 测试 /open_api/projects/detail 端点（根据官方文档）
$token = "v-77056959-cfd2-4d97-911c-4ba47e2fa3b6"
$userKey = "7541721806923694188"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing /open_api/projects/detail" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$headers = @{
    "X-Plugin-Token" = $token
    "X-User-Key" = $userKey
    "Content-Type" = "application/json"
}

$body = @{
    simple_names = @("mit", "minrd")
    user_key = $userKey
} | ConvertTo-Json

Write-Host "Request Headers:" -ForegroundColor Yellow
Write-Host ($headers | ConvertTo-Json) -ForegroundColor Gray
Write-Host ""
Write-Host "Request Body:" -ForegroundColor Yellow
Write-Host $body -ForegroundColor Gray
Write-Host ""

try {
    $url = "https://project.f.mioffice.cn/open_api/projects/detail"

    $response = Invoke-RestMethod -Method Post -Uri $url -Headers $headers -Body $body -TimeoutSec 10

    Write-Host "========================================" -ForegroundColor Green
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 5) -ForegroundColor Gray

} catch {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "FAILED!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red

    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "Status Code: $statusCode" -ForegroundColor Red

        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response Body:" -ForegroundColor Yellow
            Write-Host $responseBody.Substring(0, [Math]::Min(500, $responseBody.Length)) -ForegroundColor Gray
        } catch {
            Write-Host "Cannot read response body" -ForegroundColor Gray
        }
    }
}

Write-Host ""
Read-Host "Press Enter to exit"
