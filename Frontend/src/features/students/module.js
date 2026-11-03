export default {
  id: 'students',
  title: 'Hồ sơ võ sinh',
  group: 'ĐÀO TẠO',
  icon: 'Users',
  permissions: {
    ADMIN: 'VCED',
    MASTER: 'VCE',
    INSTRUCTOR: 'V',
    STUDENT: 'VE',
  },
  fields: [
    {
      key: 'fullName',
      label: 'Họ và tên',
      type: 'text',
      required: true,
    },
    {
      key: 'dob',
      label: 'Ngày sinh',
      type: 'date',
      required: true,
    },
    {
      key: 'gender',
      label: 'Giới tính',
      type: 'select',
      required: true,
      options: [
        ['MALE', 'Nam'],
        ['FEMALE', 'Nữ'],
      ],
    },
    {
      key: 'phone',
      label: 'Số điện thoại',
      type: 'text',
      required: true,
    },
    {
      key: 'email',
      label: 'Email',
      type: 'email',
      required: false,
    },
    {
      key: 'classId',
      label: 'Lớp học',
      type: 'class',
      required: true,
    },
    {
      key: 'rankId',
      label: 'Cấp đai',
      type: 'rank',
      required: true,
    },
    {
      key: 'status',
      label: 'Trạng thái',
      type: 'select',
      required: true,
      options: [
        ['ACTIVE', 'Đang hoạt động'],
        ['PAUSED', 'Tạm dừng'],
      ],
    },
  ],
  columns: ['fullName', 'studentCode', 'classId', 'rankId', 'phone', 'status'],
  description: 'Theo dõi hồ sơ, lớp học và hành trình rèn luyện.',
  endpoint: '/students',
  component: 'StudentsPage',
};
