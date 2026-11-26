import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  Users,
  Save,
  PenLine,
  Trash2,
  X,
  Filter,
  Star,
} from 'lucide-react';
import FeaturePage from '../../../components/common/FeaturePage.jsx';
import OrganizationScope from '../../../components/common/OrganizationScope.jsx';
import FilteredExportButton from '../../../components/common/FilteredExportButton.jsx';
import Button from '../../../components/common/Button.jsx';
import Badge from '../../../components/common/Badge.jsx';
import Pagination from '../../../components/common/Pagination.jsx';
import Loading from '../../../components/common/Loading.jsx';
import EmptyState from '../../../components/common/EmptyState.jsx';
import ErrorState from '../../../components/common/ErrorState.jsx';
import RecordForm from '../../../components/common/RecordForm.jsx';
import RecordDetail from '../../../components/common/RecordDetail.jsx';
import WorkflowDialog from '../../../components/common/WorkflowDialog.jsx';
import { useAuth } from '../../../contexts/AuthContext.jsx';
import { useToast } from '../../../contexts/ToastContext.jsx';
import { useRemote } from '../../../hooks/useRemote.js';
import { api } from '../../../services/api.js';
import { fetchAllPages } from '../../../utils/fetchAllPages.js';
import { can } from '../../../utils/permissions.js';
import { initials, formatDate, statusLabels } from '../../../utils/format.js';
import config from '../module.js';
import service from '../services/evaluationsService.js';

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export default function EvaluationsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [url] = useSearchParams();
  const wardScope = url.get('wardId') || '';
  const clubScope = url.get('clubId') || '';

  // Students see their own evaluation history via FeaturePage
  if (user?.role === 'STUDENT') {
    return <FeaturePage config={config} service={service} />;
  }

  const [classId, setClassId] = useState('');
  const [month, setMonth] = useState(currentMonth);
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | UNGRADED | GRADED
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [drafts, setDrafts] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);

  const remote = useRemote(
    async (signal) => {
      const [evalRes, lookup] = await Promise.all([
        fetchAllPages(service, { month }, signal),
        api.request('/lookups', { signal, query: { module: 'evaluations' } }),
      ]);
      return {
        evaluations: evalRes.items || [],
        lookups: lookup || {},
      };
    },
    [user?.id, wardScope, clubScope, month],
  );

  const evaluations = remote.data?.evaluations || [];
  const lookups = remote.data?.lookups || {};
  const classes = lookups.classes || [];
  const students = lookups.students || [];

  // Default to first class in scope for Admin/Master/Instructor
  useEffect(() => {
    if (classes.length && (!classId || !classes.some((c) => c.id === classId))) {
      setClassId(classes[0].id);
    }
  }, [classes]);

  useEffect(() => {
    if (!api.subscribeResource) return;
    return api.subscribeResource('evaluations', remote.reload);
  }, [remote.reload]);

  const canCreate = can(config, user?.role, 'C');
  const canEdit = can(config, user?.role, 'E');
  const canDelete = can(config, user?.role, 'D');

  const classMap = useMemo(
    () => Object.fromEntries(classes.map((c) => [c.id, c.name])),
    [classes],
  );

  // Merge all students in selected class(es) with their evaluation for the selected month
  const mergedRows = useMemo(() => {
    const targetStudents = classId
      ? students.filter((s) => s.classId === classId)
      : students;

    const evalByStudent = new Map();
    for (const ev of evaluations) {
      if (!month || ev.period === month) {
        evalByStudent.set(ev.studentId, ev);
      }
    }

    return targetStudents.map((s) => {
      const ev = evalByStudent.get(s.id) || null;
      return {
        student: s,
        evaluation: ev,
        isGraded: Boolean(ev),
      };
    });
  }, [students, evaluations, classId, month]);

  const counts = useMemo(() => {
    const graded = mergedRows.filter((r) => r.isGraded).length;
    return {
      all: mergedRows.length,
      graded,
      ungraded: mergedRows.length - graded,
    };
  }, [mergedRows]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return mergedRows.filter((r) => {
      if (statusFilter === 'GRADED' && !r.isGraded) return false;
      if (statusFilter === 'UNGRADED' && r.isGraded) return false;
      if (q) {
        const hay = [
          r.student.fullName,
          r.student.studentCode,
          classMap[r.student.classId],
          r.evaluation?.comment,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [mergedRows, statusFilter, search, classMap]);

  const activePeriod = month || currentMonth();
  const draftKey = (studentId, rowClassId = classId) =>
    `${rowClassId || ''}::${activePeriod}::${studentId}`;

  function getDraft(studentId, rowClassId = classId) {
    const k = draftKey(studentId, rowClassId);
    return (
      drafts[k] || {
        rating: '8.5',
        comment: 'Tiến bộ tốt về kỹ thuật và kỷ luật tập luyện.',
      }
    );
  }

  function updateDraft(studentId, patch, rowClassId = classId) {
    const k = draftKey(studentId, rowClassId);
    setDrafts((prev) => ({
      ...prev,
      [k]: { ...getDraft(studentId, rowClassId), ...patch },
    }));
  }

  const exportRows = useMemo(
    () =>
      filteredRows.map(({ student, evaluation, isGraded }) => ({
        id: evaluation?.id || `ungraded-${student.id}-${activePeriod}`,
        studentId: student.id,
        classId: student.classId,
        period: evaluation?.period || activePeriod,
        rating: isGraded ? evaluation.rating : 'Chưa đánh giá',
        comment: isGraded ? evaluation.comment : 'Chưa đánh giá',
        status: isGraded ? 'Đã đánh giá' : 'Chưa đánh giá',
      })),
    [filteredRows, activePeriod],
  );

  const pageSize = 25;
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRows = useMemo(
    () => filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filteredRows, safePage],
  );

  useEffect(() => {
    setPage(1);
  }, [classId, month, statusFilter, search]);

  async function quickGrade(student) {
    if (savingId) return;
    const d = getDraft(student.id, student.classId);
    const rawRating = String(d.rating ?? '').trim();
    if (rawRating === '') {
      toast('Vui lòng nhập điểm đánh giá từ 0 đến 10.', 'error');
      return;
    }
    const num = Number(rawRating);
    if (!Number.isFinite(num) || num < 0 || num > 10) {
      toast('Điểm đánh giá phải từ 0 đến 10.', 'error');
      return;
    }
    if (!d.comment.trim()) {
      toast('Vui lòng nhập nhận xét ngắn cho võ sinh.', 'error');
      return;
    }
    setSavingId(student.id);
    try {
      await service.create({
        studentId: student.id,
        classId: student.classId,
        period: activePeriod,
        rating: num,
        comment: d.comment.trim(),
      });
      toast(`Đã lưu đánh giá cho ${student.fullName}.`);
      const k = draftKey(student.id, student.classId);
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[k];
        return next;
      });
      remote.reload();
    } catch (e) {
      toast(e.message || 'Không thể lưu đánh giá.', 'error');
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(action, row) {
    if (busy) return;
    setBusy(true);
    setActionError(null);
    try {
      await service.remove(row.id);
      toast('Đã xóa đánh giá.');
      setDialog(null);
      remote.reload();
    } catch (e) {
      setActionError(e);
    } finally {
      setBusy(false);
    }
  }

  function resolveField(key, value) {
    if (key === 'studentId')
      return students.find((s) => s.id === value)?.fullName || '—';
    if (key === 'classId') return classMap[value] || '—';
    if (key === 'status') return statusLabels[value] || value;
    if (/Date$|At$/.test(key)) return formatDate(value);
    return value ?? '—';
  }

  const columnLabel = (k) =>
    config.fields.find((f) => f.key === k)?.label ||
    { createdAt: 'Ngày tạo', studentId: 'Võ sinh', classId: 'Lớp học' }[k] ||
    k;

  return (
    <div className="feature-page">
      <OrganizationScope />
      <div className="page-heading">
        <div>
          <div className="section-kicker">
            ĐÀO TẠO
            <span />
            VOVINAM
          </div>
          <h1>Đánh giá võ sinh theo lớp</h1>
          <p>
            Chọn lớp học để theo dõi tình trạng đánh giá và nhập điểm nhanh trực
            tiếp cho võ sinh chưa có đánh giá.
          </p>
        </div>
        <div className="heading-actions">
          <FilteredExportButton
            config={config}
            service={service}
            rows={exportRows}
            query={{ classId, month, status: statusFilter, search }}
            lookups={lookups}
          />
        </div>
      </div>

      {/* Quick Class Selector */}
      {classes.length > 0 && (
        <div className="feature-tabs" role="tablist" aria-label="Chọn lớp đánh giá">
          <button
            type="button"
            className={`feature-tab ${classId === '' ? 'is-active' : ''}`}
            onClick={() => setClassId('')}
          >
            <Users size={16} />
            <span>Tất cả lớp</span>
            <span className="tab-count">{students.length}</span>
          </button>
          {classes.map((c) => {
            const countInClass = students.filter((s) => s.classId === c.id).length;
            return (
              <button
                type="button"
                key={c.id}
                className={`feature-tab ${classId === c.id ? 'is-active' : ''}`}
                onClick={() => setClassId(c.id)}
              >
                <Star size={15} />
                <span>{c.name}</span>
                <span className="tab-count">{countInClass}</span>
              </button>
            );
          })}
        </div>
      )}

      <section className="panel data-panel">
        <div className="data-panel-title">
          <div>
            <h2>
              Danh sách đánh giá {classId ? `· ${classMap[classId] || ''}` : ''}
              <span className="count-pill">{filteredRows.length}</span>
            </h2>
            <p>
              Đã đánh giá: <strong>{counts.graded}</strong> · Chưa đánh giá:{' '}
              <strong>{counts.ungraded}</strong> (Tháng {month})
            </p>
          </div>
          <div className="view-actions">
            <button
              className="icon-btn bordered"
              aria-label="Tải lại dữ liệu"
              onClick={remote.reload}
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        <div className="filter-bar">
          <label className="search-input">
            <Search size={17} />
            <input
              aria-label="Tìm võ sinh"
              placeholder="Tìm tên, mã võ sinh hoặc nhận xét…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button aria-label="Xóa tìm kiếm" onClick={() => setSearch('')}>
                <X size={14} />
              </button>
            )}
          </label>

          <div className="filter-controls">
            <Filter size={16} />
            <div className="quick-filter-group" role="group" aria-label="Lọc trạng thái đánh giá">
              <button
                type="button"
                className={`quick-filter-btn ${statusFilter === 'ALL' ? 'is-active' : ''}`}
                onClick={() => setStatusFilter('ALL')}
              >
                Tất cả ({counts.all})
              </button>
              <button
                type="button"
                className={`quick-filter-btn tone-warning ${statusFilter === 'UNGRADED' ? 'is-active' : ''}`}
                onClick={() => setStatusFilter('UNGRADED')}
              >
                <Clock size={14} />
                Chưa đánh giá ({counts.ungraded})
              </button>
              <button
                type="button"
                className={`quick-filter-btn tone-positive ${statusFilter === 'GRADED' ? 'is-active' : ''}`}
                onClick={() => setStatusFilter('GRADED')}
              >
                <CheckCircle2 size={14} />
                Đã đánh giá ({counts.graded})
              </button>
            </div>

            <select
              aria-label="Chọn lớp học"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
            >
              <option value="">Tất cả lớp học</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <input
              aria-label="Tháng đánh giá"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>
        </div>

        {remote.loading ? (
          <Loading />
        ) : remote.error ? (
          <ErrorState error={remote.error} retry={remote.reload} />
        ) : !filteredRows.length ? (
          <EmptyState
            text="Không có võ sinh phù hợp với bộ lọc"
            description="Hãy chuyển bộ lọc sang Tất cả hoặc chọn lớp/tháng khác."
          />
        ) : (
          <div className="table-scroll">
            <table className="record-table">
              <thead>
                <tr>
                  <th className="index-cell">STT</th>
                  <th>Võ sinh</th>
                  {!classId && <th>Lớp học</th>}
                  <th>Trạng thái</th>
                  <th>Điểm (0–10)</th>
                  <th>Nhận xét</th>
                  <th className="action-cell">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map(({ student, evaluation, isGraded }, idx) => {
                  const d = getDraft(student.id);
                  return (
                    <tr
                      key={student.id}
                      className={
                        isGraded ? 'clickable-row' : 'eval-row-pending'
                      }
                      onClick={() => {
                        if (isGraded) {
                          setDialog({ kind: 'detail', row: evaluation });
                        }
                      }}
                    >
                      <td className="index-cell" data-label="STT">{(safePage - 1) * pageSize + idx + 1}</td>
                      <td data-label="Võ sinh">
                        <div className="person-cell">
                          <span className={'avatar tone-' + (idx % 5)}>
                            {initials(student.fullName)}
                          </span>
                          <span>
                            <strong>{student.fullName}</strong>
                            {student.studentCode && (
                              <small>{student.studentCode}</small>
                            )}
                          </span>
                        </div>
                      </td>
                      {!classId && <td data-label="Lớp học">{classMap[student.classId] || '—'}</td>}
                      <td data-label="Trạng thái">
                        {isGraded ? (
                          <Badge value="COMPLETED" label="Đã đánh giá" />
                        ) : (
                          <Badge value="PENDING" label="Chưa đánh giá" />
                        )}
                      </td>
                      <td data-label="Điểm" onClick={(e) => !isGraded && e.stopPropagation()}>
                        {isGraded ? (
                          <strong className="money">{evaluation.rating}</strong>
                        ) : canCreate ? (
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.5"
                            className="eval-inline-score"
                            aria-label={`Điểm cho ${student.fullName}`}
                            value={d.rating}
                            onChange={(e) =>
                              updateDraft(
                                student.id,
                                { rating: e.target.value },
                                student.classId,
                              )
                            }
                          />
                        ) : (
                          '—'
                        )}
                      </td>
                      <td
                        data-label="Nhận xét"
                        className="wrap-cell"
                        onClick={(e) => !isGraded && e.stopPropagation()}
                      >
                        {isGraded ? (
                          <span>{evaluation.comment}</span>
                        ) : canCreate ? (
                          <input
                            type="text"
                            className="eval-inline-comment"
                            aria-label={`Nhận xét cho ${student.fullName}`}
                            placeholder="Nhập nhận xét nhanh…"
                            value={d.comment}
                            onChange={(e) =>
                              updateDraft(
                                student.id,
                                { comment: e.target.value },
                                student.classId,
                              )
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') quickGrade(student);
                            }}
                          />
                        ) : (
                          'Chưa có nhận xét'
                        )}
                      </td>
                      <td
                        data-label="Thao tác"
                        className="action-cell"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="row-actions">
                          {!isGraded ? (
                            canCreate && (
                              <button
                                type="button"
                                className="review-action review-action-approve btn-with-label"
                                disabled={savingId === student.id}
                                onClick={() => quickGrade(student)}
                              >
                                <Save size={14} />
                                <span>
                                  {savingId === student.id
                                    ? 'Đang lưu…'
                                    : 'Lưu nhanh'}
                                </span>
                              </button>
                            )
                          ) : (
                            <>
                              {canEdit && (
                                <button
                                  type="button"
                                  className="icon-btn"
                                  title="Chỉnh sửa"
                                  onClick={() =>
                                    setDialog({ kind: 'form', row: evaluation })
                                  }
                                >
                                  <PenLine size={16} />
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  type="button"
                                  className="icon-btn danger-icon"
                                  title="Xóa"
                                  onClick={() =>
                                    setDialog({
                                      kind: 'delete',
                                      row: evaluation,
                                    })
                                  }
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {filteredRows.length > pageSize && (
          <Pagination
            page={safePage}
            total={filteredRows.length}
            limit={pageSize}
            onChange={setPage}
          />
        )}
      </section>

      {dialog?.kind === 'form' && (
        <RecordForm
          config={config}
          record={dialog.row}
          lookups={lookups}
          service={service}
          onClose={() => setDialog(null)}
          onSaved={remote.reload}
        />
      )}

      {dialog?.kind === 'detail' && (
        <RecordDetail
          row={dialog.row}
          config={config}
          user={user}
          lockedWorkflow={false}
          resolve={resolveField}
          columnLabel={columnLabel}
          onClose={() => setDialog(null)}
          onEdit={() => setDialog({ kind: 'form', row: dialog.row })}
        />
      )}

      {dialog?.kind === 'delete' && (
        <WorkflowDialog
          config={config}
          dialog={dialog}
          user={user}
          busy={busy}
          resolve={resolveField}
          actionError={actionError}
          onClose={() => !busy && setDialog(null)}
          onAct={handleDelete}
        />
      )}
    </div>
  );
}
