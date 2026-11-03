import { day, period, names } from './shared.js';
import { ROLES } from '../src/utils/permissions.js';
export function createPromotions(ctx) {
  return ctx.students.filter(s=>s.status==='ACTIVE' && ctx.ranks.some(r=>Number(r.level)>Number(ctx.ranks.find(r=>r.id===s.rankId)?.level))).slice(0, 8).map((s, i) => ({
    id: `promotion-${i}`,
    studentId: s.id,
    classId: s.classId,
    rankId: [...ctx.ranks].sort((a,b)=>a.level-b.level).find(r=>Number(r.level)>Number(ctx.ranks.find(r=>r.id===s.rankId)?.level)).id,
    reason: 'Hoàn thành chương trình và đáp ứng chuyên cần của lớp.',
    status: i < 4 ? 'PENDING' : 'APPROVED',
    createdBy: 'u-coach',
    createdAt: day(-i),
  }));
}
