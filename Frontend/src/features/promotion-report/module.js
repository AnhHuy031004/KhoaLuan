export default {
  id: 'promotion-report',
  title: 'Báo cáo thăng đai',
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
  endpoint: '/promotion-report',
  custom: 'report',
  reportKind: 'promotions',
  component: 'PromotionReportPage',
};
