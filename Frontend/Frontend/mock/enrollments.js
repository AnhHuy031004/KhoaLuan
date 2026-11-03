import { day, period, names } from './shared.js';
import { ROLES } from '../src/utils/permissions.js';
export function createEnrollments(ctx) {
  return ctx.students.map((s, i) => ({
    id: `en-${i + 1}`,
    studentId: s.id,
    classId: s.classId,
    joinedAt: day(-90 + i),
    status: s.status,
  }));
}
