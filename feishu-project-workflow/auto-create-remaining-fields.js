/**
 * 自动创建剩余的4个质量指标字段
 * 直接在浏览器控制台运行
 */

(async function() {
    console.clear();
    console.log('🚀 开始自动创建剩余的4个质量指标字段...\n');

    // 剩余需要创建的字段（跳过已创建的Lead Time）
    const remainingFields = [
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

    // 从页面获取CSRF Token
    function getCSRFToken() {
        // 方法1：从cookie获取
        const match = document.cookie.match(/csrf_token=([^;]+)/);
        if (match) return match[1];

        // 方法2：从meta标签获取
        const meta = document.querySelector('meta[name="csrf-token"]');
        if (meta) return meta.content;

        // 方法3：从window对象获取
        if (window.csrfToken) return window.csrfToken;
        if (window.CSRF_TOKEN) return window.CSRF_TOKEN;
        if (window._csrfToken) return window._csrfToken;

        // 方法4：从localStorage获取
        const stored = localStorage.getItem('csrf_token');
        if (stored) return stored;

        // 方法5：尝试从页面上的表单获取
        const csrfInput = document.querySelector('input[name="csrf_token"]');
        if (csrfInput) return csrfInput.value;

        return null;
    }

    // 获取项目key
    const projectKey = window.location.pathname.split('/')[1] || 'iretail';

    // 获取CSRF Token
    let csrfToken = getCSRFToken();

    // 如果自动获取失败，从最近的请求中获取
    if (!csrfToken) {
        console.log('⏳ 正在尝试从最近的请求中获取CSRF Token...');

        // 创建一个临时的字段来捕获CSRF Token
        const tempButton = document.querySelector('button[class*="create"], button[class*="新建"], button:contains("新建字段")');
        if (tempButton) {
            console.log('💡 提示：请点击"新建字段"按钮，然后点击"取消"');
            alert('请点击"新建字段"按钮，然后点击"取消"。\n这样我们可以捕获CSRF Token。\n\n完成后，请重新运行脚本。');
            return;
        }
    }

    // 创建字段的函数
    async function createField(field) {
        const url = `/goapi/v3/settings/${projectKey}/story/field`;

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
                key: `field_${Math.random().toString(36).substring(2, 8)}`
            }
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-meego-csrf-token': csrfToken || 'not-found',
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
                console.log(`✅ 成功创建: ${field.name}`);
                return true;
            } else if (result.msg?.includes('已存在') || result.error?.msg?.includes('已存在')) {
                console.log(`⏭️ 跳过（已存在）: ${field.name}`);
                return true;
            } else {
                console.error(`❌ 创建失败 ${field.name}:`, result.msg || result.error?.msg);
                return false;
            }
        } catch (error) {
            console.error(`❌ 请求失败 ${field.name}:`, error);
            return false;
        }
    }

    // 如果没有CSRF Token，尝试使用另一种方法
    if (!csrfToken) {
        console.log('⚠️ 无法自动获取CSRF Token');
        console.log('📝 正在使用替代方法...\n');

        // 尝试通过模拟点击来创建字段
        console.log('请按以下步骤操作：');
        console.log('1. 点击"新建字段"按钮');
        console.log('2. 在弹出的对话框中填写以下信息：');
        console.log('');

        remainingFields.forEach((field, index) => {
            console.log(`字段 ${index + 1}:`);
            console.log(`  名称: ${field.name}`);
            console.log(`  标识: ${field.alias}`);
            console.log(`  类型: 数字`);
            console.log(`  描述: ${field.description}`);
            console.log('---');
        });

        return;
    }

    // 开始创建字段
    console.log(`📋 CSRF Token: ${csrfToken ? csrfToken.substring(0, 20) + '...' : '未找到'}`);
    console.log(`📋 项目: ${projectKey}`);
    console.log(`📋 准备创建 ${remainingFields.length} 个字段\n`);

    let successCount = 0;

    for (let i = 0; i < remainingFields.length; i++) {
        const field = remainingFields[i];
        console.log(`[${i + 1}/${remainingFields.length}] 正在创建: ${field.name}`);

        const success = await createField(field);
        if (success) successCount++;

        // 延迟1秒
        if (i < remainingFields.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`📊 完成！成功创建 ${successCount}/${remainingFields.length} 个字段`);

    if (successCount === remainingFields.length) {
        console.log('🎉 所有质量指标字段创建成功！');

        // 3秒后刷新页面
        console.log('⏳ 3秒后自动刷新页面...');
        setTimeout(() => {
            location.reload();
        }, 3000);
    } else {
        console.log('⚠️ 部分字段创建失败，可能需要手动创建');
    }
})();