import { id } from './shared.js';
export function createSessions(context) {
  const {
    date,
    classes
  } = context;
  return classes.map((c, i) => ({
    id: id(7, i + 1),
    classId: c.id,
    sessionDate: date,
    startTime: '18:00',
    endTime: '19:30'
  }));
}
