import { MOCK_PASSWORD } from '../mock/users.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createMockFetch, DB_KEY } from '../mock/api.js';
import { leaveReviewStatus } from '../src/features/leaves/reviewStatus.js';
import {
  statusesFor,
  attendanceMatches,
  notificationTarget,
} from '../src/config/uiPolicy.js';
import { modules } from '../src/routes/routeConfig.js';
async function setup() {
  const map = new Map(),
    storage = {
      getItem: (k) => map.get(k) || null,
      setItem: (k, v) => map.set(k, v),
    },
    fetch = createMockFetch({ storage });
  let token;
  const call = async (path, method = 'GET', body) => {
    const r = await fetch('/backend' + path, {
      method,
      headers: token ? { Authorization: 'Bearer ' + token } : {},
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: r.status, ...(await r.json()) };
  };
  const login = await call('/auth/login', 'POST', {
    email: 'admin@vovinam.test',
    password: MOCK_PASSWORD,
  });
  assert.equal(login.status, 200);
  token = login.data.tokens.accessToken;
  return {
    call,
    storage,
    db: () => JSON.parse(storage.getItem(DB_KEY)),
    write: (d) => storage.setItem(DB_KEY, JSON.stringify(d)),
  };
}
test('F01 historical PASS records the award without downgrading the current belt', async () => {
  const s = await setup(),
    d = s.db();
  d.students[0].rankId = 'r-4';
  s.write(d);
  const result = d['exam-results'].find(
    (r) => r.studentId === d.students[0].id && r.status === 'PENDING',
  );
  assert.equal(
    (
      await s.call('/exam-results/' + result.id + '/actions/approve', 'POST', {
        outcome: 'PASS',
      })
    ).status,
    200,
  );
  assert.equal(s.db().students[0].rankId, 'r-4');
  assert.equal(s.db()['belt-history'][0].classId, result.classId);
});
test('F02 membership for an unopened old session survives an effective class transfer', async () => {
  const s = await setup(),
    d = s.db();
  d.enrollments.find((e) => e.studentId === 's-1').joinedAt = '2020-01-01';
  d.schedules.push({
    id: 'past',
    classId: 'c-1',
    sessionDate: '2025-01-01',
    startTime: '18:00',
    endTime: '19:00',
    status: 'SCHEDULED',
  });
  s.write(d);
  assert.equal(
    (
      await s.call('/enrollments', 'POST', {
        studentId: 's-1',
        classId: 'c-2',
        joinedAt: '2025-02-01',
        status: 'ACTIVE',
      })
    ).status,
    200,
  );
  const roster = await s.call('/attendance-workflow/sessions/past');
  assert(roster.data.rows.some((r) => r.studentId === 's-1'));
  assert.equal(
    s.db().enrollments.find((e) => e.studentId === 's-1' && e.classId === 'c-1')
      .leftAt,
    '2025-02-01',
  );
});
test('F03 reading a roster does not freeze the schedule or its membership', async () => {
  const s = await setup(),
    d = s.db(),
    lesson = d.schedules[0];
  d.attendance = d.attendance.filter(
    (a) => a.classId !== lesson.classId || a.sessionDate !== lesson.sessionDate,
  );
  s.write(d);
  await s.call('/attendance-workflow/sessions/' + lesson.id);
  assert.equal(s.db().attendanceSessions?.[lesson.id], undefined);
  assert.equal(
    (
      await s.call('/schedules/' + lesson.id, 'PATCH', {
        ...lesson,
        startTime: '21:00',
        endTime: '22:00',
      })
    ).status,
    200,
  );
  const other = d.students.find(
    (st) => st.classId !== lesson.classId && st.status === 'ACTIVE',
  );
  assert.equal(
    (
      await s.call('/enrollments', 'POST', {
        studentId: other.id,
        classId: lesson.classId,
        joinedAt: lesson.sessionDate,
        status: 'ACTIVE',
      })
    ).status,
    200,
  );
  assert(
    (await s.call('/attendance-workflow/sessions/' + lesson.id)).data.rows.some(
      (r) => r.studentId === other.id,
    ),
  );
});
test('F04 correction needs a reason, preserves before/after and allows controlled changes after close', async () => {
  const s = await setup(),
    d = s.db(),
    lesson = d.schedules[0],
    path = '/attendance-workflow/sessions/' + lesson.id;
  d.attendance = d.attendance.filter(
    (a) => a.classId !== lesson.classId || a.sessionDate !== lesson.sessionDate,
  );
  s.write(d);
  const roster = (await s.call(path)).data;
  const studentId = roster.rows[0].studentId;
  await s.call(path + '/present', 'POST', { studentIds: [studentId] });
  assert.equal(
    (await s.call(path + '/undo', 'POST', { studentId })).status,
    400,
  );
  assert.equal(
    (await s.call(path + '/undo', 'POST', { studentId, reason: 'Bấm nhầm' }))
      .data.rows[0].status,
    'UNMARKED',
  );
  await s.call(path + '/close', 'POST', { confirm: true });
  assert.equal(
    (
      await s.call(path + '/correct', 'POST', {
        studentId,
        status: 'EXCUSED',
        reason: 'Đơn nghỉ duyệt bổ sung',
      })
    ).status,
    200,
  );
  assert.equal(s.db().attendanceCorrections.at(-1).after, 'EXCUSED');
  assert.equal((await s.call(path + '/correct', 'GET')).status, 405);
});
test('F05 malformed or unsupported local DB is never overwritten by seed', async () => {
  for (const raw of [
    '{invalid',
    JSON.stringify({ version: 999, students: [] }),
  ]) {
    const s = await setup();
    s.storage.setItem(DB_KEY, raw);
    const result = await s.call('/auth/me');
    assert.equal(result.status, 503);
    assert.equal(s.storage.getItem(DB_KEY), raw);
  }
});
test('F08 same class, coach or venue cannot be double booked', async () => {
  const s = await setup(),
    lesson = s.db().schedules[0];
  assert.equal((await s.call('/schedules', 'POST', lesson)).status, 409);
  assert.equal(
    (await s.call('/schedules', 'POST', { ...lesson, classId: 'c-2' })).status,
    409,
  );
  assert.equal(
    (
      await s.call('/schedules', 'POST', {
        ...lesson,
        startTime: '23:00',
        endTime: '23:30',
      })
    ).status,
    200,
  );
});
test('F09 account profile updates the canonical person', async () => {
  const s = await setup();
  const login = await s.call('/auth/login', 'POST', {
    email: 'vosinh@vovinam.test',
    password: MOCK_PASSWORD,
  });
  const f = createMockFetch({ storage: s.storage });
  const r = await f('/backend/auth/profile', {
    method: 'PATCH',
    headers: { Authorization: 'Bearer ' + login.data.tokens.accessToken },
    body: JSON.stringify({ fullName: 'Tên thống nhất', phone: '0999999999' }),
  });
  assert.equal(r.status, 200);
  assert.equal(
    s.db().students.find((st) => st.id === 's-1').fullName,
    'Tên thống nhất',
  );
});
test('F10 new invoices use the exact period tariff and require a reason for changing it', async () => {
  const s = await setup(),
    d = s.db(),
    rate = {
      ...d.tuition[0],
      id: 'future-rate',
      classId: 'c-1',
      period: '2045-01',
      amount: 490000,
      status: 'ACTIVE',
    };
  d.tuition.push(rate);
  s.write(d);
  const body = {
    studentId: 's-1',
    classId: 'c-1',
    period: '2045-01',
    dueDate: '2045-01-15',
    discountId: '',
  };
  assert.equal(
    (await s.call('/invoices', 'POST', { ...body, amount: 1 })).status,
    400,
  );
  const invoice = await s.call('/invoices', 'POST', body);
  assert.equal(invoice.status, 200, invoice.message);
  assert.equal(invoice.data.baseAmount, 490000);
});
test('FE01-FE04 labels and filters use domain-specific statuses', () => {
  assert.equal(leaveReviewStatus({ status: 'SUCCESS' }).label, 'Đã xác nhận');
  assert.deepEqual(
    statusesFor(modules.find((m) => m.id === 'payment-confirmations')),
    ['PENDING', 'SUCCESS', 'REJECTED'],
  );
  assert.equal(
    statusesFor(modules.find((m) => m.id === 'leaves')).includes('PRESENT'),
    false,
  );
  assert.equal(
    attendanceMatches({ status: 'EXCUSED' }, 'UNMARKED', true),
    false,
  );
  assert.equal(attendanceMatches({ status: 'ABSENT' }, 'UNMARKED', true), true);
  assert.equal(
    notificationTarget({ resultId: 'result 1' }),
    '/app/exam-results?record=result%201',
  );
});
test('F09 admin account edits and student contact edits keep the same linked identity', async () => {
  const s = await setup(),
    user = s.db().users.find((u) => u.id === 'u-student');
  assert.equal(
    (
      await s.call('/users/' + user.id, 'PATCH', {
        ...user,
        fullName: 'Tên mới từ quản trị',
        email: 'identity@example.test',
        password: '',
      })
    ).status,
    200,
  );
  const person = s.db().students.find((p) => p.id === user.studentId);
  assert.equal(person.fullName, 'Tên mới từ quản trị');
  assert.equal(person.email, 'identity@example.test');
  assert.equal(
    (
      await s.call('/students/' + person.id, 'PATCH', {
        ...person,
        phone: '0901111222',
        email: 'contact@example.test',
      })
    ).status,
    200,
  );
  assert.equal(
    s.db().users.find((u) => u.id === user.id).email,
    'contact@example.test',
  );
  assert.equal(s.db().users.find((u) => u.id === user.id).phone, '0901111222');
  const other = s.db().users.find((u) => u.id === 'u-admin');
  assert.equal(
    (
      await s.call('/students/' + person.id, 'PATCH', {
        ...person,
        email: other.email,
      })
    ).status,
    409,
  );
});
test('F10 fallback tariffs have the same override guard and only Admin may override', async () => {
  const s = await setup(),
    body = {
      studentId: 's-1',
      classId: 'c-1',
      period: '2048-01',
      dueDate: '2048-01-15',
      amount: 1,
      discountId: '',
    };
  assert.equal((await s.call('/invoices', 'POST', body)).status, 400);
  const login = await s.call('/auth/login', 'POST', {
      email: 'vosu@vovinam.test',
      password: MOCK_PASSWORD,
    }),
    fetch = createMockFetch({ storage: s.storage });
  const result = await fetch('/backend/invoices', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + login.data.tokens.accessToken },
    body: JSON.stringify({
      ...body,
      priceOverrideReason: 'Kiểm tra thẩm quyền',
    }),
  });
  assert.equal(result.status, 403);
  const approved = await s.call('/invoices', 'POST', {
    ...body,
    priceOverrideReason: 'Admin phê duyệt điều chỉnh riêng',
  });
  assert.equal(approved.status, 200);
  assert.equal(
    approved.data.priceOverrideReason,
    'Admin phê duyệt điều chỉnh riêng',
  );
});
test('F05 valid JSON with a broken database structure is preserved for recovery', async () => {
  const s = await setup(),
    d = s.db();
  delete d.ranks;
  s.write(d);
  const raw = s.storage.getItem(DB_KEY);
  assert.equal((await s.call('/auth/me')).status, 503);
  assert.equal(s.storage.getItem(DB_KEY), raw);
});
test('read cache avoids storage writes for previews and notices external tab changes', async () => {
  const s = await setup(),
    raw = s.storage.getItem(DB_KEY);
  await s.call('/auth/me');
  await s.call('/attendance-workflow/sessions/' + s.db().schedules[0].id);
  assert.equal(s.storage.getItem(DB_KEY), raw);
  const d = s.db();
  d.users.find((u) => u.id === 'u-admin').fullName = 'Tên từ tab khác';
  s.write(d);
  assert.equal((await s.call('/auth/me')).data.fullName, 'Tên từ tab khác');
});
