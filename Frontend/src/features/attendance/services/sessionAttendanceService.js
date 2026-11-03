import { api } from '../../../services/api.js';
const base = '/attendance-workflow';
export const sessionAttendanceService = {
  dates: signal => api.request(base + '/dates', {signal}),
  sessions: (date, signal) => api.request(base + '/sessions', {query:{date}, signal}),
  roster: (id, signal) => api.request(base + '/sessions/' + encodeURIComponent(id), {signal}),
  present: (id, studentIds) => api.request(base + '/sessions/' + encodeURIComponent(id) + '/present', {method:'POST', body:{studentIds}}),
  close: id => api.request(base + '/sessions/' + encodeURIComponent(id) + '/close', {method:'POST', body:{confirm:true}}),
};
