import React from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Network,
  Layers,
  Users,
  LayoutGrid,
  RotateCcw,
  CheckCircle2,
  Globe,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { IS_MOCK } from '../../services/api.js';
import { roleLabel } from '../../utils/permissions.js';
import { organizationQuery } from '../../features/organization/navigation.js';
import './organization.css';

export default function OrganizationScope() {
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
  } = useAuth();

  const enabled = IS_MOCK && ['ADMIN', 'MASTER'].includes(user?.role);
  if (!enabled) return null;

  const currentSelection = { wardId: selectedWard, clubId: selectedClub };
  const hasSpecificFilter = Boolean(selectedClub) || (isProvincial && Boolean(selectedWard));

  const currentScopeTitle = activeClub
    ? `${activeClub.name} (${activeWard?.name || 'Phường'})`
    : activeWard
      ? `Toàn bộ ${activeWard.name}`
      : `Toàn tỉnh ${hierarchy?.province?.name || 'Đồng Nai'}`;

  return (
    <section className="org-command-panel" aria-label="Bảng chọn đơn vị quản lý">
      {/* Phần 1: Tiêu đề, Phạm vi hiện tại và Số liệu tổng hợp lớn, dễ đọc */}
      <div className="org-command-header">
        <div className="org-command-identity">
          <span className="org-command-icon">
            <Network size={26} />
          </span>
          <div className="org-command-titles">
            <div className="org-role-row">
              <span className="org-role-tag">{roleLabel(user)}</span>
              <span className="org-active-indicator">
                <CheckCircle2 size={15} />
                Đang xem: <strong>{currentScopeTitle}</strong>
              </span>
            </div>
            <p className="org-helper-text">
              {isClubLevel
                ? 'Bạn đang xem dữ liệu của câu lạc bộ được phân công phụ trách.'
                : 'Bấm trực tiếp vào nút Phường hoặc Câu lạc bộ bên dưới để chuyển đổi nhanh đơn vị cần xem.'}
            </p>
          </div>
        </div>

        <div className="org-command-metrics">
          {(!activeClub || isProvincial) && (
            <div className="org-metric-box">
              <Building2 size={20} className="org-metric-icon" />
              <div>
                <strong>{scopeStats?.clubCount || 0}</strong>
                <span>Câu lạc bộ</span>
              </div>
            </div>
          )}
          <div className="org-metric-box">
            <Layers size={20} className="org-metric-icon" />
            <div>
              <strong>{scopeStats?.classCount || 0}</strong>
              <span>Lớp học</span>
            </div>
          </div>
          <div className="org-metric-box">
            <Users size={20} className="org-metric-icon" />
            <div>
              <strong>{scopeStats?.studentCount || 0}</strong>
              <span>Môn sinh</span>
            </div>
          </div>
        </div>
      </div>

      {/* Phần 2: Các nút bấm chọn nhanh to, rõ ràng (Dành cho Cấp Tỉnh và Cấp Phường) */}
      {!isClubLevel && (
        <div className="org-selector-body">
          {/* Hàng 1: Chọn Phường (Dành cho Admin & Võ sư cấp tỉnh) */}
          {isProvincial && (
            <div className="org-selector-row">
              <div className="org-selector-label">
                <MapPin size={18} />
                <span>Chọn khu vực (Phường):</span>
              </div>
              <div className="org-button-group">
                <button
                  type="button"
                  className={`org-choice-btn ${!selectedWard ? 'is-selected' : ''}`}
                  onClick={() => switchScope('', '')}
                >
                  <Globe size={17} />
                  <span>Toàn tỉnh ({hierarchy?.wards?.length || 0} phường)</span>
                </button>
                {hierarchy?.wards?.map((w) => (
                  <button
                    type="button"
                    key={w.id}
                    className={`org-choice-btn ${selectedWard === w.id ? 'is-selected' : ''}`}
                    onClick={() => switchScope(w.id, '')}
                  >
                    <MapPin size={17} />
                    <span>{w.name}</span>
                    <small className="org-btn-badge">{w.clubCount || 0} CLB</small>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Hàng 2: Chọn Câu lạc bộ */}
          <div className="org-selector-row">
            <div className="org-selector-label">
              <Building2 size={18} />
              <span>{isProvincial ? 'Chọn Câu lạc bộ:' : 'Chọn Câu lạc bộ trực thuộc:'}</span>
            </div>
            <div className="org-button-group">
              <button
                type="button"
                className={`org-choice-btn ${!selectedClub ? 'is-selected' : ''}`}
                onClick={() => switchScope(selectedWard, '')}
              >
                <Layers size={17} />
                <span>
                  {selectedWard
                    ? `Tất cả CLB tại ${activeWard?.name || 'phường'} (${availableClubs?.length || 0})`
                    : `Tất cả CLB toàn tỉnh (${hierarchy?.clubs?.length || 0})`}
                </span>
              </button>
              {availableClubs?.map((c) => {
                const wardName = !selectedWard
                  ? hierarchy?.wards?.find((w) => w.id === c.wardId)?.name
                  : null;
                return (
                  <button
                    type="button"
                    key={c.id}
                    className={`org-choice-btn ${selectedClub === c.id ? 'is-selected' : ''}`}
                    onClick={() => switchScope(c.wardId, c.id)}
                  >
                    <Building2 size={17} />
                    <div className="org-choice-btn-text">
                      <span>{c.name}</span>
                      {wardName && <small className="org-choice-sub">{wardName}</small>}
                    </div>
                    <small className="org-btn-badge">{c.classCount || 0} lớp</small>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Phần 3: Thanh tác vụ nhanh khi đang lọc đơn vị */}
      {(hasSpecificFilter || activeClub) && (
        <div className="org-command-footer">
          {hasSpecificFilter && !isClubLevel && (
            <button
              type="button"
              className="org-action-reset"
              onClick={() => (isProvincial ? switchScope('', '') : switchScope(user?.wardId || '', ''))}
            >
              <RotateCcw size={16} />
              <span>{isProvincial ? 'Quay lại xem Toàn tỉnh Đồng Nai' : 'Quay lại xem Toàn bộ phường'}</span>
            </button>
          )}
          {activeClub && (
            <Link
              className="org-action-hub"
              to={'/app/management' + organizationQuery(currentSelection)}
            >
              <LayoutGrid size={16} />
              <span>Mở bảng chức năng riêng của {activeClub.name}</span>
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
