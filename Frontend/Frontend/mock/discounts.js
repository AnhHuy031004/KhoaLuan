import { day, period, names } from './shared.js';
import { ROLES } from '../src/utils/permissions.js';
export function createDiscounts(ctx) {
  return [
    {
      id: 'discount-1',
      code: 'VOVINAM10',
      name: 'Đồng hành cùng võ sinh mới',
      percent: 10,
      expiresAt: day(40),
      status: 'ACTIVE',
    },
    {
      id: 'discount-2',
      code: 'GIADINH15',
      name: 'Ưu đãi gia đình',
      percent: 15,
      expiresAt: day(60),
      status: 'ACTIVE',
    },
  ];
}
