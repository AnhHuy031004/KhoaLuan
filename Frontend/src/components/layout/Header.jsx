import Loading from '../common/Loading.jsx';
import ErrorState from '../common/ErrorState.jsx';
import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Menu,
  Sun,
  Moon,
  ChevronRight,
  CheckCheck,
  Building2,
  MapPin,
  UserRound,
  LockKeyhole,
  LogOut,
  Award,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { useRemote } from '../../hooks/useRemote.js';
import { modules } from '../../routes/routeConfig.js';
import { canOpen, roleLabel } from '../../utils/permissions.js';
import { initials, formatDate, accountCredentials } from '../../utils/format.js';
import { matchesOrganizationSearch } from '../../features/organization/navigation.js';
import { api } from '../../services/api.js';
import { notificationTarget } from '../../config/uiPolicy.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import HeaderScopeSelector from './HeaderScopeSelector.jsx';
import '../common/organization.css';

export default function Header({ onMenu, menuOpen }) {
  const { user, hierarchy, switchScope, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const toast = useToast();
  const loc = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [focused, setFocused] = useState(false);
  const [bell, setBell] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const accountRef = useRef(null);
  const accountTrigger = useRef(null);
  const credentials = accountCredentials(user);
  const ref = useRef(null);

  const remote = useRemote(
    (signal) => api.request('/notifications', { signal }),
    [loc.pathname, user?.id],
  );

  useEffect(
    () => api.subscribeResource?.('exam-results', remote.reload),
    [remote.reload],
  );
  useEffect(
    () => api.subscribeResource?.('announcements', remote.reload),
    [remote.reload],
  );

  const notices = remote.data || [];
  const unread = notices.filter((n) => !n.read).length;
  const active = loc.pathname === '/app/reports' ? { title: 'Báo cáo tổng hợp' } : loc.pathname === '/app/belt-journey' ? { title: 'Hành trình cấp đai & Thi cử' } : modules.find((m) => loc.pathname === '/app/' + m.id);

  const matches = modules
    .filter(
      (m) => canOpen(m, user?.role) && matchesOrganizationSearch(m, search),
    )
    .slice(0, 5);

  const matchingWards = (hierarchy?.wards || [])
    .filter((w) => matchesOrganizationSearch(w, search))
    .slice(0, 3);

  const matchingClubs = (hierarchy?.clubs || [])
    .filter((c) => matchesOrganizationSearch(c, search))
    .slice(0, 4);

  const hasAnyResults =
    matches.length > 0 || matchingClubs.length > 0 || matchingWards.length > 0;

  useEffect(() => {
    const close = (e) => {
      if (!accountRef.current?.contains(e.target)) setAccountOpen(false);
      if (!ref.current?.contains(e.target)) {
        setBell(false);
        setFocused(false);
      }
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);

  useEffect(() => { setAccountOpen(false); }, [loc.pathname, loc.hash]);
  useEffect(() => {
    if (!accountOpen) return;
    const escape = (event) => {
      if (event.key === 'Escape') { setAccountOpen(false); accountTrigger.current?.focus(); }
    };
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [accountOpen]);

  function submit(e) {
    e.preventDefault();
    if (search.trim()) {
      if (matchingClubs.length) {
        switchScope(matchingClubs[0].wardId, matchingClubs[0].id, {
          navigateTo: '/app/classes',
        });
      } else if (matchingWards.length) {
        switchScope(matchingWards[0].id, '', { navigateTo: '/app/classes' });
      } else if (matches.length) {
        navigate('/app/' + matches[0].id);
      }
      setSearch('');
      setFocused(false);
    }
  }

  return (
    <header className="topbar" ref={ref}>
      <div className="breadcrumb">
        <button
          className="icon-btn menu-toggle"
          aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'}
          aria-expanded={menuOpen}
          aria-controls="workspace-navigation"
          onClick={onMenu}
        >
          <Menu size={22} />
        </button>
        {loc.pathname !== '/app/dashboard' && (
          <button
            type="button"
            className="header-back-btn"
            onClick={() => {
              if (loc.key && loc.key !== 'default' && window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/app/dashboard');
              }
            }}
            title="Quay lại trang trước"
            aria-label="Quay lại trang trước"
          >
            <ArrowLeft size={16} />
            <span>Quay lại</span>
          </button>
        )}
        <Link to="/app/dashboard" className="breadcrumb-root">
          Không gian quản lý
        </Link>
        <ChevronRight size={14} />
        <strong>
          {active?.title ||
            (loc.pathname.endsWith('profile')
              ? 'Hồ sơ cá nhân'
              : loc.pathname.endsWith('management')
                ? 'Đơn vị quản lý'
                : 'Tổng quan')}
        </strong>
      </div>

      {/* Nút chọn nhanh Đơn vị to, rõ ràng trên Header */}
      <HeaderScopeSelector />

      <div className="header-right">
        <form className="global-search" onSubmit={submit}>
          <Search size={16} />
          <input
            aria-label="Tìm chức năng hoặc đơn vị"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setFocused(true);
            }}
            onFocus={() => setFocused(true)}
            placeholder="Tìm chức năng, CLB…"
          />
          <kbd>↵</kbd>
          {focused && search && (
            <div className="search-results">
              {(matchingClubs.length > 0 || matchingWards.length > 0) && (
                <div className="search-group">
                  <span className="search-group-title">
                    Đơn vị & Câu lạc bộ
                  </span>
                  {matchingClubs.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      className="search-item-unit"
                      onClick={() => {
                        switchScope(c.wardId, c.id, {
                          navigateTo: '/app/classes',
                        });
                        setSearch('');
                        setFocused(false);
                      }}
                    >
                      <Building2 size={16} className="search-item-icon" />
                      <div>
                        <strong>{c.name}</strong>
                        <small>
                          {hierarchy?.wards?.find((w) => w.id === c.wardId)
                            ?.name || 'CLB'}
                        </small>
                      </div>
                      <ChevronRight size={14} />
                    </button>
                  ))}
                  {matchingWards.map((w) => (
                    <button
                      type="button"
                      key={w.id}
                      className="search-item-unit"
                      onClick={() => {
                        switchScope(w.id, '', { navigateTo: '/app/classes' });
                        setSearch('');
                        setFocused(false);
                      }}
                    >
                      <MapPin size={16} className="search-item-icon" />
                      <div>
                        <strong>{w.name}</strong>
                        <small>{w.clubCount || 0} CLB trực thuộc</small>
                      </div>
                      <ChevronRight size={14} />
                    </button>
                  ))}
                </div>
              )}

              {matches.length > 0 && (
                <div className="search-group">
                  <span className="search-group-title">Chức năng</span>
                  {matches.map((m) => (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => {
                        navigate('/app/' + m.id);
                        setSearch('');
                        setFocused(false);
                      }}
                    >
                      <span>{m.title}</span>
                      <ChevronRight size={14} />
                    </button>
                  ))}
                </div>
              )}

              {!hasAnyResults && (
                <p>Không tìm thấy chức năng hoặc đơn vị phù hợp.</p>
              )}
            </div>
          )}
        </form>

        <button
          className="icon-btn theme-toggle"
          aria-pressed={theme === 'light'}
          title={
            'Giao diện hiện tại: ' +
            (theme === 'light' ? 'Sáng' : 'Tối') +
            ' · Bấm để chuyển'
          }
          aria-label="Chuyển giao diện"
          onClick={toggle}
        >
          {theme === 'light' ? <Sun size={18} /> : <Moon size={18} />}
          <span>
            {
              (theme === 'light' ? 'Sáng' : 'Tối')
            }
          </span>
        </button>

        <div className="notification-wrap">
          <button
            className={'icon-btn ' + (bell ? 'is-active' : '')}
            aria-label="Mở thông báo"
            aria-expanded={bell}
            onClick={() => {
              remote.reload();
              setBell((v) => !v);
            }}
          >
            <Bell size={19} />
            {unread > 0 && <span className="notification-dot" />}
          </button>
          {bell && (
            <div className="notification-popover">
              <div className="popover-heading">
                <strong>
                  Thông báo <span>{unread} mới</span>
                </strong>
                <button
                  className="icon-btn"
                  disabled={remote.loading || !!remote.error || !unread}
                  aria-label="Đánh dấu tất cả đã đọc"
                  onClick={async () => {
                    try {
                      await api.request('/notifications/read-all', {
                        method: 'POST',
                      });
                      remote.reload();
                    } catch (e) {
                      toast(e.message, 'error');
                    }
                  }}
                >
                  <CheckCheck size={17} />
                </button>
              </div>
              {remote.loading ? (
                <Loading label="Đang tải thông báo…" />
              ) : remote.error ? (
                <ErrorState error={remote.error} retry={remote.reload} />
              ) : notices.length ? (
                notices.slice(0, 5).map((n) => (
                  <Link
                    to={notificationTarget(n, user)}
                    onClick={() => {
                      setBell(false);
                      api
                        .request('/notifications/read-one', {
                          method: 'POST',
                          body: { id: n.id },
                        })
                        .then(remote.reload)
                        .catch((e) => toast(e.message, 'error'));
                    }}
                    className={'notification-item ' + (!n.read ? 'unread' : '')}
                    key={n.id}
                  >
                    <span className="notice-icon">
                      <Bell size={16} />
                    </span>
                    <div>
                      <strong>{n.title}</strong>
                      <small>{formatDate(n.createdAt)}</small>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="popover-empty">Chưa có thông báo mới.</p>
              )}
              <Link
                className="popover-footer"
                to="/app/announcements"
                onClick={() => setBell(false)}
              >
                Xem tất cả thông báo <ChevronRight size={14} />
              </Link>
            </div>
          )}
        </div>

        <span className="header-divider" />
        <div className="account-controls" ref={accountRef}>
          <button type="button" className="account-profile-trigger" ref={accountTrigger}
            aria-label="Mở tùy chỉnh tài khoản" aria-expanded={accountOpen} aria-controls="account-profile-menu"
            onClick={() => { setAccountOpen((value) => !value); setBell(false); setFocused(false); }}>
            <span className="avatar">{initials(user?.fullName || '')}</span>
            <span className="account-trigger-name"><strong>{user?.fullName}</strong><small>{roleLabel(user)}</small></span>
          </button>
          {accountOpen && <div id="account-profile-menu" className="account-profile-menu" role="dialog" aria-label="Tùy chỉnh tài khoản">
            <div className="account-menu-identity">
              <span className="account-menu-avatar" aria-hidden="true">{initials(user?.fullName || '')}</span>
              <div className="account-menu-copy"><strong>{user?.fullName}</strong><small>{user?.email}</small><span className="account-role-chip">{roleLabel(user)}</span></div>
            </div>
            {credentials.teaching && <div className="account-professional"><Award size={18} /><div>
              <span>Cấp đai / đẳng</span><strong className={credentials.rank ? '' : 'account-needs-info'}>{credentials.rank || 'Cần bổ sung'}</strong>
              <span>Bằng cấp / chứng chỉ</span><strong className={credentials.certificate ? '' : 'account-needs-info'}>{credentials.certificate || 'Cần bổ sung'}</strong>
            </div></div>}
            <nav aria-label="Cài đặt tài khoản">
              <Link to="/app/profile#account-info" aria-label="Thông tin tài khoản" onClick={() => setAccountOpen(false)}>
                <span className="account-action-icon"><UserRound size={18} /></span><span className="account-action-copy">Thông tin tài khoản<small aria-hidden="true">Xem và cập nhật hồ sơ</small></span>
              </Link>
              <Link to="/app/profile#account-security" aria-label="Đổi mật khẩu" onClick={() => setAccountOpen(false)}>
                <span className="account-action-icon"><LockKeyhole size={18} /></span><span className="account-action-copy">Đổi mật khẩu<small aria-hidden="true">Bảo mật tài khoản của bạn</small></span>
              </Link>
            </nav>
            <button type="button" className="account-signout" disabled={loggingOut} onClick={async () => {
              if (loggingOut) return;
              setLoggingOut(true);
              try { await logout(); } catch (error) { toast(error.message, 'error'); } finally { setLoggingOut(false); }
            }}><span className="account-action-icon"><LogOut size={18} /></span>{loggingOut ? 'Đang đăng xuất…' : 'Đăng xuất'}</button>
          </div>}
        </div>
      </div>
    </header>
  );
}
