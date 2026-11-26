import { MOCK_PASSWORD } from '../mock/users.js';
import {
  validateContract,
  validateSchema,
} from './fixtures/contractValidator.js';
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createApiClient, ApiError } from '../src/services/httpClient.js';
import { createProvider } from '../src/services/providers/apiProvider.js';
import { toWriteDto } from '../src/services/writeDto.js';
import { modules } from '../src/routes/routeConfig.js';
import { createMockServer } from '../tools/mock-server.mjs';
let server, base;
const calls = [];
const storage = () => {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
};
before(async () => {
  server = createMockServer({ record: (value) => calls.push(value) });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = 'http://127.0.0.1:' + server.address().port + '/api/v1';
});
after(async () => {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
});
async function login(email) {
  const client = createProvider(createApiClient, {
    baseUrl: base,
    storage: storage(),
  });
  client.save(
    await client.request('/auth/login', {
      public: true,
      method: 'POST',
      body: { email: email + '@vovinam.test', password: MOCK_PASSWORD },
    }),
  );
  return client;
}
test('HTTP provider preserves the 31-module contract and role matrix instead of rewriting the UI', async () => {
  const original = JSON.stringify(
    modules.map((m) => ({
      id: m.id,
      permissions: m.permissions,
      fields: m.fields,
    })),
  );
  for (const email of ['admin', 'vosu', 'hlv', 'vosinh']) {
    const client = await login(email),
      role = client.read().user.role,
      permissions = await client.request('/permissions');
    for (const m of modules) {
      const rights = permissions.matrix[m.id]?.[role] || '';
      if (
        !rights.includes('V') &&
        !(m.id === 'online-payments' && rights.includes('P'))
      )
        continue;
      const result = await client.request(m.endpoint, {
        query: { page: 1, limit: 2 },
      });
      validateContract(m.endpoint, 'GET', {
        code: 200,
        message: 'OK',
        data: result,
      });
      assert(Array.isArray(result.items), email + ' ' + m.id);
      assert(Number.isInteger(result.total));
    }
  }
  assert.equal(
    JSON.stringify(
      modules.map((m) => ({
        id: m.id,
        permissions: m.permissions,
        fields: m.fields,
      })),
    ),
    original,
  );
  assert(calls.some((c) => c.path.startsWith('/api/v1/tuition-relief')));
  assert(calls.some((c) => c.path.startsWith('/api/v1/masters')));
});
test('actual HTTP staff roster, scoped denial, contact update and invoice tariff use the same endpoints', async () => {
  const admin = await login('admin'),
    learner = await login('vosinh');
  const dates = await admin.request('/attendance-workflow/dates'),
    sessions = await admin.request('/attendance-workflow/sessions', {
      query: { date: dates.dates[0] },
    });
  const roster = await admin.request(
    '/attendance-workflow/sessions/' + sessions.items[0].id,
  );
  assert(roster.rows.length > 0);
  await assert.rejects(
    learner.request('/attendance-workflow/dates'),
    (error) => error.status === 403,
  );
  const profile = await learner.request('/auth/profile', {
    method: 'PATCH',
    body: { fullName: 'Tên đồng bộ qua HTTP', phone: '0901234567' },
  });
  assert.equal(profile.phone, '0901234567');
  assert.equal(
    (await learner.request('/students')).items[0].fullName,
    profile.fullName,
  );
  const invoice = await admin.request('/invoices', {
    method: 'POST',
    body: {
      studentId: 's-1',
      classId: 'c-1',
      period: '2049-01',
      dueDate: '2049-01-15',
      discountId: '',
    },
  });
  assert.equal(invoice.baseAmount, 350000);
});
test('invalid list envelopes and network failures stay errors and never fall back to fixtures', async () => {
  const broken = createProvider(createApiClient, {
    baseUrl: 'https://unavailable.test',
    storage: storage(),
    fetchImpl: async () =>
      new Response(JSON.stringify({ code: 200, message: 'OK', data: [] })),
  });
  await assert.rejects(
    broken.request('/students'),
    (error) => error.status === 502,
  );
  const offline = createProvider(createApiClient, {
    baseUrl: 'https://unavailable.test',
    storage: storage(),
    fetchImpl: async () => {
      throw Error('network');
    },
  });
  await assert.rejects(
    offline.request('/students'),
    (error) => error.status === 0 && !error.message.includes('CORS'),
  );
  const logical = createApiClient({
    baseUrl: 'https://unavailable.test',
    storage: storage(),
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          code: 422,
          message: 'Sai dữ liệu',
          data: null,
          errors: { fullName: 'Nhập họ tên' },
        }),
      ),
  });
  await assert.rejects(
    logical.request('/students', { method: 'POST' }),
    (error) =>
      error instanceof ApiError &&
      error.status === 422 &&
      error.detail.errors.fullName === 'Nhập họ tên',
  );
});
test('form DTOs send typed business fields and omit blank update passwords and presentation data', () => {
  const invoice = modules.find((m) => m.id === 'invoices'),
    user = modules.find((m) => m.id === 'users');
  assert.deepEqual(
    toWriteDto(invoice, {
      studentId: 's1',
      classId: 'c1',
      period: '2049-02',
      amount: '490000',
      dueDate: '2049-02-15',
      discountId: '',
      priceOverrideReason: ' Tăng theo quyết định ',
      provinceId: 'internal',
      status: 'PAID',
    }),
    {
      studentId: 's1',
      classId: 'c1',
      period: '2049-02',
      amount: 490000,
      dueDate: '2049-02-15',
      discountId: '',
      priceOverrideReason: 'Tăng theo quyết định',
    },
  );
  assert.equal(
    Object.hasOwn(
      toWriteDto(user, { fullName: 'A', password: '' }, { update: true }),
      'password',
    ),
    false,
  );
  assert.throws(
    () => toWriteDto(invoice, { amount: 'invalid' }),
    /không hợp lệ/,
  );
});
test('OpenAPI is current, covers every module and all schema references resolve', async () => {
  execFileSync(process.execPath, ['scripts/generate-handoff.mjs', '--check']);
  const contract = JSON.parse(await readFile('contracts/openapi.json', 'utf8'));
  assert.equal(contract.openapi, '3.1.0');
  for (const m of modules) assert(contract.paths[m.endpoint]?.get, m.endpoint);
  for (const path of [
    '/organization/navigation',
    '/permissions',
    '/attendance-workflow/sessions/{id}/correct',
    '/auth/profile',
    '/exports/system',
    '/promotions/bulk-review',
  ])
    assert(contract.paths[path]);
  const ids = new Set();
  for (const operations of Object.values(contract.paths))
    for (const op of Object.values(operations)) {
      assert(!ids.has(op.operationId));
      ids.add(op.operationId);
    }
  function walk(value) {
    if (!value || typeof value !== 'object') return;
    if (value.$ref) {
      const key = value.$ref.split('/').at(-1);
      assert(contract.components.schemas[key], value.$ref);
    }
    for (const child of Object.values(value)) walk(child);
  }
  walk(contract);
});
test('production build refuses fixture data unless the fixture build mode is explicitly selected', async () => {
  const config = (await import('../vite.config.js')).default,
    previous = process.env.VITE_USE_MOCK;
  process.env.VITE_USE_MOCK = 'true';
  try {
    assert.throws(
      () => config({ mode: 'production', command: 'build' }),
      /requires HTTP/,
    );
    assert.doesNotThrow(() => config({ mode: 'fixtures', command: 'build' }));
  } finally {
    if (previous === undefined) delete process.env.VITE_USE_MOCK;
    else process.env.VITE_USE_MOCK = previous;
  }
});
test('all delivered response examples and conditional form DTOs validate against the canonical JSON schema', async () => {
  const { examples } = JSON.parse(
    await readFile('contracts/example-responses.json', 'utf8'),
  );
  for (const [name, value] of Object.entries(examples)) {
    const match = name.match(/^(GET|POST) (.+)$/);
    if (match) validateContract(match[2].split('?')[0], match[1], value.body);
    else validateSchema('ApiError', value.body);
  }
  const users = modules.find((m) => m.id === 'users'),
    classes = modules.find((m) => m.id === 'classes');
  const userDto = toWriteDto(
    users,
    {
      fullName: 'Tên chỉnh sửa',
      email: 'x@example.com',
      role: 'STUDENT',
      masterLevel: '',
      wardId: '',
      clubId: '',
      password: '',
      status: 'ACTIVE',
    },
    { update: true },
  );
  assert(!Object.hasOwn(userDto, 'masterLevel'));
  assert(!Object.hasOwn(userDto, 'wardId'));
  validateSchema('UsersPatch', userDto);
  const clubDto = toWriteDto(classes, {
    clubId: 'club-1',
    name: 'Lớp cấp CLB',
    instructorId: 'u-coach',
    location: 'Sàn A',
    capacity: 30,
    status: 'ACTIVE',
  });
  validateSchema('ClassesCreate', clubDto);
  assert(!Object.hasOwn(clubDto, 'tuition'));
  validateSchema('ApiError', {
    code: 422,
    message: 'Dữ liệu sai',
    data: null,
    errors: [{ field: 'fullName', message: 'Nhập họ tên' }],
  });
});
test('detail endpoints and completed-payment notifications open the owned record rather than a list or forbidden screen', async () => {
  const admin = await login('admin'),
    learner = await login('vosinh');
  const student = await admin.request('/students/s-1');
  assert.equal(student.id, 's-1');
  assert.equal(student.items, undefined);
  validateContract('/students/{id}', 'GET', {
    code: 200,
    message: 'OK',
    data: student,
  });
  const payment = await learner.request('/online-payments', {
    method: 'POST',
    body: { invoiceId: 'inv-0-0' },
  });
  await learner.request('/online-payments/' + payment.id + '/actions/process', {
    method: 'POST',
  });
  await admin.request(
    '/payment-confirmations/' + payment.id + '/actions/approve',
    { method: 'POST' },
  );
  const completed = await learner.request('/online-payments/' + payment.id);
  assert.equal(completed.id, payment.id);
  assert.equal(completed.status, 'SUCCESS');
  await assert.rejects(
    learner.request('/online-payments/payment-pending'),
    (error) => error.status === 404,
  );
  const { notificationTarget } = await import('../src/config/uiPolicy.js');
  const notice = {
    workflowModule: 'payment-confirmations',
    workflowRecordId: payment.id,
  };
  assert.equal(
    notificationTarget(notice, { role: 'STUDENT' }),
    '/app/online-payments?record=' + payment.id,
  );
  assert.equal(
    notificationTarget(
      { ...notice, workflowModule: 'online-payments' },
      { role: 'INSTRUCTOR' },
    ),
    '/app/payment-confirmations?record=' + payment.id,
  );
});
