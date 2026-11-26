import React from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
export default function OrganizationScope() {
  const { user, activeWard, activeClub } = useAuth();
  if (!['ADMIN', 'MASTER'].includes(user?.role)) return null;
  return (
    <p className="scope-context">
      Đang xem:{' '}
      <strong>
        {activeClub?.name ||
          activeWard?.name ||
          'Toàn bộ đơn vị được cấp quyền'}
      </strong>
    </p>
  );
}
