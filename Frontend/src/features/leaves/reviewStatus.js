import {ROLES,MASTER_LEVELS} from '../../utils/permissions.js';
export function leaveReviewStatus(row) {
  const processed=['APPROVED','REJECTED','SUCCESS'].includes(row?.status);
  const role=row?.reviewedRole;
  const roleLabel=role==='ADMIN'?'Admin':role==='MASTER'&&row.reviewedMasterLevel?MASTER_LEVELS[row.reviewedMasterLevel]:ROLES[role]||role||'';
  const action=row?.status==='SUCCESS'?'đã xác nhận':row?.status==='APPROVED'?'đã duyệt':'đã từ chối';
  return {processed,label:processed?(roleLabel?`${roleLabel} ${action}`:row.status==='APPROVED'?'Đã duyệt':'Đã từ chối'):'Chờ duyệt',name:row?.reviewedName||'',at:row?.reviewedAt||''};
}
