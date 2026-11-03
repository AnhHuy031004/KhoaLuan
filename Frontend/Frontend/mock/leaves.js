import { day, period, names } from './shared.js';
import { ROLES } from '../src/utils/permissions.js';
export function createLeaves(ctx) {
  return ctx.students.slice(0, 6).map((s, i) => ({
    id: `leave-${i}`,
    studentId: s.id,
    classId: s.classId,
    sessionDate: day(i + 1),
    reason: [
      'Bận việc gia đình',
      'Có lịch kiểm tra tại trường',
      'Nghỉ dưỡng sức theo hướng dẫn',
    ][i % 3],
    status: i < 3 ? 'PENDING' : 'APPROVED',
    createdAt: day(-i),
    ...(i >= 3 ? {reviewedBy:['u-admin','u-master',ctx.classes.find(c=>c.id===s.classId)?.instructorId][i-3],reviewedRole:['ADMIN','MASTER','INSTRUCTOR'][i-3],reviewedName:[...ctx.users,...ctx.instructors].find(u=>u.id===['u-admin','u-master',ctx.classes.find(c=>c.id===s.classId)?.instructorId][i-3])?.fullName,reviewedAt:day(-i)+'T09:00:00+07:00'} : {}),
  }));
}
