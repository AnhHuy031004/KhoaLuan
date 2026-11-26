import React from 'react';
import { AlertTriangle, Banknote, CheckCircle2 } from 'lucide-react';
import Modal from '../../../components/common/Modal.jsx';
import Button from '../../../components/common/Button.jsx';
import { currency } from '../../../utils/format.js';

export default function CashConfirmModal({
  invoices,
  studentMap,
  classMap,
  pendingTransferInvoiceIds,
  busy,
  onCancel,
  onConfirm,
}) {
  if (!invoices || !invoices.length) return null;

  const totalAmount = invoices.reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
  const conflicting = invoices.filter((inv) =>
    pendingTransferInvoiceIds?.has(inv.id),
  );

  return (
    <Modal
      title="Xác nhận thu học phí tiền mặt"
      subtitle={`Kiểm tra kỹ danh sách ${invoices.length} khoản thu trước khi ghi nhận`}
      onClose={busy ? undefined : onCancel}
      footer={
        <>
          <Button variant="secondary" disabled={busy} onClick={onCancel}>
            Hủy
          </Button>
          <Button variant="primary" disabled={busy} onClick={onConfirm}>
            <Banknote size={16} />
            {busy
              ? 'Đang ghi nhận…'
              : `Xác nhận thu ${currency(totalAmount)}`}
          </Button>
        </>
      }
    >
      <div className="cash-confirm-body">
        <div className="cash-confirm-summary">
          <div>
            <span>Số khoản thu</span>
            <strong>{invoices.length} hóa đơn</strong>
          </div>
          <div>
            <span>Tổng tiền mặt thực thu</span>
            <strong className="cash-confirm-money">
              {currency(totalAmount)}
            </strong>
          </div>
        </div>

        {conflicting.length > 0 && (
          <div className="cash-confirm-warning" role="alert">
            <AlertTriangle size={18} />
            <div>
              <strong>
                Có {conflicting.length} hóa đơn đang có yêu cầu đối soát chuyển
                khoản chờ duyệt!
              </strong>
              <p>
                Nếu xác nhận thu tiền mặt ngay, hệ thống sẽ tự động đóng yêu cầu
                chuyển khoản chờ trước đó (vẫn giữ lịch sử đối chiếu). Hãy kiểm
                tra để tránh thu trùng hai lần.
              </p>
            </div>
          </div>
        )}

        <ul className="cash-confirm-list" aria-label="Danh sách hóa đơn sẽ thu">
          {invoices.map((inv) => {
            const st = studentMap[inv.studentId];
            const hasPending = pendingTransferInvoiceIds?.has(inv.id);
            return (
              <li key={inv.id} className="cash-confirm-item">
                <div>
                  <strong>
                    {st?.fullName || inv.studentName || inv.code}
                    {st?.studentCode ? ` (${st.studentCode})` : ''}
                  </strong>
                  <small>
                    {inv.code} · {classMap[inv.classId] || 'Lớp học'} · Kỳ{' '}
                    {inv.period}
                    {hasPending ? ' · Đang có yêu cầu chuyển khoản chờ' : ''}
                  </small>
                </div>
                <span className="cash-confirm-item-amount">
                  {currency(inv.amount)}
                </span>
              </li>
            );
          })}
        </ul>

        <p className="cash-confirm-hint">
          <CheckCircle2 size={14} /> Sau khi xác nhận, biên nhận tiền mặt sẽ
          được tạo tự động và có thể in ngay.
        </p>
      </div>
    </Modal>
  );
}
