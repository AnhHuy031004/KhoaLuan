import { day, period, names } from './shared.js';
import { ROLES } from '../src/utils/permissions.js';
export function createSettings(ctx) {
  return [
    {
      id: 'setting-1',
      name: 'Tên đơn vị',
      value: 'Võ đường Vovinam Đồng Nai',
      description: 'Thông tin hiển thị trên chứng từ',
    },
    {
      id: 'setting-2',
      name: 'Email liên hệ',
      value: 'lienhe@vovinam.example',
      description: 'Địa chỉ liên hệ của võ đường',
    },
    {
      id: 'setting-3',
      name: 'Địa chỉ',
      value: 'Đồng Nai, Việt Nam',
      description: 'Địa điểm hoạt động',
    },
  ];
}
