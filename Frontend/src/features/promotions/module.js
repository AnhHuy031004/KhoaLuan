export default {
  id: 'promotions',
  title: 'Đề xuất thi lên đai',
  navTitle: 'Đề xuất thi lên đai',
  group: 'THI & THĂNG ĐAI',
  icon: 'TrendingUp',
  permissions: {
    ADMIN: 'VCEDA',
    MASTER: 'VCEA',
    INSTRUCTOR: 'VC',
    STUDENT: 'V',
  },
  fields: [
    {key:"classId",label:"Lớp đề xuất",type:"class",required:true},
    {
      key: 'studentId',
      label: 'Võ sinh',
      type: 'student',
      required: true,
    },
    {
      key: 'rankId',
      label: 'Cấp đai dự thi',
      type: 'rank',
      required: true,
    },
    {
      key: 'reason',
      label: 'Lý do đề xuất',
      type: 'textarea',
      required: true,
    },
  ],
  columns: ['classId', 'studentId', 'rankId', 'reason', 'status'],
  description: 'Lập và xét duyệt đề xuất võ sinh đủ điều kiện dự thi lên đai theo từng lớp.',
  endpoint: '/promotions',
  workflow: true,
  component: 'PromotionsPage',
};
