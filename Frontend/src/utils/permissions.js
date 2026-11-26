export const ROLES = {
  ADMIN: 'Quản trị viên',
  MASTER: 'Võ sư',
  INSTRUCTOR: 'Huấn luyện viên',
  STUDENT: 'Võ sinh',
};
export const ACTIONS = {
  V: 'Xem',
  C: 'Tạo',
  E: 'Sửa',
  D: 'Xóa',
  A: 'Phê duyệt',
  P: 'Xử lý',
};
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

/**
 * Thứ bậc quyền hạn (Rank Score) dùng cho xét duyệt theo cấp bậc tăng dần:
 * 1: INSTRUCTOR (Huấn luyện viên)
 * 2: MASTER_CLUB (Võ sư phụ trách CLB)
 * 3: MASTER_WARD (Võ sư cấp phường)
 * 4: MASTER_PROVINCE (Võ sư cấp tỉnh)
 * 5: ADMIN (Admin cấp tỉnh)
 */
export function getAuthorityRank(actor) {
  if (!actor) return 0;
  const role = actor.role || actor.submittedRole;
  const level = actor.masterLevel || actor.submittedMasterLevel || 'PROVINCE';
  if (role === 'ADMIN') return 5;
  if (role === 'MASTER') {
    if (level === 'PROVINCE') return 4;
    if (level === 'WARD') return 3;
    if (level === 'CLUB') return 2;
    return 4;
  }
  if (role === 'INSTRUCTOR') return 1;
  return 0;
}

/**
 * Kiểm tra người dùng `user` có đủ cấp bậc để duyệt đề xuất miễn giảm `row` hay không:
 * - Cấp bậc của người duyệt phải lớn hơn cấp bậc người đề xuất (Reviewer Rank > Submitter Rank)
 * - Riêng Admin cấp tỉnh (Rank 5) là cấp cao nhất nên có thể duyệt cả đề xuất do Admin tạo.
 */
export function canReviewReliefByHierarchy(user, row) {
  if (!user || !row || row.status !== 'PENDING') return false;
  if (!['ADMIN', 'MASTER'].includes(user.role)) return false;
  const reviewerRank = getAuthorityRank(user);
  const submitterRank =
    row.submittedRank ||
    getAuthorityRank({
      role: row.submittedRole || 'INSTRUCTOR',
      masterLevel: row.submittedMasterLevel,
    });
  if (user.role === 'ADMIN') return reviewerRank >= submitterRank;
  return reviewerRank > submitterRank;
}

/**
 * Trả về nhãn mô tả cấp có thẩm quyền duyệt tiếp theo cho một đề xuất
 */
export function requiredApproverLabel(row) {
  const submitterRank =
    row?.submittedRank ||
    getAuthorityRank({
      role: row?.submittedRole || 'INSTRUCTOR',
      masterLevel: row?.submittedMasterLevel,
    });
  if (submitterRank <= 1) return 'Võ sư các cấp hoặc Admin duyệt';
  if (submitterRank === 2) return 'Cần Võ sư cấp phường, Võ sư cấp tỉnh hoặc Admin duyệt';
  if (submitterRank === 3) return 'Cần Võ sư cấp tỉnh hoặc Admin duyệt';
  return 'Cần Admin cấp tỉnh duyệt';
}

export const can = (module, role, action) =>
  Boolean(
    !(
      module?.id === 'discounts' &&
      ((action === 'C' && !['ADMIN', 'MASTER', 'INSTRUCTOR'].includes(role)) ||
        (action === 'A' && !['ADMIN', 'MASTER'].includes(role)) ||
        ['E', 'D', 'P'].includes(action))
    ) &&
      !(module?.id === 'exam-results' && action === 'A' && role !== 'ADMIN') &&
      module?.permissions?.[role]?.includes(action),
  );
export const canOpen = (module, role) => Boolean(module?.permissions?.[role]);
