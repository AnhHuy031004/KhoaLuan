// One service interface; only the selected provider is initialized.
import { createApiClient } from './httpClient.js';
export const IS_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';
const prefix = IS_MOCK ? 'v4:mock:' : 'v3:api:';
const options = {
  timeout: IS_MOCK ? 10000 : 45000,
  baseUrl: import.meta.env.VITE_API_BASE_URL || '/backend',
  storage: {
    getItem: key => sessionStorage.getItem(prefix + key),
    setItem: (key, value) => sessionStorage.setItem(prefix + key, value),
    removeItem: key => sessionStorage.removeItem(prefix + key),
  },
  onExpired: () => window.dispatchEvent(new Event('vovinam:expired')),
};
const provider = IS_MOCK
  ? await import('./providers/mockProvider.js')
  : await import('./providers/apiProvider.js');
export const api = provider.createProvider(createApiClient, options);
