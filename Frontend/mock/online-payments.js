import { day, period, names } from './shared.js';
import { ROLES } from '../src/utils/permissions.js';
export function createOnlinePayments(ctx) {
  return [
    {
      id: 'payment-pending',
      code: 'GD-CHO-001',
      studentId: 's-2',
      invoiceId: 'inv-0-1',
      amount: 400000,
      method: 'BANK',
      status: 'PENDING',
      createdAt: day(),
    },
  ];
}
