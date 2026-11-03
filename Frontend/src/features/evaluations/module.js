export default {
  id: 'evaluations',
  title: 'Đánh giá võ sinh',
  group: 'ĐÀO TẠO',
  icon: 'Star',
  permissions: {
    ADMIN: 'VCED',
    MASTER: 'VCE',
    INSTRUCTOR: 'VCE',
    STUDENT: 'V',
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
      key: 'period',
      label: 'Tháng đánh giá',
      type: 'month',
      required: true,
    },
    {
      key: 'rating',
      label: 'Điểm đánh giá (0–10)',
      type: 'score',
      required: true,
    },
    {
      key: 'comment',
      label: 'Nhận xét',
      type: 'textarea',
      required: true,
    },
  ],
  columns: ['studentId', 'classId', 'period', 'rating', 'comment'],
  description: 'Ghi nhận tiến bộ, kỷ luật và kỹ thuật.',
  endpoint: '/evaluations',
  component: 'EvaluationsPage',
};
