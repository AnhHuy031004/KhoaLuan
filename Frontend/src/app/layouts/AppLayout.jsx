import React, { useState } from "react";
import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Layers, CalendarDays, ClipboardCheck, Award, Wallet, Bell, ChartNoAxesCombined, Settings2, ShieldCheck, UserRound, LogOut, Menu, ChevronRight } from "lucide-react";
import { useAuth } from "../../features/auth/AuthProvider.jsx";
import { useLookups } from "../../shared/providers/LookupProvider.jsx";
import { modules } from "../moduleRegistry.js";
import { ROLE_LABEL } from "../../shared/utils/labels.js";
import { ErrorState } from "../../shared/components/index.jsx";
import { IS_MOCK } from "../../services/api/index.js";
import { MOCK_DB_KEY } from "../../../mock/api.js";
const icons = {
  users: Users,
  layers: Layers,
  calendar: CalendarDays,
  check: ClipboardCheck,
  award: Award,
  wallet: Wallet,
  bell: Bell,
  chart: ChartNoAxesCombined,
  settings: Settings2,
  shield: ShieldCheck,
  user: UserRound
};
export default function Layout() {
  const {
    user,
    logout,
    expire
  } = useAuth();
  const {
    lookups,
    studentId,
    setStudentId,
    lookupErrors
  } = useLookups();
  const [open, setOpen] = useState(false),
    [error, setError] = useState(null),
    [logging, setLogging] = useState(false);
  const navigate = useNavigate();
  const visible = modules.filter(m => m.roles.includes(user.role)),
    groups = [...new Set(visible.map(m => m.group))];
  async function exit() {
    setLogging(true);
    setError(null);
    try {
      await logout();
      navigate("/auth/login");
    } catch (err) {
      setError(err);
    } finally {
      setLogging(false);
    }
  }
  return <div className={"app-shell " + (open ? "sidebar-open" : "")}>
      <aside className="sidebar">
        <Link className="brand" to="/app/dashboard" onClick={() => setOpen(false)}>
          <img className="brand-logo" src="/assets/vovinam-logo.png" alt="Logo Vovinam" width="48" height="48" />
          <strong>Vovinam</strong>
        </Link>
        <span className="sidebar-caption">KHÔNG GIAN QUẢN LÝ</span>
        <nav aria-label="Điều hướng hệ thống">
          <NavLink to="/app/dashboard" className="nav-item" onClick={() => setOpen(false)}>
            <LayoutDashboard size={17} />
            Tổng quan
          </NavLink>
          {groups.map(group => <section className="nav-group" key={group}>
              <h2>{group}</h2>
              {visible.filter(m => m.group === group).map(m => {
            const Icon = icons[m.icon] || Layers;
            return <NavLink to={"/app/" + m.id} key={m.id} className="nav-item" onClick={() => setOpen(false)}>
                      <Icon size={16} />
                      <span>{m.title}</span>
                    </NavLink>;
          })}
            </section>)}
        </nav>
        <div className="sidebar-account">
          <Link to="/app/profile" className="account-info">
            <span className="avatar">
              {user.email.slice(0, 2).toUpperCase()}
            </span>
            <span>
              <strong>{user.fullName || user.email.split("@")[0]}</strong>
              <small>{ROLE_LABEL[user.role]}</small>
            </span>
          </Link>
          <button className="icon-button" onClick={exit} disabled={logging} aria-label="Đăng xuất">
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      {open && <button className="sidebar-scrim" aria-label="Đóng menu" onClick={() => setOpen(false)} />}
      <main className="workspace">
        <header className="topbar">
          <div className="row">
            <button className="icon-button menu-toggle" aria-label="Mở menu" onClick={() => setOpen(v => !v)}>
              <Menu />
            </button>
            <span className="topbar-title">Vovinam</span>
            <ChevronRight size={13} />
            <span>{ROLE_LABEL[user.role]}</span>
          </div>
          <div className="row">
            <span className="connection">
              <span />
              {IS_MOCK ? "Dữ liệu mẫu" : "Chế độ API"}
            </span>
            <Link to="/app/notifications" className="icon-button" aria-label="Thông báo">
              <Bell size={18} />
            </Link>
            <Link to="/app/profile" className="avatar">
              {user.email.slice(0, 2).toUpperCase()}
            </Link>
          </div>
        </header>
        <div className="workspace-body">
          {IS_MOCK && <div className="mock-notice mock-toolbar">
            <span><strong>Dữ liệu mẫu</strong> · Thêm/sửa/xóa chỉ lưu trên trình duyệt này.</span>
            <button className="secondary" onClick={() => {
            if (window.confirm("Khôi phục dữ liệu mẫu ban đầu? Các thay đổi mock trên trình duyệt này sẽ bị xóa.")) {
              window.localStorage.removeItem(MOCK_DB_KEY);
              for (const key of Object.keys(window.sessionStorage)) {
                if (key.startsWith("mock:vovinam-attendance-")) window.sessionStorage.removeItem(key);
              }
              expire();
              window.location.assign("/auth/login");
            }
          }}>Khôi phục dữ liệu mẫu</button>
          </div>}
          {user.role === "PARENT" && <label className="child-selector">
              Võ sinh đang theo dõi
              <select value={studentId} onChange={e => setStudentId(e.target.value)}>
                <option value="">Chọn võ sinh</option>
                {lookups.students?.map(s => <option key={s.id} value={s.id}>
                    {s.fullName}
                  </option>)}
              </select>
            </label>}
          {error && <div className="mb">
              <ErrorState error={error} />
              <button className="text-button" onClick={expire}>
                Chỉ xóa phiên trên máy này
              </button>
            </div>}
          {lookupErrors.length > 0 && <details className="lookup-warning">
              <summary>
                Một số dữ liệu gợi ý chưa tải được ({lookupErrors.length})
              </summary>
              {lookupErrors.map(e => <p key={e.key}>
                  {e.key}: {e.message}
                </p>)}
            </details>}
          <Outlet />
          <footer className="page-footer">
            Vovinam · Kỷ luật, bản lĩnh, nhân ái
          </footer>
        </div>
      </main>
    </div>;
}
