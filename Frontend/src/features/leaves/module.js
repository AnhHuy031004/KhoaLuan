export default {
  id: 'leaves',
  title: 'Đơn xin nghỉ',
  group: 'ĐÀO TẠO',
  icon: 'CalendarOff',
  permissions: {
    ADMIN: 'VCEDA',
    MASTER: 'VA',
    INSTRUCTOR: 'VA',
    STUDENT: 'VC',
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
      label: 'Ngày xin nghỉ',
      type: 'date',
      required: true,
    },
    {
      key: 'reason',
      label: 'Lý do',
      type: 'textarea',
      required: true,
    },
  ],
  columns: ['studentId', 'classId', 'sessionDate', 'reason', 'status'],
  description: 'Tiếp nhận đơn và phê duyệt lịch nghỉ.',
  endpoint: '/leaves',
  workflow: true,
  component: 'LeavesPage',
};
