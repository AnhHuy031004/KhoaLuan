export default {
  id: 'online-payments',
  title: 'Biên lai & Thanh toán',
  navTitle: 'Biên lai đã thu',
  group: 'TÀI CHÍNH',
  icon: 'CreditCard',
  permissions: {
    ADMIN: 'V',
    MASTER: 'V',
    INSTRUCTOR: 'V',
    STUDENT: 'VCP',
  },
  fields: [
    {
      key: 'invoiceId',
      label: 'Hóa đơn cần thanh toán',
      type: 'invoice',
      required: true,
    },
  ],
  columns: ['code', 'studentId', 'invoiceId', 'amount', 'method', 'status', 'createdAt'],
  description: 'Tổng hợp toàn bộ hóa đơn thanh toán Chuyển khoản và Tiền mặt.',
  endpoint: '/online-payments',
  custom: 'online-payments',
  component: 'OnlinePaymentsPage',
};
