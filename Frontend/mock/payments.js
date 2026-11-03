import { id } from './shared.js';
export function createPayments(context) {
  const {
    now,
    invoices
  } = context;
  return invoices.filter(v => v.status === 'PAID').map((v, i) => ({
    id: id(6, i + 1),
    invoiceId: v.id,
    orderRef: `MOCK-PAY-${i + 1}`,
    gateway: 'CASH',
    amount: v.total,
    status: 'SUCCESS',
    paidAt: now.toISOString()
  }));
}
