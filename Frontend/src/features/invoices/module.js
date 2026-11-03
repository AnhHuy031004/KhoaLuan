export default {
  id: 'invoices',
  title: 'Hóa đơn học phí',
  group: 'TÀI CHÍNH',
  icon: 'ReceiptText',
  permissions: {
    ADMIN: 'VCED',
    MASTER: 'VC',
    INSTRUCTOR: '',
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
      label: 'Tháng thu',
      type: 'month',
      required: true,
    },
    {
      key: 'amount',
      label: 'Học phí gốc',
      type: 'money',
      required: true,
    },
    {
      key: 'dueDate',
      label: 'Hạn thanh toán',
      type: 'date',
      required: true,
    },
    {
      key: 'discountId',
      label: 'Khuyến mãi',
      type: 'discount',
      required: false,
    },
  ],
  columns: ['code', 'studentId', 'period', 'amount', 'dueDate', 'status'],
  description: 'Lập hóa đơn và theo dõi công nợ học phí.',
  endpoint: '/invoices',
  component: 'InvoicesPage',
};
