import { day, period, names } from './shared.js';
import { ROLES } from '../src/utils/permissions.js';
export function createBeltHistory(ctx) {
  return ctx.students.map((s, i) => ({
    id: `history-${i}`,
    studentId: s.id,
    rankId: s.rankId,
    awardedAt: day(-60 + i),
    note: 'Hoàn thành kỳ kiểm tra cấp đai',
  }));
}
