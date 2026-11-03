const fail = (status, message) => {
  throw Object.assign(new Error(message), {
    status
  });
};
export async function handleStudents(context, path, method, body, q, u, session) {
  const {
    db,
    newId,
    find,
    scoped,
    paged
  } = context;
  if (path === '/students/me') {
    const s = db.students.find(s => s.linkedUserId === u.id) || fail(404, 'Chưa liên kết hồ sơ.');
    if (method === 'PATCH') Object.assign(s, body);
    return s;
  }
  if (path === '/parents/me/children') return paged(scoped(db.students, u), q);
  if (path === '/parents/link') {
    const sid = db.invites[body.inviteCode];
    if (!sid) fail(400, 'Mã mời mẫu: VOVINAM-MOCK-001 hoặc VOVINAM-MOCK-002.');
    if (!db.links.some(l => l.parentId === u.id && l.studentId === sid)) db.links.push({
      parentId: u.id,
      studentId: sid
    });
    delete db.invites[body.inviteCode];
    return find(db.students, sid);
  }
  if (path.startsWith('/parents/links/')) {
    db.links = db.links.filter(l => !(l.parentId === u.id && l.studentId === path.split('/').pop()));
    return {
      unlinked: true
    };
  }
  const invite = path.match(/^\/students\/([^/]+)\/invite-code$/);
  if (invite) {
    find(db.students, invite[1]);
    const code = 'MOCK-INVITE-' + newId().slice(0, 8);
    db.invites[code] = invite[1];
    return {
      inviteCode: code
    };
  }
}
