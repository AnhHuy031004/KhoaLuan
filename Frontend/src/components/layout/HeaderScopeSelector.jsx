import React, { useState, useRef, useEffect } from 'react';
import {
  Building2,
  MapPin,
  ChevronDown,
  X,
  Layers,
  Users,
  Check,
  Globe,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import '../common/organization.css';

export default function HeaderScopeSelector() {
  const {
    user,
    hierarchy,
    selectedWard,
    selectedClub,
    activeWard,
    activeClub,
    availableClubs,
    scopeStats,
    isProvincial,
    isWardLevel,
    isClubLevel,
    switchScope,
    reloadHierarchy,
  } = useAuth();

  const [open, setOpen] = useState(false);
  const popRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (popRef.current && !popRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const escape = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', handleOutside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', handleOutside);
      document.removeEventListener('keydown', escape);
    };
  }, []);

  if (!['ADMIN', 'MASTER'].includes(user?.role)) {
    return null;
  }

  if (hierarchy?.error)
    return (
      <button className="btn btn-secondary" onClick={reloadHierarchy}>
        Không tải được đơn vị · Thử lại
      </button>
    );
  if (hierarchy?.loading) return <span role="status">Đang tải đơn vị…</span>;

  const hasFilter = isProvincial
    ? Boolean(selectedWard) || Boolean(selectedClub)
    : Boolean(selectedClub);

  const displayTitle = activeClub
    ? activeClub.name
    : activeWard
      ? activeWard.name
      : `Toàn ${(hierarchy?.province?.name || 'Tỉnh Đồng Nai').replace(/^Tỉnh\s+/i, 'tỉnh ')}`;

  const displaySub = activeClub
    ? activeWard?.name || 'Câu lạc bộ'
    : activeWard
      ? `${availableClubs?.length || 0} CLB trực thuộc`
      : `${hierarchy?.wards?.length || 0} Phường · ${hierarchy?.clubs?.length || 0} CLB`;

  return (
    <div className="header-scope-wrap" ref={popRef}>
      <button
        type="button"
        className={`header-scope-trigger ${open ? 'is-open' : ''} ${hasFilter ? 'is-filtered' : ''}`}
        onClick={() => !isClubLevel && setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="scope-options"
        aria-disabled={isClubLevel}
        title={
          isClubLevel
            ? 'Đơn vị được phân công'
            : 'Bấm để đổi Phường hoặc Câu lạc bộ'
        }
      >
        <span className="header-scope-trigger-icon">
          {activeClub ? <Building2 size={18} /> : <MapPin size={18} />}
        </span>
        <div className="header-scope-trigger-copy">
          <small>ĐƠN VỊ ĐANG XEM</small>
          <strong>{displayTitle}</strong>
        </div>
        <span className="header-scope-trigger-badge">
          {scopeStats?.classCount || 0} lớp · {scopeStats?.studentCount || 0} HV
        </span>
        {!isClubLevel && (
          <ChevronDown size={18} className="header-scope-trigger-arrow" />
        )}
      </button>

      {hasFilter && !isClubLevel && (
        <button
          type="button"
          className="header-scope-clear-btn"
          onClick={() => {
            if (isProvincial) switchScope('', '');
            else switchScope(user?.wardId || '', '');
            setOpen(false);
          }}
          title="Xem tất cả đơn vị"
        >
          <RotateCcw size={15} />
          <span>Xem tất cả</span>
        </button>
      )}

      {/* Bảng chọn đơn vị to, rõ ràng khi bấm vào nút trên Header */}
      {open && !isClubLevel && (
        <div
          id="scope-options"
          className="header-scope-popover"
          role="dialog"
          aria-label="Chọn nhanh đơn vị"
        >
          <div className="scope-popover-header">
            <div>
              <strong>Chọn nhanh Đơn vị quản lý</strong>
              <p>Chọn Phường hoặc Câu lạc bộ để lọc dữ liệu ngay lập tức</p>
            </div>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setOpen(false)}
              aria-label="Đóng"
            >
              <X size={18} />
            </button>
          </div>

          {isProvincial && (
            <div className="scope-popover-section">
              <span className="scope-popover-label">
                1. CHỌN KHU VỰC (PHƯỜNG)
              </span>
              <div className="scope-popover-grid">
                <button
                  type="button"
                  className={`scope-popover-card ${!selectedWard ? 'active' : ''}`}
                  onClick={() => {
                    switchScope('', '');
                  }}
                >
                  <Globe size={18} />
                  <div>
                    <strong>Toàn tỉnh Đồng Nai</strong>
                    <small>Tất cả {hierarchy?.wards?.length || 0} phường</small>
                  </div>
                  {!selectedWard && <Check size={18} className="scope-check" />}
                </button>
                {hierarchy?.wards?.map((w) => (
                  <button
                    type="button"
                    key={w.id}
                    className={`scope-popover-card ${selectedWard === w.id ? 'active' : ''}`}
                    onClick={() => {
                      switchScope(w.id, '');
                    }}
                  >
                    <MapPin size={18} />
                    <div>
                      <strong>{w.name}</strong>
                      <small>
                        {w.clubCount || 0} CLB · {w.classCount || 0} lớp
                      </small>
                    </div>
                    {selectedWard === w.id && (
                      <Check size={18} className="scope-check" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="scope-popover-section">
            <span className="scope-popover-label">
              {isProvincial
                ? '2. CHỌN CÂU LẠC BỘ (HOẶC XEM TẤT CẢ)'
                : 'CHỌN CÂU LẠC BỘ TRONG PHƯỜNG'}
            </span>
            <div className="scope-popover-grid">
              <button
                type="button"
                className={`scope-popover-card ${!selectedClub ? 'active' : ''}`}
                onClick={() => {
                  switchScope(selectedWard, '');
                  setOpen(false);
                }}
              >
                <Layers size={18} />
                <div>
                  <strong>
                    {selectedWard
                      ? `Tất cả CLB (${activeWard?.name})`
                      : 'Tất cả Câu lạc bộ'}
                  </strong>
                  <small>
                    Xem gộp {availableClubs?.length || 0} câu lạc bộ
                  </small>
                </div>
                {!selectedClub && <Check size={18} className="scope-check" />}
              </button>
              {availableClubs?.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  className={`scope-popover-card ${selectedClub === c.id ? 'active' : ''}`}
                  onClick={() => {
                    switchScope(c.wardId, c.id);
                    setOpen(false);
                  }}
                >
                  <Building2 size={18} />
                  <div>
                    <strong>{c.name}</strong>
                    <small>
                      {c.classCount || 0} lớp · {c.studentCount || 0} võ sinh
                    </small>
                  </div>
                  {selectedClub === c.id && (
                    <Check size={18} className="scope-check" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
