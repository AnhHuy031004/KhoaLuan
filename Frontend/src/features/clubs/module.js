export default {
  "id": "clubs",
  "title": "Quản lý câu lạc bộ",
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
      "label": "Tên câu lạc bộ",
      "type": "text",
      "required": true
    },
    {
      "key": "wardId",
      "label": "Phường",
      "type": "ward",
      "required": true
    },
    {
      "key": "address",
      "label": "Địa chỉ",
      "type": "text",
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
    "wardId",
    "address",
    "status"
  ],
  "description": "Tỉnh → Phường → Câu lạc bộ → Lớp học.",
  "endpoint": "/clubs"
};
