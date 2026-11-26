import { DB_KEY } from '../src/config/demoStorage.js';
import { validDemoDatabase } from '../src/utils/demoDatabase.js';
import { modules } from '../src/routes/routeConfig.js';
import { createSeed } from './seed.js';
import { MOCK_PASSWORD } from './users.js';
import { seedTuitionRelief } from './tuition-relief.js';
import { migrateHierarchy } from './hierarchy.js';
import { migrateTestAccounts } from './test-accounts.js';
import { migrateInstructorScope } from './instructor-scope.js';
const fail = (status, message) => {
  throw Object.assign(new Error(message), { status });
};
export const INITIAL_PERMISSIONS = Object.fromEntries(
  modules.map((m) => [m.id, { ...m.permissions }]),
);
const clonePermissions = () =>
  Object.fromEntries(
    Object.entries(INITIAL_PERMISSIONS).map(([id, roles]) => [
      id,
      { ...roles },
    ]),
  );
export function createDatabase(storage) {
  let cachedRaw, cachedDb;
  const read = () => {
    const original = storage?.getItem(DB_KEY);
    if (cachedDb && original === cachedRaw) return structuredClone(cachedDb);
    try {
      const db = JSON.parse(original || 'null');
      if (db?.version === 3) {
        if (!validDemoDatabase(db))
          fail(
            503,
            'Cấu trúc dữ liệu không hợp lệ. Hãy khôi phục bản sao lưu.',
          );
        db.permissions ||= clonePermissions();
        if (!db.centerRankCatalogVersion) {
          const standard = ['Lam đai', 'Lam đai I', 'Lam đai II', 'Hoàng đai'];
          const matches = standard.every((name, i) =>
            db.ranks.some((r) => r.id === `r-${i + 1}` && r.name === name),
          );
          const obsolete = db.ranks.find((r) => r.id === 'r-5');
          if (
            matches &&
            (!obsolete ||
              (obsolete.name === 'Hồng đai' &&
                obsolete.level === 5 &&
                obsolete.description === 'Võ đạo và kỹ thuật chuyên sâu'))
          ) {
            db.ranks = db.ranks.filter((r) => r.id !== 'r-5');
            for (const rows of Object.values(db))
              if (Array.isArray(rows))
                for (const row of rows)
                  if (row?.rankId === 'r-5') row.rankId = 'r-4';
          }
          db.centerRankCatalogVersion = 1;
        }
        if (!db.tuitionReliefHierarchyVersion) {
          db.permissions.discounts ||= {};
          db.permissions.discounts.ADMIN = [
            ...new Set((db.permissions.discounts.ADMIN || 'VA') + 'VCA'),
          ].join('');
          db.permissions.discounts.MASTER = [
            ...new Set((db.permissions.discounts.MASTER || 'VA') + 'VCA'),
          ].join('');
          db.tuitionReliefHierarchyVersion = 1;
        }
        if (!db.tuitionReliefVersion) {
          db.tuitionRelief = seedTuitionRelief(db);
          db.permissions.discounts = {
            ADMIN: 'VCA',
            MASTER: 'VCA',
            INSTRUCTOR: 'VC',
            STUDENT: 'V',
          };
          db.tuitionReliefVersion = 1;
        }
        // One-time upgrade of this workflow; never reset user records or other module rights.
        if (!db.leaveWorkflowVersion) {
          db.permissions.leaves ||= {};
          db.permissions.leaves.ADMIN = [
            ...new Set((db.permissions.leaves.ADMIN || 'VCED') + 'VA'),
          ].join('');
          db.permissions.leaves.STUDENT = [
            ...new Set((db.permissions.leaves.STUDENT || 'C') + 'V'),
          ].join('');
          db.leaveWorkflowVersion = 1;
        }
        if (!db.adminResultReviewVersion) {
          db.permissions['exam-results'] ||= {};
          for (const role of Object.keys(db.permissions['exam-results']))
            if (role !== 'ADMIN')
              db.permissions['exam-results'][role] = db.permissions[
                'exam-results'
              ][role].replace(/A/g, '');
          db.adminResultReviewVersion = 1;
        }
        if (!db.examWorkflowVersion) {
          for (const id of ['exams', 'exam-results']) {
            db.permissions[id] ||= {};
            db.permissions[id].ADMIN = [
              ...new Set((db.permissions[id].ADMIN || 'VCED') + 'A'),
            ].join('');
          }
          for (const row of db['exam-results'] || [])
            row.classId ||= db.students.find(
              (s) => s.id === row.studentId,
            )?.classId;
          db.examWorkflowVersion = 1;
        }
        if (!db.promotionWorkflowVersion) {
          db.permissions.promotions ||= {};
          db.permissions.promotions.ADMIN = [
            ...new Set((db.permissions.promotions.ADMIN || 'VCED') + 'A'),
          ].join('');
          for (const row of db.promotions || [])
            row.classId ||= db.students.find(
              (s) => s.id === row.studentId,
            )?.classId;
          db.promotionWorkflowVersion = 1;
        }
        for (const row of db.leaves || [])
          if (row.reviewedBy && !row.reviewedRole) {
            const reviewer = db.users.find((u) => u.id === row.reviewedBy);
            if (reviewer) {
              row.reviewedRole = reviewer.role;
              row.reviewedName = reviewer.fullName;
            }
          }
        if (!db.workflowAccessVersion) {
          db.permissions.promotions ||= {};
          if (!db.permissions.promotions.STUDENT)
            db.permissions.promotions.STUDENT = 'V';
          db.workflowAccessVersion = 1;
    db.mockPasswordVersion = MOCK_PASSWORD;
        }
        for (const enrollment of db.enrollments || []) {
          if (enrollment.status === 'PAUSED' && !enrollment.leftAt) {
            const next = db.enrollments
              .filter(
                (e) =>
                  e.studentId === enrollment.studentId &&
                  e.joinedAt > enrollment.joinedAt,
              )
              .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt))[0];
            if (next) enrollment.leftAt = next.joinedAt;
          }
        }
        if (db.mockPasswordVersion !== MOCK_PASSWORD) {
          for (const u of db.users || []) {
            if (u.password === 'Vovinam123!') u.password = MOCK_PASSWORD;
          }
          db.mockPasswordVersion = MOCK_PASSWORD;
        }
        migrateHierarchy(db);
        migrateTestAccounts(db);
        migrateInstructorScope(db);
        save(db);
        return db;
      }
      if (original)
        fail(
          503,
          'Phiên bản dữ liệu chưa được hỗ trợ. Dữ liệu gốc được giữ nguyên; hãy dùng bản sao lưu hoặc liên hệ quản trị viên.',
        );
    } catch (error) {
      if (original)
        fail(
          503,
          'Không đọc được dữ liệu cục bộ. Dữ liệu gốc được giữ nguyên, không tạo lại dữ liệu mẫu. Hãy khôi phục bản sao lưu trong trình duyệt hoặc liên hệ quản trị viên.',
        );
      throw error;
    }
    const db = createSeed();
    db.tuitionRelief = seedTuitionRelief(db);
    db.tuitionReliefVersion = 1;
    db.centerRankCatalogVersion = 1;
    db.leaveWorkflowVersion = 1;
    db.promotionWorkflowVersion = 1;
    db.examWorkflowVersion = 1;
    db.adminResultReviewVersion = 1;
    db.workflowAccessVersion = 1;
    db.permissions = clonePermissions();
    migrateHierarchy(db);
    migrateTestAccounts(db);
    migrateInstructorScope(db);
    save(db);
    return db;
  };
  const save = (db) => {
    const value = JSON.stringify(db);
    if (storage?.getItem(DB_KEY) !== value) storage?.setItem(DB_KEY, value);
    cachedRaw = value;
    cachedDb = structuredClone(db);
  };
  return { read, save };
}
