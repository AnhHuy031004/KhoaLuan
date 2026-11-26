import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createMockFetch, DB_KEY } from '../mock/api.js';
import { fetchAllPages } from '../src/utils/fetchAllPages.js';
import {
  validateDob,
  validatePhone,
  validateFullName,
  normalizeWhitespace,
} from '../src/utils/validation.js';
import { MOCK_PASSWORD } from '../mock/users.js';

async function setup() {
  const map = new Map();
  const storage = {
    getItem: (k) => map.get(k) || null,
    setItem: (k, v) => map.set(k, v),
    removeItem: (k) => map.delete(k),
  };
  const fetch = createMockFetch({ storage });
  const raw = async (path, method = 'GET', body, token) => {
    const res = await fetch('/backend' + path, {
      method,
      headers: token ? { Authorization: 'Bearer ' + token } : {},
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    return { status: res.status, ...(await res.json()) };
  };
  const login = async (email) => {
    const r = await raw('/auth/login', 'POST', {
      email,
      password: MOCK_PASSWORD,
    });
    assert.equal(r.status, 200, r.message);
    return (p, m, b) => raw(p, m, b, r.data.tokens.accessToken);
  };
  return {
    admin: await login('admin@vovinam.test'),
    master: await login('vosu@vovinam.test'),
    coach: await login('hlv@vovinam.test'),
    student: await login('vosinh@vovinam.test'),
    db: () => JSON.parse(storage.getItem(DB_KEY)),
    write: (db) => storage.setItem(DB_KEY, JSON.stringify(db)),
  };
}

test('v2.2.0 #1: pay-online notifies managers and reject/approve notifies student with reason', async () => {
  const s = await setup();
  const unpaid = (await s.student('/invoices?limit=100')).data.items.find(
    (i) => i.status === 'UNPAID',
  );
  assert(unpaid, 'student should have an unpaid invoice');

  const submitRes = await s.student(`/invoices/${unpaid.id}/pay-online`, 'POST', {
    idempotencyKey: 'test-ck-' + unpaid.id,
    note: 'Chuyển khoản học phí tháng này',
  });
  assert.equal(submitRes.status, 200);
  const reqId = submitRes.data.payment.id;

  const adminNotifs = (await s.admin('/notifications')).data;
  assert(
    adminNotifs.some((n) => n.systemEvent === 'PAYMENT_CONFIRMATION_PENDING'),
    'manager should receive pending payment confirmation notification',
  );

  const rejectRes = await s.master(
    `/payment-confirmations/${reqId}/actions/reject`,
    'POST',
    { reason: 'Chưa thấy giao dịch trên sao kê ngân hàng' },
  );
  assert.equal(rejectRes.status, 200);
  assert.equal(rejectRes.data.status, 'REJECTED');
  assert.match(rejectRes.data.reviewNote, /sao kê/);

  const studentNotifs = (await s.student('/notifications')).data;
  assert(
    studentNotifs.some(
      (n) =>
        n.systemEvent === 'PAYMENT_CONFIRMATION_REJECTED' &&
        n.body.includes('sao kê'),
    ),
    'student should receive rejection notification with reason',
  );
});

test('v2.2.0 #3: revoking instructor cash permission blocks collect-cash with 403', async () => {
  const s = await setup();
  const db = s.db();
  db.permissions.invoices.INSTRUCTOR = 'V';
  s.write(db);

  const coachUnpaid = (await s.coach('/invoices?limit=100')).data.items.find(
    (i) => i.status === 'UNPAID',
  );
  assert(coachUnpaid, 'coach should see an unpaid invoice in their class');

  const res = await s.coach(`/invoices/${coachUnpaid.id}/collect-cash`, 'POST', {});
  assert.equal(res.status, 403);
});

test('v2.2.0 #5: cash collection auto-closes pending bank transfer and enforces idempotency', async () => {
  const s = await setup();
  const unpaid = (await s.student('/invoices?limit=100')).data.items.find(
    (i) => i.status === 'UNPAID',
  );
  const submitRes = await s.student(`/invoices/${unpaid.id}/pay-online`, 'POST', {
    idempotencyKey: 'pending-before-cash-' + unpaid.id,
  });
  assert.equal(submitRes.status, 200);
  const reqId = submitRes.data.payment.id;

  const cashKey = 'cash-idem-' + unpaid.id;
  const cashRes = await s.admin(`/invoices/${unpaid.id}/collect-cash`, 'POST', {
    idempotencyKey: cashKey,
  });
  assert.equal(cashRes.status, 200);
  assert.equal(cashRes.data.status, 'PAID');
  assert.equal(cashRes.data.supersededTransfers, 1);

  const closedReq = s.db()['online-payments'].find((p) => p.id === reqId);
  assert.equal(closedReq.status, 'REJECTED');
  assert.equal(closedReq.supersededByCash, true);

  // Retry with same idempotencyKey returns cleanly without duplicating transactions
  const txBefore = s.db().transactions.filter((t) => t.invoiceId === unpaid.id).length;
  const retryRes = await s.admin(`/invoices/${unpaid.id}/collect-cash`, 'POST', {
    idempotencyKey: cashKey,
  });
  assert.equal(retryRes.status, 200);
  assert.equal(retryRes.data.duplicate, true);
  const txAfter = s.db().transactions.filter((t) => t.invoiceId === unpaid.id).length;
  assert.equal(txAfter, txBefore);
});

test('v2.2.0 #6 & #7: validates DOB/phone/name and generates strictly unique studentCode after delete', async () => {
  assert.notEqual(validateDob('2099-01-01'), '');
  assert.equal(validateDob('2010-05-15'), '');
  assert.notEqual(validatePhone('abc'), '');
  assert.equal(validatePhone('0912 345 678'), '');
  assert.equal(normalizeWhitespace('  Nguyễn   Văn   An  '), 'Nguyễn Văn An');
  assert.equal(validateFullName('Nguyễn Văn An'), '');

  const s = await setup();
  const cls = s.db().classes[0];
  const rank = s.db().ranks[0];

  const badDob = await s.admin('/students', 'POST', {
    fullName: 'Test Future',
    dob: '2099-01-01',
    phone: '0912345678',
    classId: cls.id,
    rankId: rank.id,
    gender: 'MALE', status: 'ACTIVE',
  });
  assert.equal(badDob.status, 400);

  const badPhone = await s.admin('/students', 'POST', {
    fullName: 'Test Phone',
    dob: '2010-01-01',
    phone: 'abc',
    classId: cls.id,
    rankId: rank.id,
    gender: 'MALE', status: 'ACTIVE',
  });
  assert.equal(badPhone.status, 400);

  const a = await s.admin('/students', 'POST', {
    fullName: '  Võ Sinh   A  ',
    dob: '2010-01-01',
    phone: '0912-345-678',
    classId: cls.id,
    rankId: rank.id,
    gender: 'MALE', status: 'ACTIVE',
  });
  assert.equal(a.status, 200, a.message);
  assert.equal(a.data.fullName, 'Võ Sinh A');
  assert.equal(a.data.phone, '0912345678');

  const b = await s.admin('/students', 'POST', {
    fullName: 'Võ Sinh B',
    dob: '2010-02-02',
    phone: '0912345679',
    classId: cls.id,
    rankId: rank.id,
    gender: 'MALE', status: 'ACTIVE',
  });
  assert.equal(b.status, 200, b.message);

  const delA = await s.admin('/students/' + a.data.id, 'DELETE');
  assert.equal(delA.status, 200, delA.message);

  const c = await s.admin('/students', 'POST', {
    fullName: 'Võ Sinh C',
    dob: '2010-03-03',
    phone: '0912345680',
    classId: cls.id,
    rankId: rank.id,
    gender: 'MALE', status: 'ACTIVE',
  });
  assert.equal(c.status, 200, c.message);
  assert.notEqual(c.data.studentCode, b.data.studentCode);
  assert.notEqual(c.data.studentCode, a.data.studentCode);
});

test('v2.2.0 #10: blocks future attendance close for coach and requires reason for manager', async () => {
  const s = await setup();
  const db = s.db();
  const futureLesson = {
    id: 'sch-future-test',
    classId: 'c-1',
    sessionDate: '2099-12-31',
    startTime: '18:00',
    endTime: '19:30',
    location: 'Sân chính',
    status: 'SCHEDULED',
  };
  db.schedules.push(futureLesson);
  s.write(db);

  const coachClose = await s.coach(
    '/attendance-workflow/sessions/sch-future-test/close',
    'POST',
    { confirm: true },
  );
  assert.equal(coachClose.status, 400);

  const adminNoReason = await s.admin(
    '/attendance-workflow/sessions/sch-future-test/close',
    'POST',
    { confirm: true },
  );
  assert.equal(adminNoReason.status, 400);

  const adminWithReason = await s.admin(
    '/attendance-workflow/sessions/sch-future-test/close',
    'POST',
    { confirm: true, earlyCloseReason: 'Hủy buổi do mưa bão, chốt sớm theo thông báo CLB' },
  );
  assert.equal(adminWithReason.status, 200, adminWithReason.message);
  assert.equal(adminWithReason.data.status, 'CLOSED');
});

test('v2.2.0 #11: fetchAllPages retrieves all 1200 records when server caps page limit to 100', async () => {
  const all = Array.from({ length: 1200 }, (_, i) => ({
    id: `inv-${i + 1}`,
    amount: 350000,
  }));
  const mockService = {
    async list({ page = 1 }) {
      const serverCap = 100;
      const start = (page - 1) * serverCap;
      return {
        items: all.slice(start, start + serverCap),
        total: all.length,
      };
    },
  };
  const result = await fetchAllPages(mockService, {}, undefined, {
    pageSize: 500,
  });
  assert.equal(result.items.length, 1200);
  assert.equal(result.total, 1200);
});

test('v2.2.0 #4: OpenAPI contract includes collect-cash and pay-online endpoints', () => {
  const spec = JSON.parse(
    fs.readFileSync(new URL('../contracts/openapi.json', import.meta.url), 'utf8'),
  );
  assert(spec.paths['/invoices/{id}/collect-cash']?.post);
  assert(spec.paths['/invoices/{id}/pay-online']?.post);
});
