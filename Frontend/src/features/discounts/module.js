export default {
  id: 'discounts',
  title: 'Xem xét miễn giảm học phí',
  group: 'TÀI CHÍNH',
  icon: 'BadgeCheck',
  permissions: {
    ADMIN: 'VCA',
    MASTER: 'VCA',
    INSTRUCTOR: 'VC',
    STUDENT: 'V',
  },
  fields: [
    { key: 'classId', label: 'Lớp học', type: 'class', required: true },
    { key: 'studentId', label: 'Võ sinh', type: 'student', required: true },
    {
      key: 'reliefType',
      label: 'Hình thức đề xuất',
      type: 'select',
      required: true,
      options: [
        ['REDUCTION', 'Giảm học phí'],
        ['EXEMPTION', 'Miễn toàn bộ học phí'],
      ],
    },
    {
      key: 'percent',
      label: 'Mức miễn giảm (%)',
      type: 'percent',
      required: true,
    },
    { key: 'period', label: 'Tháng áp dụng', type: 'month', required: true },
    { key: 'reason', label: 'Lý do đề xuất', type: 'textarea', required: true },
  ],
  columns: [
    'studentId',
    'classId',
    'reliefType',
    'percent',
    'period',
    'reason',
    'submittedName',
    'status',
  ],
  description:
    'HLV, Võ sư các cấp và Admin gửi đề xuất miễn giảm học phí. Hệ thống xét duyệt theo cấp bậc tăng dần (cấp cao hơn duyệt đề xuất của cấp dưới).',
  endpoint: '/tuition-relief',
  workflow: true,
  component: 'DiscountsPage',
};
