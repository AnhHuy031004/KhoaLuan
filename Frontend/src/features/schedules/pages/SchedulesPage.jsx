import React, { useState } from 'react';
import { CalendarPlus } from 'lucide-react';
import FeaturePage from '../../../components/common/FeaturePage.jsx';
import Button from '../../../components/common/Button.jsx';
import RecurringScheduleModal from '../components/RecurringScheduleModal.jsx';
import { useAuth } from '../../../contexts/AuthContext.jsx';
import { can } from '../../../utils/permissions.js';
import config from '../module.js';
import service from '../services/schedulesService.js';

export default function SchedulesPage() {
  const { user } = useAuth();
  const [showRecurring, setShowRecurring] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const canCreate = can(config, user?.role, 'C');

  return (
    <div className="schedules-page-shell">
      {canCreate && (
        <div className="schedules-quick-bar">
          <div>
            <strong>Lập lịch nhanh theo tuần</strong>
            <small>
              Tạo hàng loạt nhiều buổi tập cho lớp theo thứ cố định, có xem
              trước và tự lọc buổi trùng.
            </small>
          </div>
          <Button variant="primary" onClick={() => setShowRecurring(true)}>
            <CalendarPlus size={16} />
            Tạo lịch lặp theo tuần
          </Button>
        </div>
      )}
      <FeaturePage key={reloadKey} config={config} service={service} />
      {showRecurring && (
        <RecurringScheduleModal
          onClose={() => setShowRecurring(false)}
          onCreated={() => setReloadKey((k) => k + 1)}
        />
      )}
    </div>
  );
}
