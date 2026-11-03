import { day, period, names } from './shared.js';
import { ROLES } from '../src/utils/permissions.js';
export function createRoles(ctx) {
  return Object.entries(ROLES).map(([code, name]) => ({
    id: code,
    name,
    code,
    description: 'Vai trò theo bảng phân quyền được cung cấp',
    system: true,
  }));
}
