#!/usr/bin/env node
/**
 * 飞书API代理服务器
 * 解决浏览器CORS跨域问题
 * 转发请求到飞书项目管理平台
 */

const express = require('express');
const cors = require('cors');

// Node.js 18+ 内置 fetch，否则使用 node-fetch
const fetch = globalThis.fetch || require('node-fetch');

const app = express();
const PORT = process.env.FEISHU_PROXY_PORT || 3002;
const FEISHU_BASE_URL = 'https://project.f.mioffice.cn';

// 配置 CORS
app.use(cors({
  origin: '*', // 生产环境应限制为具体域名
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Key', 'X-Plugin-Token']
}));

app.use(express.json());

/**
 * 获取 Plugin Token
 * POST /api/feishu/plugin-token
 */
app.post('/api/feishu/plugin-token', async (req, res) => {
  try {
    const { plugin_id, plugin_secret, type = 0 } = req.body;

    if (!plugin_id || !plugin_secret) {
      return res.status(400).json({
        code: -1,
        msg: '缺少 plugin_id 或 plugin_secret'
      });
    }

    console.log('[Feishu Proxy] Getting plugin token...');

    const response = await fetch(`${FEISHU_BASE_URL}/open_api/authen/plugin_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ plugin_id, plugin_secret, type }),
    });

    const data = await response.json();

    console.log('[Feishu Proxy] Token response:', {
      code: data.code,
      hasData: !!data.data
    });

    res.json(data);
  } catch (error) {
    console.error('[Feishu Proxy] Error getting token:', error);
    res.status(500).json({
      code: -1,
      msg: `获取token失败: ${error.message}`
    });
  }
});

/**
 * 代理所有飞书API请求
 * ALL /api/feishu/proxy/*
 */
app.all('/api/feishu/proxy/*', async (req, res) => {
  try {
    const path = req.params[0] || '';
    const url = `${FEISHU_BASE_URL}/${path}`;

    console.log('[Feishu Proxy] Proxying request:', {
      method: req.method,
      path,
      hasAuth: !!req.headers.authorization,
      hasUserKey: !!req.headers['x-user-key']
    });

    // 准备请求头
    const headers = {
      'Content-Type': 'application/json',
    };

    // 转发认证相关的header
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }
    if (req.headers['x-plugin-token']) {
      headers['X-Plugin-Token'] = req.headers['x-plugin-token'];
    }
    if (req.headers['x-user-key']) {
      headers['X-User-Key'] = req.headers['x-user-key'];
    }

    const options = {
      method: req.method,
      headers,
    };

    // 添加请求体（POST/PUT）
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      options.body = JSON.stringify(req.body);
    }

    const response = await fetch(url, options);
    const data = await response.json();

    console.log('[Feishu Proxy] Response:', {
      status: response.status,
      code: data.code
    });

    res.status(response.status).json(data);
  } catch (error) {
    console.error('[Feishu Proxy] Proxy error:', error);
    res.status(500).json({
      code: -1,
      msg: `代理请求失败: ${error.message}`
    });
  }
});

/**
 * 健康检查
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'feishu-proxy' });
});

app.listen(PORT, () => {
  console.log(`✅ 飞书代理服务器已启动: http://localhost:${PORT}`);
  console.log(`📋 API端点:`);
  console.log(`   - POST /api/feishu/plugin-token - 获取Plugin Token`);
  console.log(`   - ALL  /api/feishu/proxy/*       - 代理飞书API请求`);
  console.log(`   - GET  /health                   - 健康检查`);
});

module.exports = app;
