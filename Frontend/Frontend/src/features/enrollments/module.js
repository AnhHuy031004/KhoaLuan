export default {
  id: 'enrollments',
  title: 'Phân lớp võ sinh',
  group: 'ĐÀO TẠO',
  icon: 'UserPlus',
  permissions: {
    ADMIN: 'VCED',
    MASTER: 'VCE',
    INSTRUCTOR: 'V',
    STUDENT: '',
  },
  fields: [
    {
      key: 'studentId',
      label: 'Võ sinh',
      type: 'student',
      required: true,
    },
    {
      key: 'classId',
      label: 'Lớp học',
      type: 'class',
      required: true,
    },
    {
      key: 'joinedAt',
      label: 'Ngày vào lớp',
      type: 'date',
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
  columns: ['studentId', 'classId', 'joinedAt', 'status'],
  description: 'Sắp xếp võ sinh theo trình độ và lớp phù hợp.',
  endpoint: '/enrollments',
  component: 'EnrollmentsPage',
};
