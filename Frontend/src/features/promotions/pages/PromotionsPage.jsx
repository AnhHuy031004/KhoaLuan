import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, X, Plus, RefreshCw, PenLine, Trash2 } from 'lucide-react';
import FeaturePage from '../../../components/common/FeaturePage.jsx';
import OrganizationScope from '../../../components/common/OrganizationScope.jsx';
import Modal from '../../../components/common/Modal.jsx';
import Button from '../../../components/common/Button.jsx';
import ExportSystemButton from '../../../components/common/ExportSystemButton.jsx';
import LeaveStatus from '../../leaves/components/LeaveStatus.jsx';
import { useAuth } from '../../../contexts/AuthContext.jsx';
import { useToast } from '../../../contexts/ToastContext.jsx';
import { api, IS_MOCK } from '../../../services/api.js';
import { can } from '../../../utils/permissions.js';
import config from '../module.js';
import service from '../services/promotionsService.js';
import '../../../styles/promotions.css';
export default function PromotionsPage() {
  return IS_MOCK ? (
    <MockPromotions />
  ) : (
    <FeaturePage config={config} service={service} />
  );
}
function MockPromotions() {
  const { user } = useAuth(),
    toast = useToast(),
    [url] = useSearchParams();
  const wardScope = url.get('wardId') || '',
    clubScope = url.get('clubId') || '';
  const [data, setData] = useState(null),
    [classId, setClassId] = useState(''),
    [status, setStatus] = useState(''),
    [search, setSearch] = useState(''),
    [page, setPage] = useState(1),
    [selected, setSelected] = useState([]),
    [form, setForm] = useState(null),
    [review, setReview] = useState(null),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState('');
  const sequence = useRef(0),
    alive = useRef(true);
  async function load() {
    const request = ++sequence.current;
    try {
      setError('');
      let all = [],
        result,
        p = 1;
      do {
        result = await service.list({ page: p++, limit: 5000 });
        all.push(...result.items);
      } while (all.length < result.total && result.items.length);
      if (alive.current && request === sequence.current) {
        setData({ ...result, items: all });
        setClassId((v) =>
          user.role === 'STUDENT'
            ? v && result.lookups.classes.some((c) => c.id === v)
              ? v
              : ''
            : result.lookups.classes.some((c) => c.id === v)
              ? v
              : result.lookups.classes[0]?.id || '',
        );
        setSelected((v) =>
          v.filter((id) =>
            all.some(
              (r) => r.id === id && r.status === 'PENDING' && !r.__readOnly,
            ),
          ),
        );
      }
    } catch (e) {
      if (alive.current) setError(e.message);
    } finally {
      if (alive.current) setLoading(false);
    }
  }
  useEffect(() => {
    alive.current = true;
    load();
    const off = api.subscribeResource?.('promotions', load);
    return () => {
      alive.current = false;
      sequence.current++;
      off?.();
    };
  }, [wardScope, clubScope]);
  useEffect(() => {
    setSelected([]);
    setPage(1);
  }, [classId, status, search]);
  const lookup = data?.lookups || { classes: [], students: [], ranks: [] },
    name = (kind, id) =>
      lookup[kind].find((r) => r.id === id)?.fullName ||
      lookup[kind].find((r) => r.id === id)?.name ||
      id ||
      '—',
    canReview = can(config, user.role, 'A'),
    rows = (data?.items || []).filter((r) => !classId || r.classId === classId),
    filtered = rows.filter(
      (r) =>
        (!status || r.status === status) &&
        `${name('students', r.studentId)} ${r.reason} ${name('ranks', r.rankId)}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    ),
    pages = Math.max(1, Math.ceil(filtered.length / 10)),
    currentPage = Math.min(page, pages),
    visible = filtered.slice((currentPage - 1) * 10, currentPage * 10),
    pending = visible.filter((r) => r.status === 'PENDING' && !r.__readOnly),
    chosen = visible.filter(
      (r) =>
        selected.includes(r.id) && r.status === 'PENDING' && !r.__readOnly,
    );
  const batchRows = chosen.length
    ? chosen
    : filtered.filter((r) => r.status === 'PENDING' && !r.__readOnly);
  useEffect(() => {
    setSelected([]);
  }, [page]);
  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const body = {
        classId,
        studentId: form.studentId,
        rankId: form.rankId,
        reason: form.reason,
      };
      if (form.id) await service.update(form.id, body);
      else await service.create(body);
      setForm(null);
      toast('Đã lưu đề xuất thi lên đai.');
      await load();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  }
  async function confirm() {
    if (busy) return;
    setBusy(true);
    try {
      if (review.action === 'delete') {
        await service.remove(review.rows[0].id);
        toast('Đã xóa đề xuất.');
      } else {
        const targetClassId = classId || review.rows[0]?.classId;
        const result = await service.bulkReview({
          classId: targetClassId,
          ids: review.rows.map((r) => r.id),
          action: review.action,
        });
        toast(
          `Đã ${review.action === 'approve' ? 'duyệt' : 'từ chối'} ${result.count} đề xuất.`,
        );
      }
      setReview(null);
      setSelected([]);
      await load();
    } catch (e) {
      toast(e.message, 'error');
      setReview(null);
      setSelected([]);
      await load();
    } finally {
      setBusy(false);
    }
  }
  const student = lookup.students.find((s) => s.id === form?.studentId),
    level = lookup.ranks.find((r) => r.id === student?.rankId)?.level || 0;
  return (
    <div className="promotions-page">
      <OrganizationScope />
      <div className="page-heading">
        <div>
          <span className="eyebrow">THI & THĂNG ĐAI</span>
          <h1>Đề xuất thi lên đai</h1>
          <p>
            Đề xuất và xét duyệt võ sinh đủ điều kiện dự thi lên đai theo từng
            lớp.
          </p>
        </div>
        <div className="promotion-actions">
          <ExportSystemButton />
          {can(config, user.role, 'C') && (
            <Button
              disabled={!classId || busy}
              onClick={() => setForm({ studentId: '', rankId: '', reason: '' })}
            >
              <Plus size={16} />
              Thêm đề xuất
            </Button>
          )}
        </div>
      </div>
      <section className="promotion-panel">
        <div className="promotion-filters">
          <label>
            Lớp đề xuất
            <select
              aria-label="Lớp đề xuất"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
            >
              {user.role === 'STUDENT' && (
                <option value="">Tất cả lớp</option>
              )}
              {lookup.classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Trạng thái
            <select
              aria-label="Trạng thái đề xuất"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING">Chờ duyệt</option>
              <option value="APPROVED">Đã duyệt</option>
              <option value="REJECTED">Đã từ chối</option>
            </select>
          </label>
          <label className="promotion-search">
            Tìm kiếm
            <input
              aria-label="Tìm đề xuất"
              placeholder="Tên võ sinh, cấp đai, lý do…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <Button variant="secondary" disabled={busy} onClick={load}>
            <RefreshCw size={16} />
            Tải lại
          </Button>
        </div>
        <div className="promotion-summary">
          <strong>
            {classId ? name('classes', classId) : 'Đề xuất cá nhân'}
          </strong>
          <span>{rows.length} đề xuất</span>
          <span className="promotion-count">
            {rows.filter((r) => r.status === 'PENDING').length} chờ duyệt
          </span>
          <span>
            {rows.filter((r) => r.status === 'APPROVED').length} đã duyệt
          </span>
        </div>
        {canReview && (
          <div className="promotion-bulk">
            <span>
              Đã chọn <b>{chosen.length}</b> đề xuất{' '}
              <small>
                ·{' '}
                {chosen.length
                  ? 'Chỉ xử lý các tên đã chọn'
                  : `Xử lý tất cả ${batchRows.length} đề xuất chờ duyệt theo bộ lọc (mọi trang)`}
              </small>
            </span>
            <div className="promotion-actions">
              <button
                className="promotion-review approve"
                disabled={!batchRows.length || loading || busy || !!error}
                onClick={() =>
                  setReview({
                    action: 'approve',
                    rows: batchRows,
                    scope: chosen.length ? 'selected' : 'all',
                  })
                }
              >
                <Check size={15} />
                Duyệt tất cả
              </button>
              <button
                className="promotion-review reject"
                disabled={!batchRows.length || loading || busy || !!error}
                onClick={() =>
                  setReview({
                    action: 'reject',
                    rows: batchRows,
                    scope: chosen.length ? 'selected' : 'all',
                  })
                }
              >
                <X size={15} />
                Từ chối tất cả
              </button>
            </div>
          </div>
        )}
        {error && (
          <p role="alert" className="promotion-error">
            {error}
          </p>
        )}
        <div className="promotion-table-scroll">
          <table className="promotion-table">
            <thead>
              <tr>
                {canReview && (
                  <th>
                    <input
                      type="checkbox"
                      aria-label="Chọn tất cả đề xuất chờ duyệt trên trang"
                      disabled={!pending.length || busy}
                      checked={
                        !!pending.length &&
                        pending.every((r) => selected.includes(r.id))
                      }
                      ref={(el) => {
                        if (el)
                          el.indeterminate =
                            pending.some((r) => selected.includes(r.id)) &&
                            !pending.every((r) => selected.includes(r.id));
                      }}
                      onChange={(e) =>
                        setSelected(
                          e.target.checked ? pending.map((r) => r.id) : [],
                        )
                      }
                    />
                  </th>
                )}
                <th>Võ sinh</th>
                <th>Cấp đai dự thi</th>
                <th>Lý do đề xuất</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr
                  key={r.id}
                  className={selected.includes(r.id) ? 'selected' : ''}
                >
                  {canReview && (
                    <td>
                      {r.status === 'PENDING' && !r.__readOnly ? (
                        <input
                          type="checkbox"
                          aria-label={'Chọn ' + name('students', r.studentId)}
                          checked={selected.includes(r.id)}
                          disabled={busy}
                          onChange={(e) =>
                            setSelected((v) =>
                              e.target.checked
                                ? [...v, r.id]
                                : v.filter((id) => id !== r.id),
                            )
                          }
                        />
                      ) : (
                        <span className="promotion-muted">—</span>
                      )}
                    </td>
                  )}
                  <td>
                    <strong>{name('students', r.studentId)}</strong>
                    <small>{name('classes', r.classId)}</small>
                  </td>
                  <td>{name('ranks', r.rankId)}</td>
                  <td>{r.reason}</td>
                  <td>
                    <LeaveStatus row={r} />
                  </td>
                  <td>
                    <div className="promotion-row-actions">
                      {r.status === 'PENDING' && !r.__readOnly ? (
                        <>
                          {canReview && (
                            <>
                              <button
                                className="promotion-review approve"
                                title="Duyệt đề xuất"
                                aria-label={
                                  'Duyệt đề xuất của ' +
                                  name('students', r.studentId)
                                }
                                disabled={busy || !!error}
                                onClick={() =>
                                  setReview({ action: 'approve', rows: [r] })
                                }
                              >
                                <Check size={16} />
                              </button>
                              <button
                                className="promotion-review reject"
                                title="Từ chối đề xuất"
                                aria-label={
                                  'Từ chối đề xuất của ' +
                                  name('students', r.studentId)
                                }
                                disabled={busy || !!error}
                                onClick={() =>
                                  setReview({ action: 'reject', rows: [r] })
                                }
                              >
                                <X size={16} />
                              </button>
                            </>
                          )}
                          {can(config, user.role, 'E') && (
                            <button
                              className="icon-btn"
                              title="Sửa đề xuất"
                              disabled={busy}
                              aria-label={
                                'Sửa đề xuất của ' +
                                name('students', r.studentId)
                              }
                              onClick={() => setForm({ ...r })}
                            >
                              <PenLine size={16} />
                            </button>
                          )}
                          {can(config, user.role, 'D') && (
                            <button
                              className="icon-btn"
                              title="Xóa đề xuất"
                              disabled={busy}
                              aria-label={
                                'Xóa đề xuất của ' +
                                name('students', r.studentId)
                              }
                              onClick={() =>
                                setReview({ action: 'delete', rows: [r] })
                              }
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="promotion-muted">
                          {r.__readOnly ? 'Chỉ xem' : 'Đã xử lý'}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!visible.length && (
                <tr>
                  <td colSpan={canReview ? 6 : 5} className="promotion-empty">
                    {loading
                      ? 'Đang tải đề xuất…'
                      : 'Chưa có đề xuất phù hợp trong lớp này.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="promotion-pagination">
          <span>
            {filtered.length} đề xuất · Trang {currentPage}/{pages}
          </span>
          <div className="promotion-actions">
            <Button
              variant="secondary"
              disabled={currentPage === 1 || busy}
              onClick={() => setPage(currentPage - 1)}
            >
              Trước
            </Button>
            <Button
              variant="secondary"
              disabled={currentPage === pages || busy}
              onClick={() => setPage(currentPage + 1)}
            >
              Sau
            </Button>
          </div>
        </div>
      </section>
      {form && (
        <Modal
          title={
            form.id ? 'Sửa đề xuất thi lên đai' : 'Thêm đề xuất thi lên đai'
          }
          subtitle={'Lớp ' + name('classes', classId)}
          onClose={() => !busy && setForm(null)}
        >
          <form className="promotion-form" onSubmit={submit}>
            <label>
              Võ sinh
              <select
                required
                aria-label="Võ sinh đề xuất"
                value={form.studentId}
                onChange={(e) =>
                  setForm({ ...form, studentId: e.target.value, rankId: '' })
                }
              >
                <option value="">Chọn võ sinh trong lớp</option>
                {lookup.students
                  .filter(
                    (s) =>
                      (s.classId === classId && s.status === 'ACTIVE') ||
                      s.id === form.studentId,
                  )
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName}
                    </option>
                  ))}
              </select>
            </label>
            {student && (
              <p>
                Cấp đai hiện tại: <strong>{name('ranks', student.rankId)}</strong>
              </p>
            )}
            <label>
              Cấp đai dự thi
              <select
                required
                aria-label="Cấp đai dự thi"
                value={form.rankId}
                onChange={(e) => setForm({ ...form, rankId: e.target.value })}
              >
                <option value="">Chọn cấp đai</option>
                {lookup.ranks
                  .filter((r) => Number(r.level) > Number(level))
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Lý do đề xuất
              <textarea
                required
                aria-label="Lý do đề xuất"
                rows={4}
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
              />
            </label>
            <div className="promotion-actions">
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={() => setForm(null)}
              >
                Hủy
              </Button>
              <Button disabled={busy}>
                {busy ? 'Đang lưu…' : 'Lưu đề xuất'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
      {review && (
        <Modal
          title={
            review.action === 'delete'
              ? 'Xóa đề xuất?'
              : review.action === 'approve'
                ? 'Xác nhận duyệt đề xuất'
                : 'Xác nhận từ chối đề xuất'
          }
          subtitle={`${name('classes', classId || review.rows[0]?.classId)} · ${review.rows.length} đề xuất`}
          onClose={() => !busy && setReview(null)}
        >
          {review.scope && (
            <p className="promotion-muted">
              {review.scope === 'selected'
                ? 'Chỉ xử lý những tên đã tích chọn.'
                : 'Xử lý tất cả đề xuất chờ duyệt của lớp theo bộ lọc hiện tại, bao gồm các trang khác.'}
            </p>
          )}
          <ul className="promotion-confirm-list">
            {review.rows.map((r) => (
              <li key={r.id}>
                <strong>{name('students', r.studentId)}</strong>
                <span>{name('ranks', r.rankId)}</span>
              </li>
            ))}
          </ul>
          <p className="promotion-muted">
            {review.action === 'delete'
              ? 'Đề xuất này sẽ bị xóa.'
              : 'Sau khi xác nhận, hệ thống lưu người xử lý và khóa đề xuất. Duyệt đề xuất chỉ xác nhận đủ điều kiện dự thi. Cấp đai được cập nhật sau khi chốt kết quả thi đạt.'}
          </p>
          <div className="promotion-actions">
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => setReview(null)}
            >
              Hủy
            </Button>
            <Button disabled={busy} onClick={confirm}>
              {busy ? 'Đang xử lý…' : 'Xác nhận'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
