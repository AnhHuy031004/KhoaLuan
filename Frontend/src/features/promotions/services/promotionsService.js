import { createResourceService } from '../../../services/resourceService.js';
import {api} from '../../../services/api.js';
import config from '../module.js';
export default {...createResourceService(config),bulkReview:body=>api.request('/promotions/bulk-review',{method:'POST',body})};
