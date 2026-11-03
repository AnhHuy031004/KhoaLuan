export const ORGANIZATION_MODULES = ['instructors','classes','students','enrollments','schedules','attendance','leaves','evaluations','promotions','exam-results','belt-history','tuition','invoices','online-payments','transactions','payment-confirmations','discounts','announcements','student-report','attendance-report','tuition-report','promotion-report'];
export const FINANCIAL_MODULES = ['tuition','invoices','online-payments','transactions','payment-confirmations','discounts','tuition-report'];
const normalizeSearch=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d').toLocaleLowerCase('vi').replace(/\s+/g,' ').trim();
export function matchesOrganizationSearch(item,search,context='') {
  const text=normalizeSearch([item.name,item.title,item.address,item.group,context].filter(Boolean).join(' '));
  return normalizeSearch(search).split(' ').filter(Boolean).every(word=>text.includes(word));
}
export function organizationQuery(selection={}) {
  const query=new URLSearchParams();
  if(selection.wardId)query.set('wardId',selection.wardId);
  if(selection.clubId)query.set('clubId',selection.clubId);
  return query.size?'?'+query.toString():'';
}
export function organizationRequestQuery(path,search) {
  const resource=path.split('/').filter(Boolean)[0];
  if(!['dashboard','lookups','report-charts','attendance-workflow','tuition-relief',...ORGANIZATION_MODULES].includes(resource))return {};
  const query=new URLSearchParams(search);
  return Object.fromEntries(['wardId','clubId'].filter(key=>query.get(key)).map(key=>[key,query.get(key)]));
}

// The entry screen follows the assigned level for every management module.
export function organizationEntryLevel(user) {
  if(user.role==='ADMIN'||user.role==='MASTER'&&(!user.masterLevel||user.masterLevel==='PROVINCE'))return 'wards';
  return user.masterLevel==='CLUB'?'classes':'clubs';
}
