import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Navigate, Link } from 'react-router-dom';
import {
  Plus,
  Search,
  RefreshCw,
  PenLine,
  Trash2,
  X,
  Filter,
  Banknote,
  CheckCheck,
  Wallet,
  CheckCircle2,
  Clock,
  Eye,
  Printer,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import CashConfirmModal from '../components/CashConfirmModal.jsx';
import BatchInvoiceModal from '../components/BatchInvoiceModal.jsx';
import ReceiptPrintModal from '../../online-payments/components/ReceiptPrintModal.jsx';
import OrganizationScope from '../../../components/common/OrganizationScope.jsx';
import FilteredExportButton from '../../../components/common/FilteredExportButton.jsx';
import Button from '../../../components/common/Button.jsx';
import Badge from '../../../components/common/Badge.jsx';
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
import { normalizeSearch } from '../../organization/navigation.js';
import { can } from '../../../utils/permissions.js';
import {
  currency,
  formatDate,
  initials,
  statusLabels,
} from '../../../utils/format.js';
import config from '../module.js';
import service from '../services/invoicesService.js';

export default function InvoicesPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [url, setUrl] = useSearchParams();
  const wardScope = url.get('wardId') || '';
  const clubScope = url.get('clubId') || '';

  // For Student role, finance is exclusively Thanh toán học phí online
  if (user?.role === 'STUDENT') {
    return <Navigate to="/app/online-payments" replace />;
  }

  const canCollectCash =
    can(config, user?.role, 'P') || can(config, user?.role, 'E');

  const [search, setSearchState] = useState(url.get('search') || '');
  const [classId, setClassIdState] = useState(url.get('classId') || '');
  const [status, setStatusState] = useState(url.get('status') || '');
  const [methodFilter, setMethodFilterState] = useState(url.get('method') || '');
  const [month, setMonthState] = useState(url.get('month') || '');

  const syncParam = (key, value) => {
    const next = new URLSearchParams(url);
    if (value) next.set(key, value);
    else next.delete(key);
    setUrl(next, { replace: true });
  };
  const setSearch = (v) => {
    setSearchState(v);
    syncParam('search', v.trim());
  };
  const setClassId = (v) => {
    setClassIdState(v);
    syncParam('classId', v);
  };
  const setStatus = (v) => {
    setStatusState(v);
    syncParam('status', v);
  };
  const setMethodFilter = (v) => {
    setMethodFilterState(v);
    syncParam('method', v);
  };
  const setMonth = (v) => {
    setMonthState(v);
    syncParam('month', v);
  };
  useEffect(() => {
    setSearchState(url.get('search') || '');
    setClassIdState(url.get('classId') || '');
    setStatusState(url.get('status') || '');
    setMethodFilterState(url.get('method') || '');
    setMonthState(url.get('month') || '');
  }, [url]);

  const [selectedIds, setSelectedIds] = useState([]);
  const [cashConfirmIds, setCashConfirmIds] = useState([]);
  const [printReceipt, setPrintReceipt] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [batchOpen, setBatchOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);

  const remote = useRemote(
    async (signal) => {
      const [list, lookup, pendingTransfers] = await Promise.all([
        fetchAllPages(service, { classId, month }, signal),
        api.request('/lookups', { signal, query: { module: 'invoices' } }),
        api
          .request('/payment-confirmations', {
            signal,
            query: { status: 'PENDING', limit: 200 },
          })
          .catch(() => ({ items: [] })),
      ]);
      return {
        items: list.items || [],
        lookups: lookup || {},
        pendingTransfers: pendingTransfers?.items || [],
      };
    },
    [user?.id, wardScope, clubScope, classId, month],
  );

  useEffect(() => {
    if (!api.subscribeResource) return;
    const off1 = api.subscribeResource('invoices', remote.reload);
    const off2 = api.subscribeResource('online-payments', remote.reload);
      return () => {
      off1?.();
      off2?.();
    };
  }, [remote.reload]);

  const items = remote.data?.items || [];
  const pendingTransfers = remote.data?.pendingTransfers || [];
  const lookups = remote.data?.lookups || {};
  const students = lookups.students || [];
  const classes = lookups.classes || [];

  const studentMap = useMemo(
    () => Object.fromEntries(students.map((s) => [s.id, s])),
    [students],
  );
  const classMap = useMemo(
    () => Object.fromEntries(classes.map((c) => [c.id, c.name])),
    [classes],
  );

  const counts = useMemo(() => {
    const paid = items.filter((i) => i.status === 'PAID').length;
    return {
      all: items.length,
      paid,
      unpaid: items.length - paid,
    };
  }, [items]);

  const filteredList = useMemo(() => {
    const terms = normalizeSearch(search).split(' ').filter(Boolean);
    return items.filter((inv) => {
      if (status && inv.status !== status) return false;
      if (
        methodFilter &&
        (inv.paymentMethod || 'NONE') !== methodFilter
      )
        return false;
      if (terms.length) {
        const st = studentMap[inv.studentId];
        const hay = normalizeSearch(
          [
            inv.code,
            st?.fullName,
            st?.studentCode,
            classMap[inv.classId],
            inv.period,
          ]
            .filter(Boolean)
            .join(' '),
        );
        if (!terms.every((t) => hay.includes(t))) return false;
      }
      return true;
    });
  }, [items, status, methodFilter, search, studentMap, classMap]);

  useEffect(() => {
    if (classId && classes.length > 0 && !classes.some((c) => c.id === classId)) {
      setClassId('');
    }
  }, [classes, classId]);

  const pendingTransferInvoiceIds = useMemo(
    () =>
      new Set(
        (remote.data?.pendingTransfers || [])
          .filter((p) => p.status === 'PENDING' && p.invoiceId)
          .map((p) => p.invoiceId),
      ),
    [remote.data?.pendingTransfers],
  );

  const selectableUnpaid = useMemo(
    () => filteredList.filter((i) => i.status !== 'PAID'),
    [filteredList],
  );

  const visibleUnpaidIds = useMemo(
    () => new Set(selectableUnpaid.map((i) => i.id)),
    [selectableUnpaid],
  );

  useEffect(() => {
    setSelectedIds((prev) => {
      const next = prev.filter((id) => visibleUnpaidIds.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [visibleUnpaidIds]);

  const visibleSelectedIds = useMemo(
    () => selectedIds.filter((id) => visibleUnpaidIds.has(id)),
    [selectedIds, visibleUnpaidIds],
  );

  const selectedTotal = useMemo(() => {
    const set = new Set(visibleSelectedIds);
    return selectableUnpaid
      .filter((i) => set.has(i.id))
      .reduce((sum, i) => sum + Number(i.amount || 0), 0);
  }, [selectableUnpaid, visibleSelectedIds]);

  const cashConfirmInvoices = useMemo(() => {
    const set = new Set(cashConfirmIds);
    return items.filter((i) => set.has(i.id) && i.status !== 'PAID');
  }, [items, cashConfirmIds]);

  function toggleSelect(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function collectCashForIds(ids) {
    if (!ids.length || busy) return;
    setBusy(true);
    setActionError(null);
    const succeededIds = [];
    const failedItems = [];
    try {
      for (const id of ids) {
        try {
          try {
            await api.request(`/invoices/${encodeURIComponent(id)}/collect-cash`, {
              method: 'POST',
              body: { idempotencyKey: `cash-${id}-${Date.now()}` },
            });
          } catch (err) {
            if (err?.status === 404) {
              await api.request(
                `/payments/${encodeURIComponent(id)}/confirm-cash`,
                { method: 'POST' },
              );
            } else {
              throw err;
            }
          }
          succeededIds.push(id);
        } catch (itemErr) {
          const inv = items.find((x) => x.id === id);
          failedItems.push({
            id,
            code: inv?.code || id,
            message: itemErr?.message || 'Lỗi không xác định',
          });
        }
      }

      if (succeededIds.length > 0 && failedItems.length === 0) {
        toast(
          `Đã xác nhận thu học phí tiền mặt cho ${succeededIds.length} khoản thu.`,
        );
        setSelectedIds([]);
      } else if (succeededIds.length > 0 && failedItems.length > 0) {
        const failedIds = failedItems.map((f) => f.id);
        setSelectedIds(failedIds);
        const detailMsg = failedItems
          .slice(0, 3)
          .map((f) => `${f.code}: ${f.message}`)
          .join('; ');
        setActionError(
          new Error(
            `Đã thu thành công ${succeededIds.length} khoản; ${failedItems.length} khoản thất bại (${detailMsg}). Các khoản lỗi vẫn được giữ chọn để bạn thử lại an toàn.`,
          ),
        );
        toast(
          `Thu thành công ${succeededIds.length}, lỗi ${failedItems.length} khoản.`,
          'error',
        );
      } else {
        const firstErr = failedItems[0];
        setActionError(
          new Error(
            firstErr?.message || 'Không thể xác nhận thu học phí tiền mặt.',
          ),
        );
        toast(firstErr?.message || 'Không thể xác nhận thu học phí.', 'error');
      }
      if (succeededIds.length > 0) remote.reload();
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
      toast('Đã xóa khoản thu.');
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
    if (key === 'amount' || key === 'baseAmount') return currency(value);
    if (key === 'status') return statusLabels[value] || value;
    if (key === 'paymentMethod' || key === 'method') {
      if (value === 'CASH') return 'Tiền mặt';
      if (value === 'BANK') return 'Chuyển khoản';
      return 'Chưa đóng';
    }
    if (/Date$|At$/.test(key)) return formatDate(value);
    return value ?? '—';
  }

  const columnLabel = (k) =>
    config.fields.find((f) => f.key === k)?.label ||
    {
      code: 'Mã hóa đơn',
      paymentMethod: 'Hình thức đóng',
      paidAt: 'Ngày thanh toán',
      status: 'Trạng thái',
      createdAt: 'Ngày lập',
    }[k] ||
    k;

  async function handleBatchGenerate({
    classId: targetClassId,
    period,
    dueDate,
    amount,
    students: eligibleStudents,
  }) {
    let created = 0;
    try {
      const res = await api.request('/invoices/batch', {
        method: 'POST',
        body: {
          classId: targetClassId,
          period,
          dueDate,
          amount,
          studentIds: eligibleStudents.map((s) => s.id),
        },
      });
      created = res?.created ?? eligibleStudents.length;
    } catch (err) {
      if (err?.status === 404 || err?.status === 405) {
        for (const st of eligibleStudents) {
          await service.create({
            studentId: st.id,
            classId: targetClassId,
            period,
            amount,
            dueDate,
          });
          created += 1;
        }
      } else {
        throw err;
      }
    }
    setBatchOpen(false);
    toast(`Đã lập thành công ${created} hóa đơn học phí cho kỳ ${period}.`);
    remote.reload();
  }

  return (
    <div className="feature-page">
      <OrganizationScope />
      {actionError && !dialog && (
        <ErrorState error={actionError} retry={remote.reload} />
      )}

      <div className="page-heading">
        <div>
          <div className="section-kicker">
            TÀI CHÍNH
            <span />
            VOVINAM
          </div>
          <h1>Thu phí &amp; Công nợ</h1>
          <p>
            Theo dõi học viên đã đóng (Chuyển khoản / Tiền mặt) và tích chọn
            thu tiền mặt trực tiếp cho học viên chưa đóng.
          </p>
        </div>
        <div className="heading-actions">
          <FilteredExportButton
            config={config}
            service={service}
            rows={filteredList}
            query={{ classId, month, status, method: methodFilter, search }}
            lookups={lookups}
          />
          {pendingTransfers.length > 0 && (
            <Link
              className="btn btn-secondary pending-transfer-pill"
              to="/app/payment-confirmations?status=PENDING"
              title="Mở danh sách chuyển khoản chờ đối soát"
            >
              <Clock size={16} />
              <span>Đối soát CK ({pendingTransfers.length})</span>
              <ArrowUpRight size={15} />
            </Link>
          )}
          {can(config, user?.role, 'C') && (
            <>
              <Button variant="secondary" onClick={() => setBatchOpen(true)}>
                <Layers size={17} />
                Tạo kỳ thu theo lớp
              </Button>
              <Button onClick={() => setDialog({ kind: 'form', row: null })}>
                <Plus size={18} />
                Lập khoản thu
              </Button>
            </>
          )}
        </div>
      </div>

      <section className="panel data-panel">
        <div className="data-panel-title">
          <div>
            <h2>
              Danh sách thu phí khóa học
              <span className="count-pill">{filteredList.length}</span>
            </h2>
            <p>
              Đã đóng: <strong>{counts.paid}</strong> · Chưa đóng:{' '}
              <strong>{counts.unpaid}</strong>. Học viên thanh toán online sẽ tự
              động hiển thị <strong>Chuyển khoản</strong>.
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
              aria-label="Tìm học viên hoặc mã hóa đơn"
              placeholder="Tìm mã hóa đơn, tên hoặc mã võ sinh…"
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
            <div className="quick-filter-group">
              <button
                type="button"
                className={`quick-filter-btn ${status === '' ? 'is-active' : ''}`}
                onClick={() => {
                  setStatus('');
                  setSelectedIds([]);
                }}
              >
                Tất cả ({counts.all})
              </button>
              <button
                type="button"
                className={`quick-filter-btn tone-warning ${status === 'UNPAID' ? 'is-active' : ''}`}
                onClick={() => {
                  setStatus('UNPAID');
                  setSelectedIds([]);
                }}
              >
                <Clock size={14} />
                Chưa đóng ({counts.unpaid})
              </button>
              <button
                type="button"
                className={`quick-filter-btn tone-positive ${status === 'PAID' ? 'is-active' : ''}`}
                onClick={() => {
                  setStatus('PAID');
                  setSelectedIds([]);
                }}
              >
                <CheckCircle2 size={14} />
                Đã đóng ({counts.paid})
              </button>
            </div>

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
              aria-label="Lọc hình thức đóng"
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
            >
              <option value="">Tất cả hình thức</option>
              <option value="BANK">Chuyển khoản</option>
              <option value="CASH">Tiền mặt</option>
              <option value="NONE">Chưa đóng</option>
            </select>

            <input
              aria-label="Lọc theo tháng"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>
        </div>

        {canCollectCash && visibleSelectedIds.length > 0 && (
          <div className="batch-action-bar">
            <span>
              <Wallet
                size={16}
                style={{ verticalAlign: '-3px', marginRight: 6 }}
              />
              Đã chọn <strong>{visibleSelectedIds.length}</strong> học viên chưa đóng ·
              Tổng thu tiền mặt: <strong>{currency(selectedTotal)}</strong>
            </span>
            <div className="batch-btns">
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => setSelectedIds([])}
              >
                Bỏ chọn
              </Button>
              <Button
                disabled={busy}
                onClick={() => setCashConfirmIds(visibleSelectedIds)}
              >
                <CheckCheck size={17} />
                {busy
                  ? 'Đang xác nhận…'
                  : `Xác nhận thu tiền mặt (${visibleSelectedIds.length})`}
              </Button>
            </div>
          </div>
        )}

        {remote.loading ? (
          <Loading />
        ) : remote.error ? (
          <ErrorState error={remote.error} retry={remote.reload} />
        ) : !filteredList.length ? (
          <EmptyState
            text="Không có dữ liệu thu phí phù hợp"
            description="Thử thay đổi bộ lọc trạng thái, lớp học hoặc tháng thu."
          />
        ) : (
          <div className="table-scroll">
            <table className="record-table invoices-table">
              <thead>
                <tr>
                  {canCollectCash && (
                    <th style={{ width: 44 }}>
                      <input
                        type="checkbox"
                        aria-label="Chọn tất cả học viên chưa đóng tiền"
                        style={{ width: 18, height: 18, cursor: 'pointer' }}
                        disabled={!selectableUnpaid.length}
                        checked={
                          selectableUnpaid.length > 0 &&
                          selectableUnpaid.every((inv) =>
                            selectedIds.includes(inv.id),
                          )
                        }
                        onChange={(e) =>
                          setSelectedIds(
                            e.target.checked
                              ? selectableUnpaid.map((inv) => inv.id)
                              : [],
                          )
                        }
                      />
                    </th>
                  )}
                  <th className="index-cell">STT</th>
                  <th>Mã</th>
                  <th>Võ sinh</th>
                  <th>Lớp học</th>
                  <th>Tháng thu</th>
                  <th>Số tiền</th>
                  <th>Hạn đóng</th>
                  <th>Hình thức đóng</th>
                  <th>Trạng thái</th>
                  <th className="action-cell">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((inv, idx) => {
                  const st = studentMap[inv.studentId];
                  const isPaid = inv.status === 'PAID';
                  const checked = selectedIds.includes(inv.id);
                  return (
                    <tr
                      key={inv.id}
                      className={
                        'clickable-row' + (checked ? ' is-selected' : '')
                      }
                      title="Bấm để xem chi tiết"
                      onClick={() => setDialog({ kind: 'detail', row: inv })}
                    >
                      {canCollectCash && (
                        <td data-label="Chọn" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            aria-label={`Chọn thu tiền mặt cho ${st?.fullName || inv.code}`}
                            style={{
                              width: 18,
                              height: 18,
                              cursor: isPaid ? 'default' : 'pointer',
                            }}
                            disabled={isPaid}
                            checked={checked}
                            onChange={() => toggleSelect(inv.id)}
                          />
                        </td>
                      )}
                      <td className="index-cell" data-label="STT">{idx + 1}</td>
                      <td data-label="Mã hóa đơn">
                        <span className="cell-primary">{inv.code}</span>
                      </td>
                      <td data-label="Võ sinh">
                        <div className="person-cell">
                          <span className={'avatar tone-' + (idx % 5)}>
                            {initials(st?.fullName || inv.code)}
                          </span>
                          <span>
                            <strong>{st?.fullName || '—'}</strong>
                            {st?.studentCode && <small>{st.studentCode}</small>}
                          </span>
                        </div>
                      </td>
                      <td data-label="Lớp học">{classMap[inv.classId] || '—'}</td>
                      <td data-label="Tháng thu">{inv.period}</td>
                      <td data-label="Số tiền">
                        <strong className="money">{currency(inv.amount)}</strong>
                      </td>
                      <td data-label="Hạn đóng">{formatDate(inv.dueDate)}</td>
                      <td data-label="Hình thức">
                        <span
                          className={
                            'method-pill ' +
                            (inv.paymentMethod === 'CASH'
                              ? 'method-cash'
                              : inv.paymentMethod === 'BANK'
                                ? 'method-bank'
                                : 'method-none')
                          }
                        >
                          {inv.paymentMethod === 'CASH'
                            ? 'Tiền mặt'
                            : inv.paymentMethod === 'BANK'
                              ? 'Chuyển khoản'
                              : 'Chưa đóng'}
                        </span>
                      </td>
                      <td data-label="Trạng thái">
                        <Badge value={inv.status} />
                      </td>
                      <td
                        data-label="Thao tác"
                        className="action-cell"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="row-actions">
                          <button
                            type="button"
                            className="icon-btn"
                            title="Xem chi tiết hóa đơn"
                            aria-label="Xem chi tiết hóa đơn"
                            onClick={() => setDialog({ kind: 'detail', row: inv })}
                          >
                            <Eye size={16} />
                          </button>
                          {isPaid && (
                            <button
                              type="button"
                              className="icon-btn"
                              title="Xem và in biên nhận"
                              aria-label="Xem và in biên nhận"
                              onClick={() => setPrintReceipt(inv)}
                            >
                              <Printer size={16} />
                            </button>
                          )}
                          {canCollectCash && !isPaid && (
                            <button
                              type="button"
                              className="review-action review-action-approve"
                              disabled={busy}
                              title="Xác nhận thu tiền mặt"
                              aria-label="Xác nhận thu tiền mặt"
                              onClick={() => setCashConfirmIds([inv.id])}
                            >
                              <Banknote size={16} />
                            </button>
                          )}
                          {can(config, user?.role, 'E') && !isPaid && (
                            <button
                              type="button"
                              className="icon-btn"
                              title="Chỉnh sửa"
                              aria-label="Chỉnh sửa"
                              onClick={() =>
                                setDialog({
                                  kind: 'form',
                                  row: {
                                    ...inv,
                                    amount: inv.baseAmount ?? inv.amount,
                                  },
                                })
                              }
                            >
                              <PenLine size={16} />
                            </button>
                          )}
                          {can(config, user?.role, 'D') && !isPaid && (
                            <button
                              type="button"
                              className="icon-btn danger-icon"
                              title="Xóa"
                              aria-label="Xóa"
                              onClick={() =>
                                setDialog({ kind: 'delete', row: inv })
                              }
                            >
                              <Trash2 size={16} />
                            </button>
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
          lockedWorkflow={dialog.row?.status === 'PAID'}
          resolve={resolveField}
          columnLabel={columnLabel}
          onClose={() => setDialog(null)}
          onEdit={() =>
            setDialog({
              kind: 'form',
              row: {
                ...dialog.row,
                amount: dialog.row.baseAmount ?? dialog.row.amount,
              },
            })
          }
        />
      )}

      {cashConfirmInvoices.length > 0 && (
        <CashConfirmModal
          invoices={cashConfirmInvoices}
          studentMap={studentMap}
          classMap={classMap}
          pendingTransferInvoiceIds={pendingTransferInvoiceIds}
          busy={busy}
          onCancel={() => setCashConfirmIds([])}
          onConfirm={async () => {
            const idsToCollect = cashConfirmInvoices.map((i) => i.id);
            setCashConfirmIds([]);
            await collectCashForIds(idsToCollect);
          }}
        />
      )}

      {printReceipt && (
        <ReceiptPrintModal
          receipt={printReceipt}
          student={studentMap[printReceipt.studentId]}
          className={classMap[printReceipt.classId]}
          onClose={() => setPrintReceipt(null)}
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
      {batchOpen && (
        <BatchInvoiceModal
          classes={classes}
          students={students}
          existingInvoices={items}
          onClose={() => setBatchOpen(false)}
          onGenerate={handleBatchGenerate}
        />
      )}
    </div>
  );
}
