import React from 'react';
import { FileText } from 'lucide-react';
import Badge from '../../../components/common/Badge.jsx';
import { formatDate } from '../../../utils/format.js';

export default function AnnouncementList({ items, resolve, rowActions, onSelect }) {
  return (
    <div className="announcement-grid">
      {items.map((row) => (
        <article
          className="announcement-card schedule-card-interactive"
          key={row.id}
          role="button"
          tabIndex={0}
          title="Bấm để xem chi tiết thông báo"
          onClick={() => onSelect?.(row)}
          onKeyDown={(e) => {
            if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              onSelect?.(row);
            }
          }}
        >
          <div className="article-top">
            <span className="article-icon">
              <FileText size={19} />
            </span>
            <Badge value={row.status} />
          </div>
          <h3>{row.title}</h3>
          <p>{row.body}</p>
          <div className="article-footer">
            <span>
              {formatDate(row.createdAt)} · {resolve('audience', row.audience)}
            </span>
            <div onClick={(e) => e.stopPropagation()}>{rowActions(row)}</div>
          </div>
        </article>
      ))}
    </div>
  );
}
