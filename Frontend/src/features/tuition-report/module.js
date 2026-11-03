export default {
  id: 'tuition-report',
  title: 'Báo cáo học phí',
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
  endpoint: '/tuition-report',
  custom: 'report',
  reportKind: 'tuition',
  component: 'TuitionReportPage',
};
