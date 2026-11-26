import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import {
  BadgeCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  Eye,
  Printer,
  Filter,
  AlertCircle,
} from 'lucide-react';
import OrganizationScope from '../../../components/common/OrganizationScope.jsx';
import FilteredExportButton from '../../../components/common/FilteredExportButton.jsx';
import Button from '../../../components/common/Button.jsx';
import Badge from '../../../components/common/Badge.jsx';
import Pagination from '../../../components/common/Pagination.jsx';
import Modal from '../../../components/common/Modal.jsx';
import Loading from '../../../components/common/Loading.jsx';
import EmptyState from '../../../components/common/EmptyState.jsx';
import ErrorState from '../../../components/common/ErrorState.jsx';
import RecordDetail from '../../../components/common/RecordDetail.jsx';
import ReceiptPrintModal from '../../online-payments/components/ReceiptPrintModal.jsx';
import { useAuth } from '../../../contexts/AuthContext.jsx';
import { useToast } from '../../../contexts/ToastContext.jsx';
import { useRemote } from '../../../hooks/useRemote.js';
import { api } from '../../../services/api.js';
import { fetchAllPages } from '../../../utils/fetchAllPages.js';
import { normalizeSearch } from '../../organization/navigation.js';
import { can } from '../../../utils/permissions.js';
import { currency, formatDate, formatDateTime, statusLabels } from '../../../utils/format.js';
import config from '../module.js';
import service from '../services/paymentConfirmationsService.js';

const STATUS_TABS = [
  { key: 'PENDING', label: 'Chờ đối soát', icon: Clock },
  { key: 'SUCCESS', label: 'Đã xác nhận', icon: CheckCircle2 },
  { key: 'REJECTED', label: 'Từ chối / Đã đóng', icon: XCircle },
  { key: 'ALL', label: 'Tất cả', icon: Filter },
];

