# Simple token getter - only outputs the token

$body = @{
    app_id = "MII_68F1064FA240006C"
    app_secret = "050E0E049ACB87339CB9D11E5641564F"
} | ConvertTo-Json

$response = Invoke-RestMethod -Method Post -Uri "https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal" -Body $body -ContentType "application/json"

# Only output the token
Write-Host $response.tenant_access_token

# Copy to clipboard
Set-Clipboard -Value $response.tenant_access_token
