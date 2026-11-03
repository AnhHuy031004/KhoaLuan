export default {
  id: 'attendance',
  title: 'Điểm danh',
  group: 'ĐÀO TẠO',
  icon: 'ClipboardCheck',
  permissions: {
    ADMIN: 'VCED',
    MASTER: 'VCE',
    INSTRUCTOR: 'VCE',
    STUDENT: 'V',
  },
  fields: [
    {
      key: 'studentId',
      label: 'Võ sinh',
      type: 'student',
      required: true,
    },
    {
      key: 'classId',
      label: 'Lớp học',
      type: 'class',
      required: true,
    },
    {
      key: 'sessionDate',
      label: 'Ngày tập',
      type: 'date',
      required: true,
    },
    {
      key: 'status',
      label: 'Trạng thái',
      type: 'select',
      required: true,
      options: [
        ['PRESENT', 'Có mặt'],
        ['LATE', 'Đi muộn'],
        ['ABSENT', 'Vắng mặt'],
        ['EXCUSED', 'Có phép'],
      ],
    },
    {
      key: 'note',
      label: 'Ghi chú',
      type: 'textarea',
      required: false,
    },
  ],
  columns: ['studentId', 'classId', 'sessionDate', 'status', 'note'],
  description: 'Ghi nhận sự chuyên cần trong từng buổi tập.',
  endpoint: '/attendance',
  component: 'AttendancePage',
};
