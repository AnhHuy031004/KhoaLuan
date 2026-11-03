import { randomUUID as uuid } from '../src/utils/uuid.js';
import { migrateInstructorScope } from './instructor-scope.js';
import { priceInvoice } from './invoice-pricing.js';
import { assertWorkflowAction, workflows } from '../src/config/workflows.js';
import { notifyWorkflow } from './workflow-events.js';
import { migrateTestAccounts } from './test-accounts.js';
import {
  organizationNavigation,
  selectOrganization,
} from './organization-navigation.js';
import { ORGANIZATION_MODULES } from '../src/features/organization/navigation.js';
import { migrateHierarchy, hierarchyAccess, FINANCE } from './hierarchy.js';
import { reportCharts } from './report-charts.js';
import { seedTuitionRelief, tuitionRelief } from './tuition-relief.js';
import { leaveReviewStatus } from '../src/features/leaves/reviewStatus.js';
import { systemExport } from './export-system.js';
import { attendanceWorkflow } from './attendance-workflow.js';
import { createSeed } from './seed.js';
import { modules } from '../src/routes/routeConfig.js';
import { can, canOpen } from '../src/utils/permissions.js';

export const DB_KEY = 'vovinam-mock-offline-v4';
const INITIAL_PERMISSIONS = Object.fromEntries(
  modules.map((m) => [m.id, { ...m.permissions }]),
);
const clonePermissions = () =>
  Object.fromEntries(
    Object.entries(INITIAL_PERMISSIONS).map(([id, roles]) => [
      id,
      { ...roles },
    ]),
  );
const fail = (status, message) => {
  throw Object.assign(new Error(message), { status });
};
const safe = (user) => {
  const { password, ...data } = user;
  return data;
};

