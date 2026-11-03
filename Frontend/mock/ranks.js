import { day, period, names } from './shared.js';
import { ROLES } from '../src/utils/permissions.js';
export function createRanks(ctx) {
  return [
    {
      id: 'r-1',
      name: 'Lam đai',
      level: 1,
      color: '#19bce7',
      description: 'Nền tảng võ đạo và kỹ thuật căn bản',
    },
    {
      id: 'r-2',
      name: 'Lam đai I',
      level: 2,
      color: '#218ad4',
      description: 'Rèn luyện quyền và tấn pháp',
    },
    {
      id: 'r-3',
      name: 'Lam đai II',
      level: 3,
      color: '#1553a5',
      description: 'Phát triển kỹ thuật và thể lực',
    },
    {
      id: 'r-4',
      name: 'Hoàng đai',
      level: 4,
      color: '#efbd36',
      description: 'Kỹ thuật nâng cao và năng lực huấn luyện',
    },
  ];
}