export default function PaymentConfirmationsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [url, setUrl] = useSearchParams();
  const wardScope = url.get('wardId') || '';
  const clubScope = url.get('clubId') || '';

  if (user?.role === 'STUDENT') {
    return <Navigate to="/app/online-payments" replace />;
  }

  const canReview = can(config, user?.role, 'A');

  const [statusTab, setStatusTabState] = useState(
    () => url.get('status') || 'PENDING',
  );
  const [classId, setClassIdState] = useState(() => url.get('classId') || '');
  const [search, setSearchState] = useState(() => url.get('search') || '');
  const [busyId, setBusyId] = useState('');
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [page, setPage] = useState(1);
  const [rejectReason, setRejectReason] = useState('');
  const [detailRow, setDetailRow] = useState(null);
  const [printRow, setPrintRow] = useState(null);
  const triggerRef = useRef(null);

  // Sync filters whenever URL search params change externally
  useEffect(() => {
    setStatusTabState(url.get('status') || 'PENDING');
    setClassIdState(url.get('classId') || '');
    setSearchState(url.get('search') || '');
  }, [url]);

  const syncParam = (key, value) => {
    const next = new URLSearchParams(url);
    if (value && value !== 'ALL') next.set(key, value);
    else next.delete(key);
    setUrl(next, { replace: true });
  };

  const setStatusTab = (v) => {
    setStatusTabState(v);
    syncParam('status', v);
  };
  const setClassId = (v) => {
    setClassIdState(v);
    syncParam('classId', v);
  };
  const setSearch = (v) => {
    setSearchState(v);
    syncParam('search', v.trim());
  };

  const remote = useRemote(
    async (signal) => {
      const [listRes, lookupRes] = await Promise.all([
        fetchAllPages(service, { classId }, signal),
        api.request('/lookups', {
          signal,
          query: { module: 'payment-confirmations' },
        }),
      ]);
      return {
        items: listRes.items || [],
        lookups: lookupRes || {},
      };
    },
    [user?.id, wardScope, clubScope, classId],
  );

  useEffect(() => {
    if (!api.subscribeResource) return;
    const off1 = api.subscribeResource('payment-confirmations', remote.reload);
    const off2 = api.subscribeResource('online-payments', remote.reload);
    const off3 = api.subscribeResource('invoices', remote.reload);
    return () => {
      off1?.();
      off2?.();
      off3?.();
    };
  }, [remote.reload]);

  const items = remote.data?.items || [];
  const lookups = remote.data?.lookups || {};
  const students = lookups.students || [];
  const classes = lookups.classes || [];
  const invoices = lookups.invoices || [];

  // Clear stale classId if ward/club scope changed and classId is outside scope
  useEffect(() => {
    if (classId && classes.length > 0 && !classes.some((c) => c.id === classId)) {
      setClassId('');
    }
  }, [classes, classId]);

  const studentMap = useMemo(
    () => Object.fromEntries(students.map((s) => [s.id, s])),
    [students],
  );
  const classMap = useMemo(
    () => Object.fromEntries(classes.map((c) => [c.id, c.name])),
    [classes],
  );
  const invoiceMap = useMemo(
    () => Object.fromEntries(invoices.map((i) => [i.id, i])),
    [invoices],
  );

  const counts = useMemo(() => {
    const pending = items.filter((r) => r.status === 'PENDING');
    const success = items.filter((r) => r.status === 'SUCCESS');
    const rejected = items.filter((r) => r.status === 'REJECTED');
    return {
      ALL: items.length,
      PENDING: pending.length,
      SUCCESS: success.length,
      REJECTED: rejected.length,
      pendingAmount: pending.reduce((s, r) => s + Number(r.amount || 0), 0),
      successAmount: success.reduce((s, r) => s + Number(r.amount || 0), 0),
    };
  }, [items]);

  const filteredList = useMemo(() => {
    const terms = normalizeSearch(search).split(' ').filter(Boolean);
    return items.filter((row) => {
      if (statusTab !== 'ALL' && row.status !== statusTab) return false;
      if (terms.length) {
        const st = studentMap[row.studentId];
        const inv = invoiceMap[row.invoiceId];
        const hay = normalizeSearch(
          [
            row.code,
            inv?.code,
            st?.fullName,
            st?.studentCode,
            classMap[row.classId],
            row.note,
            row.reviewNote,
          ]
            .filter(Boolean)
            .join(' '),
        );
        if (!terms.every((t) => hay.includes(t))) return false;
      }
      return true;
    });
  }, [items, statusTab, search, studentMap, classMap, invoiceMap]);

  const requestCloseReject = () => {
    if (busyId) return;
    if (
      rejectReason.trim() &&
      typeof window !== 'undefined' &&
      !window.confirm('Bạn có lý do từ chối chưa gửi. Bỏ thay đổi này?')
    ) {
      return;
    }
    setRejectTarget(null);
    setRejectReason('');
  };

  async function handleApprove(row) {
    if (!canReview || busyId) return;
    setBusyId(row.id);
    try {
      await api.request(
        `/payment-confirmations/${encodeURIComponent(row.id)}/actions/approve`,
        {
          method: 'POST',
          body: { reason: 'Đã đối soát và xác nhận chuyển khoản.' },
        },
      );
      setApproveTarget(null);
      toast(`Đã xác nhận chuyển khoản ${row.code || ''} thành công.`);
      remote.reload();
    } catch (err) {
      toast(err?.message || 'Không thể xác nhận giao dịch.', 'error');
    } finally {
      setBusyId('');
    }
  }

  async function handleRejectSubmit() {
    if (!rejectTarget || !canReview || busyId) return;
    const trimmed = rejectReason.trim();
    if (trimmed.length < 4) {
      toast('Vui lòng nhập lý do từ chối tối thiểu 4 ký tự để võ sinh nắm rõ.', 'error');
      return;
    }
    setBusyId(rejectTarget.id);
    try {
      await api.request(
        `/payment-confirmations/${encodeURIComponent(rejectTarget.id)}/actions/reject`,
        {
          method: 'POST',
          body: { reason: trimmed },
        },
      );
      toast(`Đã từ chối yêu cầu ${rejectTarget.code || ''} và gửi thông báo cho võ sinh.`);
      setRejectTarget(null);
      setRejectReason('');
      remote.reload();
    } catch (err) {
      toast(err?.message || 'Không thể từ chối yêu cầu.', 'error');
    } finally {
      setBusyId('');
    }
  }

  if (remote.loading && !remote.data) return <Loading />;
  if (remote.error) {
    return <ErrorState error={remote.error} retry={remote.reload} />;
  }

  return (
    <div className="feature-page payment-confirmations-page">
      <div className="page-heading">
        <div>
          <span className="section-kicker">TÀI CHÍNH · ĐỐI SOÁT</span>
          <h1>Đối soát chuyển khoản</h1>
          <p>
            Kiểm tra sao kê ngân hàng, xác nhận hoặc từ chối kèm lý do cho các
            yêu cầu chuyển khoản học phí của võ sinh.
          </p>
        </div>
        <div className="heading-actions">
          <FilteredExportButton
            config={config}
            service={service}
            rows={filteredList}
            query={{ classId, status: statusTab, search }}
            lookups={lookups}
          />
          <Button variant="secondary" onClick={remote.reload}>
            <RefreshCw size={16} />
            Làm mới
          </Button>
        </div>
      </div>

      <OrganizationScope />

      <section className="overview-metrics" aria-label="Tổng quan đối soát">
        <div className="overview-card">
          <span className="overview-icon amber">
            <Clock size={22} />
          </span>
          <div>
            <h2>Đang chờ đối soát</h2>
            <strong>{counts.PENDING}</strong>
            <p>{currency(counts.pendingAmount)} cần kiểm tra</p>
          </div>
        </div>
        <div className="overview-card">
          <span className="overview-icon green">
            <BadgeCheck size={22} />
          </span>
          <div>
            <h2>Đã xác nhận</h2>
            <strong>{counts.SUCCESS}</strong>
            <p>{currency(counts.successAmount)} đã ghi nhận</p>
          </div>
        </div>
        <div className="overview-card">
          <span className="overview-icon blue">
            <XCircle size={22} />
          </span>
          <div>
            <h2>Từ chối / Đã đóng</h2>
            <strong>{counts.REJECTED}</strong>
            <p>Lưu đủ lịch sử và lý do</p>
          </div>
        </div>
      </section>

      <div className="filter-bar reconcile-toolbar">
        <div className="reconcile-tabs" role="tablist" aria-label="Trạng thái đối soát">
          {STATUS_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = statusTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={active}
                className={`reconcile-tab ${active ? 'active' : ''}`}
                onClick={() => setStatusTab(tab.key)}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
                <span className="reconcile-tab-count">{counts[tab.key]}</span>
              </button>
            );
          })}
        </div>

        <div className="reconcile-controls">
          <label className="search-field">
            <Search size={16} />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm mã CK, hóa đơn, tên võ sinh..."
              aria-label="Tìm yêu cầu đối soát"
            />
          </label>
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            aria-label="Lọc theo lớp học"
          >
            <option value="">Tất cả lớp học</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!filteredList.length ? (
        <EmptyState
          title="Không có yêu cầu đối soát phù hợp"
          description={
            statusTab === 'PENDING'
              ? 'Hiện tại tất cả yêu cầu chuyển khoản trong phạm vi này đều đã được xử lý.'
              : 'Thử đổi trạng thái lọc hoặc từ khóa tìm kiếm.'
          }
        />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã đối soát</th>
                <th>Võ sinh & Lớp</th>
                <th>Hóa đơn</th>
                <th className="num">Số tiền</th>
                <th>Thời gian gửi</th>
                <th>Trạng thái & Ghi chú</th>
                <th className="actions-col">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.slice((Math.min(page, Math.max(1, Math.ceil(filteredList.length / 25))) - 1) * 25, Math.min(page, Math.max(1, Math.ceil(filteredList.length / 25))) * 25).map((row) => {
                const st = studentMap[row.studentId];
                const inv = invoiceMap[row.invoiceId];
                const isPending = row.status === 'PENDING';
                const isBusy = busyId === row.id;
                return (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.code || row.id?.slice(0, 8)}</strong>
                    </td>
                    <td data-label="Võ sinh">
                      <div className="cell-stack">
                        <strong>{st?.fullName || row.submittedName || '—'}</strong>
                        <small>
                          {st?.studentCode ? `${st.studentCode} · ` : ''}
                          {classMap[row.classId] || '—'}
                        </small>
                      </div>
                    </td>
                    <td data-label="Hóa đơn">
                      <div className="cell-stack">
                        <strong>{inv?.code || row.invoiceId || '—'}</strong>
                        {inv?.period && <small>Kỳ {inv.period}</small>}
                      </div>
                    </td>
                    <td className="num" data-label="Số tiền">
                      <strong>{currency(row.amount)}</strong>
                    </td>
                    <td data-label="Thời gian gửi">
                      <div className="cell-stack">
                        <span>{formatDateTime(row.createdAt)}</span>
                        {row.reviewedName && (
                          <small>Xử lý: {row.reviewedName}</small>
                        )}
                      </div>
                    </td>
                    <td data-label="Trạng thái">
                      <div className="cell-stack">
                        <Badge
                          tone={
                            row.status === 'SUCCESS'
                              ? 'success'
                              : row.status === 'REJECTED'
                                ? 'danger'
                                : 'warning'
                          }
                        >
                          {row.supersededByCash
                            ? 'Đã thu tiền mặt'
                            : statusLabels[row.status] || row.status}
                        </Badge>
                        {(row.reviewNote || row.note) && (
                          <small className="reconcile-note">
                            {row.reviewNote || row.note}
                          </small>
                        )}
                      </div>
                    </td>
                    <td className="actions-col" data-label="Thao tác">
                      <div className="row-actions">
                        <button
                          type="button"
                          className="btn-inline-action"
                          onClick={(e) => {
                            triggerRef.current = e.currentTarget;
                            setDetailRow(row);
                          }}
                          title="Xem chi tiết yêu cầu"
                        >
                          <Eye size={15} />
                          <span>Chi tiết</span>
                        </button>
                        {isPending && canReview && (
                          <>
                            <button
                              type="button"
                              className="btn-inline-action tone-success"
                              disabled={Boolean(busyId)}
                              onClick={() => setApproveTarget(row)}
                            >
                              <CheckCircle2 size={15} />
                              <span>{isBusy ? 'Đang duyệt…' : 'Xác nhận'}</span>
                            </button>
                            <button
                              type="button"
                              className="btn-inline-action tone-danger"
                              disabled={Boolean(busyId)}
                              onClick={() => {
                                setRejectTarget(row);
                                setRejectReason('');
                              }}
                            >
                              <XCircle size={15} />
                              <span>Từ chối</span>
                            </button>
                          </>
                        )}
                        {row.status === 'SUCCESS' && (
                          <button
                            type="button"
                            className="btn-inline-action"
                            onClick={() => setPrintRow(row)}
                            title="Xem và in biên nhận"
                          >
                            <Printer size={15} />
                            <span>In</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredList.length > 25 && (
            <Pagination
              page={Math.min(page, Math.max(1, Math.ceil(filteredList.length / 25)))}
              total={filteredList.length}
              limit={25}
              onChange={setPage}
            />
          )}
        </div>
      )}

      {approveTarget && (
        <Modal
          title="Xác nhận đã nhận tiền chuyển khoản"
          subtitle={`Kiểm tra kỹ thông tin đối chiếu trước khi ghi nhận thanh toán`}
          onClose={() => !busyId && setApproveTarget(null)}
          footer={
            <>
              <Button
                variant="secondary"
                disabled={Boolean(busyId)}
                onClick={() => setApproveTarget(null)}
              >
                Hủy
              </Button>
              <Button
                variant="primary"
                disabled={Boolean(busyId)}
                onClick={() => handleApprove(approveTarget)}
              >
                <CheckCircle2 size={16} />
                {busyId ? 'Đang xác nhận…' : `Xác nhận ${currency(approveTarget.amount)}`}
              </Button>
            </>
          }
        >
          <dl className="detail-grid">
            <div>
              <dt>Võ sinh / Người nộp</dt>
              <dd>{studentMap[approveTarget.studentId]?.fullName || approveTarget.submittedName || '—'}</dd>
            </div>
            <div>
              <dt>Hóa đơn</dt>
              <dd>{invoiceMap[approveTarget.invoiceId]?.code || approveTarget.invoiceId || '—'}</dd>
            </div>
            <div>
              <dt>Số tiền chuyển khoản</dt>
              <dd><strong>{currency(approveTarget.amount)}</strong></dd>
            </div>
            <div>
              <dt>Mã đối soát / Tham chiếu</dt>
              <dd>{approveTarget.code || approveTarget.id}</dd>
            </div>
          </dl>
        </Modal>
      )}

      {rejectTarget && (
        <Modal
          title="Từ chối yêu cầu chuyển khoản"
          subtitle={`Mã đối soát: ${rejectTarget.code || rejectTarget.id}`}
          onClose={requestCloseReject}
          footer={
            <>
              <Button
                variant="secondary"
                disabled={Boolean(busyId)}
                onClick={requestCloseReject}
              >
                Hủy
              </Button>
              <Button
                variant="danger"
                disabled={Boolean(busyId)}
                onClick={handleRejectSubmit}
              >
                {busyId ? 'Đang xử lý…' : 'Xác nhận từ chối'}
              </Button>
            </>
          }
        >
          <div className="reject-modal-body">
            <p className="reject-modal-hint">
              <AlertCircle size={16} /> Lý do từ chối sẽ được gửi trực tiếp tới
              võ sinh để kiểm tra lại giao dịch hoặc chuyển khoản lại.
            </p>
            <label className="form-field">
              <span>Lý do từ chối *</span>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ví dụ: Chưa nhận được tiền trong sao kê ngân hàng, hoặc số tiền chưa khớp hóa đơn..."
                autoFocus
              />
            </label>
          </div>
        </Modal>
      )}

      {detailRow && (
        <RecordDetail
          config={config}
          record={detailRow}
          lookups={lookups}
          onClose={() => {
            setDetailRow(null);
            triggerRef.current?.focus?.();
          }}
        />
      )}

      {printRow && (
        <ReceiptPrintModal
          receipt={{
            ...printRow,
            invoiceCode: invoiceMap[printRow.invoiceId]?.code,
            period: invoiceMap[printRow.invoiceId]?.period,
            paymentMethod: 'BANK',
          }}
          student={studentMap[printRow.studentId]}
          className={classMap[printRow.classId]}
          onClose={() => setPrintRow(null)}
        />
      )}
    </div>
  );
}
