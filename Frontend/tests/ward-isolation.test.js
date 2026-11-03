import test from 'node:test';
import assert from 'node:assert/strict';
import {createMockFetch,DB_KEY} from '../mock/api.js';
import {organizationEntryLevel,FINANCIAL_MODULES} from '../src/features/organization/navigation.js';

async function setup(){
 const values=new Map(),storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};
 const fetch=createMockFetch({storage});
 const raw=async(path,method='GET',body,token)=>{
  const response=await fetch('/backend'+path,{method,headers:token?{Authorization:'Bearer '+token}:{},...(body?{body:JSON.stringify(body)}:{})});
  return {status:response.status,...await response.json()};
 };
 const login=async email=>{
  const result=await raw('/auth/login','POST',{email:email.includes('@')?email:email+'@vovinam.test',password:'Vovinam123!'});assert.equal(result.status,200,result.message);
  return (p,m,b)=>raw(p,m,b,result.data.tokens.accessToken);
 };
 return {ward1:await login('vosuphuong'),ward2:await login('vosuphuong2'),admin:await login('admin'),province:await login('vosu'),coach:await login('hlv'),coach2:await login('tuan@example.test'),db:()=>JSON.parse(storage.getItem(DB_KEY)),write:db=>storage.setItem(DB_KEY,JSON.stringify(db)),fetch,storage};
}

test('all financial and management cards start at the assigned level',()=>{
 for(const moduleId of FINANCIAL_MODULES){
  assert.equal(organizationEntryLevel({role:'MASTER',masterLevel:'WARD',wardId:'ward-1'},moduleId),'clubs');
  assert.equal(organizationEntryLevel({role:'MASTER',masterLevel:'CLUB'},moduleId),'classes');
 }
 assert.equal(organizationEntryLevel({role:'ADMIN'}),'wards');
 assert.equal(organizationEntryLevel({role:'MASTER',masterLevel:'PROVINCE'}),'wards');
});

test('both ward accounts only receive their own units, people and financial records',async()=>{
 const s=await setup();
 for(const [call,wardId,clubIds,classIds] of [[s.ward1,'ward-1',['club-1','club-2'],['c-1','c-2','c-3']],[s.ward2,'ward-2',['club-3','club-4'],['c-4','c-5','c-6']]]){
  const scope=(await call('/organization')).data;
  assert.deepEqual(scope.wards.map(w=>w.id),[wardId]);assert.deepEqual(scope.clubs.map(c=>c.id),clubIds);assert.equal(scope.classCount,3);
  for(const moduleId of ['classes',...FINANCIAL_MODULES]){
   const nav=await call('/organization/navigation?module='+moduleId);assert.equal(nav.status,200,moduleId);
   assert.deepEqual(nav.data.wards.map(w=>w.id),[wardId]);assert.deepEqual(nav.data.clubs.map(c=>c.id),clubIds);
   const lookup=(await call('/lookups?module='+moduleId)).data;
   assert.deepEqual(lookup.wards.map(w=>w.id),[wardId]);assert(lookup.clubs.every(c=>clubIds.includes(c.id)));
   assert(lookup.classes.every(c=>classIds.includes(c.id)));assert(lookup.students.every(p=>classIds.includes(p.classId)));
   assert(lookup.invoices.every(r=>classIds.includes(r.classId)));
  }
  for(const endpoint of ['/tuition','/invoices','/online-payments','/transactions','/payment-confirmations','/tuition-relief','/students','/attendance','/leaves','/promotions','/exam-results']){
   const list=await call(endpoint+'?limit=5000');assert.equal(list.status,200,endpoint);
   assert(list.data.items.every(r=>!r.classId||classIds.includes(r.classId)),endpoint);
   assert(list.data.items.every(r=>!r.studentId||s.db().students.some(p=>p.id===r.studentId&&classIds.includes(p.classId))),endpoint);
  }
 }
 assert.equal((await s.admin('/invoices?limit=5000')).data.total,s.db().invoices.length);
 assert.equal((await s.province('/wards')).data.total,2);
});

test('URL filters and guessed identifiers cannot reveal or alter another ward',async()=>{
 const s=await setup(),db=s.db();
 const rows=[['/invoices','?wardId=ward-2'],['/tuition','?clubId=club-3'],['/tuition-relief','?wardId=ward-2&clubId=club-3'],['/report-charts/tuition-report','?wardId=ward-2'],['/lookups','?clubId=club-3&module=invoices']];
 for(const [path,query] of rows)assert.equal((await s.ward1(path+query)).status,403,path);
 const empty=await s.ward1('/invoices?classId=c-4');assert.equal(empty.status,200);assert.equal(empty.data.total,0);
 const result=await s.ward1('/report-charts/tuition-report?classId=c-4');assert.equal(result.status,200);assert.equal(result.data.recordCount,0);
 const invoice=db.invoices.find(r=>r.classId==='c-4');
 assert.equal((await s.ward1('/invoices/'+invoice.id,'PATCH',invoice)).status,403);
 assert.equal((await s.ward1('/invoices','POST',{...invoice,period:'2050-08',dueDate:'2050-08-20'})).status,403);
 const relief={...db.tuitionRelief[0],id:'ward2-only',studentId:'s-4',classId:'c-4',status:'PENDING'};db.tuitionRelief.push(relief);s.write(db);
 assert.equal((await s.ward1('/tuition-relief/ward2-only')).status,404);
 assert.equal((await s.ward1('/tuition-relief/ward2-only/actions/approve','POST')).status,404);
 assert.equal(s.db().tuitionRelief.find(r=>r.id==='ward2-only').status,'PENDING');
});

