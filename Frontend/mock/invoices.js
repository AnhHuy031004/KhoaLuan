import { day, period, names } from './shared.js';
import { ROLES } from '../src/utils/permissions.js';
export function createInvoices(ctx) {
  return Array.from({ length: 6 }, (_, m) =>
    ctx.students.map((s, i) => ({
      id: `inv-${m}-${i}`,
      code: `HD-${period(-m).replace('-', '')}-${String(i + 1).padStart(3, '0')}`,
      studentId: s.id,
      classId: s.classId,
      period: period(-m),
      amount: ctx.classes.find((c) => c.id === s.classId).tuition,
      dueDate: `${period(-m)}-28`,
      status: m > 0 || (i % 3 === 0 && i !== 0) ? 'PAID' : 'UNPAID',
      createdAt: `${period(-m)}-01`,
    })),
  ).flat();
}
