import test from 'node:test';
import assert from 'node:assert/strict';
import {createMockFetch,DB_KEY} from '../mock/api.js';
import {leaveReviewStatus} from '../src/features/leaves/reviewStatus.js';
const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};};
async function system(storage=memory()){
 const fetch=createMockFetch({storage});
 const raw=async(path,method='GET',body,token)=>{const r=await fetch('/backend'+path,{method,headers:token?{Authorization:'Bearer '+token}:{},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,...await r.json()};};
 const clients={};for(const [role,email] of [['ADMIN','admin'],['MASTER','vosu'],['INSTRUCTOR','hlv'],['STUDENT','vosinh']]){const login=await raw('/auth/login','POST',{email:email+'@vovinam.test',password:'Vovinam123!'});assert.equal(login.status,200);clients[role]=(p,m,b)=>raw(p,m,b,login.data.tokens.accessToken);}
 return {clients,storage,db:()=>JSON.parse(storage.getItem(DB_KEY)),write:db=>storage.setItem(DB_KEY,JSON.stringify(db))};
}
const payload={studentId:'s-1',classId:'c-1',sessionDate:'2030-01-01',reason:'Bận lịch học'};
test('each reviewer role can be first approver; later approvals/rejections/edits/deletes cannot overwrite the winner',async()=>{
 for(const role of ['ADMIN','MASTER','INSTRUCTOR']){
  const s=await system(),created=await s.clients.STUDENT('/leaves','POST',{...payload,status:'APPROVED',reviewedBy:'spoof',reviewedRole:'ADMIN'}),row=created.data;assert.equal(row.status,'PENDING');assert.equal(row.reviewedBy,undefined);
  const approved=await s.clients[role]('/leaves/'+row.id+'/actions/approve','POST');assert.equal(approved.status,200);assert.equal(approved.data.reviewedRole,role);assert(approved.data.reviewedName);assert(approved.data.reviewedAt);
  for(const other of ['ADMIN','MASTER','INSTRUCTOR'])for(const action of ['approve','reject'])assert.equal((await s.clients[other]('/leaves/'+row.id+'/actions/'+action,'POST')).status,409);
  assert.equal((await s.clients.ADMIN('/leaves/'+row.id,'PATCH',payload)).status,409);assert.equal((await s.clients.ADMIN('/leaves/'+row.id,'DELETE')).status,409);
  const current=(await s.clients.STUDENT('/leaves/'+row.id)).data;assert.equal(current.reviewedBy,approved.data.reviewedBy);assert.equal(current.reviewedName,approved.data.reviewedName);assert.equal(current.reviewedAt,approved.data.reviewedAt);assert(leaveReviewStatus(current).label.endsWith('đã duyệt'));
 }
});
test('three concurrent review requests yield one winner and preserve their name/role snapshot in XLSX source',async()=>{
 const s=await system(),row=(await s.clients.STUDENT('/leaves','POST',payload)).data;
 const result=await Promise.all(['ADMIN','MASTER','INSTRUCTOR'].map(r=>s.clients[r]('/leaves/'+row.id+'/actions/approve','POST')));assert.equal(result.filter(r=>r.status===200).length,1);assert.equal(result.filter(r=>r.status===409).length,2);
 const winner=result.find(r=>r.status===200).data,db=s.db();const account=db.users.find(u=>u.id===winner.reviewedBy);account.fullName='Đổi tên sau duyệt';account.role='MASTER';s.write(db);
 const current=(await s.clients.STUDENT('/leaves/'+row.id)).data;assert.equal(current.reviewedName,winner.reviewedName);assert.equal(current.reviewedRole,winner.reviewedRole);
 const exported=(await s.clients.STUDENT('/exports/system')).data.sheets.find(s=>s.id==='leaves').rows.find(r=>r.id===row.id);assert.equal(exported.reviewedName,winner.reviewedName);assert.equal(exported.reviewedAt,winner.reviewedAt);
 assert.equal(db.audit.filter(a=>a.action==='Phê duyệt'&&a.moduleName==='Đơn xin nghỉ').length,1);
});
test('student sees only own requests; instructor scope follows requested class, not later class transfers',async()=>{
 const s=await system();assert.equal((await s.clients.STUDENT('/leaves/leave-1')).status,404);assert.equal((await s.clients.STUDENT('/leaves/leave-0/actions/approve','POST')).status,403);assert.equal((await s.clients.INSTRUCTOR('/leaves/leave-2/actions/approve','POST')).status,404);
 assert.equal((await s.clients.STUDENT('/leaves','POST',{...payload,classId:'c-3'})).status,403);
 const db=s.db();db.students[0].classId='c-3';s.write(db);assert.equal((await s.clients.INSTRUCTOR('/leaves/leave-0/actions/approve','POST')).status,200);const list=await s.clients.STUDENT('/leaves');assert(list.data.items.every(r=>r.studentId==='s-1'));
});
test('rejection also records reviewer and locks further processing',async()=>{
 const s=await system(),result=await s.clients.MASTER('/leaves/leave-0/actions/reject','POST');assert.equal(result.data.status,'REJECTED');assert.equal(leaveReviewStatus(result.data).label,'Võ sư cấp tỉnh đã từ chối');assert.equal((await s.clients.ADMIN('/leaves/leave-0/actions/approve','POST')).status,409);
});
test('old mock DB gains admin approval/student history once, keeps data, and does not invent missing historical reviewers',async()=>{
 const s=await system(),db=s.db();delete db.leaveWorkflowVersion;db.permissions.leaves.ADMIN='VCED';db.permissions.leaves.STUDENT='C';db.leaves[0].status='APPROVED';delete db.leaves[0].reviewedBy;db.leaves[0].reason='Dữ liệu giữ lại';s.write(db);
 const again=await system(s.storage),current=again.db();assert(current.permissions.leaves.ADMIN.includes('A'));assert(current.permissions.leaves.STUDENT.includes('V'));assert.equal(current.leaves[0].reason,'Dữ liệu giữ lại');assert.equal(current.leaves[0].reviewedRole,undefined);assert.equal(leaveReviewStatus(current.leaves[0]).label,'Đã duyệt');
 current.permissions.leaves.ADMIN='V';again.write(current);assert.equal((await again.clients.ADMIN('/leaves/leave-1/actions/approve','POST')).status,403);assert.equal(again.db().permissions.leaves.ADMIN,'V');
});
