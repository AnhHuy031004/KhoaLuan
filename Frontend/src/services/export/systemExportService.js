import {api,IS_MOCK} from '../api.js';
import {modules} from '../../routes/routeConfig.js';
export async function getSystemExport(user) {
  if(IS_MOCK)return api.request('/exports/system');
  // Reserved API mode: fetch every accessible page; never silently truncate/fallback.
  const lookups=await api.request('/lookups'),sheets=[];
  for(const m of modules.filter(m=>m.permissions[user.role]?.includes('V')||(m.id==='online-payments'&&m.permissions[user.role]?.includes('P')))){
    const rows=[];let page=1;
    for(;;){const result=await api.request(m.endpoint,{query:{page,limit:200}});rows.push(...result.items);if(rows.length>=result.total)break;if(!result.items.length)throw Error('Máy chủ không trả đầy đủ dữ liệu '+m.title);page++;}
    sheets.push({id:m.id,title:m.title,columns:m.columns,rows});
  }
  return {generatedAt:new Date().toISOString(),user,mode:'api',scope:'Toàn bộ dữ liệu trong phạm vi quyền truy cập',lookups,sheets};
}
export async function downloadSystemExport(user) {
  const snapshot=await getSystemExport(user);
  const {downloadWorkbook}=await import('../../utils/excelExport.js');
  downloadWorkbook(snapshot);
  return snapshot;
}
