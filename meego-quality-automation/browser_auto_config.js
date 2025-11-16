/**
 * 飞书项目质量指标 - 浏览器自动配置脚本
 * 使用方法：
 * 1. 登录飞书项目，进入 https://project.f.mioffice.cn/iretail/setting/workObjectSetting
 * 2. 打开浏览器开发者工具（F12）
 * 3. 在控制台中粘贴并运行此代码
 */

(async function() {
    console.log('🚀 开始自动配置飞书项目质量指标...');

    // 5个质量指标的字段配置
    const qualityMetrics = {
        "需求Lead Time": [
            { name: "需求创建时间", type: "datetime", key: "req_created_time" },
            { name: "方案完成时间", type: "datetime", key: "solution_done_time" },
            { name: "评审通过时间", type: "datetime", key: "review_pass_time" },
            { name: "上线时间", type: "datetime", key: "deploy_time" },
            { name: "Lead Time(天)", type: "number", key: "lead_time_days" }
        ],
        "评审一次通过率": [
            { name: "评审结果", type: "select", key: "review_result",
              options: ["一次通过", "修改后通过", "多次修改通过", "未通过"] },
            { name: "评审轮次", type: "number", key: "review_attempts" }
        ],
        "并行事项吞吐量": [
            { name: "并行任务数", type: "number", key: "parallel_tasks" },
            { name: "周完成数", type: "number", key: "weekly_completed" }
        ],
        "PRD返工率": [
            { name: "PRD版本", type: "text", key: "prd_version" },
            { name: "PRD返工次数", type: "number", key: "prd_rework_count" }
        ],
        "试点到GA迭代": [
            { name: "试点开始日期", type: "datetime", key: "pilot_start" },
            { name: "GA发布日期", type: "datetime", key: "ga_release" },
            { name: "迭代次数", type: "number", key: "iteration_count" }
        ]
    };

    // 辅助函数：等待元素出现
    function waitForElement(selector, timeout = 5000) {
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                const element = document.querySelector(selector);
                if (element) {
                    clearInterval(interval);
                    resolve(element);
                }
            }, 100);

            setTimeout(() => {
                clearInterval(interval);
                resolve(null);
            }, timeout);
        });
    }

    // 辅助函数：点击元素
    function clickElement(element) {
        if (element) {
            element.click();
            return true;
        }
        return false;
    }

    // 辅助函数：填充输入框
    function fillInput(selector, value) {
        const input = document.querySelector(selector);
        if (input) {
            input.value = value;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
        }
        return false;
    }

    // 创建单个字段
    async function createField(field, metricName) {
        console.log(`  📋 创建字段: ${field.name} (${field.type})`);

        try {
            // 点击"添加字段"按钮
            const addButton = await waitForElement('[data-testid="add-field-button"], button:contains("添加字段"), button:contains("新建字段")');
            if (!clickElement(addButton)) {
                console.warn('    ⚠️ 找不到添加字段按钮');
                return false;
            }

            await new Promise(resolve => setTimeout(resolve, 500));

            // 填写字段名称
            fillInput('input[placeholder*="字段名称"]', field.name);

            // 选择字段类型
            const typeSelector = await waitForElement('select[name="field_type"], [data-testid="field-type-selector"]');
            if (typeSelector) {
                typeSelector.value = field.type;
                typeSelector.dispatchEvent(new Event('change', { bubbles: true }));
            }

            // 如果是选择类型，添加选项
            if (field.type === 'select' && field.options) {
                for (let option of field.options) {
                    const addOptionBtn = await waitForElement('button:contains("添加选项")');
                    if (addOptionBtn) {
                        addOptionBtn.click();
                        await new Promise(resolve => setTimeout(resolve, 200));
                        const optionInput = document.querySelector('input[placeholder*="选项"]');
                        if (optionInput) {
                            optionInput.value = option;
                            optionInput.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                    }
                }
            }

            // 保存字段
            const saveButton = await waitForElement('button:contains("保存"), button:contains("确定")');
            if (clickElement(saveButton)) {
                console.log(`    ✅ ${field.name} 创建成功`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                return true;
            }

        } catch (error) {
            console.error(`    ❌ 创建失败: ${error.message}`);
            return false;
        }
    }

    // 主执行函数
    async function configureMetrics() {
        let totalFields = 0;
        let successFields = 0;

        console.log('\n📊 开始配置5个质量指标...\n');

        for (const [metricName, fields] of Object.entries(qualityMetrics)) {
            console.log(`🎯 配置指标: ${metricName}`);

            for (const field of fields) {
                totalFields++;
                if (await createField(field, metricName)) {
                    successFields++;
                }
            }

            console.log('');
        }

        // 显示结果
        console.log('═'.repeat(50));
        console.log('📈 配置完成统计:');
        console.log(`  总字段数: ${totalFields}`);
        console.log(`  成功创建: ${successFields}`);
        console.log(`  失败数量: ${totalFields - successFields}`);
        console.log('═'.repeat(50));

        if (successFields === totalFields) {
            console.log('\n🎉 恭喜！所有质量指标配置成功！');
        } else if (successFields > 0) {
            console.log(`\n⚠️ 部分字段配置成功 (${successFields}/${totalFields})`);
            console.log('请检查失败的字段，可能需要手动配置');
        } else {
            console.log('\n❌ 配置失败，请尝试手动配置或检查页面结构');
        }
    }

    // 检查当前页面
    const currentUrl = window.location.href;
    if (!currentUrl.includes('project.f.mioffice.cn') && !currentUrl.includes('project.feishu.cn')) {
        console.error('❌ 请先登录飞书项目管理系统');
        console.log('访问: https://project.f.mioffice.cn/iretail/setting/workObjectSetting');
        return;
    }

    // 提示用户
    const userConfirm = confirm('即将自动配置5个质量指标（14个字段），是否继续？');
    if (!userConfirm) {
        console.log('❌ 用户取消操作');
        return;
    }

    // 执行配置
    await configureMetrics();

    console.log('\n✅ 脚本执行完毕！');
    console.log('下一步：');
    console.log('1. 检查字段是否正确创建');
    console.log('2. 配置流程节点：需求→方案→评审→开发→试点→GA上线');
    console.log('3. 设置自动化规则计算指标');

})();