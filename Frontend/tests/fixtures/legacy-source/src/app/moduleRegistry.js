import module0 from '../../../../../src/features/students/module.js';
import module1 from '../../../../../src/features/classes/module.js';
import module2 from '../../../../../src/features/schedules/module.js';
import module3 from '../../../../../src/features/enrollments/module.js';
import module4 from '../../../../../src/features/attendance/module.js';
import module5 from '../features/attendance-history/module.js';
import module6 from '../../../../../src/features/leaves/module.js';
import module7 from '../../../../../src/features/evaluations/module.js';
import module8 from '../../../../../src/features/ranks/module.js';
import module9 from '../../../../../src/features/exams/module.js';
import module10 from '../../../../../src/features/exam-results/module.js';
import module11 from '../../../../../src/features/invoices/module.js';
import module12 from '../features/payments/module.js';
import module13 from '../features/billing/module.js';
import module14 from '../../../../../src/features/announcements/module.js';
import module15 from '../features/notifications/module.js';
import module16 from '../features/reports/module.js';
import module17 from '../../../../../src/features/users/module.js';
import module18 from '../../../../../src/features/audit/module.js';
import module19 from '../features/children/module.js';
import module20 from '../features/profile/module.js';
import module21 from '../features/security/module.js';
export const modules = [
  module0,
  module1,
  module2,
  module3,
  module4,
  module5,
  module6,
  module7,
  module8,
  module9,
  module10,
  module11,
  module12,
  module13,
  module14,
  module15,
  module16,
  module17,
  module18,
  module19,
  module20,
  module21,
];
export const getModule = (id) => modules.find((module) => module.id === id);