test('reports and full export aggregate every local record without including the other ward',async()=>{
 const s=await setup(),db=s.db(),ids=['c-1','c-2','c-3'];
 const invoices=db.invoices.filter(r=>ids.includes(r.classId));
 const report=(await s.ward1('/report-charts/tuition-report')).data;
 assert.equal(report.recordCount,invoices.length);assert.equal(report.cards[0].value,invoices.reduce((sum,r)=>sum+r.amount,0));
 assert.deepEqual(report.classes.map(c=>c.id),ids);
 const exported=(await s.ward1('/exports/system?wardId=ward-2&clubId=club-3')).data;
 assert.equal(exported.sheets.find(t=>t.id==='invoices').rows.length,invoices.length);
 for(const sheet of exported.sheets)for(const row of sheet.rows){
  if(row.classId)assert(ids.includes(row.classId),sheet.id);
  if(row.studentId)assert(db.students.some(p=>p.id===row.studentId&&ids.includes(p.classId)),sheet.id);
 }
 assert.deepEqual(exported.lookups.wards.map(w=>w.id),['ward-1']);
 assert(exported.lookups.clubs.every(c=>c.wardId==='ward-1'));
 assert(!JSON.stringify(exported).includes('Vovinam123!'));
});

test('existing sessions immediately follow the stricter boundary without resetting data or custom rights',async()=>{
 const s=await setup(),db=s.db();db.permissions.leaves.MASTER='V';db.students[0].fullName='Hồ sơ đã sửa';
 db.announcements.push({id:'old-foreign-notice',title:'Hồ sơ phường khác',body:'Không được xem',classId:'c-4',studentId:'s-4',audience:'CLASS',status:'PUBLISHED',systemEvent:'TUITION_RELIEF_REVIEWED',recipientUserIds:['u-master-ward'],createdAt:new Date().toISOString()});
 db.readNotifications['u-master-ward']=['old-foreign-notice'];s.write(db);
 assert(!(await s.ward1('/notifications')).data.some(n=>n.id==='old-foreign-notice'));
 const exported=(await s.ward1('/exports/system')).data;
 assert(!JSON.stringify(exported).includes('old-foreign-notice'));
 assert.equal(s.db().students[0].fullName,'Hồ sơ đã sửa');assert.equal(s.db().permissions.leaves.MASTER,'V');
 assert(s.db().readNotifications['u-master-ward'].includes('old-foreign-notice'));
 const again=createMockFetch({storage:s.storage});assert.equal((await again('/backend/students')).status,401);
 assert.equal((await s.ward1('/invoices?limit=5000')).data.items.every(r=>['c-1','c-2','c-3'].includes(r.classId)),true);
});

test('scope boundaries still apply if the editable role matrix grants every operation',async()=>{
 const s=await setup(),db=s.db();for(const rights of Object.values(db.permissions))rights.MASTER='VCEDAP';s.write(db);
 assert.deepEqual((await s.ward1('/wards')).data.items.map(w=>w.id),['ward-1']);
 assert((await s.ward1('/invoices?limit=5000')).data.items.every(r=>['c-1','c-2','c-3'].includes(r.classId)));
 assert.equal((await s.ward1('/invoices?wardId=ward-2')).status,403);
 assert.equal((await s.ward1('/users')).status,403);
});

test('new proposals only notify the responsible ward while provincial reviewers still receive them',async()=>{
 const s=await setup();
 const submitted=await s.coach2('/tuition-relief','POST',{studentId:'s-4',classId:'c-4',period:'2039-06',reliefType:'REDUCTION',percent:20,reason:'Hỗ trợ học viên của phường Long Bình'});
 assert.equal(submitted.status,200,submitted.message);
 const notice=s.db().announcements.find(n=>n.reliefId===submitted.data.id);
 assert(notice.recipientUserIds.includes('u-master-ward-2'));
 assert(notice.recipientUserIds.includes('u-admin'));assert(notice.recipientUserIds.includes('u-master'));
 assert(!notice.recipientUserIds.includes('u-master-ward'));
 assert(!(await s.ward1('/notifications')).data.some(n=>n.id===notice.id));
 assert((await s.ward2('/notifications')).data.some(n=>n.id===notice.id));
 assert.equal((await s.ward1(`/tuition-relief/${submitted.data.id}/actions/approve`,'POST')).status,404);
 assert.equal((await s.ward2(`/tuition-relief/${submitted.data.id}/actions/approve`,'POST')).status,200);
});
