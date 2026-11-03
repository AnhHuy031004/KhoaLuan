export const ROLES = {
  ADMIN: 'Quản trị viên',
  MASTER: 'Võ sư',
  INSTRUCTOR: 'Huấn luyện viên',
  STUDENT: 'Võ sinh',
  PARENT: 'Phụ huynh',
};
export const ACTIONS = {
  V: 'Xem',
  C: 'Tạo',
  E: 'Sửa',
  D: 'Xóa',
  A: 'Phê duyệt',
  P: 'Xử lý',
};
export const can = (module, role, action) =>
  Boolean(
    !(
      !module?.apiMode &&
      module?.id === 'discounts' &&
      ((action === 'C' && role !== 'INSTRUCTOR') ||
        (action === 'A' && !['ADMIN', 'MASTER'].includes(role)) ||
        ['E', 'D', 'P'].includes(action))
    ) &&
      !(
        !module?.apiMode &&
        module?.id === 'exam-results' &&
        action === 'A' &&
        role !== 'ADMIN'
      ) &&
      module?.permissions?.[role]?.includes(action),
  );
export const canOpen = (module, role) => Boolean(module?.permissions?.[role]);

export const MASTER_LEVELS = {
  PROVINCE: 'Võ sư cấp tỉnh',
  WARD: 'Võ sư cấp phường',
  CLUB: 'Võ sư phụ trách câu lạc bộ',
};
export const roleLabel = (user) =>
  user?.role === 'ADMIN'
    ? 'Admin cấp tỉnh'
    : user?.role === 'MASTER'
      ? MASTER_LEVELS[user.masterLevel || 'PROVINCE'] || 'Võ sư'
      : ROLES[user?.role] || user?.role;
