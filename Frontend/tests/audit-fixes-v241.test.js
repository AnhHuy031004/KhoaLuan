import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { formatDate, formatDateTime } from '../src/utils/format.js';

const read = (rel) => fs.readFileSync(new URL(rel, import.meta.url), 'utf8');

test('v2.4.1 P1 (FN01-FN05): evaluations empty score guard, composite draft key, canonical receipt code, filtered export & strict pagination', () => {
  const evalPage = read('../src/features/evaluations/pages/EvaluationsPage.jsx');
  assert(evalPage.includes("if (rawRating === '')"), 'FN01: must reject blank score before Number()');
  assert(evalPage.includes("`${rowClassId || ''}::${activePeriod}::${studentId}`"), "FN02: drafts must be keyed by classId + period + studentId");
  assert(evalPage.includes('rows={exportRows}'), 'FN04: FilteredExportButton must receive merged/filtered exportRows');

  const receiptModal = read('../src/features/online-payments/components/ReceiptPrintModal.jsx');
  assert(receiptModal.includes('receipt.invoiceCode || receipt.code'), 'FN03: canonical receiptCode must normalize invoiceCode');
  assert(receiptModal.includes('.replace(/^(BN-|CK-|TM-)+/i'), 'FN03: must strip duplicate prefixes');

  const promoPage = read('../src/features/promotions/pages/PromotionsPage.jsx');
  assert(promoPage.includes('fetchAllPages(service'), 'FN05: PromotionsPage must use strict fetchAllPages');
});

test('v2.4.1 P2 (UI01-UI04, UX01-UX02, FN06-FN10): alignment, data-label, btn-with-label, formatDateTime, keyboard guards & batch summaries', () => {
  // UI04
  const dt = formatDateTime('2026-11-26T08:45:00.000Z');
  assert(dt.includes(':'), 'UI04: formatDateTime must include hour:minute');
  assert(!formatDate('2026-11-26').includes(':'), 'UI04: formatDate stays date-only');

  // UI01 & UI03
  const polish = read('../src/styles/ux-polish.css');
  assert(polish.includes('.data-table th.actions-col'), 'UI01: actions-col header/cell alignment rule');
  assert(polish.includes('.review-action.btn-with-label'), 'UI03: labelled review-action width rule');
  const evalPage = read('../src/features/evaluations/pages/EvaluationsPage.jsx');
  assert(evalPage.includes('review-action review-action-approve btn-with-label'), 'UI03: Lưu nhanh uses btn-with-label');

  // UI02
  for (const rel of [
    '../src/features/enrollments/pages/EnrollmentsPage.jsx',
    '../src/features/evaluations/pages/EvaluationsPage.jsx',
    '../src/features/invoices/pages/InvoicesPage.jsx',
    '../src/features/online-payments/pages/OnlinePaymentsPage.jsx',
    '../src/features/online-payments/components/StudentOnlineTuitionPortal.jsx',
    '../src/features/payment-confirmations/pages/PaymentConfirmationsPage.jsx',
  ]) {
    assert(read(rel).includes('data-label='), `UI02: ${rel} must include data-label attributes`);
  }

  // UX02
  for (const rel of [
    '../src/features/ranks/components/RankCards.jsx',
    '../src/features/schedules/components/ScheduleGrid.jsx',
    '../src/features/announcements/components/AnnouncementList.jsx',
    '../src/features/online-payments/pages/OnlinePaymentsPage.jsx',
  ]) {
    assert(read(rel).includes('e.target === e.currentTarget'), `UX02: ${rel} must guard onKeyDown with e.target === e.currentTarget`);
  }

  // FN06
  assert(read('../src/features/payment-confirmations/pages/PaymentConfirmationsPage.jsx').includes('requestCloseReject'), 'FN06: PaymentConfirmationsPage dirty close guard');
  assert(read('../src/features/attendance/components/AttendanceActionModal.jsx').includes('requestClose'), 'FN06: AttendanceActionModal dirty close guard');

  // FN07 & FN10
  const promo = read('../src/features/promotions/pages/PromotionsPage.jsx');
  assert(promo.includes("next.delete('record')"), 'FN07: clear ?record on detail close');
  assert(promo.includes('failedIds.push(...ids)'), 'FN10: track partial failure across classes');

  // FN08 & FN09
  const enroll = read('../src/features/enrollments/pages/EnrollmentsPage.jsx');
  assert(enroll.includes("syncParam('classId'"), 'FN08: sync EnrollmentsPage filters to URL');
  assert(enroll.includes('const failedIds = []'), 'FN09: track per-ID partial failures in assignClassBatch');
});

test('v2.4.1 HC01-HC06: pagination, transfer approval confirmation modal, route ErrorBoundary & dirty guard', () => {
  const pc = read('../src/features/payment-confirmations/pages/PaymentConfirmationsPage.jsx');
  assert(pc.includes('approveTarget'), 'HC04: bank transfer approval must open confirmation modal');
  assert(pc.includes('<Pagination'), 'HC01: PaymentConfirmationsPage pagination');

  assert(read('../src/components/layout/MainLayout.jsx').includes('<ErrorBoundary'), 'HC05: route-level ErrorBoundary in MainLayout');
  assert(read('../src/features/roles/components/PermissionMatrix.jsx').includes('beforeunload'), 'HC06: PermissionMatrix dirty guard');
});
