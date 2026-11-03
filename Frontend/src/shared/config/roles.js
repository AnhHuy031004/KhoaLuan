export const ALL_ROLES = ["ADMIN", "INSTRUCTOR", "STUDENT", "PARENT"];
export const STAFF_ROLES = ["ADMIN", "INSTRUCTOR"];
export const action = (title, key, roles, extra = {}) => ({
  title,
  key,
  roles,
  ...extra
});
