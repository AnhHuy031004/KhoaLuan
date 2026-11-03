// Responsible club owns the profile. Teaching in another unit grants read access,
// while editing shared staff remains with the responsible unit or provincial staff.
export function migrateInstructorScope(db) {
  if(db.instructorScopeVersion)return;
  for(const profile of db.instructors) {
    const assigned=db.classes.find(c=>c.instructorId===profile.id);
    profile.clubId ||= assigned?.clubId||'';
    profile.provinceId ||= 'province-1';
  }
  db.instructorScopeVersion=1;
}
