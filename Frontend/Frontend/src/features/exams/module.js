export default {
  id: 'exams',
  title: 'Kỳ thi thăng đai',
  group: 'THI & THĂNG ĐAI',
  icon: 'Trophy',
  permissions: {
    ADMIN: 'VCEDA',
    MASTER: 'VCEA',
    INSTRUCTOR: 'V',
    STUDENT: 'V',
  },
  fields: [
    {
      key: 'title',
      label: 'Tên kỳ thi',
      type: 'text',
      required: true,
    },
    {
      key: 'examDate',
      label: 'Ngày thi',
      type: 'date',
      required: true,
    },
    {
      key: 'rankId',
      label: 'Cấp đai dự thi',
      type: 'rank',
      required: true,
    },
    {
      key: 'location',
      label: 'Địa điểm',
      type: 'text',
      required: true,
    },
    {
      key: 'fee',
      label: 'Lệ phí',
      type: 'money',
      required: true,
    },
  ],
  columns: ['title', 'examDate', 'rankId', 'location', 'fee', 'status'],
  description: 'Lập kế hoạch và phê duyệt kỳ thi.',
  endpoint: '/belt-exams',
  workflow: true,
  component: 'ExamsPage',
};
