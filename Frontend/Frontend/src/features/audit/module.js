export default {
  id: 'audit',
  title: 'Nhật ký hệ thống',
  group: 'HỆ THỐNG',
  icon: 'ScrollText',
  permissions: {
    ADMIN: 'V',
    MASTER: 'V',
    INSTRUCTOR: 'V',
    STUDENT: '',
  },
  fields: [],
  columns: ['action', 'userName', 'moduleName', 'createdAt'],
  description: 'Lịch sử hoạt động để kiểm tra và đối chiếu.',
  endpoint: '/audit',
  component: 'AuditPage',
};
