import { createResourceService } from '../../../services/resourceService.js';
import config from '../module.js';
import {api} from '../../../services/api.js';
export default {...createResourceService(config),get:id=>api.request(config.endpoint+'/'+encodeURIComponent(id))};
