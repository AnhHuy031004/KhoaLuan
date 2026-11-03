import { day, period, names } from './shared.js';
import { ROLES } from '../src/utils/permissions.js';
export function createAudit(ctx) {
  return [
    {
      id: 'audit-coach',
      action: 'Cập nhật lịch tập',
      userName: 'Trần Minh Huấn',
      moduleName: 'Lịch tập',
      createdAt: new Date().toISOString(),
      userId: 'u-coach',
      role: 'INSTRUCTOR',
    },
    {
      id: 'audit-seed',
      action: 'Khởi tạo dữ liệu',
      userName: 'Hệ thống',
      moduleName: 'Hệ thống',
      createdAt: new Date().toISOString(),
      userId: 'u-admin',
      role: 'ADMIN',
    },
  ];
}
