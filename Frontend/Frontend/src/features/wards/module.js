export default {
  "id": "wards",
  "title": "Quản lý phường",
  "group": "TỔ CHỨC",
  "icon": "Building2",
  "permissions": {
    "ADMIN": "VCED",
    "MASTER": "VCED",
    "INSTRUCTOR": "",
    "STUDENT": ""
  },
  "fields": [
    {
      "key": "name",
      "label": "Tên phường",
      "type": "text",
      "required": true
    },
    {
      "key": "provinceId",
      "label": "Tỉnh",
      "type": "province",
      "required": true
    },
    {
      "key": "status",
      "label": "Trạng thái",
      "type": "select",
      "required": true,
      "options": [
        [
          "ACTIVE",
          "Đang hoạt động"
        ],
        [
          "PAUSED",
          "Tạm dừng"
        ]
      ]
    }
  ],
  "columns": [
    "name",
    "provinceId",
    "status"
  ],
  "description": "Tỉnh → Phường → Câu lạc bộ → Lớp học.",
  "endpoint": "/wards"
};
