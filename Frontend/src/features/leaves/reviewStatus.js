import {
  ROLES,
  MASTER_LEVELS,
  requiredApproverLabel,
} from '../../utils/permissions.js';
export function leaveReviewStatus(row) {
  const processed = ['APPROVED', 'REJECTED', 'SUCCESS'].includes(row?.status);
  const role = row?.reviewedRole;
  const roleLabel =
    role === 'ADMIN'
      ? 'Admin cấp tỉnh'
      : role === 'MASTER' && row.reviewedMasterLevel
        ? MASTER_LEVELS[row.reviewedMasterLevel]
        : ROLES[role] || role || '';
  const action =
    row?.status === 'SUCCESS'
      ? 'đã xác nhận'
      : row?.status === 'APPROVED'
        ? 'đã duyệt'
        : 'đã từ chối';

  if (!processed && row?.reliefType) {
    return {
      processed: false,
      label: 'Chờ duyệt',
      name: row.requiredApproverText || requiredApproverLabel(row),
      at: '',
    };
  }

  return {
    processed,
    label: processed
      ? roleLabel
        ? `${roleLabel} ${action}`
        : {
            SUCCESS: 'Đã xác nhận',
            APPROVED: 'Đã duyệt',
            REJECTED: 'Đã từ chối',
          }[row.status] || row.status
      : 'Chờ duyệt',
    name: row?.reviewedName || '',
    at: row?.reviewedAt || '',
  };
}
