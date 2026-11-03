export default {
  id: 'settings',
  title: 'Cài đặt hệ thống',
  group: 'HỆ THỐNG',
  icon: 'Settings2',
  permissions: {
    ADMIN: 'VCED',
    MASTER: '',
    INSTRUCTOR: '',
    STUDENT: '',
  },
  fields: [
    {
      key: 'name',
      label: 'Tên cấu hình',
      type: 'text',
      required: true,
    },
    {
      key: 'value',
      label: 'Giá trị',
      type: 'text',
      required: true,
    },
    {
      key: 'description',
      label: 'Mô tả',
      type: 'textarea',
      required: false,
    },
  ],
  columns: ['name', 'value', 'description'],
  description: 'Cấu hình vận hành và thông tin võ đường.',
  endpoint: '/settings',
  component: 'SettingsPage',
};
