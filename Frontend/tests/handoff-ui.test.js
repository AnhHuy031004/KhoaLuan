import { MOCK_PASSWORD } from '../mock/users.js';
import test, { before, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';
import React from 'react';
import { createMockServer } from '../tools/mock-server.mjs';
let http, vite, dom, api, App, render, screen, fireEvent, cleanup, waitFor;
const calls = [];
before(async () => {
  http = createMockServer({ record: (request) => calls.push(request) });
  await new Promise((resolve) => http.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + http.address().port + '/api/v1';
  dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://localhost/app/dashboard',
  });
  for (const key of [
    'window',
    'document',
    'navigator',
    'localStorage',
    'sessionStorage',
    'HTMLElement',
    'HTMLDialogElement',
    'Event',
    'CustomEvent',
  ])
    Object.defineProperty(globalThis, key, {
      configurable: true,
      value: dom.window[key],
    });
  window.matchMedia = () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  });
  window.confirm = () => true;
  HTMLElement.prototype.scrollTo = () => {};
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
    this.querySelector('input,select,button')?.focus();
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
  };
  ({ render, screen, fireEvent, cleanup, waitFor } =
    await import('@testing-library/react'));
  process.env.VITE_API_BASE_URL = base;
  vite = await createServer({
    mode: 'api',
    server: { middlewareMode: true },
    appType: 'custom',
  });
  delete process.env.VITE_API_BASE_URL;
  ({ api } = await vite.ssrLoadModule('/src/services/api.js'));
  ({ default: App } = await vite.ssrLoadModule('/src/App.jsx'));
  const config = await vite.ssrLoadModule('/src/services/api.js');
  assert.equal(config.IS_MOCK, false);
});
afterEach(() => cleanup());
after(async () => {
  await vite?.close();
  http?.closeAllConnections();
  await new Promise((resolve) => http.close(resolve));
  dom?.window.close();
});
async function signIn(email) {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  api.save(
    await api.request('/auth/login', {
      method: 'POST',
      public: true,
      body: { email: email + '@vovinam.test', password: MOCK_PASSWORD },
    }),
  );
}
async function page(route) {
  cleanup();
  window.history.replaceState({}, '', route);
  render(React.createElement(App));
}
function assertProduct() {
  assert.doesNotMatch(
    document.body.textContent,
    /BẢN DEMO|Bản demo cục bộ|Chế độ kiểm thử|mô phỏng|Không nhập dữ liệu cá nhân thật/,
  );
  assert.equal(document.querySelector('a[href="/auth/recovery"]'), null);
  assert.equal(localStorage.getItem('vovinam-mock-offline-v4'), null);
}
test('all 31 admin modules render through actual HTTP without replacing screens or showing developer banners', async () => {
  await signIn('admin');
  const { modules } = await vite.ssrLoadModule('/src/routes/routeConfig.js');
  for (const m of modules) {
    await page('/app/' + m.id);
    await screen.findByRole('heading', { level: 1 }, { timeout: 10000 });
    await waitFor(
      () => assert.equal(document.querySelector('.loading'), null),
      { timeout: 10000 },
    );
    assert.notEqual(
      document.querySelector('h1')?.textContent,
      'Không thể hiển thị trang',
      m.id,
    );
    assert.equal(
      screen.queryByRole('alert'),
      null,
      m.id + ' ' + screen.queryByRole('alert')?.textContent,
    );
    assertProduct();
  }
  assert(calls.some((c) => c.path.startsWith('/api/v1/attendance-workflow/')));
  assert(calls.some((c) => c.path.startsWith('/api/v1/report-charts/')));
});
test('learner payment/leave flows and manager organization remain available in HTTP mode', async () => {
  await signIn('vosinh');
  await page('/app/leaves');
  await screen.findByRole(
    'heading',
    { level: 1, name: 'Đơn xin nghỉ' },
    { timeout: 10000 },
  );
  assertProduct();
  fireEvent.click(screen.getByRole('button', { name: 'Gửi đơn xin nghỉ' }));
  await screen.findByRole('dialog');
  assert.equal(screen.getByLabelText(/Võ sinh/).disabled, true);
  await page('/app/online-payments');
  await screen.findByRole(
    'heading',
    { level: 1, name: 'Thanh toán online' },
    { timeout: 10000 },
  );
  assertProduct();
  await signIn('vosu');
  await page('/app/management');
  await screen.findByRole('heading', { level: 1 }, { timeout: 10000 });
  await waitFor(() => assert.equal(document.querySelector('.loading'), null));
  assert.equal(screen.queryByRole('alert'), null);
  assertProduct();
});
test('login and forgot-password are product screens and never expose fixture reset tokens', async () => {
  cleanup();
  api.clear();
  sessionStorage.clear();
  await page('/auth/login');
  await screen.findByRole(
    'heading',
    { name: 'Đăng nhập hệ thống' },
    { timeout: 10000 },
  );
  assertProduct();
  await page('/auth/forgot');
  await screen.findByRole('heading', { name: 'Quên mật khẩu?' });
  fireEvent.change(screen.getByLabelText('Địa chỉ email'), {
    target: { value: 'admin@vovinam.test' },
  });
  fireEvent.submit(document.querySelector('form'));
  await screen.findByText(/Nếu email đã được đăng ký/);
  assertProduct();
  assert.equal(screen.queryByLabelText('Mật khẩu mới'), null);
  await page('/auth/reset');
  await screen.findByRole('heading', { name: 'Liên kết không hợp lệ' });
  assert(screen.getByRole('link', { name: 'Gửi yêu cầu mới' }));
});
test('server validation errors focus the associated field and keep the user draft', async () => {
  const { MemoryRouter } = await import('react-router-dom'),
    { default: Auth } = await vite.ssrLoadModule(
      '/src/contexts/AuthContext.jsx',
    ),
    { ToastProvider } = await vite.ssrLoadModule(
      '/src/contexts/ToastContext.jsx',
    ),
    { default: Form } = await vite.ssrLoadModule(
      '/src/components/common/RecordForm.jsx',
    );
  const config = {
    id: 'sample',
    title: 'Hồ sơ',
    fields: [
      { key: 'fullName', label: 'Họ tên', type: 'text', required: true },
    ],
  };
  render(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(
        Auth.Provider,
        { value: { user: { role: 'ADMIN' } } },
        React.createElement(
          ToastProvider,
          null,
          React.createElement(Form, {
            config,
            lookups: {},
            service: {
              create: async () => {
                throw Object.assign(Error('Không lưu được'), {
                  status: 422,
                  detail: { errors: { fullName: 'Tên đã tồn tại' } },
                });
              },
            },
            onClose() {},
            onSaved() {},
          }),
        ),
      ),
    ),
  );
  const input = screen.getByLabelText(/Họ tên/);
  fireEvent.change(input, { target: { value: 'Nội dung đã nhập' } });
  fireEvent.submit(document.querySelector('form'));
  await screen.findByText('Tên đã tồn tại');
  assert.equal(input.value, 'Nội dung đã nhập');
  assert.equal(input.getAttribute('aria-invalid'), 'true');
  assert.equal(document.activeElement, input);
});
test('HTTP permissions and own profile remain editable with real requests', async () => {
  await signIn('admin');
  await page('/app/roles');
  await screen.findByRole(
    'heading',
    { name: 'Ma trận phân quyền' },
    { timeout: 10000 },
  );
  fireEvent.click(screen.getByRole('button', { name: 'Chỉnh sửa quyền' }));
  fireEvent.click(screen.getByRole('button', { name: 'Lưu phân quyền' }));
  await screen.findByText('Đã cập nhật ma trận phân quyền.');
  assert(
    calls.some((c) => c.method === 'PATCH' && c.path === '/api/v1/permissions'),
  );
  assertProduct();
  await page('/app/profile');
  await screen.findByRole(
    'heading',
    { name: 'Hồ sơ cá nhân', level: 1 },
    { timeout: 10000 },
  );
  const input = screen.getByLabelText('Số điện thoại');
  assert.equal(input.disabled, false);
  fireEvent.change(input, { target: { value: '0909999888' } });
  fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));
  await screen.findByText('Đã cập nhật hồ sơ.');
  assert(
    calls.some(
      (c) => c.method === 'PATCH' && c.path === '/api/v1/auth/profile',
    ),
  );
  assert.equal((await api.request('/auth/me')).phone, '0909999888');
});
test('notification outages show an error and retry instead of an empty inbox', async () => {
  await signIn('admin');
  const request = api.request;
  let failed = true;
  api.request = async (path, options) => {
    if (path === '/notifications' && failed)
      throw Object.assign(Error('Không tải được thông báo'), { status: 503 });
    return request(path, options);
  };
  try {
    await page('/app/dashboard');
    await screen.findByRole('heading', { level: 1 }, { timeout: 10000 });
    fireEvent.click(screen.getByRole('button', { name: 'Mở thông báo' }));
    await screen.findByText('Không tải được thông báo');
    assert.equal(screen.queryByText('Chưa có thông báo mới.'), null);
    assert.equal(
      screen.getByRole('button', { name: 'Đánh dấu tất cả đã đọc' }).disabled,
      true,
    );
    failed = false;
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    await waitFor(() =>
      assert.equal(screen.queryByText('Không tải được thông báo'), null),
    );
  } finally {
    api.request = request;
  }
});
test('reports supply a palette when an otherwise valid response omits chart colors', async () => {
  await signIn('admin');
  const request = api.request;
  api.request = async (path, options) => {
    const data = await request(path, options);
    if (path === '/report-charts/attendance-report')
      return {
        ...data,
        charts: data.charts.map((chart) => ({
          ...chart,
          data: chart.data.map(({ color, ...row }) => row),
        })),
      };
    return data;
  };
  try {
    await page('/app/attendance-report');
    await waitFor(() => assert(document.querySelector('.report-donut')), {
      timeout: 10000,
    });
    const swatches = document.querySelectorAll('.report-legend i');
    assert(swatches.length > 0);
    assert([...swatches].every((node) => node.style.background));
  } finally {
    api.request = request;
  }
});
test('scope belongs to the signed-in identity and a late manager hierarchy cannot repopulate a learner session', async () => {
  await signIn('admin');
  const { MemoryRouter, useLocation } = await import('react-router-dom'),
    { AuthProvider, useAuth } = await vite.ssrLoadModule(
      '/src/contexts/AuthContext.jsx',
    );
  const { act } = await import('@testing-library/react');
  let context;
  function Harness() {
    context = useAuth();
    const location = useLocation();
    return React.createElement(
      'output',
      null,
      JSON.stringify({
        role: context.user?.role,
        wards: context.hierarchy.wards,
        clubs: context.hierarchy.clubs,
        ward: context.selectedWard,
        club: context.selectedClub,
        search: location.search,
      }),
    );
  }
  render(
    React.createElement(
      MemoryRouter,
      { initialEntries: ['/app/students'] },
      React.createElement(AuthProvider, null, React.createElement(Harness)),
    ),
  );
  await waitFor(() => assert(context.hierarchy.wards.length > 0), {
    timeout: 10000,
  });
  await act(async () => context.switchScope('ward-2', 'club-3'));
  await waitFor(() => assert.equal(context.selectedClub, 'club-3'));
  assert.equal(localStorage.getItem('vovinam_active_ward:u-admin'), 'ward-2');
  localStorage.setItem('vovinam_active_ward', 'ward-2');
  const request = api.request;
  let release,
    held = false;
  const pending = new Promise((resolve) => (release = resolve));
  api.request = async (path, options) => {
    const data = await request(path, options);
    if (path === '/organization/navigation' && !held) {
      held = true;
      await pending;
    }
    return data;
  };
  try {
    await act(async () => {
      void context.reloadHierarchy();
    });
    await waitFor(() => assert(held));
    await act(async () => {
      await context.logout();
      await context.login({
        email: 'vosinh@vovinam.test',
        password: MOCK_PASSWORD,
      });
    });
    await waitFor(() => assert.equal(context.user?.role, 'STUDENT'));
    await act(async () => {
      release();
      await pending;
    });
    assert.equal(context.selectedWard, '');
    assert.equal(context.selectedClub, '');
    assert.equal(context.hierarchy.wards.length, 0);
    assert.equal(context.hierarchy.clubs.length, 0);
    assert.equal(localStorage.getItem('vovinam_active_ward'), null);
    assert.equal(localStorage.getItem('vovinam_active_ward:u-admin'), null);
    assert.doesNotMatch(
      screen.getByRole('status').textContent,
      /wardId|clubId/,
    );
  } finally {
    release();
    api.request = request;
  }
});

