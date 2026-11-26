import { day, period, names } from './shared.js';
import { ROLES } from '../src/utils/permissions.js';
export function createSchedules(ctx) {
  return ctx.classes.flatMap((c, i) =>
    [0, 2, 4].map((n, j) => ({
      id: `schedule-${i}-${j}`,
      classId: c.id,
      sessionDate: day(n),
      startTime: `${String(8 + i * 2).padStart(2, '0')}:00`,
      endTime: `${String(9 + i * 2).padStart(2, '0')}:30`,
      location: c.location,
      status: n === 0 ? 'SCHEDULED' : 'SCHEDULED',
    })),
  );
}
