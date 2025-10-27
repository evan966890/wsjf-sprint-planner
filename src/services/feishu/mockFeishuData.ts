/**
 * Mock飞书项目数据 - 临时用于测试
 *
 * 这是基于真实API Response创建的Mock数据
 * 找到真实API端点后可以删除此文件
 */

export const MOCK_PROJECTS_RESPONSE = {
  "statusCode": 0,
  "message": "success",
  "data": {
    "value": [
      {
        "_id": "632d4f29aa4481312c2ab170",
        "simple_name": "mit",
        "name": "MIT",
        "masters": [
          {
            "username": "7343165736166097004",
            "email": "jiaxinyu@xiaomi.com",
            "nickname": "贾欣宇",
            "name_en": "Xinyu Jia",
            "employeeId": "",
            "avatar": "",
            "larkOpenId": ""
          }
        ],
        "iconUrl": "https://project.f.mioffice.cn/goapi/v1/tos/file/meego-business/checklist/423cba57-c1c0-49c2-a1f4-12ec4d724b98.svg?isSaas=1",
        "master_count": 0,
        "project_status": "active"
      },
      {
        "_id": "673ef2ac6e16b8e58f715447",
        "simple_name": "minrd",
        "name": "小米国际渠道零售信息化项目",
        "masters": [
          {
            "username": "7173591054267007085",
            "email": "zhanghong11@xiaomi.com",
            "nickname": "张弘",
            "name_en": "Hong Zhang",
            "employeeId": "",
            "avatar": "",
            "larkOpenId": ""
          }
        ],
        "iconUrl": "https://project.f.mioffice.cn/goapi/v1/tos/file/meego-business/checklist/1614927288650_Lark20210305-145413.png?isSaas=1",
        "master_count": 0,
        "project_status": "active"
      }
    ]
  },
  "interceptMsg": ""
};

/**
 * 是否启用Mock模式
 */
export const ENABLE_MOCK = false; // 禁用Mock，使用真实API

/**
 * 从Response中提取项目列表
 */
export function getProjectsFromMockData() {
  return MOCK_PROJECTS_RESPONSE.data.value.map((p: any) => ({
    id: p._id,
    name: p.name,
    simple_name: p.simple_name,
    description: p.description || '',
    status: 'active' as const,
    space_id: '',
    created_at: Date.now() / 1000,
    updated_at: Date.now() / 1000,
  }));
}
