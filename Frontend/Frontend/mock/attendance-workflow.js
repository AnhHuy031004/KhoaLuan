import { randomUUID } from '../src/utils/uuid.js';
const fail = (status, message) => {
  throw Object.assign(new Error(message), { status });
};
const attended = (status) => ['PRESENT', 'LATE'].includes(status);
export function attendanceWorkflow({
  db,
  user,
  method,
  path,
  query,
  body,
  classIds,
  permissions,
  audit,
}) {
  const staff = ['ADMIN', 'MASTER', 'INSTRUCTOR'].includes(user.role);
  if (!staff || !permissions.includes('V'))
    fail(403, 'Bạn không có quyền phụ trách điểm danh.');
  if (method !== 'GET' && !permissions.includes('E'))
    fail(403, 'Bạn không có quyền ghi nhận điểm danh.');
  db.attendanceSessions ||= {};
  const lessons = db.schedules.filter(
    (s) => classIds.includes(s.classId) && s.status !== 'CANCELLED',
  );
  const rosterFor = (lesson) => {
    // Explicit session assignments take priority; otherwise use dated class enrollments.
    const assigned = Array.isArray(lesson.studentIds)
      ? new Set(lesson.studentIds)
      : null;
    return db.students
      .filter((s) => {
        if (s.status !== 'ACTIVE') return false;
        if (assigned) return assigned.has(s.id);
        const enrollments = db.enrollments.filter((e) => e.studentId === s.id);
        if (!enrollments.length) return s.classId === lesson.classId;
        return enrollments.some(
          (e) =>
            e.classId === lesson.classId &&
            e.joinedAt <= lesson.sessionDate &&
            (e.status === 'ACTIVE' || Boolean(e.leftAt)) &&
            (!e.leftAt || e.leftAt > lesson.sessionDate),
        );
      })
      .map((s) => ({
        studentId: s.id,
        studentCode: s.studentCode,
        fullName: s.fullName,
        rankId: s.rankId,
      }));
  };
  const describe = (lesson) => {
    const klass = db.classes.find((c) => c.id === lesson.classId);
    const saved = db.attendanceSessions[lesson.id];
    return {
      ...lesson,
      className: klass?.name || lesson.classId,
      instructorName:
        db.instructors.find((i) => i.id === klass?.instructorId)?.fullName ||
        'Chưa phân công',
      attendanceStatus: saved?.status || 'OPEN',
      closedAt: saved?.closedAt,
      rosterCount: saved?.roster?.length ?? rosterFor(lesson).length,
    };
  };
  if (path === '/attendance-workflow/dates' && method === 'GET')
    return { dates: [...new Set(lessons.map((s) => s.sessionDate))].sort() };
  if (path === '/attendance-workflow/sessions' && method === 'GET')
    return {
      items: lessons
        .filter((s) => s.sessionDate === query.date)
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
        .map(describe),
    };
  const match = path.match(
    /^\/attendance-workflow\/sessions\/([^/]+)(?:\/(present|close))?$/,
  );
  if (!match) fail(404, 'Không tìm thấy thao tác điểm danh.');
  const lesson = lessons.find((s) => s.id === decodeURIComponent(match[1]));
  if (!lesson)
    fail(404, 'Buổi tập không tồn tại hoặc không thuộc phạm vi phụ trách.');
  let state = db.attendanceSessions[lesson.id];
  if (!state) {
    state = {
      id: lesson.id,
      scheduleId: lesson.id,
      classId: lesson.classId,
      sessionDate: lesson.sessionDate,
      startTime: lesson.startTime,
      endTime: lesson.endTime,
      status: 'OPEN',
      roster: rosterFor(lesson),
      openedAt: new Date().toISOString(),
    };
    db.attendanceSessions[lesson.id] = state;
    // Attach legacy day-level records only when that class has one session that day.
    const single =
      lessons.filter(
        (s) =>
          s.classId === lesson.classId && s.sessionDate === lesson.sessionDate,
      ).length === 1;
    if (single)
      for (const row of db.attendance)
        if (
          !row.scheduleId &&
          row.classId === lesson.classId &&
          row.sessionDate === lesson.sessionDate &&
          state.roster.some((s) => s.studentId === row.studentId)
        )
          row.scheduleId = lesson.id;
  }
  const recordFor = (id) =>
    db.attendance.find((a) => a.scheduleId === lesson.id && a.studentId === id);
  const view = () => {
    const rows = state.roster.map((s) => {
      const a = recordFor(s.studentId);
      return {
        ...s,
        recordId: a?.id,
        status: a?.status || 'UNMARKED',
        confirmedAt: a?.confirmedAt,
        confirmedBy: a?.confirmedBy,
        note: a?.note || '',
      };
    });
    return {
      ...describe(lesson),
      ...state,
      rows,
      counts: {
        total: rows.length,
        present: rows.filter((r) => attended(r.status)).length,
        absent: rows.filter((r) => r.status === 'ABSENT').length,
        excused: rows.filter((r) => r.status === 'EXCUSED').length,
        unmarked: rows.filter((r) => r.status === 'UNMARKED').length,
      },
    };
  };
  if (!match[2] && method === 'GET') return view();
  if (method !== 'POST') fail(405, 'Phương thức không được hỗ trợ.');
  if (state.status === 'CLOSED')
    fail(409, 'Buổi học đã chốt điểm danh, không thể thay đổi.');
  if (match[2] === 'present') {
    if (
      !Array.isArray(body.studentIds) ||
      !body.studentIds.length ||
      body.studentIds.some((id) => typeof id !== 'string')
    )
      fail(400, 'Vui lòng chọn học viên có mặt.');
    const ids = [...new Set(body.studentIds)];
    if (ids.some((id) => !state.roster.some((s) => s.studentId === id)))
      fail(400, 'Có học viên không thuộc danh sách buổi tập.');
    for (const id of ids) {
      let record = recordFor(id);
      if (attended(record?.status)) continue;
      if (!record) {
        record = {
          id: randomUUID(),
          scheduleId: lesson.id,
          studentId: id,
          classId: lesson.classId,
          sessionDate: lesson.sessionDate,
        };
        db.attendance.push(record);
      }
      Object.assign(record, {
        status: 'PRESENT',
        confirmedAt: new Date().toISOString(),
        confirmedBy: user.id,
      });
    }
    audit('Xác nhận học viên có mặt', 'Điểm danh');
    return view();
  }
  if (match[2] === 'close') {
    if (body.confirm !== true) fail(400, 'Vui lòng xác nhận chốt điểm danh.');
    if (!state.roster.length)
      fail(400, 'Buổi tập chưa có học viên để chốt điểm danh.');
    for (const s of state.roster) {
      let record = recordFor(s.studentId);
      if (attended(record?.status)) continue;
      if (!record) {
        record = {
          id: randomUUID(),
          scheduleId: lesson.id,
          studentId: s.studentId,
          classId: lesson.classId,
          sessionDate: lesson.sessionDate,
        };
        db.attendance.push(record);
      }
      const leave = db.leaves.some(
        (l) =>
          l.studentId === s.studentId &&
          l.classId === lesson.classId &&
          l.sessionDate === lesson.sessionDate &&
          l.status === 'APPROVED',
      );
      record.status = record.status === 'EXCUSED' || leave ? 'EXCUSED' : 'ABSENT';
      record.closedBy = user.id;
    }
    Object.assign(state, {
      status: 'CLOSED',
      closedAt: new Date().toISOString(),
      closedBy: user.id,
    });
    lesson.attendanceStatus = 'CLOSED';
    audit('Chốt điểm danh buổi học', 'Điểm danh');
    return view();
  }
  fail(404, 'Không tìm thấy thao tác điểm danh.');
}
