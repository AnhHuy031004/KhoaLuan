import test from 'node:test';
import assert from 'node:assert/strict';
import {createMockFetch,DB_KEY} from '../mock/api.js';
import {CLUB_PERMISSIONS} from '../src/config/clubPermissions.js';

async function setup(){
 const map=new Map(),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)},fetch=createMockFetch({storage});
 const raw=async(path,method='GET',body,token)=>{const r=await fetch('/backend'+path,{method,headers:token?{Authorization:'Bearer '+token}:{},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,...await r.json()};};
 const login=async email=>{const r=await raw('/auth/login','POST',{email:email.includes('@')?email:email+'@vovinam.test',password:'Vovinam123!'});assert.equal(r.status,200,r.message);return (p,m,b)=>raw(p,m,b,r.data.tokens.accessToken);};
 return {admin:await login('admin'),province:await login('vosu'),ward:await login('vosuphuong'),club:await login('vosuclb'),otherClub:await login('vosuclb3'),login,raw,db:()=>JSON.parse(storage.getItem(DB_KEY)),write:db=>storage.setItem(DB_KEY,JSON.stringify(db))};
}
const profile=(clubId,email='hlvmoi@example.test')=>({clubId,fullName:'HLV kiểm thử',email,phone:'0901234567',qualification:'Hoàng đai',status:'ACTIVE'});
const klass=(clubId,instructorId)=>({clubId,instructorId,name:'Lớp của CLB',location:'Võ đường',capacity:30,tuition:999999,status:'ACTIVE'});

test('club manager receives an operational function hub with caps independent of the editable role matrix',async()=>{
 const s=await setup(),nav=(await s.club('/organization/navigation?module=classes')).data;
 assert.equal(nav.clubs.length,1);assert.equal(nav.clubs[0].readOnly,false);
 for(const id of ['instructors','students','classes','attendance','leaves','promotions'])assert(nav.functions.some(f=>f.id===id));
 assert.deepEqual((await s.club('/classes')).data.items.map(c=>c.id),['c-1','c-2']);
 const permissions=(await s.club('/permissions')).data.matrix;
 assert.equal(permissions.instructors.MASTER,'VCE');assert.equal(permissions.leaves.MASTER,'VA');
 for(const id of ['users','roles','invoices','discounts','settings'])assert.equal(permissions[id].MASTER,'');
 const db=s.db();for(const rights of Object.values(db.permissions))rights.MASTER='VCEDAP';s.write(db);
 for(const id of ['users','roles','settings','invoices','tuition-relief'])assert.equal((await s.club('/'+id)).status,403,id);
 const capped=(await s.club('/permissions')).data.matrix;
 for(const [id,actions] of Object.entries(CLUB_PERMISSIONS))assert([...capped[id].MASTER].every(a=>actions.includes(a)));
 const revoked=s.db();revoked.permissions.instructors.MASTER='V';s.write(revoked);assert.equal((await s.club('/instructors','POST',profile('club-1'))).status,403);
});

test('every master level creates and edits an instructor profile inside its assigned unit',async()=>{
 const s=await setup();
 for(const [call,clubId,email] of [[s.province,'club-4','p@example.test'],[s.ward,'club-2','w@example.test'],[s.club,'club-1','c@example.test']]){
  const created=await call('/instructors','POST',profile(clubId,email));assert.equal(created.status,200,created.message);
  assert.equal(created.data.clubId,clubId);
  const edited=await call('/instructors/'+created.data.id,'PATCH',{...profile(clubId,email),phone:'0987654321'});assert.equal(edited.status,200,edited.message);
  assert.equal(edited.data.phone,'0987654321');assert.equal(s.db().instructors.find(i=>i.id===created.data.id).phone,'0987654321');
  assert(!s.db().users.some(u=>u.id===created.data.id));
 }
 assert.equal((await s.ward('/instructors','POST',profile('club-3'))).status,403);
 assert.equal((await s.club('/instructors','POST',profile('club-2'))).status,403);
});

test('club staff can be assigned to a new local class while tuition remains centrally controlled',async()=>{
 const s=await setup(),created=await s.club('/instructors','POST',profile('club-1'));
 assert.equal(created.status,200,created.message);
 const added=await s.club('/classes','POST',klass('club-1',created.data.id));assert.equal(added.status,200,added.message);
 assert.equal(s.db().classes.find(c=>c.id===added.data.id).tuition,0);
 const list=await s.club('/instructors');assert(list.data.items.find(i=>i.id===created.data.id).assignedClassNames.includes('Lớp của CLB'));
 assert.equal((await s.club('/classes','POST',klass('club-2',created.data.id))).status,403);
 assert.equal((await s.club('/classes','POST',klass('club-1','u-coach-3'))).status,403);
 const original=s.db().classes.find(c=>c.id==='c-1');
 const updated=await s.club('/classes/c-1','PATCH',{...original,name:'Lớp đã sửa',tuition:1});assert.equal(updated.status,200);assert.equal(updated.data.tuition,undefined);
 assert.equal(s.db().classes.find(c=>c.id==='c-1').tuition,original.tuition);assert.equal(s.db().classes.find(c=>c.id==='c-1').name,'Lớp đã sửa');
 assert((await s.club('/classes')).data.items.every(c=>c.tuition===undefined));
});

