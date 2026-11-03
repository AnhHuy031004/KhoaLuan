import { day, period, names } from './shared.js';
import { ROLES } from '../src/utils/permissions.js';
export function createMasters(ctx) {
  return [
    {
      id: 'master-1',
      fullName: 'Nguyễn Quốc Việt',
      email: 'vosu@vovinam.test',
      phone: '0901234001',
      qualification: 'Hồng đai đệ nhị cấp',
      status: 'ACTIVE',
    },
    {
      id: 'master-2',
      fullName: 'Phạm Thành Long',
      email: 'thanhlong@example.test',
      phone: '0901234002',
      qualification: 'Hồng đai đệ nhất cấp',
      status: 'ACTIVE',
    },
  ];
}
