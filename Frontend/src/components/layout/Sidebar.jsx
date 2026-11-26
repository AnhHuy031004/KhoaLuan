import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
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
  ChevronDown,
  Search,
  X,
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
import {
  organizationQuery,
  matchesOrganizationSearch,
  ORGANIZATION_MODULES,
} from '../../features/organization/navigation.js';

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

export default function Sidebar({ open, mobile, onClose }) {
  const {
    user,
    logout,
    selectedWard,
    selectedClub,
    activeWard,
    activeClub,
    hierarchy,
  } = useAuth();

  const location = useLocation();
  const drawer = useRef(null);
  const [query, setQuery] = useState('');
  const [closed, setClosed] = useState({});
  useEffect(() => {
    const group = modules.find((m) =>
      location.pathname.startsWith('/app/' + m.id),
    )?.group;
    if (group) setClosed((value) => ({ ...value, [group]: false }));
  }, [location.pathname]);
  useEffect(() => {
    if (!open || !mobile) return;
    const previous = document.activeElement;
    drawer.current?.querySelector('button')?.focus();
    const keyboard = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
      if (event.key !== 'Tab') return;
      const nodes = [
        ...drawer.current.querySelectorAll('a, button, input'),
      ].filter((node) => !node.closest('[hidden]') && !node.disabled);
      const first = nodes[0],
        last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', keyboard);
    return () => {
      document.removeEventListener('keydown', keyboard);
      previous?.focus();
    };
  }, [open, mobile, onClose]);
  const ScopeTag = ['ADMIN', 'MASTER'].includes(user?.role) ? Link : 'div';
  const hasAnyReport = modules.some(
    (m) => m.group === 'BÁO CÁO' && canOpen(m, user?.role),
  );
  const available = modules
    .filter(
      (m) =>
        !m.hiddenInNav &&
        m.group !== 'BÁO CÁO' &&
        !(user?.role === 'STUDENT' && m.group === 'TÀI CHÍNH' && m.id !== 'online-payments') &&
        canOpen(m, user?.role) &&
        (!query ||
          matchesOrganizationSearch({ name: m.navTitle || m.title }, query)),
    )
    .map((m) => ({
      ...m,
      displayGroup: m.group,
      displayTitle:
        user?.role === 'STUDENT' && m.id === 'online-payments'
          ? 'Học phí & Thanh toán'
          : m.navTitle || m.title,
    }));
  const groups = [
    'TỔ CHỨC',
    'ĐÀO TẠO',
    'THI & THĂNG ĐAI',
    'TÀI CHÍNH',
    'ĐIỀU HÀNH',
    'BÁO CÁO',
    'HỆ THỐNG',
  ];

  const selectNavigation = () => {
    setQuery('');
    onClose();
  };

  const currentScopeQuery = organizationQuery({
    wardId: selectedWard,
    clubId: selectedClub,
  });

  const scopeTitle = activeClub?.name
    ? activeClub.name
    : activeWard?.name
      ? activeWard.name
      : hierarchy?.province?.name || 'Vovinam Management';

  return (
    <>
      <aside
        id="workspace-navigation"
        ref={drawer}
        role={mobile ? 'dialog' : undefined}
        aria-modal={mobile && open ? true : undefined}
        inert={mobile && !open ? true : undefined}
        aria-label="Menu chức năng"
        className={'sidebar ' + (open ? 'open' : '')}
      >
        <button
          className="sidebar-close icon-btn"
          aria-label="Đóng menu điều hướng"
          onClick={selectNavigation}
        >
          <X size={20} />
        </button>
        <Link className="brand" to="/app/dashboard" onClick={selectNavigation}>
          <img src="/assets/vovinam-logo.png" alt="Logo Vovinam" />
          <span>
            <strong>
              VOVINAM<span className="brand-dot">.</span>
            </strong>
            <small>VIỆT VÕ ĐẠO</small>
          </span>
        </Link>

        {/* Workspace scope header with quick link to management */}
        <ScopeTag
          to={
            ['ADMIN', 'MASTER'].includes(user?.role)
              ? '/app/management' + currentScopeQuery
              : '/app/dashboard'
          }
          className="workspace-switch"
          onClick={selectNavigation}
          title={
            ['ADMIN', 'MASTER'].includes(user?.role)
              ? 'Mở đơn vị quản lý'
              : 'Đơn vị được phân công'
          }
        >
          <span className="workspace-symbol">
            <Building2 size={18} />
          </span>
          <span>
            <strong>{scopeTitle}</strong>
            <small>{roleLabel(user)}</small>
          </span>
          {['ADMIN', 'MASTER'].includes(user?.role) && (
            <ChevronsUpDown size={14} />
          )}
        </ScopeTag>

        <label className="nav-search">
          <Search size={16} />
          <input
            aria-label="Tìm trong menu"
            placeholder="Tìm trong menu…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query && (
            <button aria-label="Xóa tìm kiếm menu" onClick={() => setQuery('')}>
              <X size={14} />
            </button>
          )}
        </label>
        <nav aria-label="Điều hướng chính">
          <div className="nav-section">
            <span className="nav-caption">KHÔNG GIAN LÀM VIỆC</span>
            <NavLink
              to="/app/dashboard"
              onClick={selectNavigation}
              className="nav-item"
            >
              <LayoutDashboard size={18} />
              <span>
                {user.role === 'STUDENT'
                  ? 'Trang của tôi'
                  : user.role === 'INSTRUCTOR'
                    ? 'Hôm nay'
                    : 'Tổng quan'}
              </span>
              <span className="nav-active-dot" />
            </NavLink>
            {['ADMIN', 'MASTER'].includes(user?.role) && (
              <NavLink
                to={'/app/management' + currentScopeQuery}
                onClick={selectNavigation}
                className="nav-item"
              >
                <Network size={18} />
                <span>Đơn vị quản lý</span>
                <span className="nav-active-dot" />
              </NavLink>
            )}
            {hasAnyReport && (
              <NavLink
                to={'/app/reports' + currentScopeQuery}
                onClick={selectNavigation}
                className="nav-item"
              >
                <ChartNoAxesCombined size={18} />
                <span>Báo cáo tổng hợp</span>
                <span className="nav-active-dot" />
              </NavLink>
            )}
            {user?.role === 'STUDENT' && (
              <NavLink
                to="/app/belt-journey"
                onClick={selectNavigation}
                className="nav-item"
              >
                <Medal size={18} />
                <span>Hành trình cấp đai</span>
                <span className="nav-active-dot" />
              </NavLink>
            )}
          </div>

          {groups
            .filter((g) => available.some((m) => m.group === g))
            .map((group) => (
              <section className="nav-section" key={group}>
                <button
                  type="button"
                  className="nav-group-toggle"
                  aria-expanded={!!query || !closed[group]}
                  aria-controls={'nav-group-' + groups.indexOf(group)}
                  onClick={() =>
                    setClosed((value) => ({ ...value, [group]: !value[group] }))
                  }
                >
                  <span>{group}</span>
                  <span className="nav-group-count">
                    {available.filter((m) => m.group === group).length}
                  </span>
                  <ChevronDown size={15} />
                </button>
                <div
                  id={'nav-group-' + groups.indexOf(group)}
                  hidden={!query && !!closed[group]}
                >
                  {available
                    .filter((m) => m.group === group)
                    .map((m) => {
                      const Icon = icons[m.icon] || Layers;
                      const path =
                        '/app/' +
                        m.id +
                        (ORGANIZATION_MODULES.includes(m.id)
                          ? currentScopeQuery
                          : '');
                      return (
                        <NavLink
                          key={m.id}
                          to={path}
                          className="nav-item"
                          onClick={selectNavigation}
                        >
                          <Icon size={17} />
                          <span>
                            {user.role === 'STUDENT'
                              ? {
                                  students: 'Hồ sơ của tôi',
                                  attendance: 'Điểm danh của tôi',
                                  schedules: 'Lịch tập của tôi',
                                  invoices: 'Thu phí khóa học',
                                  'online-payments': 'Thanh toán học phí online',
                                }[m.id] ||
                                m.navTitle ||
                                m.title
                              : m.navTitle || m.title}
                          </span>
                          <span className="nav-active-dot" />
                        </NavLink>
                      );
                    })}
                </div>
              </section>
            ))}
          {query && !available.length && (
            <p className="nav-no-results">Không tìm thấy chức năng.</p>
          )}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-motto">
            <span>Kỷ luật · Bản lĩnh · Nhân ái</span>
          </div>

        </div>
      </aside>
      {open && (
        <button
          className="sidebar-scrim"
          aria-label="Đóng menu"
          onClick={selectNavigation}
        />
      )}
    </>
  );
}
