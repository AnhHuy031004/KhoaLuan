import { modules } from '../routes/routeConfig.js';
export const endpoints = Object.fromEntries(
  modules.map((m) => [m.id, m.endpoint]),
);
export const AUTH = {
  login: '/auth/login',
  me: '/auth/me',
  logout: '/auth/logout',
  refresh: '/auth/refresh-token',
};
