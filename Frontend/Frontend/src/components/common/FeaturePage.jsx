import OrganizationScope from './OrganizationScope.jsx';
import { MASTER_LEVELS } from '../../utils/permissions.js';
import LeaveStatus from '../../features/leaves/components/LeaveStatus.jsx';
import { IS_MOCK } from '../../services/api.js';
import Table from './Table.jsx';
import ExportSystemButton from './ExportSystemButton.jsx';
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
  Eye,
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
import Pagination from './Pagination.jsx';
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
} from '../../utils/format.js';
const extraLabels = {
  assignedClassNames: 'Lớp phụ trách',
  baseAmount: 'Học phí gốc',
  appliedPercent: 'Mức giảm áp dụng (%)',
  reliefId: 'Mã đề xuất miễn giảm',
  submittedName: 'HLV đề xuất',
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
};
export default function FeaturePage({ config, service }) {
  const { user } = useAuth(),
    toast = useToast(),
    [url, setUrl] = useSearchParams();
  const wardScope = url.get('wardId') || '',
    clubScope = url.get('clubId') || '';
  const [search, setSearch] = useState(url.get('q') || ''),
    [status, setStatus] = useState(
      config.id === 'payment-confirmations' ? 'PENDING' : '',
    ),
    [classId, setClassId] = useState(''),
    [month, setMonth] = useState(''),
    [page, setPage] = useState(1),
    [limit, setLimit] = useState(8),
    [view, setView] = useState(
      config.custom === 'schedules' ? 'calendar' : 'list',
    ),
    [dialog, setDialog] = useState(null),
    [busy, setBusy] = useState(false),
    [actionError, setActionError] = useState(null);
  const classResults =
    IS_MOCK && config.id === 'exam-results' && user.role !== 'STUDENT';
  const examWorkflow =
    ['exams', 'exam-results', 'payment-confirmations'].includes(config.id) ||
    (!config.apiMode && config.id === 'discounts');
  const lockedWorkflow =
    IS_MOCK && ['leaves', 'exams', 'exam-results'].includes(config.id);
  const debounced = useDebounce(search);
  useEffect(() => setSearch(url.get('q') || ''), [url.get('q')]);
  useEffect(() => {
    setClassId('');
    setPage(1);
  }, [wardScope, clubScope]);
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
    if (config.id !== 'leaves' || !IS_MOCK || !api.subscribeLeaves) return;
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
    if (!IS_MOCK || !api.subscribeResource) return;
    return api.subscribeResource(config.id, remote.reload);
  }, [config.id, remote.reload]);
  const columns = (remote.data?.columns || config.columns).filter(
    (key) =>
      (!classResults || key !== 'classId') &&
      !(user.role === 'MASTER' && user.masterLevel === 'CLUB' && key === 'tuition'),
  );
  const columnLabel = (k) =>
    config.fields.find((f) => f.key === k)?.label ||
    labels[k] ||
    extraLabels[k] ||
    k;
  function resolve(key, value) {
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
    if (['amount', 'tuition', 'fee', 'amountOff'].includes(key))
      return currency(value);
    if (/Date$|At$/.test(key) || key === 'dob') return formatDate(value);
    if (key === 'gender') return value === 'MALE' ? 'Nam' : 'Nữ';
    if (key === 'method')
      return value === 'BANK'
        ? 'Chuyển khoản'
        : value === 'CASH'
          ? 'Tiền mặt'
          : value;
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
  const rowActions = (row) => (
    <div
      className={
        'row-actions' +
        (config.id === 'leaves' || examWorkflow ? ' leave-row-actions' : '')
      }
    >
      <button
        className="icon-btn"
        aria-label={'Xem ' + (row.fullName || row.code || row.title || row.id)}
        title="Xem chi tiết"
        onClick={() => open('detail', row)}
      >
        <Eye size={16} />
      </button>
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
            <PenLine size={15} />
          </button>
        )}
      {!row.__readOnly &&
        can(config, user.role, 'A') &&
        row.status === 'PENDING' && (
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
              <Check size={18} />
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
              <X size={18} />
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
            <Trash2 size={15} />
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
          {!IS_MOCK && config.id === 'exams' && can(config, user.role, 'P') && (
            <Button onClick={() => open('register', null)}>
              <Plus size={18} />
              Đăng ký thi
            </Button>
          )}
          <ExportSystemButton />
          {can(config, user.role, 'C') && (
            <Button onClick={() => open('form', null)}>
              <Plus size={18} />
              {!config.apiMode && config.id === 'discounts'
                ? 'Gửi đề xuất'
                : config.id === 'leaves'
                  ? 'Tạo đơn xin nghỉ'
                  : config.id === 'online-payments'
                    ? 'Tạo giao dịch'
                    : 'Thêm mới'}
            </Button>
          )}
        </div>
      </div>
      {!IS_MOCK && remote.data?.warnings?.length > 0 && (
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
              Chọn hóa đơn, tạo giao dịch và gửi yêu cầu xác nhận. Thanh toán
              hiện là mô phỏng; không chuyển tiền thật.
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
                    aria-label="Xem dạng lịch"
                    onClick={() => setView('calendar')}
                  >
                    <CalendarDays size={16} />
                  </button>
                  <button
                    className={view === 'list' ? 'selected' : ''}
                    aria-label="Xem dạng danh sách"
                    onClick={() => setView('list')}
                  >
                    <List size={16} />
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
              ].includes(config.id) && (
                <select
                  aria-label="Lọc trạng thái"
                  value={status}
                  onChange={(e) => filter(setStatus, e.target.value)}
                >
                  <option value="">Tất cả trạng thái</option>
                  {(
                    (!config.apiMode && config.id === 'discounts'
                      ? [
                          ['PENDING', 'Chờ duyệt'],
                          ['APPROVED', 'Đã duyệt'],
                          ['REJECTED', 'Từ chối'],
                        ]
                      : null) ||
                    config.fields.find((f) => f.key === 'status')?.options ||
                    Object.entries(statusLabels)
                  ).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
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
                    setSearch('');
                    setStatus('');
                    setClassId(
                      classResults ? lookups.classes?.[0]?.id || '' : '',
                    );
                    setMonth('');
                    setPage(1);
                    setUrl(
                      (prev) => {
                        const next = new URLSearchParams(prev);
                        next.delete('q');
                        return next;
                      },
                      { replace: true },
                    );
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
            <EmptyState />
          ) : config.custom === 'schedules' && view === 'calendar' ? (
            <ScheduleGrid
              items={items}
              resolve={resolve}
              rowActions={rowActions}
            />
          ) : config.id === 'announcements' ? (
            <AnnouncementList
              items={items}
              resolve={resolve}
              rowActions={rowActions}
            />
          ) : config.id === 'ranks' ? (
            <RankCards items={items} rowActions={rowActions} />
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
            />
          )}
          <Pagination
            page={page}
            total={total}
            limit={limit}
            onChange={setPage}
            onLimit={(v) => {
              setLimit(v);
              setPage(1);
            }}
          />
        </section>
      )}
      {dialog?.kind === 'register' && (
        <LiveExamRegistration
          lookups={lookups}
          service={service}
          onClose={() => setDialog(null)}
          onSaved={remote.reload}
        />
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
        <Modal
          title="Chi tiết thông tin"
          subtitle={config.title}
          onClose={() => setDialog(null)}
          wide
        >
          {dialog.row.roster && (
            <div className="form-info">
              <strong>Học viên đang học ({dialog.row.studentCount})</strong>
              <p>
                {dialog.row.roster.map((s) => s.fullName).join(' · ') ||
                  'Chưa có học viên'}
              </p>
            </div>
          )}
          <div className="detail-grid">
            {Object.entries(dialog.row)
              .filter(
                ([key, value]) =>
                  value !== undefined &&
                  !key.startsWith('__') &&
                  key !== 'roster' &&
                  ![
                    'id',
                    'createdBy',
                    'reviewedBy',
                    'password',
                    'system',
                    'systemEvent',
                    'workflowModule',
                    'workflowRecordId',
                    'recipientUserIds',
                    'resultId',
                    'reliefId',
                  ].includes(key),
              )
              .map(([key, value]) => (
                <div key={key}>
                  <span>{columnLabel(key)}</span>
                  <strong>
                    {key === 'status' ? (
                      ['leaves', 'payment-confirmations'].includes(config.id) ||
                      (!config.apiMode && config.id === 'discounts') ? (
                        <LeaveStatus row={dialog.row} />
                      ) : (
                        <Badge value={value} />
                      )
                    ) : (
                      String(resolve(key, value, dialog.row))
                    )}
                  </strong>
                </div>
              ))}
          </div>
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setDialog(null)}>
              Đóng
            </Button>
            {!dialog.row.__readOnly &&
              !dialog.row.systemEvent &&
              can(config, user.role, 'E') &&
              (!lockedWorkflow || dialog.row.status === 'PENDING') && (
                <Button onClick={() => open('form', dialog.row)}>
                  <PenLine size={15} />
                  Chỉnh sửa
                </Button>
              )}
          </div>
        </Modal>
      )}
      {dialog &&
        ['delete', 'approve', 'reject', 'process'].includes(dialog.kind) && (
          <Modal
            title={
              config.id === 'leaves' && dialog.kind === 'approve'
                ? 'Duyệt đơn xin nghỉ?'
                : config.id === 'leaves' && dialog.kind === 'reject'
                  ? 'Từ chối đơn xin nghỉ?'
                  : dialog.kind === 'delete'
                    ? 'Xóa bản ghi?'
                    : dialog.kind === 'approve'
                      ? 'Phê duyệt thông tin'
                      : dialog.kind === 'reject'
                        ? 'Từ chối yêu cầu?'
                        : config.id === 'announcements'
                          ? 'Phát hành thông báo?'
                          : 'Gửi xác nhận thanh toán?'
            }
            onClose={() => !busy && setDialog(null)}
          >
            {!config.apiMode &&
              config.id === 'discounts' &&
              ['approve', 'reject'].includes(dialog.kind) && (
                <div className="leave-confirm-summary">
                  <strong>{resolve('studentId', dialog.row.studentId)}</strong>
                  <span>
                    {resolve('classId', dialog.row.classId)} · Tháng{' '}
                    {dialog.row.period}
                  </span>
                  <span>
                    {resolve('reliefType', dialog.row.reliefType)} ·{' '}
                    {dialog.row.percent}%
                  </span>
                  <p>{dialog.row.reason}</p>
                  <small>HLV đề xuất: {dialog.row.submittedName}</small>
                </div>
              )}
            {config.id === 'leaves' &&
              ['approve', 'reject'].includes(dialog.kind) && (
                <div className="leave-confirm-summary">
                  <strong>{resolve('studentId', dialog.row.studentId)}</strong>
                  <span>
                    {resolve('classId', dialog.row.classId)} ·{' '}
                    {formatDate(dialog.row.sessionDate)}
                  </span>
                  <p>{dialog.row.reason}</p>
                  <small>
                    Người xử lý: {user.fullName} · {ROLES[user.role]}
                  </small>
                </div>
              )}
            <p className="confirm-copy">
              {dialog.kind === 'delete'
                ? 'Bản ghi sẽ được xóa khỏi hệ thống. Dữ liệu đang có liên kết sẽ được bảo vệ.'
                : dialog.kind === 'approve' &&
                    config.id === 'payment-confirmations'
                  ? 'Chỉ xác nhận khi đã đối chiếu khoản thanh toán. Hóa đơn và lịch sử giao dịch sẽ được cập nhật.'
                  : dialog.kind === 'process' && config.id === 'online-payments'
                    ? 'Giao dịch mô phỏng sẽ được chuyển đến người có quyền xác nhận. Không có tiền thật được chuyển.'
                    : config.id === 'leaves'
                      ? 'Đơn chỉ được xử lý một lần. Sau khi xác nhận, các người phụ trách khác sẽ chỉ xem kết quả.'
                      : 'Vui lòng kiểm tra thông tin trước khi tiếp tục.'}
            </p>
            {actionError && <ErrorState error={actionError} />}
            <div className="modal-actions">
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => setDialog(null)}
              >
                Hủy bỏ
              </Button>
              {dialog.kind === 'approve' && config.id === 'exam-results' ? (
                <>
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() =>
                      act('approve', dialog.row, { outcome: 'FAIL' })
                    }
                  >
                    Chưa đạt
                  </Button>
                  <Button
                    disabled={busy}
                    onClick={() =>
                      act('approve', dialog.row, { outcome: 'PASS' })
                    }
                  >
                    Đạt & cấp đai
                  </Button>
                </>
              ) : (
                <Button
                  variant={
                    ['delete', 'reject'].includes(dialog.kind)
                      ? 'danger'
                      : 'primary'
                  }
                  disabled={busy}
                  onClick={() => act(dialog.kind, dialog.row)}
                >
                  {busy
                    ? 'Đang xử lý…'
                    : dialog.kind === 'delete'
                      ? 'Xóa bản ghi'
                      : 'Xác nhận'}
                </Button>
              )}
            </div>
          </Modal>
        )}
    </div>
  );
}

