import {additionalAccounts,MOCK_PASSWORD} from './users.js';

// Upgrade existing local databases once, without resetting edited accounts or business data.
export function migrateTestAccounts(db) {
  if(db.additionalAccountsVersion)return;
  for(const sample of additionalAccounts) {
    const profile=sample.role==='INSTRUCTOR'?db.instructors.find(p=>p.id===sample.id):sample.role==='STUDENT'?db.students.find(p=>p.id===sample.studentId):null;
    if(['INSTRUCTOR','STUDENT'].includes(sample.role)&&(!profile||profile.status!=='ACTIVE'))continue;
    if(sample.role==='MASTER'&&(!db.wards.some(w=>w.id===sample.wardId&&w.provinceId===sample.provinceId)||sample.clubId&&!db.clubs.some(c=>c.id===sample.clubId&&c.wardId===sample.wardId)))continue;
    const candidate={...sample,...(profile?{fullName:profile.fullName,email:profile.email||sample.email}:{})};
    if(db.users.some(u=>u.id===candidate.id||u.email.toLowerCase()===candidate.email.toLowerCase()))continue;
    db.users.push({...candidate,password:MOCK_PASSWORD});
  }
  for(const sample of additionalAccounts.filter(a=>a.role==='MASTER')) {
    const account=db.users.find(u=>u.id===sample.id&&u.role==='MASTER');
    if(!account||db.masters.some(p=>p.userId===account.id||p.email.toLowerCase()===account.email.toLowerCase()))continue;
    db.masters.push({id:account.id,userId:account.id,fullName:account.fullName,email:account.email,masterLevel:account.masterLevel,provinceId:account.provinceId,wardId:account.wardId,clubId:account.clubId,phone:'',qualification:'Võ sư',status:account.status});
  }
  db.additionalAccountsVersion=1;
}
