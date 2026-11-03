import { api } from './api.js';
export function createResourceService(config) {
  const path = config.endpoint;
  return {
    list: (query, signal) => api.request(path, { query, signal }),
    create: (body) => api.request(path, { method: 'POST', body }),
    update: (id, body) =>
      api.request(`${path}/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body,
      }),
    remove: (id) =>
      api.request(`${path}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    action: (id, action, body = {}) =>
      api.request(`${path}/${encodeURIComponent(id)}/actions/${action}`, {
        method: 'POST',
        body,
      }),
  };
}
