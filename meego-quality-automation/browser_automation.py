#!/usr/bin/env python3
"""
通过浏览器自动化配置飞书项目质量指标
使用selenium或pyautogui自动操作UI
"""

import time
import subprocess
import json

# 5个质量指标配置
METRICS = {
    "Lead Time": [
        ("需求创建时间", "datetime"),
        ("方案完成时间", "datetime"),
        ("评审通过时间", "datetime"),
        ("上线时间", "datetime"),
        ("Lead Time(天)", "number")
    ],
    "评审通过率": [
        ("评审结果", "select"),
        ("评审轮次", "number")
    ],
    "吞吐量": [
        ("并行任务数", "number"),
        ("周完成数", "number")
    ],
    "PRD返工": [
        ("PRD版本", "text"),
        ("PRD返工次数", "number")
    ],
    "试点迭代": [
        ("试点开始", "datetime"),
        ("GA发布", "datetime"),
        ("迭代次数", "number")
    ]
}

print("🚀 启动浏览器自动化配置...")
print("=" * 60)

# 生成JavaScript代码
js_code = """
(async function() {
    console.log('开始自动配置飞书项目质量指标...');

    // 检查是否在正确的页面
    if (!window.location.href.includes('setting')) {
        window.location.href = 'https://project.f.mioffice.cn/iretail/setting/workObjectSetting';
        await new Promise(r => setTimeout(r, 3000));
    }

    // 质量指标字段配置
    const fields = [
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

    // 自动创建字段
    for (let field of fields) {
        console.log(`创建字段: ${field.name}`);

        // 查找并点击添加字段按钮
        const addBtn = document.querySelector('button[class*="add"], button:contains("添加字段"), button:contains("新建字段")') ||
                      Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('添加') || b.textContent.includes('新建'));

        if (addBtn) {
            addBtn.click();
            await new Promise(r => setTimeout(r, 1000));

            // 填写字段名称
            const nameInput = document.querySelector('input[placeholder*="名称"], input[name*="name"]');
            if (nameInput) {
                nameInput.value = field.name;
                nameInput.dispatchEvent(new Event('input', {bubbles: true}));
            }

            // 选择字段类型
            const typeSelect = document.querySelector('select[name*="type"], [data-testid*="type"]');
            if (typeSelect) {
                typeSelect.value = field.type;
                typeSelect.dispatchEvent(new Event('change', {bubbles: true}));
            }

            // 点击保存
            const saveBtn = document.querySelector('button:contains("保存"), button:contains("确定")') ||
                          Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('保存') || b.textContent.includes('确定'));
            if (saveBtn) {
                saveBtn.click();
            }

            await new Promise(r => setTimeout(r, 1500));
        }
    }

    console.log('✅ 配置完成！');
    return true;
})();
"""

# 保存JavaScript代码
with open('/d/code/WSJF/meego-quality-automation/auto_config.js', 'w', encoding='utf-8') as f:
    f.write(js_code)

print("✅ 自动化脚本已生成")

# 尝试通过系统调用打开浏览器
print("\n正在尝试自动打开浏览器...")

try:
    # Windows系统
    import webbrowser
    webbrowser.open('https://project.f.mioffice.cn/iretail/setting/workObjectSetting')
    print("✅ 浏览器已打开")
    print("\n请在浏览器控制台运行 auto_config.js 中的代码")
except:
    print("⚠️ 请手动打开浏览器访问项目设置页面")

print("\n" + "=" * 60)
print("自动配置步骤：")
print("1. 浏览器已自动打开（或手动打开）")
print("2. 登录后按F12打开控制台")
print("3. 粘贴运行 auto_config.js 的代码")
print("4. 等待自动创建14个字段")
print("=" * 60)