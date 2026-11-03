import {CLUB_PERMISSIONS} from '../src/config/clubPermissions.js';
import {accounts,MOCK_PASSWORD} from './users.js';
// Organizational boundaries are enforced here, independently of editable role rights.
export const MASTER_LEVELS = { PROVINCE: 'Võ sư cấp tỉnh', WARD: 'Võ sư cấp phường', CLUB: 'Võ sư phụ trách câu lạc bộ' };
export const FINANCE = ['tuition','invoices','online-payments','transactions','payment-confirmations','discounts','tuition-report'];
const fail = message => { throw Object.assign(new Error(message), {status:403}); };
export function migrateHierarchy(db) {
  if(db.hierarchyVersion) return;
  db.provinces ||= [{id:'province-1',name:'Tỉnh Đồng Nai'}];
  db.wards ||= [{id:'ward-1',provinceId:'province-1',name:'Phường Trấn Biên',status:'ACTIVE'},{id:'ward-2',provinceId:'province-1',name:'Phường Long Bình',status:'ACTIVE'}];
  db.clubs ||= [1,2,3,4].map((n)=>({id:'club-'+n,wardId:n<3?'ward-1':'ward-2',name:['CLB Trung tâm','CLB Thanh niên','CLB Long Bình','CLB Nhà thi đấu'][n-1],address:'Võ đường '+n,status:'ACTIVE'}));
  for(const [i,c] of db.classes.entries()) c.clubId ||= 'club-'+([1,1,2,3,3,4][i%6]);
  for(const u of db.users) {u.provinceId ||= 'province-1';if(u.role==='MASTER')u.masterLevel ||= 'PROVINCE';}
  for(const account of accounts.filter(u=>u.role==='MASTER'&&u.masterLevel!=='PROVINCE'))if(!db.users.some(u=>u.id===account.id||u.email===account.email))db.users.push({...account,password:MOCK_PASSWORD});
  for(const key of ['masters','instructors','exams','ranks','announcements','settings','discounts'])for(const row of db[key]||[])row.provinceId ||= 'province-1';
  for(const u of db.users.filter(u=>u.role==='MASTER')) {
    const profile=db.masters.find(m=>m.email===u.email);
    if(profile)Object.assign(profile,{userId:u.id,provinceId:u.provinceId,masterLevel:u.masterLevel,wardId:u.wardId,clubId:u.clubId});
    else db.masters.push({id:u.id,userId:u.id,fullName:u.fullName,email:u.email,provinceId:u.provinceId,masterLevel:u.masterLevel,wardId:u.wardId,clubId:u.clubId,phone:'',qualification:'Võ sư',status:u.status});
  }
  db.permissions ||= {};
  db.permissions.wards={ADMIN:'VCED',MASTER:'VCED'};
  db.permissions.clubs={ADMIN:'VCED',MASTER:'VCED'};
  db.hierarchyVersion=1;
}
export function hierarchyAccess(db,user) {
  const level=user.masterLevel||'PROVINCE',provinceId=user.provinceId||'province-1';
  const provinceWards=db.wards.filter(w=>w.provinceId===provinceId).map(w=>w.id);
  const provinceClubs=db.clubs.filter(c=>provinceWards.includes(c.wardId)).map(c=>c.id);
  const classInProvince=c=>provinceClubs.includes(c.clubId);
  const inOwnUnit=c=>level==='CLUB'?c.clubId===user.clubId:level==='WARD'?db.clubs.some(b=>b.id===c.clubId&&b.wardId===user.wardId):classInProvince(c);
  const classCache=new Map(),studentCache=new Map();
  const computeClasses=(write=false,finance=false)=>db.classes.filter(c=>user.role==='INSTRUCTOR'?c.instructorId===user.id:user.role==='STUDENT'?db.students.some(s=>s.id===user.studentId&&s.classId===c.id):user.role==='ADMIN'?classInProvince(c):user.role==='MASTER'?classInProvince(c)&&inOwnUnit(c):false).map(c=>c.id);
  const classIds=(write=false,finance=false)=>{const key=write+':'+finance;if(!classCache.has(key))classCache.set(key,computeClasses(write,finance));return classCache.get(key);};
  const computeStudents=(write=false,finance=false)=>user.role==='STUDENT'?[user.studentId]:db.students.filter(s=>classIds(write,finance).includes(s.classId)).map(s=>s.id);
  const studentIds=(write=false,finance=false)=>{const key=write+':'+finance;if(!studentCache.has(key))studentCache.set(key,computeStudents(write,finance));return studentCache.get(key);};
  function rights(id) {
    let value=db.permissions[id]?.[user.role]||'';
    if(['users','roles','settings'].includes(id)&&user.role!=='ADMIN')return '';
    if(user.role==='MASTER'&&level==='CLUB')return [...value].filter(a=>(CLUB_PERMISSIONS[id]||'').includes(a)).join('');
    if(user.role==='MASTER'&&level==='WARD'&&id==='wards')return value.replace(/[^V]/g,'');
    // The provincial catalog and personnel appointments remain provincial responsibilities.
    if(user.role==='MASTER'&&level==='WARD'&&['ranks','masters','exams'].includes(id))return value.replace(/[^V]/g,'');
    return value;
  }
  const canRead=id=>rights(id).includes('V')||(id==='online-payments'&&rights(id).includes('P'));
  function allows(id,row,write=false) {
    if(!row||row.provinceId&&row.provinceId!==provinceId)return false;
    const finance=FINANCE.includes(id),classes=classIds(write,finance),students=studentIds(write,finance);
    if(['INSTRUCTOR','STUDENT'].includes(user.role)&&id==='clubs')return db.classes.some(c=>classes.includes(c.id)&&c.clubId===row.id);
    if(['INSTRUCTOR','STUDENT'].includes(user.role)&&id==='wards')return db.classes.some(c=>classes.includes(c.id)&&db.clubs.some(b=>b.id===c.clubId&&b.wardId===row.id));
    if(id==='wards')return provinceWards.includes(row.id)&&(user.role!=='MASTER'||level==='PROVINCE'||row.id===user.wardId)&&(!write||user.role==='ADMIN'||level==='PROVINCE');
    if(id==='clubs')return provinceClubs.includes(row.id)&&(user.role!=='MASTER'||level==='PROVINCE'||level==='CLUB'&&row.id===user.clubId||level==='WARD'&&row.wardId===user.wardId);
    if(id==='classes')return classes.includes(row.id);
    if(id==='students')return students.includes(row.id);
    if(user.role==='STUDENT'&&row.studentId)return row.studentId===user.studentId;
    if(row.classId)return classes.includes(row.classId)&&(user.role!=='STUDENT'||!row.studentId||row.studentId===user.studentId);
    if(row.studentId)return students.includes(row.studentId);
    if(['users','masters'].includes(id))return (row.provinceId||'province-1')===provinceId&&(user.role!=='MASTER'||level==='PROVINCE'||row.wardId===user.wardId);
    if(id==='instructors'){
      if(user.role==='ADMIN'||user.role==='MASTER'&&level==='PROVINCE')return (row.provinceId||'province-1')===provinceId;
      const owns=db.clubs.some(c=>c.id===row.clubId&&provinceClubs.includes(c.id)&&(level==='CLUB'?c.id===user.clubId:c.wardId===user.wardId));
      return user.role==='MASTER'?(write?owns:owns||db.classes.some(c=>classes.includes(c.id)&&c.instructorId===row.id)):row.id===user.id||db.classes.some(c=>classes.includes(c.id)&&c.instructorId===row.id);
    }
    if(id==='audit')return (user.role==='ADMIN'||user.role==='MASTER'&&level==='PROVINCE')&&db.users.some(u=>u.id===row.userId&&(u.provinceId||'province-1')===provinceId)||row.userId===user.id;
    if(user.role==='MASTER'&&['WARD','CLUB'].includes(level)&&write)return false;
    return true;
  }
  function assertWrite(id,row) {if(!allows(id,row,true))fail('Dữ liệu nằm ngoài đơn vị bạn được phân công quản lý.');}
  function validate(id,clean,previous) {
    if(['masters','instructors','exams','ranks','announcements','settings'].includes(id))clean.provinceId=provinceId;
    if(id==='users') {
      if(user.role!=='ADMIN')fail('Chỉ Admin cấp tỉnh được cấp tài khoản và phân quyền.');
      clean.provinceId=provinceId;
      if(clean.role==='MASTER') {
        if(!MASTER_LEVELS[clean.masterLevel])throw Object.assign(new Error('Chọn cấp quản lý của Võ sư.'),{status:400});
        if(clean.masterLevel!=='PROVINCE'&&!provinceWards.includes(clean.wardId))fail('Phường phụ trách không thuộc tỉnh.');
        if(clean.masterLevel==='CLUB'&&!db.clubs.some(c=>c.id===clean.clubId&&c.wardId===clean.wardId))fail('Câu lạc bộ không thuộc phường đã chọn.');
      } else clean.masterLevel='';
      if(clean.masterLevel!=='CLUB')clean.clubId='';
      if(!['WARD','CLUB'].includes(clean.masterLevel))clean.wardId='';
    }
    if(id==='wards')clean.provinceId=provinceId;
    if(id==='clubs'&&(!provinceWards.includes(clean.wardId)||user.role==='MASTER'&&level==='WARD'&&clean.wardId!==user.wardId))fail('Chỉ quản lý câu lạc bộ trong phường phụ trách.');
    if(id==='classes'&&!classIds(true).includes(previous?.id)&&previous)assertWrite(id,previous);
    if(id==='classes'&&!db.clubs.some(c=>c.id===clean.clubId&&provinceClubs.includes(c.id)&&(user.role!=='MASTER'||level==='PROVINCE'||(level==='CLUB'?c.id===user.clubId:c.wardId===user.wardId))))fail('Câu lạc bộ ngoài phạm vi quản lý.');
    if(id==='instructors') {
      const club=db.clubs.find(c=>c.id===clean.clubId&&provinceClubs.includes(c.id));
      if(!club||user.role==='MASTER'&&level!=='PROVINCE'&&(level==='CLUB'?club.id!==user.clubId:club.wardId!==user.wardId))fail('CLB quản lý HLV nằm ngoài phạm vi phụ trách.');
      if(previous&&previous.clubId!==clean.clubId&&db.classes.some(c=>c.instructorId===previous.id))throw Object.assign(new Error('HLV đang có lớp phân công; không thể chuyển CLB quản lý hồ sơ.'),{status:409});
    }
    if(id==='classes'&&clean.instructorId) {
      const instructor=db.instructors.find(i=>i.id===clean.instructorId);
      if(!instructor||instructor.status!=='ACTIVE')throw Object.assign(new Error('Chọn HLV đang hoạt động.'),{status:400});
      if(!allows('instructors',instructor))fail('HLV không thuộc phạm vi được phân công.');
    }
    if(clean.classId&&!classIds(true).includes(clean.classId))fail('Lớp ngoài phạm vi quản lý.');
    if(clean.studentId&&!studentIds(true).includes(clean.studentId))fail('Học viên ngoài phạm vi quản lý.');
    if(clean.invoiceId){const invoice=db.invoices.find(i=>i.id===clean.invoiceId);if(!allows('invoices',invoice,true))fail('Hóa đơn ngoài phạm vi quản lý.');}
    if(user.role==='MASTER'&&['WARD','CLUB'].includes(level)&&['announcements','exams'].includes(id)&&!clean.classId)fail('Vui lòng chọn lớp trong phường phụ trách.');
  }
  return {level,provinceId,provinceWards,provinceClubs,classIds,studentIds,rights,canRead,allows,assertWrite,validate};
}
