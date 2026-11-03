export default {
  id: 'payment-confirmations',
  title: 'Xác nhận thanh toán',
  group: 'TÀI CHÍNH',
  icon: 'BadgeCheck',
  permissions: {
    ADMIN: 'VA',
    MASTER: 'VA',
    INSTRUCTOR: 'VA',
    STUDENT: '',
  },
  fields: [],
  columns: ['code', 'studentId', 'invoiceId', 'amount', 'method', 'status'],
  description: 'Kiểm tra và duyệt các khoản thanh toán chờ xác nhận.',
  endpoint: '/payment-confirmations',
  custom: 'payment-confirmations',
  component: 'PaymentConfirmationsPage',
};
