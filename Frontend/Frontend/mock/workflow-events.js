import { randomUUID } from '../src/utils/uuid.js';
import { hierarchyAccess } from './hierarchy.js';
import { roleLabel } from '../src/utils/permissions.js';
import { workflows } from '../src/config/workflows.js';

const supported = [
  'leaves',
  'promotions',
  'exams',
  'online-payments',
  'payment-confirmations',
];
// Only explicit recipients receive system events. Scope is evaluated at event time.
export function notifyWorkflow({ db, user, moduleId, row, stage }) {
  if (!supported.includes(moduleId)) return;
  const submitted = stage === 'SUBMITTED';
  const targetModule =
    moduleId === 'online-payments' ? 'payment-confirmations' : moduleId;
  const recipients = db.users
    .filter((u) => {
      if (u.status !== 'ACTIVE' || u.id === user.id) return false;
      const access = hierarchyAccess(db, u);
      if (submitted)
        return (
          access.rights(targetModule).includes('A') &&
          access.allows(targetModule, row, true)
        );
      if (u.id === row.createdBy) return access.allows(targetModule, row);
      if (u.role === 'STUDENT')
        return (
          row.studentId === u.studentId ||
          (moduleId === 'exams' && access.allows('exams', row))
        );
      if (u.role === 'INSTRUCTOR')
        return (
          access.rights(targetModule).includes('V') &&
          access.allows(targetModule, row)
        );
      return (
        ['ADMIN', 'MASTER'].includes(u.role) &&
        access.rights(targetModule).includes('V') &&
        access.allows(targetModule, row)
      );
    })
    .map((u) => u.id);
  if (!recipients.length) return;
  const event = `${moduleId.toUpperCase().replaceAll('-', '_')}_${stage}`;
  // Resubmitting the same step never creates duplicate notifications.
  if (
    db.announcements.some(
      (a) => a.systemEvent === event && a.workflowRecordId === row.id,
    )
  )
    return;
  const student = db.students.find((s) => s.id === row.studentId);
  const cls = db.classes.find((c) => c.id === row.classId);
  const decision =
    {
      APPROVED: 'đã duyệt',
      REJECTED: 'đã từ chối',
      SUCCESS: 'đã xác nhận thanh toán',
    }[row.status] || 'đã xử lý';
  db.announcements.unshift({
    id: randomUUID(),
    title: `${workflows[moduleId].title}: ${submitted ? 'chờ xử lý' : decision}${student ? ' · ' + student.fullName : ''}`,
    body: `${cls?.name || row.title || 'Trung tâm'} · ${roleLabel(user)} ${user.fullName} ${submitted ? 'gửi yêu cầu' : decision}.${row.sessionDate ? ' Ngày nghỉ: ' + row.sessionDate + '.' : ''}`,
    status: 'PUBLISHED',
    audience: row.classId ? 'CLASS' : 'ALL',
    classId: row.classId,
    studentId: row.studentId,
    provinceId: user.provinceId || 'province-1',
    createdBy: user.id,
    createdAt: new Date().toISOString(),
    systemEvent: event,
    workflowModule: moduleId,
    workflowRecordId: row.id,
    recipientUserIds: [...new Set(recipients)],
  });
}
