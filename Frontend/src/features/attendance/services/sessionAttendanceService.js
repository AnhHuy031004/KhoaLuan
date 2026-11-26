import { api } from '../../../services/api.js';
const base = '/attendance-workflow';
export const sessionAttendanceService = {
  dates: (signal) => api.request(base + '/dates', { signal }),
  sessions: (date, signal) =>
    api.request(base + '/sessions', { query: { date }, signal }),
  roster: (id, signal) =>
    api.request(base + '/sessions/' + encodeURIComponent(id), { signal }),
  present: (id, studentIds) =>
    api.request(base + '/sessions/' + encodeURIComponent(id) + '/present', {
      method: 'POST',
      body: { studentIds },
    }),
  correct: (id, body) =>
    api.request(base + '/sessions/' + encodeURIComponent(id) + '/correct', {
      method: 'POST',
      body,
    }),
  undo: (id, studentId, reason) =>
    api.request(base + '/sessions/' + encodeURIComponent(id) + '/undo', {
      method: 'POST',
      body: { studentId, reason },
    }),
  close: (id, extra = {}) =>
    api.request(base + '/sessions/' + encodeURIComponent(id) + '/close', {
      method: 'POST',
      body: { confirm: true, ...extra },
    }),
};
