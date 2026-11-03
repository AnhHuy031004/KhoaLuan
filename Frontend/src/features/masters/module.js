export default {
  id: 'masters',
  title: 'Đội ngũ võ sư',
  group: 'ĐÀO TẠO',
  icon: 'Award',
  permissions: {
    ADMIN: 'VCED',
    MASTER: 'V',
    INSTRUCTOR: '',
    STUDENT: '',
  },
  fields: [
    {
      key: 'fullName',
      label: 'Họ và tên',
      type: 'text',
      required: true,
    },
    {
      key: 'email',
      label: 'Email',
      type: 'email',
      required: true,
    },
    {
      key: 'phone',
      label: 'Số điện thoại',
      type: 'text',
      required: true,
    },
    {
      key: 'qualification',
      label: 'Trình độ / cấp đai',
      type: 'text',
      required: true,
    },
    {
      key: 'status',
      label: 'Trạng thái',
      type: 'select',
      required: true,
      options: [
        ['ACTIVE', 'Đang hoạt động'],
        ['PAUSED', 'Tạm dừng'],
      ],
    },
  ],
  columns: ['fullName', 'email', 'masterLevel', 'wardId', 'clubId', 'qualification', 'status'],
  description: 'Thông tin võ sư và chuyên môn huấn luyện.',
  endpoint: '/masters',
  component: 'MastersPage',
};
