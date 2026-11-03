const fail = (status, message) => {
  throw Object.assign(new Error(message), {
    status
  });
};
export async function handleResources(context, path, method, body, q, u, session) {
  const {
    db,
    now,
    newId,
    find,
    revoke,
    visibleStudentIds,
    scoped,
    paged,
    hydrate,
    publicUser
  } = context;
  if (path === '/admin/audit-log') return paged(db.audit, q);
  const collections = {
    'students': 'students',
    'classes': 'classes',
    'enrollments': 'enrollments',
    'leave-requests': 'leaves',
    'evaluations': 'evaluations',
    'belt-ranks': 'ranks',
    'belt-exams': 'exams',
    'exam-registrations': 'examResults',
    'invoices': 'invoices',
    'payments': 'payments',
    'announcements': 'announcements',
    'users': 'users'
  };
  const [, base, recordId] = path.split('/'),
    collection = collections[base];
  if (collection) {
    let rows = db[collection];
    if (['students', 'enrollments', 'leaves', 'evaluations', 'examResults', 'invoices'].includes(collection)) rows = scoped(rows, u);
    if (collection === 'classes' && u.role !== 'ADMIN') rows = rows.filter(c => u.role === 'INSTRUCTOR' ? c.instructorId === u.id : db.enrollments.some(e => e.classId === c.id && visibleStudentIds(u).includes(e.studentId) && !e.leftAt));
    if (collection === 'payments') rows = rows.filter(p => scoped(db.invoices, u).some(i => i.id === p.invoiceId));
    if (method === 'GET') return recordId ? publicUser(hydrate(collection, find(rows, recordId))) : paged(rows.map(r => hydrate(collection, r)), q);
    if (method === 'POST') {
      if (collection === 'users' && db.users.some(a => a.email === body.email)) fail(409, 'Email đã tồn tại.');
      if (body.studentId && !visibleStudentIds(u).includes(body.studentId)) fail(404, 'Không có hồ sơ võ sinh.');
      const row = hydrate(collection, {
        ...body,
        id: collection === 'ranks' ? Math.max(0, ...db.ranks.map(r => Number(r.id))) + 1 : newId(),
        createdAt: now()
      });
      if (collection === 'students') {
        row.status ||= 'ACTIVE';
        row.hasLinkedAccount = !!body.linkedUserEmail;
        if (body.linkedUserEmail) row.linkedUserId = db.users.find(a => a.email === body.linkedUserEmail)?.id;
      }
      if (collection === 'classes') {
        row.status ||= 'ACTIVE';
        row.schedules = [];
        row.activeEnrollmentCount = 0;
      }
      if (collection === 'enrollments') {
        if (db.enrollments.some(e => e.studentId === row.studentId && e.classId === row.classId && !e.leftAt)) fail(409, 'Đã thuộc lớp.');
        row.enrolledAt ||= now();
        row.leftAt = null;
      }
      if (collection === 'users') Object.assign(row, {
        emailVerified: true,
        isActive: true,
        mfaEnabled: false
      });
      if (collection === 'leaves') row.status = 'PENDING';
      if (collection === 'announcements') row.publishedAt = now();
      db[collection].push(row);
      return publicUser(row);
    }
    const row = find(rows, recordId);
    if (method === 'PATCH' || method === 'PUT') {
      if (collection === 'users' && row.id === u.id && (body.role && body.role !== u.role || body.isActive === false)) fail(400, 'Không thể tự hạ quyền/vô hiệu hóa.');
      Object.assign(row, body);
      hydrate(collection, row);
      if (collection === 'users' && (body.password || body.role || body.isActive === false)) revoke(row.id);
      return publicUser(row);
    }
    if (method === 'DELETE') {
      if (collection === 'users' && row.id === u.id) fail(400, 'Không thể tự vô hiệu hóa.');
      if (collection === 'users') {
        row.isActive = false;
        revoke(row.id);
      } else if (collection === 'enrollments') row.leftAt = now();else db[collection] = db[collection].filter(x => x.id !== row.id);
      return {
        deleted: true
      };
    }
  }
  fail(501, `Mock chưa hỗ trợ ${method} ${path}`);
}
