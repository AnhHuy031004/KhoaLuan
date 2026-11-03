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
  Network,
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
import { modules } from '../../routes/routeConfig.js';
import { canOpen, ROLES, roleLabel } from '../../utils/permissions.js';
import { initials } from '../../utils/format.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { organizationQuery, ORGANIZATION_MODULES } from '../../features/organization/navigation.js';

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

export default function Sidebar({ open, onClose }) {
  const { user, logout, selectedWard, selectedClub, activeWard, activeClub, hierarchy } = useAuth();

  const available = modules.filter((m) => canOpen(m, user?.role));
  const groups = [
    'TỔ CHỨC',
    'ĐÀO TẠO',
    'THI & THĂNG ĐAI',
    'TÀI CHÍNH',
    'ĐIỀU HÀNH',
    'BÁO CÁO',
    'HỆ THỐNG',
  ];

  const currentScopeQuery = organizationQuery({ wardId: selectedWard, clubId: selectedClub });

  const scopeTitle = activeClub?.name
    ? activeClub.name
    : activeWard?.name
      ? activeWard.name
      : hierarchy?.province?.name || 'Vovinam Management';

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

        {/* Workspace scope header with quick link to management */}
        <Link
          to={'/app/management' + currentScopeQuery}
          className="workspace-switch"
          onClick={onClose}
          title="Chuyển đến Trung tâm điều hành đơn vị"
        >
          <span className="workspace-symbol">
            <Building2 size={18} />
          </span>
          <span>
            <strong>{scopeTitle}</strong>
            <small>{roleLabel(user)}</small>
          </span>
          <ChevronsUpDown size={14} />
        </Link>

        <nav aria-label="Điều hướng chính">
          <div className="nav-section">
            <span className="nav-caption">KHÔNG GIAN LÀM VIỆC</span>
            <NavLink to="/app/dashboard" onClick={onClose} className="nav-item">
              <LayoutDashboard size={18} />
              <span>Tổng quan</span>
              <span className="nav-active-dot" />
            </NavLink>
            {['ADMIN', 'MASTER'].includes(user?.role) && (
              <NavLink to={'/app/management' + currentScopeQuery} onClick={onClose} className="nav-item">
                <Network size={18} />
                <span>Đơn vị quản lý</span>
                <span className="nav-active-dot" />
              </NavLink>
            )}
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
                    const path = '/app/' + m.id + (ORGANIZATION_MODULES.includes(m.id) ? currentScopeQuery : '');
                    return (
                      <NavLink
                        key={m.id}
                        to={path}
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
              <span className="avatar">{initials(user?.fullName || '')}</span>
              <span>
                <strong>{user?.fullName}</strong>
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
