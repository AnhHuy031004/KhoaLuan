export default {
  id: 'belt-history',
  title: 'Lịch sử cấp đai',
  group: 'THI & THĂNG ĐAI',
  icon: 'History',
  permissions: {
    ADMIN: 'V',
    MASTER: 'V',
    INSTRUCTOR: 'V',
    STUDENT: 'V',
  },
  fields: [],
  columns: ['studentId', 'rankId', 'awardedAt', 'note'],
  description: 'Mỗi cấp đai là một dấu mốc trên hành trình rèn luyện.',
  endpoint: '/belt-history',
  component: 'BeltHistoryPage',
};
