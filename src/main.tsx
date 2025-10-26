import React from 'react'
import ReactDOM from 'react-dom/client'
import WSJFPlanner from './wsjf-sprint-planner.tsx'
import { FeishuCallback } from './components/FeishuCallback.tsx'
import './index.css'

// 简单的路由处理
const App = () => {
  const path = window.location.pathname;

  // 飞书OAuth回调页面
  if (path === '/feishu-callback') {
    return <FeishuCallback />;
  }

  // 主应用
  return <WSJFPlanner />;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
