import test from 'node:test';
import assert from 'node:assert/strict';
import {createMockFetch,DB_KEY} from '../mock/api.js';
async function setup(){
 const map=new Map(),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)},fetch=createMockFetch({storage});
 const raw=async(path,method='GET',body,token)=>{const res=await fetch('/backend'+path,{method,headers:token?{Authorization:'Bearer '+token}:{},...(body?{body:JSON.stringify(body)}:{})});return {status:res.status,...await res.json()};};
 const login=async(email)=>{const result=await raw('/auth/login','POST',{email:email+'@vovinam.test',password:'Vovinam123!'});assert.equal(result.status,200,result.message);return (p,m,b)=>raw(p,m,b,result.data.tokens.accessToken);};
 return {admin:await login('admin'),province:await login('vosu'),ward:await login('vosuphuong'),club:await login('vosuclb'),login,db:()=>JSON.parse(storage.getItem(DB_KEY)),write:db=>storage.setItem(DB_KEY,JSON.stringify(db))};
}
const newClass=(clubId)=>({name:'Lớp thử nghiệm',clubId,instructorId:'u-coach',location:'Võ đường',capacity:30,tuition:400000,status:'ACTIVE'});
test('hierarchy has multiple clubs per ward; provincial master manages wards but cannot grant accounts',async()=>{
 const s=await setup();assert.equal((await s.province('/wards')).data.total,2);assert.equal((await s.province('/clubs')).data.total,4);
 const ward=await s.province('/wards','POST',{name:'Phường mới',provinceId:'province-1',status:'ACTIVE'});assert.equal(ward.status,200,ward.message);
 assert.equal((await s.province('/clubs','POST',{name:'CLB mới',wardId:ward.data.id,address:'Sân tập mới',status:'ACTIVE'})).status,200);
 for(const request of ['/users','/roles','/settings'])assert.equal((await s.province(request)).status,403);
 assert.equal((await s.province('/users','POST',{})).status,403);
});
test('ward master only reads own ward, its clubs, classes and finances',async()=>{
 const s=await setup();assert.deepEqual((await s.ward('/wards')).data.items.map(w=>w.id),['ward-1']);
 assert.deepEqual((await s.ward('/clubs')).data.items.map(c=>c.id).sort(),['club-1','club-2']);
 assert.deepEqual((await s.ward('/classes')).data.items.map(c=>c.id).sort(),['c-1','c-2','c-3']);
 const invoices=(await s.ward('/invoices?limit=5000')).data;const ownInvoices=s.db().invoices.filter(r=>['c-1','c-2','c-3'].includes(r.classId));assert.equal(invoices.total,ownInvoices.length);
 assert(invoices.items.every(r=>['c-1','c-2','c-3'].includes(r.classId)&&!r.__readOnly));
 const report=(await s.ward('/report-charts/tuition-report')).data;assert.equal(report.classes.length,3);assert.equal(report.recordCount,ownInvoices.length);
 assert.equal((await s.ward('/wards','POST',{name:'Không được',provinceId:'province-1',status:'ACTIVE'})).status,403);
 assert.equal((await s.ward('/classes','POST',newClass('club-3'))).status,403);
 assert.equal((await s.ward('/classes','POST',newClass('club-2'))).status,200);
 assert.equal((await s.ward('/clubs/club-3','PATCH',{name:'Đổi trái phép',wardId:'ward-1',address:'Sân',status:'ACTIVE'})).status,404);
});
test('club master manages local teaching and staff, while finance and provincial administration remain blocked',async()=>{
 const s=await setup(),list=(await s.club('/classes')).data;
 assert.deepEqual(list.items.map(c=>c.id),['c-1','c-2']);assert(list.items.every(c=>c.tuition===undefined&&c.roster.length>0));
 for(const path of ['/wards','/users','/roles','/invoices','/tuition-relief','/report-charts/tuition-report'])assert.equal((await s.club(path)).status,403,path);
 for(const path of ['/students','/instructors','/dashboard','/attendance-workflow/dates'])assert.equal((await s.club(path)).status,200,path);
 assert.equal((await s.club('/classes/c-1','PATCH',newClass('club-1'))).status,200);
 const lookups=(await s.club('/lookups?module=classes')).data;
 assert.equal(lookups.invoices.length,0);assert.equal(lookups.students.length,8);assert.equal(lookups.clubs.length,1);assert.equal(lookups.wards.length,1);assert(lookups.classes.every(c=>!('tuition'in c)));
 const exported=(await s.club('/exports/system')).data;assert(exported.sheets.some(s=>s.id==='instructors'));assert(exported.sheets.find(s=>s.id==='classes').rows.every(c=>!('tuition'in c)));
 const db=s.db();for(const p of Object.values(db.permissions))p.MASTER='VCEDAP';s.write(db);
 assert.equal((await s.club('/invoices')).status,403);assert.equal((await s.club('/classes','POST',newClass('club-2'))).status,403);
});
test('admin validates master assignments and immediately revokes sessions when scope changes',async()=>{
 const s=await setup(),body={fullName:'Võ sư thử nghiệm',email:'newmaster@vovinam.test',password:'Vovinam123!',role:'MASTER',masterLevel:'CLUB',wardId:'ward-1',clubId:'club-3',status:'ACTIVE'};
 assert.equal((await s.admin('/users','POST',body)).status,403);
 const added=await s.admin('/users','POST',{...body,clubId:'club-2'});assert.equal(added.status,200,added.message);
 const current=await s.login('newmaster');assert.equal((await current('/classes')).data.total,1);
 assert.equal((await s.admin('/users/'+added.data.id,'PATCH',{...body,masterLevel:'WARD',clubId:'',password:''})).status,200);
 assert.equal((await current('/classes')).status,401);
 const updated=await s.login('newmaster');assert.equal((await updated('/classes')).data.total,3);
 assert.equal(s.db().masters.find(m=>m.userId===added.data.id).masterLevel,'WARD');
});
test('ward cannot review outside proposals, even with a guessed id or bulk operation',async()=>{
 const s=await setup(),db=s.db();const own=db.promotions.find(r=>r.classId==='c-1'&&r.status==='PENDING'),foreign=db.promotions.find(r=>r.classId==='c-4');
 if(foreign){assert.equal((await s.ward('/promotions/'+foreign.id+'/actions/approve','POST')).status,404);assert.equal((await s.ward('/promotions/bulk-review','POST',{classId:'c-4',ids:[foreign.id],action:'approve'})).status,403);}
 assert(own);assert.equal((await s.ward('/promotions/'+own.id+'/actions/approve','POST')).status,200);
 const foreignRelief={...db.tuitionRelief[0],id:'foreign-relief',classId:'c-4',studentId:'s-4'};db.tuitionRelief.push(foreignRelief);s.write(db);
 assert.equal((await s.ward('/tuition-relief/foreign-relief/actions/approve','POST')).status,404);
});
test('attendance and notices use assigned units, including recipient filtering for tuition proposals',async()=>{
 const s=await setup(),db=s.db(),lesson=db.schedules.find(r=>r.classId==='c-4');
 assert.equal((await s.ward('/attendance-workflow/sessions/'+lesson.id)).status,404);
 const coach=await s.login('hlv');const result=await coach('/tuition-relief','POST',{classId:'c-1',studentId:'s-1',reliefType:'REDUCTION',percent:20,period:'2035-01',reason:'Hỗ trợ học tập'});assert.equal(result.status,200,result.message);
 const recipients=s.db().announcements.find(n=>n.reliefId===result.data.id).recipientUserIds;
 assert(recipients.includes('u-admin'));assert(recipients.includes('u-master'));assert(recipients.includes('u-master-ward'));assert(!recipients.includes('u-master-club'));
 const db2=s.db();db2.users.find(u=>u.id==='u-master-ward').wardId='ward-2';s.write(db2);
 assert.equal((await s.ward('/notifications')).data.filter(n=>n.reliefId===result.data.id).length,0);
});
test('province boundaries apply to reports, exports and forged entity links',async()=>{
 const s=await setup(),db=s.db();db.provinces.push({id:'p-other',name:'Tỉnh khác'});db.wards.push({id:'w-other',provinceId:'p-other',name:'Phường khác',status:'ACTIVE'});db.clubs.push({id:'b-other',wardId:'w-other',name:'CLB khác',status:'ACTIVE'});db.classes.push({...newClass('b-other'),id:'c-other'});db.students.push({...db.students[0],id:'s-other',classId:'c-other'});s.write(db);
 assert.equal((await s.admin('/wards')).data.total,2);assert.equal((await s.province('/classes')).data.total,6);assert.equal((await s.province('/report-charts/student-report')).data.cards[0].value,24);
 assert.equal((await s.admin('/classes','POST',newClass('b-other'))).status,403);
 const exp=(await s.admin('/exports/system')).data;assert(!exp.sheets.find(t=>t.id==='classes').rows.some(c=>c.id==='c-other'));
});
test('legacy migration preserves business records and custom rights, and runs once',async()=>{
 const s=await setup(),db=s.db();delete db.hierarchyVersion;delete db.wards;delete db.clubs;for(const u of db.users)delete u.masterLevel;db.students[0].fullName='Dữ liệu giữ nguyên';db.permissions.leaves.MASTER='V';s.write(db);
 await s.admin('/auth/me');const migrated=s.db();assert.equal(migrated.students[0].fullName,'Dữ liệu giữ nguyên');assert.equal(migrated.permissions.leaves.MASTER,'V');assert.equal(migrated.users.find(u=>u.id==='u-master').masterLevel,'PROVINCE');
 const count=migrated.users.length;await s.admin('/lookups');assert.equal(s.db().users.length,count);
});
