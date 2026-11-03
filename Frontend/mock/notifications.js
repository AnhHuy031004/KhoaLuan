import { accounts } from './users.js';
export function createNotifications(context) {
  const {
    now
  } = context;
  return accounts.flatMap(a => [{
    id: `notification-${a.role}`,
    userId: a.id,
    templateCode: 'CLASS_ANNOUNCEMENT',
    payload: {
      title: 'Lịch tập mới đã được cập nhật',
      body: 'Kiểm tra lịch tập của bạn.'
    },
    channel: 'IN_APP',
    createdAt: now.toISOString(),
    readAt: null
  }]);
}
