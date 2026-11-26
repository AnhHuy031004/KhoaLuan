export const filterStatuses = {
  leaves: ['PENDING', 'APPROVED', 'REJECTED'],
  discounts: ['PENDING', 'APPROVED', 'REJECTED'],
  exams: ['PENDING', 'APPROVED', 'REJECTED'],
  'exam-results': ['PENDING', 'PASS', 'FAIL', 'REJECTED'],
  invoices: ['UNPAID', 'PAID'],
  'online-payments': ['DRAFT', 'PENDING', 'SUCCESS', 'REJECTED'],
  'payment-confirmations': ['PENDING', 'SUCCESS', 'REJECTED'],
  transactions: ['SUCCESS', 'REJECTED'],
  attendance: ['PRESENT', 'LATE', 'ABSENT', 'EXCUSED', 'UNMARKED'],
  announcements: ['DRAFT', 'PUBLISHED'],
};
export const createLabels = {
  students: 'Thêm võ sinh',
  classes: 'Thêm lớp học',
  schedules: 'Thêm lịch tập',
  invoices: 'Lập hóa đơn',
  users: 'Cấp tài khoản',
  enrollments: 'Phân lớp',
  leaves: 'Gửi đơn xin nghỉ',
  discounts: 'Gửi đề xuất',
  exams: 'Tạo kỳ thi',
  'exam-results': 'Nhập kết quả thi',
  'online-payments': 'Tạo yêu cầu xác nhận',
};
export function statusesFor(config) {
  return (
    config.filterStatuses ||
    filterStatuses[config.id] ||
    config.fields
      .find((f) => f.key === 'status')
      ?.options?.map(([value]) => value) ||
    []
  );
}
export function notificationTarget(n, viewer) {
  if (n?.systemEvent === 'PAYMENT_CONFIRMATION_PENDING') {
    return '/app/payment-confirmations?status=PENDING';
  }
  if (
    ['PAYMENT_CONFIRMATION_APPROVED', 'PAYMENT_CONFIRMATION_REJECTED'].includes(
      n?.systemEvent,
    )
  ) {
    return '/app/online-payments';
  }

  if (
    viewer &&
    ['online-payments', 'payment-confirmations'].includes(n.workflowModule) &&
    n.workflowRecordId
  )
    return (
      '/app/' +
      (viewer.role === 'STUDENT'
        ? 'online-payments'
        : 'payment-confirmations') +
      '?record=' +
      encodeURIComponent(n.workflowRecordId)
    );
  if (n.workflowModule && n.workflowRecordId)
    return (
      '/app/' +
      n.workflowModule +
      '?record=' +
      encodeURIComponent(n.workflowRecordId)
    );
  if (n.resultId)
    return '/app/exam-results?record=' + encodeURIComponent(n.resultId);
  if (n.reliefId)
    return '/app/discounts?record=' + encodeURIComponent(n.reliefId);
  return '/app/announcements?record=' + encodeURIComponent(n.id);
}
export function attendanceMatches(row, filter, closed) {
  if (filter === 'PRESENT') return ['PRESENT', 'LATE'].includes(row.status);
  if (filter === 'UNMARKED')
    return closed ? row.status === 'ABSENT' : row.status === 'UNMARKED';
  return filter === 'ALL' || row.status === filter;
}
