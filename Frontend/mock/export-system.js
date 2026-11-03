import { modules } from '../src/routes/routeConfig.js';
const forbidden = /^(password|passwordHash|accessToken|refreshToken|mfaToken|secret|totpSecret|recoveryCodes|resetTokens|sessions)$/i;
export function sanitizeExport(value) {
  if (Array.isArray(value)) return value.map(sanitizeExport);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([key])=>!forbidden.test(key)).map(([key,v])=>[key,sanitizeExport(v)]));
  return value;
}
export function systemExport({db,user,scoped,lookups,access}) {
  const sheets=[];
  const allowed = m => {const p=access?access.rights(m.id):db.permissions[m.id]?.[user.role] || '';return p.includes('V') || (m.id==='online-payments'&&p.includes('P'));};
  for(const m of modules.filter(allowed)) {
    let rows;
    if(m.custom==='report') {
      if(m.reportKind==='students')rows=scoped('students',db.students);
      if(m.reportKind==='attendance')rows=scoped('students',db.students).map(s=>{const records=scoped('attendance',db.attendance).filter(a=>a.studentId===s.id),present=records.filter(a=>['PRESENT','LATE'].includes(a.status)).length;return {studentId:s.id,classId:s.classId,present,absent:records.filter(a=>a.status==='ABSENT').length,excused:records.filter(a=>a.status==='EXCUSED').length,total:records.length,rate:records.length?Math.round(present/records.length*100)+'%':'—'};});
      if(m.reportKind==='tuition')rows=scoped('invoices',db.invoices);
      if(m.reportKind==='promotions')rows=scoped('belt-history',db['belt-history']);
    }else rows=scoped(m.id,db[m.id==='discounts'?'tuitionRelief':m.id==='payment-confirmations'?'online-payments':m.id]||[]);
    sheets.push({id:m.id,title:m.title,columns:[...new Set(['id',...m.columns,...m.fields.map(f=>f.key)])].filter(k=>!forbidden.test(k)&&!(user.role==='MASTER'&&user.masterLevel==='CLUB'&&k==='tuition')),rows:sanitizeExport(rows||[])});
  }
  if(allowed(modules.find(m=>m.id==='roles'))) {
    sheets.push({id:'permission-matrix',title:'Ma trận phân quyền',rows:Object.entries(db.permissions).flatMap(([moduleId,roles])=>Object.entries(roles).map(([role,actions])=>({moduleId,role,actions}))),columns:['moduleId','role','actions']});
  }
  if(allowed(modules.find(m=>m.id==='attendance'))) {
    const classes=new Set(scoped('classes',db.classes).map(c=>c.id));
    const states=Object.values(db.attendanceSessions||{}).filter(s=>classes.has(s.classId));
    sheets.push({id:'attendance-sessions',title:'Buổi điểm danh',columns:['id','classId','sessionDate','status','closedAt','closedBy'],rows:states.map(({roster,...state})=>state)});
    sheets.push({id:'attendance-rosters',title:'Danh sách từng buổi',columns:['scheduleId','classId','sessionDate','studentId','fullName','studentCode','status'],rows:states.flatMap(s=>s.roster.filter(r=>user.role!=='STUDENT'||r.studentId===user.studentId).map(r=>({scheduleId:s.id,classId:s.classId,sessionDate:s.sessionDate,...r,status:db.attendance.find(a=>a.scheduleId===s.id&&a.studentId===r.studentId)?.status||'UNMARKED'})))});
  }
  const readers=user.role==='ADMIN'?Object.entries(db.readNotifications).filter(([userId])=>db.users.some(u=>u.id===userId&&(!access||access.allows('users',u)))):[[user.id,db.readNotifications[user.id]||[]]];
  const visibleNotifications=new Set(scoped('announcements',db.announcements).map(a=>a.id));
  sheets.push({id:'notification-reads',title:'Thông báo đã đọc',columns:['userId','announcementId'],rows:readers.flatMap(([userId,ids])=>ids.filter(id=>visibleNotifications.has(id)).map(announcementId=>({userId,announcementId})))});
  return {generatedAt:new Date().toISOString(),user:{id:user.id,fullName:user.fullName,role:user.role},mode:'mock',scope:user.role==='ADMIN'?'Toàn bộ dữ liệu nghiệp vụ hệ thống':'Toàn bộ dữ liệu trong phạm vi quyền truy cập',lookups:sanitizeExport(lookups()),sheets};
}
