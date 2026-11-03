import test from 'node:test';
import assert from 'node:assert/strict';
import { createMockFetch, DB_KEY } from '../mock/api.js';
import { modules } from '../src/routes/routeConfig.js';
import { accounts, MOCK_PASSWORD } from '../mock/users.js';
import { can, canOpen } from '../src/utils/permissions.js';
const memory = () => {
  const map = new Map();
  return {
    getItem: (k) => map.get(k) || null,
    setItem: (k, v) => map.set(k, v),
    removeItem: (k) => map.delete(k),
  };
};
async function setup(role = 'ADMIN', storage = memory()) {
  const fetch = createMockFetch({ storage });
  const raw = async (path, method = 'GET', body, token) => {
    const response = await fetch('/backend' + path, {
      method,
      headers: token ? { Authorization: 'Bearer ' + token } : {},
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: response.status, ...(await response.json()) };
  };
  const login = await raw('/auth/login', 'POST', {
    email: accounts.find((a) => a.role === role).email,
    password: MOCK_PASSWORD,
  });
  assert.equal(login.status, 200, login.message);
  const token = login.data.tokens.accessToken;
  return { raw, storage, token, call: (p, m, b) => raw(p, m, b, token) };
}
test('all four roles can read exactly their permitted modules, with nonempty seeded resources', async () => {
  for (const account of accounts) {
    const s = await setup(account.role);
    for (const m of modules) {
      const res = await s.call(m.endpoint);
      if (
        can(m, account.role, 'V') ||
        (m.id === 'online-payments' && account.role === 'STUDENT')
      ) {
        assert.equal(
          res.status,
          200,
          account.role + ' ' + m.id + ' ' + res.message,
        );
        assert(Array.isArray(res.data.items));
        if (
          ![
            'online-payments',
            'payment-confirmations',
            'promotion-report',
          ].includes(m.id)
        )
          assert(res.data.total > 0, account.role + ' ' + m.id + ' empty');
      } else assert.equal(res.status, 403, account.role + ' ' + m.id);
    }
  }
});
test('student ownership, instructor scope and exact matrix actions are enforced server-side', async () => {
  const s = await setup('STUDENT');
  assert.equal((await s.call('/students')).data.total, 1);
  assert.equal(
    (await s.call('/students/s-2', 'PATCH', { phone: '123' })).status,
    404,
  );
  assert.equal(
    (
      await s.call('/students/s-1', 'PATCH', {
        phone: '0912345678',
        role: 'ADMIN',
        status: 'PAUSED',
      })
    ).status,
    200,
  );
  assert.equal((await s.call('/students')).data.items[0].status, 'ACTIVE');
  assert.equal((await s.call('/users', 'POST', {})).status, 403);
  assert.equal((await s.call('/leave-requests', 'GET')).status, 404);
  const c = await setup('INSTRUCTOR');
  assert.equal((await c.call('/students')).data.total, 8);
  assert.equal((await c.call('/students', 'POST', {})).status, 403);
  assert.equal((await c.call('/invoices')).status, 403);
  assert.equal(
    (
      await c.call('/promotions', 'POST', {
        classId: 'c-3',
        studentId: 's-3',
        rankId: 'r-2',
        reason: 'Mẫu',
      })
    ).status,
    403,
  );
});
test('CRUD, searching, pagination and persistence preserve relations and redact credentials', async () => {
  const s = await setup();
  const row = await s.call('/announcements', 'POST', {title:'Kiểm thử',body:'Nội dung',audience:'ALL',classId:''});
  assert.equal(row.status,200,row.message);
  await s.call('/announcements/'+row.data.id,'PATCH',{title:'Kiểm thử đã sửa',body:'Nội dung',audience:'ALL',classId:''});
  const again=await setup('ADMIN',s.storage);
  assert.equal((await again.call('/announcements?search=đã%20sửa&limit=1')).data.total,1);
  assert.equal((await again.call('/users')).data.items[0].password,undefined);
  assert.equal((await again.call('/announcements/'+row.data.id,'DELETE')).status,200);
  assert.equal((await again.call('/students/s-1', 'DELETE')).status, 409);
  assert(s.storage.getItem(DB_KEY));
});
test('leave student submission/history flow and instructor approval are stateful and cannot be repeated', async () => {
  const storage = memory(),
    s = await setup('STUDENT', storage);
  const row = await s.call('/leaves', 'POST', {
    studentId: 's-1',
    classId: 'c-1',
    sessionDate: '2030-01-01',
    reason: 'Bận học',
  });
  assert.equal(row.status, 200, row.message);
  const ownLeaves = await s.call('/leaves');
  assert.equal(ownLeaves.status, 200);
  assert(ownLeaves.data.items.every(r => r.studentId === 's-1')); 
  const coach = await setup('INSTRUCTOR', storage);
  assert.equal(
    (await coach.call('/leaves/' + row.data.id + '/actions/approve', 'POST'))
      .data.status,
    'APPROVED',
  );
  assert.equal(
    (await coach.call('/leaves/' + row.data.id + '/actions/approve', 'POST'))
      .status,
    409,
  );
});
test('admin approval of exam results updates belt history and rejects double approval', async () => {
  const s = await setup('ADMIN');
  const result = await s.call(
    '/exam-results/result-0/actions/approve',
    'POST',
    { outcome: 'PASS' },
  );
  assert.equal(result.status, 200, result.message);
  assert.equal(result.data.status, 'PASS');
  assert.equal(
    (await s.call('/students?search=Nguyễn%20Minh%20An')).data.items[0].rankId,
    'r-2',
  );
  assert.equal(
    (await s.call('/belt-history?search=Hoàn%20thành')).data.total,
    25,
  );
  assert.equal(
    (
      await s.call('/exam-results/result-0/actions/approve', 'POST', {
        outcome: 'PASS',
      })
    ).status,
    409,
  );
  const admin = await setup();
  assert.equal(
    (
      await admin.call('/exam-results/result-0/actions/approve', 'POST', {
        outcome: 'PASS',
      })
    ).status,
    200,
  );
});
test('student payment -> request -> master confirmation updates invoice and transaction once', async () => {
  const storage = memory(),
    s = await setup('STUDENT', storage);
  const row = await s.call('/online-payments', 'POST', {
    invoiceId: 'inv-0-0',
  });
  assert.equal(row.status, 200, row.message);
  assert.equal(row.data.status, 'DRAFT');
  assert.equal(
    (
      await s.call(
        '/online-payments/' + row.data.id + '/actions/process',
        'POST',
      )
    ).data.status,
    'PENDING',
  );
  const master = await setup('MASTER', storage);
  assert.equal(
    (
      await master.call(
        '/payment-confirmations/' + row.data.id + '/actions/approve',
        'POST',
      )
    ).data.status,
    'SUCCESS',
  );
  assert.equal((await s.call('/invoices?status=UNPAID')).data.total, 0);
  assert.equal(
    (
      await master.call(
        '/payment-confirmations/' + row.data.id + '/actions/approve',
        'POST',
      )
    ).status,
    409,
  );
  assert(
    (await s.call('/transactions')).data.items.some(
      (t) => t.invoiceId === 'inv-0-0',
    ),
  );
});
test('reports respond to month and class filters and announcements publishing has state', async () => {
  const s = await setup('INSTRUCTOR');
  const report = await s.call('/attendance-report?month=2000-01');
  assert.equal(report.status, 200);
  assert(report.data.items.every((row) => row.total === 0));
  const create = await s.call('/announcements', 'POST', {
    title: 'Thông báo kiểm thử',
    body: 'Nội dung kiểm thử',
    audience: 'CLASS',
    classId: 'c-1',
  });
  assert.equal(create.status, 200, create.message);
  assert.equal(create.data.status, 'DRAFT');
  assert.equal(
    (
      await s.call(
        '/announcements/' + create.data.id + '/actions/process',
        'POST',
      )
    ).data.status,
    'PUBLISHED',
  );
  assert.equal(
    (
      await s.call(
        '/announcements/' + create.data.id + '/actions/process',
        'POST',
      )
    ).status,
    409,
  );
});
test('wrong credentials, expired reset and logout are enforced', async () => {
  const s = await setup();
  assert.equal(
    (
      await s.raw('/auth/login', 'POST', {
        email: accounts[0].email,
        password: 'wrong',
      })
    ).status,
    401,
  );
  const reset = await s.raw('/auth/forgot-password', 'POST', {
    email: accounts[3].email,
  });
  assert(reset.data.mockToken);
  assert.equal(
    (
      await s.raw('/auth/reset-password', 'POST', {
        token: reset.data.mockToken,
        password: 'NewPass123!',
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await s.raw('/auth/reset-password', 'POST', {
        token: reset.data.mockToken,
        password: 'NewPass123!',
      })
    ).status,
    400,
  );
  await s.call('/auth/logout', 'POST');
  assert.equal((await s.raw('/auth/me', 'GET', null, s.token)).status, 401);
});
test('admin can create, assign, edit and delete an unused custom role; protected admin rights cannot be removed', async () => {
  const storage = memory(),
    s = await setup('ADMIN', storage);
  const role = await s.call('/roles', 'POST', {
    name: 'Trợ lý đào tạo',
    description: 'Hỗ trợ theo phân quyền',
  });
  assert.equal(role.status, 200, role.message);
  assert(role.data.code);
  const matrix = await s.call('/permissions');
  matrix.data.matrix.students[role.data.code] = 'V';
  assert.equal(
    (await s.call('/permissions', 'PATCH', { matrix: matrix.data.matrix }))
      .status,
    200,
  );
  const user = await s.call('/users', 'POST', {
    fullName: 'Trợ lý mẫu',
    email: 'assistant@example.test',
    password: MOCK_PASSWORD,
    role: role.data.code,
    status: 'ACTIVE',
  });
  assert.equal(user.status, 200, user.message);
  const auth = await s.raw('/auth/login', 'POST', {
    email: 'assistant@example.test',
    password: MOCK_PASSWORD,
  });
  assert.equal(
    (await s.raw('/students', 'GET', null, auth.data.tokens.accessToken))
      .status,
    200,
  );
  assert.equal(
    (await s.raw('/users', 'GET', null, auth.data.tokens.accessToken)).status,
    403,
  );
  assert.equal((await s.call('/roles/' + role.data.id, 'DELETE')).status, 409);
  await s.call('/users/' + user.data.id, 'DELETE');
  assert.equal((await s.call('/roles/' + role.data.id, 'DELETE')).status, 200);
  const invalid = await s.call('/permissions');
  invalid.data.matrix.roles.ADMIN = '';
  assert.equal(
    (await s.call('/permissions', 'PATCH', { matrix: invalid.data.matrix }))
      .status,
    400,
  );
  const master = await setup('MASTER', storage);
  assert.equal(
    (await master.call('/permissions', 'PATCH', { matrix: {} })).status,
    403,
  );
});
test('new instructor accounts share staff identity and see only their assigned class', async () => {
  const storage = memory(),
    s = await setup('ADMIN', storage);
  const user = await s.call('/users', 'POST', {
    fullName: 'HLV mới',
    email: 'newcoach@example.test',
    password: MOCK_PASSWORD,
    role: 'INSTRUCTOR',
    status: 'ACTIVE',
  });
  assert.equal(user.status, 200, user.message);
  const lookup = await s.call('/lookups');
  assert(lookup.data.instructors.some((i) => i.id === user.data.id));
  const cls = await s.call('/classes', 'POST', {
    name: 'Lớp kiểm thử',
    clubId: 'club-1',
    instructorId: user.data.id,
    location: 'Sân C',
    capacity: 25,
    tuition: 450000,
    status: 'ACTIVE',
  });
  assert.equal(cls.status, 200, cls.message);
  const auth = await s.raw('/auth/login', 'POST', {
    email: 'newcoach@example.test',
    password: MOCK_PASSWORD,
  });
  const classes = await s.raw(
    '/classes',
    'GET',
    null,
    auth.data.tokens.accessToken,
  );
  assert.equal(classes.data.total, 1);
  assert.equal(classes.data.items[0].id, cls.data.id);
});
