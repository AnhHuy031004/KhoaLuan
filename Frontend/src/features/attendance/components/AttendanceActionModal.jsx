import React from 'react';
import { Check } from 'lucide-react';
import Modal from '../../../components/common/Modal.jsx';
import Button from '../../../components/common/Button.jsx';
import ErrorState from '../../../components/common/ErrorState.jsx';
import { formatDate, statusLabels } from '../../../utils/format.js';

export default function AttendanceActionModal({
  dialog,
  data,
  rows,
  reason,
  setReason,
  correctionStatus,
  setCorrectionStatus,
  isFutureSession,
  canEarlyClose,
  busy,
  error,
  onClose,
  onConfirm,
}) {
  if (!dialog || !data) return null;

  const isCorrection = ['correct', 'undo'].includes(dialog.kind);
  const isClose = dialog.kind === 'close';
  const isDirty = Boolean(reason.trim());
  const requestClose = () => {
    if (busy) return;
    if (
      isDirty &&
      typeof window !== 'undefined' &&
      !window.confirm('Bạn có nội dung lý do chưa lưu. Bỏ thay đổi này?')
    ) {
      return;
    }
    onClose();
  };

  return (
    <Modal
      wide
      title={
        isCorrection
          ? 'Hiệu chỉnh điểm danh'
          : isClose
            ? 'Chốt điểm danh buổi học?'
            : 'Xác nhận võ sinh có mặt'
      }
      subtitle={`${data.className} · ${formatDate(data.sessionDate)} · ${data.startTime} – ${data.endTime}`}
      onClose={requestClose}
      busy={busy}
      dirty={false}
    >
      {isCorrection ? (
        <div className="stack-form">
          <p>
            Võ sinh:{' '}
            <strong>
              {rows.find((r) => r.studentId === dialog.studentId)?.fullName}
            </strong>
          </p>
          {dialog.kind === 'correct' && (
            <label className="field">
              Trạng thái đúng
              <select
                value={correctionStatus}
                onChange={(e) => setCorrectionStatus(e.target.value)}
              >
                {['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'].map((v) => (
                  <option key={v} value={v}>
                    {statusLabels[v]}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="field">
            Lý do bắt buộc
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do hiệu chỉnh để lưu nhật ký kiểm toán..."
            />
          </label>
          <p>Thay đổi được ghi lại cùng người xử lý và thời gian.</p>
        </div>
      ) : isClose ? (
        <>
          <p className="confirm-copy">
            Đã có mặt: <strong>{data.counts.present}</strong> / {rows.length} võ
            sinh. Những võ sinh chưa có mặt sẽ được ghi nhận vắng (hoặc có phép
            nếu đã được duyệt đơn nghỉ).
          </p>
          {isFutureSession && !canEarlyClose && (
            <p className="data-warning" role="alert">
              Buổi tập chưa kết thúc ({formatDate(data.sessionDate)}{' '}
              {data.endTime}). Huấn luyện viên chỉ được chốt điểm danh sau khi
              buổi tập kết thúc.
            </p>
          )}
          {isFutureSession && canEarlyClose && (
            <label className="field">
              Lý do chốt sớm bắt buộc (buổi tập chưa kết thúc)
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Nhập lý do ngoại lệ chốt điểm danh sớm để lưu nhật ký..."
              />
            </label>
          )}
          <p className="data-warning">
            Sau khi chốt, chỉ quản lý có quyền được hiệu chỉnh kèm lý do và nhật
            ký.
          </p>
        </>
      ) : (
        <>
          <p className="confirm-copy">
            Xác nhận {dialog.ids.length} võ sinh sau có mặt tại buổi tập:
          </p>
          <ul className="attendance-confirm-list">
            {rows
              .filter((r) => dialog.ids.includes(r.studentId))
              .map((r) => (
                <li key={r.studentId}>
                  <Check size={16} />
                  <strong>{r.fullName}</strong>
                  <span>{r.studentCode}</span>
                </li>
              ))}
          </ul>
        </>
      )}
      {error && <ErrorState error={error} />}
      <div className="modal-actions">
        <Button variant="secondary" disabled={busy} onClick={requestClose}>
          Hủy
        </Button>
        <Button
          disabled={
            busy ||
            (isCorrection && !reason.trim()) ||
            (isClose && isFutureSession && (!canEarlyClose || !reason.trim()))
          }
          onClick={onConfirm}
        >
          {busy
            ? 'Đang xử lý…'
            : isClose
              ? 'Xác nhận chốt điểm danh'
              : 'Xác nhận'}
        </Button>
      </div>
    </Modal>
  );
}
