import { lazy } from 'react';
export const pages = {
  wards: lazy(()=>import('../features/wards/pages/OrganizationPage.jsx')),
  clubs: lazy(()=>import('../features/clubs/pages/OrganizationPage.jsx')),
  users: lazy(() => import('../features/users/pages/UsersPage.jsx')),
  roles: lazy(() => import('../features/roles/pages/RolesPage.jsx')),
  students: lazy(() => import('../features/students/pages/StudentsPage.jsx')),
  masters: lazy(() => import('../features/masters/pages/MastersPage.jsx')),
  instructors: lazy(
    () => import('../features/instructors/pages/InstructorsPage.jsx'),
  ),
  classes: lazy(() => import('../features/classes/pages/ClassesPage.jsx')),
  enrollments: lazy(
    () => import('../features/enrollments/pages/EnrollmentsPage.jsx'),
  ),
  schedules: lazy(
    () => import('../features/schedules/pages/SchedulesPage.jsx'),
  ),
  attendance: lazy(
    () => import('../features/attendance/pages/AttendancePage.jsx'),
  ),
  leaves: lazy(() => import('../features/leaves/pages/LeavesPage.jsx')),
  evaluations: lazy(
    () => import('../features/evaluations/pages/EvaluationsPage.jsx'),
  ),
  ranks: lazy(() => import('../features/ranks/pages/RanksPage.jsx')),
  promotions: lazy(
    () => import('../features/promotions/pages/PromotionsPage.jsx'),
  ),
  exams: lazy(() => import('../features/exams/pages/ExamsPage.jsx')),
  'exam-results': lazy(
    () => import('../features/exam-results/pages/ExamResultsPage.jsx'),
  ),
  'belt-history': lazy(
    () => import('../features/belt-history/pages/BeltHistoryPage.jsx'),
  ),
  tuition: lazy(() => import('../features/tuition/pages/TuitionPage.jsx')),
  invoices: lazy(() => import('../features/invoices/pages/InvoicesPage.jsx')),
  'online-payments': lazy(
    () => import('../features/online-payments/pages/OnlinePaymentsPage.jsx'),
  ),
  transactions: lazy(
    () => import('../features/transactions/pages/TransactionsPage.jsx'),
  ),
  'payment-confirmations': lazy(
    () =>
      import('../features/payment-confirmations/pages/PaymentConfirmationsPage.jsx'),
  ),
  discounts: lazy(
    () => import('../features/discounts/pages/DiscountsPage.jsx'),
  ),
  announcements: lazy(
    () => import('../features/announcements/pages/AnnouncementsPage.jsx'),
  ),
  'student-report': lazy(
    () => import('../features/student-report/pages/StudentReportPage.jsx'),
  ),
  'attendance-report': lazy(
    () =>
      import('../features/attendance-report/pages/AttendanceReportPage.jsx'),
  ),
  'tuition-report': lazy(
    () => import('../features/tuition-report/pages/TuitionReportPage.jsx'),
  ),
  'promotion-report': lazy(
    () => import('../features/promotion-report/pages/PromotionReportPage.jsx'),
  ),
  settings: lazy(() => import('../features/settings/pages/SettingsPage.jsx')),
  audit: lazy(() => import('../features/audit/pages/AuditPage.jsx')),
};
