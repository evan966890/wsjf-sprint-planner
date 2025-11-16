/**
 * 飞书 MCP 代理服务器
 *
 * 功能：为浏览器应用提供 MCP 访问能力
 * 端口：3001
 */

const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 9999;  // 使用 9999 端口，并支持环境变量

// 中间件
app.use(cors());
app.use(express.json());

// MCP 配置（从你的配置文件读取）
const MCP_CONFIG = {
  command: 'C:\\Users\\Evan Tian\\AppData\\Roaming\\Python\\Python312\\Scripts\\mcp-feishu-proj.exe',
  args: ['--transport', 'stdio'],
  env: {
    FS_PROJ_BASE_URL: 'https://project.f.mioffice.cn/',
    FS_PROJ_PROJECT_KEY: '632d4f29aa4481312c2ab170',
    FS_PROJ_USER_KEY: '7541721806923694188',
    FS_PROJ_PLUGIN_ID: 'MII_68F1064FA240006C',
    FS_PROJ_PLUGIN_SECRET: '050E0E049ACB87339CB9D11E5641564F',
  }
};

/**
 * 调用 MCP 工具
 */
async function callMCPTool(toolName, args = {}) {
  return new Promise((resolve, reject) => {
    const mcpProcess = spawn(MCP_CONFIG.command, MCP_CONFIG.args, {
      env: { ...process.env, ...MCP_CONFIG.env }
    });

    let stdout = '';
    let stderr = '';

    // MCP 协议：先发送初始化请求
    const initRequest = {
      jsonrpc: '2.0',
      id: 0,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'wsjf-feishu-proxy',
          version: '1.0.0'
        }
      }
    };

    // MCP 协议：发送工具调用请求
    const toolRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      }
    };

    // 发送两个请求（初始化 + 工具调用）
    mcpProcess.stdin.write(JSON.stringify(initRequest) + '\n');
    mcpProcess.stdin.write(JSON.stringify(toolRequest) + '\n');
    mcpProcess.stdin.end();

    // 收集输出
    mcpProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    mcpProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // 处理完成
    mcpProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`MCP process exited with code ${code}: ${stderr}`));
        return;
      }

      try {
        // 解析 MCP 响应
        const lines = stdout.split('\n').filter(line => line.trim());
        const response = JSON.parse(lines[lines.length - 1]);

        if (response.error) {
          reject(new Error(response.error.message));
        } else {
          resolve(response.result);
        }
      } catch (error) {
        reject(new Error(`Failed to parse MCP response: ${error.message}`));
      }
    });
  });
}

/**
 * API: 查询飞书工作项
 * 使用 get_view_detail_by_name 工具从指定视图获取工作项
 */
