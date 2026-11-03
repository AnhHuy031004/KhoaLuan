import test from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import {createMockFetch,DB_KEY} from '../mock/api.js';
import {buildWorkbook,workbookRows} from '../src/utils/excelExport.js';
const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};};
async function setup(role='ADMIN',storage=memory()) {
 const fetch=createMockFetch({storage}),emails={ADMIN:'admin',MASTER:'vosu',INSTRUCTOR:'hlv',STUDENT:'vosinh'};
 const raw=async(path,method='GET',body,token)=>{const r=await fetch('/backend'+path,{method,headers:token?{Authorization:'Bearer '+token}:{},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,...await r.json()};};
 const login=await raw('/auth/login','POST',{email:emails[role]+'@vovinam.test',password:'Vovinam123!'});assert.equal(login.status,200);
 return {storage,call:(p,m,b)=>raw(p,m,b,login.data.tokens.accessToken),db:()=>JSON.parse(storage.getItem(DB_KEY)),write:db=>storage.setItem(DB_KEY,JSON.stringify(db))};
}
const route=id=>'/attendance-workflow/sessions/'+id;
test('session roster follows date/enrollments; present confirmation is idempotent and late additions remain possible until close',async()=>{
 const s=await setup(),dates=await s.call('/attendance-workflow/dates');assert(dates.data.dates.length>=3);
 const sessions=await s.call('/attendance-workflow/sessions?date='+dates.data.dates[0]);assert.equal(sessions.data.items.length,6);
 const lesson=sessions.data.items.find(x=>x.classId==='c-1'),initial=await s.call(route(lesson.id));assert(initial.data.rows.length>1);
 const ids=initial.data.rows.map(r=>r.studentId);
 assert(initial.data.rows.every(r=>s.db().enrollments.some(e=>e.classId===lesson.classId&&e.studentId===r.studentId)));
 const mark=await s.call(route(lesson.id)+'/present','POST',{studentIds:[ids[0],ids[0]]});assert.equal(mark.status,200);assert.equal(mark.data.counts.present,1);
 await s.call(route(lesson.id)+'/present','POST',{studentIds:[ids[0]]});assert.equal(s.db().attendance.filter(r=>r.scheduleId===lesson.id&&r.studentId===ids[0]).length,1);
 const invalid=await s.call(route(lesson.id)+'/present','POST',{studentIds:[ids[1],'not-in-session']});assert.equal(invalid.status,400);assert.equal((await s.call(route(lesson.id))).data.counts.present,1);
 const late=await s.call(route(lesson.id)+'/present','POST',{studentIds:[ids[1]]});assert.equal(late.data.counts.present,2);
 const close=await s.call(route(lesson.id)+'/close','POST',{confirm:true});assert.equal(close.data.status,'CLOSED');assert.equal(close.data.counts.present+close.data.counts.absent+close.data.counts.excused,ids.length);
 assert.equal((await s.call(route(lesson.id)+'/present','POST',{studentIds:[ids[2]||ids[0]]})).status,409);
 assert.equal((await s.call(route(lesson.id)+'/close','POST',{confirm:true})).status,409);
 const stored=s.db().attendance.find(r=>r.scheduleId===lesson.id);assert.equal((await s.call('/attendance/'+stored.id,'DELETE')).status,409);
 assert.equal((await s.call('/schedules/'+lesson.id,'DELETE')).status,409);
 const afterReload=await setup('ADMIN',s.storage);assert.equal((await afterReload.call(route(lesson.id))).data.status,'CLOSED');
 const other=sessions.data.items.find(x=>x.id!==lesson.id);assert.equal((await s.call(route(other.id))).data.status,'OPEN');
});
test('instructor can only access assigned sessions, student cannot use staff endpoints, permission removal is enforced by mock service',async()=>{
 const s=await setup('INSTRUCTOR'),dates=await s.call('/attendance-workflow/dates'),sessions=await s.call('/attendance-workflow/sessions?date='+dates.data.dates[0]);assert.equal(sessions.data.items.length,2);
 assert.equal((await s.call(route('schedule-2-0'))).status,404);
 const student=await setup('STUDENT',s.storage);assert.equal((await student.call('/attendance-workflow/dates')).status,403);assert.equal((await student.call(route('schedule-0-0')+'/close','POST',{confirm:true})).status,403);
 const db=s.db();db.permissions.attendance.INSTRUCTOR='V';s.write(db);assert.equal((await s.call(route(sessions.data.items[0].id)+'/present','POST',{studentIds:['s-1']})).status,403);
});
test('explicit session roster and two same-day sessions are isolated; closing preserves approved leave and snapshots membership',async()=>{
 const s=await setup(),db=s.db(),lesson=db.schedules[0];
 db.schedules.push({...lesson,id:'second-session',startTime:'20:00',endTime:'21:00',studentIds:['s-1','s-7']});
 db.leaves.push({id:'approved-leave',studentId:'s-7',classId:lesson.classId,sessionDate:lesson.sessionDate,status:'APPROVED'});s.write(db);
 const second=await s.call(route('second-session'));assert.deepEqual(second.data.rows.map(r=>r.studentId),['s-1','s-7']);
 await s.call(route('second-session')+'/present','POST',{studentIds:['s-1']});
 assert.equal((await s.call(route(lesson.id))).data.counts.present,0);
 const changed=s.db();changed.enrollments=changed.enrollments.filter(e=>e.studentId!=='s-7');s.write(changed);
 const close=await s.call(route('second-session')+'/close','POST',{confirm:true});assert.equal(close.data.rows.find(r=>r.studentId==='s-7').status,'EXCUSED');assert.equal(close.data.rows.length,2);
});
test('system export includes all business modules beyond 5000 rows, has no credentials, and respects role scope',async()=>{
 const s=await setup(),db=s.db();for(let i=0;i<6000;i++)db.students.push({...db.students[0],id:'bulk-'+i,studentCode:'B'+i});s.write(db);
 const out=await s.call('/exports/system?search=does-not-exist&page=99&limit=1');assert.equal(out.status,200);assert.equal(out.data.sheets.find(s=>s.id==='students').rows.length,6024);
 assert(out.data.sheets.some(s=>s.id==='permission-matrix'));assert(out.data.sheets.some(s=>s.id==='attendance-sessions'));
 assert(!JSON.stringify(out.data).includes('Vovinam123!'));assert(!out.data.sheets.some(s=>s.id==='sessions'));
 for(const role of ['INSTRUCTOR','STUDENT']){const account=await setup(role),result=(await account.call('/exports/system')).data;assert(!result.sheets.some(s=>s.id==='users'||s.id==='permission-matrix'));if(role==='STUDENT'){assert.equal(result.sheets.find(s=>s.id==='students').rows.length,1);assert(result.sheets.find(s=>s.id==='attendance').rows.every(r=>r.studentId==='s-1'));}else{assert(result.sheets.find(s=>s.id==='classes').rows.every(r=>r.instructorId==='u-coach'));}}
});
test('XLSX is a readable workbook, preserves numeric/string types and long text, and stores formula-looking text as text',async()=>{
 const s=await setup(),snapshot=(await s.call('/exports/system')).data;
 snapshot.sheets.push({id:'roundtrip',title:'Round trip',columns:['phone','amount','note','password'],rows:[{phone:'0900123456',amount:125000,note:'=SUM(A1:A2)',password:'must-not-export'},{phone:'001',amount:0,note:'a'.repeat(40000)}]});
 const wb=buildWorkbook(snapshot),buffer=XLSX.write(wb,{type:'buffer',bookType:'xlsx'}),read=XLSX.read(buffer,{type:'buffer'});
 assert.equal(read.SheetNames.length,snapshot.sheets.length+2);assert(read.Sheets['Tổng quan']);
 const sheet=read.Sheets['Round trip'],rows=XLSX.utils.sheet_to_json(sheet);assert.equal(rows[0]['Điện thoại [phone]'],'0900123456');assert.equal(rows[0]['Số tiền [amount]'],125000);assert.equal(rows[0]['Ghi chú [note]'],'=SUM(A1:A2)');
 assert(!Object.keys(rows[0]).some(k=>/password/i.test(k)));assert.equal(rows[1]['Ghi chú [note]']+rows[1]['Ghi chú [note] · phần 2'],'a'.repeat(40000));assert(Object.values(sheet).filter(v=>v&&typeof v==='object'&&'t'in v).every(v=>!v.f));
});
