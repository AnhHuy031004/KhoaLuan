import { createResourceEvents } from './resourceEvents.js';
import { organizationRequestQuery } from '../../features/organization/navigation.js';
import { createMockFetch, DB_KEY } from '../../../mock/api.js';
export function createProvider(createApiClient, options) {
  const client = createApiClient({
    ...options,
    fetchImpl: createMockFetch({ storage: localStorage }),
  });
  const request = client.request;
  client.request = (path, options = {}) =>
    request(path, {
      ...options,
      query: {
        ...options.query,
        ...organizationRequestQuery(
          path,
          window.location.pathname.startsWith('/app/')
            ? window.location.search
            : '',
        ),
      },
    });
  client.subscribeResource = createResourceEvents({
    window,
    document,
    key: DB_KEY,
  });
  client.subscribeLeaves = (callback) =>
    client.subscribeResource('leaves', callback);
  return client;
}
