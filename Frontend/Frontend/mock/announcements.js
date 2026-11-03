import { day, period, names } from './shared.js';
import { ROLES } from '../src/utils/permissions.js';
export function createAnnouncements(ctx) {
  return [
    {
      id: 'news-1',
      title: 'Sẵn sàng cho kỳ thi thăng đai quý IV',
      body: 'Võ sinh ôn luyện đầy đủ quyền, kỹ thuật căn bản và võ đạo. Liên hệ huấn luyện viên để kiểm tra điều kiện dự thi.',
      audience: 'ALL',
      classId: '',
      status: 'PUBLISHED',
      createdBy: 'u-master',
      createdAt: day(-1),
    },
    {
      id: 'news-2',
      title: 'Lịch tập tuần này đã được cập nhật',
      body: 'Các lớp duy trì lịch tập thường lệ. Vui lòng mang đầy đủ võ phục và dụng cụ bảo hộ.',
      audience: 'ALL',
      classId: '',
      status: 'PUBLISHED',
      createdBy: 'u-coach',
      createdAt: day(),
    },
    {
      id: 'news-3',
      title: 'Chương trình rèn luyện cuối tuần',
      body: 'Tăng cường thể lực, phối hợp đồng đội và thực hành kỹ thuật tự vệ.',
      audience: 'CLASS',
      classId: 'c-1',
      status: 'DRAFT',
      createdBy: 'u-coach',
      createdAt: day(),
    },
  ];
}
