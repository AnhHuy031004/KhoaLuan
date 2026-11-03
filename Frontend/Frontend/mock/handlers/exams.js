const fail = (status, message) => {
  throw Object.assign(new Error(message), {
    status
  });
};
export async function handleExams(context, path, method, body, q, u, session) {
  const {
    db,
    now,
    newId,
    find,
    visibleStudentIds,
    scoped,
    hydrate
  } = context;
  const register = path.match(/^\/belt-exams\/([^/]+)\/register$/);
  if (register) {
    if (!visibleStudentIds(u).includes(body.studentId)) fail(404, 'Không có hồ sơ này.');
    if (db.examResults.some(r => r.examId === register[1] && r.studentId === body.studentId)) fail(409, 'Đã đăng ký thi.');
    find(db.exams, register[1]);
    const r = hydrate('examResults', {
      id: newId(),
      examId: register[1],
      studentId: body.studentId,
      status: 'REGISTERED'
    });
    db.examResults.push(r);
    return r;
  }
  const result = path.match(/^\/exam-registrations\/([^/]+)\/result$/);
  if (result) {
    const r = find(scoped(db.examResults, u), result[1]);
    Object.assign(r, body, {
      resultRecordedAt: now()
    });
    if (body.status === 'RESULT_PASS') {
      const s = find(db.students, r.studentId);
      s.currentBeltRankId = r.targetRank?.id || s.currentBeltRankId;
    }
    return r;
  }
}
