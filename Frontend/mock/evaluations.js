import { day, period, names } from './shared.js';
import { ROLES } from '../src/utils/permissions.js';

export function createEvaluations(ctx) {
  // Leave roughly 1/3 of students ungraded in the current month so Admin/HLV can test quick grading & ungraded filter
  return ctx.students
    .filter((_, i) => i % 3 !== 2)
    .map((s, i) => ({
      id: `eval-${i}`,
      studentId: s.id,
      classId: s.classId,
      period: period(),
      rating: 7 + (i % 7) * 0.5,
      comment: [
        'Tiến bộ tốt về tấn pháp và kỹ thuật căn bản.',
        'Chuyên cần, tích cực trong các buổi huấn luyện.',
        'Cần rèn luyện thêm thể lực và phản xạ đối kháng.',
      ][i % 3],
      createdAt: day(-i % 10),
    }));
}
