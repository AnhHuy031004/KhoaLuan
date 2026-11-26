import React from 'react';
import { Printer, CheckCircle2, Building2, CalendarDays, User, CreditCard } from 'lucide-react';
import Modal from '../../../components/common/Modal.jsx';
import Button from '../../../components/common/Button.jsx';
import { currency, formatDateTime } from '../../../utils/format.js';

export default function ReceiptPrintModal({
  receipt,
  student,
  className,
  onClose,
}) {
  if (!receipt) return null;

  const methodText =
    receipt.paymentMethod === 'BANK' || receipt.method === 'BANK'
      ? 'Chuyển khoản ngân hàng'
      : 'Tiền mặt trực tiếp';
  const paidDate = formatDateTime(
    receipt.paidAt || receipt.reviewedAt || receipt.createdAt,
  );
  const isBank = receipt.paymentMethod === 'BANK' || receipt.method === 'BANK';
  const baseCode = String(
    receipt.invoiceCode || receipt.code || receipt.id?.slice(0, 6) || '',
  )
    .replace(/^(BN-|CK-|TM-)+/i, '')
    .trim();
  const receiptCode =
    receipt.receiptCode ||
    (isBank ? `BN-CK-${baseCode}` : `BN-TM-${baseCode}`);

  function escapeHtml(v) {
    return String(v ?? '—')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function handlePrintPaper() {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;
    const studentName = student?.fullName || receipt.studentName || '—';
    const studentCode = student?.studentCode ? ` (${student.studentCode})` : '';
    const classLabel = className || receipt.className || '—';
    const origCode = receipt.invoiceCode || receipt.code || receipt.id || '—';
    const collector = receipt.reviewedName || receipt.collectedBy || 'Quản lý đơn vị';
    const logoUrl = `${window.location.origin}/assets/vovinam-logo.png`;
    const html = `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8" />
<title>Biên nhận ${escapeHtml(receiptCode)}</title>
<style>
  @page { size: 210mm 148mm; margin: 4mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { width: 100%; height: 100%; margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; background: #ffffff; }
  .sheet { width: 100%; height: 138mm; max-width: none; margin: 0; border: 1.8px solid #0e4d8a; border-radius: 8px; padding: 14px 24px 16px; background: #ffffff; display: flex; flex-direction: column; justify-content: space-between; page-break-inside: avoid; break-inside: avoid; overflow: hidden; }
  .head { display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 10px; }
  .brand { display: flex; align-items: center; gap: 12px; }
  .brand img { width: 46px; height: 46px; object-fit: contain; }
  .brand strong { display: block; font-size: 16.5px; color: #0b3b75; letter-spacing: 0.03em; }
  .brand small { display: block; font-size: 11px; color: #475569; }
  .stamp { border: 1.5px solid #059669; color: #065f46; background: #ecfdf5; border-radius: 999px; padding: 5px 14px; font-size: 12px; font-weight: 700; white-space: nowrap; }
  .title { text-align: center; margin: 6px 0 2px; font-size: 21px; font-weight: 800; color: #0f172a; letter-spacing: 0.04em; }
  .meta { text-align: center; font-size: 12.5px; color: #475569; margin: 0 0 8px; }
  .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px 28px; margin: 4px 0; }
  .item small { display: block; font-size: 11.5px; color: #64748b; margin-bottom: 2px; }
  .item strong { font-size: 14.5px; color: #0f172a; }
  .total { display: flex; justify-content: space-between; align-items: center; padding: 12px 18px; border-radius: 8px; background: #f1f5f9; border: 1.2px solid #cbd5e1; margin: 6px 0; }
  .total span { font-size: 14.5px; font-weight: 600; color: #334155; }
  .total strong { font-size: 23px; font-weight: 800; color: #0b3b75; font-variant-numeric: tabular-nums; }
  .signs { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; text-align: center; padding-top: 10px; border-top: 1px dashed #cbd5e1; page-break-inside: avoid; break-inside: avoid; }
  .signs strong { display: block; font-size: 14px; color: #0f172a; margin-bottom: 3px; }
  .signs small { display: block; font-size: 11.5px; color: #64748b; margin-bottom: 44px; }
</style>
</head>
<body>
  <div class="sheet">
    <div class="head">
      <div class="brand">
        <img src="${escapeHtml(logoUrl)}" alt="Logo Vovinam" />
        <div>
          <strong>VOVINAM VIỆT VÕ ĐẠO</strong>
          <small>HỆ THỐNG QUẢN LÝ MÔN PHÁI &amp; HỌC PHÍ</small>
        </div>
      </div>
      <div class="stamp">ĐÃ THANH TOÁN</div>
    </div>
    <h1 class="title">BIÊN NHẬN THU HỌC PHÍ</h1>
    <p class="meta">Mã biên nhận: <strong>${escapeHtml(receiptCode)}</strong> · Ngày ghi nhận: <strong>${escapeHtml(paidDate)}</strong></p>
    <div class="grid">
      <div class="item"><small>Võ sinh nộp phí</small><strong>${escapeHtml(studentName + studentCode)}</strong></div>
      <div class="item"><small>Lớp học</small><strong>${escapeHtml(classLabel)}</strong></div>
      <div class="item"><small>Kỳ thu học phí</small><strong>${escapeHtml(receipt.period || '—')}</strong></div>
      <div class="item"><small>Hình thức thanh toán</small><strong>${escapeHtml(methodText)}</strong></div>
      <div class="item"><small>Mã hóa đơn gốc</small><strong>${escapeHtml(origCode)}</strong></div>
      <div class="item"><small>Người thu / Xác nhận</small><strong>${escapeHtml(collector)}</strong></div>
    </div>
    <div class="total">
      <span>Tổng số tiền đã nhận</span>
      <strong>${escapeHtml(currency(receipt.amount))}</strong>
    </div>
    <div class="signs">
      <div><strong>Người nộp tiền</strong><small>(Ký, ghi rõ họ tên)</small></div>
      <div><strong>Người thu / Xác nhận</strong><small>(Ký, ghi rõ họ tên)</small></div>
    </div>
  </div>
</body>
</html>`;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      window.print?.();
      return;
    }
    doc.open();
    doc.write(html);
    doc.close();
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } finally {
        setTimeout(() => {
          if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
        }, 1000);
      }
    }, 250);
  }

  return (
    <Modal
      title="Biên nhận thu học phí"
      subtitle="Xem trước và in biên nhận chính thức"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Đóng
          </Button>
          <Button
            variant="primary"
            onClick={handlePrintPaper}
          >
            <Printer size={16} />
            In biên nhận ra giấy
          </Button>
        </>
      }
    >
      <div className="receipt-print-sheet" id="printable-receipt">
        <div className="receipt-print-header">
          <div className="receipt-print-brand">
            <img src="/assets/vovinam-logo.png" alt="Logo Vovinam" />
            <div>
              <strong>VOVINAM VIỆT VÕ ĐẠO</strong>
              <small>HỆ THỐNG QUẢN LÝ MÔN PHÁI & HỌC PHÍ</small>
            </div>
          </div>
          <div className="receipt-print-badge">
            <CheckCircle2 size={16} />
            <span>ĐÃ THANH TOÁN</span>
          </div>
        </div>

        <div className="receipt-print-title">
          <h3>BIÊN NHẬN THU HỌC PHÍ</h3>
          <p>
            Mã biên nhận: <strong>{receiptCode}</strong> · Ngày ghi nhận:{' '}
            <strong>{paidDate || '—'}</strong>
          </p>
        </div>

        <dl className="receipt-print-grid">
          <div>
            <dt>
              <User size={14} /> Võ sinh nộp phí
            </dt>
            <dd>
              <strong>{student?.fullName || receipt.studentName || '—'}</strong>
              {student?.studentCode ? ` (${student.studentCode})` : ''}
            </dd>
          </div>
          <div>
            <dt>
              <Building2 size={14} /> Lớp học
            </dt>
            <dd>{className || receipt.className || '—'}</dd>
          </div>
          <div>
            <dt>
              <CalendarDays size={14} /> Kỳ thu học phí
            </dt>
            <dd>{receipt.period || '—'}</dd>
          </div>
          <div>
            <dt>
              <CreditCard size={14} /> Hình thức thanh toán
            </dt>
            <dd>{methodText}</dd>
          </div>
          <div>
            <dt>Mã hóa đơn gốc</dt>
            <dd>{receipt.invoiceCode || receipt.code || '—'}</dd>
          </div>
          <div>
            <dt>Người thu / Xác nhận</dt>
            <dd>
              {receipt.collectedByName ||
                receipt.reviewedName ||
                'Quản lý đơn vị'}
            </dd>
          </div>
        </dl>

        <div className="receipt-print-total">
          <span>Tổng số tiền đã nhận</span>
          <strong>{currency(receipt.amount)}</strong>
        </div>

        {receipt.reviewNote && (
          <p className="receipt-print-note">
            <strong>Ghi chú đối soát:</strong> {receipt.reviewNote}
          </p>
        )}

        <div className="receipt-print-signatures">
          <div>
            <strong>Người nộp tiền</strong>
            <small>(Ký, ghi rõ họ tên)</small>
          </div>
          <div>
            <strong>Người thu / Xác nhận</strong>
            <small>(Ký, ghi rõ họ tên)</small>
          </div>
        </div>
      </div>
    </Modal>
  );
}
