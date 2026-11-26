/**
 * Shared client & mock-server validation rules for person profiles
 * (students, instructors, masters, users) to keep form validation and API
 * enforcement 100% consistent.
 */

export function normalizeWhitespace(value) {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ');
}

export function normalizePhone(value) {
  return String(value ?? '')
    .trim()
    .replace(/[\s.-]+/g, '');
}

/**
 * Validate Vietnamese or international phone numbers (9–15 digits, optional leading +).
 * Empty value is allowed unless `required` is true.
 */
export function validatePhone(value, { required = false } = {}) {
  const raw = String(value ?? '').trim();
  if (!raw) {
    return required ? 'Vui lòng nhập số điện thoại.' : '';
  }
  const cleaned = normalizePhone(raw);
  if (!/^(?:\+84|0)[35789]\d{8}$/.test(cleaned) && !/^\+?\d{9,15}$/.test(cleaned)) {
    return 'Số điện thoại không hợp lệ (cần 9–15 chữ số, ví dụ 0912345678).';
  }
  return '';
}

/**
 * Validate date of birth (YYYY-MM-DD): must be a real calendar date,
 * not in the future, and within a realistic human age range (1920..today).
 */
export function validateDob(value, { required = false, referenceDate } = {}) {
  const raw = String(value ?? '').trim();
  if (!raw) {
    return required ? 'Vui lòng nhập ngày sinh.' : '';
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return 'Ngày sinh phải có định dạng YYYY-MM-DD.';
  }
  const [y, m, d] = raw.split('-').map(Number);
  const parsed = new Date(Date.UTC(y, m - 1, d));
  if (
    parsed.getUTCFullYear() !== y ||
    parsed.getUTCMonth() !== m - 1 ||
    parsed.getUTCDate() !== d
  ) {
    return 'Ngày sinh không tồn tại trên lịch.';
  }
  const now = referenceDate ? new Date(referenceDate) : new Date();
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  if (raw > todayIso) {
    return 'Ngày sinh không được lớn hơn ngày hiện tại.';
  }
  if (y < 1920) {
    return 'Năm sinh không hợp lệ (cần từ năm 1920 trở về sau).';
  }
  return '';
}

export function validateEmail(value, { required = false } = {}) {
  const raw = String(value ?? '').trim();
  if (!raw) {
    return required ? 'Vui lòng nhập email.' : '';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
    return 'Địa chỉ email không hợp lệ.';
  }
  return '';
}

export function validateFullName(value, { required = true } = {}) {
  const cleaned = normalizeWhitespace(value);
  if (!cleaned) {
    return required ? 'Vui lòng nhập họ và tên.' : '';
  }
  if (cleaned.length < 2) {
    return 'Họ và tên cần tối thiểu 2 ký tự.';
  }
  return '';
}
