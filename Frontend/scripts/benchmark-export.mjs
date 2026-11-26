// Synthetic benchmark only: node --expose-gc scripts/benchmark-export.mjs 100000
import { performance } from 'node:perf_hooks';
import * as XLSX from 'xlsx';
import { buildWorkbook } from '../src/utils/excelExport.js';
const size = Number(process.argv[2] || 10000);
if (!Number.isInteger(size) || size < 1 || size > 1000000)
  throw Error('Expected 1..1000000 rows');
const rows = Array.from({ length: size }, (_, i) => ({
  id: 'synthetic-' + i,
  fullName: 'Võ sinh mẫu ' + i,
  classId: 'c-1',
  amount: 350000,
  status: 'UNPAID',
}));
global.gc?.();
const start = performance.now();
const workbook = buildWorkbook({
  generatedAt: new Date().toISOString(),
  user: { fullName: 'Benchmark', role: 'ADMIN' },
  scope: 'Synthetic',
  lookups: { classes: [{ id: 'c-1', name: 'Lớp mẫu' }] },
  sheets: [
    {
      id: 'invoices',
      title: 'Hóa đơn mẫu',
      columns: ['id', 'fullName', 'classId', 'amount', 'status'],
      rows,
    },
  ],
});
const bytes = XLSX.write(workbook, {
  type: 'buffer',
  compression: true,
  bookType: 'xlsx',
});
console.log(
  JSON.stringify({
    rows: size,
    elapsedMs: Math.round(performance.now() - start),
    xlsxBytes: bytes.length,
    rssMiB: Math.round(process.memoryUsage().rss / 1024 / 1024),
    node: process.version,
  }),
);
