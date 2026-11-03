import React from 'react';
import { SearchX } from 'lucide-react';
export default function EmptyState({
  text = 'Không có dữ liệu phù hợp',
  description = 'Thử điều chỉnh bộ lọc hoặc tạo một bản ghi mới.',
}) {
  return (
    <div className="empty-state">
      <span>
        <SearchX size={28} />
      </span>
      <h3>{text}</h3>
      <p>{description}</p>
    </div>
  );
}
