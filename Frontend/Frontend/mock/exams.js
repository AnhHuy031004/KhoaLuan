import { day, period, names } from './shared.js';
import { ROLES } from '../src/utils/permissions.js';
export function createExams(ctx) {
  return [
    {
      id: 'ex-1',
      title: 'Kỳ thi thăng đai quý IV',
      examDate: day(20),
      rankId: 'r-2',
      location: 'Nhà thi đấu Đồng Nai',
      fee: 200000,
      status: 'APPROVED',
      createdAt: day(-20),
    },
    {
      id: 'ex-2',
      title: 'Kiểm tra kỹ thuật cuối khóa',
      examDate: day(35),
      rankId: 'r-4',
      location: 'Võ đường Trung tâm',
      fee: 250000,
      status: 'PENDING',
      createdAt: day(-4),
    },
  ];
}
