export default {
  id: 'ranks',
  title: 'Danh mục cấp đai',
  group: 'THI & THĂNG ĐAI',
  icon: 'Medal',
  permissions: {
    ADMIN: 'VCED',
    MASTER: 'VCE',
    INSTRUCTOR: 'V',
    STUDENT: 'V',
  },
  fields: [
    {
      key: 'name',
      label: 'Tên cấp đai',
      type: 'text',
      required: true,
    },
    {
      key: 'level',
      label: 'Thứ tự',
      type: 'number',
      required: true,
    },
    {
      key: 'color',
      label: 'Màu đại diện',
      type: 'color',
      required: true,
    },
    {
      key: 'description',
      label: 'Yêu cầu',
      type: 'textarea',
      required: false,
    },
  ],
  columns: ['name', 'level', 'color', 'description'],
  description: 'Lộ trình cấp đai của hệ thống Vovinam.',
  endpoint: '/belt-ranks',
  component: 'RanksPage',
};
