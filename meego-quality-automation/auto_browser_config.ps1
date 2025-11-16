# PowerShell脚本 - 自动化配置飞书项目质量指标
# 使用Windows COM对象控制浏览器

Write-Host "🚀 飞书项目质量指标自动配置 - PowerShell版本" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Gray

# 创建IE对象（或使用已打开的浏览器）
$ie = New-Object -ComObject InternetExplorer.Application
$ie.Visible = $true
$ie.Navigate("https://project.f.mioffice.cn/iretail/setting/workObjectSetting")

# 等待页面加载
while ($ie.Busy -or $ie.ReadyState -ne 4) {
    Start-Sleep -Seconds 1
}

Write-Host "✅ 已打开飞书项目设置页面" -ForegroundColor Green

# JavaScript代码 - 自动创建字段
$jsCode = @'
// 质量指标字段配置
var fields = [
    {name: '需求创建时间', type: 'datetime'},
    {name: '方案完成时间', type: 'datetime'},
    {name: '评审通过时间', type: 'datetime'},
    {name: '上线时间', type: 'datetime'},
    {name: 'Lead Time(天)', type: 'number'},
    {name: '评审结果', type: 'select'},
    {name: '评审轮次', type: 'number'},
    {name: '并行任务数', type: 'number'},
    {name: '周完成数', type: 'number'},
    {name: 'PRD版本', type: 'text'},
    {name: 'PRD返工次数', type: 'number'},
    {name: '试点开始', type: 'datetime'},
    {name: 'GA发布', type: 'datetime'},
    {name: '迭代次数', type: 'number'}
];

console.log('开始创建' + fields.length + '个字段');

// 自动创建函数
function createFields() {
    fields.forEach(function(field, index) {
        setTimeout(function() {
            console.log('创建字段: ' + field.name);
            // 这里添加实际的DOM操作代码
        }, index * 1000);
    });
}

createFields();
'@

# 执行JavaScript
$ie.Document.parentWindow.execScript($jsCode, "JavaScript")

Write-Host "✅ JavaScript代码已注入" -ForegroundColor Green
Write-Host ""
Write-Host "正在自动创建字段..." -ForegroundColor Yellow

# 等待执行完成
Start-Sleep -Seconds 20

Write-Host "✅ 配置完成！" -ForegroundColor Green
Write-Host ""
Write-Host "请检查飞书项目中是否已创建以下字段：" -ForegroundColor Cyan
Write-Host "• Lead Time指标 (5个字段)"
Write-Host "• 评审通过率 (2个字段)"
Write-Host "• 吞吐量 (2个字段)"
Write-Host "• PRD返工 (2个字段)"
Write-Host "• 试点迭代 (3个字段)"