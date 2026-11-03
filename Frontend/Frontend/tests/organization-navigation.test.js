import test from 'node:test';
import assert from 'node:assert/strict';
import {createMockFetch,DB_KEY} from '../mock/api.js';
import {organizationRequestQuery,organizationQuery} from '../src/features/organization/navigation.js';
async function setup(){
 const map=new Map(),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)},fetch=createMockFetch({storage});
 const raw=async(path,method='GET',body,token)=>{const response=await fetch('/backend'+path,{method,headers:token?{Authorization:'Bearer '+token}:{},...(body?{body:JSON.stringify(body)}:{})});return {status:response.status,...await response.json()};};
 const login=async(email)=>{const data=await raw('/auth/login','POST',{email:email+'@vovinam.test',password:'Vovinam123!'});return(p,m,b)=>raw(p,m,b,data.data.tokens.accessToken);};
 return {province:await login('vosu'),ward:await login('vosuphuong'),club:await login('vosuclb'),db:()=>JSON.parse(storage.getItem(DB_KEY))};
}
const own='?wardId=ward-1&clubId=club-1';
test('navigation cards and available functions follow master level and actual unit totals',async()=>{
 const s=await setup(),province=(await s.province('/organization/navigation?module=classes')).data;
 assert.equal(province.wards.length,2);assert.equal(province.clubs.length,4);assert.equal(province.wards[0].clubCount,2);assert.equal(province.wards[0].classCount,3);assert.equal(province.clubs[0].classCount,2);
 const ward=(await s.ward('/organization/navigation?module=classes')).data;assert.deepEqual(ward.wards.map(w=>w.id),['ward-1']);assert.equal(ward.clubs.length,2);
 const club=(await s.club('/organization/navigation?module=classes')).data;assert.equal(club.wards.length,1);assert.deepEqual(club.clubs.map(c=>c.id),['club-1']);for(const id of ['classes','students','instructors','attendance','leaves','promotions'])assert(club.functions.some(f=>f.id===id));assert(!club.clubs[0].readOnly);
 assert.equal((await s.province('/organization/navigation?module=users')).status,400);
});
test('selected club limits list data, forms and every chart aggregation',async()=>{
 const s=await setup();
 assert.deepEqual((await s.province('/classes'+own)).data.items.map(c=>c.id),['c-1','c-2']);
 const students=(await s.province('/students'+own)).data;assert.equal(students.total,8);assert(students.items.every(r=>['c-1','c-2'].includes(r.classId)));
 const lookups=(await s.province('/lookups'+own+'&module=classes')).data;assert.equal(lookups.classes.length,2);assert.equal(lookups.clubs.length,1);assert.equal(lookups.wards.length,1);assert.equal(lookups.students.length,8);
 const studentReport=(await s.province('/report-charts/student-report'+own)).data;assert.equal(studentReport.cards[0].value,8);assert.equal(studentReport.classes.length,2);
 const foreignFilter=(await s.province('/report-charts/student-report'+own+'&classId=c-3')).data;assert.equal(foreignFilter.recordCount,0);
 const invoices=(await s.province('/invoices'+own+'&limit=5000')).data;assert(invoices.items.every(r=>['c-1','c-2'].includes(r.classId)));
});
test('selected scope cannot be bypassed through mutations or bulk review',async()=>{
 const s=await setup(),db=s.db(),other=db.classes.find(c=>c.id==='c-3');
 assert.equal((await s.province('/classes/c-3'+own,'PATCH',other)).status,404);
 assert.equal((await s.province('/classes'+own,'POST',{...other,id:undefined,name:'Sai câu lạc bộ'})).status,403);
 const proposal=db.promotions.find(p=>p.classId==='c-3');assert(proposal);
 assert.equal((await s.province('/promotions/bulk-review'+own,'POST',{action:'approve',classId:'c-3',ids:[proposal.id]})).status,403);
 const lesson=db.schedules.find(r=>r.classId==='c-3');assert.equal((await s.province('/attendance-workflow/sessions/'+lesson.id+own)).status,404);
 assert.equal((await s.province('/attendance-workflow/sessions/'+lesson.id+'/close'+own,'POST')).status,404);
 assert.deepEqual(s.db().classes,db.classes);
});
test('foreign and mismatched selections fail closed, including zero-result resources',async()=>{
 const s=await setup();
 for(const query of ['?wardId=ward-1&clubId=club-3','?clubId=unknown','?wardId=unknown'])assert.equal((await s.province('/classes'+query)).status,403);
 assert.equal((await s.ward('/classes?wardId=ward-2&clubId=club-3')).status,403);
 assert.equal((await s.club('/classes?wardId=ward-1&clubId=club-2')).status,403);
});
test('financial navigation stays inside the assigned ward and rejects foreign selections',async()=>{
 const s=await setup(),nav=(await s.ward('/organization/navigation?module=discounts')).data;
 assert.deepEqual(nav.wards.map(w=>w.id),['ward-1']);assert.deepEqual(nav.clubs.map(c=>c.id),['club-1','club-2']);assert(nav.clubs.every(c=>!c.readOnly));
 const other='?wardId=ward-2&clubId=club-3';
 for(const path of ['/invoices','/report-charts/tuition-report','/tuition-relief','/lookups'])assert.equal((await s.ward(path+other)).status,403,path);
 const full=(await s.ward('/exports/system'+other)).data;
 const expected=s.db().invoices.filter(r=>['c-1','c-2','c-3'].includes(r.classId));
 assert.equal(full.sheets.find(t=>t.id==='invoices').rows.length,expected.length);
 assert(full.lookups.classes.every(c=>['c-1','c-2','c-3'].includes(c.id)));
});
test('request query carries selected units only to business resources, never to auth or full export',()=>{
 const search='?wardId=ward-1&clubId=club-1&view=anything';
 assert.deepEqual(organizationRequestQuery('/lookups',search),{wardId:'ward-1',clubId:'club-1'});
 assert.deepEqual(organizationRequestQuery('/attendance-workflow/sessions/lesson',search),{wardId:'ward-1',clubId:'club-1'});
 for(const path of ['/auth/me','/permissions','/exports/system','/organization/navigation','/notifications'])assert.deepEqual(organizationRequestQuery(path,search),{});
 assert.equal(organizationQuery({wardId:'ward-1',clubId:'club-1'}),'?wardId=ward-1&clubId=club-1');
});
