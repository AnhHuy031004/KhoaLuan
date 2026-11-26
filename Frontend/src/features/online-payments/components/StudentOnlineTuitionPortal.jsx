import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  RefreshCw,
  Landmark,
  Banknote,
  ReceiptText,
  QrCode,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  Layers,
  Clock,
  AlertTriangle,
  History,
  Printer,
} from 'lucide-react';
import Button from '../../../components/common/Button.jsx';
import Badge from '../../../components/common/Badge.jsx';
import Loading from '../../../components/common/Loading.jsx';
import EmptyState from '../../../components/common/EmptyState.jsx';
import ErrorState from '../../../components/common/ErrorState.jsx';
import RecordDetail from '../../../components/common/RecordDetail.jsx';
import ReceiptPrintModal from './ReceiptPrintModal.jsx';
import SimulatedQrSvg from './SimulatedQrSvg.jsx';
import { useAuth } from '../../../contexts/AuthContext.jsx';
import { useToast } from '../../../contexts/ToastContext.jsx';
import { useRemote } from '../../../hooks/useRemote.js';
import { api, IS_MOCK } from '../../../services/api.js';
import { fetchAllPages } from '../../../utils/fetchAllPages.js';
import {
  currency,
  formatDate,
  statusLabels,
} from '../../../utils/format.js';
import config from '../module.js';
import invoicesService from '../../invoices/services/invoicesService.js';

