import test from 'node:test';
import assert from 'node:assert/strict';
import {createMockFetch,DB_KEY} from '../mock/api.js';
import {priceInvoice} from '../mock/invoice-pricing.js';

async function setup(){
  const map=new Map(),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};
  const fetch=createMockFetch({storage});
  const raw=async(path,method='GET',body,token)=>{const r=await fetch('/backend'+path,{method,headers:token?{Authorization:'Bearer '+token}:{},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,...await r.json()};};
  const client={};
  for(const [role,email] of Object.entries({admin:'admin@vovinam.test',master:'vosu@vovinam.test',coach:'hlv@vovinam.test',student:'vosinh@vovinam.test',other:'vosinh3@example.test'})){
    const r=await raw('/auth/login','POST',{email,password:'Vovinam123!'});
    assert.equal(r.status,200);client[role]=(p,m,b)=>raw(p,m,b,r.data.tokens.accessToken);
  }
  return {...client,db:()=>JSON.parse(storage.getItem(DB_KEY))};
}

test('unknown actions, malformed URLs and GET/PATCH action attempts cannot mutate state',async()=>{
 const s=await setup(),before=s.db();
 for(const [client,path] of [[s.coach,'/announcements/notice-0'],[s.student,'/online-payments/payment-pending'],[s.admin,'/leaves/leave-0'],[s.admin,'/tuition-relief/relief-0']]){
  assert.equal((await client(path+'/actions/approve','GET')).status,405);
  assert.equal((await client(path+'/actions/process','PATCH')).status,405);
  assert.equal((await client(path+'/actions/invalid','POST')).status,400);
  assert.equal((await client(path+'/actions/approve/extra','POST')).status,404);
 }
 assert.deepEqual(s.db().leaves,before.leaves);
 assert.deepEqual(s.db()['online-payments'],before['online-payments']);
 assert.equal((await s.admin('/notifications/read-all')).status,405);
});

test('leave submission alerts scoped reviewers; first decision notifies learner and locks subsequent decisions',async()=>{
 const s=await setup();
 const result=await s.student('/leaves','POST',{studentId:'s-1',classId:'c-1',sessionDate:'2030-08-03',reason:'Kiểm tra tại trường'});
 assert.equal(result.status,200,result.message);const row=result.data;
 const submitted=s.db().announcements.find(a=>a.systemEvent==='LEAVES_SUBMITTED'&&a.workflowRecordId===row.id);
 for(const id of ['u-admin','u-master','u-coach'])assert(submitted.recipientUserIds.includes(id));
 assert(!submitted.recipientUserIds.includes('u-coach-2'));
 assert.equal((await s.coach(`/leaves/${row.id}/actions/approve`,'POST')).status,200);
 assert.equal((await s.master(`/leaves/${row.id}/actions/reject`,'POST')).status,409);
 const db=s.db(),events=db.announcements.filter(a=>a.systemEvent==='LEAVES_REVIEWED'&&a.workflowRecordId===row.id);
 assert.equal(events.length,1);assert(events[0].recipientUserIds.includes('u-student'));
 assert((await s.student('/notifications')).data.some(a=>a.id===events[0].id));
 assert(!(await s.other('/notifications')).data.some(a=>a.id===events[0].id));
 assert.equal(db.leaves.find(r=>r.id===row.id).reviewedRole,'INSTRUCTOR');
});

test('invalid or duplicate leave requests are rejected without creating events',async()=>{
 const s=await setup(),body={studentId:'s-1',classId:'c-1',sessionDate:'2030-02-30',reason:'Nghỉ'};
 assert.equal((await s.student('/leaves','POST',body)).status,400);
 body.sessionDate='2030-08-04';const first=await s.student('/leaves','POST',body);assert.equal(first.status,200);
 assert.equal((await s.student('/leaves','POST',body)).status,409);
 assert.equal(s.db().announcements.filter(a=>a.workflowRecordId===first.data.id).length,1);
});

test('bulk proposal review notifies each affected learner once and learners only read personal proposals',async()=>{
 const s=await setup();
 assert.equal((await s.admin('/promotions/bulk-review','POST',{classId:'c-1',ids:['promotion-0'],action:'approve'})).status,200);
 assert.equal((await s.master('/promotions/bulk-review','POST',{classId:'c-1',ids:['promotion-0'],action:'reject'})).status,409);
 assert.equal(s.db().announcements.filter(a=>a.systemEvent==='PROMOTIONS_REVIEWED'&&a.workflowRecordId==='promotion-0').length,1);
 const list=await s.student('/promotions');assert.equal(list.status,200);assert(list.data.items.every(r=>r.studentId==='s-1'));
 assert.equal((await s.student('/promotions/promotion-0/actions/approve','POST')).status,403);
});

