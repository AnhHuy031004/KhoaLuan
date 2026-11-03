import { day, period, names } from './shared.js';
import { ROLES } from '../src/utils/permissions.js';
export function createAttendance(ctx) {
  return Array.from({ length: 6 }, (_, m) =>
    ctx.students.flatMap((s, i) =>
      Array.from({ length: 4 }, (_, j) => ({
        id: `at-${m}-${i}-${j}`,
        studentId: s.id,
        classId: s.classId,
        sessionDate: `${period(-m)}-${String(j * 5 + 3).padStart(2, '0')}`,
        status:
          (i + j + m) % 13 === 0
            ? 'ABSENT'
            : (i + j) % 9 === 0
              ? 'LATE'
              : (i + m) % 15 === 0
                ? 'EXCUSED'
                : 'PRESENT',
        note: '',
      })),
    ),
  ).flat();
}
