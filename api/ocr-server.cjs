#!/usr/bin/env node
/**
 * OCR API 服务器
 * 为 WSJF 应用提供 OCR 识别能力
 * 支持 OCR.space 和百度 OCR 双后端
 */

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.OCR_PORT || 3001;

// 配置 CORS
app.use(cors());
app.use(express.json());

// 配置文件上传
const upload = multer({
  dest: 'temp_uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024 // 50 MB
  }
});

// 确保临时目录存在
if (!fs.existsSync('temp_uploads')) {
  fs.mkdirSync('temp_uploads');
}

/**
 * OCR 识别接口
 * POST /api/ocr
 */
app.post('/api/ocr', upload.single('file'), async (req, res) => {
  const startTime = Date.now();

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '未上传文件'
      });
    }

    const { backend = 'auto' } = req.body;
    const filePath = req.file.path;

    console.log(`[OCR] 收到文件: ${req.file.originalname}, 后端: ${backend}`);

    // 调用 Python OCR 脚本
    const text = await callPythonOCR(filePath, backend);

    // 清理临时文件
    fs.unlinkSync(filePath);

    const elapsed = Date.now() - startTime;

    console.log(`[OCR] 完成: ${text.length} 字符, 耗时: ${elapsed}ms`);

    res.json({
      success: true,
      text: text,
      backend_used: backend,
      filename: req.file.originalname,
      elapsed: elapsed
    });

  } catch (error) {
    console.error('[OCR] 错误:', error);

    // 清理临时文件
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      error: error.message || '���CR 识别失败'
    });
  }
});

/**
 * 健康检查接口
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});

/**
 * 检查 OCR 后端可用性
 */
app.get('/api/ocr/backends', (req, res) => {
  res.json({
    backends: [
      {
        name: 'ocrspace',
        available: true,
        quota: '25,000次/月',
        description: 'OCR.space - 免费额度大'
      },
      {
        name: 'baidu',
        available: checkBaiduConfig(),
        quota: '1,000-2,000次/月',
        description: '百度 OCR - 中文准确率高'
      },
      {
        name: 'auto',
        available: true,
        quota: '总计 27,000次/月',
        description: '智能选择 - 自动选择最佳后端'
      }
    ],
    default: 'auto'
  });
});

/**
 * 调用 Python OCR 脚本
 */
function callPythonOCR(filePath, backend) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '..', 'scripts', 'ocr', 'smart_ocr.py');

    const python = spawn('python', [
      scriptPath,
      filePath,
      '--backend', backend
    ]);

    let stdout = '';
    let stderr = '';

    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    python.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `OCR 失败，退出码: ${code}`));
      } else {
        // 从输出中提取识别结果
        const lines = stdout.split('\n');
        const resultStartIndex = lines.findIndex(line => line.includes('识别结果:'));

        if (resultStartIndex >= 0) {
          // 提取识别结果部分
          const resultLines = lines.slice(resultStartIndex + 2);
          const endIndex = resultLines.findIndex(line => line.includes('==='));
          const text = endIndex >= 0
            ? resultLines.slice(0, endIndex).join('\n')
            : resultLines.join('\n');

          resolve(text.trim());
        } else {
          // 如果没有找到标记，返回全部输出
          resolve(stdout.trim());
        }
      }
    });

    python.on('error', (error) => {
      reject(new Error(`无法启动 Python: ${error.message}`));
    });
  });
}

/**
 * 检查百度 OCR 配置是否可用
 */
function checkBaiduConfig() {
  const configPath = path.join(__dirname, '..', 'scripts', 'ocr', 'baidu_ocr_config.json');
  return fs.existsSync(configPath);
}

// 启动服务器
app.listen(PORT, () => {
  console.log('=' * 60);
  console.log(`🚀 OCR API 服务器已启动`);
  console.log('=' * 60);
  console.log(`端口: ${PORT}`);
  console.log(`健康检查: http://localhost:${PORT}/health`);
  console.log(`OCR接口: http://localhost:${PORT}/api/ocr`);
  console.log('=' * 60);
  console.log(`\n可用的 OCR 后端:`);
  console.log(`  - OCR.space: 25,000次/月`);
  console.log(`  - 百度 OCR: ${checkBaiduConfig() ? '已配置 ✓' : '未配置 ✗'}`);
  console.log(`  - Auto: 智能选择\n`);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n正在关闭服务器...');
  process.exit(0);
});
