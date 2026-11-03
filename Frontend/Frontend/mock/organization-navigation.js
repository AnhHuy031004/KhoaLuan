import {FINANCE} from './hierarchy.js';
import {ORGANIZATION_MODULES} from '../src/features/organization/navigation.js';
const fail=message=>{throw Object.assign(new Error(message),{status:403});};
export function organizationNavigation({db,user,access,moduleId='classes',modules}) {
  if(FINANCE.includes(moduleId)&&!access.canRead(moduleId))fail('Bạn không có quyền xem chức năng tài chính này.');
  const finance=FINANCE.includes(moduleId);
  const clubs=db.clubs.filter(c=>access.allows('clubs',c));
  const wards=db.wards.filter(w=>access.provinceWards.includes(w.id)&&(user.role==='ADMIN'||access.level==='PROVINCE'||w.id===user.wardId));
  const classIds=access.classIds(false,finance),classes=db.classes.filter(c=>classIds.includes(c.id));
  const count=clubIds=>{
    const ids=classes.filter(c=>clubIds.includes(c.clubId)).map(c=>c.id);
    return {classCount:ids.length,studentCount:db.students.filter(s=>ids.includes(s.classId)&&s.status==='ACTIVE').length};
  };
  return {
    province:db.provinces.find(p=>p.id===access.provinceId),
    wards:wards.map(w=>({...w,clubCount:clubs.filter(c=>c.wardId===w.id).length,...count(clubs.filter(c=>c.wardId===w.id).map(c=>c.id))})),
    clubs:clubs.map(c=>({...c,...count([c.id]),readOnly:false})),
    functions:modules.filter(m=>ORGANIZATION_MODULES.includes(m.id)&&access.canRead(m.id)).map(m=>({id:m.id,title:m.navTitle||m.title,group:m.group,icon:m.icon})),
  };
}
export function selectOrganization({db,user,access,query,moduleId}) {
  if(!query.clubId&&!query.wardId)return access;
  const club=query.clubId?db.clubs.find(c=>c.id===query.clubId):null;
  const wardId=query.wardId||club?.wardId;
  if(query.clubId&&(!club||!access.provinceClubs.includes(club.id)||!access.allows('clubs',club)))fail('Câu lạc bộ không thuộc phạm vi truy cập.');
  if(!access.provinceWards.includes(wardId)||club&&club.wardId!==wardId)fail('Phường và câu lạc bộ không khớp phạm vi truy cập.');
  if(user.role==='MASTER'&&access.level!=='PROVINCE'&&wardId!==user.wardId)fail('Phường không thuộc đơn vị phụ trách.');
  const matchClass=c=>(!query.clubId||c.clubId===query.clubId)&&db.clubs.some(b=>b.id===c.clubId&&b.wardId===wardId);
  const classCache=new Map(),studentCache=new Map();
  const computeClasses=(write=false,financial=false)=>access.classIds(write,financial).filter(id=>db.classes.some(c=>c.id===id&&matchClass(c)));
  const classIds=(write=false,financial=false)=>{const key=write+':'+financial;if(!classCache.has(key))classCache.set(key,computeClasses(write,financial));return classCache.get(key);};
  const computeStudents=(write=false,financial=false)=>access.studentIds(write,financial).filter(id=>db.students.some(s=>s.id===id&&classIds(write,financial).includes(s.classId)));
  const studentIds=(write=false,financial=false)=>{const key=write+':'+financial;if(!studentCache.has(key))studentCache.set(key,computeStudents(write,financial));return studentCache.get(key);};
  function allows(id,row,write=false) {
    if(!access.allows(id,row,write))return false;
    if(id==='wards')return row.id===wardId;
    if(id==='clubs')return row.wardId===wardId&&(!query.clubId||row.id===query.clubId);
    if(id==='classes')return classIds(write).includes(row.id);
    if(id==='students')return studentIds(write).includes(row.id);
    if(id==='instructors'){
      const owned=db.clubs.some(c=>c.id===row.clubId&&c.wardId===wardId&&(!query.clubId||c.id===query.clubId));
      return write?owned:owned||db.classes.some(c=>classIds().includes(c.id)&&c.instructorId===row.id);
    }
    const ids=classIds(write,FINANCE.includes(id));
    if(row.classId)return ids.includes(row.classId);
    if(row.studentId)return studentIds(write,FINANCE.includes(id)).includes(row.studentId);
    return true;
  }
  return {...access,classIds,studentIds,allows,
    assertWrite(id,row){access.assertWrite(id,row);if(!allows(id,row,true))fail('Dữ liệu không thuộc câu lạc bộ đang chọn.');},
    validate(id,clean,previous){
      access.validate(id,clean,previous);
      if(id==='instructors'&&!db.clubs.some(c=>c.id===clean.clubId&&c.wardId===wardId&&(!query.clubId||c.id===query.clubId)))fail('Hồ sơ HLV phải thuộc đơn vị đang chọn.');
      if(id==='classes'&&(!db.clubs.some(b=>b.id===clean.clubId&&b.wardId===wardId)||query.clubId&&clean.clubId!==query.clubId))fail('Lớp phải thuộc câu lạc bộ đang chọn.');
      if(clean.classId&&!classIds(true).includes(clean.classId))fail('Lớp không thuộc câu lạc bộ đang chọn.');
      if(clean.studentId&&!studentIds(true).includes(clean.studentId))fail('Học viên không thuộc câu lạc bộ đang chọn.');
      if(clean.invoiceId&&!allows('invoices',db.invoices.find(i=>i.id===clean.invoiceId),true))fail('Hóa đơn không thuộc câu lạc bộ đang chọn.');
    }
  };
}
