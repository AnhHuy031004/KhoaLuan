export default {
  id: 'attendance-report',
  title: 'Báo cáo điểm danh',
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
  endpoint: '/attendance-report',
  custom: 'report',
  reportKind: 'attendance',
  component: 'AttendanceReportPage',
};