function LiveExamRegistration({ lookups, service, onClose, onSaved }) {
  const toast = useToast();
  const [examId, setExamId] = useState(''),
    [studentId, setStudentId] = useState(lookups.students?.[0]?.id || ''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(null);
  return (
    <Modal title="Đăng ký kỳ thi" onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            await service.action(examId, 'register', { studentId });
            toast('Đã đăng ký kỳ thi.');
            onSaved();
            onClose();
          } catch (e) {
            setError(e);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="stack-form">
          <label className="field">
            <span>Kỳ thi đang mở đăng ký</span>
            <select
              required
              value={examId}
              onChange={(e) => setExamId(e.target.value)}
            >
              <option value="">Chọn kỳ thi</option>
              {lookups.exams
                ?.filter((e) => e.status === 'OPEN')
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))}
            </select>
          </label>
          <label className="field">
            <span>Võ sinh dự thi</span>
            <select
              required
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            >
              <option value="">Chọn võ sinh</option>
              {lookups.students?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName}
                </option>
              ))}
            </select>
          </label>
        </div>
        {error && <ErrorState error={error} />}
        <div className="modal-actions">
          <Button variant="secondary" type="button" onClick={onClose}>
            Hủy
          </Button>
          <Button disabled={busy}>Xác nhận đăng ký</Button>
        </div>
      </form>
    </Modal>
  );
}
