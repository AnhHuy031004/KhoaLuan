import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Menu,
  Orbit,
  Moon,
  ChevronRight,
  CheckCheck,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { useRemote } from '../../hooks/useRemote.js';
import { modules } from '../../routes/routeConfig.js';
import { canOpen, roleLabel } from '../../utils/permissions.js';
import { initials, formatDate } from '../../utils/format.js';
import { matchesOrganizationSearch } from '../../features/organization/navigation.js';
import { api } from '../../services/api.js';
export default function Header({ onMenu }) {
  const { user } = useAuth(),
    { theme, toggle } = useTheme(),
    loc = useLocation(),
    navigate = useNavigate();
  const [search, setSearch] = useState(''),
    [focused, setFocused] = useState(false),
    [bell, setBell] = useState(false);
  const ref = useRef(null);
  const remote = useRemote(
    () => api.request('/notifications'),
    [loc.pathname, user.id],
  );
  useEffect(
    () => api.subscribeResource?.('exam-results', remote.reload),
    [remote.reload],
  );
  useEffect(
    () => api.subscribeResource?.('announcements', remote.reload),
    [remote.reload],
  );
  const notices = remote.data || [],
    unread = notices.filter((n) => !n.read).length;
  const active = modules.find((m) => loc.pathname === '/app/' + m.id);
  const matches = modules
    .filter((m) => canOpen(m, user.role) && matchesOrganizationSearch(m, search))
    .slice(0, 7);
  useEffect(() => {
    const close = (e) => {
      if (!ref.current?.contains(e.target)) {
        setBell(false);
        setFocused(false);
      }
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);
  function submit(e) {
    e.preventDefault();
    if (search.trim()) {
      if (matches.length) navigate('/app/' + matches[0].id);
      else if (active) {
        const next = new URLSearchParams(loc.search);
        next.set('q', search.trim());
        navigate('/app/' + active.id + '?' + next.toString());
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
          aria-label="Mở menu"
          onClick={onMenu}
        >
          <Menu size={22} />
        </button>
        <span className="breadcrumb-root">Không gian quản lý</span>
        <ChevronRight size={14} />
        <strong>
          {active?.title ||
            (loc.pathname.endsWith('profile')
              ? 'Hồ sơ cá nhân'
              : loc.pathname.endsWith('management') ||
                  (user.role === 'MASTER' && loc.pathname.endsWith('dashboard'))
                ? 'Đơn vị quản lý'
                : 'Tổng quan')}
        </strong>
      </div>
      <div className="header-right">
        <form className="global-search" onSubmit={submit}>
          <Search size={16} />
          <input
            aria-label="Tìm chức năng"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setFocused(true);
            }}
            onFocus={() => setFocused(true)}
            placeholder="Tìm chức năng…"
          />
          <kbd>↵</kbd>
          {focused && search && (
            <div className="search-results">
              {matches.length ? (
                matches.map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => {
                      navigate('/app/' + m.id);
                      setSearch('');
                      setFocused(false);
                    }}
                  >
                    {m.title}
                    <ChevronRight size={14} />
                  </button>
                ))
              ) : (
                <p>Không tìm thấy chức năng phù hợp.</p>
              )}
            </div>
          )}
        </form>
        <button
          className="icon-btn theme-toggle"
          aria-pressed={theme === 'galaxy'}
          title={
            theme === 'galaxy'
              ? 'Đang dùng Galaxy · Chuyển sang Dark'
              : 'Đang dùng Dark · Chuyển sang Galaxy'
          }
          aria-label={
            theme === 'galaxy' ? 'Chuyển sang Dark' : 'Chuyển sang Galaxy'
          }
          onClick={toggle}
        >
          {theme === 'galaxy' ? <Orbit size={18} /> : <Moon size={18} />}
          <span>{theme === 'galaxy' ? 'Galaxy' : 'Dark'}</span>
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
                  aria-label="Đánh dấu tất cả đã đọc"
                  onClick={async () => {
                    await api.request('/notifications/read-all', {
                      method: 'POST',
                    });
                    remote.reload();
                  }}
                >
                  <CheckCheck size={17} />
                </button>
              </div>
              {notices.length ? (
                notices.slice(0, 5).map((n) => (
                  <Link
                    to="/app/announcements"
                    onClick={() => setBell(false)}
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
        <Link to="/app/profile" className="header-profile">
          <span className="avatar">{initials(user.fullName)}</span>
          <span>
            <strong>{user.fullName}</strong>
            <small>{roleLabel(user)}</small>
          </span>
        </Link>
      </div>
    </header>
  );
}
