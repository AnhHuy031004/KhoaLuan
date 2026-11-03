export const SCORE_FIELDS = [['quyenScore', 'Điểm quyền'], ['theoryFitnessScore', 'Điểm lý thuyết/ thể lực'], ['basicScore', 'Điểm căn bản'], ['sparringScore', 'Điểm đối kháng']];
const PREFIX = 'VOVINAM_SCORE_V1:';
export function totalScore(scores) {
  const values = SCORE_FIELDS.map(([key]) => scores[key]);
  if (values.some(v => v === '' || v === null || v === undefined || !Number.isFinite(Number(v)) || Number(v) < 0)) return null;
  return Math.round(values.reduce((sum, v) => sum + Number(v), 0) * 100) / 100;
}
export function readScores(row, students = []) {
  let payload = {};
  if (typeof row.resultNote === 'string' && row.resultNote.startsWith(PREFIX)) {
    try {
      payload = JSON.parse(row.resultNote.slice(PREFIX.length));
    } catch {}
  }
  const scores = {
    ...row.scores,
    ...payload.scores
  };
  for (const [key] of SCORE_FIELDS) if (row[key] !== undefined) scores[key] = row[key];
  return {
    ...row,
    ...Object.fromEntries(SCORE_FIELDS.map(([key]) => [key, scores[key] ?? null])),
    totalScore: totalScore(scores),
    studentName: row.studentName || row.student?.fullName || students.find(s => s.id === row.studentId)?.fullName || 'Chưa có họ tên',
    resultNote: payload.note ?? row.resultNote ?? ''
  };
}
export function encodeScores(scores, note) {
  if (totalScore(scores) === null) throw Error('Nhập đủ bốn điểm thành phần là số không âm.');
  return PREFIX + JSON.stringify({
    scores: Object.fromEntries(SCORE_FIELDS.map(([key]) => [key, Number(scores[key])])),
    note: note || ''
  });
}
