import { day, period, names } from './shared.js';
import { ROLES } from '../src/utils/permissions.js';
export function createExamResults(ctx) {
  return ctx.students.slice(0, 12).map((s, i) => ({
    id: `result-${i}`,
    studentId: s.id,
    classId: s.classId,
    examId: 'ex-1',
    quyenScore: 7 + (i % 3),
    theoryFitnessScore: 7.5,
    basicScore: 8,
    sparringScore: 7,
    totalScore: 29.5 + (i % 3),
    note:
      i % 2
        ? 'Kỹ thuật tốt, tiếp tục duy trì thể lực.'
        : 'Hoàn thành nội dung kiểm tra.',
    status: i < 4 ? 'PENDING' : i === 5 ? 'FAIL' : 'PASS',
    createdAt: day(-i),
  }));
}
