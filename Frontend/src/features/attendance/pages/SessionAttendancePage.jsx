import useListFilters from '../../../hooks/useListFilters.js';
import { attendanceMatches } from '../../../config/uiPolicy.js';
import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  CalendarDays,
  Check,
  CheckCheck,
  Clock3,
  LockKeyhole,
  MapPin,
  Users,
  RefreshCw,
  Search,
  X,
  UserCheck,
  UserX,
  FileCheck2,
  Sparkles,
} from 'lucide-react';
import { sessionAttendanceService as service } from '../services/sessionAttendanceService.js';
import { useRemote } from '../../../hooks/useRemote.js';
import { useAuth } from '../../../contexts/AuthContext.jsx';
import { useToast } from '../../../contexts/ToastContext.jsx';
import { api } from '../../../services/api.js';
import { can } from '../../../utils/permissions.js';
import { formatDate, initials, statusLabels } from '../../../utils/format.js';
import { matchesOrganizationSearch } from '../../organization/navigation.js';
import config from '../module.js';
import OrganizationScope from '../../../components/common/OrganizationScope.jsx';
import Button from '../../../components/common/Button.jsx';
import AttendanceActionModal from '../components/AttendanceActionModal.jsx';
import Loading from '../../../components/common/Loading.jsx';
import ErrorState from '../../../components/common/ErrorState.jsx';
import EmptyState from '../../../components/common/EmptyState.jsx';
import FilteredExportButton from '../../../components/common/FilteredExportButton.jsx';

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

  const { values: filters, setters } = useListFilters({
    date: '',
    session: '',
    tab: 'ALL',
    q: '',
  });
  const {
      date,
      session: sessionId,
      tab: statusFilter,
      q: searchQuery,
    } = filters,
    {
      date: setDate,
      session: setSessionId,
      tab: setStatusFilter,
      q: setSearchQuery,
    } = setters;
  const [selected, setSelected] = useState([]),
    [dialog, setDialog] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(null),
    [reason, setReason] = useState(''),
    [correctionStatus, setCorrectionStatus] = useState('PRESENT');

  const dates = useRemote(
    (signal) => service.dates(signal),
    [user.id, wardScope, clubScope],
  );

  useEffect(() => {
    if (!dates.data) return;
    const options = dates.data.dates || [];
    if (!options.includes(date))
      setDate(
        options.includes(today())
          ? today()
          : options.find((d) => d >= today()) || options.at(-1) || '',
        { replace: true },
      );
  }, [dates.data]);

  const sessions = useRemote(
    (signal) =>
      date ? service.sessions(date, signal) : Promise.resolve({ items: [] }),
    [date, user.id, wardScope, clubScope],
  );

  // Tự động chọn buổi tập nếu ngày hiện tại chỉ có 1 buổi duy nhất; xóa chọn nếu buổi cũ không thuộc ngày mới
  useEffect(() => {
    const list = sessions.data?.items || [];
    if (sessionId && list.length > 0 && !list.some((s) => s.id === sessionId)) {
      setSessionId(list.length === 1 ? list[0].id : '', { replace: true });
    } else if (!sessionId && list.length === 1) {
      setSessionId(list[0].id, { replace: true });
    }
  }, [sessions.data]);

  const roster = useRemote(
    (signal) =>
      sessionId ? service.roster(sessionId, signal) : Promise.resolve(null),
    [sessionId, user.id, wardScope, clubScope],
  );

  useEffect(() => {
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

  const data =
    roster.data?.id === sessionId && roster.data.sessionDate === date
      ? roster.data
      : null;
  const editable = can(config, user.role, 'E'),
    closed = data?.status === 'CLOSED';
  const rows = data?.rows || [],
    eligible = rows.filter((r) => !isPresent(r));
  const locked = busy || roster.loading || closed || !editable;
  const isFutureSession = useMemo(() => {
    if (!data?.sessionDate) return false;
    const now = new Date();
    const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const nowHm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const endHm = data.endTime || '23:59';
    return data.sessionDate > todayIso;
  }, [data?.sessionDate, data?.endTime]);
  const canEarlyClose = ['ADMIN', 'MASTER'].includes(user?.role);

  // Thống kê chi tiết theo từng nhóm trạng thái
  const counts = useMemo(() => {
    const present = rows.filter((r) => isPresent(r)).length;
    const excused = rows.filter((r) => r.status === 'EXCUSED').length;
    const unmarked = rows.filter((r) =>
      attendanceMatches(r, 'UNMARKED', closed),
    ).length;
    return {
      all: rows.length,
      present,
      unmarked,
      excused,
    };
  }, [rows, closed]);

  // Lọc danh sách võ sinh theo Trạng thái + Từ khóa tìm kiếm
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (!attendanceMatches(r, statusFilter, closed)) return false;
      if (searchQuery.trim()) {
        return matchesOrganizationSearch(
          { name: r.fullName, title: r.studentCode },
          searchQuery,
        );
      }
      return true;
    });
  }, [rows, statusFilter, searchQuery, closed]);

  const visibleEligible = useMemo(
    () => filteredRows.filter((r) => !isPresent(r)),
    [filteredRows],
  );

  const toggle = (id) =>
    setSelected((v) =>
      v.includes(id) ? v.filter((x) => x !== id) : [...v, id],
    );

  async function confirm() {
    if (!dialog || busy) return;
    setBusy(true);
    setError(null);
    try {
      if (dialog.kind === 'correct') {
        await service.correct(sessionId, {
          studentId: dialog.studentId,
          status: correctionStatus,
          reason,
        });
      } else if (dialog.kind === 'undo') {
        await service.undo(sessionId, dialog.studentId, reason);
      } else if (dialog.kind === 'close') await service.close(sessionId, isFutureSession ? { earlyCloseReason: reason.trim() } : {});
      else await service.present(sessionId, dialog.ids);
      toast(
        ['correct', 'undo'].includes(dialog.kind)
          ? 'Đã hiệu chỉnh và lưu nhật ký.'
          : dialog.kind === 'close'
            ? 'Đã chốt điểm danh buổi học thành công.'
            : 'Xác nhận võ sinh có mặt thành công.',
      );
      setDialog(null);
      setSelected([]);
      setReason('');
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

  const allDates = dates.data?.dates || [];

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
          <h1>Điểm danh buổi tập</h1>
          <p>
            Chọn ngày và buổi tập, lọc nhanh võ sinh chưa điểm danh hoặc bấm
            “Điểm danh nhanh” chỉ với 1 chạm.
          </p>
        </div>
        <div className="heading-actions">
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
            1. Chọn ngày & buổi tập
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

        <div className="attendance-date-bar">
          <label className="field attendance-date-select">
            <span>Ngày điểm danh</span>
            <select
              aria-label="Ngày điểm danh"
              value={date}
              disabled={busy || dates.loading}
              onChange={(e) => setDate(e.target.value)}
            >
              <option value="">Chọn ngày có lịch tập</option>
              {allDates.map((d) => (
                <option key={d} value={d}>
                  {formatDate(d)}
                  {d === today() ? ' · Hôm nay' : ''}
                </option>
              ))}
            </select>
          </label>

          {/* Nút bấm chọn ngày nhanh cho người lớn tuổi */}
          {allDates.length > 0 && (
            <div className="attendance-quick-dates">
              <span className="quick-dates-label">Chọn nhanh ngày:</span>
              <div className="quick-dates-pills">
                {allDates.slice(0, 6).map((d) => (
                  <button
                    type="button"
                    key={d}
                    disabled={busy}
                    className={`quick-date-pill ${date === d ? 'active' : ''}`}
                    onClick={() => setDate(d)}
                  >
                    <CalendarDays size={15} />
                    <span>{formatDate(d)}</span>
                    {d === today() && <b className="today-tag">Hôm nay</b>}
                  </button>
                ))}
              </div>
            </div>
          )}
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
              2. Chọn lớp / buổi tập cần điểm danh{' '}
              <span className="count-pill">
                {sessions.data.items.length} buổi
              </span>
            </div>

            <div
              className="attendance-sessions"
              role="region"
              aria-label="Các buổi tập trong ngày"
              tabIndex={0}
            >
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
                    {s.rosterCount} võ sinh · {s.instructorName}
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
            <Loading label="Đang tải danh sách võ sinh của buổi tập…" />
          </section>
        ) : roster.error ? (
          <ErrorState error={roster.error} retry={roster.reload} />
        ) : (
          data && (
            <section className="panel attendance-roster">
              <div className="data-panel-title attendance-roster-header">
                <div>
                  <h2>
                    {data.className}
                    <span className="count-pill">{rows.length} võ sinh</span>
                  </h2>
                  <p>
                    {formatDate(data.sessionDate)} · {data.startTime} –{' '}
                    {data.endTime} · {data.location}
                  </p>
                </div>

                <div className="attendance-header-actions">
                  {!locked && eligible.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-quick-all"
                      disabled={busy}
                      onClick={() => {
                        setError(null);
                        setDialog({
                          kind: 'present',
                          ids: eligible.map((r) => r.studentId),
                        });
                      }}
                      title="Xác nhận tất cả võ sinh chưa điểm danh là Có mặt"
                    >
                      <Sparkles size={17} />
                      Chọn và xác nhận toàn buổi ({eligible.length})
                    </button>
                  )}

                  <Button
                    disabled={locked || !selected.length}
                    onClick={() => {
                      setError(null);
                      setDialog({ kind: 'present', ids: [...selected] });
                    }}
                  >
                    <CheckCheck size={18} />
                    Xác nhận có mặt ({selected.length})
                  </Button>
                </div>
              </div>

              {/* THANH CÔNG CỤ LỌC TRẠNG THÁI & TÌM KIẾM NHANH CHỐNG TRÔI DANH SÁCH */}
              <div
                className="attendance-filter-toolbar"
                role="region"
                aria-label="Bộ lọc điểm danh"
              >
                <div className="attendance-status-tabs">
                  <button
                    type="button"
                    className={`att-filter-tab ${statusFilter === 'ALL' ? 'is-active' : ''}`}
                    onClick={() => setStatusFilter('ALL')}
                  >
                    <Users size={17} />
                    <span>Tất cả</span>
                    <b className="att-tab-badge">{counts.all}</b>
                  </button>

                  <button
                    type="button"
                    className={`att-filter-tab tab-unmarked ${statusFilter === 'UNMARKED' ? 'is-active' : ''}`}
                    onClick={() => setStatusFilter('UNMARKED')}
                  >
                    <UserX size={17} />
                    <span>{closed ? 'Vắng mặt' : 'Chưa điểm danh'}</span>
                    <b className="att-tab-badge">{counts.unmarked}</b>
                  </button>

                  <button
                    type="button"
                    className={`att-filter-tab tab-present ${statusFilter === 'PRESENT' ? 'is-active' : ''}`}
                    onClick={() => setStatusFilter('PRESENT')}
                  >
                    <UserCheck size={17} />
                    <span>Đã có mặt</span>
                    <b className="att-tab-badge">{counts.present}</b>
                  </button>

                  {counts.excused > 0 && (
                    <button
                      type="button"
                      className={`att-filter-tab tab-excused ${statusFilter === 'EXCUSED' ? 'is-active' : ''}`}
                      onClick={() => setStatusFilter('EXCUSED')}
                    >
                      <FileCheck2 size={17} />
                      <span>Có phép</span>
                      <b className="att-tab-badge">{counts.excused}</b>
                    </button>
                  )}
                </div>

                <div className="attendance-search-box">
                  <Search size={18} className="att-search-icon" />
                  <input
                    type="text"
                    aria-label="Tìm tên hoặc mã võ sinh trong lớp"
                    placeholder="Gõ tên hoặc mã võ sinh (VD: VS0005, Nguyên)…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="att-search-clear"
                      aria-label="Xóa tìm kiếm"
                      onClick={() => setSearchQuery('')}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
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
                {(statusFilter !== 'ALL' || searchQuery) && (
                  <span className="att-showing-count">
                    Đang hiển thị: <strong>{filteredRows.length}</strong> /{' '}
                    {rows.length} võ sinh
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
                      Chọn võ sinh bằng dòng hoặc ô tích, rồi bấm Xác nhận có
                      mặt
                    </>
                  )}
                </span>
              </div>

              {selected.length > 0 && (
                <div className="attendance-selection-bar">
                  <span>
                    Đã chọn <strong>{selected.length}</strong> võ sinh chưa điểm
                    danh.
                  </span>
                  <div className="attendance-selection-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      disabled={busy}
                      onClick={() => setSelected([])}
                    >
                      Bỏ chọn
                    </button>
                    <Button
                      disabled={busy}
                      onClick={() =>
                        setDialog({ kind: 'present', ids: [...selected] })
                      }
                    >
                      <CheckCheck size={17} />
                      Xác nhận có mặt ({selected.length})
                    </Button>
                  </div>
                </div>
              )}

              {error && !dialog && <ErrorState error={error} />}

              {!rows.length ? (
                <EmptyState
                  text="Buổi tập chưa có võ sinh"
                  description="Kiểm tra phân lớp và trạng thái hoạt động của võ sinh."
                />
              ) : !filteredRows.length ? (
                <div className="attendance-empty-filter">
                  <EmptyState
                    text={
                      searchQuery.trim()
                        ? 'Không tìm thấy võ sinh với từ khóa này.'
                        : statusFilter === 'UNMARKED'
                          ? closed
                            ? 'Không có võ sinh vắng không phép.'
                            : 'Không còn võ sinh chưa điểm danh.'
                          : statusFilter === 'PRESENT'
                            ? 'Chưa có võ sinh nào được ghi nhận có mặt.'
                            : 'Không tìm thấy võ sinh phù hợp với bộ lọc.'
                    }
                    description="Bạn có thể chuyển sang tab “Tất cả” hoặc xóa từ khóa tìm kiếm để xem toàn bộ danh sách."
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setStatusFilter('ALL');
                      setSearchQuery('');
                    }}
                  >
                    Xem tất cả võ sinh ({rows.length})
                  </button>
                </div>
              ) : (
                <div className="table-scroll">
                  <table className="attendance-table">
                    <thead>
                      <tr>
                        <th>
                          <input
                            type="checkbox"
                            aria-label="Chọn tất cả võ sinh chưa có mặt đang hiển thị"
                            disabled={locked || !visibleEligible.length}
                            checked={
                              visibleEligible.length > 0 &&
                              visibleEligible.every((r) =>
                                selected.includes(r.studentId),
                              )
                            }
                            ref={(el) => {
                              if (el)
                                el.indeterminate =
                                  visibleEligible.some((r) =>
                                    selected.includes(r.studentId),
                                  ) &&
                                  !visibleEligible.every((r) =>
                                    selected.includes(r.studentId),
                                  );
                            }}
                            onChange={(e) => {
                              if (e.target.checked) {
                                const addIds = visibleEligible.map(
                                  (r) => r.studentId,
                                );
                                setSelected((prev) => [
                                  ...new Set([...prev, ...addIds]),
                                ]);
                              } else {
                                const removeSet = new Set(
                                  visibleEligible.map((r) => r.studentId),
                                );
                                setSelected((prev) =>
                                  prev.filter((id) => !removeSet.has(id)),
                                );
                              }
                            }}
                          />
                        </th>
                        <th>STT</th>
                        <th>Võ sinh</th>
                        <th>Mã võ sinh</th>
                        <th>Trạng thái</th>
                        <th>Thời điểm xác nhận</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((r) => {
                        const originalIndex =
                          rows.findIndex(
                            (item) => item.studentId === r.studentId,
                          ) + 1;
                        const present = isPresent(r);
                        const isChecked =
                          present || selected.includes(r.studentId);
                        return (
                          <tr
                            key={r.studentId}
                            className={
                              (present ? 'attendance-confirmed ' : '') +
                              (!locked && !present
                                ? 'attendance-row-clickable '
                                : '') +
                              (selected.includes(r.studentId)
                                ? 'attendance-row-selected'
                                : '')
                            }
                            onClick={() => {
                              if (!locked && !present) toggle(r.studentId);
                            }}
                          >
                            <td onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                aria-label={'Chọn ' + r.fullName}
                                checked={isChecked}
                                disabled={locked || present}
                                onChange={() => toggle(r.studentId)}
                              />
                            </td>
                            <td>{originalIndex}</td>
                            <td>
                              <div className="student-name">
                                <span className="avatar">
                                  {initials(r.fullName)}
                                </span>
                                <strong>{r.fullName}</strong>
                              </div>
                            </td>
                            <td>
                              <span className="student-code-chip">
                                {r.studentCode}
                              </span>
                            </td>
                            <td>
                              <span
                                className={
                                  'attendance-status ' +
                                  (present
                                    ? 'present'
                                    : r.status === 'EXCUSED'
                                      ? 'excused'
                                      : closed
                                        ? 'absent'
                                        : 'waiting')
                                }
                              >
                                {present && <Check size={14} />}{' '}
                                {r.status === 'UNMARKED'
                                  ? 'Chưa có mặt'
                                  : statusLabels[r.status] || r.status}
                              </span>
                            </td>
                            <td>
                              {r.confirmedAt
                                ? new Date(r.confirmedAt).toLocaleString(
                                    'vi-VN',
                                  )
                                : '—'}
                            </td>
                            <td onClick={(e) => e.stopPropagation()}>
                              {!locked && !present && (
                                <button
                                  type="button"
                                  className="btn-instant-present"
                                  onClick={() =>
                                    setDialog({
                                      kind: 'present',
                                      ids: [r.studentId],
                                    })
                                  }
                                >
                                  Xác nhận có mặt
                                </button>
                              )}
                              {!locked && present && (
                                <button
                                  type="button"
                                  className="btn-attendance-undo"
                                  onClick={() => {
                                    setReason('');
                                    setDialog({
                                      kind: 'undo',
                                      studentId: r.studentId,
                                    });
                                  }}
                                >
                                  Hoàn tác
                                </button>
                              )}
                              {closed &&
                                editable &&
                                ['ADMIN', 'MASTER'].includes(user.role) && (
                                  <button
                                    type="button"
                                    className="btn-attendance-correct"
                                    onClick={() => {
                                      setReason('');
                                      setCorrectionStatus(
                                        r.status === 'UNMARKED'
                                          ? 'ABSENT'
                                          : r.status,
                                      );
                                      setDialog({
                                        kind: 'correct',
                                        studentId: r.studentId,
                                      });
                                    }}
                                  >
                                    Hiệu chỉnh
                                  </button>
                                )}
                              {['EXCUSED', 'ABSENT'].includes(r.status) && (
                                <Link
                                  className="btn-inline-action"
                                  style={{ marginLeft: 6 }}
                                  to={`/app/leaves?search=${encodeURIComponent(r.studentCode || r.fullName)}`}
                                  title="Xem đơn xin nghỉ của võ sinh này"
                                >
                                  Đơn nghỉ
                                </Link>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="attendance-footer-actions">
                <FilteredExportButton
                  config={{
                    id: 'attendance',
                    title: 'Điểm danh buổi tập',
                    columns: [
                      'studentCode',
                      'fullName',
                      'status',
                      'confirmedAt',
                      'note',
                    ],
                  }}
                  rows={filteredRows}
                  lookups={{}}
                  query={{ sessionId, statusFilter, searchQuery }}
                />
              </div>
              {!!data.corrections?.length && (
                <details className="correction-history">
                  <summary>
                    Lịch sử hiệu chỉnh ({data.corrections.length})
                  </summary>
                  {data.corrections.map((c) => (
                    <article key={c.id}>
                      <strong>
                        {c.studentName}: {statusLabels[c.before] || c.before} →{' '}
                        {statusLabels[c.after] || c.after}
                      </strong>
                      <p>{c.reason}</p>
                      <small>
                        {c.userName} ·{' '}
                        {new Date(c.createdAt).toLocaleString('vi-VN')}
                      </small>
                    </article>
                  ))}
                </details>
              )}
            </section>
          )
        )
      ) : (
        <section className="panel">
          <EmptyState
            text="Chọn một buổi tập để bắt đầu"
            description="Danh sách võ sinh sẽ hiển thị đầy đủ theo lớp hoặc phân công của buổi tập."
          />
        </section>
      )}

      <AttendanceActionModal
        dialog={dialog}
        data={data}
        rows={rows}
        reason={reason}
        setReason={setReason}
        correctionStatus={correctionStatus}
        setCorrectionStatus={setCorrectionStatus}
        isFutureSession={isFutureSession}
        canEarlyClose={canEarlyClose}
        busy={busy}
        error={error}
        onClose={() => setDialog(null)}
        onConfirm={confirm}
      />
    </div>
  );
}
