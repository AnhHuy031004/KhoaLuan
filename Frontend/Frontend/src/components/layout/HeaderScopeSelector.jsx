import React from 'react';
import { Building2, MapPin, ChevronDown, X, Layers, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useOrgScope } from '../../contexts/OrganizationContext.jsx';
import './header-scope.css';

export default function HeaderScopeSelector() {
  const { user } = useAuth();
  const {
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
  } = useOrgScope();

  if (!['ADMIN', 'MASTER'].includes(user?.role)) {
    return null;
  }

  const handleWardChange = (e) => {
    switchScope(e.target.value, '');
  };

  const handleClubChange = (e) => {
    switchScope(selectedWard, e.target.value);
  };

  const resetToAll = () => {
    if (isProvincial) switchScope('', '');
    else if (isWardLevel) switchScope(user?.wardId || '', '');
  };

  const hasFilter = isProvincial ? (Boolean(selectedWard) || Boolean(selectedClub)) : Boolean(selectedClub);

  return (
    <div className="header-scope-selector" aria-label="Phạm vi quản lý">
      {isProvincial && (
        <div className={`scope-pill ${selectedWard ? 'is-active' : ''}`} title="Chọn Phường / Đơn vị">
          <MapPin size={14} className="scope-pill-icon" />
          <div className="scope-select-wrap">
            <select
              className="scope-select"
              value={selectedWard}
              onChange={handleWardChange}
              aria-label="Chọn phường"
            >
              <option value="">Toàn tỉnh ({hierarchy.province?.name || 'Đồng Nai'})</option>
              {hierarchy.wards.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
            <ChevronDown size={12} className="scope-arrow" />
          </div>
        </div>
      )}

      {isWardLevel && (
        <div className="scope-badge-static" title="Phường phụ trách">
          <MapPin size={14} className="scope-pill-icon" />
          <span>{activeWard?.name || hierarchy.wards.find(w => w.id === user.wardId)?.name || 'Phường phụ trách'}</span>
        </div>
      )}

      {!isClubLevel && (
        <div className={`scope-pill ${selectedClub ? 'is-active' : ''}`} title="Chọn Câu lạc bộ">
          <Building2 size={14} className="scope-pill-icon" />
          <div className="scope-select-wrap">
            <select
              className="scope-select"
              value={selectedClub}
              onChange={handleClubChange}
              aria-label="Chọn câu lạc bộ"
            >
              <option value="">
                {selectedWard
                  ? `Tất cả CLB (${availableClubs.length})`
                  : `Tất cả CLB (${hierarchy.clubs.length})`}
              </option>
              {availableClubs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown size={12} className="scope-arrow" />
          </div>
        </div>
      )}

      {isClubLevel && (
        <div className="scope-badge-static" title="Câu lạc bộ phụ trách">
          <Building2 size={14} className="scope-pill-icon" />
          <span>{activeClub?.name || hierarchy.clubs.find(c => c.id === user.clubId)?.name || 'CLB phụ trách'}</span>
        </div>
      )}

      <div className="scope-stats-chip" title="Dữ liệu trong phạm vi đang chọn">
        <Layers size={13} />
        <span>{scopeStats.classCount} lớp</span>
        <span>·</span>
        <Users size={13} />
        <span>{scopeStats.studentCount} môn sinh</span>
      </div>

      {hasFilter && (
        <button
          className="scope-reset-btn"
          onClick={resetToAll}
          title={isProvincial ? 'Xem toàn tỉnh' : 'Xem tất cả CLB trong phường'}
          aria-label="Xóa bộ lọc đơn vị"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}