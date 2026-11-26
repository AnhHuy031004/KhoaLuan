import RecordDetail from './RecordDetail.jsx';
import WorkflowDialog from './WorkflowDialog.jsx';
import useListFilters from '../../hooks/useListFilters.js';
import { statusesFor, createLabels } from '../../config/uiPolicy.js';
import FilteredExportButton from './FilteredExportButton.jsx';
import OrganizationScope from './OrganizationScope.jsx';
import {
  MASTER_LEVELS,
  canReviewReliefByHierarchy,
  requiredApproverLabel,
  roleLabel,
} from '../../utils/permissions.js';
import LeaveStatus from '../../features/leaves/components/LeaveStatus.jsx';
import Table from './Table.jsx';
import RankCards from '../../features/ranks/components/RankCards.jsx';
import AnnouncementList from '../../features/announcements/components/AnnouncementList.jsx';
import ScheduleGrid from '../../features/schedules/components/ScheduleGrid.jsx';
import PermissionMatrix from '../../features/roles/components/PermissionMatrix.jsx';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  RefreshCw,
  Lock,
  Unlock,
  PenLine,
  Trash2,
  Check,
  X,
  Send,
  CalendarDays,
  List,
  Filter,
  FileText,
  ShieldCheck,
  Wallet,
  Users,
  Layers,
} from 'lucide-react';
import Button from './Button.jsx';
import Modal from './Modal.jsx';
import RecordForm from './RecordForm.jsx';
import Loading from './Loading.jsx';
import EmptyState from './EmptyState.jsx';
import ErrorState from './ErrorState.jsx';
import Badge from './Badge.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { useRemote } from '../../hooks/useRemote.js';
import useDebounce from '../../hooks/useDebounce.js';
import { api } from '../../services/api.js';
import { can, ROLES } from '../../utils/permissions.js';
import {
  labels,
  statusLabels,
  currency,
  formatDate,
  formatDateTime,
} from '../../utils/format.js';
const extraLabels = {
  assignedClassNames: 'Lớp phụ trách',
  priceOverrideReason: 'Lý do điều chỉnh học phí',
  baseAmount: 'Học phí gốc',
  appliedPercent: 'Mức giảm áp dụng (%)',
  reliefId: 'Mã đề xuất miễn giảm',
  submittedName: 'Người đề xuất',
  submittedRoleLabel: 'Cấp người đề xuất',
  requiredApproverText: 'Cấp xét duyệt theo quy định',
  present: 'Có mặt / đi muộn',
  absent: 'Vắng mặt',
  total: 'Tổng buổi',
  rate: 'Tỷ lệ tham gia',
  location: 'Địa điểm',
  capacity: 'Sĩ số tối đa',
  tuition: 'Học phí / tháng',
  qualification: 'Trình độ',
  sessionDate: 'Ngày tập',
  startTime: 'Bắt đầu',
  endTime: 'Kết thúc',
  reason: 'Lý do',
  rating: 'Điểm đánh giá',
  comment: 'Nhận xét',
  percent: 'Mức giảm (%)',
  expiresAt: 'Hết hạn',
  description: 'Mô tả',
  body: 'Nội dung',
  audience: 'Đối tượng',
  value: 'Giá trị',
  fee: 'Lệ phí',
  examDate: 'Ngày thi',
  level: 'Thứ tự',
  color: 'Màu đai',
  dob: 'Ngày sinh',
  gender: 'Giới tính',
  joinedAt: 'Ngày vào lớp',
  quyenScore: 'Điểm quyền',
  theoryFitnessScore: 'Lý thuyết / thể lực',
  basicScore: 'Điểm căn bản',
  sparringScore: 'Điểm đối kháng',
  paymentMethod: 'Hình thức thanh toán',
  method: 'Hình thức thanh toán',
  paidAt: 'Ngày thanh toán',
  note: 'Ghi chú',
};
export default function FeaturePage({ config, service }) {
  const { user } = useAuth(),
    toast = useToast(),
    [url, setUrl] = useSearchParams();
  const wardScope = url.get('wardId') || '',
    clubScope = url.get('clubId') || '';
  const { values: filters, setters } = useListFilters({
    q: '',
    status: config.id === 'payment-confirmations' ? 'PENDING' : '',
    classId: '',
    month: '',
    page: 1,
    limit: 500,
    view: config.custom === 'schedules' ? 'calendar' : 'list',
  });
  const { q: search, status, classId, month, page, limit, view } = filters;
  const {
    q: setSearch,
    status: setStatus,
    classId: setClassId,
    month: setMonth,
    page: setPage,
    limit: setLimit,
    view: setView,
  } = setters;
  const [dialog, setDialog] = useState(null),
    [busy, setBusy] = useState(false),
    [actionError, setActionError] = useState(null);
  const classResults = config.id === 'exam-results';
  const examWorkflow = [
    'exams',
    'exam-results',
    'discounts',
    'payment-confirmations',
  ].includes(config.id);
  const lockedWorkflow = [
    'leaves',
    'promotions',
    'exams',
    'exam-results',
    'discounts',
    'payment-confirmations',
  ].includes(config.id);
  const debounced = useDebounce(search);

  const readable =
    can(config, user.role, 'V') ||
    (config.id === 'online-payments' && can(config, user.role, 'P'));
  const query = { search: debounced, status, classId, month, page, limit };
  const remote = useRemote(
    async (signal) => {
      const [list, lookup] = await Promise.all([
        readable
          ? service.list(query, signal)
          : Promise.resolve({ items: [], total: 0, summary: {} }),
        api.request('/lookups', { signal, query: { module: config.id } }),
      ]);
      return { ...list, lookups: lookup };
    },
    [
      config.id,
      user.role,
      wardScope,
      clubScope,
      debounced,
      status,
      classId,
      month,
      page,
      limit,
    ],
  );
  useEffect(() => {
    if (config.id !== 'leaves' || !api.subscribeLeaves) return;
    let timer,
      alive = true;
    const synchronize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        remote.reload();
        if (
          dialog?.row?.id &&
          ['approve', 'reject', 'detail', 'form', 'delete'].includes(
            dialog.kind,
          ) &&
          service.get
        ) {
          service
            .get(dialog.row.id)
            .then((latest) => {
              if (!alive || latest.status === 'PENDING') return;
              setDialog((current) =>
                current?.row?.id === latest.id
                  ? { kind: 'detail', row: latest }
                  : current,
              );
              setActionError(null);
            })
            .catch(() => {});
        }
      }, 80);
    };
    const unsubscribe = api.subscribeLeaves(synchronize);
    return () => {
      alive = false;
      clearTimeout(timer);
      unsubscribe();
    };
  }, [config.id, remote.reload, dialog?.kind, dialog?.row?.id]);
  useEffect(() => {
    const id = url.get('record');
    if (!id) return;
    let active = true;
    api
      .request(config.endpoint + '/' + encodeURIComponent(id))
      .then((row) => {
        if (active) setDialog({ kind: 'detail', row });
      })
      .catch((e) => {
        if (active) setActionError(e);
      });
    return () => {
      active = false;
    };
  }, [url.get('record'), config.id]);
  const {
    items = [],
    total = 0,
    lookups = {},
    summary = {},
  } = remote.data || {};
  useEffect(() => {
    if (
      remote.data &&
      !remote.loading &&
      page > Math.max(1, Math.ceil(total / limit))
    )
      setPage(Math.max(1, Math.ceil(total / limit)));
  }, [total, remote.loading, limit]);
  useEffect(() => {
    if (classResults && !classId && lookups.classes?.length) {
      setClassId(lookups.classes[0].id);
      setPage(1);
    }
  }, [classResults, classId, lookups.classes]);
  useEffect(() => {
    if (!api.subscribeResource) return;
    return api.subscribeResource(config.id, remote.reload);
  }, [config.id, remote.reload]);
  const columns = (remote.data?.columns || config.columns).filter(
    (key) =>
      (!classResults || key !== 'classId') &&
      !(
        user.role === 'MASTER' &&
        user.masterLevel === 'CLUB' &&
        key === 'tuition'
      ),
  );
  const columnLabel = (k) =>
    config.fields.find((f) => f.key === k)?.label ||
    labels[k] ||
    extraLabels[k] ||
    k;
  function resolve(key, value, row = null) {
    const maps = {
      provinceId: ['provinces', 'name'],
      wardId: ['wards', 'name'],
      clubId: ['clubs', 'name'],
      studentId: ['students', 'fullName'],
      classId: ['classes', 'name'],
      rankId: ['ranks', 'name'],
      instructorId: ['instructors', 'fullName'],
      examId: ['exams', 'title'],
      invoiceId: ['invoices', 'code'],
      discountId: ['discounts', 'name'],
    };
    if (maps[key]) {
      const [list, name] = maps[key];
      return lookups[list]?.find((x) => x.id === value)?.[name] || '—';
    }
    if (['masterLevel', 'reviewedMasterLevel'].includes(key))
      return MASTER_LEVELS[value] || '—';
    if (key === 'role' || key === 'reviewedRole') return ROLES[value] || value;
    if (key === 'reviewedAt' && value)
      return new Date(value).toLocaleString('vi-VN');
    if (Array.isArray(value))
      return value
        .map((v) =>
          v.description
            ? `${v.quantity || 1} × ${v.description}`
            : v.name || v.title || String(v),
        )
        .join('; ');
    if (value && typeof value === 'object')
      return (
        value.fullName ||
        value.title ||
        value.name ||
        value.email ||
        JSON.stringify(value)
      );
    if (
      typeof value === 'boolean' ||
      ['isActive', 'emailVerified', 'mfaEnabled'].includes(key)
    )
      return value === true || value === 'true' ? 'Có' : 'Không';
    if (value === null || value === undefined) return '—';
    if (key === 'reliefType')
      return value === 'EXEMPTION' ? 'Miễn toàn bộ' : 'Giảm học phí';
    if (key === 'percent') return value + '%';
    if (key === 'status') return statusLabels[value] || value;
    if (['amount', 'tuition', 'fee'].includes(key)) return currency(value);
    if (['createdAt', 'reviewedAt', 'paidAt', 'updatedAt'].includes(key))
      return formatDateTime(value);
    if (/Date$|At$/.test(key) || key === 'dob') return formatDate(value);
    if (key === 'gender') return value === 'MALE' ? 'Nam' : 'Nữ';
    if (key === 'method' || key === 'paymentMethod')
      return value === 'BANK'
        ? 'Chuyển khoản'
        : value === 'CASH'
          ? 'Tiền mặt'
          : 'Chưa thanh toán';
    if (key === 'submittedName' && row?.submittedRoleLabel)
      return `${value} (${row.submittedRoleLabel})`;
    if (key === 'audience')
      return value === 'ALL' ? 'Tất cả võ sinh' : 'Theo lớp';
    return value ?? '—';
  }
  function open(kind, row) {
    setActionError(null);
    setDialog({
      kind,
      row:
        kind === 'form' && config.id === 'invoices' && row
          ? { ...row, amount: row.baseAmount ?? row.amount }
          : row,
    });
  }
  async function act(action, row, body = {}) {
    if (busy) return;
    setBusy(true);
    setActionError(null);
    try {
      if (action === 'delete') await service.remove(row.id);
      else await service.action(row.id, action, body);
      toast(
        action === 'delete'
          ? 'Đã xóa bản ghi.'
          : action === 'reject'
            ? 'Đã từ chối yêu cầu.'
            : 'Đã xử lý thành công.',
      );
      setDialog(null);
      remote.reload();
    } catch (e) {
      setActionError(e);
      if (
        ['leaves', 'discounts'].includes(config.id) &&
        e.status === 409 &&
        service.get
      ) {
        remote.reload();
        try {
          const latest = await service.get(row.id);
          if (latest.status !== 'PENDING') {
            setDialog({ kind: 'detail', row: latest });
            setActionError(null);
            toast(e.message, 'error');
          }
        } catch {}
      }
    } finally {
      setBusy(false);
    }
  }
  const filter = (setter, value) => {
    setter(value);
    setPage(1);
  };
  async function toggleUserLock(row) {
    if (busy) return;
    if (row.id === user.id) {
      toast('Không thể tự khóa tài khoản đang đăng nhập.', 'error');
      return;
    }
    setBusy(true);
    setActionError(null);
    const nextStatus = row.status === 'PAUSED' ? 'ACTIVE' : 'PAUSED';
    try {
      await service.update(row.id, { ...row, status: nextStatus });
      toast(
        nextStatus === 'PAUSED'
          ? `Đã khóa tài khoản ${row.fullName || row.email}.`
          : `Đã mở khóa tài khoản ${row.fullName || row.email}.`,
      );
      remote.reload();
    } catch (e) {
      setActionError(e);
      toast(e.message || 'Không thể cập nhật trạng thái tài khoản.', 'error');
    } finally {
      setBusy(false);
    }
  }
  const rowActions = (row) => (
    <div
      className={
        'row-actions' +
        (config.id === 'leaves' || examWorkflow ? ' leave-row-actions' : '')
      }
    >
      {!row.__readOnly &&
        !row.systemEvent &&
        can(config, user.role, 'E') &&
        (!lockedWorkflow || row.status === 'PENDING') && (
          <button
            className="icon-btn"
            aria-label={
              'Sửa ' + (row.fullName || row.code || row.title || row.id)
            }
            title="Chỉnh sửa"
            onClick={() => open('form', row)}
          >
            <PenLine size={16} />
          </button>
        )}
      {!row.__readOnly &&
        can(config, user.role, 'A') &&
        row.status === 'PENDING' &&
        (config.id !== 'discounts' ||
          (row.canApprove !== undefined
            ? row.canApprove
            : canReviewReliefByHierarchy(user, row))) && (
          <>
            <button
              className={
                config.id === 'leaves' || examWorkflow
                  ? 'review-action review-action-approve'
                  : 'icon-btn success-icon'
              }
              aria-label={'Duyệt ' + (row.code || row.id)}
              disabled={busy}
              title="Phê duyệt"
              onClick={() => open('approve', row)}
            >
              <Check size={16} />
            </button>
            <button
              className={
                config.id === 'leaves' || examWorkflow
                  ? 'review-action review-action-reject'
                  : 'icon-btn danger-icon'
              }
              aria-label={'Từ chối ' + (row.code || row.id)}
              disabled={busy}
              title="Từ chối"
              onClick={() => open('reject', row)}
            >
              <X size={16} />
            </button>
          </>
        )}
      {!row.__readOnly &&
        can(config, user.role, 'P') &&
        ((config.id === 'announcements' && row.status === 'DRAFT') ||
          (config.id === 'online-payments' && row.status === 'DRAFT')) && (
          <button
            className="icon-btn success-icon"
            aria-label={'Xử lý ' + row.id}
            title={
              config.id === 'announcements'
                ? 'Phát hành thông báo'
                : 'Gửi xác nhận thanh toán'
            }
            onClick={() => open('process', row)}
          >
<Send size={16} />
          </button>
        )}
      {config.id === 'users' &&
        !row.__readOnly &&
        can(config, user.role, 'E') &&
        row.id !== user.id && (
          <button
            className={
              'icon-btn ' +
              (row.status === 'PAUSED' ? 'unlock-icon' : 'lock-icon')
            }
            aria-label={
              (row.status === 'PAUSED' ? 'Mở khóa ' : 'Khóa ') +
              (row.fullName || row.email)
            }
            title={
              row.status === 'PAUSED' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'
            }
            disabled={busy}
            onClick={() => toggleUserLock(row)}
          >
            {row.status === 'PAUSED' ? (
              <Unlock size={15} />
            ) : (
              <Lock size={15} />
            )}

          </button>
        )}
      {!row.__readOnly &&
        can(config, user.role, 'D') &&
        !row.systemEvent &&
        !row.system &&
        (!lockedWorkflow || row.status === 'PENDING') && (
          <button
            className="icon-btn danger-icon"
            aria-label={
              'Xóa ' + (row.fullName || row.code || row.title || row.id)
            }
            title="Xóa"
            onClick={() => open('delete', row)}
          >
            <Trash2 size={16} />
          </button>
        )}
    </div>
  );
  const stats =
    config.custom === 'report'
      ? [
          { label: 'Bản ghi trong báo cáo', value: total, icon: FileText },
          {
            label:
              config.reportKind === 'tuition'
                ? 'Tổng giá trị hóa đơn'
                : 'Võ sinh trong phạm vi',
            value:
              config.reportKind === 'tuition'
                ? currency(summary.amount)
                : lookups.students?.length || 0,
            icon: config.reportKind === 'tuition' ? Wallet : Users,
          },
          {
            label: 'Lớp trong phạm vi',
            value: lookups.classes?.length || 0,
            icon: Layers,
          },
        ]
      : null;
  return (
    <div className="feature-page">
      <OrganizationScope />
      {actionError && !dialog && (
        <ErrorState error={actionError} retry={remote.reload} />
      )}
      <div className="page-heading">
        <div>
          <div className="section-kicker">
            {config.group}
            <span />
            VOVINAM
          </div>
          <h1>{config.title}</h1>
          <p>
            {config.id === 'leaves' && user.role === 'STUDENT'
              ? 'Gửi đơn xin nghỉ và theo dõi người phê duyệt đơn của bạn.'
              : config.description}
          </p>
        </div>
        <div className="heading-actions">
          <FilteredExportButton
            config={config}
            service={service}
            query={query}
            lookups={lookups}
          />
          {can(config, user.role, 'C') && (
            <Button onClick={() => open('form', null)}>
              <Plus size={18} />
              {createLabels[config.id] || 'Thêm ' + config.title.toLowerCase()}
            </Button>
          )}
        </div>
      </div>
      {remote.data?.warnings?.length > 0 && (
        <div className="api-notice">
          <div>
            <strong>Một số dữ liệu chưa tải được</strong>
            {remote.data.warnings.map((text, i) => (
              <p key={i}>{text}</p>
            ))}
          </div>
        </div>
      )}
      {stats && (
        <div className="report-stats">
          {stats.map((s) => (
            <div className="metric-card" key={s.label}>
              <div className="metric-icon">
                <s.icon size={20} />
              </div>
              <span>{s.label}</span>
              <strong>{s.value}</strong>
              <small>Theo bộ lọc và phạm vi truy cập</small>
            </div>
          ))}
        </div>
      )}
      {config.id === 'roles' && <PermissionMatrix key={total} />}
      {config.id === 'online-payments' && (
        <div className="payment-banner">
          <span className="payment-icon">
            <Wallet size={26} />
          </span>
          <div>
            <h3>Chủ động hoàn tất học phí</h3>
            <p>
              Chọn hóa đơn cần thanh toán, kiểm tra số tiền và gửi yêu cầu xác
              nhận. Theo dõi kết quả xử lý ngay tại đây.
            </p>
          </div>
          <span className="secure-label">
            <ShieldCheck size={17} />
            Theo dõi trạng thái
          </span>
        </div>
      )}
      {!readable ? (
        <section className="panel create-only">
          <span className="create-illustration">
            <FileText size={38} />
          </span>
          <h2>Gửi đơn xin nghỉ</h2>
          <p>Điền ngày nghỉ và lý do để huấn luyện viên hoặc võ sư xem xét.</p>
          <Button onClick={() => open('form', null)}>
            <Plus size={18} />
            Tạo đơn xin nghỉ
          </Button>
        </section>
      ) : (
        <section className="panel data-panel">
          <div className="data-panel-title">
            <div>
              <h2>
                {config.custom === 'report'
                  ? 'Dữ liệu báo cáo'
                  : config.id === 'payment-confirmations'
                    ? 'Giao dịch cần xác nhận'
                    : 'Danh sách ' + config.title.toLowerCase()}
                <span className="count-pill">{total}</span>
              </h2>
              <p>
                {config.id === 'leaves' && user.role === 'STUDENT'
                  ? 'Bạn chỉ thấy các đơn xin nghỉ của chính mình.'
                  : config.id === 'students' && user.role === 'STUDENT'
                    ? 'Bạn chỉ có thể cập nhật thông tin liên hệ của mình.'
                    : 'Dữ liệu trong phạm vi quyền truy cập của bạn.'}
              </p>
            </div>
            <div className="view-actions">
              {config.custom === 'schedules' && (
                <div className="segmented">
                  <button
                    className={view === 'calendar' ? 'selected' : ''}
                    aria-label="Xem dạng thẻ"
                    onClick={() => setView('calendar')}
                  >
                    <CalendarDays size={16} /> Dạng thẻ
                  </button>
                  <button
                    className={view === 'list' ? 'selected' : ''}
                    aria-label="Xem dạng danh sách"
                    onClick={() => setView('list')}
                  >
                    <List size={16} /> Danh sách
                  </button>
                </div>
              )}
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
                aria-label="Tìm kiếm trong danh sách"
                placeholder={
                  config.id === 'students'
                    ? 'Tìm tên, mã võ sinh, số điện thoại…'
                    : 'Tìm kiếm trong danh sách…'
                }
                value={search}
                onChange={(e) => filter(setSearch, e.target.value)}
              />
              {search && (
                <button
                  aria-label="Xóa tìm kiếm"
                  onClick={() => filter(setSearch, '')}
                >
                  <X size={14} />
                </button>
              )}
            </label>
            <div className="filter-controls">
              <Filter size={16} />
              {!['ranks', 'roles', 'audit', 'settings', 'exams'].includes(
                config.id,
              ) && (
                <select
                  aria-label="Lọc theo lớp"
                  value={classId}
                  onChange={(e) => filter(setClassId, e.target.value)}
                >
                  {!classResults && <option value="">Tất cả lớp học</option>}
                  {lookups.classes?.map((c) => (
                    <option value={c.id} key={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
              {![
                'ranks',
                'roles',
                'audit',
                'settings',
                'belt-history',
              ].includes(config.id) &&
                statusesFor(config).length > 0 && (
                  <select
                    aria-label="Lọc trạng thái"
                    value={status}
                    onChange={(e) => filter(setStatus, e.target.value)}
                  >
                    <option value="">Tất cả trạng thái</option>
                    {statusesFor(config).map((v) => (
                      <option key={v} value={v}>
                        {v === 'SUCCESS' &&
                        config.id === 'payment-confirmations'
                          ? 'Đã xác nhận'
                          : statusLabels[v] || v}
                      </option>
                    ))}
                  </select>
                )}
              {[
                'discounts',
                'attendance',
                'evaluations',
                'invoices',
                'transactions',
                'tuition',
                'schedules',
              ].includes(config.id) || config.custom === 'report' ? (
                <input
                  aria-label="Lọc theo tháng"
                  type="month"
                  value={month}
                  onChange={(e) => filter(setMonth, e.target.value)}
                />
              ) : null}
              {(search || status || classId || month) && (
                <button
                  className="text-btn"
                  onClick={() => {
                    const next = new URLSearchParams(url);
                    for (const key of [
                      'q',
                      'status',
                      'classId',
                      'month',
                      'page',
                    ])
                      next.delete(key);
                    next.set('status', '');
                    if (classResults && lookups.classes?.[0])
                      next.set('classId', lookups.classes[0].id);
                    setUrl(next, { replace: true });
                  }}
                >
                  Đặt lại
                </button>
              )}
            </div>
          </div>
          {classResults && classId && (
            <div className="exam-class-summary">
              <div className="exam-class-title">
                <FileText size={18} aria-hidden="true" />
                <span>Bảng điểm theo lớp</span>
                <strong>{resolve('classId', classId)}</strong>
              </div>
              <span className="exam-class-count">
                <b>{total}</b> kết quả
              </span>
            </div>
          )}
          {remote.loading ||
          (classResults && !classId && lookups.classes?.length) ? (
            <Loading />
          ) : remote.error ? (
            <ErrorState error={remote.error} retry={remote.reload} />
          ) : !items.length ? (
            <EmptyState
              text={
                search || status || classId || month
                  ? 'Không có kết quả theo bộ lọc'
                  : 'Chưa có dữ liệu'
              }
              description={
                search || status || classId || month
                  ? 'Hãy xóa từ khóa hoặc đặt lại bộ lọc để xem lại danh sách.'
                  : can(config, user.role, 'C')
                    ? 'Dùng nút tạo phía trên để bắt đầu.'
                    : 'Dữ liệu sẽ xuất hiện khi quản lý phân công hoặc cập nhật.'
              }
            />
          ) : config.custom === 'schedules' && view === 'calendar' ? (
            <ScheduleGrid
              items={items}
              resolve={resolve}
              rowActions={rowActions}
              onSelect={(row) => open('detail', row)}
            />
          ) : config.id === 'announcements' ? (
            <AnnouncementList
              items={items}
              resolve={resolve}
              rowActions={rowActions}
              onSelect={(row) => open('detail', row)}
            />
          ) : config.id === 'ranks' ? (
            <RankCards
              items={items}
              rowActions={rowActions}
              onSelect={(row) => open('detail', row)}
            />
          ) : (
            <Table
              config={config}
              columns={columns}
              ranks={lookups.ranks || []}
              items={items}
              page={page}
              limit={limit}
              columnLabel={columnLabel}
              resolve={resolve}
              rowActions={rowActions}
              showActions={
                can(config, user.role, 'E') ||
                can(config, user.role, 'D') ||
                can(config, user.role, 'A') ||
                can(config, user.role, 'P')
              }
              onRowClick={(row) => open('detail', row)}
            />
          )}
        </section>
      )}
      {dialog?.kind === 'form' && (
        <RecordForm
          config={config}
          record={dialog.row}
          lookups={
            classResults
              ? {
                  ...lookups,
                  students: lookups.students?.filter(
                    (s) =>
                      s.classId === classId || s.id === dialog.row?.studentId,
                  ),
                  exams: lookups.exams?.filter((e) => e.status === 'APPROVED'),
                }
              : lookups
          }
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
          lockedWorkflow={lockedWorkflow}
          resolve={resolve}
          columnLabel={columnLabel}
          onClose={() => setDialog(null)}
          onEdit={() => open('form', dialog.row)}
        />
      )}
      {dialog &&
        ['delete', 'approve', 'reject', 'process'].includes(dialog.kind) && (
          <WorkflowDialog
            config={config}
            dialog={dialog}
            user={user}
            busy={busy}
            resolve={resolve}
            actionError={actionError}
            onClose={() => !busy && setDialog(null)}
            onAct={act}
          />
        )}
    </div>
  );
}
