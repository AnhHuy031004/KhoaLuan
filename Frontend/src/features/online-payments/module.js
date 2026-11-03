export default {
  id: 'online-payments',
  title: 'Thanh toán online',
  group: 'TÀI CHÍNH',
  icon: 'CreditCard',
  permissions: {
    ADMIN: 'V',
    MASTER: 'V',
    INSTRUCTOR: '',
    STUDENT: 'CP',
  },
  fields: [
    {
      key: 'invoiceId',
      label: 'Hóa đơn cần thanh toán',
      type: 'invoice',
      required: true,
    },
  ],
  columns: ['code', 'invoiceId', 'amount', 'status', 'createdAt'],
  description: 'Tạo và xử lý giao dịch thanh toán học phí.',
  endpoint: '/online-payments',
  custom: 'online-payments',
  component: 'OnlinePaymentsPage',
};
