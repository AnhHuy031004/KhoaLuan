import React, { useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  ClipboardCheck,
  Wallet,
  TrendingUp,
} from 'lucide-react';
import ReportsPage from './ReportsPage.jsx';
import ErrorState from '../common/ErrorState.jsx';
import studentReport from '../../features/student-report/module.js';
import attendanceReport from '../../features/attendance-report/module.js';
import tuitionReport from '../../features/tuition-report/module.js';
import promotionReport from '../../features/promotion-report/module.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { canOpen } from '../../utils/permissions.js';

const REPORT_TABS = [
  { id: 'student-report', label: 'Võ sinh', icon: Users, config: studentReport },
  { id: 'attendance-report', label: 'Điểm danh', icon: ClipboardCheck, config: attendanceReport },
  { id: 'tuition-report', label: 'Học phí', icon: Wallet, config: tuitionReport },
  { id: 'promotion-report', label: 'Thăng đai', icon: TrendingUp, config: promotionReport },
];

export default function UnifiedReportsPage({ initialTab }) {
  const { user } = useAuth();
  const [url, setUrl] = useSearchParams();

  const allowedTabs = useMemo(
    () =>
      REPORT_TABS.filter((tab) => {
        if (
          tab.id === 'tuition-report' &&
          user?.role === 'MASTER' &&
          user?.masterLevel === 'CLUB'
        ) {
          return false;
        }
        return canOpen(tab.config, user?.role);
      }),
    [user?.role, user?.masterLevel],
  );

  const requestedTab = url.get('tab') || initialTab || allowedTabs[0]?.id || 'student-report';
  const activeTab =
    allowedTabs.find((t) => t.id === requestedTab) || allowedTabs[0] || null;

  useEffect(() => {
    if (activeTab && url.get('tab') && url.get('tab') !== activeTab.id) {
      const next = new URLSearchParams(url);
      next.set('tab', activeTab.id);
      setUrl(next, { replace: true });
    }
  }, [activeTab, url, setUrl]);

  if (!activeTab) {
    return (
      <div className="panel" style={{ maxWidth: 640, margin: '24px auto', padding: 28 }}>
        <ErrorState
          error={{
            status: 403,
            message: 'Vai trò hiện tại không có quyền xem các báo cáo tổng hợp.',
          }}
        />
      </div>
    );
  }

  function selectTab(tabId) {
    const next = new URLSearchParams(url);
    next.set('tab', tabId);
    setUrl(next, { replace: true });
  }

  return (
    <div className="unified-reports-shell">
      <div
        className="feature-tabs unified-reports-tabs"
        role="tablist"
        aria-label="Chọn loại báo cáo"
      >
        {allowedTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`feature-tab ${isActive ? 'is-active' : ''}`}
              onClick={() => selectTab(tab.id)}
            >
              <Icon size={16} />
              <span>Báo cáo {tab.label}</span>
            </button>
          );
        })}
      </div>
      <ReportsPage key={activeTab.id} config={activeTab.config} />
    </div>
  );
}
