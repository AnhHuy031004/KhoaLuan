import { organizationRequestQuery } from '../../features/organization/navigation.js';
import { createResourceEvents } from './resourceEvents.js';
import { modules } from '../../routes/routeConfig.js';
import { ApiError } from '../httpClient.js';
const object = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
export function validateResponse(path, method, data) {
  if (method !== 'GET') return data;
  const resource = modules.find((module) => module.endpoint === path);
  let valid = true;
  if (resource)
    valid =
      object(data) &&
      Array.isArray(data.items) &&
      Number.isInteger(data.total) &&
      data.total >= 0;
  const detailModule = modules.find(
    (module) =>
      module.custom !== 'report' &&
      path.startsWith(module.endpoint + '/') &&
      path.slice(module.endpoint.length + 1).split('/').length === 1,
  );
  if (detailModule)
    valid =
      object(data) &&
      typeof data.id === 'string' &&
      data.id ===
        decodeURIComponent(path.slice(detailModule.endpoint.length + 1));
  if (path === '/permissions')
    valid = object(data?.matrix) && Array.isArray(data.roles);
  if (path === '/lookups')
    valid =
      object(data) &&
      ['students', 'classes', 'ranks'].every((key) => Array.isArray(data[key]));
  if (path === '/notifications') valid = Array.isArray(data);
  if (path.startsWith('/report-charts/'))
    valid =
      object(data) && Array.isArray(data.charts) && Array.isArray(data.classes);
  if (path === '/exports/system')
    valid = object(data) && Array.isArray(data.sheets) && object(data.user);
  if (!valid)
    throw new ApiError(
      'Dữ liệu máy chủ trả về chưa hợp lệ. Vui lòng thử lại hoặc liên hệ người phụ trách.',
      502,
      { path },
    );
  return data;
}
export function createProvider(createApiClient, options) {
  const client = createApiClient(options),
    request = client.request;
  const browser = typeof window !== 'undefined' ? window : null,
    doc = typeof document !== 'undefined' ? document : null;
  const eventName = 'vovinam:api-change';
  const subscribe =
    browser && doc
      ? createResourceEvents({
          window: browser,
          document: doc,
          key: 'v2:http:vovinam-session-v1',
          eventName,
        })
      : () => () => {};
  let subscriptions = 0,
    timer;
  const changed = (resource) =>
    browser?.dispatchEvent(
      new browser.CustomEvent(eventName, { detail: { resource } }),
    );
  client.subscribeResource = (resource, callback) => {
    const off = subscribe(resource, callback);
    subscriptions++;
    if (browser && !timer)
      timer = setInterval(() => {
        if (
          doc.visibilityState === 'visible' &&
          client.read()?.tokens?.accessToken
        )
          changed();
      }, 30000);
    let active = true;
    return () => {
      if (!active) return;
      active = false;
      off();
      subscriptions--;
      if (!subscriptions && timer) {
        clearInterval(timer);
        timer = null;
      }
    };
  };
  client.subscribeLeaves = (callback) =>
    client.subscribeResource('leaves', callback);
  client.request = async (path, config = {}) => {
    const method = config.method || 'GET';
    const scope = browser?.location.pathname.startsWith('/app/')
      ? organizationRequestQuery(path, browser.location.search)
      : {};
    const data = await request(path, {
      ...config,
      query: { ...config.query, ...scope },
    });
    validateResponse(path, method, data);
    if (method !== 'GET') {
      const module = modules.find(
        (m) => path === m.endpoint || path.startsWith(m.endpoint + '/'),
      );
      if (module) changed(module.id);
      if (path.startsWith('/attendance-workflow/')) {
        changed('attendance');
        changed('schedules');
      }
      if (
        ['/auth/profile', '/permissions'].includes(path) ||
        ['users', 'roles', 'classes', 'clubs', 'wards'].includes(module?.id)
      )
        changed('permissions');
      if (['students', 'enrollments'].includes(module?.id)) {
        changed('students');
        changed('enrollments');
        changed('attendance');
      }
      if (
        [
          'leaves',
          'promotions',
          'exam-results',
          'discounts',
          'online-payments',
          'payment-confirmations',
        ].includes(module?.id) ||
        path.startsWith('/notifications/')
      )
        changed('announcements');
      if (
        ['discounts', 'online-payments', 'payment-confirmations'].includes(
          module?.id,
        )
      ) {
        changed('invoices');
        changed('online-payments');
        changed('payment-confirmations');
        changed('transactions');
      }
      if (module?.id === 'exam-results') {
        changed('students');
        changed('belt-history');
      }
    }
    return data;
  };
  return client;
}
