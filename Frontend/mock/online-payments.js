import { day, period } from './shared.js';

export function createOnlinePayments(ctx) {
  const invoices = ctx.invoices || [];
  const paidBank = invoices.filter(
    (inv) => inv.status === 'PAID' && inv.paymentMethod === 'BANK',
  );

  // Online transfers are auto-verified upon QR payment
  return paidBank.slice(0, 8).map((inv, idx) => ({
    id: `payment-auto-${idx + 1}`,
    code: `CK-${inv.period.replace('-', '')}-${String(idx + 1).padStart(3, '0')}`,
    studentId: inv.studentId,
    classId: inv.classId,
    invoiceId: inv.id,
    amount: inv.amount,
    method: 'BANK',
    status: 'SUCCESS',
    note: 'Tự động xác nhận chuyển khoản QR ngân hàng',
    createdAt: inv.paidAt || day(-idx),
  }));
}
