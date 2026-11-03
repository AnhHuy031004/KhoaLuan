import { day, period, names } from './shared.js';
import { ROLES } from '../src/utils/permissions.js';
export function createSchedules(ctx) {
  return ctx.classes.flatMap((c, i) =>
    [0, 2, 4].map((n, j) => ({
      id: `schedule-${i}-${j}`,
      classId: c.id,
      sessionDate: day(n),
      startTime: i % 2 ? '17:30' : '18:00',
      endTime: i % 2 ? '19:00' : '19:30',
      location: c.location,
      status: n === 0 ? 'SCHEDULED' : 'SCHEDULED',
    })),
  );
}
