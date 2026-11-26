import {
  Users,
  ClipboardCheck,
  Wallet,
  CalendarDays,
  Building2,
  FileText,
  Award,
  RefreshCw,
  Bell,
  Clock3,
  MapPin,
  Layers,
  BadgeCheck,
  AlertTriangle,
  CalendarOff,
} from 'lucide-react';
import React from 'react';
import { useToast } from '../../../contexts/ToastContext.jsx';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext.jsx';
import { useRemote } from '../../../hooks/useRemote.js';
import { api } from '../../../services/api.js';
import { modules } from '../../../routes/routeConfig.js';
import { canOpen, can } from '../../../utils/permissions.js';
import { currency, formatDate } from '../../../utils/format.js';
import { notificationTarget } from '../../../config/uiPolicy.js';
import OrganizationScope from '../../../components/common/OrganizationScope.jsx';
import Loading from '../../../components/common/Loading.jsx';
import ErrorState from '../../../components/common/ErrorState.jsx';

const reviewIds = [
  'payment-confirmations',
  'leaves',
  'promotions',
  'exams',
  'exam-results',
  'discounts',
];

export default function DashboardPage() {
  const { user, selectedWard, selectedClub } = useAuth();
  const toast = useToast();
  const open = (id) =>
    canOpen(
      modules.find((m) => m.id === id),
      user.role,
    );
  const review = modules.filter(
    (m) => reviewIds.includes(m.id) && can(m, user.role, 'A'),
  );
  const isAdmin = user.role === 'ADMIN';

  const state = useRemote(
    async (signal) => {
      const [summary, pending, exceptions] = await Promise.all([
        api.request('/dashboard', { signal }),
        Promise.all(
          review.map(async (m) => {
            try {
              const data = await api.request(m.endpoint, {
                signal,
                query: { status: 'PENDING', limit: 1 },
              });
              return { id: m.id, title: m.title, count: data.total };
            } catch (e) {
              return { id: m.id, title: m.title, error: e.message };
            }
          }),
        ),
        isAdmin
          ? Promise.all([
              api
                .request('/payment-confirmations', {
                  signal,
                  query: { status: 'PENDING', limit: 200 },
                })
                .catch(() => ({ items: [], total: 0 })),
              api
                .request('/invoices', {
                  signal,
                  query: { status: 'UNPAID', limit: 200 },
                })
                .catch(() => ({ items: [], total: 0 })),
              api
                .request('/students', {
                  signal,
                  query: { limit: 200 },
                })
                .catch(() => ({ items: [], total: 0 })),
            ]).then(([pendingTransfers, unpaidInvoices, studentList]) => {
              const todayIso = new Date().toISOString().slice(0, 10);
              const overdueCount = (unpaidInvoices.items || []).filter(
                (i) => i.dueDate && i.dueDate < todayIso,
              ).length;
              const incompleteProfiles = (studentList.items || []).filter(
                (s) => !String(s.phone || '').trim() || !String(s.dob || '').trim(),
              ).length;
              return {
                pendingTransfers:
                  pendingTransfers.total ?? (pendingTransfers.items || []).length,
                overdueInvoices: overdueCount,
                incompleteProfiles,
              };
            })
          : Promise.resolve(null),
      ]);
      return { ...summary, pending, exceptions };
    },
    [user.id, selectedWard, selectedClub],
  );

  if (state.loading) return <Loading />;
  if (state.error)
    return <ErrorState error={state.error} retry={state.reload} />;

  const d = state.data;
  const student = user.role === 'STUDENT';
  const coach = user.role === 'INSTRUCTOR';

  const jobs = student
    ? [
        ['schedules', 'Buổi tập của tôi'],
        ['leaves', 'Gửi đơn xin nghỉ'],
        ['online-payments', 'Thanh toán học phí online'],
        ['exam-results', 'Kết quả thi'],
      ]
    : coach
      ? [
          ['attendance', 'Điểm danh hôm nay'],
          ['evaluations', 'Đánh giá võ sinh'],
          ['invoices', 'Thu phí khóa học'],
          ['payment-confirmations', 'Đối soát chuyển khoản'],
          ['students', 'Võ sinh phụ trách'],
          ['leaves', 'Xem đơn nghỉ'],
        ]
      : [
          ['management', 'Điều hành đơn vị'],
          ['students', 'Hồ sơ võ sinh'],
          ['invoices', 'Thu phí khóa học'],
          ['payment-confirmations', 'Đối soát chuyển khoản'],
          ['online-payments', 'Biên nhận & Hóa đơn'],
          ['evaluations', 'Đánh giá võ sinh'],
        ];

  const jobIcons = {
    management: Building2,
    students: Users,
    classes: Layers,
    invoices: Wallet,
    'payment-confirmations': BadgeCheck,
    'online-payments': FileText,
    schedules: CalendarDays,
    leaves: FileText,
    'exam-results': Award,
    attendance: ClipboardCheck,
    promotions: Award,
  };

  const pendingCount = d.pending.reduce(
    (sum, item) => sum + (item.count || 0),
    0,
  );

  return (
    <div className="dashboard">
      <div className="page-heading dashboard-heading">
        <div>
          <span className="section-kicker">KHÔNG GIAN LÀM VIỆC</span>
          <h1>
            {student
              ? 'Trang của tôi'
              : coach
                ? 'Công việc hôm nay'
                : 'Tổng quan đơn vị'}
          </h1>
          <p>
            Xin chào, {user.fullName}. Theo dõi hoạt động và công việc cần xử
            lý.
          </p>
        </div>
        <div className="dashboard-heading-tools">
          <span className="dashboard-date">
            <CalendarDays size={16} />
            {new Date().toLocaleDateString('vi-VN')}
          </span>
          <button className="btn btn-secondary" onClick={state.reload}>
            <RefreshCw size={16} />
            Tải lại
          </button>
        </div>
      </div>

      <OrganizationScope />

      <section className="overview-metrics" aria-label="Số liệu tổng quan">
        {open('students') && (
          <Link className="overview-card" to="/app/students">
            <span className="overview-icon blue">
              <Users size={22} />
            </span>
            <div>
              <h2>{student ? 'Hồ sơ của tôi' : 'Võ sinh đang học'}</h2>
              <strong>{d.activeCount}</strong>
              <p>{student ? 'Thông tin võ sinh' : 'Trong phạm vi đang xem'}</p>
            </div>
          </Link>
        )}
        {open('attendance') && (
          <Link className="overview-card" to="/app/attendance">
            <span className="overview-icon green">
              <ClipboardCheck size={22} />
            </span>
            <div>
              <h2>{student ? 'Tỷ lệ tham gia của tôi' : 'Tỷ lệ tham gia'}</h2>
              <strong>{d.attendanceRate}%</strong>
              <p>Có mặt và đi muộn</p>
            </div>
          </Link>
        )}
        {open('invoices') && (
          <Link
            className="overview-card"
            to={student ? '/app/online-payments' : '/app/invoices?status=UNPAID'}
          >
            <span className="overview-icon amber">
              <Wallet size={22} />
            </span>
            <div>
              <h2>Học phí chưa thanh toán</h2>
              <strong className="overview-money">{currency(d.unpaid)}</strong>
              <p>{d.unpaidCount} hóa đơn cần theo dõi</p>
            </div>
          </Link>
        )}
      </section>

      <section className="dashboard-shortcuts" aria-label="Thao tác nhanh">
        <h2>Thao tác nhanh</h2>
        <div className="shortcut-grid">
          {jobs
            .filter(([id]) =>
              id === 'management'
                ? ['ADMIN', 'MASTER'].includes(user.role)
                : open(id),
            )
            .map(([id, name]) => {
              const Icon = jobIcons[id] || Layers;
              return (
                <Link key={id} to={'/app/' + id}>
                  <Icon size={20} />
                  <span>{name}</span>
                </Link>
              );
            })}
        </div>
      </section>

      {isAdmin && d.exceptions && (
        <section
          className="panel exception-panel"
          aria-label="Theo dõi ngoại lệ hệ thống"
        >
          <div className="dashboard-section-heading">
            <div>
              <h2>Theo dõi ngoại lệ cần lưu ý</h2>
              <p>
                Các mục cần kiểm tra sớm để tránh tồn đọng đối soát hoặc thiếu
                dữ liệu hồ sơ.
              </p>
            </div>
            <span className="section-symbol">
              <AlertTriangle size={21} />
            </span>
          </div>
          <div className="exception-grid">
            <Link
              to="/app/payment-confirmations?status=PENDING"
              className={`exception-card ${d.exceptions.pendingTransfers > 0 ? 'has-alert' : ''}`}
            >
              <div>
                <span>Chuyển khoản chờ đối soát</span>
                <small>Kiểm tra sao kê và xác nhận</small>
              </div>
              <strong>{d.exceptions.pendingTransfers}</strong>
            </Link>
            <Link
              to="/app/invoices?status=UNPAID"
              className={`exception-card ${d.exceptions.overdueInvoices > 0 ? 'has-alert' : ''}`}
            >
              <div>
                <span>Hóa đơn quá hạn đóng</span>
                <small>Cần nhắc học phí hoặc rà soát</small>
              </div>
              <strong>{d.exceptions.overdueInvoices}</strong>
            </Link>
            <Link
              to="/app/students"
              className={`exception-card ${d.exceptions.incompleteProfiles > 0 ? 'has-alert' : ''}`}
            >
              <div>
                <span>Hồ sơ thiếu SĐT / ngày sinh</span>
                <small>Bổ sung dữ liệu liên hệ võ sinh</small>
              </div>
              <strong>{d.exceptions.incompleteProfiles}</strong>
            </Link>
          </div>
        </section>
      )}

      {d.pending.length > 0 && (
        <section className="panel pending-panel" id="pending">
          <div className="dashboard-section-heading">
            <div>
              <h2>
                Công việc chờ xử lý{' '}
                <span className="count-pill">{pendingCount}</span>
              </h2>
              <p>Chọn một nhóm công việc để xem và xét duyệt.</p>
            </div>
            <span className="section-symbol">
              <Clock3 size={21} />
            </span>
          </div>
          <div className="pending-grid">
            {d.pending.map((m) => (
              <Link
                key={m.id}
                to={'/app/' + m.id + '?status=PENDING'}
                className={m.error ? 'has-error' : ''}
              >
                <span>
                  {m.title}
                  {m.error && <small role="alert">{m.error}</small>}
                </span>
                <strong>{m.error ? 'Chưa tải được' : m.count}</strong>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="dashboard-grid">
        {open('schedules') && (
          <section className="panel agenda-panel">
            <div className="dashboard-section-heading">
              <div>
                <h2>{coach ? 'Buổi dạy sắp tới' : 'Buổi tập sắp tới'}</h2>
                <p>Lịch tập trong phạm vi đang xem</p>
              </div>
              <Link className="panel-link" to="/app/schedules">
                Xem lịch tập
              </Link>
            </div>
            {d.upcoming.length ? (
              d.upcoming.map((s) => (
                <div className="agenda-row-wrap" key={s.id}>
                  <Link
                    className="agenda-item"
                    to={
                      '/app/schedules?classId=' +
                      encodeURIComponent(s.classId) +
                      '&record=' +
                      encodeURIComponent(s.id)
                    }
                  >
                    <span className="agenda-date">
                      <strong>{formatDate(s.sessionDate).split('/')[0]}</strong>
                      <small>
                        Tháng {formatDate(s.sessionDate).split('/')[1]}
                      </small>
                    </span>
                    <div className="agenda-copy">
                      <strong>
                        {d.classes.find((c) => c.id === s.classId)?.name ||
                          'Lớp học'}
                      </strong>
                      <p>
                        <Clock3 size={14} />
                        {s.startTime}–{s.endTime}
                        <span>· {formatDate(s.sessionDate)}</span>
                      </p>
                      <p>
                        <MapPin size={14} />
                        {s.location || 'Chưa cập nhật địa điểm'}
                      </p>
                    </div>
                  </Link>
                  {coach && open('attendance') && (
                    <Link
                      className="agenda-quick-cta"
                      to={`/app/attendance?date=${encodeURIComponent(s.sessionDate)}&sessionId=${encodeURIComponent(s.id)}`}
                    >
                      <ClipboardCheck size={15} />
                      Điểm danh
                    </Link>
                  )}
                  {student && open('leaves') && (
                    <Link
                      className="agenda-quick-cta"
                      to={`/app/leaves?classId=${encodeURIComponent(s.classId)}&date=${encodeURIComponent(s.sessionDate)}`}
                    >
                      <CalendarOff size={15} />
                      Xin nghỉ
                    </Link>
                  )}
                </div>
              ))
            ) : (
              <div className="dashboard-empty">
                <CalendarDays size={24} />
                <p>Chưa có lịch mới. Hãy kiểm tra lại với người phụ trách.</p>
              </div>
            )}
          </section>
        )}

        {open('announcements') && (
          <section className="panel updates-panel">
            <div className="dashboard-section-heading">
              <div>
                <h2>Thông báo mới</h2>
                <p>Cập nhật từ đơn vị và lớp học</p>
              </div>
              <Link className="panel-link" to="/app/announcements">
                Xem tất cả
              </Link>
            </div>
            {d.announcements.length ? (
              d.announcements.map((n) => (
                <Link
                  className="news-item"
                  key={n.id}
                  to={notificationTarget(n, user)}
                  onClick={() =>
                    api
                      .request('/notifications/read-one', {
                        method: 'POST',
                        body: { id: n.id },
                      })
                      .catch((e) => toast(e.message, 'error'))
                  }
                >
                  <span className="update-icon">
                    <Bell size={17} />
                  </span>
                  <div>
                    <small>{formatDate(n.createdAt)}</small>
                    <h3>{n.title}</h3>
                    <p>{n.body}</p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="dashboard-empty">
                <Bell size={24} />
                <p>Chưa có thông báo mới.</p>
              </div>
            )}
          </section>
        )}
      </div>

      {modules.some((m) => m.custom === 'report' && open(m.id)) && (
        <section className="dashboard-shortcuts report-shortcuts">
          <h2>Báo cáo và theo dõi</h2>
          <div className="shortcut-grid">
            {modules
              .filter((m) => m.custom === 'report' && open(m.id))
              .map((m) => (
                <Link key={m.id} to={'/app/' + m.id}>
                  <FileText size={19} />
                  <span>{m.title}</span>
                </Link>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
