# 获取MIT项目的工作项类型列表
# 用于找到正确的work_item_type_key

$pluginId = "MII_68F1064FA240006C"
$pluginSecret = "050E0E049ACB87339CB9D11E5641564F"
$userKey = "7541721806923694188"
$projectKey = "632d4f29aa4481312c2ab170"  # MIT项目

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "获取MIT项目的工作项类型列表" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 步骤1：获取plugin_access_token
Write-Host "步骤1: 获取plugin_access_token..." -ForegroundColor Yellow
$tokenBody = @{
    plugin_id = $pluginId
    plugin_secret = $pluginSecret
    type = 0
} | ConvertTo-Json

try {
    $tokenResponse = Invoke-RestMethod -Method Post -Uri "https://project.f.mioffice.cn/open_api/authen/plugin_token" -Body $tokenBody -ContentType "application/json"

    if ($tokenResponse.error.code -eq 0) {
        $token = $tokenResponse.data.token
        Write-Host "✅ Token获取成功: $token" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host "❌ Token获取失败" -ForegroundColor Red
        exit
    }
} catch {
    Write-Host "❌ 错误: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# 步骤2：尝试获取工作项类型列表
Write-Host "步骤2: 获取工作项类型列表..." -ForegroundColor Yellow
Write-Host ""

$headers = @{
    "X-Plugin-Token" = $token
    "X-User-Key" = $userKey
    "Content-Type" = "application/json"
}

# 尝试几种可能的API端点
$endpoints = @(
    "/open_api/$projectKey/work_item/types",
    "/open_api/$projectKey/work_item_types",
    "/open_api/work_item/types?project_key=$projectKey"
)

foreach ($endpoint in $endpoints) {
    $url = "https://project.f.mioffice.cn$endpoint"
    Write-Host "尝试: $url" -ForegroundColor Cyan

    try {
        $response = Invoke-RestMethod -Method Get -Uri $url -Headers $headers

        if ($response.error.code -eq 0 -or $response.err_code -eq 0) {
            Write-Host "✅ 成功！" -ForegroundColor Green
            Write-Host ""
            Write-Host "工作项类型列表：" -ForegroundColor Yellow

            # 兼容旧版PowerShell，不使用 ?? 操作符
            $types = $response.data.work_item_types
            if (-not $types) { $types = $response.data.types }
            if (-not $types) { $types = $response.data }
            if (-not $types) { $types = @() }

            foreach ($type in $types) {
                Write-Host "---" -ForegroundColor Gray
                Write-Host "名称: $($type.name)" -ForegroundColor White

                # 兼容旧版PowerShell，不使用 ?? 操作符
                $typeKey = $type.work_item_type_key
                if (-not $typeKey) { $typeKey = $type._id }
                if (-not $typeKey) { $typeKey = $type.id }

                Write-Host "Type Key: $typeKey" -ForegroundColor Green
                Write-Host "Icon: $($type.icon)" -ForegroundColor Gray
            }

            Write-Host ""
            Write-Host "========================================" -ForegroundColor Green
            Write-Host "找到了！复制上面的Type Key到WSJF" -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Green

            Read-Host "Press Enter to exit"
            exit
        }
    } catch {
        Write-Host "  失败: $($_.Exception.Message)" -ForegroundColor Red
    }

    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Yellow
Write-Host "所有端点都失败了" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "请使用方法2：在飞书项目管理平台的Network面板查找" -ForegroundColor Cyan
Write-Host ""
Write-Host "步骤：" -ForegroundColor Yellow
Write-Host "1. 打开 https://project.f.mioffice.cn" -ForegroundColor White
Write-Host "2. 进入MIT项目" -ForegroundColor White
Write-Host "3. 按F12 → Network → XHR" -ForegroundColor White
Write-Host "4. 点击'需求'菜单" -ForegroundColor White
Write-Host "5. 找到 work_item/filter 请求" -ForegroundColor White
Write-Host "6. 查看Payload中的 work_item_type_key" -ForegroundColor White
Write-Host "7. 复制这个key值到WSJF" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to exit"
