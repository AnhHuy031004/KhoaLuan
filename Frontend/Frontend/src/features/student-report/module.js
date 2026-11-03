export default {
  id: 'student-report',
  title: 'Báo cáo võ sinh',
  group: 'BÁO CÁO',
  icon: 'ChartNoAxesCombined',
  permissions: {
    ADMIN: 'V',
    MASTER: 'V',
    INSTRUCTOR: 'V',
    STUDENT: 'V',
  },
  fields: [],
  columns: [],
  description: 'Số liệu tổng hợp từ dữ liệu hiện tại theo phạm vi được phép.',
  endpoint: '/student-report',
  custom: 'report',
  reportKind: 'students',
  component: 'StudentReportPage',
};
