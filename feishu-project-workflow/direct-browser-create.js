/**
 * 直接在飞书项目页面控制台运行
 * 无需任何配置，自动获取当前会话的凭证
 */

(async function createRemainingFields() {
    console.clear();
    console.log('🚀 自动创建剩余4个质量指标字段\n');
    console.log('✅ 已创建: Lead Time（交付周期）');
    console.log('⏳ 待创建: 4个字段\n');

    // 剩余的4个字段
    const fields = [
        {
            name: '评审一次通过率',
            alias: 'quality_review_pass_rate',
            description: '评审一次通过的比例（%）',
            type: 'number'
        },
        {
            name: '并行事项吞吐量',
            alias: 'quality_throughput',
            description: '团队并行处理的工作项数量',
            type: 'number'
        },
        {
            name: 'PRD返工率',
            alias: 'quality_prd_rework_rate',
            description: '需求文档返工的比例（%）',
            type: 'number'
        },
        {
            name: '试点到GA迭代周期',
            alias: 'quality_pilot_to_ga',
            description: '从试点到全面推广的迭代次数',
            type: 'number'
        }
    ];

    // 从当前URL获取项目key
    const projectKey = window.location.pathname.split('/')[1] || 'iretail';

    // 尝试获取CSRF Token的多种方法
    function getCSRF() {
        // 方法1: 从cookie
        const cookieMatch = document.cookie.match(/csrf_token=([^;]+)/);
        if (cookieMatch) return cookieMatch[1];

        // 方法2: 从页面变量
        if (window.csrfToken) return window.csrfToken;
        if (window._csrfToken) return window._csrfToken;
        if (window.CSRF_TOKEN) return window.CSRF_TOKEN;

        // 方法3: 从localStorage
        for (let key in localStorage) {
            if (key.includes('csrf')) {
                return localStorage[key];
            }
        }

        // 方法4: 从sessionStorage
        for (let key in sessionStorage) {
            if (key.includes('csrf')) {
                return sessionStorage[key];
            }
        }

        return null;
    }

    let csrfToken = getCSRF();

    // 如果没找到，尝试从最近的XHR请求中获取
    if (!csrfToken) {
        console.log('📝 正在从最近的请求中查找CSRF Token...');

        // 拦截下一个XHR请求
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

        XMLHttpRequest.prototype.setRequestHeader = function(header, value) {
            if (header.toLowerCase() === 'x-meego-csrf-token') {
                csrfToken = value;
                console.log('✅ 捕获到CSRF Token:', value.substring(0, 20) + '...');
            }
            return originalSetRequestHeader.apply(this, arguments);
        };

        // 触发一个请求来获取token
        console.log('💡 请点击页面上的任意按钮（如"新建字段"然后"取消"），以便捕获CSRF Token');
        console.log('   完成后，请重新运行此脚本\n');

        // 恢复原始方法
        setTimeout(() => {
            XMLHttpRequest.prototype.open = originalOpen;
            XMLHttpRequest.prototype.setRequestHeader = originalSetRequestHeader;
        }, 30000);

        return;
    }

    console.log('📋 项目:', projectKey);
    console.log('📋 CSRF Token:', csrfToken.substring(0, 20) + '...\n');

    let successCount = 0;

    // 创建字段
    for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        console.log(`[${i+1}/4] 创建: ${field.name}`);

        const payload = {
            sync_uuid: '',
            field: {
                scope: ['story'],
                authorized_roles: ['_anybody'],
                plg_key: '',
                validity: {
                    condition_group: { conjunction: '' },
                    usage_mode: '',
                    value: null
                },
                default_value: {
                    condition_group: { conjunction: '' },
                    usage_mode: '',
                    value: null,
                    bqls: []
                },
                alias: field.alias,
                name: field.name,
                tooltip: field.description,
                type: field.type,
                project: projectKey,
                key: `field_${Math.random().toString(36).substr(2, 8)}`
            }
        };

        try {
            const response = await fetch(`/goapi/v3/settings/${projectKey}/story/field`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-meego-csrf-token': csrfToken,
                    'x-meego-source': 'web/-1.0.0.1490',
                    'x-meego-from': 'web',
                    'x-meego-scope': 'workObjectSettingfieldManagement',
                    'x-lark-gw': '1',
                    'locale': 'zh',
                    'x-content-language': 'zh'
                },
                body: JSON.stringify(payload),
                credentials: 'same-origin'
            });

            const result = await response.json();

            if (result.code === 0 || result.error?.code === 0) {
                console.log(`  ✅ 成功`);
                successCount++;
            } else if (result.msg?.includes('已存在')) {
                console.log(`  ⏭️ 已存在`);
                successCount++;
            } else {
                console.log(`  ❌ 失败:`, result.msg || result.error?.msg);
            }
        } catch (e) {
            console.error(`  ❌ 错误:`, e.message);
        }

        // 延迟1秒
        if (i < fields.length - 1) {
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`📊 完成！${successCount}/4 个字段创建成功`);

    if (successCount === 4) {
        console.log('\n🎉 所有质量指标字段创建完成！');
        console.log('3秒后刷新页面...');
        setTimeout(() => location.reload(), 3000);
    }
})();