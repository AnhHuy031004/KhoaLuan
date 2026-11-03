import { api } from '../../../services/api.js';
export const dashboardService = {
  get: (signal) => api.request('/dashboard', { signal }),
  lookups: (signal) => api.request('/lookups', { signal }),
};
