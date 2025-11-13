import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      // 代理飞书项目API请求，避免CORS问题
      '/feishu-proxy': {
        target: 'https://project.f.mioffice.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/feishu-proxy/, ''),
        secure: false,
        // 关键：确保Content-Type和Body正确转发
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // 转发所有Cookie
            if (req.headers.cookie) {
              proxyReq.setHeader('cookie', req.headers.cookie);
            }

            // 确保Content-Type正确
            if (!proxyReq.getHeader('Content-Type') && req.headers['content-type']) {
              proxyReq.setHeader('Content-Type', req.headers['content-type']);
            }

            console.log('[Vite Proxy] Request:', {
              url: proxyReq.path,
              method: proxyReq.method,
              headers: proxyReq.getHeaders(),
            });
          });

          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('[Vite Proxy] Response:', {
              status: proxyRes.statusCode,
              statusMessage: proxyRes.statusMessage,
            });
          });
        },
      },
      // 开发环境：代理到本地飞书代理服务器
      '/api/feishu': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      }
    }
  }
})
