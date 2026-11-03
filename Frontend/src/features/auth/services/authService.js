import { api } from '../../../services/api.js';
export const authService = {
  login: (body) =>
    api.request('/auth/login', { method: 'POST', body, public: true }),
  me: () => api.request('/auth/me'),
  logout: () => api.request('/auth/logout', { method: 'POST' }),
};
