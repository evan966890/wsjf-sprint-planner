/**
 * CloudBase 云函数 - 飞书API代理
 * 解决浏览器CORS跨域问题
 */

const FEISHU_BASE_URL = 'https://project.f.mioffice.cn';

exports.main = async (event, context) => {
  const { httpMethod, path, headers, body, queryStringParameters } = event;

  console.log('[Feishu Proxy Cloud Function] Request:', {
    method: httpMethod,
    path,
    query: queryStringParameters
  });

  // 处理 OPTIONS 预检请求
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-User-Key,X-Plugin-Token'
      },
      body: ''
    };
  }

  try {
    // 解析请求体
    const requestBody = body ? (typeof body === 'string' ? JSON.parse(body) : body) : null;

    // 判断是获取token还是代理API请求
    let url, fetchOptions;

    if (path.includes('/plugin-token')) {
      // 获取 Plugin Token
      if (!requestBody || !requestBody.plugin_id || !requestBody.plugin_secret) {
        throw new Error('缺少 plugin_id 或 plugin_secret');
      }

      url = `${FEISHU_BASE_URL}/open_api/authen/plugin_token`;
      fetchOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plugin_id: requestBody.plugin_id,
          plugin_secret: requestBody.plugin_secret,
          type: requestBody.type || 0
        })
      };

    } else {
      // 代理其他飞书API请求
      const targetPath = path.replace(/^\/feishu-api\/?/, '');
      url = `${FEISHU_BASE_URL}/${targetPath}`;

      const fetchHeaders = {
        'Content-Type': 'application/json',
      };

      // 转发认证头
      if (headers.authorization) {
        fetchHeaders['Authorization'] = headers.authorization;
      }
      if (headers['x-plugin-token']) {
        fetchHeaders['X-Plugin-Token'] = headers['x-plugin-token'];
      }
      if (headers['x-user-key']) {
        fetchHeaders['X-User-Key'] = headers['x-user-key'];
      }

      fetchOptions = {
        method: httpMethod,
        headers: fetchHeaders,
      };

      if (requestBody && httpMethod !== 'GET') {
        fetchOptions.body = JSON.stringify(requestBody);
      }
    }

    console.log('[Feishu Proxy] Fetching:', url);

    const response = await fetch(url, fetchOptions);
    const data = await response.json();

    console.log('[Feishu Proxy] Response:', {
      status: response.status,
      code: data.code
    });

    return {
      statusCode: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-User-Key,X-Plugin-Token'
      },
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('[Feishu Proxy] Error:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        code: -1,
        msg: `代理请求失败: ${error.message}`
      })
    };
  }
};
