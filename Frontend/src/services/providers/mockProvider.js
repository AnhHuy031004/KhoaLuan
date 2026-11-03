import {organizationRequestQuery} from '../../features/organization/navigation.js';
import { createMockFetch, DB_KEY } from '../../../mock/api.js';
export function createProvider(createApiClient, options) {
  const client = createApiClient({ ...options, fetchImpl: createMockFetch({ storage: localStorage }) });
  const request=client.request;
  client.request=(path,options={})=>request(path,{...options,query:{...options.query,...organizationRequestQuery(path,window.location.pathname.startsWith('/app/')?window.location.search:'')}});
  client.subscribeResource = (resource, callback) => {
    const storage = e => {if(e.key === DB_KEY || e.key === null) callback();};
    const local = e => {if(e.detail?.resource === resource || e.detail?.resource === 'ranks' || e.detail?.resource === 'permissions') callback();};
    const visible = () => {if(document.visibilityState === 'visible')callback();};
    window.addEventListener('storage',storage);
    window.addEventListener('vovinam:mock-change',local);
    window.addEventListener('focus',callback);
    document.addEventListener('visibilitychange',visible);
    return () => {window.removeEventListener('storage',storage);window.removeEventListener('vovinam:mock-change',local);window.removeEventListener('focus',callback);document.removeEventListener('visibilitychange',visible);};
  };
  client.subscribeLeaves = callback => client.subscribeResource('leaves',callback);
  return client;
}
