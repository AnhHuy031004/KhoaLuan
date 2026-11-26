import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  RefreshCw,
  PenLine,
  Trash2,
  X,
  Filter,
  Users,
  ArrowRightLeft,
  CheckCheck,
  Layers,
} from 'lucide-react';
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
import { formatDate, initials, statusLabels } from '../../../utils/format.js';
import config from '../module.js';
import service from '../services/enrollmentsService.js';

export default function EnrollmentsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [url, setUrl] = useSearchParams();
  const wardScope = url.get('wardId') || '';
  const clubScope = url.get('clubId') || '';

  const [classId, setClassIdState] = useState(() => url.get('classId') || '');
  const [status, setStatusState] = useState(() => url.get('status') || '');
  const [search, setSearchState] = useState(() => url.get('search') || '');
  const [page, setPage] = useState(1);

  const syncParam = (key, value) => {
    const next = new URLSearchParams(url);
    if (value) next.set(key, value);
    else next.delete(key);
    setUrl(next, { replace: true });
  };
  const setClassId = (v) => {
    setClassIdState(v);
    syncParam('classId', v);
  };
  const setStatus = (v) => {
    setStatusState(v);
    syncParam('status', v);
  };
  const setSearch = (v) => {
    setSearchState(v);
    syncParam('search', v.trim());
  };

  useEffect(() => {
    setClassIdState(url.get('classId') || '');
    setStatusState(url.get('status') || '');
    setSearchState(url.get('search') || '');
    setPage(1);
  }, [url]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [targetClassId, setTargetClassId] = useState('');
  const [dialog, setDialog] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);

  const remote = useRemote(
    async (signal) => {
      const [list, lookup] = await Promise.all([
        fetchAllPages(service, {}, signal),
        api.request('/lookups', { signal, query: { module: 'enrollments' } }),
      ]);
      return { items: list.items || [], lookups: lookup || {} };
    },
    [user?.id, wardScope, clubScope],
  );

  useEffect(() => {
    if (!api.subscribeResource) return;
    return api.subscribeResource('enrollments', remote.reload);
  }, [remote.reload]);

  const items = remote.data?.items || [];
  const lookups = remote.data?.lookups || {};
  const students = lookups.students || [];
  const classes = lookups.classes || [];
  useEffect(() => {
    if (classId && classes.length > 0 && !classes.some((c) => c.id === classId)) {
      setClassId('');
    }
  }, [classes, classId]);

  const canCreate = can(config, user?.role, 'C');
  const canEdit = can(config, user?.role, 'E');
  const canDelete = can(config, user?.role, 'D');

  const studentMap = useMemo(
    () => Object.fromEntries(students.map((s) => [s.id, s])),
    [students],
  );
  const classMap = useMemo(
    () => Object.fromEntries(classes.map((c) => [c.id, c.name])),
    [classes],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((row) => {
      if (classId && row.classId !== classId) return false;
      if (status && row.status !== status) return false;
      if (q) {
        const st = studentMap[row.studentId];
        const hay = [
          st?.fullName,
          st?.studentCode,
          classMap[row.classId],
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, classId, status, search, studentMap, classMap]);

  function toggleSelect(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function assignClassBatch(ids, nextClassId) {
    if (!ids.length || !nextClassId || busy) return;
    setBusy(true);
    setActionError(null);
    let succeeded = 0;
    let skipped = 0;
    const failedIds = [];
    let lastError = null;
    try {
      for (const id of ids) {
        const row = items.find((r) => r.id === id);
        if (!row || row.classId === nextClassId) {
          skipped += 1;
          continue;
        }
        try {
          await service.update(id, {
            studentId: row.studentId,
            classId: nextClassId,
            joinedAt: row.joinedAt || new Date().toISOString().slice(0, 10),
            status: row.status || 'ACTIVE',
          });
          succeeded += 1;
        } catch (err) {
          failedIds.push(id);
          lastError = err;
        }
      }
      if (failedIds.length > 0) {
        const summary = `Đã chuyển ${succeeded} võ sinh, thất bại ${failedIds.length} võ sinh${skipped ? `, bỏ qua ${skipped}` : ''}.`;
        setActionError({ message: `${summary} ${lastError?.message || ''}`.trim() });
        toast(summary, 'error');
        setSelectedIds(failedIds);
      } else if (succeeded > 0) {
        toast(
          `Đã phân lớp nhanh cho ${succeeded} võ sinh sang lớp ${classMap[nextClassId] || ''}.`,
        );
        setSelectedIds([]);
        setTargetClassId('');
      } else {
        toast('Các võ sinh đã chọn đều đang ở lớp này.');
        setSelectedIds([]);
      }
      remote.reload();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(action, row) {
    if (busy) return;
    setBusy(true);
    setActionError(null);
    try {
      await service.remove(row.id);
      toast('Đã xóa phân lớp võ sinh.');
      setDialog(null);
      remote.reload();
    } catch (e) {
      setActionError(e);
    } finally {
      setBusy(false);
    }
  }

  function resolveField(key, value) {
    if (key === 'studentId') return studentMap[value]?.fullName || '—';
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
      {actionError && !dialog && (
        <ErrorState error={actionError} retry={remote.reload} />
      )}

      <div className="page-heading">
        <div>
          <div className="section-kicker">
            ĐÀO TẠO
            <span />
            VOVINAM
          </div>
          <h1>Phân lớp võ sinh</h1>
          <p>
            Tích chọn nhiều võ sinh để chuyển lớp hàng loạt hoặc đổi lớp trực
            tiếp ngay trên từng dòng.
          </p>
        </div>
        <div className="heading-actions">
          <FilteredExportButton
            config={config}
            service={service}
            query={{ classId, status, search }}
            lookups={lookups}
          />
          {canCreate && (
            <Button onClick={() => setDialog({ kind: 'form', row: null })}>
              <Plus size={18} />
              Phân lớp mới
            </Button>
          )}
        </div>
      </div>

      {/* Quick Class Tabs */}
      {classes.length > 0 && (
        <div className="feature-tabs" role="tablist" aria-label="Lọc nhanh theo lớp">
          <button
            type="button"
            className={`feature-tab ${classId === '' ? 'is-active' : ''}`}
            onClick={() => {
              setClassId('');
              setSelectedIds([]);
            }}
          >
            <Users size={16} />
            <span>Tất cả lớp</span>
            <span className="tab-count">{items.length}</span>
          </button>
          {classes.map((c) => {
            const count = items.filter((i) => i.classId === c.id).length;
            return (
              <button
                type="button"
                key={c.id}
                className={`feature-tab ${classId === c.id ? 'is-active' : ''}`}
                onClick={() => {
                  setClassId(c.id);
                  setSelectedIds([]);
                }}
              >
                <Layers size={15} />
                <span>{c.name}</span>
                <span className="tab-count">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      <section className="panel data-panel">
        <div className="data-panel-title">
          <div>
            <h2>
              Danh sách phân lớp võ sinh
              <span className="count-pill">{filtered.length}</span>
            </h2>
            <p>
              {canEdit
                ? 'Tích chọn võ sinh để chuyển nhanh sang lớp mới, hoặc bấm trực tiếp vào dòng để xem chi tiết.'
                : 'Bấm trực tiếp vào dòng để xem thông tin chi tiết phân lớp.'}
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
              placeholder="Tìm tên, mã võ sinh hoặc tên lớp…"
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
            <select
              aria-label="Lọc theo lớp"
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value);
                setSelectedIds([]);
              }}
            >
              <option value="">Tất cả lớp học</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Lọc trạng thái"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="PAUSED">Tạm dừng</option>
            </select>
          </div>
        </div>

        {/* Bulk Class Transfer Bar */}
        {canEdit && selectedIds.length > 0 && (
          <div className="batch-action-bar">
            <span>
              <ArrowRightLeft
                size={16}
                style={{ verticalAlign: '-3px', marginRight: 6 }}
              />
              Đã chọn <strong>{selectedIds.length}</strong> võ sinh để phân lớp
              nhanh:
            </span>
            <div className="batch-btns">
              <select
                className="enroll-inline-select"
                aria-label="Chọn lớp đích"
                value={targetClassId}
                onChange={(e) => setTargetClassId(e.target.value)}
              >
                <option value="">-- Chọn lớp muốn chuyển tới --</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <Button
                disabled={busy || !targetClassId}
                onClick={() => assignClassBatch(selectedIds, targetClassId)}
              >
                <CheckCheck size={16} />
                {busy
                  ? 'Đang chuyển…'
                  : `Áp dụng chuyển lớp (${selectedIds.length})`}
              </Button>
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => {
                  setSelectedIds([]);
                  setTargetClassId('');
                }}
              >
                Bỏ chọn
              </Button>
            </div>
          </div>
        )}

        {remote.loading ? (
          <Loading />
        ) : remote.error ? (
          <ErrorState error={remote.error} retry={remote.reload} />
        ) : !filtered.length ? (
          <EmptyState
            text="Không có võ sinh phù hợp"
            description="Thử chọn lớp khác hoặc xóa từ khóa tìm kiếm."
          />
        ) : (
          <div className="table-scroll">
            <table className="record-table">
              <thead>
                <tr>
                  {canEdit && (
                    <th style={{ width: 44 }}>
                      <input
                        type="checkbox"
                        aria-label="Chọn tất cả võ sinh"
                        style={{ width: 18, height: 18, cursor: 'pointer' }}
                        checked={
                          filtered.length > 0 &&
                          filtered.every((r) => selectedIds.includes(r.id))
                        }
                        onChange={(e) =>
                          setSelectedIds(
                            e.target.checked ? filtered.map((r) => r.id) : [],
                          )
                        }
                      />
                    </th>
                  )}
                  <th className="index-cell">STT</th>
                  <th>Võ sinh</th>
                  <th>Lớp học hiện tại {canEdit ? '(Đổi nhanh)' : ''}</th>
                  <th>Ngày vào lớp</th>
                  <th>Trạng thái</th>
                  {(canEdit || canDelete) && (
                    <th className="action-cell">Thao tác</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.slice((Math.min(page, Math.max(1, Math.ceil(filtered.length / 25))) - 1) * 25, Math.min(page, Math.max(1, Math.ceil(filtered.length / 25))) * 25).map((row, idx) => {
                  const st = studentMap[row.studentId];
                  const checked = selectedIds.includes(row.id);
                  return (
                    <tr
                      key={row.id}
                      className={
                        'clickable-row' + (checked ? ' is-selected' : '')
                      }
                      title="Bấm để xem chi tiết"
                      tabIndex={0}
                      role="button"
                      onClick={() => setDialog({ kind: 'detail', row })}
                      onKeyDown={(e) => {
                        if (
                          e.target === e.currentTarget &&
                          (e.key === 'Enter' || e.key === ' ')
                        ) {
                          e.preventDefault();
                          setDialog({ kind: 'detail', row });
                        }
                      }}
                    >
                      {canEdit && (
                        <td data-label="Chọn" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            aria-label={`Chọn ${st?.fullName || row.id}`}
                            style={{ width: 18, height: 18, cursor: 'pointer' }}
                            checked={checked}
                            onChange={() => toggleSelect(row.id)}
                          />
                        </td>
                      )}
                      <td className="index-cell" data-label="STT">{(Math.min(page, Math.max(1, Math.ceil(filtered.length / 25))) - 1) * 25 + idx + 1}</td>
                      <td data-label="Võ sinh">
                        <div className="person-cell">
                          <span className={'avatar tone-' + (idx % 5)}>
                            {initials(st?.fullName || row.id)}
                          </span>
                          <span>
                            <strong>{st?.fullName || '—'}</strong>
                            {st?.studentCode && <small>{st.studentCode}</small>}
                          </span>
                        </div>
                      </td>
                      <td data-label="Lớp học" onClick={(e) => e.stopPropagation()}>
                        {canEdit ? (
                          <select
                            className="enroll-inline-select"
                            aria-label={`Đổi lớp cho ${st?.fullName || row.id}`}
                            value={row.classId}
                            disabled={busy}
                            onChange={(e) =>
                              assignClassBatch([row.id], e.target.value)
                            }
                          >
                            {classes.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span>{classMap[row.classId] || '—'}</span>
                        )}
                      </td>
                      <td data-label="Ngày nhập lớp">{formatDate(row.joinedAt)}</td>
                      <td data-label="Trạng thái">
                        <Badge value={row.status} />
                      </td>
                      {(canEdit || canDelete) && (
                        <td
                          data-label="Thao tác"
                          className="action-cell"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="row-actions">
                            {canEdit && (
                              <button
                                type="button"
                                className="icon-btn"
                                title="Chỉnh sửa"
                                aria-label="Chỉnh sửa"
                                onClick={() =>
                                  setDialog({ kind: 'form', row })
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
                                aria-label="Xóa"
                                onClick={() =>
                                  setDialog({ kind: 'delete', row })
                                }
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {filtered.length > 25 && (
          <Pagination
            page={Math.min(page, Math.max(1, Math.ceil(filtered.length / 25)))}
            total={filtered.length}
            limit={25}
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
