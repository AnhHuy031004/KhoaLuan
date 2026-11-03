import { createUsers } from './users.js';
import { createRanks } from './ranks.js';
import { createStudents } from './students.js';
import { createMasters } from './masters.js';
import { createInstructors } from './instructors.js';
import { createClasses } from './classes.js';
import { createEnrollments } from './enrollments.js';
import { createSchedules } from './schedules.js';
import { createAttendance } from './attendance.js';
import { createLeaves } from './leaves.js';
import { createEvaluations } from './evaluations.js';
import { createPromotions } from './promotions.js';
import { createExams } from './exams.js';
import { createExamResults } from './exam-results.js';
import { createBeltHistory } from './belt-history.js';
import { createTuition } from './tuition.js';
import { createInvoices } from './invoices.js';
import { createOnlinePayments } from './online-payments.js';
import { createTransactions } from './transactions.js';
import { createPaymentConfirmations } from './payment-confirmations.js';
import { createDiscounts } from './discounts.js';
import { createAnnouncements } from './announcements.js';
import { createRoles } from './roles.js';
import { createSettings } from './settings.js';
import { createAudit } from './audit.js';
export function createSeed() {
  const db = {
    version: 3,
    sessions: {},
    resetTokens: {},
    readNotifications: {},
  };
  db['users'] = createUsers(db);
  db['ranks'] = createRanks(db);
  db['students'] = createStudents(db);
  db['masters'] = createMasters(db);
  db['instructors'] = createInstructors(db);
  db['classes'] = createClasses(db);
  db['enrollments'] = createEnrollments(db);
  db['schedules'] = createSchedules(db);
  db['attendance'] = createAttendance(db);
  db['leaves'] = createLeaves(db);
  db['evaluations'] = createEvaluations(db);
  db['promotions'] = createPromotions(db);
  db['exams'] = createExams(db);
  db['exam-results'] = createExamResults(db);
  db['belt-history'] = createBeltHistory(db);
  db['tuition'] = createTuition(db);
  db['invoices'] = createInvoices(db);
  db['online-payments'] = createOnlinePayments(db);
  db['transactions'] = createTransactions(db);
  db['payment-confirmations'] = createPaymentConfirmations(db);
  db['discounts'] = createDiscounts(db);
  db['announcements'] = createAnnouncements(db);
  db['roles'] = createRoles(db);
  db['settings'] = createSettings(db);
  db['audit'] = createAudit(db);
  return db;
}