export function createMockFetch({ storage } = {}) {
  const read = () => {
    try {
      const db = JSON.parse(storage?.getItem(DB_KEY) || 'null');
      if (db?.version === 3) {
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
        if (!db.tuitionReliefVersion) {
          db.tuitionRelief = seedTuitionRelief(db);
          db.permissions.discounts = {
            ADMIN: 'VA',
            MASTER: 'VA',
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
        }
        migrateHierarchy(db);
        migrateTestAccounts(db);
        migrateInstructorScope(db);
        return db;
      }
    } catch {}
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
    return db;
  };
  const save = (db) => {
    const value = JSON.stringify(db);
    if (storage?.getItem(DB_KEY) !== value) storage?.setItem(DB_KEY, value);
  };
  const execute = async (input, options = {}) => {
    if (options.signal?.aborted)
      throw new DOMException('Aborted', 'AbortError');
    let status = 200,
      data = null,
      message = 'Thành công';
    const db = read();
    try {
      const url = new URL(String(input), 'http://mock.local');
      let path = url.pathname.replace(/^\/(backend|api\/v1)/, '');
      const method = options.method || 'GET';
      const body = options.body ? JSON.parse(options.body) : {};
      const q = Object.fromEntries(url.searchParams);
      const token = new Headers(options.headers)
        .get('Authorization')
        ?.replace(/^Bearer /, '');
      const session = db.sessions[token],
        user = db.users.find(
          (u) => u.id === session?.userId && u.status === 'ACTIVE',
        );
      const issue = (u) => {
        const accessToken = 'mock-' + uuid(),
          refreshToken = 'mock-refresh-' + uuid();
        db.sessions[accessToken] = { userId: u.id, refreshToken };
        return { accessToken, refreshToken };
      };
      const revoke = (id) => {
        for (const [key, s] of Object.entries(db.sessions))
          if (s.userId === id) delete db.sessions[key];
      };
      const audit = (action, moduleName) =>
        db.audit.unshift({
          id: uuid(),
          action,
          moduleName,
          userId: user?.id,
          role: user?.role,
          userName: user?.fullName || 'Khách',
          createdAt: new Date().toISOString(),
        });
      const baseAccess = user ? hierarchyAccess(db, user) : null;
      const scopeModule = path.startsWith('/report-charts/')
        ? path.split('/')[2]
        : path.startsWith('/attendance-workflow/')
          ? 'attendance'
          : path.startsWith('/tuition-relief')
            ? 'discounts'
            : path === '/lookups'
              ? q.module
              : modules.find(
                  (m) => path === m.endpoint || path.startsWith(m.endpoint + '/'),
                )?.id;
      const access =
        user &&
        (path === '/lookups' || ORGANIZATION_MODULES.includes(scopeModule))
          ? selectOrganization({
              db,
              user,
              access: baseAccess,
              query: q,
              moduleId: scopeModule,
            })
          : baseAccess;
      const studentIds = () => access.studentIds();
      const classIds = () => access.classIds();
      const scoped = (id, rows) => {
        if (
          user.role === 'MASTER' &&
          access.level === 'CLUB' &&
          !access.canRead(id)
        )
          return [];
        rows = rows.filter((row) => access.allows(id, row));
        if (id === 'instructors')
          return rows.map((r) => ({
            ...r,
            assignedClassNames:
              db.classes
                .filter(
                  (c) =>
                    access.classIds().includes(c.id) && c.instructorId === r.id,
                )
                .map((c) => c.name)
                .join(', ') || 'Chưa phân công',
          }));
        if (FINANCE.includes(id)) return rows;
        if (id === 'classes' && user.role === 'MASTER' && access.level === 'CLUB')
          return rows.map(({ tuition, ...row }) => ({
            ...row,
            studentCount: db.students.filter(
              (s) => s.classId === row.id && s.status === 'ACTIVE',
            ).length,
            roster: db.students
              .filter((s) => s.classId === row.id && s.status === 'ACTIVE')
              .map((s) => ({ fullName: s.fullName, studentCode: s.studentCode })),
          }));
        const ids = studentIds(),
          classes = classIds();
        if (
          ['leaves', 'promotions', 'exam-results'].includes(id) &&
          user.role === 'INSTRUCTOR'
        )
          return rows.filter((r) => classes.includes(r.classId));
        if (id === 'attendance' && user.role === 'INSTRUCTOR')
          return rows.filter((r) => classes.includes(r.classId));
        if (id === 'students') return rows.filter((r) => ids.includes(r.id));
        if (
          [
            'enrollments',
            'attendance',
            'leaves',
            'evaluations',
            'promotions',
            'exam-results',
            'belt-history',
            'invoices',
            'online-payments',
            'transactions',
            'payment-confirmations',
          ].includes(id)
        )
          return rows.filter((r) => ids.includes(r.studentId));
        if (['classes', 'schedules', 'tuition'].includes(id))
          return rows.filter((r) =>
            classes.includes(id === 'classes' ? r.id : r.classId),
          );
        if (id === 'discounts')
          return (db.tuitionRelief || []).filter(
            (r) =>
              ['ADMIN', 'MASTER'].includes(user.role) ||
              (user.role === 'INSTRUCTOR' && classes.includes(r.classId)) ||
              (user.role === 'STUDENT' && r.studentId === user.studentId),
          );
        if (id === 'announcements')
          return rows.filter((r) =>
            r.systemEvent
              ? user.role === 'ADMIN' || r.recipientUserIds?.includes(user.id)
              : user.role === 'ADMIN' ||
                ((r.status === 'PUBLISHED' ||
                  r.createdBy === user.id ||
                  user.role === 'MASTER') &&
                  (r.audience === 'ALL' || classes.includes(r.classId))),
          );
        if (id === 'audit')
          return rows.filter((r) =>
            user.role === 'ADMIN' || user.role === 'MASTER'
              ? true
              : r.userId === user.id,
          );
        return rows;
      };
      const lookups = (moduleId = q.module) => ({
        students: db.students
          .filter((s) =>
            access.studentIds(false, FINANCE.includes(moduleId)).includes(s.id),
          )
          .map((s) => ({
            id: s.id,
            fullName: s.fullName,
            classId: s.classId,
            rankId: s.rankId,
            status: s.status,
          })),
        writableClassIds: access.classIds(true),
        writableStudentIds: access.studentIds(true),
        classes: db.classes
          .filter((c) =>
            access.classIds(false, FINANCE.includes(moduleId)).includes(c.id),
          )
          .map((c) =>
            user.role === 'MASTER' && access.level === 'CLUB'
              ? (({ tuition, ...rest }) => rest)(c)
              : c,
          ),
        wards: db.wards.filter((w) =>
          access.level === 'CLUB' && user.role === 'MASTER'
            ? w.id === user.wardId
            : access.allows('wards', w),
        ),
        clubs: db.clubs.filter((c) => access.allows('clubs', c)),
        provinces: db.provinces.filter((p) => p.id === access.provinceId),
        instructors: db.instructors.filter((i) => access.allows('instructors', i)),
        ranks: db.ranks
          .filter((r) => access.allows('ranks', r))
          .sort((a, b) => Number(a.level) - Number(b.level)),
        exams: db.exams
          .filter((e) => access.allows('exams', e))
          .filter((e) => e.status === 'APPROVED' || user.role !== 'STUDENT'),
        invoices: access.canRead('invoices')
          ? scoped('invoices', db.invoices)
          : [],
        roles:
          user.role === 'ADMIN'
            ? db.roles
            : db.roles.filter((r) => r.code === user.role),
        discounts: (access.canRead('invoices') ? db.discounts : []).filter(
          (d) =>
            access.allows('discounts', d) &&
            d.status === 'ACTIVE' &&
            d.expiresAt >= new Date().toISOString().slice(0, 10),
        ),
      });
      function filtered(rows) {
        return rows.filter((r) => {
          if (q.status && r.status !== q.status) return false;
          if (
            q.classId &&
            (path.startsWith('/promotions') || path.startsWith('/exam-results')
              ? r.classId !== q.classId
              : r.classId !== q.classId &&
                !(
                  r.studentId &&
                  db.students.some(
                    (s) => s.id === r.studentId && s.classId === q.classId,
                  )
                ))
          )
            return false;
          const date =
            r.sessionDate ||
            r.period ||
            r.createdAt ||
            r.examDate ||
            r.awardedAt ||
            '';
          if (q.month && date && !String(date).startsWith(q.month))
            return false;
          if (q.year && date && !String(date).startsWith(q.year)) return false;
          if (q.from && String(date) < q.from) return false;
          if (q.to && String(date).slice(0, 10) > q.to) return false;
          if (q.search) {
            const enriched = {
              ...r,
              studentName: db.students.find((s) => s.id === r.studentId)
                ?.fullName,
              className: db.classes.find((c) => c.id === r.classId)?.name,
            };
            if (
              !JSON.stringify(enriched)
                .toLowerCase()
                .includes(q.search.toLowerCase())
            )
              return false;
          }
          return true;
        });
      }
      function summary() {
        const students = scoped('students', db.students),
          classes = scoped('classes', db.classes),
          invoices = scoped('invoices', db.invoices),
          attendance = scoped('attendance', db.attendance),
          transactions = scoped('transactions', db.transactions);
        const months = Array.from({ length: 6 }, (_, i) => {
          const d = new Date();
          d.setMonth(d.getMonth() - 5 + i, 1);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        });
        return {
          studentCount: students.length,
          activeCount: students.filter((s) => s.status === 'ACTIVE').length,
          classCount: classes.length,
          unpaid: invoices
            .filter((i) => i.status === 'UNPAID')
            .reduce((a, i) => a + i.amount, 0),
          unpaidCount: invoices.filter((i) => i.status === 'UNPAID').length,
          attendanceRate: attendance.length
            ? Math.round(
                (attendance.filter((a) =>
                  ['PRESENT', 'LATE'].includes(a.status),
                ).length /
                  attendance.length) *
                  100,
              )
            : 0,
          classes: classes.map((c) => ({
            ...c,
            studentCount: students.filter((s) => s.classId === c.id).length,
          })),
          upcoming: scoped('schedules', db.schedules)
            .filter(
              (s) =>
                s.sessionDate >= new Date().toISOString().slice(0, 10) &&
                s.status !== 'CANCELLED',
            )
            .sort((a, b) =>
              (a.sessionDate + a.startTime).localeCompare(
                b.sessionDate + b.startTime,
              ),
            )
            .slice(0, 4),
          announcements: scoped('announcements', db.announcements)
            .filter((a) => a.status === 'PUBLISHED')
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .slice(0, 4),
          activity: scoped('audit', db.audit).slice(0, 5),
          months: months.map((month) => {
            const rows = attendance.filter((a) =>
              a.sessionDate.startsWith(month),
            );
            return {
              month,
              revenue: transactions
                .filter(
                  (t) =>
                    t.status === 'SUCCESS' && t.createdAt.startsWith(month),
                )
                .reduce((a, t) => a + t.amount, 0),
              present: rows.filter((a) =>
                ['PRESENT', 'LATE'].includes(a.status),
              ).length,
              absent: rows.filter((a) =>
                ['ABSENT', 'EXCUSED'].includes(a.status),
              ).length,
            };
          }),
          ranks: db.ranks.map((rank) => ({
            ...rank,
            count: students.filter((s) => s.rankId === rank.id).length,
          })),
        };
      }
      if (path === '/auth/login') {
        const u = db.users.find(
          (u) =>
            u.email.toLowerCase() ===
              String(body.email || '')
                .trim()
                .toLowerCase() &&
            u.password === body.password &&
            u.status === 'ACTIVE',
        );
        if (!u) fail(401, 'Email hoặc mật khẩu không chính xác.');
        data = { user: safe(u), tokens: issue(u) };
      } else if (path === '/auth/refresh-token') {
        const found = Object.entries(db.sessions).find(
          ([, s]) => s.refreshToken === body.refreshToken,
        );
        if (!found) fail(401, 'Phiên đăng nhập đã hết hạn.');
        const u = db.users.find(
          (u) => u.id === found[1].userId && u.status === 'ACTIVE',
        );
        if (!u) fail(401, 'Tài khoản không còn hoạt động.');
        delete db.sessions[found[0]];
        data = issue(u);
      } else if (path === '/auth/forgot-password') {
        const u = db.users.find(
          (u) =>
            u.email.toLowerCase() === String(body.email).trim().toLowerCase(),
        );
        data = { message: 'Yêu cầu khôi phục đã được tiếp nhận.' };
        if (u) {
          const token = uuid();
          db.resetTokens[token] = {
            userId: u.id,
            expiresAt: Date.now() + 15 * 60 * 1000,
          };
          data.mockToken = token;
        }
      } else if (path === '/auth/reset-password') {
        const reset = db.resetTokens[body.token];
        if (!reset || reset.expiresAt < Date.now())
          fail(400, 'Mã khôi phục không hợp lệ hoặc đã hết hạn.');
        if (String(body.password).length < 8)
          fail(400, 'Mật khẩu cần tối thiểu 8 ký tự.');
        const u = db.users.find((u) => u.id === reset.userId);
        u.password = body.password;
        delete db.resetTokens[body.token];
        revoke(u.id);
        data = { success: true };
      } else {
        if (!user) fail(401, 'Vui lòng đăng nhập để tiếp tục.');
        if (path === '/auth/me') data = safe(user);
        else if (path === '/auth/logout') {
          delete db.sessions[token];
          data = { success: true };
        } else if (path === '/auth/profile' && method === 'PATCH') {
          user.fullName = String(body.fullName || user.fullName).trim();
          user.phone = String(body.phone || '');
          data = safe(user);
          audit('Cập nhật hồ sơ', 'Hồ sơ cá nhân');
        } else if (path === '/auth/change-password') {
          if (body.currentPassword !== user.password)
            fail(400, 'Mật khẩu hiện tại không đúng.');
          if (String(body.newPassword).length < 8)
            fail(400, 'Mật khẩu mới cần tối thiểu 8 ký tự.');
          user.password = body.newPassword;
          for (const [k, s] of Object.entries(db.sessions))
            if (s.userId === user.id && k !== token) delete db.sessions[k];
          data = { success: true };
          audit('Đổi mật khẩu', 'Bảo mật');
        } else if (path === '/permissions') {
          if (method === 'GET')
            data = {
              matrix:
                user.role === 'ADMIN'
                  ? db.permissions
                  : Object.fromEntries(
                      Object.entries(db.permissions).map(([id, roles]) => [
                        id,
                        { ...roles, [user.role]: access.rights(id) },
                      ]),
                    ),
              roles: db.roles,
            };
          else {
            if (user.role !== 'ADMIN')
              fail(403, 'Chỉ quản trị viên được thay đổi phân quyền.');
            const next = JSON.parse(JSON.stringify(db.permissions));
            for (const [moduleId, roles] of Object.entries(body.matrix || {})) {
              if (!modules.some((m) => m.id === moduleId))
                fail(400, 'Chức năng không hợp lệ.');
              for (const [role, value] of Object.entries(roles)) {
                if (
                  !db.roles.some((r) => r.code === role) ||
                  typeof value !== 'string' ||
                  /[^VCEDAP]/.test(value)
                )
                  fail(400, 'Quyền không hợp lệ.');
                if (
                  moduleId === 'discounts' &&
                  ((value.includes('C') && role !== 'INSTRUCTOR') ||
                    (value.includes('A') &&
                      !['ADMIN', 'MASTER'].includes(role)) ||
                    /[EDP]/.test(value))
                )
                  fail(
                    400,
                    'Miễn giảm học phí: chỉ HLV gửi đề xuất; Admin/Võ sư duyệt; không sửa hoặc xóa đơn đã gửi.',
                  );
                if (
                  moduleId === 'exam-results' &&
                  role !== 'ADMIN' &&
                  value.includes('A')
                )
                  fail(400, 'Chỉ Admin được duyệt kết quả thi.');
                next[moduleId][role] = [...new Set(value)].join('');
              }
            }
            if (!'VCE'.split('').every((k) => next.roles.ADMIN.includes(k)))
              fail(
                400,
                'Cần giữ quyền xem, tạo và sửa phân quyền của quản trị viên.',
              );
            db.permissions = next;
            data = { matrix: next, roles: db.roles };
            audit('Cập nhật ma trận quyền', 'Vai trò & phân quyền');
          }
        } else if (path === '/exports/system' && method === 'GET') {
          data = systemExport({
            db,
            user,
            scoped,
            lookups: () =>
              lookups(
                user.role === 'MASTER' && access.level === 'WARD'
                  ? 'invoices'
                  : undefined,
              ),
            access,
          });
          audit('Xuất toàn hệ thống XLSX', 'Xuất dữ liệu');
        } else if (path.startsWith('/report-charts/')) {
          const id = path.split('/')[2],
            config = modules.find((m) => m.id === id && m.custom === 'report');
          if (method !== 'GET') fail(405, 'Chỉ hỗ trợ xem báo cáo.');
          if (!config) fail(404, 'Không tìm thấy báo cáo.');
          if (!access.canRead(id)) fail(403, 'Bạn không có quyền xem báo cáo.');
          data = reportCharts({
            db,
            user,
            id,
            query: q,
            scoped: (kind, rows) =>
              kind === 'classes' && id === 'tuition-report'
                ? rows.filter((c) => access.classIds(false, true).includes(c.id))
                : scoped(kind, rows),
          });
        } else if (
          path === '/tuition-relief' ||
          path.startsWith('/tuition-relief/')
        ) {
          data = tuitionRelief({
            db,
            user,
            path,
            method,
            body,
            query: q,
            lookups,
            audit,
            access,
          });
        } else if (path.startsWith('/attendance-workflow/')) {
          data = attendanceWorkflow({
            db,
            user,
            method,
            path,
            query: q,
            body,
            classIds: access.classIds(method !== 'GET'),
            permissions: access.rights('attendance'),
            audit,
          });
        } else if (path === '/organization/navigation') {
          if (method !== 'GET' || !['ADMIN', 'MASTER'].includes(user.role))
            fail(403, 'Không có quyền xem cơ cấu tổ chức.');
          if (q.module && !ORGANIZATION_MODULES.includes(q.module))
            fail(400, 'Chức năng tổ chức không hợp lệ.');
          data = organizationNavigation({
            db,
            user,
            access: baseAccess,
            moduleId: q.module,
            modules,
          });
        } else if (path === '/organization') {
          if (!['ADMIN', 'MASTER'].includes(user.role))
            fail(403, 'Không có quyền xem cơ cấu tổ chức.');
          data = {
            province: db.provinces.find((p) => p.id === access.provinceId),
            wards: db.wards.filter((w) =>
              access.level === 'CLUB'
                ? w.id === user.wardId
                : access.allows('wards', w),
            ),
            clubs: db.clubs.filter((c) =>
              access.level === 'CLUB'
                ? c.id === user.clubId
                : access.allows('clubs', c),
            ),
            classCount: classIds().length,
          };
        } else if (path === '/lookups') data = lookups();
        else if (path === '/dashboard') {
          data = summary();
        } else if (path === '/notifications') {
          if (method !== 'GET') fail(405, 'Chỉ hỗ trợ xem thông báo.');
          data = scoped('announcements', db.announcements)
            .filter(
              (a) =>
                a.status === 'PUBLISHED' &&
                (!a.systemEvent || a.recipientUserIds?.includes(user.id)),
            )
            .map((a) => ({
              ...a,
              read: (db.readNotifications[user.id] || []).includes(a.id),
            }));
        } else if (path === '/notifications/read-all') {
          if (method !== 'POST') fail(405, 'Đánh dấu đã đọc phải dùng POST.');
          db.readNotifications[user.id] = scoped(
            'announcements',
            db.announcements,
          )
            .filter(
              (a) =>
                a.status === 'PUBLISHED' &&
                (!a.systemEvent || a.recipientUserIds?.includes(user.id)),
            )
            .map((a) => a.id);
          data = { success: true };
        } else {
          const baseConfig = modules.find(
            (m) => path === m.endpoint || path.startsWith(m.endpoint + '/'),
          );
          const config = baseConfig
            ? {
                ...baseConfig,
                permissions: {
                  ...(db.permissions[baseConfig.id] ||
                    INITIAL_PERMISSIONS[baseConfig.id] ||
                    baseConfig.permissions),
                  [user.role]: access.rights(baseConfig.id),
                },
              }
            : null;
          if (!config) fail(404, 'Không tìm thấy chức năng.');
          if (!canOpen(config, user.role))
            fail(403, 'Bạn không có quyền truy cập chức năng này.');
          const suffix = path
              .slice(config.endpoint.length)
              .split('/')
              .filter(Boolean),
            id = suffix[0],
            action = suffix[2];
          if (
            suffix.length > 1 &&
            !(suffix.length === 3 && suffix[1] === 'actions')
          )
            fail(404, 'Đường dẫn thao tác không hợp lệ.');
          if (suffix[1] === 'actions')
            assertWorkflowAction(config.id, action, null, user, method);
          const collection =
            config.id === 'payment-confirmations'
              ? 'online-payments'
              : config.id;
          let rows =
            config.custom === 'report'
              ? []
              : scoped(config.id, db[collection] || []);
          if (method !== 'GET' && config.custom !== 'report') {
            const visible = new Set(rows.map((r) => r.id));
            rows = (db[collection] || []).filter((r) => visible.has(r.id));
          }
          if (config.custom === 'report') {
            let source, columns;
            if (config.reportKind === 'students') {
              source = scoped('students', db.students).map((s) => ({
                ...s,
                rankId: s.rankId,
              }));
              columns = ['fullName', 'classId', 'rankId', 'status'];
            }
            if (config.reportKind === 'attendance') {
              source = scoped('students', db.students).map((s) => {
                const a = filtered(
                  db.attendance.filter((a) => a.studentId === s.id),
                );
                return {
                  studentId: s.id,
                  classId: s.classId,
                  rankId: s.rankId,
                  status: s.status,
                  present: a.filter((a) =>
                    ['PRESENT', 'LATE'].includes(a.status),
                  ).length,
                  absent: a.filter((a) => a.status === 'ABSENT').length,
                  total: a.length,
                  rate: a.length
                    ? Math.round(
                        (a.filter((a) => ['PRESENT', 'LATE'].includes(a.status))
                          .length /
                          a.length) *
                          100,
                      ) + '%'
                    : '—',
                };
              });
              columns = [
                'studentId',
                'classId',
                'present',
                'absent',
                'total',
                'rate',
              ];
            }
            if (config.reportKind === 'tuition') {
              source = scoped('invoices', db.invoices);
              columns = ['code', 'studentId', 'period', 'amount', 'status'];
            }
            if (config.reportKind === 'promotions') {
              source = scoped('belt-history', db['belt-history']);
              columns = ['studentId', 'rankId', 'awardedAt', 'note'];
            }
            rows = source;
            config._columns = columns;
          }
          if (config.id === 'promotions' && path === '/promotions/bulk-review') {
            if (method !== 'POST') fail(405, 'Thao tác không hợp lệ.');
            if (!can(config, user.role, 'A'))
              fail(403, 'Bạn không có quyền duyệt đề xuất.');
            if (
              !['approve', 'reject'].includes(body.action) ||
              !Array.isArray(body.ids) ||
              !body.ids.length ||
              body.ids.some((id) => typeof id !== 'string') ||
              !body.classId
            )
              fail(400, 'Chọn lớp, đề xuất và thao tác hợp lệ.');
            if (!access.classIds(true).includes(body.classId))
              fail(403, 'Lớp không thuộc phạm vi của bạn.');
            const selected = [...new Set(body.ids)].map((id) =>
              rows.find((r) => r.id === id && r.classId === body.classId),
            );
            if (selected.some((r) => !r || !access.allows(config.id, r, true)))
              fail(404, 'Đề xuất không thuộc lớp hoặc phạm vi của bạn.');
            if (selected.some((r) => r.status !== 'PENDING'))
              fail(
                409,
                'Có đề xuất đã được xử lý. Vui lòng tải lại danh sách và chọn lại.',
              );
            const reviewedAt = new Date().toISOString();
            for (const row of selected) {
              const transition = assertWorkflowAction(
                config.id,
                body.action,
                row,
                user,
                method,
              );
              Object.assign(row, {
                status: transition.to,
                reviewedBy: user.id,
                reviewedName: user.fullName,
                reviewedRole: user.role,
                ...(user.role === 'MASTER'
                  ? { reviewedMasterLevel: access.level }
                  : {}),
                reviewedAt,
              });
              notifyWorkflow({
                db,
                user,
                moduleId: config.id,
                row,
                stage: 'REVIEWED',
              });
            }
            audit(
              (body.action === 'approve' ? 'Duyệt nhanh' : 'Từ chối nhanh') +
                ' ' +
                selected.length +
                ' đề xuất',
              config.title,
            );
            data = { items: selected, count: selected.length };
          } else if (method === 'GET') {
            if (
              !can(config, user.role, 'V') &&
              !(config.id === 'online-payments' && can(config, user.role, 'P'))
            )
              fail(403, 'Vai trò này không được xem danh sách.');
            if (config.id === 'online-payments' && user.role === 'STUDENT')
              rows = rows.filter((r) =>
                ['DRAFT', 'PENDING'].includes(r.status),
              );
            if (config.id === 'leaves' && id) {
              const row = rows.find((r) => r.id === id);
              if (!row) fail(404, 'Không tìm thấy đơn trong phạm vi của bạn.');
              data = row;
            } else {
              const list = filtered(
                config.id === 'ranks'
                  ? [...rows].sort((a, b) => Number(a.level) - Number(b.level))
                  : rows,
              ).map((r) => ({
                ...(config.id === 'users' ? safe(r) : r),
                __readOnly: !access.allows(config.id, r, true),
              }));
              const page = Math.max(1, Number(q.page) || 1),
                limit = Math.min(5000, Math.max(1, Number(q.limit) || 10));
              data = {
                items: list.slice((page - 1) * limit, page * limit),
                total: list.length,
                page,
                limit,
                columns: config._columns,
                summary: {
                  count: list.length,
                  amount: list.reduce((a, r) => a + Number(r.amount || 0), 0),
                },
                lookups: lookups(),
              };
            }
          } else if (suffix[1] === 'actions') {
            const needed = ['approve', 'reject'].includes(action) ? 'A' : 'P';
            if (
              config.id === 'exam-results' &&
              needed === 'A' &&
              user.role !== 'ADMIN'
            )
              fail(403, 'Chỉ Admin được duyệt hoặc từ chối kết quả thi.');
            if (!can(config, user.role, needed))
              fail(403, 'Bạn không có quyền thực hiện thao tác này.');
            const row = rows.find((r) => r.id === id);
            if (!row)
              fail(404, 'Không tìm thấy dữ liệu trong phạm vi của bạn.');
            access.assertWrite(config.id, row);
            const transition = assertWorkflowAction(
              config.id,
              action,
              row,
              user,
              method,
            );
            if (row.systemEvent)
              fail(403, 'Thông báo kết quả tự động không được chỉnh sửa.');
            if (
              config.id === 'online-payments' ||
              (config.id === 'payment-confirmations' && action === 'approve')
            ) {
              const invoice = db.invoices.find((i) => i.id === row.invoiceId);
              if (
                !invoice ||
                invoice.status === 'PAID' ||
                invoice.studentId !== row.studentId ||
                Number(invoice.amount) !== Number(row.amount)
              )
                fail(
                  409,
                  'Hóa đơn đã thay đổi hoặc hoàn tất. Vui lòng kiểm tra lại yêu cầu thanh toán.',
                );
            }
            if (needed === 'A') {
              if (row.status !== 'PENDING')
                fail(
                  409,
                  config.id === 'leaves'
                    ? leaveReviewStatus(row).label +
                        (row.reviewedName ? ' · ' + row.reviewedName : '') +
                        '. Không thể duyệt lại.'
                    : 'Bản ghi này đã được xử lý.',
                );
              if (config.id === 'payment-confirmations') {
                if (action === 'reject') row.status = 'REJECTED';
                else {
                  const invoice = db.invoices.find(
                    (i) => i.id === row.invoiceId,
                  );
                  if (!invoice || invoice.status === 'PAID')
                    fail(409, 'Hóa đơn đã được thanh toán hoặc không tồn tại.');
                  row.status = 'SUCCESS';
                  invoice.status = 'PAID';
                  db.transactions.unshift({
                    ...row,
                    id: uuid(),
                    createdAt: new Date().toISOString(),
                  });
                }
              } else if (config.id === 'exam-results' && action === 'approve') {
                if (
                  !db.exams.some(
                    (e) => e.id === row.examId && e.status === 'APPROVED',
                  )
                )
                  fail(409, 'Kỳ thi chưa được duyệt; không thể chốt kết quả.');
                if (!['PASS', 'FAIL'].includes(body.outcome))
                  fail(400, 'Chọn kết quả Đạt hoặc Chưa đạt.');
                row.status = body.outcome;
                if (body.outcome === 'PASS') {
                  const student = db.students.find(
                      (s) => s.id === row.studentId,
                    ),
                    exam = db.exams.find((e) => e.id === row.examId);
                  if (student && exam) {
                    student.rankId = exam.rankId;
                    db['belt-history'].unshift({
                      id: uuid(),
                      studentId: student.id,
                      rankId: exam.rankId,
                      awardedAt: new Date().toISOString().slice(0, 10),
                      note: 'Hoàn thành ' + exam.title,
                    });
                  }
                }
              } else row.status = transition.to;
              row.reviewedBy = user.id;
              if (
                [
                  'leaves',
                  'promotions',
                  'exams',
                  'exam-results',
                  'payment-confirmations',
                ].includes(config.id)
              )
                Object.assign(row, {
                  reviewedRole: user.role,
                  ...(user.role === 'MASTER'
                    ? { reviewedMasterLevel: access.level }
                    : {}),
                  reviewedName: user.fullName,
                  reviewedAt: new Date().toISOString(),
                });
              if (config.id === 'exam-results') {
                const student = db.students.find(
                    (s) => s.id === row.studentId,
                  ),
                  exam = db.exams.find((e) => e.id === row.examId),
                  cls = db.classes.find((c) => c.id === row.classId);
                const resultLabel = {
                  PASS: 'Đạt',
                  FAIL: 'Chưa đạt',
                  REJECTED: 'Từ chối phê duyệt',
                }[row.status];
                const recipients = db.users
                  .filter(
                    (u) =>
                      u.status === 'ACTIVE' &&
                      u.role !== 'ADMIN' &&
                      ((u.role === 'MASTER' &&
                        hierarchyAccess(db, u).canRead('exam-results') &&
                        hierarchyAccess(db, u).allows('exam-results', row)) ||
                        (u.role === 'INSTRUCTOR' &&
                          cls?.instructorId === u.id) ||
                        (u.role === 'STUDENT' &&
                          u.studentId === row.studentId)),
                  )
                  .map((u) => u.id);
                db.announcements.unshift({
                  id: uuid(),
                  title: `Kết quả thi: ${student?.fullName || 'Võ sinh'} — ${resultLabel}`,
                  body: `${exam?.title || 'Kỳ thi'} · ${cls?.name || 'Lớp học'}. Kết quả: ${resultLabel}. Đã được Admin ${user.fullName} xử lý.`,
                  audience: 'CLASS',
                  classId: row.classId,
                  status: 'PUBLISHED',
                  createdBy: user.id,
                  createdAt: row.reviewedAt,
                  systemEvent: 'EXAM_RESULT_REVIEWED',
                  resultId: row.id,
                  studentId: row.studentId,
                  recipientUserIds: recipients,
                });
              }
            } else if (config.id === 'announcements') {
              if (row.status === 'PUBLISHED')
                fail(409, 'Thông báo đã được phát hành.');
              row.status = transition.to;
            } else if (config.id === 'online-payments') {
              if (row.status !== 'DRAFT')
                fail(409, 'Giao dịch đã được gửi xác nhận.');
              if (
                db['online-payments'].some(
                  (p) =>
                    p.id !== row.id &&
                    p.invoiceId === row.invoiceId &&
                    p.status === 'PENDING',
                )
              )
                fail(409, 'Hóa đơn đã có yêu cầu chờ xác nhận.');
              row.status = transition.to;
            }
            notifyWorkflow({
              db,
              user,
              moduleId: config.id,
              row,
              stage: needed === 'A' ? 'REVIEWED' : 'SUBMITTED',
            });
            data = row;
            audit(
              action === 'approve'
                ? 'Phê duyệt'
                : action === 'reject'
                  ? 'Từ chối'
                  : 'Xử lý',
              config.title,
            );
          } else {
            if (config.id === 'attendance')
              fail(
                409,
                'Vui lòng điểm danh theo buổi tập bằng màn hình Điểm danh.',
              );
            if (
              config.id === 'schedules' &&
              id &&
              db.attendanceSessions?.[id]
            )
              fail(
                409,
                'Buổi tập đã mở điểm danh, không thể sửa hoặc xóa lịch.',
              );
            const needed =
              method === 'POST' ? 'C' : method === 'DELETE' ? 'D' : 'E';
            if (!can(config, user.role, needed))
              fail(403, 'Bạn không có quyền thực hiện thao tác này.');
            let row = id ? rows.find((r) => r.id === id) : null;
            if (row) access.assertWrite(config.id, row);
            if (row?.systemEvent)
              fail(
                403,
                'Thông báo kết quả tự động không được chỉnh sửa hoặc xóa.',
              );
            if (id && !row)
              fail(404, 'Không tìm thấy dữ liệu trong phạm vi của bạn.');
            if (config.id === 'invoices' && row) {
              if (row.status === 'PAID')
                fail(409, 'Hóa đơn đã hoàn tất không thể sửa hoặc xóa.');
              if (
                db['online-payments'].some(
                  (p) =>
                    p.invoiceId === id &&
                    (method === 'DELETE' ||
                      ['DRAFT', 'PENDING', 'SUCCESS'].includes(p.status)),
                )
              )
                fail(
                  409,
                  'Hóa đơn có giao dịch liên kết hoặc đang chờ xác nhận; không thể thay đổi.',
                );
            }
            if (
              ['leaves', 'promotions', 'exams', 'exam-results'].includes(
                config.id,
              ) &&
              row &&
              row.status !== 'PENDING'
            )
              fail(409, 'Đơn đã được xử lý, không thể sửa hoặc xóa.');
            if (method === 'DELETE') {
              if (config.id === 'users' && id === user.id)
                fail(400, 'Không thể xóa tài khoản đang đăng nhập.');
              if (config.id === 'roles' && row.system)
                fail(400, 'Không thể xóa vai trò nền.');
              if (
                config.id === 'roles' &&
                db.users.some((u) => u.role === row.code)
              )
                fail(409, 'Vai trò đang được gán cho tài khoản.');
              if (
                (config.id === 'instructors' &&
                  (db.classes.some((c) => c.instructorId === id) ||
                    db.users.some((u) => u.id === id))) ||
                (config.id === 'students' &&
                  db.invoices.some((i) => i.studentId === id)) ||
                (config.id === 'classes' &&
                  db.students.some((s) => s.classId === id)) ||
                (config.id === 'wards' &&
                  (db.clubs.some((c) => c.wardId === id) ||
                    db.users.some((u) => u.wardId === id))) ||
                (config.id === 'clubs' &&
                  (db.classes.some((c) => c.clubId === id) ||
                    db.users.some((u) => u.clubId === id))) ||
                (config.id === 'ranks' &&
                  Object.values(db).some(
                    (rows) =>
                      Array.isArray(rows) && rows.some((r) => r?.rankId === id),
                  ))
              )
                fail(
                  409,
                  'Bản ghi đang có dữ liệu liên kết; hãy cập nhật trạng thái thay vì xóa.',
                );
              db[collection] = db[collection].filter((r) => r.id !== id);
              if (config.id === 'students')
                db.enrollments = db.enrollments.filter(
                  (e) => e.studentId !== id,
                );
              if (config.id === 'users') revoke(id);
              data = { deleted: true };
              audit('Xóa bản ghi', config.title);
            } else {
              const clean = {};
              for (const field of config.fields) {
                if (
                  config.id === 'classes' &&
                  user.role === 'MASTER' &&
                  access.level === 'CLUB' &&
                  field.key === 'tuition'
                ) {
                  clean.tuition = row?.tuition || 0;
                  continue;
                }
                if (
                  config.id === 'users' &&
                  ['masterLevel', 'wardId', 'clubId'].includes(field.key) &&
                  (body.role !== 'MASTER' ||
                    (field.key === 'wardId' &&
                      body.masterLevel === 'PROVINCE') ||
                    (field.key === 'clubId' && body.masterLevel !== 'CLUB'))
                ) {
                  clean[field.key] = '';
                  continue;
                }
                if (
                  user.role === 'STUDENT' &&
                  config.id === 'students' &&
                  !['phone', 'email'].includes(field.key)
                )
                  continue;
                let v = body[field.key];
                if (field.type === 'password' && method !== 'POST' && !v)
                  continue;
                if (
                  field.required &&
                  (v === undefined || v === null || String(v).trim() === '')
                )
                  fail(400, 'Vui lòng nhập ' + field.label.toLowerCase() + '.');
                if (
                  ['number', 'money', 'score', 'percent'].includes(field.type)
                ) {
                  v = Number(v);
                  if (!Number.isFinite(v) || v < 0)
                    fail(400, field.label + ' phải là số không âm.');
                  if (field.type === 'percent' && v > 100)
                    fail(400, 'Mức giảm không vượt quá 100%.');
                  if (field.key === 'rating' && v > 10)
                    fail(400, 'Điểm đánh giá không vượt quá 10.');
                }
                if (field.key === 'role' && !db.roles.some((r) => r.code === v))
                  fail(400, 'Vai trò không tồn tại.');
                if (
                  field.key !== 'role' &&
                  field.options &&
                  v &&
                  !field.options.some((o) => o[0] === v)
                )
                  fail(400, 'Giá trị ' + field.label + ' không hợp lệ.');
                clean[field.key] = typeof v === 'string' ? v.trim() : v;
              }
              access.validate(config.id, clean, row);
              if (config.id === 'announcements') {
                if (
                  user.role === 'MASTER' &&
                  ['WARD', 'CLUB'].includes(access.level) &&
                  clean.classId
                )
                  clean.audience = 'CLASS';
                if (clean.audience === 'CLASS' && !clean.classId)
                  fail(400, 'Vui lòng chọn lớp nhận thông báo.');
                if (
                  clean.audience === 'ALL' &&
                  !(
                    user.role === 'MASTER' &&
                    ['WARD', 'CLUB'].includes(access.level)
                  )
                )
                  clean.classId = '';
              }
              if (
                clean.email &&
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email)
              )
                fail(400, 'Địa chỉ email không hợp lệ.');
              for (const [key, list] of [
                ['studentId', db.students],
                ['classId', db.classes],
                ['rankId', db.ranks],
                ['instructorId', db.instructors],
                ['examId', db.exams],
                ['invoiceId', db.invoices],
                ['discountId', db.discounts],
                ['wardId', db.wards],
                ['clubId', db.clubs],
              ])
                if (clean[key] && !list.some((r) => r.id === clean[key]))
                  fail(400, 'Dữ liệu liên kết không tồn tại.');
              if (clean.studentId && !studentIds().includes(clean.studentId))
                fail(403, 'Võ sinh không thuộc phạm vi của bạn.');
              if (clean.classId && !classIds().includes(clean.classId))
                fail(403, 'Lớp không thuộc phạm vi của bạn.');
              if (user.role === 'STUDENT' && clean.studentId)
                clean.studentId = user.studentId;
              if (config.id === 'leaves') {
                if (
                  !/^\d{4}-\d{2}-\d{2}$/.test(clean.sessionDate) ||
                  Number.isNaN(Date.parse(clean.sessionDate)) ||
                  new Date(clean.sessionDate).toISOString().slice(0, 10) !==
                    clean.sessionDate
                )
                  fail(400, 'Ngày xin nghỉ không hợp lệ.');
                if (
                  db.leaves.some(
                    (r) =>
                      r.id !== id &&
                      r.studentId === clean.studentId &&
                      r.classId === clean.classId &&
                      r.sessionDate === clean.sessionDate &&
                      ['PENDING', 'APPROVED'].includes(r.status),
                  )
                )
                  fail(
                    409,
                    'Đã có đơn nghỉ chờ duyệt hoặc đã duyệt cho ngày và lớp này.',
                  );
              }
              if (
                config.id === 'leaves' &&
                clean.studentId &&
                clean.classId &&
                !db.students.some(
                  (s) =>
                    s.id === clean.studentId && s.classId === clean.classId,
                ) &&
                !db.enrollments.some(
                  (e) =>
                    e.studentId === clean.studentId &&
                    e.classId === clean.classId &&
                    e.status === 'ACTIVE',
                )
              )
                fail(400, 'Học viên không thuộc lớp xin nghỉ.');
              if (config.id === 'instructors') {
                if (
                  db.instructors.some(
                    (i) =>
                      i.id !== id &&
                      i.email.toLowerCase() === clean.email.toLowerCase(),
                  )
                )
                  fail(409, 'Email hồ sơ HLV đã tồn tại.');
                if (
                  clean.status === 'PAUSED' &&
                  db.classes.some(
                    (c) => c.instructorId === id && c.status === 'ACTIVE',
                  )
                )
                  fail(
                    409,
                    'HLV đang phụ trách lớp hoạt động. Hãy phân công người thay thế trước khi tạm dừng.',
                  );
              }
              if (config.id === 'ranks') {
                if (!Number.isInteger(clean.level) || clean.level < 1)
                  fail(400, 'Thứ tự cấp đai phải là số nguyên dương.');
                if (!/^#[0-9a-f]{6}$/i.test(clean.color))
                  fail(400, 'Màu cấp đai không hợp lệ.');
                if (
                  db.ranks.some(
                    (r) =>
                      r.id !== id &&
                      (r.name.toLocaleLowerCase('vi') ===
                        clean.name.toLocaleLowerCase('vi') ||
                        Number(r.level) === clean.level),
                  )
                )
                  fail(409, 'Tên hoặc thứ tự cấp đai đã tồn tại.');
              }
              if (config.id === 'exam-results') {
                clean.classId =
                  row?.classId ||
                  db.students.find((s) => s.id === clean.studentId)?.classId;
                if (row && row.studentId !== clean.studentId)
                  fail(
                    400,
                    'Không thể đổi võ sinh của bảng điểm; hãy tạo bản ghi riêng.',
                  );
                if (
                  !db.exams.some(
                    (e) => e.id === clean.examId && e.status === 'APPROVED',
                  )
                )
                  fail(409, 'Chỉ nhập kết quả cho kỳ thi đã được duyệt.');
                if (
                  db['exam-results'].some(
                    (r) =>
                      r.id !== id &&
                      r.examId === clean.examId &&
                      r.studentId === clean.studentId,
                  )
                )
                  fail(409, 'Võ sinh đã có kết quả trong kỳ thi này.');
              }
              if (config.id === 'promotions') {
                const student = db.students.find(
                  (s) => s.id === clean.studentId,
                );
                if (student?.classId !== clean.classId)
                  fail(400, 'Võ sinh không thuộc lớp đề xuất.');
                if (student.status !== 'ACTIVE')
                  fail(400, 'Võ sinh đang tạm nghỉ, không thể đề xuất.');
                const target = db.ranks.find((r) => r.id === clean.rankId),
                  current = db.ranks.find((r) => r.id === student.rankId);
                if (
                  !target ||
                  !current ||
                  Number(target.level) <= Number(current.level)
                )
                  fail(
                    400,
                    'Cấp đai đề xuất phải cao hơn cấp đai hiện tại.',
                  );
                if (
                  db.promotions.some(
                    (r) =>
                      r.id !== id &&
                      r.studentId === clean.studentId &&
                      r.status === 'PENDING',
                  )
                )
                  fail(409, 'Võ sinh đã có đề xuất chờ duyệt.');
              }
              if (config.id === 'users') {
                clean.email = String(clean.email).toLowerCase();
                if (
                  db.users.some(
                    (u) => u.id !== id && u.email.toLowerCase() === clean.email,
                  )
                )
                  fail(409, 'Email đã được sử dụng.');
                if (clean.password && clean.password.length < 8)
                  fail(400, 'Mật khẩu cần ít nhất 8 ký tự.');
                if (
                  id === user.id &&
                  (clean.role !== user.role || clean.status !== 'ACTIVE')
                )
                  fail(
                    400,
                    'Không thể thay đổi quyền hoặc khóa tài khoản đang đăng nhập.',
                  );
                if (clean.role === 'STUDENT' && method === 'POST') {
                  const student = db.students.find(
                    (s) =>
                      s.email?.toLowerCase() === clean.email &&
                      access.studentIds(true).includes(s.id),
                  );
                  if (!student)
                    fail(
                      400,
                      'Tạo hồ sơ võ sinh có email này trước khi tạo tài khoản.',
                    );
                  clean.studentId = student.id;
                }
              }
              if (config.id === 'schedules' && clean.endTime <= clean.startTime)
                fail(400, 'Giờ kết thúc cần sau giờ bắt đầu.');
              if (config.id === 'enrollments') {
                if (
                  clean.status === 'ACTIVE' &&
                  db.enrollments.some(
                    (e) =>
                      e.id !== id &&
                      e.studentId === clean.studentId &&
                      e.classId === clean.classId &&
                      e.status === 'ACTIVE',
                  )
                )
                  fail(409, 'Võ sinh đã được phân vào lớp này.');
                const cls = db.classes.find((c) => c.id === clean.classId);
                if (
                  clean.status === 'ACTIVE' &&
                  db.students.filter(
                    (s) =>
                      s.classId === cls.id &&
                      s.id !== clean.studentId &&
                      s.status === 'ACTIVE',
                  ).length >= cls.capacity
                )
                  fail(409, 'Lớp đã đủ sĩ số.');
                if (clean.status === 'ACTIVE') {
                  for (const e of db.enrollments)
                    if (
                      e.id !== id &&
                      e.studentId === clean.studentId &&
                      e.status === 'ACTIVE'
                    )
                      e.status = 'PAUSED';
                }
                const targetStudent = db.students.find(
                  (s) => s.id === clean.studentId,
                );
                if (targetStudent) targetStudent.classId = clean.classId;
              }
              if (
                config.id === 'attendance' &&
                db.attendance.some(
                  (a) =>
                    a.id !== id &&
                    a.studentId === clean.studentId &&
                    a.sessionDate === clean.sessionDate &&
                    a.classId === clean.classId,
                )
              )
                fail(409, 'Võ sinh đã có điểm danh trong ngày và lớp này.');
              if (
                ['attendance', 'leaves', 'evaluations'].includes(config.id) &&
                clean.studentId &&
                clean.classId &&
                db.students.find((s) => s.id === clean.studentId).classId !==
                  clean.classId
              )
                fail(400, 'Võ sinh không thuộc lớp đã chọn.');
              if (config.id === 'exam-results')
                clean.totalScore = [
                  'quyenScore',
                  'theoryFitnessScore',
                  'basicScore',
                  'sparringScore',
                ].reduce((a, k) => a + clean[k], 0);
              if (config.id === 'online-payments') {
                const invoice = scoped('invoices', db.invoices).find(
                  (i) => i.id === clean.invoiceId,
                );
                if (!invoice || invoice.status === 'PAID')
                  fail(400, 'Chọn hóa đơn chưa thanh toán của bạn.');
                if (
                  db['online-payments'].some(
                    (p) =>
                      p.invoiceId === invoice.id &&
                      ['DRAFT', 'PENDING'].includes(p.status),
                  )
                )
                  fail(409, 'Hóa đơn đã có giao dịch đang xử lý.');
                Object.assign(clean, {
                  code: 'GD-' + Date.now().toString().slice(-7),
                  studentId: invoice.studentId,
                  amount: invoice.amount,
                  method: 'BANK',
                  status: 'DRAFT',
                });
              }
              if (config.id === 'invoices') {
                if (
                  !db.students.some(
                    (s) =>
                      s.id === clean.studentId && s.classId === clean.classId,
                  )
                )
                  fail(400, 'Học viên không thuộc lớp lập hóa đơn.');
                if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(clean.period))
                  fail(400, 'Tháng thu không hợp lệ.');
                if (
                  db.invoices.some(
                    (r) =>
                      r.id !== id &&
                      r.studentId === clean.studentId &&
                      r.classId === clean.classId &&
                      r.period === clean.period,
                  )
                )
                  fail(
                    409,
                    'Đã có hóa đơn cho học viên, lớp và tháng này.',
                  );
                Object.assign(clean, priceInvoice(db, clean));
              }
              if (method === 'POST') {
                row = {
                  ...clean,
                  id: uuid(),
                  createdBy: user.id,
                  createdAt: new Date().toISOString(),
                };
                if (config.workflow)
                  row.status = workflows[config.id]?.initial || 'PENDING';
                if (config.id === 'announcements')
                  row.status = user.role === 'ADMIN' ? 'PUBLISHED' : 'DRAFT';
                if (config.id === 'invoices') {
                  row.status = row.amount === 0 ? 'PAID' : 'UNPAID';
                  row.code = 'HD-' + Date.now().toString().slice(-8);
                }
                if (config.id === 'students') {
                  row.studentCode =
                    'VS' + String(db.students.length + 1).padStart(4, '0');
                  const cls = db.classes.find((c) => c.id === row.classId);
                  if (
                    db.students.filter(
                      (s) => s.classId === cls.id && s.status === 'ACTIVE',
                    ).length >= cls.capacity
                  )
                    fail(409, 'Lớp đã đủ sĩ số.');
                  db.enrollments.push({
                    id: uuid(),
                    studentId: row.id,
                    classId: row.classId,
                    joinedAt: new Date().toISOString().slice(0, 10),
                    status: row.status,
                  });
                }
                if (
                  config.id === 'users' &&
                  ['INSTRUCTOR', 'MASTER'].includes(row.role)
                ) {
                  const targetCollection =
                    row.role === 'INSTRUCTOR' ? 'instructors' : 'masters';
                  const profile = db[targetCollection].find(
                    (p) => p.email.toLowerCase() === row.email.toLowerCase(),
                  );
                  if (profile) {
                    if (db.users.some((u) => u.id === profile.id))
                      fail(409, 'Hồ sơ đã có tài khoản liên kết.');
                    row.id = profile.id;
                  } else
                    db[targetCollection].push({
                      id: row.id,
                      fullName: row.fullName,
                      email: row.email,
                      provinceId:
                        row.provinceId || user.provinceId || 'province-1',
                      phone: '',
                      qualification: 'Chưa cập nhật',
                      status: row.status,
                    });
                }
                if (config.id === 'roles') {
                  row.code = 'ROLE_' + row.id;
                  for (const rights of Object.values(db.permissions))
                    rights[row.code] = '';
                }
                db[collection].unshift(row);
                if (['leaves', 'promotions', 'exams'].includes(config.id))
                  notifyWorkflow({
                    db,
                    user,
                    moduleId: config.id,
                    row,
                    stage: 'SUBMITTED',
                  });
              } else {
                if (
                  config.id === 'exam-results' &&
                  ['PASS', 'FAIL'].includes(row.status)
                )
                  fail(
                    409,
                    'Kết quả đã chốt; không thể thay đổi điểm đã xét duyệt.',
                  );
                if (
                  config.id === 'students' &&
                  clean.classId &&
                  (clean.classId !== row.classId ||
                    (row.status !== 'ACTIVE' && clean.status === 'ACTIVE'))
                ) {
                  const target = db.classes.find((c) => c.id === clean.classId);
                  if (
                    clean.status !== 'PAUSED' &&
                    db.students.filter(
                      (s) =>
                        s.classId === target.id &&
                        s.id !== row.id &&
                        s.status === 'ACTIVE',
                    ).length >= target.capacity
                  )
                    fail(409, 'Lớp đã đủ sĩ số.');
                  if (clean.classId !== row.classId) {
                    for (const e of db.enrollments)
                      if (e.studentId === row.id && e.status === 'ACTIVE')
                        e.status = 'PAUSED';
                    db.enrollments.push({
                      id: uuid(),
                      studentId: row.id,
                      classId: clean.classId,
                      joinedAt: new Date().toISOString().slice(0, 10),
                      status: clean.status || 'ACTIVE',
                    });
                  }
                }
                if (
                  config.id === 'students' &&
                  (!clean.classId || clean.classId === row.classId) &&
                  clean.status &&
                  clean.status !== row.status
                ) {
                  const activeEnrollment = db.enrollments.find(
                    (e) =>
                      e.studentId === row.id && e.classId === row.classId,
                  );
                  if (activeEnrollment) activeEnrollment.status = clean.status;
                }
                if (config.id === 'invoices' && row.status === 'PAID')
                  fail(409, 'Hóa đơn đã thanh toán không thể sửa.');
                if (
                  config.id === 'users' &&
                  (((row.role === 'MASTER' || clean.role === 'MASTER') &&
                    (clean.masterLevel !== row.masterLevel ||
                      clean.wardId !== row.wardId ||
                      clean.clubId !== row.clubId)) ||
                    clean.role !== row.role ||
                    clean.status === 'PAUSED' ||
                    clean.password)
                )
                  revoke(row.id);
                Object.assign(row, clean);
                if (config.id === 'invoices')
                  row.status = row.amount === 0 ? 'PAID' : 'UNPAID';
                if (config.workflow)
                  row.status = workflows[config.id]?.initial || 'PENDING';
              }
              if (config.id === 'users' && row.role === 'MASTER') {
                const profile = db.masters.find(
                  (m) => m.userId === row.id || m.email === row.email,
                );
                if (profile)
                  Object.assign(profile, {
                    userId: row.id,
                    fullName: row.fullName,
                    email: row.email,
                    masterLevel: row.masterLevel,
                    provinceId: row.provinceId,
                    wardId: row.wardId,
                    clubId: row.clubId,
                    status: row.status,
                  });
              }
              if (config.id === 'users' && row.role === 'INSTRUCTOR') {
                const profile = db.instructors.find(
                  (i) =>
                    i.id === row.id ||
                    i.email.toLowerCase() === row.email.toLowerCase(),
                );
                if (profile)
                  Object.assign(profile, {
                    fullName: row.fullName,
                    email: row.email,
                    provinceId:
                      row.provinceId || profile.provinceId || 'province-1',
                    status: row.status,
                  });
              }
              data =
                config.id === 'users'
                  ? safe(row)
                  : config.id === 'classes' &&
                      user.role === 'MASTER' &&
                      access.level === 'CLUB'
                    ? (({ tuition, ...rest }) => rest)(row)
                    : row;
              audit(method === 'POST' ? 'Tạo mới' : 'Cập nhật', config.title);
            }
          }
        }
      }
      save(db);
      if (method !== 'GET' && typeof window !== 'undefined') {
        if (
          [
            '/leaves',
            '/promotions',
            '/belt-exams',
            '/online-payments',
            '/payment-confirmations',
          ].some((p) => path === p || path.startsWith(p + '/'))
        ) {
          for (const resource of [
            'announcements',
            'online-payments',
            'payment-confirmations',
            'invoices',
            'transactions',
          ])
            window.dispatchEvent(
              new CustomEvent('vovinam:mock-change', { detail: { resource } }),
            );
        }
        if (
          [
            '/users',
            '/wards',
            '/clubs',
            '/classes',
            '/instructors',
            '/permissions',
          ].some((p) => path === p || path.startsWith(p + '/'))
        )
          window.dispatchEvent(
            new CustomEvent('vovinam:mock-change', {
              detail: { resource: 'permissions' },
            }),
          );
        if (path.startsWith('/tuition-relief')) {
          for (const resource of ['discounts', 'announcements'])
            window.dispatchEvent(
              new CustomEvent('vovinam:mock-change', { detail: { resource } }),
            );
        }
        if (path.startsWith('/attendance-workflow/')) {
          for (const resource of ['attendance', 'schedules'])
            window.dispatchEvent(
              new CustomEvent('vovinam:mock-change', { detail: { resource } }),
            );
        }
        if (path.startsWith('/exam-results')) {
          for (const resource of ['announcements', 'belt-history', 'students'])
            window.dispatchEvent(
              new CustomEvent('vovinam:mock-change', { detail: { resource } }),
            );
        }
        if (path.startsWith('/belt-ranks'))
          window.dispatchEvent(
            new CustomEvent('vovinam:mock-change', {
              detail: { resource: 'ranks' },
            }),
          );
        if (path.startsWith('/belt-exams') || path.startsWith('/exam-results'))
          window.dispatchEvent(
            new CustomEvent('vovinam:mock-change', {
              detail: {
                resource: path.startsWith('/belt-exams')
                  ? 'exams'
                  : 'exam-results',
              },
            }),
          );
        if (path.startsWith('/promotions'))
          window.dispatchEvent(
            new CustomEvent('vovinam:mock-change', {
              detail: { resource: 'promotions' },
            }),
          );
        if (path.startsWith('/leaves') || path === '/permissions')
          window.dispatchEvent(
            new CustomEvent('vovinam:mock-change', {
              detail: { resource: 'leaves' },
            }),
          );
        if (path === '/notifications/read-all')
          window.dispatchEvent(
            new CustomEvent('vovinam:mock-change', {
              detail: { resource: 'announcements' },
            }),
          );
      }
    } catch (e) {
      status = e.status || 500;
      message = e.message;
      data = null;
    }
    return new Response(JSON.stringify({ code: status, message, data }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  // Every read/write is serialized because GETs can initialize/migrate the shared DB too.
  // Web Locks prevents two browser tabs from approving the same pending request.
  return (input, options = {}) => {
    const locks = globalThis.navigator?.locks;
    return locks?.request
      ? locks.request(
          'vovinam-mock-db-v4',
          {
            mode: 'exclusive',
            ...(options.signal ? { signal: options.signal } : {}),
          },
          () => execute(input, options),
        )
      : execute(input, options);
  };
}
