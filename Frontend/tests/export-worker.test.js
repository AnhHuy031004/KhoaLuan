import test from 'node:test';
import assert from 'node:assert/strict';
import { Worker } from 'node:worker_threads';
import * as XLSX from 'xlsx';
test('export worker transfers a readable XLSX buffer from a separate thread', async () => {
  const worker = new Worker(
    new URL('./fixtures/export-worker-node.mjs', import.meta.url),
  );
  try {
    const response = await new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(Error('Worker did not return a workbook')),
        15000,
      );
      worker.on('error', (error) => {
        clearTimeout(timer);
        reject(error);
      });
      worker.on('message', (message) => {
        if (message.ready) {
          worker.postMessage({
            generatedAt: '2026-11-18',
            user: { fullName: 'Test', role: 'ADMIN' },
            scope: 'Synthetic',
            sheets: [
              {
                id: 'invoices',
                title: 'Test export',
                columns: ['code', 'amount'],
                rows: [{ code: 'HD-001', amount: 490000 }],
              },
            ],
          });
          return;
        }
        clearTimeout(timer);
        message.error ? reject(Error(message.error)) : resolve(message.bytes);
      });
    });
    assert(response instanceof ArrayBuffer);
    const workbook = XLSX.read(new Uint8Array(response), { type: 'array' }),
      rows = XLSX.utils.sheet_to_json(workbook.Sheets['Test export']);
    assert.equal(rows[0]['Số tiền [amount]'], 490000);
  } finally {
    await worker.terminate();
  }
});
