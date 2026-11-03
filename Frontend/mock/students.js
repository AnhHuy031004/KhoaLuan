import { day, period, names } from './shared.js';
import { ROLES } from '../src/utils/permissions.js';
export function createStudents(ctx) {
  return names.map((fullName, i) => ({
    id: `s-${i + 1}`,
    studentCode: `VS${String(i + 1).padStart(4, '0')}`,
    fullName,
    dob: `${2004 + (i % 9)}-0${(i % 8) + 1}-15`,
    gender: i % 3 ? 'MALE' : 'FEMALE',
    phone: `090${String(1234500 + i)}`,
    email: i === 0 ? 'vosinh@vovinam.test' : `vosinh${i + 1}@example.test`,
    classId: `c-${(i % 6) + 1}`,
    rankId: `r-${(i % 4) + 1}`,
    status: i === 10 || i === 17 ? 'PAUSED' : 'ACTIVE',
    createdAt: day(-90 + i),
  }));
}
