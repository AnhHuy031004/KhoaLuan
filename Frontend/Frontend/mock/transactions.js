import { day, period, names } from './shared.js';
import { ROLES } from '../src/utils/permissions.js';
export function createTransactions(ctx) {
  return ctx.invoices
    .filter((x) => x.status === 'PAID')
    .map((x, i) => ({
      id: `tx-${i}`,
      code: `GD-${String(i + 1).padStart(5, '0')}`,
      studentId: x.studentId,
      invoiceId: x.id,
      amount: x.amount,
      method: i % 2 ? 'BANK' : 'CASH',
      status: 'SUCCESS',
      createdAt: `${x.period}-${String((i % 20) + 2).padStart(2, '0')}`,
    }));
}
