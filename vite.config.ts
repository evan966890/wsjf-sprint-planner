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
        // 关键：转发Cookie和credentials
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // 转发所有Cookie
            if (req.headers.cookie) {
              proxyReq.setHeader('cookie', req.headers.cookie);
            }
          });
        },
      }
    }
  }
})
