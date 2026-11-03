import React from 'react';
import { FileText } from 'lucide-react';
import Badge from '../../../components/common/Badge.jsx';
import { formatDate } from '../../../utils/format.js';
export default function AnnouncementList({ items, resolve, rowActions }) {
  return (
    <div className="announcement-grid">
      {items.map((row) => (
        <article className="announcement-card" key={row.id}>
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
            {rowActions(row)}
          </div>
        </article>
      ))}
    </div>
  );
}
