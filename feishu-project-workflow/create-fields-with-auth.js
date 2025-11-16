#!/usr/bin/env node
/**
 * 使用浏览器凭证创建质量指标字段
 * 需要先获取CSRF令牌和Cookie
 */

const axios = require('axios');
const https = require('https');
const fs = require('fs');

// 检查凭证文件
let credentials;
try {
  credentials = JSON.parse(fs.readFileSync('auth-credentials.json', 'utf8'));
} catch (error) {
  console.error('❌ 错误: 找不到 auth-credentials.json 文件');
  console.log('请先按照 GET_CREDENTIALS.md 的步骤获取凭证');
  console.log('然后创建 auth-credentials.json 文件，格式如下：');
  console.log(JSON.stringify({
    csrf_token: "您的CSRF令牌",
    cookie: "您的完整Cookie字符串"
  }, null, 2));
  process.exit(1);
}

const PROJECT_KEY = 'iretail';
const BASE_URL = 'https://project.f.mioffice.cn';

// 质量指标字段定义
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

// 创建axios实例
const client = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Cookie': credentials.cookie,
    'Accept': 'application/json, text/plain, */*',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  },
  // 处理代理
  proxy: false,
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
});

// 生成字段key
function generateFieldKey() {
  return Math.random().toString(36).substring(2, 8);
}

// 创建单个字段
async function createField(field) {
  console.log(`\n📝 创建字段: ${field.name}`);

  // 获取正确的project_key（可能是ID而非域名）
  // 实际项目的key可能是类似 "6917068acb0eb4333d5d6b1e" 这样的ID
  const endpoint = `/goapi/v3/settings/${PROJECT_KEY}/story/field`;

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
      project: PROJECT_KEY,
      key: `field_${generateFieldKey()}`
    }
  };

  try {
    const response = await client.post(endpoint, payload, {
      headers: {
        'x-meego-csrf-token': credentials.csrf_token,
        'x-meego-source': 'web/-1.0.0.1490',
        'x-meego-from': 'web',
        'x-meego-scope': 'workObjectSettingfieldManagement',
        'x-lark-gw': '1',
        'locale': 'zh',
        'x-content-language': 'zh',
        'Referer': `${BASE_URL}/${PROJECT_KEY}/setting/workObject/story?menuTab=fieldManagement`
      }
    });

    if (response.data) {
      if (response.data.code === 0 || response.data.error?.code === 0) {
        console.log(`  ✅ 字段 "${field.name}" 创建成功!`);
        return true;
      } else {
        const msg = response.data.msg || response.data.error?.msg || '未知错误';
        console.error(`  ❌ 创建失败: ${msg}`);
        if (msg.includes('已存在') || msg.includes('exist')) {
          console.log(`  ⚠️ 字段可能已存在，跳过...`);
          return true;
        }
      }
    }
  } catch (error) {
    if (error.response) {
      console.error(`  ❌ 服务器错误:`, error.response.status, error.response.data);
      const errorMsg = error.response.data?.error?.msg || error.response.data?.msg || '';
      if (errorMsg.includes('已存在') || errorMsg.includes('exist')) {
        console.log(`  ⚠️ 字段可能已存在，跳过...`);
        return true;
      }
    } else {
      console.error(`  ❌ 请求失败:`, error.message);
    }
  }
  return false;
}

// 主函数
async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║     🚀 飞书项目质量指标配置工具 (浏览器凭证版)             ║
║                                                              ║
║     使用浏览器凭证创建质量字段                              ║
╚══════════════════════════════════════════════════════════════╝
  `);

  console.log('📋 配置信息:');
  console.log('- 项目:', PROJECT_KEY);
  console.log('- CSRF Token:', credentials.csrf_token.substring(0, 20) + '...');
  console.log('- Cookie:', credentials.cookie ? '已配置' : '未配置');
  console.log('- 字段数量:', qualityFields.length);
  console.log('\n' + '='.repeat(60));

  // 验证凭证
  if (!credentials.csrf_token || !credentials.cookie) {
    console.error('\n❌ 错误: 凭证不完整');
    console.log('请确保 auth-credentials.json 包含 csrf_token 和 cookie');
    return;
  }

  let successCount = 0;

  for (let i = 0; i < qualityFields.length; i++) {
    const field = qualityFields[i];
    console.log(`\n[${i + 1}/${qualityFields.length}] 处理字段...`);

    const success = await createField(field);
    if (success) {
      successCount++;
    }

    // 避免请求过快
    if (i < qualityFields.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 结果: ${successCount}/${qualityFields.length} 个字段创建成功`);

  if (successCount === qualityFields.length) {
    console.log('\n🎉 所有质量指标字段创建成功!');
    console.log('\n请访问以下地址验证:');
    console.log(`${BASE_URL}/${PROJECT_KEY}/setting/workObject/story?menuTab=fieldManagement`);
  } else if (successCount > 0) {
    console.log('\n⚠️ 部分字段创建成功');
    console.log('如果某些字段失败，可能是因为：');
    console.log('1. 字段已经存在');
    console.log('2. 凭证已过期（请重新获取）');
    console.log('3. 权限不足');
  } else {
    console.log('\n❌ 所有字段创建失败');
    console.log('\n可能的原因：');
    console.log('1. CSRF令牌或Cookie已过期 - 请重新获取');
    console.log('2. 没有字段管理权限');
    console.log('3. 项目key不正确');
    console.log('\n请按照 GET_CREDENTIALS.md 重新获取凭证');
  }
}

// 运行主程序
main().catch(error => {
  console.error('\n❌ 程序异常:', error.message);
  process.exit(1);
});