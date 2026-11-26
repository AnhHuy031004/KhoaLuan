export const currency = (v) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(v) || 0);
export const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? String(value)
    : d.toLocaleDateString('vi-VN');
};
export const formatDateTime = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
export const initials = (name) =>
  String(name || 'VV')
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((s) => s[0])
    .join('')
    .toUpperCase();
export const monthKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
export const labels = {
  fullName: 'Họ và tên',
  studentCode: 'Mã võ sinh',
  studentId: 'Võ sinh',
  classId: 'Lớp học',
  rankId: 'Cấp đai',
  instructorId: 'Huấn luyện viên',
  name: 'Tên',
  phone: 'Điện thoại',
  status: 'Trạng thái',
  amount: 'Số tiền',
  totalScore: 'Tổng điểm',
  code: 'Mã',
  examId: 'Kỳ thi',
  createdAt: 'Thời gian',
  role: 'Vai trò',
  email: 'Email',
  method: 'Phương thức',
  invoiceId: 'Hóa đơn',
  period: 'Kỳ thu',
  dueDate: 'Hạn thanh toán',
  awardedAt: 'Ngày cấp',
  note: 'Ghi chú',
  action: 'Thao tác',
  userName: 'Người thực hiện',
  moduleName: 'Chức năng',
};
export const statusLabels = {
  ACTIVE: 'Đang hoạt động',
  PAUSED: 'Tạm dừng',
  PRESENT: 'Có mặt',
  ABSENT: 'Vắng mặt',
  LATE: 'Đi muộn',
  EXCUSED: 'Có phép',
  PENDING: 'Chờ duyệt',
  PENDING_VERIFICATION: 'Chờ đối soát',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  PAID: 'Đã thanh toán',
  UNPAID: 'Chưa thanh toán',
  SUCCESS: 'Thành công',
  CANCELLED: 'Đã hủy',
  SCHEDULED: 'Sắp diễn ra',
  COMPLETED: 'Hoàn thành',
  PASS: 'Đạt',
  FAIL: 'Chưa đạt',
  DRAFT: 'Bản nháp',
  PUBLISHED: 'Đã phát hành',
};
Object.assign(statusLabels, {
  OVERDUE: 'Quá hạn',
  REFUNDED: 'Đã hoàn tiền',
  DISPUTED: 'Cần đối chiếu',
  RESULT_PASS: 'Đạt',
  RESULT_FAIL: 'Chưa đạt',
  OPEN: 'Mở đăng ký',
  CLOSED: 'Đóng đăng ký',
  REGISTERED: 'Đã đăng ký',
  ARCHIVED: 'Đã lưu trữ',
  LEFT: 'Đã nghỉ',
});
Object.assign(labels, {
  emailVerified: 'Xác minh email',
  mfaEnabled: 'Xác thực hai bước',
  weekdayLabel: 'Thứ',
  effectiveFrom: 'Hiệu lực từ',
  effectiveTo: 'Hiệu lực đến',
  rankGroup: 'Nhóm đai',
  amountOff: 'Giảm theo số tiền',
});

Object.assign(labels, {
  reviewedBy: 'ID người xử lý',
  reviewedName: 'Người xử lý',
  reviewedRole: 'Vai trò người xử lý',
  reviewedAt: 'Thời điểm xử lý',
});

Object.assign(labels, {
  masterLevel: 'Cấp quản lý',
  provinceId: 'Tỉnh',
  wardId: 'Phường',
  clubId: 'Câu lạc bộ',
  studentCount: 'Võ sinh đang học',
  roster: 'Võ sinh trong lớp',
});

Object.assign(labels, { reviewedMasterLevel: 'Cấp Võ sư duyệt' });

// Professional information displayed by the signed-in account.
export function accountCredentials(user) {
  const supplied = (value) => typeof value === 'string' && value.trim() && !/^(chưa cập nhật|chưa có|cần bổ sung|—)$/i.test(value.trim());
  const qualification = supplied(user?.qualification) ? user.qualification.trim() : '';
  const rank = [user?.rankTitle, user?.rankName, /đai|đẳng/i.test(qualification) ? qualification : ''].find(supplied) || '';
  const certificates = Array.isArray(user?.certificates) ? user.certificates.filter(supplied).join('; ') : user?.certificates;
  const certificate = [user?.certificate, user?.certification, user?.degree, certificates, !/đai|đẳng/i.test(qualification) ? qualification : ''].find(supplied) || '';
  return { teaching: ['MASTER', 'INSTRUCTOR'].includes(user?.role), rank, certificate };
}