test('dashboard navigation exposes all permitted groups, searches them, and keeps group state across routes', async () => {
  await signIn('admin');
  await page('/app/dashboard');
  await screen.findByRole('heading', { name: 'Tổng quan đơn vị', level: 1 });
  assert.equal(document.documentElement.dataset.theme, 'light');
  const nav = document.querySelector('nav[aria-label="Điều hướng chính"]');
  const training = [...nav.querySelectorAll('button')].find((button) =>
    button.textContent.includes('ĐÀO TẠO'),
  );
  assert.equal(training.getAttribute('aria-expanded'), 'true');
  const students = nav.querySelector('a[href="/app/students"]');
  assert.equal(students.closest('[hidden]'), null);
  fireEvent.click(training);
  assert.equal(training.getAttribute('aria-expanded'), 'false');
  assert(students.closest('[hidden]'));
  fireEvent.change(screen.getByRole('textbox', { name: 'Tìm trong menu' }), {
    target: { value: 'võ sinh' },
  });
  assert.equal(training.getAttribute('aria-expanded'), 'true');
  assert.equal(nav.querySelector('a[href="/app/invoices"]'), null);
  assert.equal(
    nav.querySelector('a[href="/app/students"]').closest('[hidden]'),
    null,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Xóa tìm kiếm menu' }));
  assert.equal(training.getAttribute('aria-expanded'), 'false');
  fireEvent.click(nav.querySelector('a[href="/app/wards"]'));
  await screen.findByRole('heading', { name: 'Quản lý phường', level: 1 });
  assert.equal(training.getAttribute('aria-expanded'), 'false');
  assert.equal(
    document
      .querySelector('nav a[href="/app/wards"]')
      .getAttribute('aria-current'),
    'page',
  );
});

test('record lists retain named table regions, mobile labels and explicit empty birthdate on creation', async () => {
  await signIn('admin');
  await page('/app/students');
  await screen.findByRole('table', { name: 'Hồ sơ võ sinh' });
  const region = screen.getByRole('region', {
    name: 'Danh sách Hồ sơ võ sinh',
  });
  assert.equal(region.getAttribute('tabindex'), '0');
  assert(region.querySelector('.record-table'));
  for (const row of region.querySelectorAll('tbody tr')) {
    for (const cell of [...row.querySelectorAll('td')].slice(1))
      assert(cell.getAttribute('data-label'));
  }
  fireEvent.click(screen.getByRole('button', { name: 'Thêm võ sinh' }));
  const birthdate = screen.getByLabelText(/^Ngày sinh/);
  assert.equal(birthdate.value, '');
  assert.equal(birthdate.getAttribute('type'), 'date');
});

test('mobile navigation isolates background focus, traps Tab and closes with Escape', async () => {
  await signIn('admin');
  const match = window.matchMedia;
  window.matchMedia = (query) => ({
    matches: query.includes('900px'),
    addEventListener() {},
    removeEventListener() {},
  });
  try {
    await page('/app/dashboard');
    await screen.findByRole('heading', { name: 'Tổng quan đơn vị', level: 1 });
    const drawer = document.querySelector('#workspace-navigation');
    assert(drawer.hasAttribute('inert'));
    const trigger = screen.getByRole('button', {
      name: 'Mở menu',
      exact: true,
    });
    trigger.focus();
    fireEvent.click(trigger);
    assert.equal(drawer.hasAttribute('inert'), false);
    assert.equal(drawer.getAttribute('aria-modal'), 'true');
    assert(document.querySelector('.workspace').hasAttribute('inert'));
    assert.equal(
      document.activeElement.getAttribute('aria-label'),
      'Đóng menu điều hướng',
    );
    const logout = drawer.querySelector('button[aria-label="Đăng xuất"]');
    logout.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    assert.equal(
      document.activeElement.getAttribute('aria-label'),
      'Đóng menu điều hướng',
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    assert(drawer.hasAttribute('inert'));
    assert.equal(
      document.querySelector('.workspace').hasAttribute('inert'),
      false,
    );
    assert.equal(document.activeElement, trigger);
  } finally {
    cleanup();
    window.matchMedia = match;
  }
});
