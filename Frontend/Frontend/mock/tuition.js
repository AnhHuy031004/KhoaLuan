import { day, period, names } from './shared.js';
import { ROLES } from '../src/utils/permissions.js';
export function createTuition(ctx) {
  return ctx.classes.map((c, i) => ({
    id: `tuition-${i}`,
    classId: c.id,
    name: 'Học phí lớp ' + c.name,
    amount: c.tuition,
    period: period(),
    status: 'ACTIVE',
  }));
}
