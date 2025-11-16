/**
 * 飞书项目质量指标 - 浏览器控制台脚本
 * 使用方法：
 * 1. 登录飞书项目并进入字段管理页面
 * 2. 打开浏览器控制台（F12 -> Console）
 * 3. 复制粘贴此脚本并回车运行
 */

// 质量指标字段配置
const qualityFields = [
  {
    name: 'Lead Time（交付周期）',
    alias: 'quality_lead_time',
    description: '从需求创建到上线的平均时间（天）',
    type: 'number'
  },
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

// 获取CSRF Token
function getCSRFToken() {
  // 尝试从meta标签获取
  const metaToken = document.querySelector('meta[name="csrf-token"]');
  if (metaToken) return metaToken.content;

  // 尝试从cookie获取
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [key, value] = cookie.trim().split('=');
    if (key === 'csrf_token' || key === 'csrfToken') {
      return value;
    }
  }

  // 尝试从window对象获取
  if (window.csrfToken) return window.csrfToken;
  if (window.CSRF_TOKEN) return window.CSRF_TOKEN;

  // 提示用户手动输入
  return prompt('未能自动获取CSRF Token，请手动输入（从Network面板复制）：');
}

// 创建单个字段
async function createField(field, csrfToken) {
  const projectKey = window.location.pathname.split('/')[1] || 'iretail';
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
      console.log(`✅ 成功创建字段: ${field.name}`);
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

// 主函数
async function createAllFields() {
  console.log('🚀 开始创建飞书项目质量指标字段...\n');

  // 检查是否在正确的页面
  if (!window.location.href.includes('project.f.mioffice.cn')) {
    alert('请先登录飞书项目并进入字段管理页面！\n\n访问: https://project.f.mioffice.cn/iretail/setting/workObject/story?menuTab=fieldManagement');
    return;
  }

  // 获取CSRF Token
  const csrfToken = getCSRFToken();
  if (!csrfToken) {
    console.error('❌ 无法获取CSRF Token');
    alert('无法获取CSRF Token。请查看控制台获取手动操作方法。');
    console.log('\n📝 手动获取CSRF Token方法：');
    console.log('1. 在Network标签中创建一个测试字段');
    console.log('2. 找到field请求，查看Headers');
    console.log('3. 复制x-meego-csrf-token的值');
    console.log('4. 重新运行此脚本并粘贴Token');
    return;
  }

  console.log(`📋 CSRF Token: ${csrfToken.substring(0, 20)}...`);
  console.log(`📋 准备创建 ${qualityFields.length} 个字段\n`);

  let successCount = 0;

  for (let i = 0; i < qualityFields.length; i++) {
    const field = qualityFields[i];
    console.log(`[${i + 1}/${qualityFields.length}] 正在创建: ${field.name}`);

    const success = await createField(field, csrfToken);
    if (success) successCount++;

    // 延迟1秒避免请求过快
    if (i < qualityFields.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 完成！成功创建 ${successCount}/${qualityFields.length} 个字段`);

  if (successCount === qualityFields.length) {
    console.log('🎉 所有质量指标字段创建成功！');
    alert('✅ 所有质量指标字段创建成功！\n\n请刷新页面查看新字段。');
    // 自动刷新页面
    setTimeout(() => location.reload(), 2000);
  } else if (successCount > 0) {
    alert(`⚠️ 部分成功：${successCount}/${qualityFields.length} 个字段创建成功\n\n请检查控制台查看失败原因。`);
  } else {
    alert('❌ 创建失败。可能原因：\n1. CSRF Token无效\n2. 没有权限\n3. 字段已存在\n\n请查看控制台了解详情。');
  }
}

// 运行提示
console.clear();
console.log('%c🚀 飞书项目质量指标配置脚本', 'color: #4096ff; font-size: 20px; font-weight: bold;');
console.log('%c准备创建5个质量指标字段', 'color: #52c41a; font-size: 14px;');
console.log('\n如果您已经在字段管理页面，输入以下命令开始：');
console.log('%ccreateAllFields()', 'color: #ff4d4f; font-size: 16px; font-weight: bold;');
console.log('\n或直接点击下面的链接：');

// 创建可点击的开始按钮（在控制台中）
console.log('%c[点击这里开始创建]', 'color: #1890ff; font-size: 14px; text-decoration: underline; cursor: pointer;', 'onclick', createAllFields);

// 自动检测页面
if (window.location.href.includes('fieldManagement')) {
  console.log('\n✅ 检测到您已在字段管理页面');
  console.log('🔄 3秒后自动开始创建...');
  setTimeout(createAllFields, 3000);
} else {
  console.log('\n⚠️ 请先进入字段管理页面：');
  console.log('https://project.f.mioffice.cn/iretail/setting/workObject/story?menuTab=fieldManagement');
}