test('shared instructors can be read for local teaching but edited only by their responsible unit',async()=>{
 const s=await setup();
 const shared=(await s.otherClub('/instructors')).data.items.find(i=>i.id==='u-coach-2');
 assert(shared);assert.equal(shared.clubId,'club-2');assert.equal(shared.__readOnly,true);
 assert.equal((await s.otherClub('/instructors/u-coach-2','PATCH',{...shared,phone:'0000000000'})).status,403);
 const owner=await s.login('vosuclb2');
 assert.equal((await owner('/instructors/u-coach-2','PATCH',{...shared,phone:'0911111111'})).status,200);
 assert.equal((await s.club('/instructors?wardId=ward-1&clubId=club-2')).status,403);
 const selected=(await s.province('/instructors?wardId=ward-1&clubId=club-1')).data.items;
 assert(selected.every(i=>i.clubId==='club-1'||s.db().classes.some(c=>c.clubId==='club-1'&&c.instructorId===i.id)));
});

test('inactive, duplicate and linked instructor records are protected; Admin can attach the login later',async()=>{
 const s=await setup(),created=await s.club('/instructors','POST',profile('club-1'));
 assert.equal((await s.club('/instructors','POST',profile('club-1'))).status,409);
 assert.equal((await s.club('/instructors/'+created.data.id,'PATCH',{...profile('club-1'),status:'PAUSED'})).status,200);
 assert.equal((await s.club('/classes','POST',klass('club-1',created.data.id))).status,400);
 assert.equal((await s.club('/instructors/'+created.data.id,'PATCH',profile('club-1'))).status,200);
 const user=await s.admin('/users','POST',{fullName:'HLV kiểm thử',email:'hlvmoi@example.test',password:'Vovinam123!',role:'INSTRUCTOR',status:'ACTIVE'});
 assert.equal(user.status,200,user.message);assert.equal(user.data.id,created.data.id);
 assert.equal((await s.club('/classes','POST',klass('club-1',created.data.id))).status,200);
 assert.equal((await s.club('/instructors/'+created.data.id,'PATCH',{...profile('club-1'),status:'PAUSED'})).status,409);
 assert.equal((await s.admin('/instructors/'+created.data.id,'DELETE')).status,409);
 const coach=await s.login('hlvmoi@example.test');assert.equal((await coach('/classes')).data.total,1);
});

test('club reviews leave and promotion once, marks attendance, and never approves exam results',async()=>{
 const s=await setup();
 const leave=await s.club('/leaves/leave-0/actions/approve','POST');assert.equal(leave.status,200,leave.message);assert.equal(leave.data.reviewedMasterLevel,'CLUB');
 assert.equal((await s.ward('/leaves/leave-0/actions/reject','POST')).status,409);
 assert.equal((await s.club('/promotions/promotion-0/actions/approve','POST')).status,200);
 const lesson=s.db().schedules.find(c=>c.classId==='c-1');
 const state=await s.club('/attendance-workflow/sessions/'+lesson.id);assert.equal(state.status,200,state.message);
 const studentId=state.data.rows[0].studentId;
 assert.equal((await s.club('/attendance-workflow/sessions/'+lesson.id+'/present','POST',{studentIds:[studentId]})).status,200);
 assert.equal((await s.club('/attendance-workflow/sessions/'+lesson.id+'/close','POST',{confirm:true})).status,200);
 assert.equal((await s.club('/exam-results/result-0/actions/approve','POST',{outcome:'PASS'})).status,403);
 assert.equal((await s.club('/leaves/leave-2/actions/approve','POST')).status,404);
});

test('exports, forms and reports contain local training data and no finance or foreign staff',async()=>{
 const s=await setup(),lookups=(await s.club('/lookups?module=classes')).data;
 assert(lookups.students.length>0);assert(lookups.instructors.every(i=>i.clubId==='club-1'||s.db().classes.some(c=>c.clubId==='club-1'&&c.instructorId===i.id)));
 assert.equal(lookups.invoices.length,0);assert(lookups.classes.every(c=>c.tuition===undefined));
 const exported=(await s.club('/exports/system')).data;
 for(const id of ['students','instructors','classes','leaves','promotions'])assert(exported.sheets.some(t=>t.id===id));
 for(const id of ['users','invoices','tuition','transactions','discounts','permission-matrix'])assert(!exported.sheets.some(t=>t.id===id));
 assert(exported.sheets.find(t=>t.id==='classes').rows.every(c=>c.clubId==='club-1'&&c.tuition===undefined));
 const report=(await s.club('/report-charts/student-report')).data;assert.equal(report.recordCount,8);
 assert.equal((await s.club('/report-charts/student-report?classId=c-3')).data.recordCount,0);
});
