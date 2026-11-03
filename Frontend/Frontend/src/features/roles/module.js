export default {
  id: 'roles',
  title: 'Vai trò & phân quyền',
  group: 'HỆ THỐNG',
  icon: 'KeyRound',
  permissions: {
    ADMIN: 'VCED',
    MASTER: '',
    INSTRUCTOR: '',
    STUDENT: '',
  },
  fields: [
    {
      key: 'name',
      label: 'Tên vai trò',
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
  columns: ['name', 'description'],
  description:
    'Ma trận quyền theo từng chức năng. Các vai trò nền được bảo vệ.',
  endpoint: '/roles',
  custom: 'roles',
  component: 'RolesPage',
};
