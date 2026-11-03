export default {
  id: 'tuition',
  title: 'Quản lý học phí',
  group: 'TÀI CHÍNH',
  icon: 'Wallet',
  permissions: {
    ADMIN: 'VCED',
    MASTER: 'V',
    INSTRUCTOR: 'V',
    STUDENT: 'V',
  },
  fields: [
    {
      key: 'classId',
      label: 'Lớp học',
      type: 'class',
      required: true,
    },
    {
      key: 'name',
      label: 'Khoản học phí',
      type: 'text',
      required: true,
    },
    {
      key: 'amount',
      label: 'Mức thu',
      type: 'money',
      required: true,
    },
    {
      key: 'period',
      label: 'Kỳ học phí',
      type: 'month',
      required: true,
    },
    {
      key: 'status',
      label: 'Trạng thái',
      type: 'select',
      required: true,
      options: [
        ['ACTIVE', 'Đang áp dụng'],
        ['PAUSED', 'Tạm ngừng'],
      ],
    },
  ],
  columns: ['classId', 'name', 'amount', 'period', 'status'],
  description: 'Biểu phí minh bạch theo lớp và từng kỳ.',
  endpoint: '/tuition',
  component: 'TuitionPage',
};
