import { day, period, names } from './shared.js';
import { ROLES } from '../src/utils/permissions.js';
export function createEvaluations(ctx) {
  return ctx.students.map((s, i) => ({
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
