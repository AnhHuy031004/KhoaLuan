import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  ArrowLeftRight,
  Award,
  BadgeCheck,
  Bell,
  Building2,
  CalendarDays,
  CalendarOff,
  ChartNoAxesCombined,
  ChevronsUpDown,
  ClipboardCheck,
  CreditCard,
  FileCheck2,
  History,
  KeyRound,
  Layers,
  LayoutDashboard,
  LogOut,
  Medal,
  ReceiptText,
  ScrollText,
  Settings2,
  Shield,
  Tag,
  TrendingUp,
  Trophy,
  UserPlus,
  UserRoundCheck,
  Users,
  Wallet,
} from 'lucide-react';
const icons = {
  Star: UserRoundCheck,
  ArrowLeftRight,
  Award,
  BadgeCheck,
  Bell,
  Building2,
  CalendarDays,
  CalendarOff,
  ChartNoAxesCombined,
  ChevronsUpDown,
  ClipboardCheck,
  CreditCard,
  FileCheck2,
  History,
  KeyRound,
  Layers,
  LayoutDashboard,
  LogOut,
  Medal,
  ReceiptText,
  ScrollText,
  Settings2,
  Shield,
  Tag,
  TrendingUp,
  Trophy,
  UserPlus,
  UserRoundCheck,
  Users,
  Wallet,
};
import { modules } from '../../routes/routeConfig.js';
import { canOpen, ROLES, roleLabel } from '../../utils/permissions.js';
import { initials } from '../../utils/format.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const available = modules.filter((m) => canOpen(m, user.role)),
    groups = [
      'TỔ CHỨC',
      'ĐÀO TẠO',
      'THI & THĂNG ĐAI',
      'TÀI CHÍNH',
      'ĐIỀU HÀNH',
      'BÁO CÁO',
      'HỆ THỐNG',
    ];
  return (
    <>
      <aside className={'sidebar ' + (open ? 'open' : '')}>
        <Link className="brand" to="/app/dashboard" onClick={onClose}>
          <img src="/assets/vovinam-logo.png" alt="Logo Vovinam" />
          <span>
            <strong>
              VOVINAM<span className="brand-dot">.</span>
            </strong>
            <small>VIỆT VÕ ĐẠO</small>
          </span>
        </Link>
        <div className="workspace-switch">
          <span className="workspace-symbol">
            <Building2 size={18} />
          </span>
          <span>
            <strong>Vovinam Management</strong>
            <small>{roleLabel(user)}</small>
          </span>
          <ChevronsUpDown size={14} />
        </div>
        <nav aria-label="Điều hướng chính">
          <div className="nav-section">
            <span className="nav-caption">KHÔNG GIAN LÀM VIỆC</span>
            <NavLink to={user.role==='MASTER'?'/app/management':'/app/dashboard'} onClick={onClose} className="nav-item">
              <LayoutDashboard size={18} />
              <span>{user.role==='MASTER'?'Đơn vị quản lý':'Tổng quan'}</span>
              <span className="nav-active-dot" />
            </NavLink>
          </div>
          {groups
            .filter((g) => available.some((m) => m.group === g))
            .map((group) => (
              <section className="nav-section" key={group}>
                <h2 className="nav-caption">{group}</h2>
                {available
                  .filter((m) => m.group === group)
                  .map((m) => {
                    const Icon = icons[m.icon] || Layers;
                    return (
                      <NavLink
                        key={m.id}
                        to={'/app/' + m.id}
                        className="nav-item"
                        onClick={onClose}
                      >
                        <Icon size={17} />
                        <span>{m.navTitle || m.title}</span>
                        <span className="nav-active-dot" />
                      </NavLink>
                    );
                  })}
              </section>
            ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-motto">
            <span>Kỷ luật · Bản lĩnh · Nhân ái</span>
          </div>
          <div className="sidebar-account">
            <Link to="/app/profile" onClick={onClose}>
              <span className="avatar">{initials(user.fullName)}</span>
              <span>
                <strong>{user.fullName}</strong>
                <small>{roleLabel(user)}</small>
              </span>
            </Link>
            <button
              className="icon-btn"
              aria-label="Đăng xuất"
              onClick={logout}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      {open && (
        <button
          className="sidebar-scrim"
          aria-label="Đóng menu"
          onClick={onClose}
        />
      )}
    </>
  );
}
