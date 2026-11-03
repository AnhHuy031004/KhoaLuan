import { day, period, names } from './shared.js';
import { ROLES } from '../src/utils/permissions.js';
export function createInstructors(ctx) {
  return [
    {
      id: 'u-coach',
      fullName: 'Trần Minh Huấn',
      email: 'hlv@vovinam.test',
      phone: '0901234003',
      qualification: 'Hoàng đai đệ tam cấp',
      status: 'ACTIVE',
    },
    {
      id: 'u-coach-2',
      fullName: 'Lê Thùy Dương',
      email: 'duong@example.test',
      phone: '0901234004',
      qualification: 'Hoàng đai đệ nhị cấp',
      status: 'ACTIVE',
    },
    {
      id: 'u-coach-3',
      fullName: 'Nguyễn Anh Tuấn',
      email: 'tuan@example.test',
      phone: '0901234005',
      qualification: 'Hoàng đai đệ tam cấp',
      status: 'ACTIVE',
    },
  ];
}