app.post('/api/feishu/query-stories', async (req, res) => {
  try {
    const { viewName, status, priority, limit = 50, offset = 0 } = req.body;

    console.log('[MCP Proxy] 查询飞书工作项:', req.body);

    // 计算分页参数
    const pageNum = Math.floor(offset / limit) + 1;
    const pageSize = limit;

    // 使用正确的 MCP 工具：get_view_detail_by_name
    const result = await callMCPTool('get_view_detail_by_name', {
      view_name: viewName || '国际销服数字化全集',  // 使用用户选择的视图，默认为你的视图
      work_item_type_key: 'story',
      page_num: pageNum,
      page_size: pageSize,
    });

    console.log('[MCP Proxy] MCP 原始返回:', JSON.stringify(result).substring(0, 500));

    // MCP 返回格式：content[0].text 包含 JSON 字符串
    let viewData = result;
    if (result.content && Array.isArray(result.content) && result.content[0]?.text) {
      // 解析 content[0].text 中的 JSON
      const textContent = result.content[0].text;
      viewData = JSON.parse(textContent);
      console.log('[MCP Proxy] 解析后的视图数据:', JSON.stringify(viewData).substring(0, 500));
    }

    // 提取工作项 ID 列表
    const workItemIds = viewData.work_item_id_list || [];
    console.log('[MCP Proxy] 获取到', workItemIds.length, '个工作项 ID');

    // 如果没有工作项 ID，直接返回空数据
    if (workItemIds.length === 0) {
      return res.json({
        success: true,
        data: [],
        total: 0,
      });
    }

    // 调用 get_work_item_detail 获取完整的工作项信息
    const detailResult = await callMCPTool('get_work_item_detail', {
      work_item_type_key: 'story',
      work_item_ids: workItemIds.join(','),  // ID 用逗号分隔
    });

    console.log('[MCP Proxy] 工作项详情原始返回:', JSON.stringify(detailResult).substring(0, 500));

    // 解析工作项详情
    let items = [];
    if (detailResult.content && Array.isArray(detailResult.content) && detailResult.content[0]?.text) {
      const detailText = detailResult.content[0].text;
      const detailData = JSON.parse(detailText);
      items = detailData.work_items || detailData.items || [];
      console.log('[MCP Proxy] 解析后的工作项数据:', items.length, '条');
    }

    res.json({
      success: true,
      data: items,
      total: workItemIds.length,
    });
  } catch (error) {
    console.error('[MCP Proxy] 查询失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * API: 获取视图列表
 */
app.get('/api/feishu/views', async (req, res) => {
  try {
    console.log('[MCP Proxy] 获取视图列表...');

    const result = await callMCPTool('get_view_list', {
      work_item_type_key: 'story',
    });

    console.log('[MCP Proxy] MCP 原始返回:', JSON.stringify(result).substring(0, 500));

    // MCP 返回格式：content[0].text 包含 JSON 字符串
    let viewList = [];
    if (result.content && Array.isArray(result.content) && result.content[0]?.text) {
      const textContent = result.content[0].text;
      const parsed = JSON.parse(textContent);
      viewList = parsed.views || parsed.view_list || [];
      console.log('[MCP Proxy] 解析后的视图列表:', viewList.length, '个视图');
    }

    res.json({
      success: true,
      views: viewList,
    });
  } catch (error) {
    console.error('[MCP Proxy] 获取视图列表失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * API: 增量同步（获取更新的工作项）
 */
app.post('/api/feishu/sync-updates', async (req, res) => {
  try {
    const { lastSyncTime } = req.body;

    console.log('[MCP Proxy] 增量同步，最后同步时间:', lastSyncTime);

    const result = await callMCPTool('feishu_proj_query_work_items', {
      project_key: MCP_CONFIG.env.FS_PROJ_PROJECT_KEY,
      work_item_type: 'story',
      updated_after: lastSyncTime,
    });

    console.log('[MCP Proxy] 同步成功，返回', result.items?.length || 0, '条更新');

    res.json({
      success: true,
      data: result.items || [],
    });
  } catch (error) {
    console.error('[MCP Proxy] 同步失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * 健康检查
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mcp_configured: true,
    timestamp: new Date().toISOString(),
  });
});

/**
 * API: 列出可用的 MCP 工具
 */
app.get('/api/feishu/list-tools', async (req, res) => {
  try {
    console.log('[MCP Proxy] 列出可用的 MCP 工具...');

    const mcpProcess = spawn(MCP_CONFIG.command, MCP_CONFIG.args, {
      env: { ...process.env, ...MCP_CONFIG.env }
    });

    let stdout = '';
    let stderr = '';

    // 发送初始化请求
    const initRequest = {
      jsonrpc: '2.0',
      id: 0,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'wsjf-feishu-proxy', version: '1.0.0' }
      }
    };

    // 发送列出工具请求
    const listRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {}
    };

    mcpProcess.stdin.write(JSON.stringify(initRequest) + '\n');
    mcpProcess.stdin.write(JSON.stringify(listRequest) + '\n');
    mcpProcess.stdin.end();

    mcpProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    mcpProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    mcpProcess.on('close', (code) => {
      console.log('[MCP Proxy] MCP 输出:', stdout);
      console.log('[MCP Proxy] MCP 错误:', stderr);

      res.json({
        success: true,
        stdout,
        stderr,
        exitCode: code,
      });
    });
  } catch (error) {
    console.error('[MCP Proxy] 列出工具失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log('🚀 飞书 MCP 代理服务器已启动');
  console.log(`📡 监听端口: ${PORT}`);
  console.log(`🔗 健康检查: http://localhost:${PORT}/api/health`);
  console.log(`📋 项目: ${MCP_CONFIG.env.FS_PROJ_PROJECT_KEY}`);
  console.log('');
  console.log('API 端点:');
  console.log('  POST /api/feishu/query-stories   - 查询工作项');
  console.log('  POST /api/feishu/sync-updates    - 增量同步');
  console.log('');
});
