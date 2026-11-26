import { toWriteDto } from './writeDto.js';
import { api } from './api.js';
export function createResourceService(config) {
  const path = config.endpoint;
  return {
    get: (id, signal) =>
      api.request(`${path}/${encodeURIComponent(id)}`, { signal }),
    list: (query, signal) => api.request(path, { query, signal }),
    create: (body) =>
      api.request(path, { method: 'POST', body: toWriteDto(config, body) }),
    update: (id, body) =>
      api.request(`${path}/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: toWriteDto(config, body, { update: true }),
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
