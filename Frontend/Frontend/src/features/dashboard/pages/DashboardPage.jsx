import OrganizationScope from '../../../components/common/OrganizationScope.jsx';
import React from 'react';
import ExportSystemButton from '../../../components/common/ExportSystemButton.jsx';
import { Link } from 'react-router-dom';
import {
  Users,
  Layers,
  ClipboardCheck,
  Wallet,
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Clock3,
  MapPin,
  Flame,
  Plus,
  ArrowUpRight,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext.jsx';
import { useRemote } from '../../../hooks/useRemote.js';
import { ROLES, roleLabel } from '../../../utils/permissions.js';
import { currency, formatDate } from '../../../utils/format.js';
import { dashboardService } from '../services/dashboardService.js';
import StatCard from '../components/StatCard.jsx';
import BarChart from '../../../components/charts/BarChart.jsx';
import PieChart from '../../../components/charts/PieChart.jsx';
import LineChart from '../../../components/charts/LineChart.jsx';
import Loading from '../../../components/common/Loading.jsx';
import ErrorState from '../../../components/common/ErrorState.jsx';
import EmptyState from '../../../components/common/EmptyState.jsx';
export default function DashboardPage() {
  const { user } = useAuth();
  const state = useRemote(
    async (signal) => {
      const [summary, lookups] = await Promise.all([
        dashboardService.get(signal),
        dashboardService.lookups(signal),
      ]);
      return { ...summary, lookups };
    },
    [user.id],
  );
  if (state.loading) return <Loading />;
  if (state.error)
    return <ErrorState error={state.error} retry={state.reload} />;
  const d = state.data;
  const name = user.fullName.split(' ').slice(-2).join(' ');
  const lookup = (id) =>
    d.lookups.classes.find((c) => c.id === id)?.name || 'Lớp học';
  const shortcuts = [
    { to: 'schedules', label: 'Xem lịch tập', icon: CalendarDays },
    { to: 'attendance', label: 'Theo dõi điểm danh', icon: ClipboardCheck },
    { to: 'exam-results', label: 'Kết quả thi', icon: Flame },
  ];
  const student = ['STUDENT','PARENT'].includes(user.role);
  return (
    <div className="dashboard">
      <OrganizationScope/>
      <div className="page-heading">
        <div>
          <div className="section-kicker">
            KHÔNG GIAN LÀM VIỆC
            <span />
            {roleLabel(user).toUpperCase()}
          </div>
          <h1>Tổng quan hoạt động</h1>
          <p>
            Hôm nay là{' '}
            {new Date().toLocaleDateString('vi-VN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
            .
          </p>
        </div>
        <div className="heading-actions"><ExportSystemButton/><Link className="btn btn-secondary" to="/app/schedules">
          <CalendarDays size={17} />
          Lịch tập của bạn
          <ArrowUpRight size={15} />
        </Link></div>
      </div>
      {d.warnings?.length>0&&<div className="api-notice"><div><strong>Dữ liệu cần kiểm tra</strong>{d.warnings.map((text,i)=><p key={i}>{text}</p>)}</div></div>}
      <section className="welcome-banner">
        <div className="welcome-copy">
          <span className="welcome-kicker">
            <span />
            VOVINAM · VIỆT VÕ ĐẠO
          </span>
          <h2>
            Chào {name},<br />
            sẵn sàng cho một ngày <em>bứt phá?</em>
          </h2>
          <p>Mỗi nỗ lực hôm nay đều tạo nên bản lĩnh ngày mai.</p>
          <Link
            to={student ? '/app/students' : '/app/classes'}
            className="welcome-link"
          >
            {student ? 'Xem hành trình của bạn' : 'Khám phá các lớp học'}
            <ArrowRight size={17} />
          </Link>
        </div>
        <div className="welcome-visual">
          <span className="welcome-ring one" />
          <span className="welcome-ring two" />
          <img
            src="/assets/vovinam-logo.png"
            alt="Liên đoàn Vovinam Việt Nam"
          />
          <div className="welcome-label">
            Tinh thần võ Việt
          </div>
        </div>
        <div className="welcome-strip">
          <i />
          <i />
          <i />
        </div>
      </section>
      <div className="stat-grid">
        <StatCard
          label={student ? 'Hồ sơ võ sinh' : 'Tổng võ sinh'}
          value={d.studentCount}
          detail={d.activeCount + ' đang hoạt động'}
          icon={Users}
          to="/app/students"
        />
        <StatCard
          label={student ? 'Lớp đang tham gia' : 'Lớp trong phạm vi'}
          value={d.classCount}
          detail="Không gian rèn luyện và kết nối"
          icon={Layers}
          to={student ? '/app/schedules' : '/app/classes'}
          tone="violet"
        />
        <StatCard
          label="Tỷ lệ tham gia"
          value={d.attendanceRate + '%'}
          detail="Có mặt và đi muộn / tổng buổi"
          icon={ClipboardCheck}
          to="/app/attendance"
          tone="green"
        />
        <StatCard
          label="Học phí chưa thanh toán"
          value={currency(d.unpaid)}
          detail={d.unpaidCount + ' hóa đơn đang chờ thanh toán'}
          icon={Wallet}
          to={user.role === 'INSTRUCTOR' ? '/app/tuition' : '/app/invoices'}
          tone="gold"
        />
      </div>
      <div className="dashboard-grid">
        <section className="panel attendance-chart-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">CHUYÊN CẦN</span>
              <h2>Nhịp tập luyện</h2>
            </div>
            <span className="period-chip">6 tháng gần nhất</span>
          </div>
          <BarChart data={d.months} />
          <div className="chart-bottom">
            <span>
              <i className="green-dot" />
              Dữ liệu điểm danh trong phạm vi của bạn
            </span>
            <Link to="/app/attendance-report">
              Xem báo cáo
              <ChevronRight size={14} />
            </Link>
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">HÀNH TRÌNH PHÁT TRIỂN</span>
              <h2>Phân bố cấp đai</h2>
            </div>
            <Link
              className="icon-btn"
              aria-label="Xem danh mục cấp đai"
              to="/app/ranks"
            >
              <ArrowUpRight size={19} />
            </Link>
          </div>
          <PieChart data={d.ranks} />
        </section>
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">LÊN LỊCH · SẴN SÀNG</span>
              <h2>Buổi tập sắp tới</h2>
            </div>
            <Link to="/app/schedules" className="panel-link">
              Xem tất cả
              <ChevronRight size={14} />
            </Link>
          </div>
          <div className="upcoming-list">
            {d.upcoming.length ? (
              d.upcoming.map((s) => (
                <Link className="upcoming-item" key={s.id} to="/app/schedules">
                  <div className="calendar-tile">
                    <strong>
                      {new Date(s.sessionDate + 'T12:00:00').getDate()}
                    </strong>
                    <span>
                      TH {new Date(s.sessionDate + 'T12:00:00').getMonth() + 1}
                    </span>
                  </div>
                  <div>
                    <strong>{lookup(s.classId)}</strong>
                    <p>
                      <Clock3 size={13} />
                      {s.startTime} – {s.endTime}
                      <span>·</span>
                      <MapPin size={13} />
                      {s.location}
                    </p>
                  </div>
                  <ChevronRight size={16} />
                </Link>
              ))
            ) : (
              <EmptyState
                text="Chưa có buổi tập sắp tới"
                description="Lịch mới sẽ xuất hiện tại đây."
              />
            )}
          </div>
        </section>
        <section className="panel news-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">KẾT NỐI VÕ ĐƯỜNG</span>
              <h2>Thông báo mới</h2>
            </div>
            <Link to="/app/announcements" className="panel-link">
              Xem tất cả
              <ChevronRight size={14} />
            </Link>
          </div>
          {d.announcements.map((n, i) => (
            <Link className="news-item" key={n.id} to="/app/announcements">
              <span className={'news-symbol symbol-' + i}>
                {i === 0 ? <Flame size={20} /> : <CalendarDays size={20} />}
              </span>
              <div>
                <small>
                  {i === 0 ? 'TIN TỪ VÕ ĐƯỜNG' : 'LỊCH & HOẠT ĐỘNG'} ·{' '}
                  {formatDate(n.createdAt)}
                </small>
                <h3>{n.title}</h3>
                <p>{n.body}</p>
              </div>
              <ArrowUpRight size={16} />
            </Link>
          ))}
        </section>
      </div>
      {!['INSTRUCTOR'].includes(user.role) && (
        <section className="panel revenue-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">TÀI CHÍNH</span>
              <h2>
                {student ? 'Học phí đã hoàn tất' : 'Doanh thu đã ghi nhận'}
              </h2>
              <p>Chỉ tổng hợp giao dịch thành công.</p>
            </div>
            <Link to="/app/tuition-report" className="panel-link">
              Xem báo cáo
              <ChevronRight size={14} />
            </Link>
          </div>
          <LineChart data={d.months} />
        </section>
      )}
      <div className="quick-links">
        {shortcuts.map((s) => (
          <Link key={s.to} to={'/app/' + s.to}>
            <span>
              <s.icon size={20} />
            </span>
            <strong>{s.label}</strong>
            <ArrowUpRight size={18} />
          </Link>
        ))}
      </div>
    </div>
  );
}
