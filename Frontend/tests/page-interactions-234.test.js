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
  globalThis.requestAnimationFrame = (callback) => setTimeout(callback, 0);
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

function assertHealthy(context) {
  assert(
    !document
      .querySelector('.startup h1')
      ?.textContent.includes('Không thể hiển thị'),
    context,
  );
  assert.equal(
    Boolean(document.querySelector('.page-error')),
    false,
    context + ': route boundary',
  );
}
async function settle(context) {
  await waitFor(
    () => {
      assertHealthy(context);
      assert.equal(
        Boolean(document.querySelector('.system-loading, .loading')),
        false,
      );
      assert(document.querySelector('h1'));
    },
    { timeout: 10000 },
  );
}

test('all accessible module routes, status filters, record details and create dialogs stay usable for all six account levels', async (t) => {
  const { modules } = await vite.ssrLoadModule('/src/routes/routeConfig.js');
  const { createLabels } = await vite.ssrLoadModule('/src/config/uiPolicy.js');
  const coverage = [];
  for (const account of [
    'admin',
    'vosu',
    'vosuphuong',
    'vosuclb',
    'hlv',
    'vosinh',
  ]) {
    await signIn(account);
    const { user } = api.read();
    const { matrix } = await api.request('/permissions');
    for (const module of modules) {
      const rights = matrix[module.id]?.[user.role] || '';
      if (
        !rights.includes('V') &&
        !(module.id === 'online-payments' && rights.includes('P'))
      )
        continue;
      const context = account + '/' + module.id;
      await t.test(context, async () => {
        await page('/app/' + module.id + '?view=records');
        await settle(context);
        const seen = {
          account,
          module: module.id,
          statuses: [],
          detail: false,
          form: false,
        };
        if (module.id === 'attendance') {
          const session = screen.queryAllByRole('button', {
            name: /^Chọn buổi /,
          })[0];
          if (session) {
            fireEvent.click(session);
            await settle(context + '/session');
          }
        }
        const status = document.querySelector(
          'select[aria-label="Lọc trạng thái"]',
        );
        if (status) {
          const values = [...status.options].map((o) => o.value);
          for (const value of values) {
            fireEvent.change(screen.getByLabelText('Lọc trạng thái'), {
              target: { value },
            });
            await waitFor(() =>
              assert.equal(
                screen.getByLabelText('Lọc trạng thái').value,
                value,
              ),
            );
            await settle(context + '/status=' + value);
            seen.statuses.push(value);
          }
          fireEvent.change(screen.getByLabelText('Lọc trạng thái'), {
            target: { value: '' },
          });
          await waitFor(() =>
            assert.equal(screen.getByLabelText('Lọc trạng thái').value, ''),
          );
          await settle(context + '/status=all');
        }
        if (module.id === 'payment-confirmations') {
          for (const name of [
            'Đã xác nhận',
            'Từ chối / Đã đóng',
            'Tất cả',
            'Chờ đối soát',
          ]) {
            fireEvent.click(
              screen.getByRole('tab', {
                name: new RegExp('^' + name.replace('/', '\\/')),
              }),
            );
            await settle(context + '/' + name);
            seen.statuses.push(name);
          }
          fireEvent.click(screen.getByRole('tab', { name: /^Tất cả/ }));
          await settle(context + '/all');
        }
        const detailButton = [...document.querySelectorAll('button')].find(
          (button) =>
            button.textContent.trim() === 'Chi tiết' ||
            button.title === 'Xem chi tiết',
        );
        const learnerFinance =
          user.role === 'STUDENT' &&
          ['invoices', 'online-payments'].includes(module.id);
        // Unpaid learner rows select an invoice for payment; only paid rows open a receipt.
        const row = learnerFinance
          ? document.querySelector('tbody tr .badge-paid')?.closest('tr')
          : document.querySelector('tbody tr.clickable-row');
        const card = document.querySelector(
          '.rank-card[role="button"], .schedule-card[role="button"]',
        );
        const target = row || detailButton || card;
        if (target && !target.disabled) {
          fireEvent.click(target);
          await waitFor(
            () => {
              assertHealthy(context + '/detail');
              assert(
                screen.queryByRole('dialog'),
                context + ': expected detail/form dialog',
              );
            },
            { timeout: 10000 },
          );
          const dialog = screen.getByRole('dialog');
          assert(
            dialog.textContent.trim().length > 20,
            context + ': empty details',
          );
          fireEvent.click(
            screen.getByRole('button', { name: 'Đóng hộp thoại' }),
          );
          await waitFor(() =>
            assert.equal(Boolean(screen.queryByRole('dialog')), false),
          );
          seen.detail = true;
        }
        const createLabel = createLabels[module.id] || 'Thêm mới';
        const create = screen.queryByRole('button', {
          name: createLabel,
          exact: true,
        });
        if (create && !create.disabled) {
          fireEvent.click(create);
          await waitFor(
            () => {
              assertHealthy(context + '/create');
              assert(
                screen.queryByRole('dialog'),
                context + ': expected detail/form dialog',
              );
            },
            { timeout: 10000 },
          );
          fireEvent.click(
            screen.getByRole('button', { name: 'Đóng hộp thoại' }),
          );
          await waitFor(() =>
            assert.equal(Boolean(screen.queryByRole('dialog')), false),
          );
          seen.form = true;
        }
        assertHealthy(context + '/end');
        coverage.push(seen);
      });
    }
    for (const route of ['dashboard', 'profile']) {
      await page('/app/' + route);
      await settle(account + '/' + route);
      coverage.push({ account, module: route });
    }
  }
  const { writeFile } = await import('node:fs/promises');
  await writeFile(
    new URL('../docs/validation/page-interactions-2.3.4.json', import.meta.url),
    JSON.stringify(coverage, null, 2),
  );
  assert(
    coverage.length > 100,
    'expected all six account levels, not only Admin',
  );
});
