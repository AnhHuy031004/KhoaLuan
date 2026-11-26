import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fetchAllPages } from '../src/utils/fetchAllPages.js';
import { notificationTarget } from '../src/config/uiPolicy.js';
import { assertNoSecrets } from './helpers/assertNoSecrets.js';
test('complete list loader follows server page caps without losing records', async () => {
  const rows = Array.from({ length: 501 }, (_, i) => ({ id: String(i) }));
  const result = await fetchAllPages({
    list: async ({ page }) => ({
      items: rows.slice((page - 1) * 100, page * 100),
      total: rows.length,
    }),
  });
  assert.deepEqual(result.items, rows);
});
test('incomplete, repeated, changed or capped snapshots cannot be mistaken for full financial totals', async () => {
  for (const service of [
    { list: async () => ({ items: [], total: 5 }) },
    { list: async () => ({ items: [{ id: 'same' }], total: 5 }) },
    {
      list: async ({ page }) => ({
        items: [{ id: String(page) }],
        total: page === 1 ? 5 : 6,
      }),
    },
  ])
    await assert.rejects(fetchAllPages(service));
  await assert.rejects(
    fetchAllPages(
      {
        list: async ({ page }) => ({ items: [{ id: String(page) }], total: 5 }),
      },
      {},
      undefined,
      { maxPages: 2 },
    ),
  );
});
test('date inputs keep the Vietnamese calendar day before 07:00', () => {
  const code = `import {localDateKey} from './src/utils/date.js'; console.log(localDateKey(new Date('2026-11-25T18:00:00Z')));`;
  assert.equal(
    execFileSync(process.execPath, ['--input-type=module', '-e', code], {
      cwd: new URL('../', import.meta.url),
      env: { ...process.env, TZ: 'Asia/Ho_Chi_Minh' },
      encoding: 'utf8',
    }).trim(),
    '2026-11-26',
  );
});
test('export secrecy checks detect nested credentials while allowing normal numbers containing 123', () => {
  assertNoSecrets({ rows: [{ phone: '0901234567', amount: 123000 }] });
  assert.throws(() =>
    assertNoSecrets({ rows: [{ metadata: { refreshToken: 'hidden' } }] }),
  );
});
test('payment notifications carry exact invoice or review links', () => {
  assert.equal(
    notificationTarget({
      systemEvent: 'PAYMENT_CONFIRMATION_APPROVED',
      invoiceId: 'inv 1',
    }),
    '/app/online-payments?invoice=inv%201',
  );
  assert.equal(
    notificationTarget({
      systemEvent: 'PAYMENT_CONFIRMATION_PENDING',
      workflowRecordId: 'pay-1',
    }),
    '/app/payment-confirmations?status=PENDING&record=pay-1',
  );
  assert.equal(
    notificationTarget(
      {
        workflowModule: 'online-payments',
        workflowRecordId: 'pay-1',
        invoiceId: 'inv-1',
      },
      { role: 'STUDENT' },
    ),
    '/app/online-payments?invoice=inv-1',
  );
});
