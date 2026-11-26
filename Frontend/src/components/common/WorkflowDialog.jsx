import React from 'react';
import Modal from './Modal.jsx';
import Button from './Button.jsx';
import ErrorState from './ErrorState.jsx';
import { ROLES, roleLabel } from '../../utils/permissions.js';
import { formatDate } from '../../utils/format.js';
export default function WorkflowDialog({
  config,
  dialog,
  user,
  busy,
  resolve,
  actionError,
  onClose,
  onAct,
}) {
  return (
    <Modal
      title={
        config.id === 'leaves' && dialog.kind === 'approve'
          ? 'Duyệt đơn xin nghỉ?'
          : config.id === 'leaves' && dialog.kind === 'reject'
            ? 'Từ chối đơn xin nghỉ?'
            : dialog.kind === 'delete'
              ? 'Xóa bản ghi?'
              : dialog.kind === 'approve'
                ? 'Phê duyệt thông tin'
                : dialog.kind === 'reject'
                  ? 'Từ chối yêu cầu?'
                  : config.id === 'announcements'
                    ? 'Phát hành thông báo?'
                    : 'Gửi xác nhận thanh toán?'
      }
      onClose={onClose}
      busy={busy}
    >
      {config.id === 'discounts' &&
        ['approve', 'reject'].includes(dialog.kind) && (
          <div className="leave-confirm-summary">
            <strong>{resolve('studentId', dialog.row.studentId)}</strong>
            <span>
              {resolve('classId', dialog.row.classId)} · Tháng{' '}
              {dialog.row.period}
            </span>
            <span>
              {resolve('reliefType', dialog.row.reliefType)} ·{' '}
              {dialog.row.percent}%
            </span>
            <p>{dialog.row.reason}</p>
            <small>
              Người đề xuất: {dialog.row.submittedName}
              {dialog.row.submittedRoleLabel
                ? ` · ${dialog.row.submittedRoleLabel}`
                : ''}
            </small>
            <small style={{ display: 'block', marginTop: 4, color: '#f3c969' }}>
              Cấp phê duyệt: {user.fullName} · {roleLabel(user)}
            </small>
          </div>
        )}
      {config.id === 'leaves' &&
        ['approve', 'reject'].includes(dialog.kind) && (
          <div className="leave-confirm-summary">
            <strong>{resolve('studentId', dialog.row.studentId)}</strong>
            <span>
              {resolve('classId', dialog.row.classId)} ·{' '}
              {formatDate(dialog.row.sessionDate)}
            </span>
            <p>{dialog.row.reason}</p>
            <small>
              Người xử lý: {user.fullName} · {ROLES[user.role]}
            </small>
          </div>
        )}
      <p className="confirm-copy">
        {dialog.kind === 'delete'
          ? 'Bản ghi sẽ được xóa khỏi hệ thống. Dữ liệu đang có liên kết sẽ được bảo vệ.'
          : dialog.kind === 'approve' && config.id === 'payment-confirmations'
            ? 'Chỉ xác nhận khi đã đối chiếu khoản thanh toán. Hóa đơn và lịch sử giao dịch sẽ được cập nhật.'
            : dialog.kind === 'process' && config.id === 'online-payments'
              ? 'Yêu cầu sẽ được chuyển đến người phụ trách xác nhận. Hóa đơn chỉ được ghi nhận đã thanh toán sau khi khoản thu được đối chiếu.'
              : config.id === 'leaves'
                ? 'Đơn chỉ được xử lý một lần. Sau khi xác nhận, các người phụ trách khác sẽ chỉ xem kết quả.'
                : 'Vui lòng kiểm tra thông tin trước khi tiếp tục.'}
      </p>
      {actionError && <ErrorState error={actionError} />}
      <div className="modal-actions">
        <Button variant="secondary" disabled={busy} onClick={onClose}>
          Hủy bỏ
        </Button>
        {dialog.kind === 'approve' && config.id === 'exam-results' ? (
          <>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => onAct('approve', dialog.row, { outcome: 'FAIL' })}
            >
              Chưa đạt
            </Button>
            <Button
              disabled={busy}
              onClick={() => onAct('approve', dialog.row, { outcome: 'PASS' })}
            >
              Duyệt đạt
            </Button>
          </>
        ) : (
          <Button
            variant={
              ['delete', 'reject'].includes(dialog.kind) ? 'danger' : 'primary'
            }
            disabled={busy}
            onClick={() => onAct(dialog.kind, dialog.row)}
          >
            {busy
              ? 'Đang xử lý…'
              : dialog.kind === 'delete'
                ? 'Xóa bản ghi'
                : 'Xác nhận'}
          </Button>
        )}
      </div>
    </Modal>
  );
}