test('payment submission and confirmation notify reviewers and learner, store reviewer, settle once',async()=>{
 const s=await setup(),draft=await s.student('/online-payments','POST',{invoiceId:'inv-0-0'});
 assert.equal(draft.status,200);const id=draft.data.id;
 assert.equal((await s.student(`/online-payments/${id}/actions/process`,'POST')).status,200);
 assert(s.db().announcements.some(a=>a.workflowRecordId===id&&a.systemEvent==='ONLINE_PAYMENTS_SUBMITTED'));
 const approved=await s.coach(`/payment-confirmations/${id}/actions/approve`,'POST');assert.equal(approved.status,200,approved.message);
 assert.equal(approved.data.reviewedRole,'INSTRUCTOR');assert(approved.data.reviewedAt);
 assert.equal((await s.admin(`/payment-confirmations/${id}/actions/approve`,'POST')).status,409);
 assert.equal(s.db().transactions.filter(t=>t.invoiceId==='inv-0-0').length,1);
 assert(s.db().announcements.some(a=>a.workflowRecordId===id&&a.systemEvent==='PAYMENT_CONFIRMATIONS_REVIEWED'&&a.recipientUserIds.includes('u-student')));
});

test('approved relief prices new invoices, never mutates issued invoices, and rejects duplicate billing',async()=>{
 const s=await setup(),issued=s.db().invoices.find(r=>r.id==='inv-0-0');
 const proposal=await s.coach('/tuition-relief','POST',{studentId:'s-1',classId:'c-1',reliefType:'EXEMPTION',percent:100,period:'2030-08',reason:'Hỗ trợ học viên'});
 assert.equal(proposal.status,200);
 assert.equal((await s.master(`/tuition-relief/${proposal.data.id}/actions/approve`,'POST')).status,200);
 assert.deepEqual(s.db().invoices.find(r=>r.id==='inv-0-0'),issued);
 const body={studentId:'s-1',classId:'c-1',period:'2030-08',amount:400000,dueDate:'2030-08-15',discountId:''};
 const invoice=await s.admin('/invoices','POST',body);assert.equal(invoice.status,200,invoice.message);
 assert.equal(invoice.data.baseAmount,400000);assert.equal(invoice.data.amount,0);assert.equal(invoice.data.status,'PAID');assert.equal(invoice.data.reliefId,proposal.data.id);
 assert.equal((await s.admin('/invoices','POST',body)).status,409);
 assert.equal((await s.student('/online-payments','POST',{invoiceId:invoice.data.id})).status,400);
 const db={tuitionRelief:[{id:'r',studentId:'s',classId:'c',period:'2030-01',status:'APPROVED',percent:30}],discounts:[{id:'d',status:'ACTIVE',expiresAt:'2099-01-01',percent:20}]};
 assert.equal(priceInvoice(db,{studentId:'s',classId:'c',period:'2030-01',amount:400000,discountId:'d'}).amount,280000);
 db.tuitionRelief[0].status='PENDING';assert.equal(priceInvoice(db,{studentId:'s',classId:'c',period:'2030-01',amount:400000,discountId:'d'}).amount,320000);
});

test('issued invoices cannot change underneath a pending payment and completed invoices cannot be deleted',async()=>{
 const s=await setup();
 const draft=await s.student('/online-payments','POST',{invoiceId:'inv-0-0'});assert.equal(draft.status,200);
 const invoice=s.db().invoices.find(i=>i.id==='inv-0-0');
 assert.equal((await s.admin('/invoices/'+invoice.id,'PATCH',{...invoice,amount:999})).status,409);
 assert.equal((await s.admin('/invoices/'+invoice.id,'DELETE')).status,409);
 assert.equal((await s.student(`/online-payments/${draft.data.id}/actions/process`,'POST')).status,200);
 assert.equal((await s.admin(`/payment-confirmations/${draft.data.id}/actions/approve`,'POST')).status,200);
 assert.equal((await s.admin('/invoices/'+invoice.id,'DELETE')).status,409);
});

test('enrollment transfer pauses previous active enrollment, announcement CLASS requires classId, and instructor user edit syncs profile',async()=>{
 const s=await setup();
 const transfer=await s.admin('/enrollments','POST',{studentId:'s-1',classId:'c-2',joinedAt:'2030-01-01',status:'ACTIVE'});
 assert.equal(transfer.status,200,transfer.message);
 const activeEnrollments=s.db().enrollments.filter(e=>e.studentId==='s-1'&&e.status==='ACTIVE');
 assert.equal(activeEnrollments.length,1);
 assert.equal(activeEnrollments[0].classId,'c-2');
 assert.equal(s.db().students.find(st=>st.id==='s-1').classId,'c-2');
 assert.equal((await s.admin('/announcements','POST',{title:'Thiếu lớp',body:'Nội dung',audience:'CLASS',classId:''})).status,400);
 const allNotice=await s.admin('/announcements','POST',{title:'Toàn trung tâm',body:'Nội dung',audience:'ALL',classId:'c-1'});
 assert.equal(allNotice.status,200);
 assert.equal(allNotice.data.classId,'');
 const coachUpdate=await s.admin('/users/u-coach','PATCH',{fullName:'Trần Minh Huấn Cập Nhật',email:'hlv@vovinam.test',role:'INSTRUCTOR',status:'ACTIVE'});
 assert.equal(coachUpdate.status,200);
 assert.equal(s.db().instructors.find(i=>i.id==='u-coach').fullName,'Trần Minh Huấn Cập Nhật');
});
