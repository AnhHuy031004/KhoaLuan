import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  RefreshCw,
  X,
  Filter,
  Landmark,
  Banknote,
  ReceiptText,
  Printer,
} from 'lucide-react';
import OrganizationScope from '../../../components/common/OrganizationScope.jsx';
import FilteredExportButton from '../../../components/common/FilteredExportButton.jsx';
import Badge from '../../../components/common/Badge.jsx';
import Loading from '../../../components/common/Loading.jsx';
import EmptyState from '../../../components/common/EmptyState.jsx';
import ErrorState from '../../../components/common/ErrorState.jsx';
import RecordDetail from '../../../components/common/RecordDetail.jsx';
import ReceiptPrintModal from '../components/ReceiptPrintModal.jsx';
import StudentOnlineTuitionPortal from '../components/StudentOnlineTuitionPortal.jsx';
import { useAuth } from '../../../contexts/AuthContext.jsx';
import { useRemote } from '../../../hooks/useRemote.js';
import { api } from '../../../services/api.js';
import { fetchAllPages } from '../../../utils/fetchAllPages.js';
import { normalizeSearch } from '../../organization/navigation.js';
import {
  currency,
  formatDate,
  formatDateTime,
  initials,
  statusLabels,
} from '../../../utils/format.js';
import config from '../module.js';
import invoicesService from '../../invoices/services/invoicesService.js';

