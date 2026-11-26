import React, { useState, useMemo, useEffect } from 'react';
import { CalendarPlus, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Modal from '../../../components/common/Modal.jsx';
import Button from '../../../components/common/Button.jsx';
import { useToast } from '../../../contexts/ToastContext.jsx';
import { api } from '../../../services/api.js';
import { formatDate } from '../../../utils/format.js';
import {
  WEEKDAY_OPTIONS,
  generateRecurringSessions,
} from '../../../utils/recurringSchedule.js';
import schedulesService from '../services/schedulesService.js';

export default function RecurringScheduleModal({ onClose, onCreated }) {
  const toast = useToast();
  const todayIso = new Date().toISOString().slice(0, 10);

  const [classes, setClasses] = useState([]);
  const [existing, setExisting] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classId, setClassId] = useState('');
  const [startDate, setStartDate] = useState(todayIso);
  const [weekdays, setWeekdays] = useState([1, 3, 5]);
  const [weeks, setWeeks] = useState(4);
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('19:30');
  const [location, setLocation] = useState('Sân tập chính CLB');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      api.request('/lookups', {
        signal: controller.signal,
        query: { module: 'schedules' },
      }),
      schedulesService.list({ limit: 500 }, controller.signal),
    ])
      .then(([lookup, listRes]) => {
        const clsList = (lookup?.classes || []).filter(
          (c) =>
            !lookup?.writableClassIds ||
            lookup.writableClassIds.includes(c.id),
        );
        setClasses(clsList);
        if (clsList.length) setClassId(clsList[0].id);
        setExisting(listRes?.items || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const preview = useMemo(
    () =>
      generateRecurringSessions({
        classId,
        startDate,
        weekdays,
        weeks,
        startTime,
        endTime,
        location,
        existingSessions: existing,
      }),
    [classId, startDate, weekdays, weeks, startTime, endTime, location, existing],
  );

  const creatable = useMemo(
    () => preview.sessions.filter((s) => !s.duplicate),
    [preview.sessions],
  );
  const duplicateCount = preview.sessions.length - creatable.length;

  function toggleWeekday(day) {
    setWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  async function handleSubmit() {
    if (busy || preview.error || !creatable.length) return;
    setBusy(true);
    let created = 0;
    let failed = 0;
    try {
      for (const item of creatable) {
        try {
          const { duplicate, ...payload } = item;
          await schedulesService.create(payload);
          created += 1;
        } catch {
          failed += 1;
        }
      }
      if (created > 0) {
        toast(
          failed
            ? `Đã tạo ${created} buổi tập mới (${failed} buổi gặp lỗi).`
            : `Đã tạo thành công ${created} buổi tập lặp theo tuần.`,
        );
        onCreated?.();
        onClose();
      } else {
        toast('Không thể tạo lịch lặp. Vui lòng kiểm tra lại dữ liệu.', 'error');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      wide
      title="Tạo lịch tập lặp theo tuần"
      subtitle="Chọn thứ trong tuần, số tuần lặp và xem trước danh sách buổi tập trước khi lưu"
      onClose={busy ? undefined : onClose}
      footer={
        <>
          <Button variant="secondary" disabled={busy} onClick={onClose}>
            Hủy
          </Button>
          <Button
            variant="primary"
            disabled={busy || loading || Boolean(preview.error) || !creatable.length}
            onClick={handleSubmit}
          >
            <CalendarPlus size={16} />
            {busy
              ? 'Đang tạo lịch…'
              : `Tạo ${creatable.length} buổi tập mới`}
          </Button>
        </>
      }
    >
      <div className="recurring-modal-body">
        <div className="recurring-form-grid">
          <label className="form-field">
            <span>Lớp học *</span>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              disabled={loading || busy}
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Ngày bắt đầu *</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={busy}
            />
          </label>
          <label className="form-field">
            <span>Số tuần lặp (1–16)</span>
            <input
              type="number"
              min={1}
              max={16}
              value={weeks}
              onChange={(e) => setWeeks(Number(e.target.value))}
              disabled={busy}
            />
          </label>
          <label className="form-field">
            <span>Địa điểm tập *</span>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ví dụ: Sân nhà thi đấu phường"
              disabled={busy}
            />
          </label>
          <label className="form-field">
            <span>Giờ bắt đầu *</span>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              disabled={busy}
            />
          </label>
          <label className="form-field">
            <span>Giờ kết thúc *</span>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              disabled={busy}
            />
          </label>
        </div>

        <div className="recurring-weekdays">
          <span>Chọn các thứ trong tuần *</span>
          <div className="weekday-chips">
            {WEEKDAY_OPTIONS.map((opt) => {
              const active = weekdays.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={active}
                  className={`weekday-chip ${active ? 'active' : ''}`}
                  onClick={() => toggleWeekday(opt.value)}
                  disabled={busy}
                >
                  {opt.short}
                </button>
              );
            })}
          </div>
        </div>

        {preview.error ? (
          <div className="cash-confirm-warning" role="alert">
            <AlertTriangle size={16} />
            <span>{preview.error}</span>
          </div>
        ) : (
          <div className="recurring-preview-box">
            <div className="recurring-preview-header">
              <strong>
                <CheckCircle2 size={15} /> Xem trước: {creatable.length} buổi mới
              </strong>
              {duplicateCount > 0 && (
                <small>
                  (Bỏ qua {duplicateCount} buổi đã tồn tại trùng giờ)
                </small>
              )}
            </div>
            <ul className="recurring-preview-list">
              {preview.sessions.slice(0, 18).map((s) => (
                <li
                  key={`${s.sessionDate}-${s.startTime}`}
                  className={s.duplicate ? 'is-duplicate' : ''}
                >
                  <span>{formatDate(s.sessionDate)}</span>
                  <small>
                    {s.startTime}–{s.endTime}
                    {s.duplicate ? ' · Đã có' : ''}
                  </small>
                </li>
              ))}
              {preview.sessions.length > 18 && (
                <li className="more-count">
                  +{preview.sessions.length - 18} buổi nữa…
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
}
