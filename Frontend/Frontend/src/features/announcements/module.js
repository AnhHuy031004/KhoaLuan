export default {
  id: 'announcements',
  title: 'Thông báo',
  group: 'ĐIỀU HÀNH',
  icon: 'Bell',
  permissions: {
    ADMIN: 'VCED',
    MASTER: 'VCP',
    INSTRUCTOR: 'VCP',
    STUDENT: 'V',
  },
  fields: [
    {
      key: 'title',
      label: 'Tiêu đề',
      type: 'text',
      required: true,
    },
    {
      key: 'body',
      label: 'Nội dung',
      type: 'textarea',
      required: true,
    },
    {
      key: 'audience',
      label: 'Đối tượng',
      type: 'select',
      required: true,
      options: [
        ['ALL', 'Tất cả'],
        ['CLASS', 'Theo lớp'],
      ],
    },
    {
      key: 'classId',
      label: 'Lớp nhận thông báo',
      type: 'class',
      required: false,
    },
  ],
  columns: ['title', 'body', 'audience', 'classId', 'status', 'createdAt'],
  description: 'Kết nối thông tin giữa võ đường và võ sinh.',
  endpoint: '/announcements',
  custom: 'announcements',
  component: 'AnnouncementsPage',
};
