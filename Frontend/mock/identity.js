// Account authorization state and class/enrollment state remain separate; contacts share one identity.
const contactKeys = ['fullName', 'email', 'phone'];
export function linkedPerson(db, user) {
  if (user.role === 'STUDENT')
    return db.students.find((person) => person.id === user.studentId);
  if (user.role === 'INSTRUCTOR')
    return db.instructors.find((person) => person.id === user.id);
  if (user.role === 'MASTER')
    return db.masters.find(
      (person) => person.userId === user.id || person.id === user.id,
    );
  return null;
}
function copyContacts(source, target) {
  if (target)
    for (const key of contactKeys)
      if (source[key] !== undefined) target[key] = source[key];
}
export function syncAccountContacts(db, user) {
  copyContacts(user, linkedPerson(db, user));
}
export function syncPersonContacts(db, moduleId, person) {
  const user = db.users.find((user) =>
    moduleId === 'students'
      ? user.studentId === person.id
      : user.id === person.id || user.id === person.userId,
  );
  copyContacts(person, user);
}
