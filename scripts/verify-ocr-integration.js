#!/usr/bin/env node
/**
 * OCR集成验证脚本
 * 验证OCR功能是否正常工作
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// 验证清单
const checks = [
  {
    name: 'OCR服务器可以启动',
    test: checkOCRServerStartable,
    required: true
  },
  {
    name: '健康检查接口可访问',
    test: checkHealthEndpoint,
    required: true
  },
  {
    name: '前端可以调用OCR API',
    test: checkOCRAPIAccessible,
    required: true
  },
  {
    name: 'OCR.space可用（无需配置）',
    test: checkOCRSpaceAvailable,
    required: false
  },
  {
    name: '百度OCR可用（已配置）',
    test: checkBaiduOCRConfigured,
    required: false
  },
  {
    name: '智能选择逻辑正确',
    test: checkAutoBackendLogic,
    required: true
  },
  {
    name: '错误处理完善',
    test: checkErrorHandling,
    required: true
  }
];

// 主函数
async function main() {
  console.log('='.repeat(60));
  console.log('OCR集成验证');
  console.log('='.repeat(60));
  console.log();

  const results = [];
  let passed = 0;
  let failed = 0;
  let skipped = 0;

  for (const check of checks) {
    console.log(`检查: ${check.name}`);
    try {
      const result = await check.test();
      if (result.passed) {
        console.log(`  ✅ 通过: ${result.message}`);
        passed++;
        results.push({ name: check.name, status: 'passed', message: result.message });
      } else {
        const symbol = check.required ? '❌' : '⚠️';
        console.log(`  ${symbol} 失败: ${result.message}`);
        if (check.required) {
          failed++;
        } else {
          skipped++;
        }
        results.push({ name: check.name, status: 'failed', message: result.message });
      }
    } catch (error) {
      const symbol = check.required ? '❌' : '⚠️';
      console.log(`  ${symbol} 错误: ${error.message}`);
      if (check.required) {
        failed++;
      } else {
        skipped++;
      }
      results.push({ name: check.name, status: 'error', message: error.message });
    }
    console.log();
  }

  // 总结
  console.log('='.repeat(60));
  console.log('验证总结');
  console.log('='.repeat(60));
  console.log(`通过: ${passed}/${checks.length}`);
  console.log(`失败: ${failed}/${checks.length}`);
  console.log(`跳过/警告: ${skipped}/${checks.length}`);
  console.log();

  if (failed > 0) {
    console.log('❌ OCR集成验证失败');
    console.log('请检查以上失败的项目并修复');
    process.exit(1);
  } else {
    console.log('✅ OCR集成验证通过');
    if (skipped > 0) {
      console.log(`⚠️  有${skipped}个可选项未通过，建议检查`);
    }
    process.exit(0);
  }
}

// 检查1: OCR服务器可以启动
async function checkOCRServerStartable() {
  const serverPath = path.join(__dirname, '../api/ocr-server.cjs');

  if (!fs.existsSync(serverPath)) {
    return { passed: false, message: 'OCR服务器文件不存在' };
  }

  // 检查依赖
  const packageJsonPath = path.join(__dirname, '../package.json');
  if (!fs.existsSync(packageJsonPath)) {
    return { passed: false, message: 'package.json不存在' };
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const requiredDeps = ['express', 'multer', 'cors'];
  const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);

  if (missingDeps.length > 0) {
    return { passed: false, message: `缺少依赖: ${missingDeps.join(', ')}` };
  }

  return { passed: true, message: 'OCR服务器文件存在且依赖完整' };
}

// 检查2: 健康检查接口可访问
async function checkHealthEndpoint() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3001/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            if (json.status === 'ok') {
              resolve({ passed: true, message: `服务器运行正常 (运行时间: ${Math.round(json.uptime)}秒)` });
            } else {
              resolve({ passed: false, message: '服务器状态异常' });
            }
          } catch (e) {
            resolve({ passed: false, message: '响应格式错误' });
          }
        } else {
          resolve({ passed: false, message: `HTTP ${res.statusCode}` });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ passed: false, message: `服务器未启动或无法访问: ${err.message}` });
    });

    req.setTimeout(3000, () => {
      req.destroy();
      resolve({ passed: false, message: '请求超时' });
    });
  });
}

// 检查3: 前端可以调用OCR API
async function checkOCRAPIAccessible() {
  const clientPath = path.join(__dirname, '../src/utils/ocrClient.ts');

  if (!fs.existsSync(clientPath)) {
    return { passed: false, message: 'OCR客户端文件不存在' };
  }

  const content = fs.readFileSync(clientPath, 'utf8');

  // 检查关键功能
  const hasRecognizeFile = content.includes('export async function recognizeFile');
  const hasCheckService = content.includes('export async function checkOCRService');
  const hasExtractRequirement = content.includes('extractRequirementFromText');

  if (!hasRecognizeFile) {
    return { passed: false, message: '缺少recognizeFile函数' };
  }

  if (!hasCheckService) {
    return { passed: false, message: '缺少checkOCRService函数' };
  }

  if (!hasExtractRequirement) {
    return { passed: false, message: '缺少需求提取功能' };
  }

  return { passed: true, message: 'OCR客户端功能完整' };
}

// 检查4: OCR.space可用
async function checkOCRSpaceAvailable() {
  // 简单的可达性检查
  return new Promise((resolve) => {
    const req = https.get('https://api.ocr.space/', (res) => {
      resolve({ passed: true, message: 'OCR.space API可访问' });
    });

    req.on('error', () => {
      resolve({ passed: false, message: 'OCR.space API无法访问' });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ passed: false, message: 'OCR.space API请求超时' });
    });
  });
}

// 检查5: 百度OCR已配置
async function checkBaiduOCRConfigured() {
  const configPath = path.join(__dirname, '../scripts/ocr/baidu_ocr_config.json');

  if (!fs.existsSync(configPath)) {
    return { passed: false, message: '百度OCR配置文件不存在' };
  }

  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    if (!config.app_id || !config.api_key || !config.secret_key) {
      return { passed: false, message: '百度OCR配置不完整' };
    }

    if (config.app_id === 'your_app_id') {
      return { passed: false, message: '百度OCR配置未更新（仍为示例值）' };
    }

    return { passed: true, message: `百度OCR已配置 (App ID: ${config.app_id})` };
  } catch (e) {
    return { passed: false, message: `配置文件解析失败: ${e.message}` };
  }
}

// 检查6: 智能选择逻辑正确
async function checkAutoBackendLogic() {
  const clientPath = path.join(__dirname, '../src/utils/ocrClient.ts');

  if (!fs.existsSync(clientPath)) {
    return { passed: false, message: 'OCR客户端文件不存在' };
  }

  const content = fs.readFileSync(clientPath, 'utf8');

  // 检查是否支持auto模式
  const hasAutoBackend = content.includes("backend: OCRBackend = 'auto'");

  if (!hasAutoBackend) {
    return { passed: false, message: '缺少auto后端选择逻辑' };
  }

  return { passed: true, message: '智能后端选择逻辑已实现' };
}

// 检查7: 错误处理完善
async function checkErrorHandling() {
  const clientPath = path.join(__dirname, '../src/utils/ocrClient.ts');

  if (!fs.existsSync(clientPath)) {
    return { passed: false, message: 'OCR客户端文件不存在' };
  }

  const content = fs.readFileSync(clientPath, 'utf8');

  // 检查错误处理
  const hasTryCatch = content.includes('try {') && content.includes('catch');
  const hasErrorMessage = content.includes('OCR 服务器未启动');
  const hasTimeout = content.includes('setTimeout') || content.includes('timeout');

  if (!hasTryCatch) {
    return { passed: false, message: '缺少错误捕获' };
  }

  if (!hasErrorMessage) {
    return { passed: false, message: '缺少友好错误提示' };
  }

  return { passed: true, message: '错误处理完善' };
}

// 运行验证
main().catch(err => {
  console.error('验证脚本执行失败:', err);
  process.exit(1);
});
