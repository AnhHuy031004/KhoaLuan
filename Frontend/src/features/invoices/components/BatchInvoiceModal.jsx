import React, { useState, useMemo, useEffect } from 'react';
import { Layers, CheckCircle2, AlertCircle } from 'lucide-react';
import Modal from '../../../components/common/Modal.jsx';
import Button from '../../../components/common/Button.jsx';
import ErrorState from '../../../components/common/ErrorState.jsx';
import { currency } from '../../../utils/format.js';

const defaultMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const defaultDueDate = (ym) => {
  if (!ym || !/^\d{4}-\d{2}$/.test(ym)) {
    const d = new Date();
    d.setDate(10);
    return d.toISOString().slice(0, 10);
  }
  return `${ym}-10`;
};

export default function BatchInvoiceModal({
  classes,
  students,
  existingInvoices,
  onClose,
  onGenerate,
}) {
  const activeClasses = useMemo(
    () => (classes || []).filter((c) => c.status !== 'PAUSED'),
    [classes],
  );
  const [classId, setClassId] = useState(activeClasses[0]?.id || '');
  const [period, setPeriod] = useState(defaultMonth);
  const [dueDate, setDueDate] = useState(() => defaultDueDate(defaultMonth()));
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const selectedClass = useMemo(
    () => activeClasses.find((c) => c.id === classId) || null,
    [activeClasses, classId],
  );

  useEffect(() => {
    if (selectedClass && selectedClass.tuition > 0) {
      setAmount(String(selectedClass.tuition));
    } else if (!amount) {
      setAmount('400000');
    }
  }, [classId]);

  useEffect(() => {
    setDueDate(defaultDueDate(period));
  }, [period]);

  const preview = useMemo(() => {
    if (!classId || !period) return { eligible: [], skipped: [] };
    const classStudents = (students || []).filter(
      (s) => s.classId === classId && s.status !== 'PAUSED',
    );
    const existingKeys = new Set(
      (existingInvoices || [])
        .filter((inv) => inv.classId === classId && inv.period === period)
        .map((inv) => inv.studentId),
    );
    const eligible = classStudents.filter((s) => !existingKeys.has(s.id));
    const skipped = classStudents.filter((s) => existingKeys.has(s.id));
    return { eligible, skipped };
  }, [classId, period, students, existingInvoices]);

  const numericAmount = Number(amount || 0);
  const totalExpected = preview.eligible.length * numericAmount;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!classId) {
      setError({ message: 'Vui lòng chọn lớp học.' });
      return;
    }
    if (!numericAmount || numericAmount <= 0) {
      setError({ message: 'Mức học phí gốc phải lớn hơn 0.' });
      return;
    }
    if (!preview.eligible.length) {
      setError({
        message:
          'Tất cả võ sinh đang học trong lớp này đã có hóa đơn cho kỳ đã chọn.',
      });
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onGenerate({
        classId,
        period,
        dueDate,
        amount: numericAmount,
        students: preview.eligible,
      });
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  }

  return (
    <Modal
      wide
      title="Tạo kỳ thu học phí hàng loạt theo lớp"
      subtitle="Hệ thống tự lọc võ sinh đang theo học và bỏ qua người đã có hóa đơn trong cùng kỳ"
      onClose={busy ? undefined : onClose}
      footer={
        <>
          <Button variant="secondary" disabled={busy} onClick={onClose}>
            Hủy
          </Button>
          <Button
            variant="primary"
            disabled={busy || !preview.eligible.length || numericAmount <= 0}
            onClick={handleSubmit}
          >
            <Layers size={16} />
            {busy
              ? 'Đang tạo hóa đơn…'
              : `Tạo ${preview.eligible.length} hóa đơn`}
          </Button>
        </>
      }
    >
      <form className="stack-form" onSubmit={handleSubmit}>
        <div className="batch-invoice-grid">
          <label className="field">
            <span>Lớp học *</span>
            <select
              value={classId}
              disabled={busy}
              onChange={(e) => setClassId(e.target.value)}
              required
            >
              <option value="">Chọn lớp học</option>
              {activeClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Tháng thu *</span>
            <input
              type="month"
              value={period}
              disabled={busy}
              onChange={(e) => setPeriod(e.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>Học phí gốc (VNĐ) *</span>
            <input
              type="number"
              min="1000"
              step="1000"
              value={amount}
              disabled={busy}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Ví dụ: 400000"
              required
            />
          </label>

          <label className="field">
            <span>Hạn thanh toán *</span>
            <input
              type="date"
              value={dueDate}
              disabled={busy}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </label>
        </div>

        <div className="batch-invoice-preview" role="status">
          <div className="batch-preview-stat">
            <span>Sẽ tạo mới</span>
            <strong className="is-positive">
              <CheckCircle2 size={16} /> {preview.eligible.length} võ sinh
            </strong>
          </div>
          <div className="batch-preview-stat">
            <span>Đã có hóa đơn (bỏ qua)</span>
            <strong>{preview.skipped.length} võ sinh</strong>
          </div>
          <div className="batch-preview-stat">
            <span>Tổng dự thu</span>
            <strong className="is-money">{currency(totalExpected)}</strong>
          </div>
        </div>

        {preview.eligible.length === 0 && classId && (
          <div className="batch-invoice-note">
            <AlertCircle size={16} />
            <span>
              Không có võ sinh mới nào cần lập hóa đơn cho lớp và tháng đã chọn.
            </span>
          </div>
        )}

        {error && <ErrorState error={error} />}
      </form>
    </Modal>
  );
}
