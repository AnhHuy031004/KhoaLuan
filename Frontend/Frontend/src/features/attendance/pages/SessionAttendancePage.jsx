import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CalendarDays,
  Check,
  CheckCheck,
  Clock3,
  LockKeyhole,
  MapPin,
  Users,
  RefreshCw,
} from 'lucide-react';
import { sessionAttendanceService as service } from '../services/sessionAttendanceService.js';
import { useRemote } from '../../../hooks/useRemote.js';
import { useAuth } from '../../../contexts/AuthContext.jsx';
import { useToast } from '../../../contexts/ToastContext.jsx';
import { api } from '../../../services/api.js';
import { can } from '../../../utils/permissions.js';
import { formatDate, initials, statusLabels } from '../../../utils/format.js';
import config from '../module.js';
import OrganizationScope from '../../../components/common/OrganizationScope.jsx';
import Button from '../../../components/common/Button.jsx';
import Modal from '../../../components/common/Modal.jsx';
import Loading from '../../../components/common/Loading.jsx';
import ErrorState from '../../../components/common/ErrorState.jsx';
import EmptyState from '../../../components/common/EmptyState.jsx';
import ExportSystemButton from '../../../components/common/ExportSystemButton.jsx';
const isPresent = (row) => ['PRESENT', 'LATE'].includes(row.status);
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export default function SessionAttendancePage() {
  const { user } = useAuth(),
    toast = useToast(),
    [url] = useSearchParams();
  const wardScope = url.get('wardId') || '',
    clubScope = url.get('clubId') || '';
  const [date, setDate] = useState(''),
    [sessionId, setSessionId] = useState(''),
    [selected, setSelected] = useState([]),
    [dialog, setDialog] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(null);
  const dates = useRemote(
    (signal) => service.dates(signal),
    [user.id, wardScope, clubScope],
  );
  useEffect(() => {
    const options = dates.data?.dates || [];
    if (!options.includes(date))
      setDate(
        options.includes(today())
          ? today()
          : options.find((d) => d >= today()) || options.at(-1) || '',
      );
  }, [dates.data]);
  const sessions = useRemote(
    (signal) =>
      date
        ? service.sessions(date, signal)
        : Promise.resolve({ items: [] }),
    [date, user.id, wardScope, clubScope],
  );
  const roster = useRemote(
    (signal) =>
      sessionId ? service.roster(sessionId, signal) : Promise.resolve(null),
    [sessionId, user.id, wardScope, clubScope],
  );
  useEffect(() => {
    setSessionId('');
    setSelected([]);
    setDialog(null);
    setError(null);
  }, [date, wardScope, clubScope]);
  useEffect(() => {
    setSelected([]);
    setDialog(null);
    setError(null);
  }, [sessionId]);
  useEffect(() => {
    if (!api.subscribeResource) return;
    const reloadAll = () => {
      dates.reload();
      if (date) sessions.reload();
      if (sessionId) roster.reload();
    };
    const offAttendance = api.subscribeResource('attendance', reloadAll);
    const offSchedules = api.subscribeResource('schedules', reloadAll);
    const offLeaves = api.subscribeResource('leaves', () => {
      if (sessionId) roster.reload();
    });
    return () => {
      offAttendance?.();
      offSchedules?.();
      offLeaves?.();
    };
  }, [date, sessionId, dates.reload, sessions.reload, roster.reload]);
  const data = roster.data?.id === sessionId ? roster.data : null;
  const editable = can(config, user.role, 'E'),
    closed = data?.status === 'CLOSED';
  const rows = data?.rows || [],
    eligible = rows.filter((r) => !isPresent(r));
  const locked = busy || roster.loading || closed || !editable;
  const toggle = (id) =>
    setSelected((v) =>
      v.includes(id) ? v.filter((x) => x !== id) : [...v, id],
    );
  async function confirm() {
    if (!dialog || busy) return;
    setBusy(true);
    setError(null);
    try {
      if (dialog.kind === 'close') await service.close(sessionId);
      else await service.present(sessionId, dialog.ids);
      toast(
        dialog.kind === 'close'
          ? 'Đã chốt điểm danh buổi học thành công.'
          : 'Xác nhận học viên có mặt thành công.',
      );
      setDialog(null);
      setSelected([]);
      roster.reload();
      sessions.reload();
    } catch (e) {
      setError(e);
      if (e.status === 409) {
        roster.reload();
        sessions.reload();
      }
    } finally {
      setBusy(false);
    }
  }
  function choose(id) {
    if (busy) return;
    setSelected([]);
    setDialog(null);
    setError(null);
    setSessionId(id);
  }
  return (
    <div className="feature-page attendance-page">
      <OrganizationScope />
      <div className="page-heading">
        <div>
          <div className="section-kicker">
            ĐÀO TẠO
            <span />
            VOVINAM
          </div>
          <h1>Điểm danh</h1>
          <p>
            Chọn ngày và buổi tập, xác nhận học viên có mặt rồi chốt điểm danh.
          </p>
        </div>
        <div className="heading-actions">
          <ExportSystemButton />
          <Button
            disabled={!data || locked || !rows.length || selected.length > 0}
            onClick={() => {
              setError(null);
              setDialog({ kind: 'close' });
            }}
          >
            <LockKeyhole size={17} />
            Chốt điểm danh buổi học
          </Button>
        </div>
      </div>
      <section className="panel attendance-session-picker">
        <div className="panel-heading">
          <h2>
            <CalendarDays size={20} />
            1. Chọn ngày điểm danh
          </h2>
          <button
            className="icon-btn bordered"
            aria-label="Tải lại lịch điểm danh"
            disabled={busy}
            onClick={() => {
              dates.reload();
              sessions.reload();
              roster.reload();
            }}
          >
            <RefreshCw size={17} />
          </button>
        </div>
        <div className="attendance-date">
          <label className="field">
            <span>Ngày điểm danh</span>
            <select
              aria-label="Ngày điểm danh"
              value={date}
              disabled={busy || dates.loading}
              onChange={(e) => setDate(e.target.value)}
            >
              <option value="">Chọn ngày có lịch tập</option>
              {(dates.data?.dates || []).map((d) => (
                <option key={d} value={d}>
                  {formatDate(d)}
                  {d === today() ? ' · Hôm nay' : ''}
                </option>
              ))}
            </select>
          </label>
          <p>
            Hiển thị các buổi tập thuộc phạm vi phụ trách trong ngày đã chọn.
          </p>
        </div>
        {dates.error ? (
          <ErrorState error={dates.error} retry={dates.reload} />
        ) : sessions.error ? (
          <ErrorState error={sessions.error} retry={sessions.reload} />
        ) : sessions.loading || dates.loading ? (
          <Loading label="Đang tải các buổi tập…" />
        ) : !sessions.data?.items.length ? (
          <EmptyState
            text="Không có buổi tập trong ngày này"
            description="Tạo hoặc cập nhật buổi tập tại Lịch tập để hiển thị tại đây."
          />
        ) : (
          <>
            <div className="attendance-step-title">
              2. Chọn buổi tập cần điểm danh{' '}
              <span className="count-pill">
                {sessions.data.items.length} buổi
              </span>
            </div>
            <div className="attendance-sessions">
              {sessions.data.items.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  aria-label={`Chọn buổi ${s.className} ${s.startTime}`}
                  aria-pressed={sessionId === s.id}
                  disabled={busy}
                  className={
                    'attendance-session ' +
                    (sessionId === s.id ? 'is-selected' : '')
                  }
                  onClick={() => choose(s.id)}
                >
                  <div>
                    <strong>{s.className}</strong>
                    <span
                      className={
                        'session-state ' +
                        (s.attendanceStatus === 'CLOSED' ? 'is-closed' : '')
                      }
                    >
                      {s.attendanceStatus === 'CLOSED' ? 'Đã chốt' : 'Đang mở'}
                    </span>
                  </div>
                  <span>
                    <Clock3 size={15} />
                    {s.startTime} – {s.endTime}
                  </span>
                  <span>
                    <MapPin size={15} />
                    {s.location}
                  </span>
                  <span>
                    <Users size={15} />
                    {s.rosterCount} học viên · {s.instructorName}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </section>
      {sessionId ? (
        roster.loading ? (
          <section className="panel">
            <Loading label="Đang tải danh sách học viên của buổi tập…" />
          </section>
        ) : roster.error ? (
          <ErrorState error={roster.error} retry={roster.reload} />
        ) : (
          data && (
            <section className="panel attendance-roster">
              <div className="data-panel-title">
                <div>
                  <h2>
                    {data.className}
                    <span className="count-pill">{rows.length} học viên</span>
                  </h2>
                  <p>
                    {formatDate(data.sessionDate)} · {data.startTime} –{' '}
                    {data.endTime} · {data.location}
                  </p>
                </div>
                <Button
                  disabled={locked || !selected.length}
                  onClick={() => {
                    setError(null);
                    setDialog({ kind: 'present', ids: [...selected] });
                  }}
                >
                  <CheckCheck size={18} />
                  Có mặt{selected.length ? ` (${selected.length})` : ''}
                </Button>
              </div>
              <div className="attendance-totals">
                <span>
                  <i className="attendance-dot present" />
                  Có mặt <strong>{data.counts.present}</strong>
                </span>
                <span>
                  <i className="attendance-dot" />
                  {closed ? 'Vắng mặt' : 'Chưa có mặt'}{' '}
                  <strong>
                    {closed
                      ? data.counts.absent
                      : rows.length - data.counts.present}
                  </strong>
                </span>
                {data.counts.excused > 0 && (
                  <span>
                    Có phép <strong>{data.counts.excused}</strong>
                  </span>
                )}
                <span className="attendance-lock">
                  {closed ? (
                    <>
                      <LockKeyhole size={16} />
                      Đã chốt ·{' '}
                      {new Date(data.closedAt).toLocaleString('vi-VN')}
                    </>
                  ) : (
                    <>
                      <Clock3 size={16} />
                      Có thể bổ sung học viên đến muộn trước khi chốt
                    </>
                  )}
                </span>
              </div>
              {selected.length > 0 && (
                <p className="attendance-hint">
                  Đã chọn {selected.length} học viên. Bấm “Có mặt” và xác nhận
                  trước khi chốt buổi.
                </p>
              )}
              {error && !dialog && <ErrorState error={error} />}
              {!rows.length ? (
                <EmptyState
                  text="Buổi tập chưa có học viên"
                  description="Kiểm tra phân lớp và trạng thái hoạt động của học viên."
                />
              ) : (
                <div className="table-scroll">
                  <table className="attendance-table">
                    <thead>
                      <tr>
                        <th>
                          <input
                            type="checkbox"
                            aria-label="Chọn tất cả học viên chưa có mặt"
                            disabled={locked || !eligible.length}
                            checked={
                              eligible.length > 0 &&
                              eligible.every((r) =>
                                selected.includes(r.studentId),
                              )
                            }
                            ref={(el) => {
                              if (el)
                                el.indeterminate =
                                  selected.length > 0 &&
                                  selected.length < eligible.length;
                            }}
                            onChange={(e) =>
                              setSelected(
                                e.target.checked
                                  ? eligible.map((r) => r.studentId)
                                  : [],
                              )
                            }
                          />
                        </th>
                        <th>STT</th>
                        <th>Học viên</th>
                        <th>Mã học viên</th>
                        <th>Trạng thái</th>
                        <th>Thời điểm xác nhận</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, i) => (
                        <tr
                          key={r.studentId}
                          className={
                            isPresent(r) ? 'attendance-confirmed' : ''
                          }
                        >
                          <td>
                            <input
                              type="checkbox"
                              aria-label={'Chọn ' + r.fullName}
                              checked={
                                isPresent(r) || selected.includes(r.studentId)
                              }
                              disabled={locked || isPresent(r)}
                              onChange={() => toggle(r.studentId)}
                            />
                          </td>
                          <td>{i + 1}</td>
                          <td>
                            <div className="student-name">
                              <span className="avatar">
                                {initials(r.fullName)}
                              </span>
                              <strong>{r.fullName}</strong>
                            </div>
                          </td>
                          <td>{r.studentCode}</td>
                          <td>
                            <span
                              className={
                                'attendance-status ' +
                                (isPresent(r)
                                  ? 'present'
                                  : r.status === 'EXCUSED'
                                    ? 'excused'
                                    : closed
                                      ? 'absent'
                                      : 'waiting')
                              }
                            >
                              {isPresent(r) && <Check size={14} />}{' '}
                              {r.status === 'UNMARKED'
                                ? 'Chưa có mặt'
                                : statusLabels[r.status] || r.status}
                            </span>
                          </td>
                          <td>
                            {r.confirmedAt
                              ? new Date(r.confirmedAt).toLocaleString('vi-VN')
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )
        )
      ) : (
        <section className="panel">
          <EmptyState
            text="Chọn một buổi tập để bắt đầu"
            description="Danh sách học viên sẽ hiển thị đầy đủ theo lớp hoặc phân công của buổi tập."
          />
        </section>
      )}
      {dialog && data && (
        <Modal
          wide
          title={
            dialog.kind === 'close'
              ? 'Chốt điểm danh buổi học?'
              : 'Xác nhận học viên có mặt'
          }
          subtitle={`${data.className} · ${formatDate(data.sessionDate)} · ${data.startTime} – ${data.endTime}`}
          onClose={() => !busy && setDialog(null)}
        >
          {dialog.kind === 'close' ? (
            <>
              <p className="confirm-copy">
                Đã có mặt: <strong>{data.counts.present}</strong> / {rows.length}{' '}
                học viên. Những học viên chưa có mặt sẽ được ghi nhận vắng (hoặc
                có phép nếu đã được duyệt đơn nghỉ).
              </p>
              <p className="data-warning">
                Sau khi chốt, không thể bổ sung hoặc thay đổi điểm danh của buổi
                này.
              </p>
            </>
          ) : (
            <>
              <p className="confirm-copy">
                Xác nhận {dialog.ids.length} học viên sau có mặt tại buổi tập:
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
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => setDialog(null)}
            >
              Hủy
            </Button>
            <Button disabled={busy} onClick={confirm}>
              {busy
                ? 'Đang xử lý…'
                : dialog.kind === 'close'
                  ? 'Xác nhận chốt điểm danh'
                  : 'Xác nhận'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
