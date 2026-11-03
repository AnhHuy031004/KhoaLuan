import { day, period, names } from './shared.js';
import { ROLES } from '../src/utils/permissions.js';
export function createClasses(ctx) {
  return [
    'Cơ bản A1',
    'Cơ bản A2',
    'Nâng cao B1',
    'Thiếu niên C1',
    'Thiếu nhi C2',
    'Đội tuyển D1',
  ].map((name, i) => ({
    id: `c-${i + 1}`,
    name,
    instructorId: i < 2 ? 'u-coach' : `u-coach-${(i % 2) + 2}`,
    location: ['Võ đường Trung tâm', 'Nhà thi đấu Đồng Nai', 'Sân tập khu B'][
      i % 3
    ],
    capacity: 20 + i * 5,
    tuition: 350000 + i * 50000,
    status: 'ACTIVE',
    createdAt: day(-120),
  }));
}
