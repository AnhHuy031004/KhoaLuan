import wards from '../features/wards/module.js';
import clubs from '../features/clubs/module.js';
import m0 from '../features/users/module.js';
import m1 from '../features/roles/module.js';
import m2 from '../features/students/module.js';
import m3 from '../features/masters/module.js';
import m4 from '../features/instructors/module.js';
import m5 from '../features/classes/module.js';
import m6 from '../features/enrollments/module.js';
import m7 from '../features/schedules/module.js';
import m8 from '../features/attendance/module.js';
import m9 from '../features/leaves/module.js';
import m10 from '../features/evaluations/module.js';
import m11 from '../features/ranks/module.js';
import m12 from '../features/promotions/module.js';
import m13 from '../features/exams/module.js';
import m14 from '../features/exam-results/module.js';
import m15 from '../features/belt-history/module.js';
import m16 from '../features/tuition/module.js';
import m17 from '../features/invoices/module.js';
import m18 from '../features/online-payments/module.js';
import m19 from '../features/transactions/module.js';
import m20 from '../features/payment-confirmations/module.js';
import m21 from '../features/discounts/module.js';
import m22 from '../features/announcements/module.js';
import m23 from '../features/student-report/module.js';
import m24 from '../features/attendance-report/module.js';
import m25 from '../features/tuition-report/module.js';
import m26 from '../features/promotion-report/module.js';
import m27 from '../features/settings/module.js';
import m28 from '../features/audit/module.js';
export const modules = [
  wards,clubs,
  m0,
  m1,
  m2,
  m3,
  m4,
  m5,
  m6,
  m7,
  m8,
  m9,
  m10,
  m11,
  m12,
  m13,
  m14,
  m15,
  m16,
  m17,
  m18,
  m19,
  m20,
  m21,
  m22,
  m23,
  m24,
  m25,
  m26,
  m27,
  m28,
];
export const getModule = (id) => modules.find((m) => m.id === id);
