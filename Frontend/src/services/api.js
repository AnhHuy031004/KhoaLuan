import { createApiClient } from './httpClient.js';

// Default is HTTP. Fixtures are explicitly enabled only by the development/fixtures modes.
export const IS_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const prefix = IS_MOCK ? 'v4:mock:' : 'v2:http:';
const SESSION_KEY = 'vovinam-session-v1';

const storage = {
  getItem: (key) => sessionStorage.getItem(prefix + key),
  setItem: (key, value) => sessionStorage.setItem(prefix + key, value),
  removeItem: (key) => sessionStorage.removeItem(prefix + key),
};

const options = {
  timeout: IS_MOCK ? 10000 : 30000,
  baseUrl: import.meta.env.VITE_API_BASE_URL || '/backend',
  storage,
  onExpired: () => window.dispatchEvent(new Event('vovinam:expired')),
};

let clientInstance = null;
let providerPromise = null;

function loadClient() {
  if (clientInstance) return Promise.resolve(clientInstance);
  if (!providerPromise) {
    providerPromise = (
      IS_MOCK
        ? import('./providers/mockProvider.js')
        : import('./providers/apiProvider.js')
    ).then((mod) => {
      clientInstance = mod.createProvider(createApiClient, options);
      return clientInstance;
    });
  }
  return providerPromise;
}

// Warm up provider in the background after initial paint without blocking startup
if (typeof window !== 'undefined') {
  const warm = () => {
    loadClient().catch(() => {});
  };
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(warm, { timeout: 1500 });
  } else {
    setTimeout(warm, 150);
  }
}

export const api = {
  read() {
    if (clientInstance) return clientInstance.read();
    try {
      return JSON.parse(storage.getItem(SESSION_KEY) || 'null');
    } catch {
      return null;
    }
  },
  save(session) {
    if (clientInstance) return clientInstance.save(session);
    if (session) storage.setItem(SESSION_KEY, JSON.stringify(session));
    else storage.removeItem(SESSION_KEY);
  },
  clear() {
    if (clientInstance) return clientInstance.clear();
    storage.removeItem(SESSION_KEY);
  },
  async request(path, config) {
    const client = await loadClient();
    return client.request(path, config);
  },
  subscribeResource(resource, callback) {
    let active = true;
    let unsub = null;
    loadClient()
      .then((client) => {
        if (active && typeof client.subscribeResource === 'function') {
          unsub = client.subscribeResource(resource, callback);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
      unsub?.();
    };
  },
  subscribeLeaves(callback) {
    return this.subscribeResource('leaves', callback);
  },
};
