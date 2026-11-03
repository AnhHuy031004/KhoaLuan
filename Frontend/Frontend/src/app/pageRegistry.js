import { lazy } from "react";
export const featurePages = {
  "students": lazy(() => import("../features/students/pages/StudentsPage.jsx")),
  "classes": lazy(() => import("../features/classes/pages/ClassesPage.jsx")),
  "schedules": lazy(() => import("../features/schedules/pages/SchedulesPage.jsx").then(module => ({
    default: module.Schedules
  }))),
  "enrollments": lazy(() => import("../features/enrollments/pages/EnrollmentsPage.jsx")),
  "attendance": lazy(() => import("../features/attendance/pages/AttendancePage.jsx").then(module => ({
    default: module.Attendance
  }))),
  "attendance-history": lazy(() => import("../features/attendance-history/pages/AttendanceHistoryPage.jsx")),
  "leaves": lazy(() => import("../features/leaves/pages/LeavesPage.jsx")),
  "evaluations": lazy(() => import("../features/evaluations/pages/EvaluationsPage.jsx")),
  "ranks": lazy(() => import("../features/ranks/pages/RanksPage.jsx")),
  "exams": lazy(() => import("../features/exams/pages/ExamsPage.jsx")),
  "exam-results": lazy(() => import("../features/exam-results/pages/ExamResultsPage.jsx")),
  "invoices": lazy(() => import("../features/invoices/pages/InvoicesPage.jsx")),
  "payments": lazy(() => import("../features/payments/pages/PaymentsPage.jsx")),
  "billing": lazy(() => import("../features/billing/pages/BillingPage.jsx").then(module => ({
    default: module.Billing
  }))),
  "announcements": lazy(() => import("../features/announcements/pages/AnnouncementsPage.jsx")),
  "notifications": lazy(() => import("../features/notifications/pages/NotificationsPage.jsx")),
  "reports": lazy(() => import("../features/reports/pages/ReportsPage.jsx").then(module => ({
    default: module.Reports
  }))),
  "users": lazy(() => import("../features/users/pages/UsersPage.jsx")),
  "audit": lazy(() => import("../features/audit/pages/AuditPage.jsx")),
  "children": lazy(() => import("../features/children/pages/ChildrenPage.jsx")),
  "profile": lazy(() => import("../features/profile/pages/ProfilePage.jsx").then(module => ({
    default: module.Profile
  }))),
  "security": lazy(() => import("../features/security/pages/SecurityPage.jsx").then(module => ({
    default: module.Security
  })))
};
