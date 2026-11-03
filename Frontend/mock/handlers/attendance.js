const fail = (status, message) => {
  throw Object.assign(new Error(message), {
    status
  });
};
export async function handleAttendance(context, path, method, body, q, u, session) {
  const {
    db,
    newId,
    find,
    visibleStudentIds,
    scoped,
    paged
  } = context;
  if (path === '/attendance-sessions') {
    if (!db.classes.some(c => c.id === body.classId && (u.role === 'ADMIN' || c.instructorId === u.id))) fail(403, 'Không có quyền với lớp.');
    const s = {
      ...body,
      id: newId()
    };
    db.sessions.push(s);
    return s;
  }
  const records = path.match(/^\/attendance-sessions\/([^/]+)\/records$/);
  if (records) {
    const s = find(db.sessions, records[1]);
    const cls = find(db.classes, s.classId);
    if (u.role === 'INSTRUCTOR' && cls.instructorId !== u.id) fail(403, 'Không có quyền với lớp.');
    if (method === 'GET') return paged(db.attendance.filter(a => a.sessionId === s.id), q);
    for (const v of body.records || []) {
      if (!db.enrollments.some(e => e.studentId === v.studentId && e.classId === s.classId && !e.leftAt)) fail(400, 'Võ sinh chưa thuộc lớp.');
      let record = db.attendance.find(a => a.sessionId === s.id && a.studentId === v.studentId);
      if (!record) {
        record = {
          id: newId(),
          sessionId: s.id,
          classId: s.classId,
          className: cls.name,
          sessionDate: s.sessionDate
        };
        db.attendance.push(record);
      }
      Object.assign(record, v);
    }
    return {
      saved: (body.records || []).length
    };
  }
  const history = path.match(/^\/students\/([^/]+)\/attendance$/);
  if (history) {
    if (!visibleStudentIds(u).includes(history[1])) fail(404, 'Không tìm thấy.');
    return paged(db.attendance.filter(a => a.studentId === history[1]), q);
  }
  if (path === '/attendance/summary') {
    const rows = scoped(db.attendance, u).filter(a => (!q.studentId || a.studentId === q.studentId) && (!q.month || new Date(a.sessionDate).getMonth() + 1 === Number(q.month)) && (!q.year || new Date(a.sessionDate).getFullYear() === Number(q.year)));
    return {
      studentId: q.studentId,
      month: q.month,
      year: q.year,
      total: rows.length,
      present: rows.filter(a => a.status === 'PRESENT').length,
      absent: rows.filter(a => a.status === 'ABSENT').length,
      rows
    };
  }
}
