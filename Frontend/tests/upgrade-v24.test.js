import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import announcements from '../src/features/announcements/module.js';
import audit from '../src/features/audit/module.js';
import ranks from '../src/features/ranks/module.js';
import leaves from '../src/features/leaves/module.js';
import invoices from '../src/features/invoices/module.js';
import onlinePayments from '../src/features/online-payments/module.js';
import { createMockFetch, DB_KEY } from '../mock/api.js';
import { MOCK_PASSWORD } from '../mock/users.js';

async function setup() {
  const map = new Map();
  const storage = {
    getItem: (k) => map.get(k) || null,
    setItem: (k, v) => map.set(k, v),
  };
  const fetch = createMockFetch({ storage });
  const raw = async (path, method = 'GET', body, token) => {
    const res = await fetch('/backend' + path, {
      method,
      headers: token ? { Authorization: 'Bearer ' + token } : {},
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: res.status, ...(await res.json()) };
  };
  const login = async (email, password = MOCK_PASSWORD) => {
    const r = await raw('/auth/login', 'POST', {
      email: email.includes('@') ? email : email + '@vovinam.test',
      password,
    });
    assert.equal(r.status, 200, r.message);
    return (p, m, b) => raw(p, m, b, r.data.tokens.accessToken);
  };
  return {
    admin: await login('admin'),
    student: await login('vosinh'),
    db: () => JSON.parse(storage.getItem(DB_KEY)),
  };
}

test('v2.4.0: RBAC fixes — Admin can publish announcements, Instructor blocked from audit, Master read-only on ranks, Instructor can create leaves', async () => {
  assert(announcements.permissions.ADMIN.includes('P'));
  assert.equal(audit.permissions.INSTRUCTOR, '');
  assert.equal(ranks.permissions.MASTER, 'V');
  assert(leaves.permissions.INSTRUCTOR.includes('C'));

  const s = await setup();
  const created = await s.admin('/announcements', 'POST', {
    title: 'Thông báo kiểm thử v2.4',
    body: 'Nội dung kiểm thử phát hành bởi Admin',
    audience: 'ALL',
    status: 'DRAFT',
  });
  assert.equal(created.status, 200, created.message);
  if (created.data.status === 'DRAFT') {
    const published = await s.admin(
      '/announcements/' + created.data.id + '/actions/process',
      'POST',
    );
    assert.equal(published.status, 200, published.message);
    assert.equal(published.data.status, 'PUBLISHED');
  } else {
    assert.equal(created.data.status, 'PUBLISHED');
  }
});

test('v2.4.0: UX & UI upgrades — Finance naming, BatchInvoiceModal, theme-aware header-scope.css, clean packaging', () => {
  assert.equal(invoices.navTitle, 'Thu phí & Công nợ');
  assert.equal(onlinePayments.navTitle, 'Biên lai đã thu');

  const invPage = fs.readFileSync(
    new URL('../src/features/invoices/pages/InvoicesPage.jsx', import.meta.url),
    'utf8',
  );
  assert(invPage.includes('BatchInvoiceModal'));
  assert(invPage.includes('Tạo kỳ thu theo lớp'));
  assert(invPage.includes('pending-transfer-pill'));

  const headerScopeCss = fs.readFileSync(
    new URL('../src/components/layout/header-scope.css', import.meta.url),
    'utf8',
  );
  assert(!headerScopeCss.includes('rgba(16, 38, 62'), 'header-scope.css must not hardcode dark rgba');
  assert(!headerScopeCss.includes('#d7e7f6'), 'header-scope.css must use theme CSS variables');

  const viteCfg = fs.readFileSync(
    new URL('../vite.config.js', import.meta.url),
    'utf8',
  );
  assert(viteCfg.includes('emptyOutDir: true'));
  assert.equal(fs.existsSync(new URL('../Frontend', import.meta.url)), false);
  assert.equal(fs.existsSync(new URL('../src/styles.css', import.meta.url)), false);
});
