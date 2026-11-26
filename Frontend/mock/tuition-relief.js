import { randomUUID as uuid } from '../src/utils/uuid.js';
import { assertWorkflowAction } from '../src/config/workflows.js';
import { hierarchyAccess } from './hierarchy.js';
import {
  getAuthorityRank,
  canReviewReliefByHierarchy,
  requiredApproverLabel,
  roleLabel,
} from '../src/utils/permissions.js';

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
        'Hoàn cảnh gia đình khó khăn, đề nghị hỗ trợ võ sinh tiếp tục tập luyện.',
      status: 'PENDING',
      createdBy: cls.instructorId,
      submittedRole: 'INSTRUCTOR',
      submittedMasterLevel: '',
      submittedRank: 1,
      submittedRoleLabel: 'Huấn luyện viên',
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

  const decorateForViewer = (r) => {
    const canApprove =
      r.status === 'PENDING' &&
      rights.includes('A') &&
      access.allows('discounts', r, true) &&
      canReviewReliefByHierarchy(user, r);
    return {
      ...r,
      submittedRoleLabel:
        r.submittedRoleLabel ||
        roleLabel({
          role: r.submittedRole || 'INSTRUCTOR',
          masterLevel: r.submittedMasterLevel,
        }),
      requiredApproverText: requiredApproverLabel(r),
      canApprove,
    };
  };

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
    const submitterTitle =
      row.submittedRoleLabel ||
      roleLabel({
        role: row.submittedRole || 'INSTRUCTOR',
        masterLevel: row.submittedMasterLevel,
      });
    const reviewerTitle =
      row.reviewedRole === 'ADMIN'
        ? 'Admin cấp tỉnh'
        : roleLabel({
            role: row.reviewedRole,
            masterLevel: row.reviewedMasterLevel,
          });

    db.announcements.unshift({
      id: uuid(),
      title: `${submitted ? 'Đề xuất miễn giảm học phí mới' : approved ? 'Đã duyệt miễn giảm học phí' : 'Đã từ chối miễn giảm học phí'}: ${student?.fullName || 'Võ sinh'}`,
      body: `${cls?.name || 'Lớp học'} · Tháng ${row.period} · ${row.reliefType === 'EXEMPTION' ? 'Miễn toàn bộ học phí' : `Giảm ${row.percent}% học phí`}. ${submitted ? `${submitterTitle} ${row.submittedName} gửi đề xuất (${requiredApproverLabel(row)}). Lý do: ${row.reason}` : `${reviewerTitle} ${row.reviewedName} đã ${approved ? 'duyệt' : 'từ chối'} đề xuất.`}`,
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
      return decorateForViewer(row);
    }
    const list = rows
      .filter(
        (r) =>
          (!query.classId || r.classId === query.classId) &&
          (!query.status || r.status === query.status) &&
          (!query.month || r.period === query.month) &&
          (!query.search ||
            `${db.students.find((s) => s.id === r.studentId)?.fullName} ${db.classes.find((c) => c.id === r.classId)?.name} ${r.reason} ${r.submittedName} ${r.submittedRoleLabel || ''}`
              .toLocaleLowerCase('vi')
              .includes(query.search.toLocaleLowerCase('vi'))),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(decorateForViewer);

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
    if (
      !['INSTRUCTOR', 'MASTER', 'ADMIN'].includes(user.role) ||
      !rights.includes('C')
    )
      fail(
        403,
        'Chỉ HLV, Võ sư hoặc Admin được gửi đề xuất miễn giảm học phí.',
      );

    const allowedClassIds = access.classIds(true);
    const cls = db.classes.find(
      (c) =>
        c.id === body.classId &&
        (user.role === 'INSTRUCTOR'
          ? c.instructorId === user.id
          : allowedClassIds.includes(c.id)),
    );
    if (!cls)
      fail(
        403,
        user.role === 'INSTRUCTOR'
          ? 'Bạn không phụ trách lớp này.'
          : 'Lớp này không nằm trong phạm vi đơn vị quản lý của bạn.',
      );

    const student = db.students.find(
      (s) =>
        s.id === body.studentId &&
        s.classId === cls.id &&
        s.status === 'ACTIVE',
    );
    if (!student) fail(400, 'Võ sinh phải đang học trong lớp đã chọn.');

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
        'Võ sinh đã có đề xuất chờ duyệt hoặc đã duyệt trong tháng này.',
      );

    const submitterRank = getAuthorityRank(user);
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
      submittedRole: user.role,
      submittedMasterLevel: user.role === 'MASTER' ? access.level : '',
      submittedRank: submitterRank,
      submittedRoleLabel: roleLabel(user),
      submittedName: user.fullName,
      createdAt: new Date().toISOString(),
    };
    db.tuitionRelief.unshift(row);

    // Chỉ thông báo đến các cấp quản lý có thẩm quyền duyệt cao hơn trong phạm vi đơn vị
    notify(
      row,
      'TUITION_RELIEF_SUBMITTED',
      db.users
        .filter((u) => {
          if (u.status !== 'ACTIVE' || !['ADMIN', 'MASTER'].includes(u.role))
            return false;
          const uAccess = hierarchyAccess(db, u);
          return (
            uAccess.rights('discounts').includes('A') &&
            uAccess.allows('discounts', row, true) &&
            canReviewReliefByHierarchy(u, row)
          );
        })
        .map((u) => u.id),
    );
    audit('Gửi đề xuất miễn giảm học phí', 'Xem xét miễn giảm học phí');
    return decorateForViewer(row);
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
    const transition = assertWorkflowAction(
      'discounts',
      action,
      row,
      user,
      method,
    );
    if (row.status !== 'PENDING')
      fail(
        409,
        `${row.reviewedRole === 'ADMIN' ? 'Admin' : 'Võ sư'} ${row.reviewedName || ''} đã xử lý đề xuất, không thể duyệt lại.`,
      );

    // Kiểm tra xét duyệt theo cấp bậc tăng dần
    if (!canReviewReliefByHierarchy(user, row)) {
      const submitterTitle =
        row.submittedRoleLabel ||
        roleLabel({
          role: row.submittedRole || 'INSTRUCTOR',
          masterLevel: row.submittedMasterLevel,
        });
      fail(
        403,
        `Đề xuất do ${submitterTitle} gửi chỉ được phép xét duyệt bởi cấp cao hơn (${requiredApproverLabel(row)}).`,
      );
    }

    Object.assign(row, {
      status: transition.to,
      reviewedBy: user.id,
      reviewedRole: user.role,
      ...(user.role === 'MASTER' ? { reviewedMasterLevel: access.level } : {}),
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
    return decorateForViewer(row);
  }
  fail(405, 'Đề xuất không thể sửa hoặc xóa sau khi gửi.');
}
