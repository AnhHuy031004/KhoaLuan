/**
 * Pure generator for weekly recurring training schedules.
 * Weekdays follow JS Date.getUTCDay(): 0=CN, 1=T2, 2=T3, 3=T4, 4=T5, 5=T6, 6=T7.
 */

export const WEEKDAY_OPTIONS = [
  { value: 1, short: 'T2', label: 'Thứ 2' },
  { value: 2, short: 'T3', label: 'Thứ 3' },
  { value: 3, short: 'T4', label: 'Thứ 4' },
  { value: 4, short: 'T5', label: 'Thứ 5' },
  { value: 5, short: 'T6', label: 'Thứ 6' },
  { value: 6, short: 'T7', label: 'Thứ 7' },
  { value: 0, short: 'CN', label: 'Chủ nhật' },
];

export function generateRecurringSessions({
  classId,
  startDate,
  weekdays = [],
  weeks = 4,
  startTime = '18:00',
  endTime = '19:30',
  location = '',
  existingSessions = [],
}) {
  if (!classId || !startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    return { sessions: [], error: 'Vui lòng chọn lớp học và ngày bắt đầu hợp lệ.' };
  }
  const normalizedDays = [...new Set(weekdays.map(Number))].filter(
    (d) => Number.isInteger(d) && d >= 0 && d <= 6,
  );
  if (!normalizedDays.length) {
    return { sessions: [], error: 'Vui lòng chọn ít nhất 1 thứ trong tuần.' };
  }
  const safeWeeks = Math.max(1, Math.min(16, Number(weeks) || 1));
  if (!startTime || !endTime || startTime >= endTime) {
    return { sessions: [], error: 'Giờ kết thúc phải lớn hơn giờ bắt đầu.' };
  }
  const cleanLocation = String(location || '').trim();
  if (!cleanLocation) {
    return { sessions: [], error: 'Vui lòng nhập địa điểm tập luyện.' };
  }

  const [y, m, d] = startDate.split('-').map(Number);
  const startUtc = new Date(Date.UTC(y, m - 1, d));
  if (
    startUtc.getUTCFullYear() !== y ||
    startUtc.getUTCMonth() !== m - 1 ||
    startUtc.getUTCDate() !== d
  ) {
    return { sessions: [], error: 'Ngày bắt đầu không tồn tại trên lịch.' };
  }

  const existingKeys = new Set(
    (existingSessions || []).map(
      (s) => `${s.classId}|${s.sessionDate}|${s.startTime}`,
    ),
  );

  const sessions = [];
  const totalDays = safeWeeks * 7;
  for (let offset = 0; offset < totalDays; offset++) {
    const dt = new Date(startUtc.getTime() + offset * 86400000);
    const dayOfWeek = dt.getUTCDay();
    if (!normalizedDays.includes(dayOfWeek)) continue;
    const iso = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
    const key = `${classId}|${iso}|${startTime}`;
    sessions.push({
      classId,
      sessionDate: iso,
      startTime,
      endTime,
      location: cleanLocation,
      status: 'SCHEDULED',
      duplicate: existingKeys.has(key),
    });
  }

  return { sessions, error: '' };
}
