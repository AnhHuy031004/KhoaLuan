export default {
  id: 'instructors',
  title: 'Huấn luyện viên',
  group: 'ĐÀO TẠO',
  icon: 'UserRoundCheck',
  permissions: {
    ADMIN: 'VCED',
    MASTER: 'VCE',
    INSTRUCTOR: '',
    STUDENT: '',
  },
  fields: [
    {key:'clubId',label:'CLB quản lý hồ sơ',type:'club',required:true},
    {
      key: 'fullName',
      label: 'Họ và tên',
      type: 'text',
      required: true,
    },
    {
      key: 'email',
      label: 'Email',
      type: 'email',
      required: true,
    },
    {
      key: 'phone',
      label: 'Số điện thoại',
      type: 'text',
      required: true,
    },
    {
      key: 'qualification',
      label: 'Trình độ / cấp đai',
      type: 'text',
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
  columns: ['fullName', 'clubId', 'email', 'phone', 'qualification', 'assignedClassNames', 'status'],
  description: 'Đội ngũ đồng hành cùng các lớp võ.',
  endpoint: '/instructors',
  component: 'InstructorsPage',
};
