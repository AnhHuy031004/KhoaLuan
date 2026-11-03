import { encodeScores } from '../src/features/exams/utils/scores.js';
export function createExamResults(context) {
  const {
    now,
    students,
    ranks,
    exams
  } = context;
  return students.map((s, i) => ({
    id: `registration-${i + 1}`,
    studentId: s.id,
    studentName: s.fullName,
    examId: exams[0].id,
    exam: exams[0],
    targetRank: ranks[1],
    status: i === 0 ? 'RESULT_PASS' : 'REGISTERED',
    resultNote: i === 0 ? encodeScores({
      quyenScore: 8,
      theoryFitnessScore: 7.5,
      basicScore: 8,
      sparringScore: 7
    }, 'Hoàn thành tốt nội dung thi') : 'Chờ thi',
    resultRecordedAt: i === 0 ? now.toISOString() : null
  }));
}
