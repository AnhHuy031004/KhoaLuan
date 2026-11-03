import { randomUUID as uuid } from '../src/utils/uuid.js';
import { assertWorkflowAction } from '../src/config/workflows.js';
import { hierarchyAccess } from './hierarchy.js';
const fail = (status, message) => {
  throw Object.assign(new Error(message), { status });
};
export function seedTuitionRelief(db) {
  return db.students.slice(0, 3).map((s, i) => {
    const cls = db.classes.find((c) => c.id === s.classId),
      coach =
        db.users.find((u) => u.id === cls.instructorId) ||
        db.instructors.find((u) => u.id === cls.instructorId);
    return {
      id: 'relief-' + i,
      studentId: s.id,
      classId: s.classId,
      reliefType: i === 0 ? 'EXEMPTION' : 'REDUCTION',
      percent: i === 0 ? 100 : 30,
      period: new Date().toISOString().slice(0, 7),
      reason:
        'Hoàn cảnh gia đình khó khăn, đề nghị hỗ trợ học viên tiếp tục tập luyện.',
      status: 'PENDING',
      createdBy: cls.instructorId,
      submittedName: coach?.fullName || 'Huấn luyện viên',
      createdAt: new Date().toISOString(),
    };
  });
}
export function tuitionRelief({
  db,
  user,
  path,
  method,
  body,
  query,
  lookups,
  audit,
  access = hierarchyAccess(db, user),
}) {
  const rights = access.rights('discounts');
  if (!rights.includes('V'))
    fail(403, 'Bạn không có quyền xem đề xuất miễn giảm học phí.');
  const parts = path.split('/').filter(Boolean),
    id = parts[1],
    action = parts[3];
  if (
    parts.length > 1 &&
    !(parts.length === 2 || (parts.length === 4 && parts[2] === 'actions'))
  )
    fail(404, 'Đường dẫn đề xuất không hợp lệ.');
  if (parts[2] === 'actions')
    assertWorkflowAction('discounts', action, null, user, method);
  const rows = db.tuitionRelief
    .filter((r) => access.allows('discounts', r))
    .filter(
      (r) =>
        ['ADMIN', 'MASTER'].includes(user.role) ||
        (user.role === 'INSTRUCTOR' &&
          db.classes.some(
            (c) => c.id === r.classId && c.instructorId === user.id,
          )) ||
        (user.role === 'STUDENT' && r.studentId === user.studentId),
    );
  const notify = (row, event, recipients) => {
    const student = db.students.find((s) => s.id === row.studentId),
      cls = db.classes.find((c) => c.id === row.classId),
      approved = row.status === 'APPROVED',
      submitted = event === 'TUITION_RELIEF_SUBMITTED';
    db.announcements.unshift({
      id: uuid(),
      title: `${submitted ? 'Đề xuất miễn giảm học phí mới' : approved ? 'Đã duyệt miễn giảm học phí' : 'Đã từ chối miễn giảm học phí'}: ${student?.fullName || 'Học viên'}`,
      body: `${cls?.name || 'Lớp học'} · Tháng ${row.period} · ${row.reliefType === 'EXEMPTION' ? 'Miễn toàn bộ học phí' : `Giảm ${row.percent}% học phí`}. ${submitted ? `HLV ${row.submittedName} gửi đề xuất. Lý do: ${row.reason}` : `${row.reviewedRole === 'ADMIN' ? 'Admin' : 'Võ sư'} ${row.reviewedName} đã ${approved ? 'duyệt' : 'từ chối'} đề xuất.`}`,
      audience: 'CLASS',
      classId: row.classId,
      studentId: row.studentId,
      status: 'PUBLISHED',
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      systemEvent: event,
      reliefId: row.id,
      recipientUserIds: [...new Set(recipients)],
    });
  };
  if (method === 'GET') {
    if (id) {
      const row = rows.find((r) => r.id === id);
      if (!row) fail(404, 'Không tìm thấy đề xuất trong phạm vi của bạn.');
      return row;
    }
    const list = rows
      .filter(
        (r) =>
          (!query.classId || r.classId === query.classId) &&
          (!query.status || r.status === query.status) &&
          (!query.month || r.period === query.month) &&
          (!query.search ||
            `${db.students.find((s) => s.id === r.studentId)?.fullName} ${db.classes.find((c) => c.id === r.classId)?.name} ${r.reason} ${r.submittedName}`
              .toLocaleLowerCase('vi')
              .includes(query.search.toLocaleLowerCase('vi'))),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const page = Math.max(1, Number(query.page) || 1),
      limit = Math.min(5000, Math.max(1, Number(query.limit) || 8));
    return {
      items: list.slice((page - 1) * limit, page * limit),
      total: list.length,
      page,
      limit,
      lookups: lookups(),
      summary: { count: list.length },
    };
  }
  if (method === 'POST' && !id) {
    if (user.role !== 'INSTRUCTOR' || !rights.includes('C'))
      fail(403, 'Chỉ HLV phụ trách lớp được gửi đề xuất.');
    const cls = db.classes.find(
      (c) => c.id === body.classId && c.instructorId === user.id,
    );
    if (!cls) fail(403, 'Bạn không phụ trách lớp này.');
    const student = db.students.find(
      (s) =>
        s.id === body.studentId && s.classId === cls.id && s.status === 'ACTIVE',
    );
    if (!student) fail(400, 'Học viên phải đang học trong lớp phụ trách.');
    if (!['REDUCTION', 'EXEMPTION'].includes(body.reliefType))
      fail(400, 'Chọn hình thức miễn hoặc giảm học phí.');
    const percent =
      body.reliefType === 'EXEMPTION' ? 100 : Number(body.percent);
    if (
      !Number.isFinite(percent) ||
      percent <= 0 ||
      percent > 100 ||
      (body.reliefType === 'REDUCTION' && percent >= 100)
    )
      fail(
        400,
        'Mức giảm phải lớn hơn 0 và nhỏ hơn 100%; miễn toàn bộ là 100%.',
      );
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(body.period || '')))
      fail(400, 'Chọn tháng áp dụng hợp lệ.');
    const reason = String(body.reason || '').trim();
    if (!reason || reason.length > 2000)
      fail(400, 'Nhập lý do đề xuất, tối đa 2000 ký tự.');
    if (
      db.tuitionRelief.some(
        (r) =>
          r.studentId === student.id &&
          r.period === body.period &&
          ['PENDING', 'APPROVED'].includes(r.status),
      )
    )
      fail(
        409,
        'Học viên đã có đề xuất chờ duyệt hoặc đã duyệt trong tháng này.',
      );
    const row = {
      id: uuid(),
      studentId: student.id,
      classId: cls.id,
      reliefType: body.reliefType,
      percent,
      period: body.period,
      reason,
      status: 'PENDING',
      createdBy: user.id,
      submittedName: user.fullName,
      createdAt: new Date().toISOString(),
    };
    db.tuitionRelief.unshift(row);
    notify(
      row,
      'TUITION_RELIEF_SUBMITTED',
      db.users
        .filter(
          (u) =>
            u.status === 'ACTIVE' &&
            ['ADMIN', 'MASTER'].includes(u.role) &&
            hierarchyAccess(db, u).rights('discounts').includes('A') &&
            hierarchyAccess(db, u).allows('discounts', row, true),
        )
        .map((u) => u.id),
    );
    audit('Gửi đề xuất miễn giảm học phí', 'Xem xét miễn giảm học phí');
    return row;
  }
  if (
    method === 'POST' &&
    parts[2] === 'actions' &&
    ['approve', 'reject'].includes(action)
  ) {
    if (!['ADMIN', 'MASTER'].includes(user.role) || !rights.includes('A'))
      fail(403, 'Chỉ Admin hoặc Võ sư được duyệt đề xuất.');
    const row = rows.find((r) => r.id === id);
    if (!row) fail(404, 'Không tìm thấy đề xuất.');
    access.assertWrite('discounts', row);
    const transition = assertWorkflowAction('discounts', action, row, user, method);
    if (row.status !== 'PENDING')
      fail(
        409,
        `${row.reviewedRole === 'ADMIN' ? 'Admin' : 'Võ sư'} ${row.reviewedName || ''} đã xử lý đề xuất, không thể duyệt lại.`,
      );
    Object.assign(row, {
      status: transition.to,
      reviewedBy: user.id,
      reviewedRole: user.role,
      ...(user.role === 'MASTER'
        ? { reviewedMasterLevel: access.level }
        : {}),
      reviewedName: user.fullName,
      reviewedAt: new Date().toISOString(),
    });
    notify(
      row,
      'TUITION_RELIEF_REVIEWED',
      db.users
        .filter(
          (u) =>
            u.status === 'ACTIVE' &&
            (u.id === row.createdBy ||
              (u.role === 'STUDENT' && u.studentId === row.studentId)),
        )
        .map((u) => u.id),
    );
    audit(
      action === 'approve'
        ? 'Duyệt miễn giảm học phí'
        : 'Từ chối miễn giảm học phí',
      'Xem xét miễn giảm học phí',
    );
    return row;
  }
  fail(405, 'Đề xuất không thể sửa hoặc xóa sau khi gửi.');
}