export default function OnlinePaymentsPage() {
  const { user } = useAuth();
  const [url, setUrl] = useSearchParams();
  const wardScope = url.get('wardId') || '';
  const clubScope = url.get('clubId') || '';

  if (user?.role === 'STUDENT') {
    return <StudentOnlineTuitionPortal />;
  }

  // F09: Sync all filters with URL search params so reloading preserves state
  const [methodTab, setMethodTabState] = useState(
    () => url.get('method') || 'ALL',
  );
  const [classId, setClassIdState] = useState(() => url.get('classId') || '');
  const [month, setMonthState] = useState(() => url.get('month') || '');
  const [search, setSearchState] = useState(() => url.get('search') || '');
  const [detailRow, setDetailRow] = useState(null);
  const [printRow, setPrintRow] = useState(null);
  const triggerRef = useRef(null);

  const syncParam = (key, value) => {
    const next = new URLSearchParams(url);
    if (value && value !== 'ALL') next.set(key, value);
    else next.delete(key);
    setUrl(next, { replace: true });
  };

  const setMethodTab = (v) => {
    setMethodTabState(v);
    syncParam('method', v);
  };
  const setClassId = (v) => {
    setClassIdState(v);
    syncParam('classId', v);
  };
  const setMonth = (v) => {
    setMonthState(v);
    syncParam('month', v);
  };
  const setSearch = (v) => {
    setSearchState(v);
    syncParam('search', v.trim());
  };

  // F04: Fetch ALL pages so >500 invoices never truncate stats or exports
  const remote = useRemote(
    async (signal) => {
      const [invRes, lookup] = await Promise.all([
        fetchAllPages(invoicesService, { classId, month }, signal),
        api.request('/lookups', { signal, query: { module: 'invoices' } }),
      ]);
      return {
        items: invRes.items || [],
        lookups: lookup || {},
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

  const allInvoices = remote.data?.items || [];
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

  const paidReceipts = useMemo(
    () => allInvoices.filter((i) => i.status === 'PAID'),
    [allInvoices],
  );

  const stats = useMemo(() => {
    const bank = paidReceipts.filter((i) => i.paymentMethod === 'BANK');
    const cash = paidReceipts.filter((i) => i.paymentMethod === 'CASH');
    return {
      allCount: paidReceipts.length,
      bankCount: bank.length,
      cashCount: cash.length,
      totalAmount: paidReceipts.reduce((s, i) => s + Number(i.amount || 0), 0),
      bankAmount: bank.reduce((s, i) => s + Number(i.amount || 0), 0),
      cashAmount: cash.reduce((s, i) => s + Number(i.amount || 0), 0),
    };
  }, [paidReceipts]);

  // F08: Accent-insensitive search using normalizeSearch
  const filtered = useMemo(() => {
    const terms = normalizeSearch(search).split(' ').filter(Boolean);
    return paidReceipts.filter((inv) => {
      if (methodTab === 'BANK' && inv.paymentMethod !== 'BANK') return false;
      if (methodTab === 'CASH' && inv.paymentMethod !== 'CASH') return false;
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
  }, [paidReceipts, methodTab, search, studentMap, classMap]);

  function openDetail(row, el) {
    triggerRef.current = el || document.activeElement;
    setDetailRow(row);
  }

  function closeDetail() {
    setDetailRow(null);
    requestAnimationFrame(() => triggerRef.current?.focus?.());
  }

  function resolveField(key, value) {
    if (key === 'studentId') return studentMap[value]?.fullName || '—';
    if (key === 'classId') return classMap[value] || '—';
    if (key === 'amount' || key === 'baseAmount') return currency(value);
    if (key === 'paymentMethod' || key === 'method')
      return value === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản';
    if (key === 'status') return statusLabels[value] || value;
    if (/Date$|At$/.test(key)) return formatDate(value);
    return value ?? '—';
  }

  const columnLabel = (k) =>
    ({
      code: 'Mã hóa đơn',
      studentId: 'Võ sinh',
      classId: 'Lớp học',
      period: 'Kỳ thu',
      amount: 'Số tiền',
      paymentMethod: 'Hình thức thanh toán',
      paidAt: 'Ngày thanh toán',
      dueDate: 'Hạn đóng',
      status: 'Trạng thái',
      createdAt: 'Ngày lập',
    })[k] || k;

  return (
    <div className="feature-page">
      <OrganizationScope />

      <div className="page-heading">
        <div>
          <div className="section-kicker">
            TÀI CHÍNH
            <span />
            VOVINAM
          </div>
          <h1>Hóa đơn</h1>
          <p>
            Tổng hợp toàn bộ biên nhận học phí đã nhận tiền gồm Chuyển khoản (đã
            đối soát) và Tiền mặt.
          </p>
        </div>
        <div className="heading-actions">
          <FilteredExportButton
            config={{ ...config, title: 'Hóa đơn' }}
            rows={filtered}
            lookups={lookups}
            query={{ classId, month, methodTab, search }}
          />
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="report-stats">
        <div className="metric-card">
          <div className="metric-icon">
            <ReceiptText size={20} />
          </div>
          <span>Tổng doanh thu hóa đơn</span>
          <strong>{currency(stats.totalAmount)}</strong>
          <small>{stats.allCount} hóa đơn đã nhận tiền</small>
        </div>
        <div className="metric-card">
          <div className="metric-icon">
            <Landmark size={20} />
          </div>
          <span>Chuyển khoản (Online)</span>
          <strong>{currency(stats.bankAmount)}</strong>
          <small>{stats.bankCount} hóa đơn đã đối soát</small>
        </div>
        <div className="metric-card">
          <div className="metric-icon">
            <Banknote size={20} />
          </div>
          <span>Tiền mặt</span>
          <strong>{currency(stats.cashAmount)}</strong>
          <small>{stats.cashCount} hóa đơn thu trực tiếp</small>
        </div>
      </div>

      <section className="panel data-panel">
        <div className="data-panel-title">
          <div>
            <h2>
              Danh sách hóa đơn đã nhận tiền
              <span className="count-pill">{filtered.length}</span>
            </h2>
            <p>
              Chọn mã hóa đơn hoặc bấm trực tiếp vào dòng để xem chi tiết biên
              nhận đầy đủ.
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
              aria-label="Tìm hóa đơn"
              placeholder="Tìm mã hóa đơn, tên võ sinh hoặc lớp…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                aria-label="Xóa tìm kiếm"
                onClick={() => setSearch('')}
              >
                <X size={14} />
              </button>
            )}
          </label>
          <div className="filter-controls">
            <Filter size={16} />
            <div className="quick-filter-group">
              <button
                type="button"
                className={`quick-filter-btn ${methodTab === 'ALL' ? 'is-active' : ''}`}
                onClick={() => setMethodTab('ALL')}
              >
                Tất cả ({stats.allCount})
              </button>
              <button
                type="button"
                className={`quick-filter-btn ${methodTab === 'BANK' ? 'is-active' : ''}`}
                onClick={() => setMethodTab('BANK')}
              >
                <Landmark size={14} />
                Chuyển khoản ({stats.bankCount})
              </button>
              <button
                type="button"
                className={`quick-filter-btn tone-positive ${methodTab === 'CASH' ? 'is-active' : ''}`}
                onClick={() => setMethodTab('CASH')}
              >
                <Banknote size={14} />
                Tiền mặt ({stats.cashCount})
              </button>
            </div>

            <select
              aria-label="Lọc theo lớp"
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
              aria-label="Lọc theo tháng"
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
        ) : !filtered.length ? (
          <EmptyState
            text="Chưa có hóa đơn nào phù hợp"
            description="Hóa đơn sẽ xuất hiện sau khi giao dịch chuyển khoản được đối soát hoặc thu tiền mặt hoàn tất."
          />
        ) : (
          <div className="table-scroll">
            <table className="record-table">
              <thead>
                <tr>
                  <th className="index-cell">STT</th>
                  <th>Mã hóa đơn</th>
                  <th>Võ sinh</th>
                  <th>Lớp học</th>
                  <th>Kỳ thu</th>
                  <th>Số tiền</th>
                  <th>Hình thức</th>
                  <th>Ngày thanh toán</th>
                  <th>Trạng thái</th>
                  <th className="action-cell">Biên nhận</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv, idx) => {
                  const st = studentMap[inv.studentId];
                  return (
                    <tr
                      key={inv.id}
                      className="clickable-row"
                      tabIndex={0}
                      title="Bấm hoặc nhấn Enter để xem chi tiết hóa đơn"
                      onClick={(e) => openDetail(inv, e.currentTarget)}
                      onKeyDown={(e) => {
                        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault();
                          openDetail(inv, e.currentTarget);
                        }
                      }}
                    >
                      <td className="index-cell" data-label="STT">{idx + 1}</td>
                      <td>
                        <button
                          type="button"
                          className="text-btn cell-primary"
                          aria-label={`Xem chi tiết hóa đơn ${inv.code}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetail(inv, e.currentTarget);
                          }}
                        >
                          {inv.code}
                        </button>
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
                      <td data-label="Kỳ thu">{inv.period}</td>
                      <td data-label="Số tiền">
                        <strong className="money">
                          {currency(inv.amount)}
                        </strong>
                      </td>
                      <td data-label="Phương thức">
                        <span
                          className={
                            'method-pill ' +
                            (inv.paymentMethod === 'CASH'
                              ? 'method-cash'
                              : 'method-bank')
                          }
                        >
                          {inv.paymentMethod === 'CASH'
                            ? 'Tiền mặt'
                            : 'Chuyển khoản'}
                        </span>
                      </td>
                      <td data-label="Thời gian thu">{formatDateTime(inv.paidAt || inv.createdAt)}</td>
                      <td data-label="Trạng thái">
                        <Badge value="PAID" label="Đã nhận tiền" />
                      </td>
                      <td
                        data-label="Thao tác"
                        className="action-cell"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="btn-inline-action"
                          aria-label={`In biên nhận ${inv.code}`}
                          onClick={() => setPrintRow(inv)}
                        >
                          <Printer size={14} />
                          <span>In</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {printRow && (
        <ReceiptPrintModal
          receipt={printRow}
          student={studentMap[printRow.studentId]}
          className={classMap[printRow.classId]}
          onClose={() => setPrintRow(null)}
        />
      )}

      {detailRow && (
        <RecordDetail
          row={detailRow}
          config={{ ...config, title: 'Chi tiết hóa đơn' }}
          user={user}
          lockedWorkflow={true}
          resolve={resolveField}
          columnLabel={columnLabel}
          onClose={closeDetail}
          onEdit={() => {}}
        />
      )}
    </div>
  );
}

