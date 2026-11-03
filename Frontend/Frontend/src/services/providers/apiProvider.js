// Dormant unless VITE_USE_MOCK=false. Never initialized by the mock provider.
import { createLiveAdapter } from '../live/liveAdapter.js';
import { configureModules } from '../live/livePolicy.js';
import { modules } from '../../routes/routeConfig.js';
export function createProvider(createApiClient, options) {
  configureModules(modules);
  return createLiveAdapter(createApiClient(options));
}
