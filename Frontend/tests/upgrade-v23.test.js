import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createMockFetch } from '../mock/api.js';
import { MOCK_PASSWORD } from '../mock/users.js';
import { generateRecurringSessions } from '../src/utils/recurringSchedule.js';

test('v2.3.0: generateRecurringSessions builds exact weekly slots and flags duplicates', () => {
  // 2026-11-30 is Monday (1). Selecting Mon/Wed/Fri (1,3,5) for 2 weeks = 6 sessions.
  const res = generateRecurringSessions({
    classId: 'c-1',
    startDate: '2026-11-30',
    weekdays: [1, 3, 5],
    weeks: 2,
    startTime: '18:00',
    endTime: '19:30',
    location: 'Sân chính CLB',
    existingSessions: [
      { classId: 'c-1', sessionDate: '2026-12-02', startTime: '18:00' },
    ],
  });
  assert.equal(res.error, '');
  assert.equal(res.sessions.length, 6);
  assert.deepEqual(
    res.sessions.map((s) => s.sessionDate),
    [
      '2026-11-30',
      '2026-12-02',
      '2026-12-04',
      '2026-12-07',
      '2026-12-09',
      '2026-12-11',
    ],
  );
  assert.equal(res.sessions.filter((s) => s.duplicate).length, 1);
  assert.equal(res.sessions.find((s) => s.sessionDate === '2026-12-02').duplicate, true);
});

test('v2.3.0: generateRecurringSessions rejects invalid time ranges, empty weekdays, and impossible dates', () => {
  assert.notEqual(
    generateRecurringSessions({
      classId: 'c-1',
      startDate: '2026-11-30',
      weekdays: [],
      weeks: 2,
      startTime: '18:00',
      endTime: '19:30',
      location: 'Sân A',
    }).error,
    '',
  );
  assert.notEqual(
    generateRecurringSessions({
      classId: 'c-1',
      startDate: '2026-11-30',
      weekdays: [1],
      weeks: 2,
      startTime: '19:30',
      endTime: '18:00',
      location: 'Sân A',
    }).error,
    '',
  );
  assert.notEqual(
    generateRecurringSessions({
      classId: 'c-1',
      startDate: '2026-02-30',
      weekdays: [1],
      weeks: 2,
      startTime: '18:00',
      endTime: '19:30',
      location: 'Sân A',
    }).error,
    '',
  );
});

test('v2.3.0: recurring schedule batch creation persists cleanly through mock API', async () => {
  const map = new Map();
  const storage = {
    getItem: (k) => map.get(k) || null,
    setItem: (k, v) => map.set(k, v),
    removeItem: (k) => map.delete(k),
  };
  const fetch = createMockFetch({ storage });
  const raw = async (p, method = 'GET', body, token) => {
    const r = await fetch('/backend' + p, {
      method,
      headers: token ? { Authorization: 'Bearer ' + token } : {},
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    return { status: r.status, ...(await r.json()) };
  };
  const login = await raw('/auth/login', 'POST', {
    email: 'admin@vovinam.test',
    password: MOCK_PASSWORD,
  });
  assert.equal(login.status, 200);
  const token = login.data.tokens.accessToken;

  const { sessions } = generateRecurringSessions({
    classId: 'c-1',
    startDate: '2027-01-04',
    weekdays: [1, 3],
    weeks: 2,
    startTime: '18:00',
    endTime: '19:30',
    location: 'Nhà thi đấu trung tâm',
  });
  assert.equal(sessions.length, 4);

  for (const s of sessions) {
    const { duplicate, ...payload } = s;
    const created = await raw('/schedules', 'POST', payload, token);
    assert.equal(created.status, 200, created.message);
  }

  const list = await raw('/schedules?classId=c-1&limit=500', 'GET', undefined, token);
  assert.equal(list.status, 200);
  for (const s of sessions) {
    assert(
      list.data.items.some(
        (row) => row.sessionDate === s.sessionDate && row.location === 'Nhà thi đấu trung tâm',
      ),
      `Expected schedule on ${s.sessionDate}`,
    );
  }
});

test('v2.3.0: modular architecture cleanup and UI/UX print & rejection hooks are wired', () => {
  for (const removed of [
    '../src/styles.css',
    '../src/SpecialPages.jsx',
    '../src/Dashboard.jsx',
    '../src/components.jsx',
  ]) {
    assert.equal(
      fs.existsSync(new URL(removed, import.meta.url)),
      false,
      `${removed} should be removed`,
    );
  }

  const staffOp = fs.readFileSync(
    new URL('../src/features/online-payments/pages/OnlinePaymentsPage.jsx', import.meta.url),
    'utf8',
  );
  assert(staffOp.includes('StudentOnlineTuitionPortal'));
  assert(staffOp.includes('setPrintRow(inv)'));
  assert(staffOp.includes('<ReceiptPrintModal'));

  const studentPortal = fs.readFileSync(
    new URL('../src/features/online-payments/components/StudentOnlineTuitionPortal.jsx', import.meta.url),
    'utf8',
  );
  assert(studentPortal.includes('reviewNote'));
  assert(studentPortal.includes('reviewerHint'));
  assert(studentPortal.includes('<ReceiptPrintModal'));

  const attendancePage = fs.readFileSync(
    new URL('../src/features/attendance/pages/SessionAttendancePage.jsx', import.meta.url),
    'utf8',
  );
  assert(attendancePage.includes('<AttendanceActionModal'));
  assert(attendancePage.includes('Đơn nghỉ'));
});

test('v2.3.2: old localStorage with hierarchyVersion=1 and Vovinam123! auto-migrates to 123 on login', async () => {
  const { DB_KEY } = await import('../src/config/demoStorage.js');
  const map = new Map();
  const storage = {
    getItem: (k) => map.get(k) || null,
    setItem: (k, v) => map.set(k, v),
    removeItem: (k) => map.delete(k),
  };
  const fetch1 = createMockFetch({ storage });
  // Trigger initial seed
  await fetch1('/backend/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@vovinam.test', password: MOCK_PASSWORD }),
  });
  // Simulate legacy browser localStorage: hierarchyVersion already set, password still old Vovinam123!, no mockPasswordVersion
  const legacyDb = JSON.parse(storage.getItem(DB_KEY));
  legacyDb.hierarchyVersion = 1;
  delete legacyDb.mockPasswordVersion;
  for (const u of legacyDb.users) u.password = 'Vovinam123!';
  storage.setItem(DB_KEY, JSON.stringify(legacyDb));

  // New browser session loads legacy localStorage and logs in with '123'
  const fetch2 = createMockFetch({ storage });
  const res = await fetch2('/backend/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@vovinam.test', password: '123' }),
  });
  assert.equal(res.status, 200);
});