export default function StudentOnlineTuitionPortal() {
  const { user } = useAuth();
  const toast = useToast();

  const [portalTab, setPortalTab] = useState('INVOICES'); // INVOICES | TRANSACTIONS
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    setMethodTabState(url.get('method') || 'ALL');
    setClassIdState(url.get('classId') || '');
    setMonthState(url.get('month') || '');
    setSearchState(url.get('search') || '');
  }, [url]);
  const [detailRow, setDetailRow] = useState(null);
  const [printRow, setPrintRow] = useState(null);
  const triggerRef = useRef(null);

  const remote = useRemote(
    async (signal) => {
      const [invRes, lookup, pendingRes, txRes] = await Promise.all([
        fetchAllPages(invoicesService, {}, signal),
        api.request('/lookups', { signal, query: { module: 'invoices' } }),
        api
          .request('/online-payments', {
            signal,
            query: { limit: 200 },
          })
          .catch(() => ({ items: [] })),
        api
          .request('/transactions', {
            signal,
            query: { limit: 200 },
          })
          .catch(() => ({ items: [] })),
      ]);
      return {
        invoices: invRes.items || [],
        lookups: lookup || {},
        onlinePayments: pendingRes?.items || [],
        transactions: txRes?.items || [],
      };
    },
    [user?.id],
  );

  useEffect(() => {
    if (!api.subscribeResource) return;
    const off1 = api.subscribeResource('invoices', remote.reload);
    const off2 = api.subscribeResource('online-payments', remote.reload);
    const off3 = api.subscribeResource('transactions', remote.reload);
    return () => {
      off1?.();
      off2?.();
      off3?.();
    };
  }, [remote.reload]);

  const invoices = remote.data?.invoices || [];
  const lookups = remote.data?.lookups || {};
  const onlinePayments = remote.data?.onlinePayments || [];
  const transactions = remote.data?.transactions || [];
  const classes = lookups.classes || [];
  const students = lookups.students || [];

  // F06: Match exact student profile by user.studentId or email; never hardcode 'VS0001'
  const studentProfile = useMemo(() => {
    if (user?.studentId) {
      const byId = students.find((s) => s.id === user.studentId);
      if (byId) return byId;
    }
    if (user?.email) {
      const lower = user.email.toLowerCase();
      const byEmail = students.find(
        (s) => s.email && s.email.toLowerCase() === lower,
      );
      if (byEmail) return byEmail;
    }
    const invoiceStudentId = invoices[0]?.studentId;
    if (invoiceStudentId) {
      const byInv = students.find((s) => s.id === invoiceStudentId);
      if (byInv) return byInv;
    }
    return {
      fullName: user?.fullName || '',
      studentCode: user?.studentCode || '',
      classId: invoices[0]?.classId || '',
    };
  }, [students, user, invoices]);

  // Pending verification map by invoiceId
  const pendingByInvoice = useMemo(() => {
    const map = {};
    for (const p of onlinePayments) {
      if (p.invoiceId && p.status === 'PENDING') {
        map[p.invoiceId] = p;
      }
    }
    return map;
  }, [onlinePayments]);

  // Classes linked to student's invoices or profile
  const studentClasses = useMemo(() => {
    const ids = new Set(invoices.map((i) => i.classId).filter(Boolean));
    if (studentProfile?.classId) ids.add(studentProfile.classId);
    const list = classes.filter((c) => ids.has(c.id));
    return list.length ? list : classes;
  }, [classes, invoices, studentProfile]);

  useEffect(() => {
    if (
      studentClasses.length &&
      (!selectedClassId ||
        !studentClasses.some((c) => c.id === selectedClassId))
    ) {
      setSelectedClassId(studentClasses[0].id);
    }
  }, [studentClasses, selectedClassId]);

  const classInvoices = useMemo(
    () =>
      selectedClassId
        ? invoices.filter((i) => i.classId === selectedClassId)
        : invoices,
    [invoices, selectedClassId],
  );

  const unpaidInvoices = useMemo(
    () => classInvoices.filter((i) => i.status !== 'PAID'),
    [classInvoices],
  );

  useEffect(() => {
    if (
      !selectedInvoiceId ||
      !classInvoices.some((i) => i.id === selectedInvoiceId)
    ) {
      setSelectedInvoiceId(unpaidInvoices[0]?.id || classInvoices[0]?.id || '');
    }
  }, [classInvoices, unpaidInvoices, selectedInvoiceId]);

  const activeInvoice =
    classInvoices.find((i) => i.id === selectedInvoiceId) ||
    unpaidInvoices[0] ||
    classInvoices[0] ||
    null;

  const activePendingRequest = activeInvoice
    ? pendingByInvoice[activeInvoice.id] || null
    : null;

  const activeClass =
    classes.find((c) => c.id === (activeInvoice?.classId || selectedClassId)) ||
    null;

  const totalUnpaidAmount = useMemo(
    () => unpaidInvoices.reduce((s, i) => s + Number(i.amount || 0), 0),
    [unpaidInvoices],
  );

  // Server-provided payment info for real mode; clearly marked mock info for IS_MOCK
  const paymentConfig = activeInvoice?.bankInfo || lookups?.paymentConfig || null;
  const serverQrUrl = activeInvoice?.qrUrl || activeInvoice?.qrImageUrl || '';
  const hasRealPaymentGateway = Boolean(serverQrUrl || paymentConfig?.accountNumber);

  const transferMemo = useMemo(() => {
    const parts = ['VOVINAM'];
    if (studentProfile?.studentCode) parts.push(studentProfile.studentCode);
    if (activeInvoice?.code) parts.push(activeInvoice.code);
    return parts.join(' ');
  }, [studentProfile?.studentCode, activeInvoice?.code]);

  // F01: Student action ONLY submits a payment verification request (PENDING), never self-marks PAID
  async function handleSubmitPaymentRequest(targetInvoice) {
    if (!targetInvoice || targetInvoice.status === 'PAID' || submitting) return;
    if (pendingByInvoice[targetInvoice.id]) {
      toast(
        'Yêu cầu đối soát cho hóa đơn này đã được gửi và đang chờ xác nhận.',
      );
      return;
    }
    setSubmitting(true);
    try {
      const idempotencyKey = `${targetInvoice.id}:${targetInvoice.amount}`;
      const res = await api.request(
        `/invoices/${encodeURIComponent(targetInvoice.id)}/pay-online`,
        {
          method: 'POST',
          body: {
            idempotencyKey,
            note: `Yêu cầu đối soát chuyển khoản · ${transferMemo}`,
          },
        },
      );
      if (res?.duplicate) {
        toast('Yêu cầu đối soát đã tồn tại và đang chờ bộ phận thu phí kiểm tra.');
      } else {
        toast(
          'Đã gửi yêu cầu đối soát chuyển khoản. Hóa đơn sẽ chuyển sang Đã thanh toán sau khi hệ thống/quản trị viên xác nhận nhận tiền.',
        );
      }
      remote.reload();
    } catch (e) {
      toast(
        e.message || 'Không thể gửi yêu cầu đối soát thanh toán.',
        'error',
      );
    } finally {
      setSubmitting(false);
    }
  }

  function openDetail(row, el) {
    triggerRef.current = el || document.activeElement;
    setDetailRow(row);
  }

  function closeDetail() {
    setDetailRow(null);
    requestAnimationFrame(() => triggerRef.current?.focus?.());
  }

  function resolveField(key, value) {
    if (key === 'studentId')
      return studentProfile?.fullName || user?.fullName || '—';
    if (key === 'classId')
      return classes.find((c) => c.id === value)?.name || '—';
    if (key === 'amount' || key === 'baseAmount') return currency(value);
    if (key === 'status') return statusLabels[value] || value;
    if (key === 'paymentMethod' || key === 'method')
      return value === 'CASH'
        ? 'Tiền mặt'
        : value === 'BANK'
          ? 'Chuyển khoản'
          : 'Chưa đóng';
    if (/Date$|At$/.test(key)) return formatDate(value);
    return value ?? '—';
  }

  const columnLabel = (k) =>
    ({
      code: 'Mã hóa đơn',
      studentId: 'Võ sinh',
      classId: 'Lớp học',
      period: 'Kỳ học phí',
      amount: 'Tổng thanh toán',
      baseAmount: 'Học phí gốc',
      dueDate: 'Hạn thanh toán',
      paymentMethod: 'Hình thức đóng',
      paidAt: 'Ngày thanh toán',
      status: 'Trạng thái',
      createdAt: 'Ngày lập',
    })[k] || k;

  return (
    <div className="feature-page">
      <div className="page-heading">
        <div>
          <div className="section-kicker">
            TÀI CHÍNH
            <span />
            VOVINAM
          </div>
          <h1>Học phí &amp; Thanh toán của tôi</h1>
          <p>
            Theo dõi khoản phải thu, gửi yêu cầu đối soát chuyển khoản và tra cứu
            lịch sử giao dịch cá nhân.
          </p>
        </div>
        <div className="heading-actions">
          <button
            className="icon-btn bordered"
            aria-label="Tải lại"
            onClick={remote.reload}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Portal Sub-tabs: Hóa đơn & Thanh toán | Lịch sử giao dịch */}
      <div
        className="feature-tabs"
        role="tablist"
        aria-label="Khu vực tài chính võ sinh"
      >
        <button
          type="button"
          role="tab"
          aria-selected={portalTab === 'INVOICES'}
          className={`feature-tab ${portalTab === 'INVOICES' ? 'is-active' : ''}`}
          onClick={() => setPortalTab('INVOICES')}
        >
          <ReceiptText size={16} />
          <span>Khoản phải thu &amp; Thanh toán</span>
          <span className="tab-count">{invoices.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={portalTab === 'TRANSACTIONS'}
          className={`feature-tab ${portalTab === 'TRANSACTIONS' ? 'is-active' : ''}`}
          onClick={() => setPortalTab('TRANSACTIONS')}
        >
          <History size={16} />
          <span>Lịch sử giao dịch</span>
          <span className="tab-count">{transactions.length}</span>
        </button>
      </div>

      {remote.loading ? (
        <Loading />
      ) : remote.error ? (
        <ErrorState error={remote.error} retry={remote.reload} />
      ) : portalTab === 'TRANSACTIONS' ? (
        <section className="panel data-panel" style={{ marginTop: 16 }}>
          <div className="data-panel-title">
            <div>
              <h2>
                Lịch sử giao dịch của tôi
                <span className="count-pill">{transactions.length}</span>
              </h2>
              <p>
                Các giao dịch đã được đối soát và ghi nhận biên nhận thanh toán.
              </p>
            </div>
          </div>
          {!transactions.length ? (
            <EmptyState
              text="Chưa có lịch sử giao dịch"
              description="Biên nhận sẽ hiển thị tại đây sau khi khoản học phí được xác nhận đã nhận tiền."
            />
          ) : (
            <div className="table-scroll">
              <table className="record-table">
                <thead>
                  <tr>
                    <th className="index-cell">STT</th>
                    <th>Mã giao dịch</th>
                    <th>Lớp học</th>
                    <th>Số tiền</th>
                    <th>Hình thức</th>
                    <th>Ngày ghi nhận</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx, idx) => (
                    <tr key={tx.id}>
                      <td className="index-cell" data-label="STT">{idx + 1}</td>
                      <td data-label="Mã giao dịch">
                        <span className="cell-primary">{tx.code}</span>
                      </td>
                      <td data-label="Lớp học">
                        {classes.find((c) => c.id === tx.classId)?.name || '—'}
                      </td>
                      <td data-label="Số tiền">
                        <strong className="money">{currency(tx.amount)}</strong>
                      </td>
                      <td data-label="Hình thức">
                        <span
                          className={
                            'method-pill ' +
                            (tx.method === 'CASH'
                              ? 'method-cash'
                              : 'method-bank')
                          }
                        >
                          {tx.method === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}
                        </span>
                      </td>
                      <td data-label="Thời gian">{formatDate(tx.createdAt)}</td>
                      <td data-label="Trạng thái">
                        <Badge value={tx.status || 'SUCCESS'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : (
        <>
          {/* Class Selector */}
          {studentClasses.length > 0 && (
            <div
              className="feature-tabs"
              role="tablist"
              aria-label="Chọn lớp học"
              style={{ marginTop: 12 }}
            >
              {studentClasses.map((c) => {
                const unpaidInClass = invoices.filter(
                  (i) => i.classId === c.id && i.status !== 'PAID',
                ).length;
                return (
                  <button
                    type="button"
                    key={c.id}
                    className={`feature-tab ${selectedClassId === c.id ? 'is-active' : ''}`}
                    onClick={() => setSelectedClassId(c.id)}
                  >
                    <Layers size={16} />
                    <span>{c.name}</span>
                    <span className="tab-count">
                      {unpaidInClass > 0
                        ? `${unpaidInClass} chưa đóng`
                        : 'Đã đủ'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {!activeInvoice ? (
            <EmptyState
              text="Chưa có khoản học phí cho lớp này"
              description="Khi có kỳ thu học phí mới, thông tin chuyển khoản và chi tiết khoản thu sẽ hiển thị tại đây."
            />
          ) : (
            <>
              {/* Top QR + Full Bill Summary Layout */}
              <div className="student-qr-layout">
                {/* Payment / QR Card */}
                <div className="qr-card">
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      color: 'var(--heading)',
                      fontWeight: 700,
                      fontSize: 16,
                    }}
                  >
                    <QrCode size={20} />
                    <span>
                      {IS_MOCK
                        ? 'Mã QR chuyển khoản (Mô phỏng)'
                        : 'Mã QR chuyển khoản học phí'}
                    </span>
                  </div>

                  {IS_MOCK && (
                    <div
                      role="note"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 12px',
                        borderRadius: 10,
                        fontSize: 12,
                        fontWeight: 600,
                        background: 'rgba(245, 197, 24, 0.14)',
                        border: '1px solid rgba(245, 197, 24, 0.35)',
                        color: 'var(--gold)',
                        width: '100%',
                      }}
                    >
                      <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                      <span>
                        CHẾ ĐỘ MÔ PHỎNG KIỂM THỬ — Không phải mã VietQR ngân
                        hàng thật.
                      </span>
                    </div>
                  )}

                  {IS_MOCK ? (
                    <div className="qr-box">
                      <SimulatedQrSvg
                        seed={`${activeInvoice.code}-${activeInvoice.amount}`}
                      />
                    </div>
                  ) : serverQrUrl ? (
                    <div className="qr-box">
                      <img
                        src={serverQrUrl}
                        alt={`Mã VietQR cho hóa đơn ${activeInvoice.code}`}
                        className="payment-qr"
                      />
                    </div>
                  ) : (
                    <div
                      className="info-note"
                      style={{ width: '100%', textAlign: 'left', margin: 0 }}
                    >
                      Cổng thanh toán VietQR chưa được cấu hình trên máy chủ.
                      Vui lòng liên hệ quản trị viên võ đường hoặc nộp học phí
                      trực tiếp tại lớp.
                    </div>
                  )}

                  {(IS_MOCK || hasRealPaymentGateway) && (
                    <div className="qr-bank-meta">
                      <div className="qr-bank-row">
                        <span>Ngân hàng</span>
                        <strong>
                          {paymentConfig?.bankName ||
                            (IS_MOCK ? 'Ngân hàng thử nghiệm (Mock)' : '—')}
                        </strong>
                      </div>
                      <div className="qr-bank-row">
                        <span>Số tài khoản</span>
                        <strong>
                          {paymentConfig?.accountNumber ||
                            (IS_MOCK ? '0000 0000 0000 (Demo)' : '—')}
                        </strong>
                      </div>
                      <div className="qr-bank-row">
                        <span>Chủ tài khoản</span>
                        <strong>
                          {paymentConfig?.accountHolder ||
                            (IS_MOCK ? 'TÀI KHOẢN MÔ PHỎNG VOVINAM' : '—')}
                        </strong>
                      </div>
                      <div className="qr-bank-row">
                        <span>Nội dung CK</span>
                        <strong>{transferMemo}</strong>
                      </div>
                      <div className="qr-bank-row">
                        <span>Số tiền</span>
                        <strong style={{ color: 'var(--gold)', fontSize: 15 }}>
                          {currency(activeInvoice.amount)}
                        </strong>
                      </div>
                    </div>
                  )}

                  {activeInvoice.status === 'PAID' ? (
                    <div className="qr-status-pill is-done">
                      <CheckCircle2 size={16} />
                      <span>
                        Đã nhận tiền (
                        {activeInvoice.paymentMethod === 'CASH'
                          ? 'Tiền mặt'
                          : 'Chuyển khoản'}
                        )
                      </span>
                    </div>
                  ) : activePendingRequest ? (
                    <div
                      className="qr-status-pill"
                      style={{
                        borderColor: 'rgba(245, 197, 24, 0.45)',
                        color: 'var(--gold)',
                      }}
                    >
                      <Clock size={16} />
                      <span>
                        Đang chờ đối soát ({activePendingRequest.code})
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="qr-status-pill">
                        {submitting ? (
                          <>
                            <Loader2 size={15} className="spin" />
                            <span>Đang gửi yêu cầu đối soát…</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck size={15} />
                            <span>
                              Chuyển khoản xong bấm gửi để bộ phận thu phí đối
                              soát
                            </span>
                          </>
                        )}
                      </div>
                      <Button
                        style={{ width: '100%', justifyContent: 'center' }}
                        disabled={
                          submitting || (!IS_MOCK && !hasRealPaymentGateway)
                        }
                        onClick={() =>
                          handleSubmitPaymentRequest(activeInvoice)
                        }
                      >
                        <CheckCircle2 size={17} />
                        {submitting
                          ? 'Đang gửi yêu cầu…'
                          : `Gửi yêu cầu đối soát (${currency(activeInvoice.amount)})`}
                      </Button>
                    </>
                  )}
                </div>

                {/* Full Bill Details Card */}
                <div className="bill-summary-card">
                  <div className="bill-total-banner">
                    <div>
                      <span>
                        {unpaidInvoices.length > 0
                          ? `Tổng khoản phải thu chưa hoàn tất (${unpaidInvoices.length} kỳ)`
                          : 'Tình trạng học phí lớp ' + (activeClass?.name || '')}
                      </span>
                      <div
                        style={{
                          fontSize: 13,
                          color: 'var(--muted)',
                          marginTop: 4,
                        }}
                      >
                        Đang xem khoản thu:{' '}
                        <strong>{activeInvoice.code}</strong> · Kỳ{' '}
                        {activeInvoice.period}
                      </div>
                    </div>
                    <strong>
                      {unpaidInvoices.length > 0
                        ? currency(totalUnpaidAmount)
                        : '0 ₫ · Đã hoàn tất'}
                    </strong>
                  </div>

                  <div className="detail-card-grid">
                    <div className="detail-card-item">
                      <span className="detail-card-label">Học viên</span>
                      <div className="detail-card-value">
                        {studentProfile?.fullName || user?.fullName || '—'}
                      </div>
                    </div>
                    <div className="detail-card-item">
                      <span className="detail-card-label">Mã võ sinh</span>
                      <div className="detail-card-value">
                        {studentProfile?.studentCode || '—'}
                      </div>
                    </div>
                    <div className="detail-card-item">
                      <span className="detail-card-label">Lớp học</span>
                      <div className="detail-card-value">
                        {activeClass?.name || '—'}
                      </div>
                    </div>
                    <div className="detail-card-item">
                      <span className="detail-card-label">Kỳ thu học phí</span>
                      <div className="detail-card-value">
                        {activeInvoice.period}
                      </div>
                    </div>
                    <div className="detail-card-item">
                      <span className="detail-card-label">Hạn thanh toán</span>
                      <div className="detail-card-value">
                        {formatDate(activeInvoice.dueDate)}
                      </div>
                    </div>
                    <div className="detail-card-item">
                      <span className="detail-card-label">
                        Hình thức thanh toán
                      </span>
                      <div className="detail-card-value">
                        <span
                          className={
                            'method-pill ' +
                            (activeInvoice.paymentMethod === 'BANK'
                              ? 'method-bank'
                              : activeInvoice.paymentMethod === 'CASH'
                                ? 'method-cash'
                                : 'method-none')
                          }
                        >
                          {activeInvoice.paymentMethod === 'BANK'
                            ? 'Chuyển khoản'
                            : activeInvoice.paymentMethod === 'CASH'
                              ? 'Tiền mặt'
                              : activePendingRequest
                                ? 'Chờ đối soát CK'
                                : 'Chưa đóng'}
                        </span>
                      </div>
                    </div>
                    <div className="detail-card-item">
                      <span className="detail-card-label">Trạng thái</span>
                      <div className="detail-card-value">
                        <Badge
                          value={
                            activeInvoice.status === 'PAID'
                              ? 'PAID'
                              : activePendingRequest
                                ? 'PENDING_VERIFICATION'
                                : activeInvoice.status
                          }
                          label={
                            activeInvoice.status === 'PAID'
                              ? 'Đã nhận tiền'
                              : activePendingRequest
                                ? 'Đang đối soát'
                                : undefined
                          }
                        />
                      </div>
                    </div>
                    <div className="detail-card-item">
                      <span className="detail-card-label">
                        Số tiền khoản này
                      </span>
                      <div
                        className="detail-card-value"
                        style={{ color: 'var(--gold)' }}
                      >
                        {currency(activeInvoice.amount)}
                      </div>
                    </div>
                  </div>

                  {(() => {
                    const rejectedReq = (onlinePayments || []).find(
                      (p) =>
                        p.invoiceId === activeInvoice.id &&
                        p.status === 'REJECTED' &&
                        !p.supersededByCash,
                    );
                    if (!rejectedReq || activeInvoice.status === 'PAID' || activePendingRequest) {
                      return null;
                    }
                    return (
                      <div
                        className="student-reject-notice"
                        role="alert"
                      >
                        <strong>
                          Yêu cầu đối soát trước đó bị từ chối ({rejectedReq.code})
                        </strong>
                        <p>
                          <strong>Lý do:</strong>{' '}
                          {rejectedReq.reviewNote ||
                            'Không khớp giao dịch chuyển khoản. Vui lòng kiểm tra lại và gửi lại yêu cầu.'}
                        </p>
                        {(rejectedReq.reviewedName || rejectedReq.reviewedAt) && (
                          <small>
                            Người xử lý: {rejectedReq.reviewedName || 'Bộ phận tài chính'}
                            {rejectedReq.reviewedAt
                              ? ' · ' + formatDate(rejectedReq.reviewedAt)
                              : ''}
                          </small>
                        )}
                      </div>
                    );
                  })()}
                  {activeInvoice.status === 'PAID' && (
                    <div className="student-receipt-bar">
                      <span>Hóa đơn đã hoàn tất thanh toán.</span>
                      <Button
                        variant="secondary"
                        onClick={() => setPrintRow(activeInvoice)}
                      >
                        <Printer size={15} />
                        Xem & In biên nhận
                      </Button>
                    </div>
                  )}
                                    {activePendingRequest && activeInvoice.status !== 'PAID' && (
                    <div
                      className="detail-roster-box"
                      style={{
                        borderColor: 'rgba(245, 197, 24, 0.35)',
                        background: 'rgba(245, 197, 24, 0.08)',
                      }}
                    >
                      <strong style={{ color: 'var(--gold)' }}>
                        Yêu cầu đối soát đang được xử lý
                      </strong>
                      <p>
                        Hệ thống đã ghi nhận yêu cầu thanh toán mã{' '}
                        <strong>{activePendingRequest.code}</strong> (gửi lúc{' '}
                        <strong>{formatDate(activePendingRequest.createdAt)}</strong>).
                        Cấp đang xử lý:{' '}
                        <strong>
                          {activePendingRequest.reviewerHint ||
                            'Võ sư phụ trách / Quản trị viên'}
                        </strong>
                        . Trạng thái sẽ tự động chuyển sang{' '}
                        <strong>Đã nhận tiền</strong> ngay khi đối soát hoàn tất.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Student's Bill List for Selected Class */}
              <section className="panel data-panel" style={{ marginTop: 20 }}>
                <div className="data-panel-title">
                  <div>
                    <h2>
                      Các kỳ học phí của lớp {activeClass?.name || ''}
                      <span className="count-pill">{classInvoices.length}</span>
                    </h2>
                    <p>
                      Chọn một kỳ học phí để xem thông tin chuyển khoản hoặc mở
                      chi tiết biên nhận.
                    </p>
                  </div>
                </div>
                <div className="table-scroll">
                  <table className="record-table">
                    <thead>
                      <tr>
                        <th className="index-cell">STT</th>
                        <th>Mã hóa đơn</th>
                        <th>Tháng thu</th>
                        <th>Số tiền</th>
                        <th>Hạn đóng</th>
                        <th>Hình thức</th>
                        <th>Trạng thái</th>
                        <th className="action-cell">Biên nhận</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classInvoices.map((inv, idx) => {
                        const isPending = Boolean(pendingByInvoice[inv.id]);
                        return (
                          <tr
                            key={inv.id}
                            className={
                              'clickable-row' +
                              (inv.id === activeInvoice.id
                                ? ' is-selected'
                                : '')
                            }
                            onClick={(e) => {
                              setSelectedInvoiceId(inv.id);
                              if (inv.status === 'PAID')
                                openDetail(inv, e.currentTarget);
                            }}
                          >
                            <td className="index-cell" data-label="STT">{idx + 1}</td>
                            <td>
                              <button
                                type="button"
                                className="text-btn cell-primary"
                                aria-label={`Chọn hoặc xem chi tiết hóa đơn ${inv.code}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedInvoiceId(inv.id);
                                  if (inv.status === 'PAID')
                                    openDetail(inv, e.currentTarget);
                                }}
                              >
                                {inv.code}
                              </button>
                            </td>
                            <td data-label="Kỳ học phí">{inv.period}</td>
                            <td data-label="Số tiền">
                              <strong className="money">
                                {currency(inv.amount)}
                              </strong>
                            </td>
                            <td data-label="Hạn đóng">{formatDate(inv.dueDate)}</td>
                            <td data-label="Hình thức">
                              <span
                                className={
                                  'method-pill ' +
                                  (inv.paymentMethod === 'BANK'
                                    ? 'method-bank'
                                    : inv.paymentMethod === 'CASH'
                                      ? 'method-cash'
                                      : 'method-none')
                                }
                              >
                                {inv.paymentMethod === 'BANK'
                                  ? 'Chuyển khoản'
                                  : inv.paymentMethod === 'CASH'
                                    ? 'Tiền mặt'
                                    : isPending
                                      ? 'Chờ đối soát'
                                      : 'Chưa đóng'}
                              </span>
                            </td>
                            <td data-label="Trạng thái">
                              <Badge
                                value={
                                  inv.status === 'PAID'
                                    ? 'PAID'
                                    : isPending
                                      ? 'PENDING_VERIFICATION'
                                      : inv.status
                                }
                                label={
                                  inv.status === 'PAID'
                                    ? 'Đã nhận tiền'
                                    : isPending
                                      ? 'Đang đối soát'
                                      : undefined
                                }
                              />
                            </td>
                            <td
                              data-label="Thao tác"
                              className="action-cell"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {inv.status === 'PAID' ? (
                                <button
                                  type="button"
                                  className="btn-inline-action"
                                  onClick={() => setPrintRow(inv)}
                                  title="Xem và in biên nhận"
                                >
                                  <Printer size={14} />
                                  <span>In</span>
                                </button>
                              ) : (
                                <span className="muted-dash">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </>
      )}

      {printRow && (
        <ReceiptPrintModal
          receipt={printRow}
          student={
            (lookups.students || []).find((s) => s.id === printRow.studentId) || {
              fullName: user?.fullName,
              studentCode: user?.studentCode,
            }
          }
          className={classMap[printRow.classId]}
          onClose={() => setPrintRow(null)}
        />
      )}
      {detailRow && (
        <RecordDetail
          row={detailRow}
          config={{ ...config, title: 'Chi tiết biên nhận học phí' }}
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
