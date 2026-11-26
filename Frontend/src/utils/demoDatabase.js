// Validate the storage envelope before any migration or replacement. No reseeding on failure.
const tables = [
  'users',
  'students',
  'masters',
  'instructors',
  'classes',
  'enrollments',
  'ranks',
  'schedules',
  'attendance',
  'leaves',
  'evaluations',
  'promotions',
  'exams',
  'exam-results',
  'belt-history',
  'roles',
  'invoices',
  'tuition',
  'online-payments',
  'transactions',
  'discounts',
  'announcements',
  'settings',
  'audit',
];
const object = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
export function validDemoDatabase(db) {
  return (
    object(db) &&
    db.version === 3 &&
    tables.every(
      (key) =>
        Array.isArray(db[key]) &&
        db[key].every((row) => object(row) && typeof row.id === 'string'),
    ) &&
    ['sessions', 'resetTokens', 'readNotifications'].every((key) =>
      object(db[key]),
    )
  );
}
