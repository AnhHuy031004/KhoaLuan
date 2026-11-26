import { MOCK_PASSWORD } from '../mock/users.js';
import test, { before, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';
import React from 'react';
let vite,
  dom,
  render,
  fireEvent,
  screen,
  cleanup,
  waitFor,
  act,
  MemoryRouter,
  useLocation,
  useNavigate,
  Auth,
  Toast,
  RecordForm,
  Modal,
  useListFilters,
  api,
  Attendance;
before(async () => {
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
  window.scrollTo = () => {};
  HTMLElement.prototype.scrollTo = () => {};
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
    this.querySelector('button,input,select,textarea')?.focus();
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
  };
  ({ render, fireEvent, screen, cleanup, waitFor, act } =
    await import('@testing-library/react'));
  ({ MemoryRouter, useLocation, useNavigate } =
    await import('react-router-dom'));
  vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });
  const modules = await Promise.all(
    [
      '/src/contexts/AuthContext.jsx',
      '/src/contexts/ToastContext.jsx',
      '/src/components/common/RecordForm.jsx',
      '/src/components/common/Modal.jsx',
      '/src/hooks/useListFilters.js',
      '/src/services/api.js',
      '/src/features/attendance/pages/SessionAttendancePage.jsx',
    ].map((p) => vite.ssrLoadModule(p)),
  );
  [Auth, Toast, RecordForm, Modal, useListFilters, api, Attendance] = [
    modules[0].default,
    modules[1].ToastProvider,
    modules[2].default,
    modules[3].default,
    modules[4].default,
    modules[5].api,
    modules[6].default,
  ];
});
afterEach(() => cleanup());
after(async () => {
  await vite?.close();
  dom?.window.close();
});
function wrap(child, user = { id: 'u-admin', role: 'ADMIN' }) {
  return React.createElement(
    MemoryRouter,
    null,
    React.createElement(
      Auth.Provider,
      { value: { user } },
      React.createElement(Toast, null, child),
    ),
  );
}
test('URL filters update atomically and browser history restores the prior class/status/page', async () => {
  function Harness() {
    const { values, setters } = useListFilters({
        q: '',
        status: '',
        classId: '',
        page: 1,
      }),
      location = useLocation(),
      navigate = useNavigate();
    return React.createElement(
      'div',
      null,
      React.createElement('output', null, location.search),
      React.createElement(
        'button',
        {
          onClick: () => {
            setters.status('SUCCESS');
            setters.page(1);
          },
        },
        'filter',
      ),
      React.createElement('button', { onClick: () => navigate(-1) }, 'back'),
      React.createElement('p', null, JSON.stringify(values)),
    );
  }
  render(
    React.createElement(
      MemoryRouter,
      { initialEntries: ['?classId=c-1&status=PENDING&page=3&wardId=w-1'] },
      React.createElement(Harness),
    ),
  );
  fireEvent.click(screen.getByText('filter'));
  await waitFor(() =>
    assert.match(screen.getByRole('status').textContent, /status=SUCCESS/),
  );
  assert.match(screen.getByRole('status').textContent, /page=1/);
  assert.match(screen.getByRole('status').textContent, /wardId=w-1/);
  fireEvent.click(screen.getByText('back'));
  await waitFor(() =>
    assert.match(screen.getByRole('status').textContent, /page=3/),
  );
  assert.match(screen.getByRole('status').textContent, /status=PENDING/);
});
test('dialog Escape uses current dirty/busy state and cancellation protects edits', () => {
  let closed = 0,
    confirmations = 0;
  window.confirm = () => {
    confirmations++;
    return false;
  };
  const view = render(
    React.createElement(
      Modal,
      { title: 'Form', onClose: () => closed++ },
      'Body',
    ),
  );
  view.rerender(
    React.createElement(
      Modal,
      { title: 'Form', dirty: true, onClose: () => closed++ },
      'Body',
    ),
  );
  fireEvent(
    screen.getByRole('dialog'),
    new Event('cancel', { cancelable: true }),
  );
  assert.equal(closed, 0);
  assert.equal(confirmations, 1);
  view.rerender(
    React.createElement(
      Modal,
      { title: 'Form', dirty: true, busy: true, onClose: () => closed++ },
      'Body',
    ),
  );
  fireEvent(
    screen.getByRole('dialog'),
    new Event('cancel', { cancelable: true }),
  );
  assert.equal(confirmations, 1);
  assert.equal(closed, 0);
  window.confirm = () => true;
});
test('exam result form keeps student choices without a class field and guards the cancel button', async () => {
  const config = (
    await vite.ssrLoadModule('/src/features/exam-results/module.js')
  ).default;
  let closed = 0;
  render(
    wrap(
      React.createElement(RecordForm, {
        config,
        lookups: {
          students: [
            {
              id: 's1',
              fullName: 'Võ sinh A',
              classId: 'c1',
              status: 'ACTIVE',
            },
          ],
          classes: [{ id: 'c1', name: 'Lớp A' }],
          exams: [
            { id: 'e1', title: 'Kỳ thi hợp lệ', status: 'APPROVED' },
            { id: 'e2', title: 'Chưa duyệt', status: 'PENDING' },
          ],
        },
        service: {},
        onClose: () => closed++,
        onSaved() {},
      }),
    ),
  );
  assert(screen.getByRole('option', { name: 'Võ sinh A' }));
  assert.equal(screen.queryByRole('option', { name: 'Chưa duyệt' }), null);
  fireEvent.change(screen.getByLabelText(/Võ sinh/), {
    target: { value: 's1' },
  });
  window.confirm = () => false;
  fireEvent.click(screen.getByRole('button', { name: 'Hủy bỏ' }));
  assert.equal(closed, 0);
  window.confirm = () => true;
  fireEvent.click(screen.getByRole('button', { name: 'Hủy bỏ' }));
  assert.equal(closed, 1);
});
test('invoice form follows class and period tariffs, previews relief, clears stale student and focuses validation', async () => {
  const config = (await vite.ssrLoadModule('/src/features/invoices/module.js'))
    .default;
  let saved = 0;
  render(
    wrap(
      React.createElement(RecordForm, {
        config,
        lookups: {
          classes: [
            { id: 'c1', name: 'Lớp A', tuition: 350000 },
            { id: 'c2', name: 'Lớp B', tuition: 400000 },
          ],
          students: [
            {
              id: 's1',
              fullName: 'Võ sinh A',
              classId: 'c1',
              status: 'ACTIVE',
            },
          ],
          tuition: [
            {
              classId: 'c1',
              period: '2045-01',
              amount: 490000,
              status: 'ACTIVE',
            },
          ],
          tuitionRelief: [
            {
              id: 'relief1',
              studentId: 's1',
              classId: 'c1',
              period: '2045-01',
              percent: 30,
              status: 'APPROVED',
            },
          ],
        },
        service: { create: async () => saved++ },
        onClose() {},
        onSaved() {},
      }),
    ),
  );
  const klass = screen.getByLabelText(/Lớp học/),
    student = screen.getByLabelText(/Võ sinh/),
    amount = screen.getByLabelText(/Học phí gốc/);
  assert(klass.compareDocumentPosition(student) & 4);
  fireEvent.change(klass, { target: { value: 'c1' } });
  fireEvent.change(student, { target: { value: 's1' } });
  fireEvent.change(screen.getByLabelText(/Tháng thu/), {
    target: { value: '2045-01' },
  });
  assert.equal(amount.value, '490000');
  assert.match(document.body.textContent, /30%/);
  assert.match(document.body.textContent, /343\.000/);
  fireEvent.change(klass, { target: { value: 'c2' } });
  assert.equal(student.value, '');
  assert.equal(amount.value, '400000');
  fireEvent.submit(document.querySelector('form'));
  assert.equal(saved, 0);
  assert.equal(student.getAttribute('aria-invalid'), 'true');
  assert.equal(document.activeElement, student);
});
test('attendance row selection does not mark present until confirmed; failed search reports no match', async () => {
  localStorage.clear();
  sessionStorage.clear();
  const session = await api.request('/auth/login', {
    method: 'POST',
    public: true,
    body: { email: 'admin@vovinam.test', password: MOCK_PASSWORD },
  });
  api.save(session);
  const key = 'vovinam-mock-offline-v4',
    db = JSON.parse(localStorage.getItem(key));
  db.attendance = [];
  localStorage.setItem(key, JSON.stringify(db));
  render(wrap(React.createElement(Attendance), session.user));
  await screen.findAllByRole(
    'button',
    { name: 'Xác nhận có mặt' },
    { timeout: 10000 },
  );
  const checkbox = screen
    .getAllByRole('checkbox')
    .find(
      (el) =>
        el.getAttribute('aria-label')?.startsWith('Chọn ') &&
        !el.getAttribute('aria-label').startsWith('Chọn tất cả'),
    );
  fireEvent.click(checkbox);
  assert.equal(JSON.parse(localStorage.getItem(key)).attendance.length, 0);
  const batch = screen.getAllByRole('button', {
    name: 'Xác nhận có mặt (1)',
  })[0];
  fireEvent.click(batch);
  assert.equal(JSON.parse(localStorage.getItem(key)).attendance.length, 0);
  fireEvent.click(
    screen.getByRole('button', { name: 'Xác nhận', exact: true }),
  );
  await waitFor(() =>
    assert.equal(JSON.parse(localStorage.getItem(key)).attendance.length, 1),
  );
  await waitFor(() => assert.equal(screen.queryByRole('dialog'), null));
  const search = screen.getByRole('textbox', { name: /Tìm tên hoặc mã/ });
  fireEvent.change(search, { target: { value: 'khongco123xyz' } });
  await screen.findByText('Không tìm thấy võ sinh với từ khóa này.');
  assert.equal(screen.queryByText(/Tất cả.*đã được điểm danh có mặt/), null);
});
test('learner can reselect their class without losing the disabled identity field', async () => {
  const config = (await vite.ssrLoadModule('/src/features/leaves/module.js'))
    .default;
  render(
    wrap(
      React.createElement(RecordForm, {
        config,
        lookups: {
          classes: [{ id: 'c1', name: 'Lớp A' }],
          students: [
            {
              id: 's1',
              fullName: 'Võ sinh A',
              classId: 'c1',
              status: 'ACTIVE',
            },
          ],
        },
        service: {},
        onClose() {},
        onSaved() {},
      }),
      { id: 'u-student', role: 'STUDENT', studentId: 's1' },
    ),
  );
  const student = screen.getByLabelText(/Võ sinh/),
    klass = screen.getByLabelText(/Lớp học/);
  assert.equal(student.disabled, true);
  fireEvent.change(klass, { target: { value: '' } });
  fireEvent.change(klass, { target: { value: 'c1' } });
  assert.equal(student.value, 's1');
});
test('explicit organization switch clears dependent filters while preserving the workflow filter', async () => {
  localStorage.clear();
  sessionStorage.clear();
  const session = await api.request('/auth/login', {
    method: 'POST',
    public: true,
    body: { email: 'admin@vovinam.test', password: MOCK_PASSWORD },
  });
  api.save(session);
  const { AuthProvider, useAuth } = await vite.ssrLoadModule(
    '/src/contexts/AuthContext.jsx',
  );
  function Harness() {
    const context = useAuth(),
      location = useLocation();
    return React.createElement(
      'div',
      null,
      React.createElement('output', null, location.search),
      React.createElement(
        'button',
        {
          disabled: context.loading,
          onClick: () => context.switchScope('ward-2', 'club-3'),
        },
        'switch',
      ),
    );
  }
  render(
    React.createElement(
      MemoryRouter,
      {
        initialEntries: [
          '/app/students?classId=c-1&page=3&record=s-1&status=ACTIVE',
        ],
      },
      React.createElement(AuthProvider, null, React.createElement(Harness)),
    ),
  );
  await waitFor(() => assert.equal(screen.getByText('switch').disabled, false));
  fireEvent.click(screen.getByText('switch'));
  await waitFor(() =>
    assert.match(screen.getByRole('status').textContent, /clubId=club-3/),
  );
  const p = new URLSearchParams(screen.getByRole('status').textContent);
  assert.equal(p.get('wardId'), 'ward-2');
  assert.equal(p.get('status'), 'ACTIVE');
  for (const key of ['classId', 'page', 'record'])
    assert.equal(p.has(key), false, key + ' ' + p.toString());
});
test('proposal form protects unsaved reason edits when dismissed', async () => {
  localStorage.clear();
  sessionStorage.clear();
  const session = await api.request('/auth/login', {
    method: 'POST',
    public: true,
    body: { email: 'admin@vovinam.test', password: MOCK_PASSWORD },
  });
  api.save(session);
  const { default: Promotions } = await vite.ssrLoadModule(
    '/src/features/promotions/pages/PromotionsPage.jsx',
  );
  render(wrap(React.createElement(Promotions), session.user));
  await waitFor(() =>
    assert(
      document.querySelector(
        'select[aria-label="Lớp đề xuất"] option[value="c-1"]',
      ),
    ),
  );
  fireEvent.change(screen.getByLabelText('Lớp đề xuất'), {
    target: { value: 'c-1' },
  });
  await waitFor(() =>
    assert.equal(
      screen.getByRole('button', { name: 'Thêm đề xuất' }).disabled,
      false,
    ),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Thêm đề xuất' }));
  fireEvent.change(screen.getByLabelText('Lý do đề xuất'), {
    target: { value: 'Nội dung chưa lưu' },
  });
  window.confirm = () => false;
  fireEvent.click(screen.getByRole('button', { name: 'Đóng hộp thoại' }));
  assert(screen.getByRole('dialog'));
  fireEvent.click(screen.getByRole('button', { name: 'Hủy', exact: true }));
  assert(screen.getByRole('dialog'));
  window.confirm = () => true;
  fireEvent.click(screen.getByRole('button', { name: 'Hủy', exact: true }));
  assert.equal(screen.queryByRole('dialog'), null);
});
test('complete application opens the appropriate dashboard for learner, coach and admin', async () => {
  const { default: App } = await vite.ssrLoadModule('/src/App.jsx');
  for (const [email, title] of [
    ['vosinh', 'Trang của tôi'],
    ['hlv', 'Công việc hôm nay'],
    ['admin', 'Tổng quan đơn vị'],
  ]) {
    cleanup();
    localStorage.clear();
    sessionStorage.clear();
    window.history.replaceState({}, '', '/app/dashboard');
    const session = await api.request('/auth/login', {
      method: 'POST',
      public: true,
      body: { email: email + '@vovinam.test', password: MOCK_PASSWORD },
    });
    api.save(session);
    render(React.createElement(App));
    await screen.findByRole(
      'heading',
      { name: title, level: 1 },
      { timeout: 10000 },
    );
    assert.equal(screen.queryByText('Đã xảy ra lỗi giao diện'), null);
    assert.doesNotMatch(
      document.body.textContent,
      /BẢN DEMO|Bản demo cục bộ|Khôi phục dữ liệu/,
    );
  }
});
test('payment status filter displays SUCCESS and both detail/review dialogs remain usable', async () => {
  localStorage.clear();
  sessionStorage.clear();
  const session = await api.request('/auth/login', {
    method: 'POST',
    public: true,
    body: { email: 'admin@vovinam.test', password: MOCK_PASSWORD },
  });
  api.save(session);
  const key = 'vovinam-mock-offline-v4',
    db = JSON.parse(localStorage.getItem(key));
  db['online-payments'].push({
    ...db['online-payments'][0],
    id: 'success-review',
    code: 'GD-DA-XAC-NHAN',
    status: 'SUCCESS',
  });
  localStorage.setItem(key, JSON.stringify(db));
  const { default: Page } = await vite.ssrLoadModule(
      '/src/components/common/FeaturePage.jsx',
    ),
    { default: config } = await vite.ssrLoadModule(
      '/src/features/payment-confirmations/module.js',
    ),
    { default: service } = await vite.ssrLoadModule(
      '/src/features/payment-confirmations/services/paymentConfirmationsService.js',
    );
  render(wrap(React.createElement(Page, { config, service }), session.user));
  await screen.findByRole('cell', { name: 'GD-CHO-001' });
  const status = screen.getByLabelText('Lọc trạng thái');
  assert.equal(status.options.length, 4);
  fireEvent.change(status, { target: { value: 'SUCCESS' } });
  await screen.findByRole('cell', { name: 'GD-DA-XAC-NHAN' });
  assert.equal(screen.queryByRole('cell', { name: 'GD-CHO-001' }), null);
  fireEvent.click(screen.getByRole('button', { name: 'Xem GD-DA-XAC-NHAN' }));
  assert(screen.getByRole('dialog'));
  assert.match(screen.getByRole('dialog').textContent, /Đã xác nhận/);
  fireEvent.click(screen.getByRole('button', { name: 'Đóng hộp thoại' }));
  fireEvent.change(status, { target: { value: 'PENDING' } });
  await screen.findByRole('cell', { name: 'GD-CHO-001' });
  fireEvent.click(screen.getByRole('button', { name: 'Duyệt GD-CHO-001' }));
  assert.match(
    screen.getByRole('dialog').textContent,
    /đối chiếu khoản thanh toán/,
  );
});
test('recovery rejects changed backups and enables restoration only after checksum and explicit confirmation', async () => {
  localStorage.clear();
  sessionStorage.clear();
  const session = await api.request('/auth/login', {
    method: 'POST',
    public: true,
    body: { email: 'admin@vovinam.test', password: MOCK_PASSWORD },
  });
  api.save(session);
  const db = JSON.parse(localStorage.getItem('vovinam-mock-offline-v4'));
  db.sessions = {};
  db.resetTokens = {};
  const value = {
    format: 'vovinam-backup-v1',
    createdAt: '2026-11-18',
    db,
    checksum: 'invalid',
  };
  const { default: Recovery } = await vite.ssrLoadModule(
    '/tests/fixtures/legacy-source/src/features/recovery/RecoveryTools.jsx',
  );
  render(wrap(React.createElement(Recovery), session.user));
  const input = screen.getByLabelText('Chọn bản sao lưu JSON');
  fireEvent.change(input, {
    target: { files: [{ size: 100, text: async () => JSON.stringify(value) }] },
  });
  await screen.findByRole('alert');
  assert.equal(
    screen.queryByRole('button', { name: 'Khôi phục bản đã chọn' }),
    null,
  );
  value.checksum = Array.from(
    new Uint8Array(
      await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(JSON.stringify(db)),
      ),
    ),
    (b) => b.toString(16).padStart(2, '0'),
  ).join('');
  fireEvent.change(input, {
    target: { files: [{ size: 100, text: async () => JSON.stringify(value) }] },
  });
  await screen.findByText(/Đã kiểm tra bản sao lưu/);
  const button = screen.getByRole('button', { name: 'Khôi phục bản đã chọn' });
  assert.equal(button.disabled, true);
  fireEvent.change(
    screen.getByLabelText('Nhập KHÔI PHỤC để xác nhận thay dữ liệu'),
    { target: { value: 'KHÔI PHỤC' } },
  );
  assert.equal(button.disabled, false);
});
