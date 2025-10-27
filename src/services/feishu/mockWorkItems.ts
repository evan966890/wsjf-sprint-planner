/**
 * Mock飞书工作项数据 - 用于测试导入流程
 */

export const MOCK_WORK_ITEMS = [
  {
    id: '1',
    name: '用户登录功能优化',
    work_item_type_key: '6337b4e95f9672378dda1432',
    work_item_type_name: 'story',
    status: '进行中',
    priority: 'P0',
    owner: {
      user_key: '7541721806923694188',
      name: 'Evan Tian'
    },
    description: '优化用户登录流程，提升用户体验',
    start_time: Math.floor(Date.now() / 1000) - 86400 * 7,
    finish_time: Math.floor(Date.now() / 1000) + 86400 * 14,
    created_at: Math.floor(Date.now() / 1000) - 86400 * 30,
    updated_at: Math.floor(Date.now() / 1000),
  },
  {
    id: '2',
    name: '数据导出功能开发',
    work_item_type_key: '6337b4e95f9672378dda1432',
    work_item_type_name: 'story',
    status: '待开始',
    priority: 'P1',
    owner: {
      user_key: '7541721806923694188',
      name: 'Evan Tian'
    },
    description: '实现数据导出为Excel/CSV格式',
    start_time: Math.floor(Date.now() / 1000),
    finish_time: Math.floor(Date.now() / 1000) + 86400 * 21,
    created_at: Math.floor(Date.now() / 1000) - 86400 * 15,
    updated_at: Math.floor(Date.now() / 1000),
  },
  {
    id: '3',
    name: '性能优化 - 首页加载速度',
    work_item_type_key: '6337b4e95f9672378dda1432',
    work_item_type_name: 'story',
    status: '已完成',
    priority: 'P0',
    owner: {
      user_key: '7541721806923694188',
      name: 'Evan Tian'
    },
    description: '优化首页加载速度，目标从3秒降到1秒以内',
    start_time: Math.floor(Date.now() / 1000) - 86400 * 30,
    finish_time: Math.floor(Date.now() / 1000) - 86400 * 7,
    created_at: Math.floor(Date.now() / 1000) - 86400 * 45,
    updated_at: Math.floor(Date.now() / 1000) - 86400 * 7,
  },
  {
    id: '4',
    name: '移动端适配',
    work_item_type_key: '6337b4e95f9672378dda1432',
    work_item_type_name: 'story',
    status: '待开始',
    priority: 'P2',
    owner: {
      user_key: '7541721806923694188',
      name: 'Evan Tian'
    },
    description: '适配移动端浏览器，优化触摸交互',
    start_time: Math.floor(Date.now() / 1000) + 86400 * 14,
    finish_time: Math.floor(Date.now() / 1000) + 86400 * 35,
    created_at: Math.floor(Date.now() / 1000) - 86400 * 10,
    updated_at: Math.floor(Date.now() / 1000),
  },
  {
    id: '5',
    name: '多语言支持',
    work_item_type_key: '6337b4e95f9672378dda1432',
    work_item_type_name: 'story',
    status: '待评审',
    priority: 'P3',
    owner: {
      user_key: '7541721806923694188',
      name: 'Evan Tian'
    },
    description: '添加英文、日文等多语言支持',
    start_time: Math.floor(Date.now() / 1000) + 86400 * 30,
    finish_time: Math.floor(Date.now() / 1000) + 86400 * 60,
    created_at: Math.floor(Date.now() / 1000) - 86400 * 5,
    updated_at: Math.floor(Date.now() / 1000),
  },
];

export function getMockWorkItems() {
  return MOCK_WORK_ITEMS;
}
